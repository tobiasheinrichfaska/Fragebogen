// Master data carried in a bookmark link (Tobias, 2026-10-29: option C, no browser storage). The
// app address gets a fragment such as #stammdaten=1&betriebsnummer=12345678&firma=Beispiel+GmbH.
// A fragment never reaches the server, but it stays in bookmarks and the browser history, which
// is acceptable for the employer's own data only. Parsing is strict and all-or-nothing; the
// result is still untrusted and goes through applyMasterData (setValue) like typed input.
import { ID } from './formDefinition';
import type { MasterData } from './masterData';

const MARKER = 'stammdaten';
export const MASTER_DATA_LINK_VERSION = '1';
/** Longest fragment accepted or produced (links far below any browser or messenger limit). */
export const MASTER_DATA_LINK_MAX_LENGTH = 2000;
export const MASTER_DATA_LINK_MAX_KEYS = 32;

export type MasterDataLinkIssue =
  | 'tooLong'
  | 'unknownVersion'
  | 'tooManyKeys'
  | 'invalidKey'
  | 'duplicateKey'
  | 'emptyValue'
  | 'unreadableValue';

export const MASTER_DATA_LINK_MESSAGES: Readonly<Record<MasterDataLinkIssue, string>> = {
  tooLong: 'Der Link ist zu lang für Stammdaten. Bitte einen neuen Link erzeugen.',
  unknownVersion:
    'Dieser Stammdaten-Link stammt aus einer anderen Version der App und kann nicht gelesen werden.',
  tooManyKeys: 'Der Link enthält zu viele Angaben für Stammdaten.',
  invalidKey: 'Der Link enthält eine unbekannte oder ungültige Angabe.',
  duplicateKey: 'Der Link enthält eine Angabe doppelt.',
  emptyValue: 'Der Link enthält eine leere Angabe.',
  unreadableValue: 'Der Link ist beschädigt: Eine Angabe lässt sich nicht lesen.',
};

/** What URLSearchParams yields for a broken percent-encoding. */
const REPLACEMENT_CHARACTER = '\u{FFFD}';

export type MasterDataLinkResult =
  | { ok: true; fragment: string }
  | { ok: false; issue: MasterDataLinkIssue; detail: readonly string[] };

/** The fragment (with "#") for a bookmark; keys sorted, so equal data gives an equal link. */
export function masterDataFragment(data: MasterData): MasterDataLinkResult {
  const entries = Object.entries(data).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (entries.length > MASTER_DATA_LINK_MAX_KEYS) {
    return { ok: false, issue: 'tooManyKeys', detail: [String(entries.length)] };
  }
  const params = new URLSearchParams([[MARKER, MASTER_DATA_LINK_VERSION]]);
  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new RangeError(`Master datum "${key}" is not a text value`);
    }
    if (!ID.test(key)) return { ok: false, issue: 'invalidKey', detail: [key] };
    if (value === '') return { ok: false, issue: 'emptyValue', detail: [key] };
    params.append(key, value);
  }
  const fragment = `#${params.toString()}`;
  return fragment.length > MASTER_DATA_LINK_MAX_LENGTH
    ? { ok: false, issue: 'tooLong', detail: [String(fragment.length)] }
    : { ok: true, fragment };
}

export type ParsedMasterDataLink =
  | { ok: true; data: MasterData | undefined }
  | { ok: false; issue: MasterDataLinkIssue; detail: readonly string[] };

/**
 * Reads master data from a location hash (with or without "#"). A hash without the marker is not
 * a master-data link (`data: undefined`); a marked but malformed one is refused as a whole.
 */
export function parseMasterDataFragment(hash: string): ParsedMasterDataLink {
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  if (body.length + 1 > MASTER_DATA_LINK_MAX_LENGTH) {
    return { ok: false, issue: 'tooLong', detail: [String(body.length + 1)] };
  }
  const params = new URLSearchParams(body);
  const versions = params.getAll(MARKER);
  if (versions.length === 0) return { ok: true, data: undefined };
  if (versions.length > 1 || versions[0] !== MASTER_DATA_LINK_VERSION) {
    return { ok: false, issue: 'unknownVersion', detail: versions };
  }
  const data: MasterData = {};
  const keys = [...new Set(params.keys())].filter((key) => key !== MARKER);
  if (keys.length > MASTER_DATA_LINK_MAX_KEYS) {
    return { ok: false, issue: 'tooManyKeys', detail: [String(keys.length)] };
  }
  for (const key of keys) {
    if (!ID.test(key)) return { ok: false, issue: 'invalidKey', detail: [key] };
    const values = params.getAll(key);
    if (values.length > 1) return { ok: false, issue: 'duplicateKey', detail: [key] };
    const value = values[0] ?? '';
    if (value === '') return { ok: false, issue: 'emptyValue', detail: [key] };
    if (value.includes(REPLACEMENT_CHARACTER)) {
      return { ok: false, issue: 'unreadableValue', detail: [key] };
    }
    data[key] = value;
  }
  return { ok: true, data };
}
