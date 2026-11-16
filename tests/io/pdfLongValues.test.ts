// A value taller than a page goes on over the next pages (audit 2026-11-16): the readable part drew
// each value in one piece, so a table of 30 or 100 people ran off the bottom of the page — only 8
// people were readable, although the data pages carried all and called themselves „identisch mit
// den Angaben vorn“. Fictitious data from the start point of the Monatsmeldung.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import { writeQuestionnairePdf, type PdfFonts } from '../../src/io/pdfWriter';
import { buildStartPoint, parseStartPoint, type StartPoint } from '../../src/logic/startPoints';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { keepForPdfa } from '../support/pdfaOut';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};
const PDFJS = pdfjs as unknown as PdfJsLike;
const CREATED = { local: '2026-11-30T10:00:00.000+01:00', utc: '2026-11-30T09:00:00.000Z' };
const form = registeredFrom(readJson(join(DRAFTS_DIR, 'lohnmeldung', '0.1.0.json')));
const START = join(__dirname, '..', '..', 'manual_tests', 'startpunkte');

/** The signed Monatsmeldung of the start point with `people` people, and `text` as Besonderheiten. */
async function pdfWith(people: number, text?: string, wageTypes?: string) {
  const parsed = parseStartPoint(
    readJson(join(START, 'monatsmeldung-november-unterschrieben.json')),
  );
  if (!parsed.ok || !('form' in parsed.point)) throw new Error('start point');
  const point = structuredClone(parsed.point) as StartPoint;
  const [part] = point.parts;
  if (!part) throw new Error('no part');
  const answers = part.answers as Record<string, unknown>;
  answers.mitarbeitende = Array.from({ length: people }, (_, i) => ({
    rowId: `r${i + 1}`,
    maName: `Beispiel, Person ${i + 1}`,
    maVerguetungsart: 'stundenlohn',
    maVerguetung: '14,50',
    maFehltage: ['2026-11-03:urlaub', '2026-11-17:krank'],
    maUrlaubStunden: '6',
    maKrankStunden: '8',
  }));
  answers.monatWerte = [];
  if (text !== undefined) answers.besonderheiten = text;
  if (wageTypes !== undefined) answers.lohnarten = wageTypes;
  let n = 0;
  const built = buildStartPoint(point, form, {
    questionnaireId: QUESTIONNAIRE_ID,
    nonce: () => String(++n).padStart(32, '0'),
    now: CREATED,
    systemNote: note(CREATED.local, CREATED.utc, ['keyboard']),
  });
  if (!built.ok) throw new Error(built.problems.join(' '));
  const written = await writeQuestionnairePdf(
    {
      questionnaire: built.session.questionnaire,
      form,
      origin: 'embedded',
      config: {},
      created: CREATED,
    },
    FONTS,
  );
  return written.bytes;
}

/** Every piece of text and its height on the page, page by page. */
async function pieces(bytes: Uint8Array): Promise<{ page: number; y: number; text: string }[]> {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const found: { page: number; y: number; text: string }[] = [];
  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();
    for (const item of content.items) {
      if ('str' in item && item.str.trim() !== '') {
        found.push({ page, y: item.transform[5] ?? 0, text: item.str });
      }
    }
  }
  return found;
}

/** The readable part: everything before the Prüfblatt. */
async function readable(bytes: Uint8Array): Promise<string> {
  const { lines } = await readPdfText(PDFJS, bytes);
  const end = lines.findIndex((line) => line.startsWith('Prüfblatt'));
  return lines.slice(0, end < 0 ? undefined : end).join('\n');
}

describe('a value taller than a page in the readable part', () => {
  it.each([30, 100])(
    'shows all %i people of the table',
    async (people) => {
      const bytes = await pdfWith(people);
      const text = await readable(bytes);
      for (let i = 1; i <= people; i++) expect(text).toContain(`Beispiel, Person ${i}`);
    },
    60_000,
  );

  it('draws nothing below the bottom margin but the footer', async () => {
    const bytes = await pdfWith(100);
    keepForPdfa('lange-werte.pdf', bytes);
    const low = (await pieces(bytes)).filter((p) => p.y < 56 && p.y !== 28);
    expect(low).toEqual([]);
  }, 60_000);

  it('goes on with a long text over the next page', async () => {
    const text = Array.from({ length: 120 }, (_, i) => `Zeile ${i + 1} der Besonderheiten`).join(
      '\n',
    );
    const bytes = await pdfWith(2, text);
    const shown = await readable(bytes);
    for (const line of ['Zeile 1 der', 'Zeile 60 der', 'Zeile 120 der']) {
      expect(shown).toContain(line);
    }
    const low = (await pieces(bytes)).filter((p) => p.y < 56 && p.y !== 28);
    expect(low).toEqual([]);
  }, 60_000);

  it('names the field again where it goes on', async () => {
    const text = await readable(await pdfWith(30));
    expect(text).toContain('(Fortsetzung)');
  }, 60_000);
});

// Audit 2026-11-16, round 3: where a value breaks. A value that fits on a page stays whole, a row of
// a table is never torn apart, and a heading never stands alone at the end of a page.
describe('where a value goes on over the next page', () => {
  /** The pages and their text lines, footer left out. */
  async function pages(bytes: Uint8Array): Promise<Map<number, string[]>> {
    const byPage = new Map<number, string[]>();
    for (const piece of await pieces(bytes)) {
      if (piece.y === 28) continue;
      byPage.set(piece.page, [...(byPage.get(piece.page) ?? []), piece.text]);
    }
    return byPage;
  }
  const pageOf = (byPage: Map<number, string[]>, start: string) =>
    [...byPage].find(([, texts]) => texts.some((text) => text.startsWith(start)))?.[0];

  it('keeps every row of a table on one page', async () => {
    // Between the first line of a row and the next row a page may only end right before the next
    // row: the footer is the last line of a page.
    const { lines } = await readPdfText(PDFJS, await pdfWith(30));
    // A row's first line may stand next to the label („Mitarbeitende 1. Familienname …“).
    const at = (i: number) =>
      lines.findIndex((line) => new RegExp(`(^|\\s)${i}\\. Familienname`).test(line));
    for (let i = 1; i < 30; i++) {
      const between = lines.slice(at(i), at(i + 1));
      expect(at(i), `row ${i}`).toBeGreaterThanOrEqual(0);
      expect(
        between.slice(0, -1).filter((line) => line.startsWith('Fragebogen-ID')),
        `row ${i}`,
      ).toEqual([]);
    }
  }, 60_000);

  it('moves a value that fits on a page as a whole instead of breaking it', async () => {
    // More wage types further up move the Besonderheiten line by line over the end of a page.
    for (let count = 1; count <= 24; count++) {
      const wageTypes = Array.from({ length: count }, (_, i) => `${1000 + i} Lohnart ${i + 1}`);
      const text = await readable(
        await pdfWith(3, 'Absatz A\nAbsatz B\nAbsatz C', wageTypes.join('\n')),
      );
      expect(text, `${count} wage types`).not.toContain('Besonderheiten (Fortsetzung)');
    }
  }, 120_000);

  it.each([410, 420, 1200])(
    'keeps a heading with the first line of a long paragraph (%i words)',
    async (words) => {
      const text = Array.from({ length: words }, (_, i) => `w${i + 1}`).join(' ');
      const byPage = await pages(await pdfWith(1, text));
      const alone = [...byPage].filter(([, texts]) => texts.length === 1);
      expect(alone).toEqual([]);
      expect(pageOf(byPage, 'w1 ')).toBeDefined();
    },
    60_000,
  );

  it('keeps the heading of the signature lines with the first of them', async () => {
    for (let count = 40; count <= 56; count++) {
      const text = Array.from({ length: count }, (_, i) => `Zeile ${i + 1}`).join('\n');
      const byPage = await pages(await pdfWith(2, text));
      expect(pageOf(byPage, 'Unterschriften und Abschlüsse'), `${count} lines`).toBe(
        pageOf(byPage, '[1] '),
      );
    }
  }, 120_000);
});
