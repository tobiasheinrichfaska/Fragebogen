// The tester's copy of a report (since 2026-11-15 without free text, Testumgebung
// docs/testbericht.md): which build was tested when on which device, per test the result, the time
// the page measured and the failed steps with their reasons, the totals — a PDF/A-2u. The report
// itself goes to the test zone (io/testReportSend.ts); the copy carries no name.
import fontkit from '@cantoo/fontkit';
import { PDFDocument } from '@cantoo/pdf-lib';
import { testReportFileName } from '../logic/fileNames';
import { formatLocalDateTime } from '../logic/time';
import {
  RESULT_LABELS,
  STEP_REASON_LABELS,
  changedSince,
  minutesOf,
  testTime,
  totalsOf,
  type TestRun,
} from '../logic/testRun';
import { Layout, MARGIN, MUTED, printable, type PdfFonts } from './pdfWriter';

export interface TestReportInput {
  run: TestRun;
  /**
   * `version`: the current caseVersion — a result given for an older text is marked; `steps`: the
   * texts of the numbered steps, to name a failed one.
   */
  cases: readonly {
    id: string;
    title: string;
    area: string;
    version?: string;
    steps?: readonly string[];
  }[];
  appVersion: string;
  /** The commit of the build („Stand“), empty if unknown. */
  appCommit: string;
  /** Device kind, browser and screen as the browser reports them (`deviceDescription`). */
  device: string;
  /** Device time of creation. */
  created: { local: string; utc: string };
}

const shortened = (text: string) => (text.length > 90 ? `${text.slice(0, 89)}…` : text);

export async function writeTestReportPdf(
  input: TestReportInput,
  fontBytes: PdfFonts,
): Promise<{ bytes: Uint8Array; fileName: string; pages: number }> {
  const { run } = input;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = {
    sans: await doc.embedFont(fontBytes.sans, { subset: true }),
    bold: await doc.embedFont(fontBytes.bold, { subset: true }),
    mono: await doc.embedFont(fontBytes.mono, { subset: true }),
  };
  const created = new Date(input.created.utc);
  doc.setTitle('Testbericht Fragebogen');
  doc.setCreator(`Fragebogen ${input.appVersion}`);
  doc.setProducer(`Fragebogen ${input.appVersion}`);
  doc.setLanguage('de-DE');
  doc.setCreationDate(created);
  doc.setModificationDate(created);

  const layout = new Layout(doc, fonts);
  const small = { size: 8.5, color: MUTED } as const;
  const totals = totalsOf(run);
  const stand = input.appCommit === '' ? '' : ` (Stand ${input.appCommit})`;
  layout.text('Testbericht Fragebogen-Test', { font: fonts.bold, size: 16, gap: 2 });
  layout.text(
    `Erstellt am ${formatLocalDateTime(input.created.local)} laut Gerät · App ${input.appVersion}${stand}`,
    { ...small, gap: 2 },
  );
  layout.text(`Gerät laut Browser: ${input.device}`, { ...small, gap: 6 });
  layout.text(
    `Getestet: ${totals.tested} (bestanden ${totals.byResult.bestanden}, ` +
      `nicht bestanden ${totals.byResult.nichtBestanden}) · Zeit ${minutesOf(totals.seconds)} Min.`,
    { font: fonts.bold, size: 10, gap: 4 },
  );

  for (const testCase of input.cases) {
    const entry = run.entries[testCase.id];
    if (!entry?.result) continue;
    layout.heading(`${testCase.id} ${testCase.title}`, 10);
    layout.text(testCase.area, small);
    const sent =
      entry.reported === undefined
        ? ''
        : ` · gesendet ${testTime(entry.reported, input.created.local)}`;
    layout.text(
      `Ergebnis: ${RESULT_LABELS[entry.result]} · Zeit ${minutesOf(entry.seconds)} Min.${sent}`,
      { size: 9 },
    );
    for (const step of entry.steps ?? []) {
      const text = testCase.steps?.[step.nr - 1];
      layout.text(
        `Schritt ${step.nr}: ${STEP_REASON_LABELS[step.reason]}${text === undefined ? '' : ` – ${shortened(text)}`}`,
        { size: 9 },
      );
    }
    if (testCase.version !== undefined && changedSince(entry, testCase.version)) {
      layout.text('Hinweis: Der Test wurde nach diesem Ergebnis geändert.', small);
    }
  }

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(printable(`Testbericht · Seite ${i + 1} von ${pages.length}`), {
      x: MARGIN,
      y: 28,
      size: 7.5,
      font: fonts.sans,
      color: MUTED,
    });
  });
  doc.convertToPDFA({ conformance: '2U' });
  const bytes = await doc.save({ useObjectStreams: false });
  return { bytes, fileName: testReportFileName(input.created.local), pages: pages.length };
}
