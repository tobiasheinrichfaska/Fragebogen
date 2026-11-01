// The tester's report of a run on the test page (Tobias 2026-11-01): who tested which build when,
// per test the result, the times (start, end, measured, corrected) and the comment, the totals and a
// closing comment — a PDF/A-2u to send. Only tests with a result, a start or a comment appear.
import fontkit from '@cantoo/fontkit';
import { PDFDocument } from '@cantoo/pdf-lib';
import { testReportFileName } from '../logic/fileNames';
import { formatLocalDateTime, isLocalTime } from '../logic/time';
import {
  RESULT_LABELS,
  changedSince,
  countedMinutes,
  measuredMinutes,
  totalsOf,
  type TestRun,
} from '../logic/testRun';
import { Layout, MARGIN, MUTED, printable, type PdfFonts } from './pdfWriter';

export interface TestReportInput {
  run: TestRun;
  /** `version`: the current caseVersion — a result given for an older text is marked. */
  cases: readonly { id: string; title: string; area: string; version?: string }[];
  appVersion: string;
  /** Device time of creation. */
  created: { local: string; utc: string };
}

const clock = (local: string | undefined) =>
  local && isLocalTime(local) ? `${local.slice(11, 16)} Uhr` : '–';

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
  const tester = run.tester.trim() || 'ohne Namen';
  doc.setTitle(`Testbericht Fragebogen – ${tester}`);
  doc.setAuthor(tester);
  doc.setCreator(`Fragebogen ${input.appVersion}`);
  doc.setProducer(`Fragebogen ${input.appVersion}`);
  doc.setLanguage('de-DE');
  doc.setCreationDate(created);
  doc.setModificationDate(created);

  const layout = new Layout(doc, fonts);
  const small = { size: 8.5, color: MUTED } as const;
  const totals = totalsOf(run);
  layout.text('Testbericht Fragebogen-Test', { font: fonts.bold, size: 16, gap: 2 });
  layout.text(
    `Tester: ${tester} · erstellt am ${formatLocalDateTime(input.created.local)} laut Gerät · App ${input.appVersion}`,
    { ...small, gap: 6 },
  );
  layout.text(
    `Getestet: ${totals.tested} (bestanden ${totals.byResult.bestanden}, teilweise ${totals.byResult.teilweise}, ` +
      `nicht bestanden ${totals.byResult.nichtBestanden}) · Zeit gemessen ${totals.measuredMinutes} Min., ` +
      `gezählt (mit Korrekturen) ${totals.countedMinutes} Min.`,
    { font: fonts.bold, size: 10, gap: 4 },
  );

  for (const testCase of input.cases) {
    const entry = run.entries[testCase.id];
    if (!entry || (!entry.result && !entry.started && entry.comment.trim() === '')) continue;
    layout.heading(`${testCase.id} ${testCase.title}`, 10);
    layout.text(testCase.area, small);
    const measured = measuredMinutes(entry);
    layout.text(
      `Ergebnis: ${entry.result ? RESULT_LABELS[entry.result] : 'nicht abgeschlossen'} · Beginn ${clock(entry.started)} · ` +
        `Ende ${clock(entry.ended)} · gemessen ${measured === undefined ? '–' : `${measured} Min.`}` +
        (entry.correctedMinutes === undefined
          ? ''
          : ` · korrigiert ${entry.correctedMinutes} Min. (gezählt ${countedMinutes(entry)} Min.)`),
      { size: 9 },
    );
    if (testCase.version !== undefined && changedSince(entry, testCase.version)) {
      layout.text('Hinweis: Der Test wurde nach diesem Ergebnis geändert.', {
        ...small,
        size: 8.5,
      });
    }
    if (entry.comment.trim() !== '') layout.text(`Kommentar: ${entry.comment.trim()}`, { size: 9 });
  }

  if (run.comment.trim() !== '') {
    layout.heading('Gesamteindruck', 10);
    layout.text(run.comment.trim(), { size: 9 });
  }

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(printable(`Testbericht · ${tester} · Seite ${i + 1} von ${pages.length}`), {
      x: MARGIN,
      y: 28,
      size: 7.5,
      font: fonts.sans,
      color: MUTED,
    });
  });
  doc.convertToPDFA({ conformance: '2U' });
  const bytes = await doc.save({ useObjectStreams: false });
  return {
    bytes,
    fileName: testReportFileName(run.tester, input.created.local.slice(0, 10)),
    pages: pages.length,
  };
}
