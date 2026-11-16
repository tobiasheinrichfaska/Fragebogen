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
import { completeSofortmeldung, sofortmeldung } from '../support/sofortmeldungSession';
import beispiel from '../fixtures/forms/beispiel/1.0.0.json';
import { createQuestionnaire, sealPart, startPart } from '../../src/logic/questionnaire';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import {
  fill,
  guardianForm,
  minorWithGuardian,
  NONCE_PERSON_V2,
  note,
  ok,
  PERSON_VALUES,
  personSealInput,
  QUESTIONNAIRE_ID,
  withEmployer,
} from '../support/sample';

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
async function pdfWith(people: number, text?: string, wageTypes?: string, lastMonth = 0) {
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
  if (lastMonth > 0) {
    answers.fragVormonat = true;
    answers.vormonatWerte = Array.from({ length: lastMonth }, (_, i) => ({
      rowId: `r${i + 1}`,
      vormonatPerson: 'Beispiel, Person 1',
      vormonatLohnart: '1000 Stundenlohn',
      vormonatWert: String(i + 1),
    }));
  }
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

interface Piece {
  page: number;
  y: number;
  text: string;
  font: string;
}

/** Every piece of text, its height on the page and its font, page by page. */
async function pieces(bytes: Uint8Array): Promise<Piece[]> {
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const found: Piece[] = [];
  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();
    for (const item of content.items) {
      if ('str' in item && item.str.trim() !== '') {
        found.push({ page, y: item.transform[5] ?? 0, text: item.str, font: item.fontName });
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

  // Audit 2026-11-16, round 4: the checks above missed a heading at the end of an otherwise full
  // page. Headings and the titles of the notices are bold, the text under them is not: the last
  // line of a page before the Prüfblatt is never bold.
  it('never ends a page with a heading or the title of a notice', async () => {
    const cases: [string, Parameters<typeof pdfWith>][] = [
      ...Array.from({ length: 60 }, (_, i): [string, Parameters<typeof pdfWith>] => [
        `${i + 1} lines`,
        [2, Array.from({ length: i + 1 }, (_, n) => `Zeile ${n + 1}`).join('\n')],
      ]),
      ...Array.from({ length: 12 }, (_, i): [string, Parameters<typeof pdfWith>] => [
        `${i + 1} people`,
        [i + 1],
      ]),
      ...[5, 7].flatMap((count) =>
        [1, 2].map((lastMonth): [string, Parameters<typeof pdfWith>] => [
          `${count} lines, ${lastMonth} of last month`,
          [
            2,
            Array.from({ length: count }, (_, n) => `Zeile ${n + 1}`).join('\n'),
            undefined,
            lastMonth,
          ],
        ]),
      ),
    ];
    const ends: string[] = [];
    for (const [name, args] of cases) {
      const found = await pieces(await pdfWith(...args));
      const bold = found.find((piece) => piece.text === 'Unterschriften und Abschlüsse')?.font;
      // Without the heading's font the check below would pass empty (audit 2026-11-16, round 5).
      expect(bold, name).toBeDefined();
      const check = found.find((piece) => piece.text.startsWith('Prüfblatt'))?.page ?? Infinity;
      const pages = [...new Set(found.map((piece) => piece.page))].filter((page) => page < check);
      for (const page of pages) {
        const body = found.filter((piece) => piece.page === page && piece.y !== 28);
        const lowest = body.reduce((low, piece) => (piece.y < low.y ? piece : low));
        if (lowest.font === bold) ends.push(`${name}: „${lowest.text}“ ends page ${page}`);
      }
    }
    expect(ends).toEqual([]);
  }, 300_000);

  // Audit 2026-11-16, round 5: a drawn signature with its system note and hash takes about 140 pt,
  // only 110 were kept free, so its head or its note ended up alone. The Kanzlei name in the header
  // moves the signature lines down line by line.
  // Loop 6: also the heading with the first block, and a second drawn block (the guardian's) —
  // in the Sofortmeldung the drawn block is the first, so the heading's rule hid the block's own.
  it.each([
    ['the Sofortmeldung', () => completeSofortmeldung().questionnaire, sofortmeldung],
    ['a minor and the guardian, both drawn', minorWithGuardian, guardianForm()],
  ] as const)(
    'keeps every signature line with its picture, note and hash on one page: %s',
    async (_label, questionnaireOf, form) => {
      const questionnaire = questionnaireOf();
      const torn: string[] = [];
      for (let lines = 0; lines <= 70; lines++) {
        const written = await writeQuestionnairePdf(
          {
            questionnaire,
            form,
            origin: 'published',
            config: { kanzleiName: Array.from({ length: lines + 1 }, () => 'Kanzlei').join('\n') },
            created: CREATED,
          },
          FONTS,
        );
        const found = await pieces(written.bytes);
        // The signature lines, before the Prüfblatt (its hashes are no signature's).
        const check = found.find((piece) => piece.text.startsWith('Prüfblatt'))?.page ?? Infinity;
        const before = found.filter((piece) => piece.page < check);
        const heads = before.filter((piece) => /^\[\d+\] /.test(piece.text));
        const hashes = before.filter((piece) => /^SHA-256( |$)/.test(piece.text));
        const heading = before.find((piece) => piece.text === 'Unterschriften und Abschlüsse');
        expect(heads.length, `${lines} lines`).toBeGreaterThan(1);
        if (heading?.page !== heads[0]?.page) torn.push(`${lines} lines: heading alone`);
        heads.forEach((head, i) => {
          if (hashes[i]?.page !== head.page) torn.push(`${lines} lines: ${head.text.slice(0, 30)}`);
        });
      }
      expect(torn).toEqual([]);
    },
    300_000,
  );

  // Audit 2026-11-16, round 5: the room kept under „Abweichende Unterschriftsdaten“ for its first
  // footnote was in no test. Loop 6: the whole footnote stays with it, not only its first line — a
  // long role label makes the footnote four lines, so the sweep cannot step over the break.
  it('keeps „Abweichende Unterschriftsdaten“ with its whole first footnote', async () => {
    const raw = structuredClone(beispiel) as { roles: { id: string; label: string }[] };
    const person = raw.roles.find((role) => role.id === 'person');
    if (person)
      person.label = `Beschäftigte Person ${'mit einer sehr langen Bezeichnung '.repeat(6)}`.trim();
    const form: RegisteredForm = registeredFrom(raw);
    let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    q = ok(startPart(q, form, 'person'));
    q = fill(q, 'person', PERSON_VALUES, form);
    q = ok(
      sealPart(
        q,
        form,
        'person',
        personSealInput({ signature: { method: 'typed', name: 'Erika Musterfrau' } }),
      ),
    );
    q = withEmployer(q, form);
    q = ok(startPart(q, form, 'person'));
    q = fill(q, 'person', { bemerkungen: 'Korrigierte Bemerkung' }, form);
    const questionnaire = ok(
      sealPart(
        q,
        form,
        'person',
        personSealInput({
          nonce: NONCE_PERSON_V2,
          systemNote: note('2026-10-31T11:00:00.000+01:00', '2026-10-31T10:00:00.000Z', ['touch']),
        }),
      ),
    );
    const torn: string[] = [];
    let crossed = false;
    for (let lines = 0; lines <= 70; lines++) {
      const written = await writeQuestionnairePdf(
        {
          questionnaire,
          form,
          origin: 'published',
          config: { kanzleiName: Array.from({ length: lines + 1 }, () => 'Kanzlei').join('\n') },
          created: CREATED,
        },
        FONTS,
      );
      const found = await pieces(written.bytes);
      const start = found.findIndex((piece) => piece.text === 'Abweichende Unterschriftsdaten');
      const end = found.findIndex(
        (piece, i) => i > start && /Unterschriftszeile \d+\.$/.test(piece.text),
      );
      expect(start, `${lines} lines`).toBeGreaterThanOrEqual(0);
      expect(end - start, `${lines} lines: a footnote of several lines`).toBeGreaterThan(2);
      const pages = new Set(found.slice(start, end + 1).map((piece) => piece.page));
      if (pages.size > 1) torn.push(`${lines} lines`);
      if ((found[start]?.page ?? 0) > 1) crossed = true;
    }
    // The sweep moved the heading over a page break at least once.
    expect(crossed).toBe(true);
    expect(torn).toEqual([]);
  }, 300_000);
});
