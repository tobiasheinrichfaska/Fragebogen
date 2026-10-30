// PDF out and in for the UI. Out: only without transmission blockers (no transmission without
// signature), one PDF with data pages and QR codes. In: the data pages of an original PDF, or —
// for a print-out — the QR codes of a scanned PDF or of photos, collected over several files.
// Every import is verified and the result shown; what was checked is said plainly.
import boldUrl from '../../assets/fonts/NotoSans-SemiBold.subset.ttf?inline';
import sansUrl from '../../assets/fonts/NotoSans-Regular.subset.ttf?inline';
import monoUrl from '../../assets/fonts/NotoSansMono-Regular.subset.ttf?inline';
import { APP_CONFIG } from '../config';
import { deviceNow } from '../io/environment';
import { downloadFile } from '../io/files';
import {
  editClues,
  EDIT_CLUE_MESSAGES,
  imageFileToRgba,
  readPdfText,
  renderPdfPages,
  type PdfJsLike,
} from '../io/pdfReader';
import { writeQuestionnairePdf } from '../io/pdfWriter';
import { readQrCodes } from '../io/qr';
import { decodePackage, ORIGIN_MESSAGES } from '../logic/dataPackage';
import { DATA_LINES_MESSAGES, decodeDataLines } from '../logic/dataPages';
import { registryOf, type FormRegistry } from '../logic/formRegistry';
import { assembleQrPayloads, QR_MESSAGES } from '../logic/qrParts';
import { BLOCKER_MESSAGES, transmissionBlockers } from '../logic/requirements';
import { markSaved, sessionFromFile, type Arrival, type Session } from '../logic/session';
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
      },
      { sans: dataUrlBytes(sansUrl), bold: dataUrlBytes(boldUrl), mono: dataUrlBytes(monoUrl) },
    );
    downloadFile(result.fileName, result.bytes, 'application/pdf');
    return {
      session: markSaved(session),
      message: {
        tone: 'success',
        text: result.complete
          ? `PDF „${result.fileName}“ erstellt: vollständig. Bitte die Datei selbst weitergeben oder in der Personalakte ablegen.`
          : `PDF „${result.fileName}“ erstellt – zur Weitergabe an die nächste Station. Sie enthält alle bisherigen Teile.`,
        detail: [
          `${result.pages} Seiten, davon die letzten mit ${result.qrCodes} QR-Codes für den Papierweg.`,
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

export type OpenResult =
  | { kind: 'session'; session: Session; altered: boolean; message: BannerMessage }
  | { kind: 'partial'; collected: Uint8Array[]; message: BannerMessage }
  | { kind: 'error'; message: BannerMessage };

/** Decodes and verifies a package text; the message says what was checked and what was found. */
export function fromPackageText(
  text: string,
  registry: FormRegistry,
  arrival: Arrival,
  notes: readonly string[],
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
      : findings.length > 0 || decoded.origin === 'embedded'
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

/** A PDF (data pages, else the QR codes of a scan) or an image (QR codes), with earlier photos. */
export async function openPdfOrImage(
  file: File,
  bytes: Uint8Array,
  registry: FormRegistry,
  arrival: Arrival,
  collected: readonly Uint8Array[],
): Promise<OpenResult> {
  try {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      const image = await imageFileToRgba(file);
      return fromQr([...collected, ...readQrCodes(image)], registry, arrival, QR_MESSAGES.noCodes);
    }
    const library = await pdfjs();
    const text = await readPdfText(library, bytes);
    const lines = decodeDataLines(text.lines);
    if (lines.ok) {
      const clues = editClues(bytes, text.producer).map((clue) => EDIT_CLUE_MESSAGES[clue]);
      return fromPackageText(lines.text, registry, arrival, [
        'Geprüft wurden die Datenseiten, nicht der sichtbare Text.',
        ...clues,
      ]);
    }
    if (lines.issue !== 'notFound') {
      return {
        kind: 'error',
        message: { tone: 'error', text: DATA_LINES_MESSAGES[lines.issue], detail: lines.detail },
      };
    }
    // No text data pages: a scan or a print-to-PDF. Look for the QR codes on the pages.
    const payloads = (await renderPdfPages(library, bytes)).flatMap(readQrCodes);
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
