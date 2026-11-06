// Writing and reading the questionnaire PDF in Node: data pages round-trip bit-exactly, the PDF
// carries no script, attachment or launch action, PDF/A markers are present, every data line fits
// the page, re-saving and appended updates are survived and detected. Fictitious data.
import { readFileSync } from 'node:fs';
import { PDFDocument } from '@cantoo/pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  editClues,
  groupLines,
  passwordIssue,
  readPdfText,
  type PdfJsLike,
} from '../../src/io/pdfReader';
import { printable, writeQuestionnairePdf, type PdfFonts } from '../../src/io/pdfWriter';
import { decodePackage } from '../../src/logic/dataPackage';
import { decodeDataLines } from '../../src/logic/dataPages';
import { registryOf } from '../../src/logic/formRegistry';
import { canonicalize } from '../../src/logic/jcs';
import { pdfPasswordCandidates } from '../../src/logic/passwords';
import type { Session } from '../../src/logic/session';
import {
  completeSofortmeldung,
  employerOnly,
  sofortmeldung,
} from '../support/sofortmeldungSession';

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};
const PDFJS = pdfjs as unknown as PdfJsLike;
const CREATED = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };
const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

async function write(session: Session, appAddress?: string) {
  return writeQuestionnairePdf(
    {
      questionnaire: session.questionnaire,
      form: session.form,
      origin: 'published',
      config: appAddress === undefined ? {} : { appAddress, kanzleiName: 'Musterkanzlei' },
      created: CREATED,
    },
    FONTS,
  );
}

async function readBack(bytes: Uint8Array) {
  const text = await readPdfText(PDFJS, bytes);
  const lines = decodeDataLines(text.lines);
  if (!lines.ok) throw new Error(`${lines.issue} ${lines.detail.join(', ')}`);
  return { text, decoded: decodePackage(JSON.parse(lines.text), registryOf([sofortmeldung])) };
}

describe('questionnaire PDF', () => {
  const session = completeSofortmeldung();
  let written: Awaited<ReturnType<typeof write>>;
  beforeAll(async () => {
    written = await write(session, 'https://fragebogen.example.org/');
  }, 60_000);

  it('round-trips the questionnaire and its form through the data pages', async () => {
    const { decoded } = await readBack(written.bytes);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(canonicalize(decoded.questionnaire)).toBe(canonicalize(session.questionnaire));
    expect(decoded.origin).toBe('published');
  }, 60_000);

  it('is marked complete and named after the rules', () => {
    expect(written.complete).toBe(true);
    expect(written.fileName).toBe('Sofortmeldung_3f2b8c1e_vollstaendig.pdf');
    expect(written.qrCodes).toBeGreaterThanOrEqual(1);
  });

  it('shows answers, signature lines, page numbers and the app address as text', async () => {
    const { text } = await readBack(written.bytes);
    const all = text.lines.join('\n');
    for (const expected of [
      'Beispiel Bau GmbH',
      'Müller-Lüdenscheidt',
      '65 170590 M 520',
      '02.11.2026',
      '[1] Beschäftigte Person – Fassung 1 – unterschrieben am 30.10.2026, 09:00 Uhr laut Gerät',
      '[2] Arbeitgeber – Fassung 1 – abgeschlossen am 30.10.2026, 08:30 Uhr laut Gerät',
      'Prüfblatt',
      'App: https://fragebogen.example.org/',
      `Seite 1 von ${written.pages}`,
      `Seite ${written.pages} von ${written.pages}`,
      'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.',
    ]) {
      expect(all).toContain(expected);
    }
  }, 60_000);

  it('carries PDF/A markers and a link, but no script, attachment or launch action', () => {
    const raw = latin1(written.bytes);
    expect(raw).toMatch(/pdfaid:part[^0-9]*2/);
    expect(raw).toMatch(/pdfaid:conformance[^A-Z]*U/);
    expect(raw).toContain('/URI');
    for (const forbidden of ['/JavaScript', '/JS ', '/EmbeddedFile', '/Launch', '/Encrypt']) {
      expect(raw).not.toContain(forbidden);
    }
  });

  it('keeps every data line inside the page (pdf.js drops clipped glyphs)', async () => {
    const task = pdfjs.getDocument({ data: written.bytes.slice(), verbosity: 0 });
    const pdf = await task.promise;
    let checked = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const width = page.getViewport({ scale: 1 }).width;
      for (const item of (await page.getTextContent()).items) {
        if (
          !('str' in item) ||
          !/^(\d{4} [A-Za-z0-9_-]+ [0-9a-f]{4}|FRAGEBOGEN-DATEN|SHA256 )/.test(item.str)
        )
          continue;
        expect((item.transform[4] as number) + item.width).toBeLessThanOrEqual(width - 30);
        checked++;
      }
    }
    await task.destroy();
    expect(checked).toBeGreaterThan(2);
  }, 60_000);

  // Three PDF reads and two saves: under a full parallel run this passed 5 s once (2026-11-01).
  it('survives re-saving with another program, and says it was re-saved', async () => {
    const doc = await PDFDocument.load(written.bytes);
    for (const useObjectStreams of [true, false]) {
      const resaved = await doc.save({ useObjectStreams });
      const { text, decoded } = await readBack(resaved);
      expect(decoded.ok).toBe(true);
      expect(editClues(resaved, text.producer)).toContain('foreignProducer');
    }
    const { text } = await readBack(written.bytes);
    expect(editClues(written.bytes, text.producer)).toEqual([]);
  }, 60_000);

  it('detects an update appended after the app wrote the file', () => {
    const appended = new Uint8Array([
      ...written.bytes,
      ...new TextEncoder().encode('\n1 0 obj\n<<>>\nendobj\n%%EOF\n'),
    ]);
    expect(editClues(appended, 'Fragebogen 0.1.0')).toEqual(['appendedUpdate']);
  });

  it('refuses a PDF without data pages with the "not found" issue', async () => {
    const doc = await PDFDocument.create();
    doc.addPage().drawText('Personalfragebogen (Ausdruck, eingescannt)');
    const text = await readPdfText(PDFJS, await doc.save());
    expect(decodeDataLines(text.lines)).toMatchObject({ ok: false, issue: 'notFound' });
  }, 60_000);
});

describe('questionnaire PDF — handover', () => {
  it('is marked for handover while a role is missing, and names what is missing', async () => {
    const written = await write(employerOnly());
    expect(written.complete).toBe(false);
    expect(written.fileName).toBe('Sofortmeldung_3f2b8c1e_Weitergabe.pdf');
    const { text, decoded } = await readBack(written.bytes);
    expect(decoded.ok).toBe(true);
    expect(text.lines.join('\n')).toContain('Zur Weitergabe an die nächste Station.');
  }, 60_000);
});

describe('questionnaire PDF with a password (Tobias 2026-11-06)', () => {
  const PASSWORD = 'k7qm-2xrp-9fha';
  const session = employerOnly();
  let written: Awaited<ReturnType<typeof write>>;
  beforeAll(async () => {
    written = await writeQuestionnairePdf(
      {
        questionnaire: session.questionnaire,
        form: session.form,
        origin: 'published',
        config: {},
        created: CREATED,
        password: PASSWORD,
      },
      FONTS,
    );
  }, 60_000);

  it('is encrypted with AES-256 and claims no PDF/A, which forbids encryption', () => {
    expect(written.protected).toBe(true);
    const raw = latin1(written.bytes);
    expect(raw).toContain('/Encrypt');
    expect(raw).toMatch(/\/V 5/);
    expect(raw).toMatch(/\/R 6/);
    expect(raw).toContain('/AESV3');
    expect(raw).not.toMatch(/pdfaid/);
    // The streams (pages, data pages) are encrypted, the strings stay plain and say so: title,
    // Fragebogen-ID and producer read back right instead of as garbage.
    expect(raw).toMatch(/\/StmF \/StdCF/);
    expect(raw).toMatch(/\/StrF \/Identity/);
    for (const forbidden of ['/JavaScript', '/JS ', '/EmbeddedFile', '/Launch']) {
      expect(raw).not.toContain(forbidden);
    }
  });

  it('opens only with the password, then gives the questionnaire back', async () => {
    await expect(readPdfText(PDFJS, written.bytes)).rejects.toSatisfy(
      (error) => passwordIssue(error) === 'needed',
    );
    await expect(readPdfText(PDFJS, written.bytes, 'k7qm-2xrp-9fhb')).rejects.toSatisfy(
      (error) => passwordIssue(error) === 'wrong',
    );
    const text = await readPdfText(PDFJS, written.bytes, PASSWORD);
    const lines = decodeDataLines(text.lines);
    if (!lines.ok) throw new Error(lines.issue);
    const decoded = decodePackage(JSON.parse(lines.text), registryOf([sofortmeldung]));
    if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
    expect(canonicalize(decoded.questionnaire)).toBe(canonicalize(session.questionnaire));
    expect(text.producer).toMatch(/^Fragebogen \d+\.\d+\.\d+/);
    expect(editClues(written.bytes, text.producer)).toEqual([]);
  }, 60_000);

  it('opens with the password typed in capitals and without hyphens, as the app tries it', async () => {
    const tried = pdfPasswordCandidates('K7QM2XRP9FHA');
    expect(tried).toContain(PASSWORD);
    const opened = await Promise.allSettled(tried.map((p) => readPdfText(PDFJS, written.bytes, p)));
    expect(opened.map((o) => o.status)).toEqual(
      tried.map((p) => (p === PASSWORD ? 'fulfilled' : 'rejected')),
    );
  }, 60_000);

  it('opens with pdf-lib too, as another PDF program would', async () => {
    const reloaded = await PDFDocument.load(written.bytes, { password: PASSWORD });
    expect(reloaded.getPageCount()).toBe(written.pages);
  }, 60_000);

  it('names no password matter for other errors', () => {
    expect(passwordIssue(new Error('kaputt'))).toBeUndefined();
    expect(passwordIssue(undefined)).toBeUndefined();
    expect(passwordIssue({ name: 'PasswordException', code: 1 })).toBe('needed');
    expect(passwordIssue({ name: 'PasswordException', code: 2 })).toBe('wrong');
  });
});

describe('printable', () => {
  it('keeps German text and line breaks, replaces glyphs the fonts lack', () => {
    expect(printable('Müller „Bau“ – 1.234,56 €\nzweite Zeile')).toBe(
      'Müller „Bau“ – 1.234,56 €\nzweite Zeile',
    );
    expect(printable('Иван')).toBe(String.fromCodePoint(0xfffd).repeat(4));
  });
});

describe('groupLines', () => {
  it('orders pieces top to bottom, left to right, and joins them with spaces', () => {
    const item = (str: string, x: number, y: number, width = str.length * 4) => ({
      str,
      transform: [1, 0, 0, 1, x, y],
      width,
    });
    expect(
      groupLines([item('Welt', 60, 700), item('Hallo', 10, 700), item('Zweite', 10, 680)]),
    ).toEqual(['Hallo Welt', 'Zweite']);
  });
});
