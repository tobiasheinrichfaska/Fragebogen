// QR codes for the paper path (decided 2026-10-29): the same deflated package as the data pages,
// split into numbered parts. Each QR payload is binary (byte mode): an ASCII header line
// "FBQ1 <questionnaireId> <i>/<n> <first 16 hex of the text's SHA-256>\n" followed by the chunk.
// Parts may be scanned in any order, from several photos, and twice; a missing, foreign or
// conflicting part is named. The assembled text is then checked like the data pages.
import { inflatePackage } from './dataPages';

export const QR_TAG = 'FBQ1';
/** Bytes of package data per code: about QR version 22 at error correction M (≈ 5 cm printed). */
export const QR_CHUNK_BYTES = 700;
export const QR_MAX_PARTS = 99;

const NEWLINE = 0x0a;
const HEADER = /^FBQ1 ([0-9a-f-]{36}) (\d{1,2})\/(\d{1,2}) ([0-9a-f]{16})$/;

export function qrPayloads(
  compressed: Uint8Array,
  questionnaireId: string,
  sha256: string,
): Uint8Array[] {
  const total = Math.max(1, Math.ceil(compressed.length / QR_CHUNK_BYTES));
  if (total > QR_MAX_PARTS) throw new RangeError(`Package needs ${total} QR codes`);
  return Array.from({ length: total }, (_, i) => {
    const header = new TextEncoder().encode(
      `${QR_TAG} ${questionnaireId} ${i + 1}/${total} ${sha256.slice(0, 16)}\n`,
    );
    const chunk = compressed.subarray(i * QR_CHUNK_BYTES, (i + 1) * QR_CHUNK_BYTES);
    const payload = new Uint8Array(header.length + chunk.length);
    payload.set(header);
    payload.set(chunk, header.length);
    return payload;
  });
}

interface Part {
  questionnaireId: string;
  index: number;
  total: number;
  digest: string;
  chunk: Uint8Array;
}

function parsePart(payload: Uint8Array): Part | undefined {
  const end = payload.indexOf(NEWLINE);
  if (end < 0 || end > 80) return undefined;
  const match = HEADER.exec(String.fromCharCode(...payload.subarray(0, end)));
  if (!match) return undefined;
  const index = Number(match[2]);
  const total = Number(match[3]);
  if (index < 1 || index > total) return undefined;
  return {
    questionnaireId: match[1] ?? '',
    index,
    total,
    digest: match[4] ?? '',
    chunk: payload.subarray(end + 1),
  };
}

export type QrIssue =
  | 'noCodes'
  | 'foreignCodes'
  | 'mixed'
  | 'conflict'
  | 'missing'
  | 'corrupt'
  | 'tooLarge'
  | 'digestMismatch';

export const QR_MESSAGES: Readonly<Record<QrIssue, string>> = {
  noCodes: 'Es wurde kein QR-Code dieser App gefunden.',
  foreignCodes: 'Einige QR-Codes stammen nicht von dieser App und wurden übergangen.',
  mixed:
    'Die QR-Codes gehören zu verschiedenen Fragebögen oder Fassungen. Bitte nur eine PDF auf einmal einlesen.',
  conflict: 'Zwei QR-Codes mit derselben Nummer haben verschiedenen Inhalt.',
  missing: 'Es fehlen noch QR-Codes.',
  corrupt: 'Die QR-Codes lassen sich nicht entpacken.',
  tooLarge: 'Die QR-Codes enthalten ungewöhnlich viele Daten und werden nicht gelesen.',
  digestMismatch: 'Die QR-Codes passen nicht zu ihrer Prüfsumme.',
};

export type AssembledQr =
  | { ok: true; text: string; questionnaireId: string; total: number; ignored: number }
  | { ok: false; issue: QrIssue; detail: readonly string[]; found?: number; total?: number };

/** Reassembles decoded QR payloads (any order, duplicates allowed) into the package text. */
export function assembleQrPayloads(payloads: readonly Uint8Array[]): AssembledQr {
  const parts = payloads.map(parsePart);
  const ours = parts.filter((part): part is Part => part !== undefined);
  const ignored = parts.length - ours.length;
  if (ours.length === 0) return { ok: false, issue: 'noCodes', detail: [] };
  const groups = new Set(ours.map((p) => `${p.questionnaireId} ${p.total} ${p.digest}`));
  if (groups.size > 1) return { ok: false, issue: 'mixed', detail: [...groups].sort() };

  const [first] = ours;
  const total = first?.total ?? 0;
  const byIndex = new Map<number, Uint8Array>();
  for (const part of ours) {
    const known = byIndex.get(part.index);
    if (known && !sameBytes(known, part.chunk)) {
      return { ok: false, issue: 'conflict', detail: [`Teil ${part.index}`] };
    }
    byIndex.set(part.index, part.chunk);
  }
  const missing: string[] = [];
  for (let i = 1; i <= total; i++) if (!byIndex.has(i)) missing.push(`Teil ${i} von ${total}`);
  if (missing.length > 0) {
    return { ok: false, issue: 'missing', detail: missing, found: byIndex.size, total };
  }

  const length = [...byIndex.values()].reduce((sum, chunk) => sum + chunk.length, 0);
  const compressed = new Uint8Array(length);
  let offset = 0;
  for (let i = 1; i <= total; i++) {
    const chunk = byIndex.get(i) ?? new Uint8Array();
    compressed.set(chunk, offset);
    offset += chunk.length;
  }
  const inflated = inflatePackage(compressed, { sha256Prefix: first?.digest ?? '' });
  if (!inflated.ok)
    return {
      ok: false,
      issue: inflated.issue === 'lengthMismatch' ? 'corrupt' : inflated.issue,
      detail: [],
    };
  return {
    ok: true,
    text: inflated.text,
    questionnaireId: first?.questionnaireId ?? '',
    total,
    ignored,
  };
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}
