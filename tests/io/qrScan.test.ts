// A full A4 page of QR codes as a flatbed scan (bug 2026-11-08, found automating MT-34: a scan of
// the page read 7 to 9 of 11 codes). The page is drawn like the QR page of src/io/pdfWriter.ts,
// rendered by pdf.js at 300 dpi into a JPEG (@napi-rs/canvas, pdf.js's canvas in Node), put into a
// PDF as a scanner does, and read back at QR_SEARCH_SIDE as the app reads a scan. The payloads come
// from fixed seeds whose pages jsQR alone could not read completely.
import { PDFDocument, rgb } from '@cantoo/pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { QR_SEARCH_SIDE } from '../../src/io/pdfReader';
import { A4, MARGIN, QR_MODULE, writeQuestionnairePdf } from '../../src/io/pdfWriter';
import { QR_GAP_MODULES, qrMatrix, readQrCodes, type RgbaImage } from '../../src/io/qr';
import { assembleQrPayloads, qrPayloads } from '../../src/logic/qrParts';
import { buildStartPoint, isFormStart, parseStartPoint } from '../../src/logic/startPoints';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

interface CanvasMaker {
  create(
    width: number,
    height: number,
  ): { canvas: { toBuffer(mime: 'image/jpeg'): Buffer }; context: CanvasRenderingContext2D };
}

/** Bytes from a fixed seed (xorshift32): the same page on every run. */
function seeded(seed: number, length: number): Uint8Array {
  let x = (seed * 2654435761) >>> 0 || 1;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    bytes[i] = x & 0xff;
  }
  return bytes;
}

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

async function qrPage(matrices: readonly boolean[][][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(A4);
  const size = Math.max(...matrices.map((m) => m.length)) * QR_MODULE;
  const gap = QR_GAP_MODULES * QR_MODULE;
  const columns = Math.max(1, Math.floor((A4[0] - 2 * MARGIN + gap) / (size + gap)));
  let top = A4[1] - 74 - gap;
  for (let index = 0; index < matrices.length; top -= size + gap) {
    for (let column = 0; column < columns && index < matrices.length; column++, index++) {
      const left = MARGIN + column * (size + gap);
      (matrices[index] ?? []).forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          if (!row[c]) continue;
          let end = c;
          while (row[end + 1]) end++;
          page.drawRectangle({
            x: left + c * QR_MODULE,
            y: top - (r + 1) * QR_MODULE,
            width: (end - c + 1) * QR_MODULE,
            height: QR_MODULE + 0.01,
            color: rgb(0, 0, 0),
          });
          c = end;
        }
      });
    }
  }
  return doc.save();
}

/** A page (the first by default) rendered so that its long side has `longestSide` pixels. */
async function render(bytes: Uint8Array, longestSide: number, pageNumber = 1) {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: longestSide / Math.max(base.width, base.height) });
    const width = Math.round(viewport.width);
    const height = Math.round(viewport.height);
    const { canvas, context } = (doc.canvasFactory as unknown as CanvasMaker).create(width, height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    const target = canvas as unknown as HTMLCanvasElement;
    await page.render({ canvas: target, canvasContext: context, viewport }).promise;
    const pixels = context.getImageData(0, 0, width, height);
    const image: RgbaImage = { data: pixels.data, width, height };
    return { image, jpeg: canvas.toBuffer('image/jpeg') };
  } finally {
    await doc.cleanup();
  }
}

/** The page as a 300-dpi scan: a JPEG filling an A4 page. */
async function scanned(page: Uint8Array): Promise<Uint8Array> {
  const { jpeg } = await render(page, (A4[1] / 72) * 300);
  const doc = await PDFDocument.create();
  doc.addPage(A4).drawImage(await doc.embedJpg(jpeg), { x: 0, y: 0, width: A4[0], height: A4[1] });
  return doc.save();
}

describe('a full-page scan of the QR page', () => {
  it.each([3, 4, 6])(
    'reads all 11 codes (seed %i)',
    async (seed) => {
      const payloads = qrPayloads(
        seeded(seed, 7400),
        hex(seeded(seed + 1000, 16)),
        hex(seeded(seed + 2000, 32)),
      );
      expect(payloads).toHaveLength(11);
      const { image } = await render(
        await scanned(await qrPage(payloads.map(qrMatrix))),
        QR_SEARCH_SIDE,
      );
      const found = readQrCodes(image).map(hex).sort();
      expect(found).toEqual(payloads.map(hex).sort());
    },
    120_000,
  );
});

// Audit 2026-11-14: the PDF the app writes, not a page drawn here — the complete Personalfragebogen
// has 77 codes, and its last, smaller code (162 bytes) shares a row with full-size ones. It was never
// read back; since the QR pages are drawn as one path per code, this also checks that drawing.
describe('the QR pages of the PDF the app writes', () => {
  const font = (name: string) =>
    new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
  const fonts = {
    sans: font('NotoSans-Regular.subset.ttf'),
    bold: font('NotoSans-SemiBold.subset.ttf'),
    mono: font('NotoSansMono-Regular.subset.ttf'),
  };

  it('give back every code, the short last one included', async () => {
    const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
    const start = join(
      __dirname,
      '../../manual_tests/startpunkte/personalfragebogen-vollstaendig.json',
    );
    const parsed = parseStartPoint(readJson(start));
    if (!parsed.ok || !isFormStart(parsed.point)) throw new Error('start point');
    let n = 0;
    const at = { local: '2026-11-03T10:00:00.000+01:00', utc: '2026-11-03T09:00:00.000Z' };
    const built = buildStartPoint(parsed.point, form, {
      questionnaireId: QUESTIONNAIRE_ID,
      nonce: () => String(++n).padStart(32, '0'),
      now: at,
      systemNote: note(at.local, at.utc, ['keyboard']),
    });
    if (!built.ok) throw new Error(built.problems.join('; '));
    const { bytes } = await writeQuestionnairePdf(
      {
        questionnaire: built.session.questionnaire,
        form,
        origin: 'published',
        config: {},
        created: at,
      },
      fonts,
    );
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const pages = doc.numPages;
    await doc.cleanup();
    // The QR pages come last; read them from the end until a page holds none.
    const codes: Uint8Array[] = [];
    for (let page = pages; page > 0; page--) {
      const { image } = await render(bytes, QR_SEARCH_SIDE, page);
      const found = readQrCodes(image);
      if (found.length === 0) break;
      codes.push(...found);
    }
    const assembled = assembleQrPayloads(codes);
    expect(assembled.ok ? 'ok' : assembled).toBe('ok');
  }, 180_000);
});
