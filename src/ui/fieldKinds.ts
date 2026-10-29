// Field types typed as text (kept locally until "Weiter") versus chosen with buttons.
import type { FieldDefinition, FieldType } from '../logic/model';

const TEXT_LIKE: ReadonlySet<FieldType> = new Set([
  'text',
  'date',
  'iban',
  'taxId',
  'svNumber',
  'betriebsnummer',
  'money',
]);

export function isTextLike(field: FieldDefinition): boolean {
  return TEXT_LIKE.has(field.type);
}
