// PDF out and in for the UI. Out: only without transmission blockers (no transmission without
// signature), one PDF with data pages and QR codes. In: the data pages of an original PDF, or —
// for a print-out — the QR codes of a scanned PDF or of photos, collected over several files.
// Every import is verified and the result shown; what was checked is said plainly. A PDF may be
// protected by a password (Tobias 2026-11-06): asked for while it is read, never stored.
import boldUrl from '../../assets/fonts/NotoSans-SemiBold.subset.ttf?inline';
import sansUrl from '../../assets/fonts/NotoSans-Regular.subset.ttf?inline';
import monoUrl from '../../assets/fonts/NotoSansMono-Regular.subset.ttf?inline';
import { APP_VERSION } from '../appInfo';
import { APP_CONFIG } from '../config';
import { deviceForReport, deviceNow, type DeviceNow } from '../io/environment';
import { handOut, readFileBytes } from '../io/files';
import {
  editClues,
  EDIT_CLUE_MESSAGES,
  imageFileToRgba,
  passwordIssue,
  readPdfText,
  renderPdfPages,
  type PdfJsLike,
  type PdfText,
} from '../io/pdfReader';
import { writeQuestionnairePdf } from '../io/pdfWriter';
import { writeSheetPdf, type SheetPdfInput } from '../io/sheetPdf';
import { writeTestReportPdf } from '../io/testReportPdf';
import { readQrCodes } from '../io/qr';
import { decodePackage, ORIGIN_MESSAGES } from '../logic/dataPackage';
import { DATA_LINES_MESSAGES, decodeDataLines } from '../logic/dataPages';
import { registryOf, type FormRegistry } from '../logic/formRegistry';
import { sha256Hex } from '../logic/hash';
import { pdfPasswordCandidates } from '../logic/passwords';
import { assembleQrPayloads, QR_MESSAGES } from '../logic/qrParts';
import { BLOCKER_MESSAGES, transmissionBlockers } from '../logic/requirements';
import { markSaved, sessionFromFile, type Arrival, type Session } from '../logic/session';
import type { TestRun } from '../logic/testRun';
import {
  parseTransferFragment,
  TRANSFER_LINK_MESSAGES,
  transferPackageText,
  type TransferLinkIssue,
} from '../logic/transferLink';
import { FINDING_MESSAGES, verifyQuestionnaire } from '../logic/verify';
import type { BannerMessage } from './common';

function dataUrlBytes(url: string): Uint8Array {
  const binary = atob(url.slice(url.indexOf(',') + 1));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

let pdfjsModule: Promise<PdfJsLike> | undefined;

/** pdf.js runs in the main thread: file:// forbids blob: workers (spike, docs/spike-pdf.md). */
function pdfjs(): Promise<PdfJsLike> {
  pdfjsModule ??= (async () => {
    const [library, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs'),
    ]);
    (globalThis as unknown as { pdfjsWorker: unknown }).pdfjsWorker = worker;
    return library as unknown as PdfJsLike;
  })();
  return pdfjsModule;
}

export async function createPdf(
  session: Session,
  password?: string,
): Promise<{ session: Session; message: BannerMessage }> {
  const blockers = transmissionBlockers(session.questionnaire, session.form);
  if (blockers.length > 0) {
    return {
      session,
      message: {
        tone: 'error',
        text: 'Die PDF kann noch nicht erstellt werden:',
        detail: blockers.map(
          (b) => `${BLOCKER_MESSAGES[b.code]}${b.detail.length ? ` (${b.detail.join(', ')})` : ''}`,
        ),
      },
    };
  }
  try {
    const now = deviceNow();
    const result = await writeQuestionnairePdf(
      {
        questionnaire: session.questionnaire,
        form: session.form,
        origin: session.origin,
        config: APP_CONFIG,
        created: { local: now.local, utc: now.utc },
        ...(password === undefined ? {} : { password }),
      },
      { sans: dataUrlBytes(sansUrl), bold: dataUrlBytes(boldUrl), mono: dataUrlBytes(monoUrl) },
    );
    const file = handOut(result.fileName, result.bytes, 'application/pdf');
    return {
      session: markSaved(session),
      message: {
        file,
        tone: 'success',
        text: result.protected
          ? `PDF „${result.fileName}“ erstellt, mit Kennwort geschützt – zur Weitergabe an die nächste Station. Das Kennwort bitte auf einem anderen Weg weitergeben als die Datei.`
          : result.complete
            ? `PDF „${result.fileName}“ erstellt: vollständig. Bitte die Datei selbst weitergeben oder in der Personalakte ablegen.`
            : `PDF „${result.fileName}“ erstellt – zur Weitergabe an die nächste Station. Sie enthält alle bisherigen Teile.`,
        detail: [
          `${result.pages} Seiten, davon die letzten mit ${result.qrCodes} QR-Codes für den Papierweg.`,
          ...(result.protected ? [PROTECTED_PDF_NOTE] : []),
        ],
      },
    };
  } catch (error) {
    return {
      session,
      message: {
        tone: 'error',
        text: 'Die PDF ließ sich nicht erstellen.',
        detail: [String(error)],
      },
    };
  }
}

/** The Erfassungsblatt of a hand-over as a PDF of its own for the Personalakte. */
export async function createSheetPdf(
  input: Omit<SheetPdfInput, 'config' | 'created'>,
): Promise<BannerMessage> {
  try {
    const now = deviceNow();
    const result = await writeSheetPdf(
      { ...input, config: APP_CONFIG, created: { local: now.local, utc: now.utc } },
      { sans: dataUrlBytes(sansUrl), bold: dataUrlBytes(boldUrl), mono: dataUrlBytes(monoUrl) },
    );
    const file = handOut(result.fileName, result.bytes, 'application/pdf');
    return {
      file,
      tone: 'success',
      text: `Erfassungsblatt „${result.fileName}“ erstellt (${result.pages} Seiten) – zur Ablage in der Personalakte.`,
    };
  } catch (error) {
    return {
      tone: 'error',
      text: 'Das Erfassungsblatt ließ sich nicht als PDF erstellen.',
      detail: [String(error)],
    };
  }
}

/** The tester's report of the test page (test folder build only). */
export async function createTestReportPdf(
  run: TestRun,
  cases: readonly { id: string; title: string; area: string; version?: string }[],
): Promise<BannerMessage> {
  try {
    const now = deviceNow();
    const result = await writeTestReportPdf(
      {
        run,
        cases,
        appVersion: APP_VERSION,
        device: deviceForReport(),
        created: { local: now.local, utc: now.utc },
      },
      { sans: dataUrlBytes(sansUrl), bold: dataUrlBytes(boldUrl), mono: dataUrlBytes(monoUrl) },
    );
    const file = handOut(result.fileName, result.bytes, 'application/pdf');
    return {
      file,
      tone: 'success',
      text: `Testbericht „${result.fileName}“ erstellt (${result.pages} Seiten). Bitte per E-Mail an die Kanzlei schicken.`,
    };
  } catch (error) {
    return {
      tone: 'error',
      text: 'Der Testbericht ließ sich nicht als PDF erstellen.',
      detail: [String(error)],
    };
  }
}

export type OpenResult =
  | { kind: 'session'; session: Session; altered: boolean; message: BannerMessage }
  | { kind: 'partial'; collected: Uint8Array[]; message: BannerMessage }
  | { kind: 'error'; message: BannerMessage };

/**
 * Decodes and verifies a package text; the message says what was checked and what was found.
 * `warnings` (clues of later editing) colour the message like a finding; `notes` only inform.
 */
export function fromPackageText(
  text: string,
  registry: FormRegistry,
  arrival: Arrival,
  notes: readonly string[],
  warnings: readonly string[] = [],
): OpenResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      kind: 'error',
      message: { tone: 'error', text: 'Die Daten der Datei sind beschädigt.' },
    };
  }
  const decoded = decodePackage(raw, registry);
  if (!decoded.ok) {
    return {
      kind: 'error',
      message: {
        tone: 'error',
        text: 'Die Daten der Datei passen nicht zum Format dieser App.',
        detail: decoded.issues.slice(0, 5).map((issue) => `${issue.path}: ${issue.message}`),
      },
    };
  }
  const verdict = verifyQuestionnaire(decoded.questionnaire, {
    registry: registryOf([decoded.form]),
  });
  const findings = [...verdict.findings, ...verdict.parts.flatMap((part) => part.findings)].map(
    (f) => `${FINDING_MESSAGES[f.code]}${f.detail.length ? ` (${f.detail.join(', ')})` : ''}`,
  );
  const tone =
    verdict.level === 'invalid'
      ? 'error'
      : findings.length > 0 || warnings.length > 0 || decoded.origin === 'embedded'
        ? 'warning'
        : 'success';
  return {
    kind: 'session',
    session: sessionFromFile(decoded, arrival),
    altered: verdict.level === 'invalid',
    message: {
      tone,
      text:
        verdict.level === 'invalid'
          ? 'Geprüft: Mindestens ein Teil wurde nach dem Abschluss verändert.'
          : 'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.',
      detail: [
        ...(decoded.origin === 'embedded' ? [ORIGIN_MESSAGES.embedded] : []),
        ...notes,
        ...warnings,
        ...findings,
      ],
    },
  };
}

/** Reassembles QR payloads (with those of earlier photos); missing parts ask for another file. */
export function fromQr(
  payloads: Uint8Array[],
  registry: FormRegistry,
  arrival: Arrival,
  notFound: string,
): OpenResult {
  const assembled = assembleQrPayloads(payloads);
  if (assembled.ok) {
    return fromPackageText(assembled.text, registry, arrival, [
      'Gelesen aus den QR-Codes eines Ausdrucks. Das Original bleibt die elektronische Datei.',
      ...(assembled.ignored > 0 ? [QR_MESSAGES.foreignCodes] : []),
    ]);
  }
  if (assembled.issue === 'missing') {
    return {
      kind: 'partial',
      collected: payloads,
      message: {
        tone: 'info',
        text: `QR-Codes: ${assembled.found ?? 0} von ${assembled.total ?? '?'} gelesen. Bitte ein weiteres Foto oder einen Scan mit den fehlenden Codes öffnen.`,
        detail: assembled.detail,
      },
    };
  }
  return {
    kind: 'error',
    message: {
      tone: 'error',
      text: assembled.issue === 'noCodes' ? notFound : QR_MESSAGES[assembled.issue],
      detail: assembled.detail,
    },
  };
}

const linkError = (issue: TransferLinkIssue): OpenResult => ({
  kind: 'error',
  message: { tone: 'error', text: `Link zur Weitergabe: ${TRANSFER_LINK_MESSAGES[issue]}` },
});

/**
 * Opens a link that passes a questionnaire on (Tobias 2026-11-05) like a file read in; undefined
 * when the hash is no such link, or a protected one — that opens with its password first
 * (UnlockLinkScreen), then through `fromTransferText`.
 */
export function fromTransferLink(hash: string, registry: FormRegistry): OpenResult | undefined {
  const parsed = parseTransferFragment(hash);
  if (parsed === undefined) return undefined;
  if (!parsed.ok) return linkError(parsed.issue);
  if (parsed.kind === 'locked') return undefined;
  return fromTransferText(
    parsed.questionnaireText,
    registry,
    'Aus einem Link zur Weitergabe geöffnet.',
  );
}

/** The questionnaire of a link; its SHA-256 is that of the package text, as for a file. */
export function fromTransferText(
  questionnaireText: string,
  registry: FormRegistry,
  note: string,
): OpenResult {
  const opened = transferPackageText(questionnaireText, (h) => registry.byHash(h)?.definition);
  if (!opened.ok) return linkError(opened.issue);
  const received = deviceNow();
  return fromPackageText(
    opened.text,
    registry,
    {
      local: received.local,
      utc: received.utc,
      source: 'file',
      fileSha256: sha256Hex(new TextEncoder().encode(opened.text)),
    },
    [note],
  );
}

/** What a protected PDF is not: an archive copy. */
export const PROTECTED_PDF_NOTE =
  'Mit Kennwort ist die PDF keine PDF/A. Zur Ablage erstellt die Kanzlei nach dem Einlesen eine PDF ohne Kennwort.';

/** Asks for the password of a protected file; undefined when the person gives up. */
export type AskPassword = (fileName: string, wrong: boolean) => Promise<string | undefined>;

/**
 * The text of a PDF; a protected one asks for its password until one fits (tried as typed and in
 * the form the app proposes) or the person gives up.
 */
async function readPdfAsked(
  library: PdfJsLike,
  bytes: Uint8Array,
  fileName: string,
  ask: AskPassword | undefined,
): Promise<{ text: PdfText; password?: string } | 'cancelled'> {
  try {
    return { text: await readPdfText(library, bytes) };
  } catch (error) {
    if (passwordIssue(error) === undefined) throw error;
  }
  if (ask === undefined) return 'cancelled';
  for (let wrong = false; ; wrong = true) {
    const typed = await ask(fileName, wrong);
    if (typed === undefined) return 'cancelled';
    for (const password of pdfPasswordCandidates(typed)) {
      try {
        return { text: await readPdfText(library, bytes, password), password };
      } catch (error) {
        if (passwordIssue(error) !== 'wrong') throw error;
      }
    }
  }
}

/**
 * Reads any file this app writes — interim JSON, PDF (data pages, else the QR codes of a scan) or a
 * photo of QR codes, together with codes collected from earlier photos.
 */
export async function openAnyFile(
  file: File,
  registry: FormRegistry,
  collected: readonly Uint8Array[],
  ask?: AskPassword,
): Promise<{ result: OpenResult; fileSha256?: string; received: DeviceNow }> {
  const received = deviceNow();
  const read = await readFileBytes(file);
  if (!read.ok) {
    return { result: { kind: 'error', message: { tone: 'error', text: read.message } }, received };
  }
  const fileSha256 = sha256Hex(read.bytes);
  const arrival = { local: received.local, utc: received.utc, source: 'file' as const, fileSha256 };
  const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
  const result = isJson
    ? fromPackageText(new TextDecoder().decode(read.bytes), registry, arrival, [
        'Zwischenstand geöffnet.',
      ])
    : await openPdfOrImage(file, read.bytes, registry, arrival, collected, ask);
  return { result, fileSha256, received };
}

/** A PDF (data pages, else the QR codes of a scan) or an image (QR codes), with earlier photos. */
export async function openPdfOrImage(
  file: File,
  bytes: Uint8Array,
  registry: FormRegistry,
  arrival: Arrival,
  collected: readonly Uint8Array[],
  ask?: AskPassword,
): Promise<OpenResult> {
  try {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      const image = await imageFileToRgba(file);
      return fromQr([...collected, ...readQrCodes(image)], registry, arrival, QR_MESSAGES.noCodes);
    }
    const library = await pdfjs();
    const read = await readPdfAsked(library, bytes, file.name, ask);
    if (read === 'cancelled') {
      return {
        kind: 'error',
        message: {
          tone: 'error',
          text: `„${file.name}“ ist mit einem Kennwort geschützt. Ohne das Kennwort lässt sich die PDF nicht öffnen.`,
        },
      };
    }
    const { text, password } = read;
    const lines = decodeDataLines(text.lines);
    if (lines.ok) {
      const clues = editClues(bytes, text.producer).map((clue) => EDIT_CLUE_MESSAGES[clue]);
      return fromPackageText(
        lines.text,
        registry,
        arrival,
        [
          'Geprüft wurden die Datenseiten, nicht der sichtbare Text.',
          ...(password === undefined ? [] : ['Die PDF war mit einem Kennwort geschützt.']),
        ],
        clues,
      );
    }
    if (lines.issue !== 'notFound') {
      return {
        kind: 'error',
        message: { tone: 'error', text: DATA_LINES_MESSAGES[lines.issue], detail: lines.detail },
      };
    }
    // No text data pages: a scan or a print-to-PDF. Look for the QR codes on the pages.
    const payloads = (await renderPdfPages(library, bytes, readQrCodes, password)).flat();
    return fromQr([...collected, ...payloads], registry, arrival, DATA_LINES_MESSAGES.notFound);
  } catch (error) {
    return {
      kind: 'error',
      message: {
        tone: 'error',
        text: 'Die Datei lässt sich nicht lesen.',
        detail: [String(error)],
      },
    };
  }
}
