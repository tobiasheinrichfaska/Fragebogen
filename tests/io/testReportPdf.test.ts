// The tester's copy of a report (since 2026-11-15 without free text): results, the measured time
// and the failed steps with their reasons, the totals — readable PDF/A, nothing active, no name.
import { readFileSync } from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfText, type PdfJsLike } from '../../src/io/pdfReader';
import type { PdfFonts } from '../../src/io/pdfWriter';
import { writeTestReportPdf } from '../../src/io/testReportPdf';
import { testReportFileName } from '../../src/logic/fileNames';
import { emptyRun, markReported, openTest, setResult, setStep } from '../../src/logic/testRun';
import { keepForPdfa } from '../support/pdfaOut';

const font = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../assets/fonts/${name}`, import.meta.url)));
const FONTS: PdfFonts = {
  sans: font('NotoSans-Regular.subset.ttf'),
  bold: font('NotoSans-SemiBold.subset.ttf'),
  mono: font('NotoSansMono-Regular.subset.ttf'),
};

const T0 = '2026-11-15T10:00:00.000+01:00';
let run = setResult(
  openTest(emptyRun(), 'MT-13', T0),
  'MT-13',
  'nichtBestanden',
  '2026-11-15T10:07:30.000+01:00',
);
run = setStep(run, 'MT-13', 2, 'fehlermeldung');
run = setStep(run, 'MT-13', 3, 'darstellung');
run = setResult(run, 'MT-14', 'bestanden', '2026-11-15T10:10:00.000+01:00', 'aaaaaaaaaaaa');
run = markReported(run, ['MT-14'], '2026-11-15T10:30:00.000+01:00');
run = openTest(run, 'MT-15', T0);
const CASES = [
  {
    id: 'MT-13',
    title: 'Hinweise und „Vorerst überspringen“ (Person)',
    area: 'Ausfüllen (Interview)',
    steps: ['Den Fragebogen öffnen.', '„Weiter“ tippen.', 'Die Hinweise lesen.'],
  },
  { id: 'MT-14', title: 'Folgefragen', area: 'Ausfüllen (Interview)', version: 'bbbbbbbbbbbb' },
  { id: 'MT-15', title: 'Zwischenstand speichern', area: 'Ausfüllen (Interview)' },
];

describe('test report copy as PDF', () => {
  let written: Awaited<ReturnType<typeof writeTestReportPdf>>;
  let all = '';
  beforeAll(async () => {
    written = await writeTestReportPdf(
      {
        run,
        cases: CASES,
        appVersion: '0.1.0',
        appCommit: 'd4ce28b0a1b2',
        device: 'iPhone · Safari 18 · Bildschirm 390 × 844',
        created: { local: '2026-11-15T11:00:00.000+01:00', utc: '2026-11-15T10:00:00.000Z' },
      },
      FONTS,
    );
    keepForPdfa('testbericht.pdf', written.bytes);
    all = (await readPdfText(pdfjs as unknown as PdfJsLike, written.bytes)).lines.join('\n');
  }, 60_000);

  it('is named after the day and time, never after a person', () => {
    expect(written.fileName).toBe('Testbericht_2026_11_15_1100.pdf');
    expect(testReportFileName('2026-11-01T09:05:00+01:00')).toBe('Testbericht_2026_11_01_0905.pdf');
  });

  it('lists results, the measured time, the failed steps with their reasons and the totals', () => {
    for (const expected of [
      'Erstellt am 15.11.2026, 11:00 Uhr laut Gerät · App 0.1.0 (Stand d4ce28b0a1b2)',
      'Gerät laut Browser: iPhone · Safari 18 · Bildschirm 390 × 844',
      'Getestet: 2 (bestanden 1, nicht bestanden 1) · Zeit 8 Min.',
      'MT-13 Hinweise und „Vorerst überspringen“ (Person)',
      'Ergebnis: Nicht bestanden · Zeit 8 Min.',
      'Schritt 2: Fehlermeldung – „Weiter“ tippen.',
      'Schritt 3: Darstellung falsch – Die Hinweise lesen.',
      'Ergebnis: Bestanden · Zeit 0 Min. · gesendet 10:30 Uhr',
      'Hinweis: Der Test wurde nach diesem Ergebnis geändert.',
      'Seite 1 von 1',
    ]) {
      expect(all).toContain(expected);
    }
    expect(all).not.toContain('Zwischenstand speichern');
    expect(all).not.toMatch(/Tester|Kommentar|Gesamteindruck/);
  });

  it('carries PDF/A markers, but no script, attachment or launch action', () => {
    const raw = Buffer.from(written.bytes).toString('latin1');
    expect(raw).toMatch(/pdfaid:part[^0-9]*2/);
    for (const forbidden of ['/JavaScript', '/JS ', '/EmbeddedFile', '/Launch', '/Encrypt']) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
