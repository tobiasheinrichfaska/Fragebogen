// Suggestions from earlier answers (Tobias 2026-11-01, Monatsmeldung): the person of a movement row
// from the list of employees, the Lohnart from the list in the bookmark link. Only offered while
// typing — another entry stays possible.
import { displayValue } from './display';
import { fieldsById, type PartData } from './form';
import { isPlainObject } from './jcs';
import type { FieldDefinition, FormDefinition } from './model';
import { REFERENCE_LISTS } from './options';

/** The texts to offer for a field whose `suggestionsFrom` names an answer; [] otherwise. */
export function answerSuggestions(
  definition: FormDefinition,
  field: FieldDefinition,
  data: PartData,
): string[] {
  const id = field.suggestionsFrom;
  if (id === undefined || REFERENCE_LISTS[id]) return [];
  const source = fieldsById(definition).get(id);
  const value = data[id] ?? null;
  if (!source || value === null) return [];
  if (source.type === 'text' && typeof value === 'string') {
    return [...new Set(value.split('\n').map((line) => line.trim()))].filter((line) => line !== '');
  }
  if (source.type !== 'repeatGroup' || !Array.isArray(value)) return [];
  const columns = (source.rowTitle ?? []).flatMap((columnId) => {
    const column = source.columns?.find((candidate) => candidate.id === columnId);
    return column ? [column] : [];
  });
  const titles = value.flatMap((row) => {
    if (!isPlainObject(row)) return [];
    const parts = columns
      .filter((column) => (row[column.id] ?? null) !== null)
      .map((column) => displayValue(column, row[column.id] as never));
    return parts.length === 0 ? [] : [parts.join(' · ')];
  });
  return [...new Set(titles)];
}
