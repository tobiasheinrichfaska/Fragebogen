// The questionnaire as ONE PDF (Gemeinsame Grundsätze § 9a BVV: no attachment, no script): the
// readable part (answers by section, employer fields shaded, footnotes for values changed in a
// later version, one signature line per version), the notices, the legal notes, the Prüfblatt,
// and the data pages — the package as text lines and as QR codes for the paper path. Target
// PDF/A-2u. Every page carries "Fragebogen-ID · Daten · Formular · Seite x von y".
import { PDFDocument, PDFString, rgb, type PDFFont, type PDFPage, type RGB } from '@cantoo/pdf-lib';
import fontkit from '@cantoo/fontkit';
import { APP_VERSION } from '../appInfo';
import type { AppConfig } from '../logic/appConfig';
import { buildPackage, ORIGIN_MESSAGES, packageText, type FormOrigin } from '../logic/dataPackage';
import { encodeDataLines } from '../logic/dataPages';
import { displayValue } from '../logic/display';
import { fileNameFor } from '../logic/fileNames';
import { isTestVersion, registryOf, type RegisteredForm } from '../logic/formRegistry';
import type { Questionnaire } from '../logic/model';
import { signatureLayout } from '../logic/provenance';
import { qrPayloads } from '../logic/qrParts';
import { latestSealed } from '../logic/questionnaire';
import { BLOCKER_MESSAGES, completenessGaps } from '../logic/requirements';
import { decodeStrokes } from '../logic/strokes';
import { formatLocalDateTime } from '../logic/time';
import { FINDING_MESSAGES, LEVEL_LABELS, verifyQuestionnaire } from '../logic/verify';
import { QR_GAP_MODULES, qrMatrix } from './qr';

export interface PdfFonts {
  sans: Uint8Array;
  bold: Uint8Array;
  mono: Uint8Array;
}

export interface PdfInput {
  questionnaire: Questionnaire;
  form: RegisteredForm;
  origin: FormOrigin;
  config: AppConfig;
  /** Device time of creation (shown on the Prüfblatt). */
  created: { local: string; utc: string };
}

export interface PdfResult {
  bytes: Uint8Array;
  fileName: string;
  complete: boolean;
  pages: number;
  dataLines: number;
  qrCodes: number;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 42;
const BOTTOM = 56;
const INK = rgb(0.11, 0.13, 0.19);
const MUTED = rgb(0.36, 0.39, 0.45);
const SHADE = rgb(0.91, 0.92, 0.94);
const LINE = rgb(0.8, 0.82, 0.86);
/** One QR module printed as 0.5 mm — readable by flatbed scanners and phone cameras. */
const QR_MODULE = (0.5 / 25.4) * 72;

// Glyphs in the embedded subsets (assets/fonts/README.md); anything else prints as U+FFFD.
const RANGES: readonly [number, number][] = [
  [0x20, 0x7e],
  [0xa0, 0xff],
  [0x100, 0x17f],
  [0x218, 0x21b],
  [0x2c6, 0x2c6],
  [0x2dc, 0x2dc],
  [0x2010, 0x2027],
  [0x2030, 0x2030],
  [0x2039, 0x203a],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2190, 0x2193],
  [0x2212, 0x2212],
];
const REPLACEMENT = String.fromCodePoint(0xfffd);

/** Text as the embedded fonts can show it; the data pages keep the exact value anyway. */
export function printable(text: string): string {
  return [...text.replace(/\t/g, ' ')]
    .map((char) => {
      if (char === '\n') return char;
      const code = char.codePointAt(0) ?? 0;
      return RANGES.some(([from, to]) => code >= from && code <= to) ? char : REPLACEMENT;
    })
    .join('');
}

class Layout {
  page: PDFPage;
  y = 0;
  constructor(
    private readonly doc: PDFDocument,
    readonly fonts: { sans: PDFFont; bold: PDFFont; mono: PDFFont },
  ) {
    this.page = this.newPage();
  }

  newPage(): PDFPage {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN - 8;
    return this.page;
  }

  ensure(height: number): void {
    if (this.y - height < BOTTOM) this.newPage();
  }

  /** Wrapped text; returns the height used. */
  text(
    text: string,
    options: {
      font?: PDFFont;
      size?: number;
      x?: number;
      width?: number;
      color?: RGB;
      gap?: number;
    } = {},
  ): void {
    const font = options.font ?? this.fonts.sans;
    const size = options.size ?? 9.5;
    const x = options.x ?? MARGIN;
    const width = options.width ?? A4[0] - MARGIN - x;
    const leading = size * 1.35;
    for (const line of wrap(printable(text), font, size, width)) {
      this.ensure(leading);
      this.page.drawText(line, { x, y: this.y, size, font, color: options.color ?? INK });
      this.y -= leading;
    }
    this.y -= options.gap ?? 0;
  }

  heading(text: string, size = 12): void {
    this.ensure(size * 3);
    this.y -= size * 0.6;
    this.text(text, { font: this.fonts.bold, size, gap: size * 0.3 });
  }

  rule(): void {
    this.ensure(8);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 4 },
      end: { x: A4[0] - MARGIN, y: this.y + 4 },
      thickness: 0.5,
      color: LINE,
    });
    this.y -= 6;
  }
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line === '' ? word : `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line !== '') lines.push(line);
      // A single word wider than the column (hashes, IBAN without spaces) is cut hard.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

function addLink(
  doc: PDFDocument,
  page: PDFPage,
  url: string,
  rect: [number, number, number, number],
): void {
  const annotation = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: rect,
    Border: [0, 0, 0],
    // Print flag: PDF/A requires annotations to be printable.
    F: 4,
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  });
  page.node.addAnnot(doc.context.register(annotation));
}

function strokesPath(encoded: string): string | undefined {
  const decoded = decodeStrokes(encoded);
  if (!decoded.ok) return undefined;
  return decoded.strokes
    .map(
      (stroke) =>
        stroke.map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ') +
        (stroke.length === 1 ? ` L${(stroke[0]?.x ?? 0) + 1} ${stroke[0]?.y ?? 0}` : ''),
    )
    .join(' ');
}

const STATUS_TEXT = {
  draft: 'Entwurf',
  sealed: 'abgeschlossen',
  signed: 'unterschrieben',
} as const;

export async function writeQuestionnairePdf(
  input: PdfInput,
  fontBytes: PdfFonts,
): Promise<PdfResult> {
  const { questionnaire, form, origin, config } = input;
  const { definition } = form;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = {
    sans: await doc.embedFont(fontBytes.sans, { subset: true }),
    bold: await doc.embedFont(fontBytes.bold, { subset: true }),
    mono: await doc.embedFont(fontBytes.mono, { subset: true }),
  };
  const id = questionnaire.questionnaireId;
  const created = new Date(input.created.utc);
  doc.setTitle(`${definition.title} – Fragebogen ${id.slice(0, 8)}`);
  doc.setAuthor('Fragebogen-App');
  doc.setSubject(`Fragebogen-ID ${id}`);
  doc.setCreator(`Fragebogen ${APP_VERSION}`);
  doc.setProducer(`Fragebogen ${APP_VERSION}`);
  doc.setLanguage('de-DE');
  doc.setCreationDate(created);
  doc.setModificationDate(created);

  const gaps = completenessGaps(questionnaire, form);
  const complete = gaps.length === 0;
  const layout = new Layout(doc, fonts);
  const firstRole = definition.roles[0]?.id;
  const provenance = signatureLayout(questionnaire, definition);
  const footnotes = new Map(
    provenance.fields.flatMap((f) => (f.footnote === undefined ? [] : [[f.fieldId, f.footnote]])),
  );

  // --- Readable part ---------------------------------------------------------------------
  layout.text(definition.title, { font: fonts.bold, size: 16, gap: 2 });
  layout.text(
    [
      config.kanzleiName,
      `Fragebogen-ID ${id}`,
      `Formular ${definition.id} ${definition.version}${isTestVersion(definition.version) ? ' (Testfassung)' : ''}`,
    ]
      .filter(Boolean)
      .join(' · '),
    { size: 8.5, color: MUTED, gap: 6 },
  );
  layout.text(
    complete
      ? 'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.'
      : `Zur Weitergabe an die nächste Station. Noch offen: ${gaps
          .map(
            (g) =>
              `${BLOCKER_MESSAGES[g.code]}${g.detail.length ? ` (${g.detail.join(', ')})` : ''}`,
          )
          .join(' ')}`,
    { font: fonts.bold, size: 9.5, gap: 4 },
  );
  layout.text(
    'Diese PDF ist das Original. Bitte die Datei selbst weitergeben – nicht ausdrucken und neu einscannen, ' +
      'nicht neu speichern. Für Ausdrucke stehen die Daten zusätzlich als QR-Codes am Ende.',
    { size: 8.5, color: MUTED, gap: 4 },
  );
  if (config.appAddress) {
    const label = `App: ${config.appAddress}`;
    layout.ensure(14);
    layout.page.drawText(printable(label), {
      x: MARGIN,
      y: layout.y,
      size: 9,
      font: fonts.sans,
      color: rgb(0.12, 0.37, 0.66),
    });
    const width = fonts.sans.widthOfTextAtSize(printable(label), 9);
    addLink(doc, layout.page, config.appAddress, [
      MARGIN,
      layout.y - 2,
      MARGIN + width,
      layout.y + 9,
    ]);
    layout.y -= 16;
  }
  // Only roles whose answers are printed: an adult's questionnaire has no guardian part.
  const others = definition.roles
    .filter(
      (role) =>
        role.id !== firstRole &&
        definition.sections.some((section) =>
          section.fields.some(
            (field) =>
              field.role === role.id &&
              latestSealed(questionnaire, role.id)?.data[field.id] !== undefined,
          ),
        ),
    )
    .map((role) => role.label);
  if (others.length > 0) {
    layout.text(`Grau hinterlegte Angaben stammen von: ${others.join(', ')}.`, {
      size: 8,
      color: MUTED,
      gap: 4,
    });
  }

  const labelWidth = 200;
  for (const section of definition.sections) {
    const rows = section.fields.flatMap((field) => {
      const part = latestSealed(questionnaire, field.role);
      if (!part || !(field.id in part.data)) return [];
      return [{ field, value: part.data[field.id] }];
    });
    if (rows.length === 0) continue;
    layout.heading(section.title, 11);
    for (const { field, value } of rows) {
      const note = footnotes.get(field.id);
      const shown = `${displayValue(field, value)}${note === undefined ? '' : `  [${note}]`}`;
      const valueLines = wrap(
        printable(shown),
        fonts.sans,
        9.5,
        A4[0] - 2 * MARGIN - labelWidth - 8,
      );
      const labelLines = wrap(printable(field.label), fonts.sans, 8.5, labelWidth - 6);
      const height = Math.max(valueLines.length * 12.8, labelLines.length * 11.5) + 4;
      layout.ensure(height);
      if (field.role !== firstRole) {
        layout.page.drawRectangle({
          x: MARGIN - 4,
          y: layout.y - height + 10,
          width: A4[0] - 2 * MARGIN + 8,
          height,
          color: SHADE,
        });
      }
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
          y: layout.y - i * 12.8,
          size: 9.5,
          font: fonts.sans,
          color: INK,
        });
      });
      layout.y -= height;
    }
  }

  if (footnotes.size > 0) {
    layout.heading('Abweichende Unterschriftsdaten', 10);
    for (const line of provenance.lines.filter((l) => [...footnotes.values()].includes(l.number))) {
      layout.text(
        `[${line.number}] Wert geändert in Fassung ${line.version} (${line.roleLabel}), ${STATUS_TEXT[line.status]} am ${formatLocalDateTime(line.signedAtLocal)}; gedeckt durch Unterschriftszeile ${line.number}.`,
        { size: 8.5 },
      );
    }
  }

  // --- Notices -----------------------------------------------------------------------------
  if (definition.infoBlocks.length > 0) {
    layout.heading('Hinweise', 11);
    for (const block of definition.infoBlocks) {
      const part = latestSealed(questionnaire, block.role);
      const acknowledged = part?.seal?.payload.acknowledgements.some(
        (a) => a.infoBlockId === block.id,
      );
      const role = definition.roles.find((r) => r.id === block.role)?.label ?? block.role;
      layout.text(block.title, { font: fonts.bold, size: 9.5 });
      layout.text(
        `${block.acknowledgement === 'paperHandout' ? 'Auf Papier ausgehändigt' : 'In der App gelesen'} – ` +
          `${acknowledged ? `bestätigt von: ${role}` : `noch nicht bestätigt (${role})`} · Stand ${block.asOf.split('-').reverse().join('.')}`,
        { size: 8, color: MUTED },
      );
      layout.text(block.text.replace(/\n\n/g, '\n'), { size: 8, gap: 6 });
    }
  }

  // --- Signature lines -----------------------------------------------------------------------
  layout.heading('Unterschriften und Abschlüsse', 11);
  for (const line of provenance.lines) {
    const part = questionnaire.parts[line.role]?.find(
      (p) => p.seal?.contentHash === line.contentHash,
    );
    const note = part?.seal?.payload.systemNote;
    layout.ensure(110);
    layout.text(
      `[${line.number}] ${line.roleLabel} – Fassung ${line.version}${line.current ? '' : ' (durch eine neuere Fassung ersetzt)'} – ` +
        `${STATUS_TEXT[line.status]} am ${formatLocalDateTime(line.signedAtLocal)} laut Gerät` +
        (line.signerName ? ` – ${line.signerName}` : ''),
      { font: fonts.bold, size: 9.5 },
    );
    const path = part?.signatureStrokes ? strokesPath(part.signatureStrokes) : undefined;
    if (path) {
      const scale = 0.2;
      layout.ensure(400 * scale + 8);
      layout.page.drawSvgPath(path, {
        x: MARGIN,
        y: layout.y,
        scale,
        borderColor: INK,
        borderWidth: 1.6,
      });
      layout.page.drawLine({
        start: { x: MARGIN, y: layout.y - 400 * scale },
        end: { x: MARGIN + 1000 * scale, y: layout.y - 400 * scale },
        thickness: 0.5,
        color: LINE,
      });
      layout.y -= 400 * scale + 6;
    } else if (part?.seal?.payload.signature?.method === 'typed') {
      layout.text(`Getippter Name: ${part.seal.payload.signature.typedName}`, { size: 10 });
    }
    if (note) {
      layout.text(
        `Systemvermerk: ${note.signedAtLocal} (${note.timeZone}) = ${note.signedAtUtc} · ${note.os} · ` +
          `${note.browser} ${note.browserVersion} · ${note.language} · Eingabe: ${note.inputTypes.join(', ')} · App ${note.appVersion}`,
        { size: 7.5, color: MUTED },
      );
    }
    layout.text(`SHA-256 ${line.contentHash}`, { font: fonts.mono, size: 7, color: MUTED, gap: 8 });
  }
  layout.rule();
  for (const legal of definition.legalNotes)
    layout.text(legal, { size: 7.5, color: MUTED, gap: 2 });

  // --- Prüfblatt -------------------------------------------------------------------------------
  const text = packageText(buildPackage(questionnaire, form));
  const block = encodeDataLines(text, id);
  layout.newPage();
  layout.heading('Prüfblatt', 14);
  const verdict = verifyQuestionnaire(questionnaire, { registry: registryOf([form]) });
  const mono = { font: fonts.mono, size: 7.5 } as const;
  layout.text(`Fragebogen-ID: ${id}`, mono);
  layout.text(`Formular: ${definition.id} ${definition.version}`, mono);
  layout.text(`Formular-Hash: ${form.definitionHash}`, mono);
  layout.text(`SHA-256 Datenblock: ${block.sha256}`, { ...mono, gap: 4 });
  layout.text(ORIGIN_MESSAGES[origin], { size: 8.5, gap: 4 });
  layout.text(
    `Prüfung beim Erstellen der PDF (${formatLocalDateTime(input.created.local)} laut Gerät): ` +
      (verdict.level === 'ok'
        ? 'alle Teile unverändert seit ihrem Abschluss.'
        : verdict.level === 'warnings'
          ? 'unverändert, mit Hinweisen.'
          : 'fehlerhaft.'),
    { font: fonts.bold, size: 9 },
  );
  for (const part of verdict.parts) {
    const role = definition.roles.find((r) => r.id === part.role)?.label ?? part.role;
    layout.text(
      `${role}, Fassung ${part.version ?? '–'}: ${LEVEL_LABELS[part.level]}${part.confirmations.length ? ` (bestätigt durch ${part.confirmations.map((c) => (c.kind === 'seal' ? (definition.roles.find((r) => r.id === c.role)?.label ?? c.role) : c.station)).join(', ')})` : ''}`,
      { size: 8.5 },
    );
    layout.text(`  ${part.contentHash ?? ''}`, { font: fonts.mono, size: 7, color: MUTED });
  }
  for (const finding of [...verdict.findings, ...verdict.parts.flatMap((p) => p.findings)]) {
    layout.text(
      `Hinweis: ${FINDING_MESSAGES[finding.code]}${finding.detail.length ? ` (${finding.detail.join(', ')})` : ''}`,
      { size: 8 },
    );
  }
  for (const receipt of questionnaire.receipts) {
    layout.text(
      `Eingang ${receipt.station} (${receipt.source === 'datev' ? 'DATEV-Ablage' : 'App'}): ${formatLocalDateTime(receipt.receivedAtLocal)}, Datei ${receipt.fileName}`,
      { size: 8.5 },
    );
  }
  layout.rule();
  for (const sentence of [
    'Geprüft werden die Daten auf den Datenseiten am Ende, nicht der sichtbare Text vorn. Die App liest beim Öffnen die Datenseiten oder – bei einem Ausdruck – die QR-Codes.',
    'Die Unterschriften sind einfache elektronische Signaturen (Art. 3 Nr. 10 eIDAS-Verordnung). Zeitangaben und Systemvermerke stammen von den Geräten der Unterzeichnenden und sind deren Selbstauskunft.',
    'Die Hash-Werte zeigen versehentliche oder einfache Änderungen. Gegen eine vollständige Neuerzeugung schützen erst die Bestätigungen anderer Stationen und die Ablage in der DATEV-Personalakte.',
  ]) {
    layout.text(sentence, { size: 8, color: MUTED, gap: 3 });
  }

  // --- Data pages (text) ---------------------------------------------------------------------
  const LEADING = 9.4;
  let line = 0;
  while (line < block.lines.length) {
    const page = layout.newPage();
    let y = A4[1] - 50;
    page.drawText('Anlage: Daten in maschinenlesbarer Form', {
      x: MARGIN,
      y,
      size: 12,
      font: fonts.bold,
      color: INK,
    });
    y -= 16;
    page.drawText(
      'Nicht bearbeiten. Inhalt identisch mit den Angaben vorn; die App liest diese Seiten wieder ein.',
      { x: MARGIN, y, size: 8, font: fonts.sans, color: MUTED },
    );
    y -= 18;
    for (const header of block.header) {
      page.drawText(header, { x: MARGIN, y, size: 7.5, font: fonts.mono, color: INK });
      y -= LEADING;
    }
    y -= 5;
    while (line < block.lines.length && y > BOTTOM) {
      page.drawText(block.lines[line] ?? '', {
        x: MARGIN,
        y,
        size: 7.5,
        font: fonts.mono,
        color: INK,
      });
      y -= LEADING;
      line++;
    }
  }

  // --- Data pages (QR codes) ------------------------------------------------------------------
  const payloads = qrPayloads(block.compressed, id, block.sha256);
  const matrices = payloads.map(qrMatrix);
  const size = Math.max(...matrices.map((m) => m.length)) * QR_MODULE;
  const gap = QR_GAP_MODULES * QR_MODULE;
  const columns = Math.max(1, Math.floor((A4[0] - 2 * MARGIN + gap) / (size + gap)));
  let index = 0;
  while (index < matrices.length) {
    const page = layout.newPage();
    let top = A4[1] - 50;
    page.drawText('Anlage: Daten als QR-Codes (für Ausdrucke)', {
      x: MARGIN,
      y: top,
      size: 12,
      font: fonts.bold,
      color: INK,
    });
    top -= 16;
    page.drawText(
      printable(
        `Für den Papierweg: Die App liest diese ${matrices.length} Codes von einem Scan oder Foto. Reihenfolge egal; mehrere Fotos möglich.`,
      ),
      { x: MARGIN, y: top, size: 8, font: fonts.sans, color: MUTED },
    );
    top -= gap + 8;
    while (index < matrices.length && top - size > BOTTOM) {
      for (let column = 0; column < columns && index < matrices.length; column++, index++) {
        const matrix = matrices[index] ?? [];
        const left = MARGIN + column * (size + gap);
        // One rectangle per horizontal run of dark modules keeps the content stream small.
        matrix.forEach((row, r) => {
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
      top -= size + gap;
    }
  }

  // --- Footer ----------------------------------------------------------------------------------
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    page.drawText(
      `Fragebogen-ID ${id.slice(0, 8)} · Daten ${block.sha256.slice(0, 8)} · Formular ${definition.id} ${definition.version} · Seite ${i + 1} von ${pages.length}`,
      { x: MARGIN, y: 28, size: 7.5, font: fonts.sans, color: MUTED },
    );
  });

  doc.convertToPDFA({ conformance: '2U' });
  // Without object streams every dictionary stays readable: anyone can check that the file holds
  // no script, no attachment and no launch action (Gemeinsame Grundsätze § 9a BVV).
  const bytes = await doc.save({ useObjectStreams: false });
  return {
    bytes,
    fileName: fileNameFor(definition.id, id, complete ? 'complete' : 'handover'),
    complete,
    pages: pages.length,
    dataLines: block.lines.length,
    qrCodes: payloads.length,
  };
}
