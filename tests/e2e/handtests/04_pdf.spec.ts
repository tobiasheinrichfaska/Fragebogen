// Former manual tests of manual_tests/04_pdf.md, played in the test build (Tobias 2026-11-08: only
// what a virtual browser cannot check stays a manual test). What another program, a printer or a
// camera would make of the PDF is made here in Node: pdf-lib re-saves it or appends an update, and
// pdf.js renders its QR pages into "scans" and "photos".
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, PDFString } from '@cantoo/pdf-lib';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  answerUntil,
  expectQuiet,
  formFields,
  openTestApp,
  pdfPages,
  press,
  sign,
  toOverview,
} from '../app';

const COMPLETE = 'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.';
const VERIFIED = 'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.';
const FROM_PAPER =
  'Gelesen aus den QR-Codes eines Ausdrucks. Das Original bleibt die elektronische Datei.';
const QR_PAGE = 'Anlage: Daten als QR-Codes';

const KANZLEI_CONFIG = fileURLToPath(
  new URL('../../../config/kanzlei.local.json', import.meta.url),
);

/** The newest version of the Sofortmeldung in the test build: start points are built with it. */
const SOFORT_VERSION = (() => {
  const key = (v: string) =>
    v
      .split('.')
      .map((n) => n.padStart(6, '0'))
      .join('.');
  return ['forms', 'form-drafts']
    .map((folder) => fileURLToPath(new URL(`../../../${folder}/sofortmeldung/`, import.meta.url)))
    .filter((folder) => existsSync(folder))
    .flatMap((folder) => readdirSync(folder))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length))
    .sort((a, b) => (key(a) < key(b) ? -1 : 1))
    .at(-1);
})();

const roleRow = (app: Locator, label: string) =>
  app.locator('.roles li').filter({ has: app.page().getByText(label, { exact: true }) });

const stand = (app: Locator) =>
  app.locator('.card').filter({ has: app.page().locator('h2', { hasText: /^Stand$/ }) });

/** "Datei öffnen …" on the start page, through the file chooser. */
async function openFile(page: Page, app: Locator, path: string): Promise<void> {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    press(app, 'Datei öffnen'),
  ]);
  await chooser.setFiles(path);
}

/** "PDF erstellen" in the overview; saved under the name the app gives it, as a browser would. */
async function createPdf(
  page: Page,
  app: Locator,
  testInfo: TestInfo,
): Promise<{ path: string; name: string }> {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    press(stand(app), 'PDF erstellen'),
  ]);
  const name = file.suggestedFilename();
  const path = join(testInfo.outputDir, name);
  await file.saveAs(path);
  return { path, name };
}

/** A PDF opened with pdf.js in Node, closed again after `use`. */
async function withPdf<T>(
  path: string,
  use: (doc: pdfjs.PDFDocumentProxy) => Promise<T>,
): Promise<T> {
  const task = pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)) });
  try {
    return await use(await task.promise);
  } finally {
    await task.destroy();
  }
}

// --- What a scanner or a camera makes of the QR pages (pdf.js renders them in Node) -------------

interface Raster {
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  file(type: 'image/png' | 'image/jpeg'): Buffer;
}

interface NodeCanvas {
  toBuffer(mime: 'image/png' | 'image/jpeg'): Buffer;
}

interface CanvasMaker {
  create(width: number, height: number): { canvas: NodeCanvas; context: CanvasRenderingContext2D };
}

/** Pixels per PDF point: a 300 dpi scan, and a photo with about four pixels per QR module. */
const SCAN_DPI = 300 / 72;
const PHOTO = 3;
/** One QR module is 0.5 mm. */
const modulePx = (scale: number) => (0.5 / 25.4) * 72 * scale;

/** The pages "Anlage: Daten als QR-Codes", rendered as images. */
async function qrPageImages(
  path: string,
  scale: number,
): Promise<{ pages: Raster[]; maker: CanvasMaker }> {
  return withPdf(path, async (doc) => {
    // pdf.js renders through @napi-rs/canvas in Node; its factory makes the canvases.
    const maker = doc.canvasFactory as unknown as CanvasMaker;
    const pages: Raster[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      if (!(await pageText(page)).includes(QR_PAGE)) continue;
      const viewport = page.getViewport({ scale });
      const width = Math.round(viewport.width);
      const height = Math.round(viewport.height);
      const { canvas, context } = maker.create(width, height);
      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context,
        viewport,
      }).promise;
      pages.push({ width, height, context, file: (type) => canvas.toBuffer(type) });
    }
    return { pages, maker };
  });
}

async function pageText(page: pdfjs.PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
}

/** A horizontal strip of an image as an image of its own. */
function strip(maker: CanvasMaker, from: Raster, top: number, bottom: number): Raster {
  const height = bottom - top;
  const { canvas, context } = maker.create(from.width, height);
  context.putImageData(from.context.getImageData(0, top, from.width, height), 0, 0);
  return { width: from.width, height, context, file: (type) => canvas.toBuffer(type) };
}

/** The rows of QR codes on a rendered page, top to bottom, as [top, bottom] pixel rows. */
function codeRows(image: Raster, scale: number): [number, number][] {
  const { data } = image.context.getImageData(0, 0, image.width, image.height);
  const darkRow = (y: number) => {
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const luminance =
        0.299 * (data[i] ?? 255) + 0.587 * (data[i + 1] ?? 255) + 0.114 * (data[i + 2] ?? 255);
      if (luminance < 128) return true;
    }
    return false;
  };
  // Bands of dark rows; a code is far taller than a line of text.
  const rows: [number, number][] = [];
  let start = -1;
  for (let y = 0; y < image.height; y++) {
    if (darkRow(y)) {
      if (start < 0) start = y;
    } else if (start >= 0) {
      if (y - start > 20 * modulePx(scale)) rows.push([start, y]);
      start = -1;
    }
  }
  if (rows.length === 0) throw new Error('no row of QR codes found');
  return rows;
}

/** A little white around the codes, within the gap of twelve modules between them. */
const margin = (scale: number) => Math.round(4 * modulePx(scale));

/** Where to cut below the first row of codes. */
function belowFirstCodeRow(image: Raster, scale: number): number {
  const [first] = codeRows(image, scale);
  return (first?.[1] ?? 0) + margin(scale);
}

/** A scan cropped to the codes below `top` (a scanner's automatic cropping). */
function codesBelow(maker: CanvasMaker, image: Raster, scale: number, top: number): Raster {
  const rows = codeRows(image, scale).filter(([start]) => start >= top);
  const [first] = rows;
  const last = rows.at(-1);
  if (!first || !last) throw new Error('no codes below the cut');
  return strip(maker, image, Math.max(top, first[0] - margin(scale)), last[1] + margin(scale));
}

/** A "scanned" PDF: every image on a page of its own, as large as the scanned area. */
async function scanPdf(images: readonly Raster[], scale: number, path: string): Promise<string> {
  const doc = await PDFDocument.create();
  for (const image of images) {
    const width = image.width / scale;
    const height = image.height / scale;
    const page = doc.addPage([width, height]);
    // A scanner writes JPEG, without transparency.
    page.drawImage(await doc.embedJpg(image.file('image/jpeg')), { x: 0, y: 0, width, height });
  }
  writeFileSync(path, await doc.save());
  return path;
}

const savePng = (image: Raster, path: string) => {
  writeFileSync(path, image.file('image/png'));
  return path;
};

/** The numbers of "QR-Codes: x von y gelesen …" in the open banner. */
async function qrProgress(
  app: Locator,
): Promise<{ found: number; total: number; missing: string[] }> {
  const banner = app
    .locator('.banner-info')
    .filter({ hasText: /^QR-Codes: \d+ von \d+ gelesen\./ });
  await expect(banner).toContainText(
    'Bitte ein weiteres Foto oder einen Scan mit den fehlenden Codes öffnen.',
  );
  const [, found, total] =
    /QR-Codes: (\d+) von (\d+)/.exec((await banner.textContent()) ?? '') ?? [];
  return {
    found: Number(found),
    total: Number(total),
    missing: await banner.locator('li').allTextContents(),
  };
}

// --- Tests ----------------------------------------------------------------------------------------

test('MT-30: the complete PDF — file name, first page, footer on every page, order of the parts', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path, name } = await createPdf(page, app, testInfo);
  expect(name).toMatch(/^Sofortmeldung_[0-9a-f]{8}_vollstaendig\.pdf$/);
  const banner = app.locator('.banner-success').filter({ hasText: 'PDF „' });
  await expect(banner).toContainText(`PDF „${name}“ erstellt: vollständig.`);
  await expect(banner).toContainText(
    /\d+ Seiten, davon die letzten mit \d+ QR-Codes für den Papierweg\./,
  );

  const pages = await pdfPages(path);
  await expect(banner).toContainText(`${pages.length} Seiten`);
  expect(pages[0]).toContain(COMPLETE);
  pages.forEach((text, i) => {
    expect(text).toMatch(
      new RegExp(
        `Fragebogen-ID [0-9a-f]{8} · Daten [0-9a-f]{8} · Formular sofortmeldung ${(SOFORT_VERSION ?? '').replace(/\./g, '\\.')}( · Stand [^·]+)? · Seite ${i + 1} von ${pages.length}`,
      ),
    );
  });
  const all = pages.join('\n');
  const order = [
    'bestätigt von: Beschäftigte Person',
    'Unterschriften und Abschlüsse',
    'Systemvermerk:',
    'SHA-256 ',
    'Prüfblatt',
    'Anlage: Daten in maschinenlesbarer Form',
    QR_PAGE,
  ].map((marker) => [marker, all.indexOf(marker)] as const);
  for (const [marker, at] of order) expect(at, marker).toBeGreaterThan(-1);
  expect(order.map(([, at]) => at)).toEqual([...order.map(([, at]) => at)].sort((a, b) => a - b));
  await expectQuiet(page, found);
});

test('MT-30: a drawn signature is set as lines, not as an image', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-zum-unterschreiben');
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Ich versichere, dass meine Angaben richtig und vollständig sind.');
  await sign(page);
  await press(app, 'Unterschreiben und abschließen');
  await toOverview(app);
  const { path } = await createPdf(page, app, testInfo);

  const images = new Set<number>([
    pdfjs.OPS.paintImageXObject,
    pdfjs.OPS.paintInlineImageXObject,
    pdfjs.OPS.paintImageMaskXObject,
  ]);
  const signaturePaths = await withPdf(path, async (doc) => {
    let paths: unknown[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pdfPage = await doc.getPage(n);
      const ops = await pdfPage.getOperatorList();
      expect(
        ops.fnArray.filter((fn) => images.has(fn)),
        `images on page ${n}`,
      ).toEqual([]);
      const text = await pageText(pdfPage);
      if (!text.includes('Unterschriften und Abschlüsse')) continue;
      expect(text).not.toContain('Getippter Name');
      paths = ops.fnArray.flatMap((fn, i) =>
        fn === pdfjs.OPS.constructPath ? [ops.argsArray[i]] : [],
      );
    }
    return paths;
  });
  // pdf.js 6: constructPath carries [paint operator, [path data], bounding box]; three numbers a
  // point. The drawn signature is the one long path — dozens of points, a rule has two.
  const longest = Math.max(
    0,
    ...signaturePaths.map(
      (args) => ((args as unknown[])[1] as ArrayLike<number>[] | undefined)?.[0]?.length ?? 0,
    ),
  );
  expect(longest).toBeGreaterThan(60);
  await expectQuiet(page, found);
});

test('MT-31: a PDF to pass on names what is still open; a part begun blocks it', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-abgeschlossen');
  const { path, name } = await createPdf(page, app, testInfo);
  expect(name).toMatch(/^Sofortmeldung_[0-9a-f]{8}_Weitergabe\.pdf$/);
  const [first] = await pdfPages(path);
  expect(first).toMatch(
    /Zur Weitergabe an die nächste Station\. Noch offen: .*Beschäftigte Person/,
  );

  // A part not begun lets the PDF go; one begun and left open does not.
  await press(roleRow(app, 'Beschäftigte Person'), 'Ich bin: Beschäftigte Person');
  await answerUntil(
    app,
    formFields('sofortmeldung', true),
    { familienname: 'Musterfrau' },
    'vorname',
  );
  await press(app, 'Unterbrechen – zur Übersicht');
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('begonnen, nicht abgeschlossen');
  await expect(stand(app).getByRole('button', { name: 'PDF erstellen' })).toBeDisabled();
  await expectQuiet(page, found);
});

test("MT-32: the app's own PDF opens again, verified, with the same states", async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, path);
  const opened = app.locator('.banner-success').filter({ hasText: VERIFIED });
  await expect(opened).toContainText('Geprüft wurden die Datenseiten, nicht der sichtbare Text.');
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');
  await expect(roleRow(app, 'Arbeitgeber')).toContainText('abgeschlossen');
  await expect(stand(app).locator('.banner-success')).toContainText(COMPLETE);
  await expectQuiet(page, found);
});

test('MT-32: a PDF passed on opens for the next role', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-abgeschlossen');
  const { path } = await createPdf(page, app, testInfo);
  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, path);
  await expect(app.locator('.banner-success')).toContainText(VERIFIED);
  await expect(roleRow(app, 'Arbeitgeber')).toContainText('abgeschlossen');
  await press(roleRow(app, 'Beschäftigte Person'), 'Ich bin: Beschäftigte Person');
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toHaveCount(0);
  await expectQuiet(page, found);
});

/** A comment added by another program: saved anew as a whole, or appended as an update. */
async function commented(path: string, incremental: boolean): Promise<Uint8Array> {
  const bytes = new Uint8Array(readFileSync(path));
  const doc = await PDFDocument.load(
    bytes,
    incremental ? { forIncrementalUpdate: true, updateMetadata: false } : {},
  );
  const snapshot = incremental ? doc.takeSnapshot() : undefined;
  const page = doc.getPage(0);
  snapshot?.markRefForSave(page.ref);
  const note = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Text',
    Rect: [60, 760, 80, 780],
    Contents: PDFString.of('Bitte pruefen'),
    F: 4,
  });
  page.node.addAnnot(doc.context.register(note));
  if (!snapshot) return doc.save();
  const update = await doc.saveIncremental(snapshot);
  return new Uint8Array([...bytes, ...update]);
}

test('MT-33: a PDF saved anew or extended by another program still verifies, with a note', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  const resaved = testInfo.outputPath('neu-gespeichert.pdf');
  writeFileSync(resaved, await commented(path, false));
  const appended = testInfo.outputPath('ergaenzt.pdf');
  writeFileSync(appended, await commented(path, true));
  // The comment really is in both files.
  for (const file of [resaved, appended]) {
    const notes = await withPdf(file, async (doc) => (await doc.getPage(1)).getAnnotations());
    expect(notes.map((note: { subtype?: string }) => note.subtype)).toContain('Text');
  }

  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, resaved);
  const banner = app.locator('.banner').filter({ hasText: VERIFIED });
  await expect(banner).toContainText(
    'Die PDF wurde mit einem anderen Programm neu gespeichert. Geprüft werden trotzdem die Datenseiten.',
  );
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');

  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, appended);
  await expect(banner).toContainText(
    'Die PDF wurde nach dem Erstellen verändert oder ergänzt (zum Beispiel kommentiert oder signiert). Geprüft werden trotzdem die Datenseiten.',
  );
  await expect(banner).not.toContainText('mit einem anderen Programm neu gespeichert');
  await expectQuiet(page, found);
});

// Bug found when automating MT-33 (2026-11-08): the clue stood in a green banner, the tone came
// from the verify findings only; clues of later editing are warnings now (fromPackageText).
test('MT-33: a re-saved PDF is shown in the warning colour, not in green', async ({
  page,
}, testInfo) => {
  const { app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  const resaved = testInfo.outputPath('neu-gespeichert.pdf');
  writeFileSync(resaved, await commented(path, false));
  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, resaved);
  await expect(app.locator('.banner-warning').filter({ hasText: VERIFIED })).toContainText(
    'mit einem anderen Programm neu gespeichert',
  );
});

test('MT-34: a scan without data pages is refused; scans of the codes are collected until complete', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  const { pages, maker } = await qrPageImages(path, SCAN_DPI);
  const [firstPage, ...furtherPages] = pages;
  if (!firstPage) throw new Error('no QR page');
  const cut = belowFirstCodeRow(firstPage, SCAN_DPI);
  // Two scans: the top row of codes only (the sheet cut off below it), then all the others.
  const topRow = await scanPdf(
    [strip(maker, firstPage, 0, cut)],
    SCAN_DPI,
    testInfo.outputPath('scan-obere-reihe.pdf'),
  );
  const others = await scanPdf(
    [
      codesBelow(maker, firstPage, SCAN_DPI, cut),
      ...furtherPages.map((more) => codesBelow(maker, more, SCAN_DPI, 0)),
    ],
    SCAN_DPI,
    testInfo.outputPath('scan-uebrige.pdf'),
  );
  const noData = testInfo.outputPath('ohne-daten.pdf');
  const blank = await PDFDocument.create();
  blank.addPage().drawText('Personalfragebogen (Ausdruck, eingescannt)');
  writeFileSync(noData, await blank.save());

  await press(stand(app), 'Fragebogen schließen');
  // Neither data pages nor codes: refused with what to do instead.
  await openFile(page, app, noData);
  await expect(app.getByRole('alert')).toContainText(
    'Diese PDF enthält keine lesbaren Datenseiten. Bitte die Originaldatei verwenden, keinen Ausdruck oder Scan – oder die QR-Codes einlesen.',
  );

  await openFile(page, app, topRow);
  const progress = await qrProgress(app);
  expect(progress.found).toBeGreaterThan(0);
  expect(progress.found).toBeLessThan(progress.total);
  expect(progress.missing).toHaveLength(progress.total - progress.found);
  for (const line of progress.missing) {
    expect(line).toMatch(new RegExp(`^Teil \\d+ von ${progress.total}$`));
  }

  await openFile(page, app, others);
  await expect(app.locator('.banner').filter({ hasText: VERIFIED })).toContainText(FROM_PAPER);
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');
  await expect(stand(app).locator('.banner-success')).toContainText(COMPLETE);
  await expectQuiet(page, found);
});

// Bug found when automating MT-34 (2026-11-08): a whole A4 page of codes, scanned at 300 dpi (also
// at 216 and 600 dpi, and the vector QR page itself), gave 7 to 9 of the 11 codes; the app rendered
// pages at 2400 px (about 4 px per module) and reads them at QR_SEARCH_SIDE now.
test('MT-34: a full-page scan of the QR page at 300 dpi reads every code', async ({
  page,
}, testInfo) => {
  test.slow();
  const { app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  const { pages } = await qrPageImages(path, SCAN_DPI);
  const scan = await scanPdf(pages, SCAN_DPI, testInfo.outputPath('scan.pdf'));
  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, scan);
  await expect(app.locator('.banner').filter({ hasText: VERIFIED })).toContainText(FROM_PAPER);
});

test('MT-35: photos of the codes are collected until all are read', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  const { pages, maker } = await qrPageImages(path, PHOTO);
  const [firstPage, ...furtherPages] = pages;
  if (!firstPage) throw new Error('no QR page');
  const cut = belowFirstCodeRow(firstPage, PHOTO);
  // First the top row only, then the rest: the remainder of that page and any further QR page.
  const photos = [
    strip(maker, firstPage, 0, cut),
    strip(maker, firstPage, cut, firstPage.height),
    ...furtherPages,
  ].map((image, i) => savePng(image, testInfo.outputPath(`foto-${i + 1}.png`)));

  await press(stand(app), 'Fragebogen schließen');
  const [topRow, ...rest] = photos;
  if (!topRow) throw new Error('no photo');
  await openFile(page, app, topRow);
  const first = await qrProgress(app);
  expect(first.found).toBeGreaterThan(0);
  expect(first.found).toBeLessThan(first.total);
  expect(first.missing).toHaveLength(first.total - first.found);
  for (const photo of rest) await openFile(page, app, photo);
  await expect(app.locator('.banner').filter({ hasText: VERIFIED })).toContainText(FROM_PAPER);
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');
  await expectQuiet(page, found);
});

const appAddress = existsSync(KANZLEI_CONFIG)
  ? (JSON.parse(readFileSync(KANZLEI_CONFIG, 'utf8')) as { appAddress?: unknown }).appAddress
  : undefined;

test('MT-36: the PDF names the app address and links to it (Kanzlei configuration only)', async ({
  page,
}, testInfo) => {
  test.skip(typeof appAddress !== 'string', 'needs an app address in config/kanzlei.local.json');
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const { path } = await createPdf(page, app, testInfo);
  // The address is the Kanzlei's: compared, never printed.
  const pages = await pdfPages(path);
  expect(
    pages.some((text) => text.includes(`App: ${String(appAddress)}`)),
    'the line "App: …"',
  ).toBe(true);
  const linked = await withPdf(path, async (doc) => {
    for (let n = 1; n <= doc.numPages; n++) {
      const notes = (await (await doc.getPage(n)).getAnnotations()) as {
        subtype?: string;
        url?: string;
      }[];
      if (notes.some((note) => note.subtype === 'Link' && note.url === appAddress)) return true;
    }
    return false;
  });
  expect(linked, 'a link to the app address').toBe(true);
  await expectQuiet(page, found);
});

declare global {
  interface Window {
    __sharedFiles?: string[];
  }
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('MT-37: the PDF is shared, a cancelled share sheet does nothing, "Speichern" downloads', async ({
    page,
  }) => {
    test.slow();
    // Touch as the main input and a share sheet whose first use is cancelled.
    await page.addInitScript(() => {
      const coarse = window.matchMedia.bind(window);
      window.matchMedia = (query: string) =>
        query === '(pointer: coarse)'
          ? ({ ...coarse(query), matches: true, media: query } as MediaQueryList)
          : coarse(query);
      window.__sharedFiles = [];
      let calls = 0;
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: (data?: ShareData) => (data?.files?.length ?? 0) > 0,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data?: ShareData) => {
          calls += 1;
          if (calls === 1) throw new DOMException('Teilen abgebrochen', 'AbortError');
          for (const file of data?.files ?? []) window.__sharedFiles?.push(file.name);
        },
      });
    });
    const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
    let downloads = 0;
    page.on('download', () => (downloads += 1));

    await press(stand(app), 'PDF erstellen');
    const banner = app.locator('.banner-success').filter({ hasText: 'PDF „' });
    await expect(banner).toBeInViewport();
    await expect(banner.getByRole('button', { name: 'Speichern' })).toBeVisible();
    expect(downloads).toBe(0);

    await banner.getByRole('button', { name: 'Teilen' }).click();
    await expect(banner.getByRole('button', { name: 'Teilen' })).toBeVisible();
    await expect(banner).not.toContainText('Teilen hat nicht geklappt');
    await expect(app.getByRole('alert')).toHaveCount(0);
    expect(downloads).toBe(0);

    await banner.getByRole('button', { name: 'Teilen' }).click();
    await expect.poll(() => page.evaluate(() => window.__sharedFiles ?? [])).toHaveLength(1);
    const [shared] = await page.evaluate(() => window.__sharedFiles ?? []);
    expect(shared).toMatch(/^Sofortmeldung_[0-9a-f]{8}_vollstaendig\.pdf$/);
    expect(downloads).toBe(0);

    const [file] = await Promise.all([
      page.waitForEvent('download'),
      banner.getByRole('button', { name: 'Speichern' }).click(),
    ]);
    expect(file.suggestedFilename()).toBe(shared);
    await expectQuiet(page, found);
  });
});

test('MT-132: a PDF with a password: the app asks for it, any spelling opens it', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-abgeschlossen');
  await stand(app).getByLabel('Mit Kennwort schützen (PDF und Link)').check();
  const field = stand(app).getByLabel('Kennwort', { exact: true });
  const PATTERN = /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/;
  await expect(field).toHaveValue(PATTERN);
  await expect(stand(app).getByRole('button', { name: 'Kopieren' }).first()).toBeVisible();
  await expect(stand(app)).toContainText(
    'ein PDF-Programm will es genau so, klein und mit Bindestrichen',
  );
  const proposed = await field.inputValue();
  await press(stand(app), 'Neues Kennwort');
  await expect(field).not.toHaveValue(proposed);
  await expect(field).toHaveValue(PATTERN);
  const password = await field.inputValue();

  const { path, name } = await createPdf(page, app, testInfo);
  expect(name).toMatch(/^Sofortmeldung_[0-9a-f]{8}_Weitergabe\.pdf$/);
  const banner = app.locator('.banner-success').filter({ hasText: 'PDF „' });
  await expect(banner).toContainText(`PDF „${name}“ erstellt, mit Kennwort geschützt – `);
  await expect(banner).toContainText(
    'Mit Kennwort ist die PDF keine PDF/A. Zur Ablage erstellt die Kanzlei nach dem Einlesen eine PDF ohne Kennwort.',
  );
  const raw = readFileSync(path).toString('latin1');
  expect(raw).toContain('/Encrypt');
  expect(raw).not.toMatch(/pdfaid/);
  // A PDF reader (pdf.js, the viewer of Firefox) needs the password exactly as shown.
  await expect(pdfPages(path)).rejects.toMatchObject({ name: 'PasswordException' });
  const [first] = await pdfPages(path, password);
  expect(first).toContain('Beispiel Bau GmbH');

  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, path);
  const dialog = page.getByRole('dialog', { name: 'Geschützte PDF' });
  await expect(dialog).toContainText(`„${name}“ ist mit einem Kennwort geschützt.`);
  await dialog.getByLabel('Kennwort').fill('falsch-falsch');
  await press(dialog, 'Öffnen');
  await expect(dialog.getByRole('alert')).toHaveText(
    'Das Kennwort passt nicht zu dieser PDF. Bitte prüfen Sie es und geben Sie es noch einmal ein.',
  );
  await dialog.getByLabel('Kennwort').fill(password.replace(/-/g, '').toUpperCase());
  await press(dialog, 'Öffnen');
  const opened = app.locator('.banner-success').filter({ hasText: VERIFIED });
  await expect(opened).toContainText('Die PDF war mit einem Kennwort geschützt.');
  await expect(opened).not.toContainText('mit einem anderen Programm neu gespeichert');

  await press(stand(app), 'Fragebogen schließen');
  await openFile(page, app, path);
  await press(dialog, 'Abbrechen');
  await expect(app.getByRole('alert')).toContainText(
    `„${name}“ ist mit einem Kennwort geschützt. Ohne das Kennwort lässt sich die PDF nicht öffnen.`,
  );

  await press(app, 'Eingänge zusammenführen');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    press(app, 'Dateien hinzufügen'),
  ]);
  await chooser.setFiles(path);
  await dialog.getByLabel('Kennwort').fill(password);
  await press(dialog, 'Öffnen');
  await expect(app).toContainText('Die PDF war mit einem Kennwort geschützt.');
  await expect(app).toContainText('1 Datei(en)');
  await expectQuiet(page, found);
});

test('MT-132: the Kanzlei files a protected PDF as PDF/A without a password', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  await stand(app).getByLabel('Mit Kennwort schützen (PDF und Link)').check();
  const password = await stand(app).getByLabel('Kennwort', { exact: true }).inputValue();
  const { path } = await createPdf(page, app, testInfo);
  expect(readFileSync(path).toString('latin1')).toContain('/Encrypt');

  await press(stand(app), 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    press(app, 'Dateien hinzufügen'),
  ]);
  await chooser.setFiles(path);
  await page.getByRole('dialog', { name: 'Geschützte PDF' }).getByLabel('Kennwort').fill(password);
  await press(page.getByRole('dialog', { name: 'Geschützte PDF' }), 'Öffnen');
  await expect(app).toContainText('Vollständig und ohne Widersprüche.');
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    press(app, 'PDF für die Personalakte'),
  ]);
  const filed = testInfo.outputPath(`personalakte-${file.suggestedFilename()}`);
  await file.saveAs(filed);
  const raw = readFileSync(filed).toString('latin1');
  expect(raw).toMatch(/pdfaid/);
  expect(raw).not.toContain('/Encrypt');
  await expectQuiet(page, found);
});
