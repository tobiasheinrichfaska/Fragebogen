// The Erfassungsblatt of a hand-over to a payroll program as a PDF of its own for the Personalakte
// (one Unterlage per file, Gemeinsame Grundsätze § 9a BVV): whom it is about, the questionnaire parts
// it rests on (content hashes), what the Kanzlei entered, every value in the order of the program's
// masks, what was left out and what to check. PDF/A-2u, no script, no attachment, no data pages.
import fontkit from '@cantoo/fontkit';
import { PDFDocument } from '@cantoo/pdf-lib';
import { APP_VERSION } from '../appInfo';
import type { AppConfig } from '../logic/appConfig';
import type { EmployeeMode, ExportMapping } from '../logic/exportMapping';
import { sheetFileName } from '../logic/fileNames';
import type { LugImport, NeededInput } from '../logic/lugImport';
import type { FormDefinition, Questionnaire } from '../logic/model';
import { latestSealed } from '../logic/questionnaire';
import { formatLocalDateTime } from '../logic/time';
import { A4, INK, Layout, MARGIN, MUTED, printable, wrap, type PdfFonts } from './pdfWriter';

export interface SheetPdfInput {
  questionnaire: Questionnaire;
  definition: FormDefinition;
  mapping: ExportMapping;
  result: LugImport;
  inputs: NeededInput[];
  mandant: string;
  mode?: EmployeeMode;
  config: AppConfig;
  /** Device time of creation. */
  created: { local: string; utc: string };
}

export const MODE_TEXT: Readonly<Record<EmployeeMode, string>> = {
  neu: 'neu anlegen',
  vorhanden: 'vorhandenen Mitarbeiter ergänzen',
};

export async function writeSheetPdf(
  input: SheetPdfInput,
  fontBytes: PdfFonts,
): Promise<{ bytes: Uint8Array; fileName: string; pages: number }> {
  const { questionnaire, definition, mapping, result } = input;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = {
    sans: await doc.embedFont(fontBytes.sans, { subset: true }),
    bold: await doc.embedFont(fontBytes.bold, { subset: true }),
    mono: await doc.embedFont(fontBytes.mono, { subset: true }),
  };
  const id = questionnaire.questionnaireId;
  const created = new Date(input.created.utc);
  doc.setTitle(`Erfassungsblatt ${mapping.title} – Fragebogen ${id.slice(0, 8)}`);
  doc.setAuthor('Fragebogen-App');
  doc.setSubject(`Fragebogen-ID ${id}`);
  doc.setCreator(`Fragebogen ${APP_VERSION}`);
  doc.setProducer(`Fragebogen ${APP_VERSION}`);
  doc.setLanguage('de-DE');
  doc.setCreationDate(created);
  doc.setModificationDate(created);

  const layout = new Layout(doc, fonts);
  const small = { size: 8.5, color: MUTED } as const;
  const { employee } = result;
  layout.text(`Erfassungsblatt ${mapping.title}`, { font: fonts.bold, size: 16, gap: 2 });
  layout.text(
    [
      input.config.kanzleiName,
      `Fragebogen-ID ${id}`,
      `Formular ${definition.id} ${definition.version}`,
    ]
      .filter(Boolean)
      .join(' · '),
    { ...small, gap: 6 },
  );
  layout.text(
    `Mandant ${input.mandant || '–'} · Mitarbeiter ${employee.number || '–'}` +
      (input.mode ? ` (${MODE_TEXT[input.mode]})` : '') +
      ` · ${[employee.name, employee.firstName].filter(Boolean).join(', ') || '–'}` +
      (employee.start ? ` · Eintritt ${employee.start}` : ''),
    { font: fonts.bold, size: 10, gap: 2 },
  );
  layout.text(
    `Erstellt am ${formatLocalDateTime(input.created.local)} laut Gerät · App ${APP_VERSION}. ` +
      (result.text === undefined
        ? `Noch keine Importdatei: ${result.blocking.join(' ')}`
        : 'Die Importdatei enthält die Werte dieses Blatts ohne die als nicht übertragen markierten.'),
    { ...small, gap: 6 },
  );

  layout.heading('Grundlage', 10);
  const sealed = definition.roles.filter((role) => latestSealed(questionnaire, role.id)?.seal);
  if (sealed.length === 0) layout.text('Grundlage: noch kein abgeschlossener Teil.', { size: 8.5 });
  for (const role of sealed) {
    const part = latestSealed(questionnaire, role.id);
    if (!part?.seal) continue;
    layout.text(`${role.label}, Fassung ${part.seal.payload.version}`, { size: 8.5 });
    layout.text(`SHA-256 ${part.seal.contentHash}`, { font: fonts.mono, size: 7, color: MUTED });
  }

  if (input.inputs.length > 0) {
    layout.heading('Von der Kanzlei eingetragen', 10);
    for (const needed of input.inputs) {
      const shown = needed.input.options?.find((o) => o.value === needed.value);
      layout.text(
        `${needed.input.label}: ${needed.value ? `${needed.value}${shown ? ` – ${shown.label}` : ''}` : '– (fehlt)'}` +
          (needed.context.length
            ? ` (Angabe im Fragebogen: ${needed.context.map((c) => `${c.label}: ${c.value}`).join('; ')})`
            : ''),
        { size: 8.5 },
      );
    }
  }

  const labelWidth = 220;
  const valueWidth = A4[0] - 2 * MARGIN - labelWidth - 8;
  let mask: string | undefined;
  for (const row of result.sheet) {
    if (row.mask !== mask) {
      mask = row.mask;
      layout.heading(row.mask.split('|').join(' › '), 9.5);
    }
    const value = row.problem ? `– (${row.problem})` : row.value || '–';
    const valueLines = wrap(printable(value), fonts.sans, 9, valueWidth);
    const noteLines =
      row.note === undefined
        ? []
        : wrap(printable(`Hinweis: ${row.note}`), fonts.sans, 7.5, valueWidth);
    const labelLines = wrap(printable(row.field), fonts.sans, 8.5, labelWidth - 6);
    const height =
      Math.max(valueLines.length * 12 + noteLines.length * 10, labelLines.length * 11.5) + 3;
    layout.ensure(height);
    labelLines.forEach((line, i) => {
      layout.page.drawText(line, {
        x: MARGIN,
        y: layout.y - i * 11.5,
        size: 8.5,
        font: fonts.sans,
        color: MUTED,
      });
    });
    valueLines.forEach((line, i) => {
      layout.page.drawText(line, {
        x: MARGIN + labelWidth,
        y: layout.y - i * 12,
        size: 9,
        font: fonts.sans,
        color: row.problem ? MUTED : INK,
      });
    });
    noteLines.forEach((line, i) => {
      layout.page.drawText(line, {
        x: MARGIN + labelWidth,
        y: layout.y - valueLines.length * 12 - i * 10,
        size: 7.5,
        font: fonts.sans,
        color: MUTED,
      });
    });
    layout.y -= height;
  }

  if (result.problems.length > 0) {
    layout.heading(`Nicht übertragen – in ${mapping.title} selbst erfassen`, 10);
    for (const problem of result.problems) layout.text(`– ${problem}`, { size: 8.5 });
  }
  if (result.notes.length > 0) {
    layout.heading('Übertragen, bitte im Importprotokoll prüfen', 10);
    for (const note of result.notes) layout.text(`– ${note}`, { size: 8.5 });
  }
  if ((mapping.howTo ?? []).length > 0) {
    layout.heading('Einspielen', 10);
    for (const step of mapping.howTo ?? []) layout.text(step, { size: 8.5 });
  }

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(
      printable(
        `Erfassungsblatt ${mapping.title} · Fragebogen-ID ${id.slice(0, 8)} · Seite ${i + 1} von ${pages.length}`,
      ),
      { x: MARGIN, y: 28, size: 7.5, font: fonts.sans, color: MUTED },
    );
  });
  doc.convertToPDFA({ conformance: '2U' });
  const bytes = await doc.save({ useObjectStreams: false });
  return {
    bytes,
    fileName: sheetFileName(mapping.target, input.mandant, employee.number, id),
    pages: pages.length,
  };
}
