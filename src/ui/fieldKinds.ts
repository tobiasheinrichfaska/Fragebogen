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

export function isTextLike(field: FieldDefinition): boolean {
  return TEXT_LIKE.has(field.type) || field.optionsFrom !== undefined;
}
