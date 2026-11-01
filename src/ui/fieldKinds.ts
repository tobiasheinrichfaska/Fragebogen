// Field types typed as text (kept locally until "Weiter") versus chosen with buttons. A choice from
// a reference list (hundreds of entries) is typed too, with suggestions.
import type { FieldDefinition, FieldType } from '../logic/model';

const TEXT_LIKE: ReadonlySet<FieldType> = new Set([
  'text',
  'date',
  'iban',
  'taxId',
  'svNumber',
  'betriebsnummer',
  'money',
  'number',
  'month',
]);

/**
 * The on-screen keyboard per type. Dates use "decimal": the plain numeric keypad of iOS has no dot
 * or comma (iPhone test report, 2026-11-01); the date also accepts digits only.
 */
export const INPUT_MODE: Partial<Record<FieldType, 'numeric' | 'decimal' | 'text'>> = {
  date: 'decimal',
  taxId: 'numeric',
  betriebsnummer: 'numeric',
  money: 'decimal',
  number: 'decimal',
  month: 'decimal',
};

export function isTextLike(field: FieldDefinition): boolean {
  return TEXT_LIKE.has(field.type) || field.optionsFrom !== undefined;
}
