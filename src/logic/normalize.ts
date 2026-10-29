// Input normalisation, canon version 1. Values are normalised once when entered and stored in that
// form; verification hashes the stored values as they are. A later change of these rules can then
// never flip an old verdict — it requires a new CANON_VERSION instead.
import { parseIsoDate } from './dates';
import { accept, reject, type Checked } from './issues';
import { isWellFormed } from './jcs';
import type { ChoiceOption, FieldDefinition, FieldType, FieldValue, IsoDate } from './model';
import { checkIban, checkSvNumber, checkTaxId } from './validators';

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

const GERMAN_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Date: `TT.MM.JJJJ` (also `T.M.JJJJ`) or `YYYY-MM-DD` → `YYYY-MM-DD`. Two-digit years are refused. */
export function normalizeDate(raw: string): Checked<IsoDate> {
  const text = raw.trim();
  const german = GERMAN_DATE.exec(text);
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

export function normalizeIban(raw: string): Checked<string> {
  return checkIban(raw.replace(/\s/g, '').toUpperCase());
}

export function normalizeTaxId(raw: string): Checked<string> {
  return checkTaxId(raw.replace(/\s/g, ''));
}

export function normalizeSvNumber(raw: string): Checked<string> {
  return checkSvNumber(raw.replace(/\s/g, '').toUpperCase());
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
function fromText(normalize: (text: string) => Checked<string>): FieldNormalizer {
  return (raw, field) => {
    if (raw === null) return accept(null);
    if (typeof raw !== 'string') return reject('value.type');
    const text = normalizeText(raw, field.multiline === true);
    if (!text.ok) return text;
    return text.value === '' ? accept(null) : normalize(text.value);
  };
}

const FIELD_NORMALIZERS: Readonly<Record<FieldType, FieldNormalizer>> = {
  text: fromText((text) => accept(text)),
  date: fromText(normalizeDate),
  money: fromText(normalizeMoney),
  iban: fromText(normalizeIban),
  taxId: fromText(normalizeTaxId),
  svNumber: fromText(normalizeSvNumber),
  boolean: (raw) => (raw === null || typeof raw === 'boolean' ? accept(raw) : reject('value.type')),
  choice: (raw, field) => {
    if (raw === null || raw === '') return accept(null);
    return typeof raw === 'string'
      ? normalizeChoice(raw, field.options ?? [])
      : reject('value.type');
  },
  multiChoice: (raw, field) => {
    if (raw === null) return accept(null);
    if (!Array.isArray(raw) || !raw.every((id) => typeof id === 'string')) {
      return reject('value.type');
    }
    const chosen = normalizeMultiChoice(raw, field.options ?? []);
    return chosen.ok && chosen.value.length === 0 ? accept(null) : chosen;
  },
  // Row ids and cross-role columns are designed together with the first form using them (step 5).
  repeatGroup: () => reject('type.unsupported'),
  file: () => reject('type.unsupported'),
};

/** Normalises one raw input value for its field; the result is what gets stored and hashed. */
export function normalizeFieldValue(field: FieldDefinition, raw: unknown): Checked<FieldValue> {
  return FIELD_NORMALIZERS[field.type](raw, field);
}
