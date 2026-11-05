// Master data carried in a bookmark link (Tobias, 2026-10-29: option C, no browser storage). The
// app address gets a fragment such as #stammdaten=1&betriebsnummer=12345671&firma=Beispiel+GmbH;
// with formular=sofortmeldung it opens a new questionnaire of that form at once (Tobias
// 2026-11-03) — the form id only, never a version, so the link keeps working with new versions.
// A fragment never reaches the server, but it stays in bookmarks and the browser history, which
// is acceptable for the employer's own data only. Parsing is strict and all-or-nothing; the
// result is still untrusted and goes through applyMasterData (setValue) like typed input.
import { FORM_ID, ID } from './formDefinition';
import type { MasterData } from './masterData';
import { MASTER_DATA_FORM_KEY } from './model';

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

/**
 * The fragment (with "#") for a bookmark; keys sorted, so equal data gives an equal link. `form`:
 * the form the link opens as a new questionnaire.
 */
export function masterDataFragment(data: MasterData, form?: string): MasterDataLinkResult {
  const entries = Object.entries(data).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  if (entries.length > MASTER_DATA_LINK_MAX_KEYS) {
    return { ok: false, issue: 'tooManyKeys', detail: [String(entries.length)] };
  }
  const params = new URLSearchParams([[MARKER, MASTER_DATA_LINK_VERSION]]);
  if (form !== undefined) {
    if (!FORM_ID.test(form)) return { ok: false, issue: 'invalidKey', detail: [form] };
    params.append(MASTER_DATA_FORM_KEY, form);
  }
  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new RangeError(`Master datum "${key}" is not a text value`);
    }
    if (!ID.test(key) || key === MASTER_DATA_FORM_KEY) {
      return { ok: false, issue: 'invalidKey', detail: [key] };
    }
    if (value === '') return { ok: false, issue: 'emptyValue', detail: [key] };
    params.append(key, value);
  }
  const fragment = `#${params.toString()}`;
  return fragment.length > MASTER_DATA_LINK_MAX_LENGTH
    ? { ok: false, issue: 'tooLong', detail: [String(fragment.length)] }
    : { ok: true, fragment };
}

/**
 * Where a link made for someone else points: this page when it is hosted, otherwise (a file on
 * this computer) the configured app address — a file path would lead nowhere on another device.
 */
export function masterDataLinkBase(page: string, appAddress: string | undefined): string {
  const address = page.split('#')[0] ?? '';
  return address.startsWith('https:') || appAddress === undefined ? address : appAddress;
}

/** The part of a pasted link or fragment from "#" on (the whole text without one). */
export function fragmentOf(pasted: string): string {
  const text = pasted.trim();
  const at = text.indexOf('#');
  return at === -1 ? text : text.slice(at);
}

export type ParsedMasterDataLink =
  | { ok: true; data: MasterData | undefined; form?: string }
  | { ok: false; issue: MasterDataLinkIssue; detail: readonly string[] };

/**
 * Reads master data from a location hash (with or without "#"). A hash without the marker is not
 * a master-data link (`data: undefined`); a marked but malformed one is refused as a whole. `form`:
 * the form the link opens, if it names one.
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
  const forms = params.getAll(MASTER_DATA_FORM_KEY);
  const form = forms[0];
  if (forms.length > 1) return { ok: false, issue: 'duplicateKey', detail: [MASTER_DATA_FORM_KEY] };
  if (form !== undefined && !FORM_ID.test(form)) {
    return { ok: false, issue: 'invalidKey', detail: [MASTER_DATA_FORM_KEY] };
  }
  const keys = [...new Set(params.keys())].filter(
    (key) => key !== MARKER && key !== MASTER_DATA_FORM_KEY,
  );
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
  return { ok: true, data, ...(form === undefined ? {} : { form }) };
}
