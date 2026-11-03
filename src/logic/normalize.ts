// Input normalisation, canon version 1. Values are normalised once when entered and stored in that
// form; verification hashes the stored values as they are. A later change of these rules can then
// never flip an old verdict — it requires a new CANON_VERSION instead.
import { normalizeCalendar } from './calendar';
import { boundDay } from './clock';
import { evaluateCondition } from './conditions';
import { isIsoMonth, parseIsoDate } from './dates';
import { deuevHints } from './deuevZeichen';
import { accept, reject, type Checked, type IssueCode } from './issues';
import { isPlainObject, isWellFormed } from './jcs';
import type {
  ChoiceOption,
  FieldDefinition,
  FieldType,
  FieldValue,
  IsoDate,
  TextFormat,
} from './model';
import { listOptionFor, optionsOf, REFERENCE_LISTS, suggestionsOf } from './options';
import {
  checkBetriebsnummer,
  checkGlaeubigerId,
  checkIban,
  checkSvNumber,
  checkTaxId,
} from './validators';

export const CANON_VERSION = 1;

/** Soft hyphen, zero-width space/non-joiner/joiner, word joiner, BOM. */
const INVISIBLE = /[\u00ad\u200b-\u200d\u2060\ufeff]/g;
const LINE_BREAKS = /\r\n|[\r\u0085\u2028\u2029]/g;
// C0/C1 control characters except TAB and LF (CR is converted before), plus DEL.
// eslint-disable-next-line no-control-regex -- matching control characters is the point here
const CONTROLS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;

/**
 * Text: rejects unpaired surrogates; removes invisible and control characters; converts every line
 * break to LF and tabs to spaces; NFC. A single-line text collapses all whitespace runs to one
 * space; a multi-line text does so per line and keeps the line breaks. Both are trimmed. Case is
 * never changed.
 */
export function normalizeText(raw: string, multiline = false): Checked<string> {
  if (!isWellFormed(raw)) return reject('text.illFormed');
  const text = raw
    .replace(INVISIBLE, '')
    .replace(LINE_BREAKS, '\n')
    .replace(CONTROLS, '')
    .replace(/\t/g, ' ')
    .normalize('NFC');
  if (!multiline) return accept(collapse(text));
  const lines = text.split('\n').map(collapse);
  return accept(lines.join('\n').replace(/^\n+|\n+$/g, ''));
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Dots, or commas from the German iPhone keypad; or eight digits without any separator — the
// numeric keypad of iOS has no dot (iPhone test report, 2026-11-01).
const GERMAN_DATE = /^(\d{1,2})[.,](\d{1,2})[.,](\d{4})$/;
const DIGITS_DATE = /^(\d{2})(\d{2})(\d{4})$/;
const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Date: `TT.MM.JJJJ` (also `T.M.JJJJ`) or `YYYY-MM-DD` → `YYYY-MM-DD`. Two-digit years are refused. */
export function normalizeDate(raw: string): Checked<IsoDate> {
  const text = raw.trim();
  const german = GERMAN_DATE.exec(text) ?? DIGITS_DATE.exec(text);
  let iso = text;
  if (german) {
    const [, day = '', month = '', year = ''] = german;
    iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (!ISO_DATE_SHAPE.test(iso)) return reject('date.format');
  return parseIsoDate(iso) ? accept(iso) : reject('date.invalid');
}

export const MONEY_MAX_INTEGER_DIGITS = 12;

// Accepted spellings, first match wins: group 1 = integer part, group 2 = cents. German input uses
// dots for thousands and a comma for decimals; the stored form "1234.56" must map to itself.
const MONEY_FORMS: readonly RegExp[] = [
  /^(\d+)$/,
  /^(\d+),(\d{1,2})$/,
  /^(\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/,
  /^(\d+)\.(\d{1,2})$/,
];

/** Amount in euros → `"1234.56"` (always two decimals). Negative amounts are refused. */
export function normalizeMoney(raw: string): Checked<string> {
  const text = raw.replace(/\s/g, '').replace(/^(?:€|EUR)|(?:€|EUR)$/gi, '');
  for (const form of MONEY_FORMS) {
    const match = form.exec(text);
    if (!match) continue;
    const integer = (match[1] ?? '').replace(/\./g, '').replace(/^0+(?=\d)/, '');
    if (integer.length > MONEY_MAX_INTEGER_DIGITS) return reject('money.tooLarge');
    return accept(`${integer}.${(match[2] ?? '').padEnd(2, '0')}`);
  }
  return reject(/,\d{3,}$/.test(text) ? 'money.decimals' : 'money.format');
}

export const MAX_NUMBER_DECIMALS = 2;
export const NUMBER_MAX_INTEGER_DIGITS = 9;

// Like money, a dot followed by one or two digits is a decimal point (so the stored form maps to
// itself), a dot followed by three digits groups thousands. Hence at most two decimal places.
const NUMBER_FORMS: readonly RegExp[] = [
  /^(\d+)$/,
  /^(\d+),(\d+)$/,
  /^(\d{1,3}(?:\.\d{3})+)(?:,(\d+))?$/,
  /^(\d+)\.(\d{1,2})$/,
];

/**
 * Number (hours, days, km …) → `"-12.50"`-style string with exactly `decimals` places (0 = integer).
 * German input `1.234,5`; a minus only where the field is `signed`. Never a JSON number.
 */
export function normalizeNumber(raw: string, field: FieldDefinition): Checked<string> {
  const decimals = field.decimals ?? 0;
  let text = raw.replace(/\s/g, '');
  if (field.unit !== undefined && text.endsWith(field.unit.replace(/\s/g, ''))) {
    text = text.slice(0, text.length - field.unit.replace(/\s/g, '').length);
  }
  const negative = /^[-\u2212]/.test(text);
  if (negative) text = text.slice(1);
  for (const form of NUMBER_FORMS) {
    const match = form.exec(text);
    if (!match) continue;
    const integer = (match[1] ?? '').replace(/\./g, '').replace(/^0+(?=\d)/, '');
    const fraction = (match[2] ?? '').replace(/0+$/, '');
    if (fraction.length > decimals) return reject('number.decimals');
    if (integer.length > NUMBER_MAX_INTEGER_DIGITS) return reject('number.tooLarge');
    const digits = decimals > 0 ? `${integer}.${fraction.padEnd(decimals, '0')}` : integer;
    const zero = /^[0.]+$/.test(digits);
    if (negative && !zero && field.signed !== true) return reject('number.negative');
    return withinBounds(negative && !zero ? `-${digits}` : digits, field);
  }
  return reject('number.format');
}

/** The bounds of a number field: refused outside min/max or off the step, a hint above warnAbove. */
function withinBounds(value: string, field: FieldDefinition): Checked<string> {
  const amount = Number(value);
  if (field.min !== undefined && amount < field.min) return reject('number.belowMin');
  if (field.max !== undefined && amount > field.max) return reject('number.aboveMax');
  if (field.step !== undefined) {
    const steps = (amount - (field.min ?? 0)) / field.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-9) return reject('number.step');
  }
  const unusual = field.warnAbove !== undefined && amount > field.warnAbove;
  return accept(value, unusual ? ['number.unusual'] : []);
}

/** The earliest and latest day of a date field. */
function withinDates(checked: Checked<IsoDate>, field: FieldDefinition): Checked<IsoDate> {
  if (!checked.ok) return checked;
  if (field.minDate !== undefined && checked.value < boundDay(field.minDate)) {
    return reject('date.tooEarly');
  }
  if (field.maxDate !== undefined && checked.value > boundDay(field.maxDate)) {
    return reject('date.tooLate');
  }
  return checked;
}

const GERMAN_MONTH = /^(\d{1,2})[./,](\d{4})$|^(\d{2})(\d{4})$/;

/** Month: `MM.JJJJ`, `M/JJJJ` or `YYYY-MM` → `YYYY-MM`. */
export function normalizeMonth(raw: string): Checked<string> {
  const text = raw.replace(/\s/g, '');
  const german = GERMAN_MONTH.exec(text);
  const month = german?.[1] ?? german?.[3] ?? '';
  const year = german?.[2] ?? german?.[4] ?? '';
  const iso = german ? `${year}-${month.padStart(2, '0')}` : text;
  if (!/^\d{4}-\d{2}$/.test(iso)) return reject('month.format');
  return isIsoMonth(iso) ? accept(iso) : reject('month.invalid');
}

/** Named formats of text fields (`textFormat`). */
const TEXT_FORMAT_CHECKS: Readonly<Record<TextFormat, (text: string) => Checked<string>>> = {
  // Five digits; no postcode starts with 00.
  // Occupation code of the Klassifikation der Berufe 2010: five digits (Tätigkeitsschlüssel 1–5).
  kldb2010: (text) => {
    const compact = text.replace(/\s/g, '');
    return /^\d{5}$/.test(compact) ? accept(compact) : reject('kldb.format');
  },
  postleitzahlDe: (text) => {
    const compact = text.replace(/\s/g, '');
    return /^(?!00)\d{5}$/.test(compact) ? accept(compact) : reject('plz.format');
  },
  // Phone number as written (Tobias 2026-11-01: "auf Stimmigkeit prüfen"): starts with 0 or + (a
  // "(0)" after the country code is common), only digits and the usual separators, 6 to 15 digits
  // (E.164 has at most 15).
  telefon: (text) => {
    const digits = text.replace(/\D/g, '').length;
    const shape = /^(?:\+[1-9]|\(?0)[\d ()/.-]*$/.test(text);
    return shape && digits >= 6 && digits <= 15 ? accept(text) : reject('telefon.format');
  },
  // E-mail address: one @, a local part without spaces or brackets, a domain with at least one dot
  // and a top-level domain of letters; the domain is stored in small letters (it is case-blind).
  email: (text) => {
    const compact = text.replace(/\s/g, '');
    const at = compact.lastIndexOf('@');
    const local = compact.slice(0, at);
    const domain = compact.slice(at + 1).toLocaleLowerCase('de-DE');
    const localOk = /^[^\s@"(),:;<>[\]\\]+$/.test(local) && !/^\.|\.$|\.\./.test(local);
    const domainOk = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,63}$/u.test(
      domain,
    );
    return at > 0 && localOk && domainOk && compact.length <= 254
      ? accept(`${local}@${domain}`)
      : reject('email.format');
  },
  // BIC (ISO 9362): 4 letters for the bank, 2 for the country, 2 letters or digits for the place,
  // optionally 3 for the branch; stored compact in capitals.
  bic: (text) => {
    const compact = text.replace(/\s/g, '').toUpperCase();
    return /^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/.test(compact)
      ? accept(compact)
      : reject('bic.format');
  },
  // Steuernummer as the tax office writes it (e.g. 93815/08152, 181/815/08155) or in the 13-digit
  // ELSTER form: 10 to 13 digits with slashes, spaces or hyphens; stored as written.
  steuernummer: (text) => {
    const digits = text.replace(/[\s/-]/g, '');
    return /^[\d\s/-]+$/.test(text) && /^\d{10,13}$/.test(digits)
      ? accept(text)
      : reject('steuernummer.format');
  },
  // A year with four digits (e.g. the tax year).
  jahr: (text) => {
    const compact = text.replace(/\s/g, '');
    return /^(19|20|21)\d{2}$/.test(compact) ? accept(compact) : reject('jahr.format');
  },
  // Digits only (e.g. a client number).
  ziffern: (text) => {
    const compact = text.replace(/\s/g, '');
    return /^\d+$/.test(compact) ? accept(compact) : reject('ziffern.format');
  },
  // Number plate (§ 9 Abs. 1 FZV, Anlage 1): 1 to 3 letters for the district, then 1 or 2 letters
  // without umlauts and a number 1 to 9999, optionally E (electric) or H (historic); stored as
  // "KA-AB 1234".
  kfzKennzeichen: (text) => {
    const match = /^([A-ZÄÖÜ]{1,3})[\s-]+([A-Z]{1,2})\s?([1-9]\d{0,3})([EH]?)$/.exec(
      text.trim().toUpperCase(),
    );
    return match
      ? accept(`${match[1] ?? ''}-${match[2] ?? ''} ${match[3] ?? ''}${match[4] ?? ''}`)
      : reject('kennzeichen.format');
  },
  // SEPA creditor identifier, stored compact in capitals (check digit in validators.ts).
  glaeubigerId: (text) => checkGlaeubigerId(text.replace(/\s/g, '').toUpperCase()),
  // SEPA mandate reference: up to 35 characters of the SEPA set, no spaces (German banks' rule
  // per secondary sources; the EPC set would allow them — the creditor chooses it anyway).
  mandatsreferenz: (text) =>
    /^[A-Za-z0-9'+?/:().,-]{1,35}$/.test(text) ? accept(text) : reject('mandatsreferenz.format'),
  // A count in half steps such as the Kinderfreibetragszähler: "4", "4,5" (stored with a comma).
  halbeSchritte: (text) => {
    const match = /^(\d{1,2})(?:[,.]([05])0?)?$/.exec(text.replace(/\s/g, ''));
    if (!match) return reject('halbeSchritte.format');
    const whole = String(Number(match[1]));
    return accept(match[2] === '5' ? `${whole},5` : whole);
  },
};

/** − / + of a count in half steps ("1,5" → "2"); empty or unreadable counts as 0, never below 0. */
export function stepHalfSteps(text: string, direction: 1 | -1): string {
  const checked = TEXT_FORMAT_CHECKS.halbeSchritte(text);
  const current = checked.ok ? Number(checked.value.replace(',', '.')) : 0;
  const next = Math.min(99.5, Math.max(0, current + direction * 0.5));
  return Number.isInteger(next) ? String(next) : `${Math.floor(next)},5`;
}

export function normalizeIban(raw: string): Checked<string> {
  return checkIban(raw.replace(/\s/g, '').toUpperCase());
}

export function normalizeTaxId(raw: string): Checked<string> {
  return checkTaxId(raw.replace(/\s/g, ''));
}

export function normalizeSvNumber(raw: string): Checked<string> {
  return checkSvNumber(raw.replace(/\s/g, '').toUpperCase());
}

export function normalizeBetriebsnummer(raw: string): Checked<string> {
  return checkBetriebsnummer(raw.replace(/\s/g, ''));
}

export function normalizeChoice(raw: string, options: readonly ChoiceOption[]): Checked<string> {
  return options.some((option) => option.id === raw) ? accept(raw) : reject('choice.unknown');
}

/** Multiple choice: option ids, de-duplicated and sorted by code units (independent of option order). */
export function normalizeMultiChoice(
  raw: readonly string[],
  options: readonly ChoiceOption[],
): Checked<string[]> {
  const known = new Set(options.map((option) => option.id));
  if (!raw.every((id) => known.has(id))) return reject('choice.unknown');
  return accept([...new Set(raw)].sort());
}

type FieldNormalizer = (raw: unknown, field: FieldDefinition) => Checked<FieldValue>;

// Text-based types: empty input (after text normalisation) is stored as null, i.e. "not answered".
function fromText(
  normalize: (text: string, field: FieldDefinition) => Checked<string>,
): FieldNormalizer {
  return (raw, field) => {
    if (raw === null) return accept(null);
    if (typeof raw !== 'string') return reject('value.type');
    const text = normalizeText(raw, field.multiline === true);
    if (!text.ok) return text;
    return text.value === '' ? accept(null) : normalize(text.value, field);
  };
}

const FIELD_NORMALIZERS: Readonly<Record<FieldType, FieldNormalizer>> = {
  text: fromText((text, field) => {
    if (field.maxLength !== undefined && [...text].length > field.maxLength) {
      return reject('text.tooLong');
    }
    if (field.textFormat !== undefined) return TEXT_FORMAT_CHECKS[field.textFormat](text);
    const hints = field.deuevRule === undefined ? [] : deuevHints(field.deuevRule, text);
    // Suggestions from an earlier answer are only offered; nothing to check here.
    if (field.suggestionsFrom === undefined || !REFERENCE_LISTS[field.suggestionsFrom]) {
      return accept(text, hints);
    }
    // A list entry is stored by its exact name; anything else is free text with a warning.
    const found = listOptionFor(suggestionsOf(field), text);
    return found ? accept(found.label, hints) : accept(text, ['list.freeEntry', ...hints]);
  }),
  date: fromText((text, field) => withinDates(normalizeDate(text), field)),
  money: fromText(normalizeMoney),
  number: fromText(normalizeNumber),
  month: fromText(normalizeMonth),
  iban: fromText(normalizeIban),
  taxId: fromText(normalizeTaxId),
  svNumber: fromText(normalizeSvNumber),
  betriebsnummer: fromText(normalizeBetriebsnummer),
  boolean: (raw) => (raw === null || typeof raw === 'boolean' ? accept(raw) : reject('value.type')),
  choice: (raw, field) => {
    if (raw === null || raw === '') return accept(null);
    if (typeof raw !== 'string') return reject('value.type');
    if (field.optionsFrom === undefined) return normalizeChoice(raw, field.options ?? []);
    // A list entry is typed: its id or label in any case.
    const text = normalizeText(raw, false);
    if (!text.ok) return text;
    if (text.value === '') return accept(null);
    const found = listOptionFor(optionsOf(field), text.value);
    return found ? accept(found.id) : reject('choice.notInList');
  },
  multiChoice: (raw, field) => {
    if (raw === null) return accept(null);
    if (!Array.isArray(raw) || !raw.every((id) => typeof id === 'string')) {
      return reject('value.type');
    }
    const chosen = normalizeMultiChoice(raw, field.options ?? []);
    return chosen.ok && chosen.value.length === 0 ? accept(null) : chosen;
  },
  repeatGroup: (raw, field) => {
    const rows = normalizeRows(field, raw);
    return rows.ok ? accept(rows.value, rows.warnings) : reject(rows.issue);
  },
  file: () => reject('type.unsupported'),
  calendar: (raw, field) => normalizeCalendar(raw, field.options ?? []),
};

/** Row ids of a table: "r1", "r2", … — a new row takes the next free number, ids never shift. */
export const ROW_ID = /^r[1-9][0-9]{0,2}$/;
export const ROW_ID_KEY = 'rowId';
export const MAX_ROWS = 30;

export type RowsResult =
  | { ok: true; value: FieldValue; warnings: readonly IssueCode[] }
  | { ok: false; issue: IssueCode; row?: number; column?: string };

/**
 * A table (repeat group): a list of rows `{ rowId, <column>: value, … }`. Every cell is normalised
 * by its column's type; every row lists all columns (unanswered as null), so the hash does not
 * depend on how the input was spelled. Rows without any answer are dropped; no rows = null.
 * A refusal names the row (0-based) and column, so the UI can point at the cell.
 */
export function normalizeRows(field: FieldDefinition, raw: unknown): RowsResult {
  if (raw === null) return { ok: true, value: null, warnings: [] };
  if (!Array.isArray(raw)) return { ok: false, issue: 'value.type' };
  if (raw.length > MAX_ROWS) return { ok: false, issue: 'rows.tooMany' };
  const columns = field.columns ?? [];
  const allowed = new Set([ROW_ID_KEY, ...columns.map((column) => column.id)]);
  const seen = new Set<string>();
  const rows: Record<string, FieldValue>[] = [];
  const warnings: IssueCode[] = [];
  for (const [index, row] of raw.entries()) {
    if (!isPlainObject(row)) return { ok: false, issue: 'value.type', row: index };
    const unknown = Object.keys(row).find((key) => !allowed.has(key));
    if (unknown !== undefined)
      return { ok: false, issue: 'rows.unknownColumn', row: index, column: unknown };
    const rowId = row[ROW_ID_KEY];
    if (typeof rowId !== 'string' || !ROW_ID.test(rowId) || seen.has(rowId)) {
      return { ok: false, issue: 'rows.rowId', row: index };
    }
    seen.add(rowId);
    const cells: Record<string, FieldValue> = { [ROW_ID_KEY]: rowId };
    for (const column of columns) {
      // A cell whose row condition does not hold is not asked; it is stored empty.
      if (!columnShown(column, cells)) {
        cells[column.id] = null;
        continue;
      }
      const cell = normalizeFieldValue(column, row[column.id] ?? null);
      if (!cell.ok) return { ok: false, issue: cell.issue, row: index, column: column.id };
      warnings.push(...cell.warnings);
      cells[column.id] = cell.value;
    }
    if (columns.some((column) => cells[column.id] !== null)) rows.push(cells);
  }
  return { ok: true, value: rows.length === 0 ? null : rows, warnings };
}

/** Whether a column is asked in this row: its row condition (earlier cells) holds, if it has one. */
export function columnShown(
  column: FieldDefinition,
  cells: Readonly<Record<string, unknown>>,
): boolean {
  return (
    !column.showIf ||
    evaluateCondition(column.showIf, (id) => (cells[id] as FieldValue | undefined) ?? null)
  );
}

/** Cells of required columns left empty, per row — a table with such rows is incomplete. */
export function missingCells(
  field: FieldDefinition,
  value: FieldValue | undefined,
): { rowId: string; column: string }[] {
  if (field.type !== 'repeatGroup' || !Array.isArray(value)) return [];
  const required = (field.columns ?? []).filter((column) => column.required);
  return value.flatMap((row) => {
    if (!isPlainObject(row)) return [];
    const rowId = String(row[ROW_ID_KEY] ?? '');
    return required
      .filter((column) => columnShown(column, row) && (row[column.id] ?? null) === null)
      .map((column) => ({ rowId, column: column.id }));
  });
}

/** Id for a new row: one above the highest existing number. */
export function nextRowId(rows: readonly { rowId?: unknown }[]): string {
  const numbers = rows.map((row) =>
    typeof row.rowId === 'string' && ROW_ID.test(row.rowId) ? Number(row.rowId.slice(1)) : 0,
  );
  return `r${Math.max(0, ...numbers) + 1}`;
}

/** Normalises one raw input value for its field; the result is what gets stored and hashed. */
export function normalizeFieldValue(field: FieldDefinition, raw: unknown): Checked<FieldValue> {
  return FIELD_NORMALIZERS[field.type](raw, field);
}
