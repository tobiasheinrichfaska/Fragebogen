// The tester's report of the test page (Tobias 2026-11-01): results, times (with the correction)
// and comments of the tests worked on, totals, the closing comment — readable PDF/A, nothing active.
import { readFileSync } from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import type { PdfFonts } from '../../src/io/pdfWriter';
import { writeTestReportPdf } from '../../src/io/testReportPdf';
import { testReportFileName } from '../../src/logic/fileNames';
import {
  correctDuration,
  emptyRun,
  setComment,
  setResult,
  startTest,
} from '../../src/logic/testRun';

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};

const T0 = '2026-11-01T10:00:00.000+01:00';
let run = { ...emptyRun(), tester: 'Erika Mustermann', comment: 'Gut verständlich.' };
run = setResult(startTest(run, 'MT-13', T0), 'MT-13', 'teilweise', '2026-11-01T10:07:30.000+01:00');
run = correctDuration(run, 'MT-13', 5);
run = setComment(run, 'MT-13', 'Text zu lang.');
run = setResult(run, 'MT-14', 'bestanden', '2026-11-01T10:10:00.000+01:00', 'aaaaaaaaaaaa');
run = setComment(run, 'MT-15', 'Nicht geschafft, Datei nicht gefunden.');
const CASES = [
  {
    id: 'MT-13',
    title: 'Hinweise und „Vorerst überspringen“ (Person)',
    area: 'Ausfüllen (Interview)',
  },
  { id: 'MT-14', title: 'Folgefragen', area: 'Ausfüllen (Interview)', version: 'bbbbbbbbbbbb' },
  { id: 'MT-15', title: 'Zwischenstand speichern', area: 'Ausfüllen (Interview)' },
  { id: 'MT-16', title: 'Nicht bearbeitet', area: 'Ausfüllen (Interview)' },
];

describe('test report as PDF', () => {
  let written: Awaited<ReturnType<typeof writeTestReportPdf>>;
  beforeAll(async () => {
    written = await writeTestReportPdf(
      {
        run,
        cases: CASES,
        appVersion: '0.1.0',
        device: 'iPhone · Safari 18 · Bildschirm 390 × 844',
        created: { local: '2026-11-01T11:00:00.000+01:00', utc: '2026-11-01T10:00:00.000Z' },
      },
      FONTS,
    );
  }, 60_000);

  it('is named after the tester and the day', () => {
    expect(written.fileName).toBe('Testbericht_Erika_Mustermann_2026_11_01.pdf');
    expect(testReportFileName('  ', '2026-11-01')).toBe('Testbericht_Tester_2026_11_01.pdf');
  });

  it('lists results, times with the correction, comments and the totals', async () => {
    const text = await readPdfText(pdfjs as unknown as PdfJsLike, written.bytes);
    const all = text.lines.join('\n');
    for (const expected of [
      'Tester: Erika Mustermann · erstellt am 01.11.2026, 11:00 Uhr laut Gerät · App 0.1.0',
      // 2026-11-05: the report named no device, so an iPhone test could not be told apart.
      'Gerät laut Browser: iPhone · Safari 18 · Bildschirm 390 × 844',
      'Getestet: 2 (bestanden 1, teilweise 1, nicht bestanden 0)',
      'MT-13 Hinweise und „Vorerst überspringen“ (Person)',
      'Ergebnis: teilweise · Beginn 10:00 Uhr · Ende 10:07 Uhr · gemessen 8 Min. · korrigiert 5 Min. (gezählt 5 Min.)',
      'Kommentar: Text zu lang.',
      'Ergebnis: bestanden · Beginn 10:10 Uhr · Ende 10:10 Uhr · gemessen 1 Min.',
      'Hinweis: Der Test wurde nach diesem Ergebnis geändert.',
      'Ergebnis: nicht abgeschlossen',
      'Kommentar: Nicht geschafft, Datei nicht gefunden.',
      'Gesamteindruck',
      'Gut verständlich.',
      'Seite 1 von 1',
    ]) {
      expect(all).toContain(expected);
    }
    expect(all).not.toContain('Nicht bearbeitet');
  });

  it('carries PDF/A markers, but no script, attachment or launch action', () => {
    const raw = Buffer.from(written.bytes).toString('latin1');
    expect(raw).toMatch(/pdfaid:part[^0-9]*2/);
    for (const forbidden of ['/JavaScript', '/JS ', '/EmbeddedFile', '/Launch', '/Encrypt']) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
