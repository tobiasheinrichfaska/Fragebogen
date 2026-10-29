// Data pages, format version 1 (docs/spike-pdf.md): the package text, deflated (raw, level 9),
// base64url without padding, in numbered lines with a per-line checksum. Reading tolerates any line
// order and extra whitespace (pdf.js output) and names every bad or missing line. The overall
// check is length + SHA-256 of the UNcompressed text, so it does not depend on the compressor.
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { sha256Hex } from './hash';

export const DATA_PAGES_TAG = 'FRAGEBOGEN-DATEN';
export const DATA_PAGES_VERSION = 1;
export const CHARS_PER_LINE = 96;
/** Largest package text accepted when reading (a questionnaire is a few kB). */
export const MAX_PACKAGE_BYTES = 2_000_000;

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64URL_VALUES = new Map([...B64URL].map((char, i) => [char, i]));

export function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let k = 0; k < chars; k++) out += B64URL.charAt((n >> (18 - 6 * k)) & 63);
  }
  return out;
}

/** Strict: only base64url characters, no padding; undefined otherwise. */
export function fromBase64Url(text: string): Uint8Array | undefined {
  if (text.length % 4 === 1) return undefined;
  const out = new Uint8Array(Math.floor((text.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of text) {
    const value = B64URL_VALUES.get(char);
    if (value === undefined) return undefined;
    buffer = ((buffer << 6) | value) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
    }
  }
  return out;
}

export function compressPackage(text: string): Uint8Array {
  return deflateSync(strToU8(text), { level: 9 });
}

export type InflateResult =
  | { ok: true; text: string }
  | { ok: false; issue: 'corrupt' | 'tooLarge' | 'lengthMismatch' | 'digestMismatch' };

/** Inflates and checks the text against the expected length (if given) and SHA-256 prefix. */
export function inflatePackage(
  compressed: Uint8Array,
  expected: { sha256Prefix: string; length?: number },
): InflateResult {
  let bytes: Uint8Array;
  try {
    bytes = inflateSync(compressed);
  } catch {
    return { ok: false, issue: 'corrupt' };
  }
  if (bytes.length > MAX_PACKAGE_BYTES) return { ok: false, issue: 'tooLarge' };
  if (expected.length !== undefined && bytes.length !== expected.length) {
    return { ok: false, issue: 'lengthMismatch' };
  }
  if (!sha256Hex(bytes).startsWith(expected.sha256Prefix)) {
    return { ok: false, issue: 'digestMismatch' };
  }
  try {
    return { ok: true, text: strFromU8(bytes) };
  } catch {
    return { ok: false, issue: 'corrupt' };
  }
}

function lineChecksum(lineNumber: number, chunk: string): string {
  return sha256Hex(strToU8(`${lineNumber}:${chunk}`)).slice(0, 4);
}

export interface DataLines {
  /** Two header lines — each must fit the page width, or pdf.js drops the clipped glyphs. */
  header: [string, string];
  lines: string[];
  /** SHA-256 of the uncompressed package text. */
  sha256: string;
  compressed: Uint8Array;
  textBytes: number;
}

export function encodeDataLines(packageText: string, questionnaireId: string): DataLines {
  const raw = strToU8(packageText);
  const digest = sha256Hex(raw);
  const compressed = deflateSync(raw, { level: 9 });
  const encoded = toBase64Url(compressed);
  const lines: string[] = [];
  for (let i = 0, n = 1; i < encoded.length; i += CHARS_PER_LINE, n++) {
    const chunk = encoded.slice(i, i + CHARS_PER_LINE);
    lines.push(`${String(n).padStart(4, '0')} ${chunk} ${lineChecksum(n, chunk)}`);
  }
  return {
    header: [
      `${DATA_PAGES_TAG} ${DATA_PAGES_VERSION} ID ${questionnaireId} ZEILEN ${lines.length} BYTES ${raw.length}`,
      `SHA256 ${digest}`,
    ],
    lines,
    sha256: digest,
    compressed,
    textBytes: raw.length,
  };
}

export type DataLinesIssue =
  | 'notFound'
  | 'unknownVersion'
  | 'digestLineMissing'
  | 'badLines'
  | 'corrupt'
  | 'tooLarge'
  | 'lengthMismatch'
  | 'digestMismatch';

export const DATA_LINES_MESSAGES: Readonly<Record<DataLinesIssue, string>> = {
  notFound:
    'Diese PDF enthält keine lesbaren Datenseiten. Bitte die Originaldatei verwenden, keinen Ausdruck oder Scan – oder die QR-Codes einlesen.',
  unknownVersion: 'Die Datenseiten stammen aus einer neueren Version der App.',
  digestLineMissing: 'Die Datenseiten sind unvollständig: Die Prüfzeile fehlt.',
  badLines: 'Einzelne Datenzeilen fehlen oder sind beschädigt.',
  corrupt: 'Die Datenseiten lassen sich nicht entpacken. Die Datei ist beschädigt.',
  tooLarge: 'Die Datenseiten sind ungewöhnlich groß und werden nicht gelesen.',
  lengthMismatch: 'Die Datenseiten passen nicht zu ihrer Längenangabe.',
  digestMismatch: 'Die Datenseiten passen nicht zu ihrer Prüfsumme.',
};

export type DecodedDataLines =
  | { ok: true; text: string; questionnaireId: string; lineCount: number }
  | { ok: false; issue: DataLinesIssue; detail: readonly string[] };

const HEADER = /^FRAGEBOGEN-DATEN (\d+) ID ([0-9a-f-]{36}) ZEILEN (\d{1,6}) BYTES (\d{1,9})$/;
const DIGEST = /^SHA256 ([0-9a-f]{64})$/;
const LINE = /^(\d{4,6}) ([A-Za-z0-9_-]{1,96}) ([0-9a-f]{4})$/;

/** Reads the data block from text lines in any order; whitespace inside a line is collapsed. */
export function decodeDataLines(textLines: readonly string[]): DecodedDataLines {
  const lines = textLines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const header = lines.map((line) => HEADER.exec(line)).find((match) => match !== null);
  if (!header) return { ok: false, issue: 'notFound', detail: [] };
  const [, version = '', questionnaireId = '', count = '0', length = '0'] = header;
  if (Number(version) !== DATA_PAGES_VERSION) {
    return { ok: false, issue: 'unknownVersion', detail: [version] };
  }
  const digest = lines.map((line) => DIGEST.exec(line)?.[1]).find((match) => match !== undefined);
  if (digest === undefined) return { ok: false, issue: 'digestLineMissing', detail: [] };
  if (Number(length) > MAX_PACKAGE_BYTES) return { ok: false, issue: 'tooLarge', detail: [length] };

  const total = Number(count);
  const chunks = new Map<number, string>();
  const damaged = new Set<number>();
  for (const line of lines) {
    const match = LINE.exec(line);
    if (!match) continue;
    const number = Number(match[1]);
    const chunk = match[2] ?? '';
    if (lineChecksum(number, chunk) === match[3]) chunks.set(number, chunk);
    else damaged.add(number);
  }
  const problems: string[] = [];
  for (let n = 1; n <= total; n++) {
    if (chunks.has(n)) continue;
    problems.push(damaged.has(n) ? `Zeile ${n} beschädigt` : `Zeile ${n} fehlt`);
  }
  if (problems.length > 0) return { ok: false, issue: 'badLines', detail: problems };

  let encoded = '';
  for (let n = 1; n <= total; n++) encoded += chunks.get(n) ?? '';
  const compressed = fromBase64Url(encoded);
  if (!compressed) return { ok: false, issue: 'corrupt', detail: [] };
  const inflated = inflatePackage(compressed, { sha256Prefix: digest, length: Number(length) });
  if (!inflated.ok) return { ok: false, issue: inflated.issue, detail: [] };
  return { ok: true, text: inflated.text, questionnaireId, lineCount: total };
}
