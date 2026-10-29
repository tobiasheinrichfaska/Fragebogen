// How stored values read for people — on screen and in the PDF. Values are already normalised
// (canon 1); this only formats them by German conventions and never changes data.
import { formatGermanDate, isIsoDate } from './dates';
import type { FieldDefinition, FieldType, FieldValue } from './model';

export const EMPTY_VALUE = '–';

const GROUPS: Partial<Record<FieldType, readonly number[]>> = {
  taxId: [2, 3, 3, 3],
  svNumber: [2, 6, 1, 3],
};

function grouped(value: string, sizes: readonly number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of sizes) {
    if (at >= value.length) break;
    parts.push(value.slice(at, at + size));
    at += size;
  }
  if (at < value.length) parts.push(value.slice(at));
  return parts.join(' ');
}

function money(value: string): string {
  const [integer = '0', decimals = '00'] = value.split('.');
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimals} €`;
}

function optionLabel(field: FieldDefinition, id: string): string {
  return field.options?.find((option) => option.id === id)?.label ?? id;
}

const FORMATTERS: Readonly<
  Record<FieldType, (value: FieldValue, field: FieldDefinition) => string>
> = {
  text: (value) => String(value),
  date: (value) =>
    typeof value === 'string' && isIsoDate(value) ? formatGermanDate(value) : String(value),
  money: (value) => (typeof value === 'string' ? money(value) : String(value)),
  boolean: (value) => (value === true ? 'Ja' : 'Nein'),
  choice: (value, field) => optionLabel(field, String(value)),
  multiChoice: (value, field) =>
    Array.isArray(value)
      ? value.map((id) => optionLabel(field, String(id))).join(', ')
      : String(value),
  iban: (value) => (typeof value === 'string' ? grouped(value, Array(9).fill(4)) : String(value)),
  taxId: (value) =>
    typeof value === 'string' ? grouped(value, GROUPS.taxId ?? []) : String(value),
  svNumber: (value) =>
    typeof value === 'string' ? grouped(value, GROUPS.svNumber ?? []) : String(value),
  betriebsnummer: (value) => String(value),
  repeatGroup: () => '(Tabelle – Anzeige folgt)',
  file: () => '(Datei – Anzeige folgt)',
};

/** The value as people read it; unanswered → "–". */
export function displayValue(field: FieldDefinition, value: FieldValue | undefined): string {
  if (value === undefined || value === null) return EMPTY_VALUE;
  return FORMATTERS[field.type](value, field);
}

/** Text for an input box: what the person would type to get this stored value back. */
export function editValue(field: FieldDefinition, value: FieldValue | undefined): string {
  if (value === undefined || value === null || typeof value !== 'string') return '';
  if (field.type === 'date' && isIsoDate(value)) return formatGermanDate(value);
  if (field.type === 'money') return money(value).replace(' €', '');
  return value;
}
