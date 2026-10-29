// Which answers rest on others. A field with showIf becomes available only through other answers;
// level 0 is independent, level n rests on at least one answer of level n-1 (the deepest counts).
// requiredIf only decides whether an answer is required, not whether it can be given, so it is
// listed separately. Used by the interview (indentation, summary) and the catalogue (tree).
import { forEachLeaf } from './conditions';
import type { Condition, FieldDefinition, FieldId, FormDefinition } from './model';

export interface FieldDependency {
  fieldId: FieldId;
  level: number;
  /** Fields whose answers make this one available (showIf). */
  availableThrough: FieldId[];
  /** Fields whose answers make this one required (requiredIf). */
  requiredThrough: FieldId[];
  /** Fields that become available through this one. */
  enables: FieldId[];
}

function targets(condition: Condition | undefined): FieldId[] {
  if (!condition) return [];
  const ids: FieldId[] = [];
  forEachLeaf(condition, '$', (leaf) => {
    if (!ids.includes(leaf.field)) ids.push(leaf.field);
  });
  return ids;
}

/** Dependencies of every top-level field, in form order. */
export function fieldDependencies(
  definition: FormDefinition,
): ReadonlyMap<FieldId, FieldDependency> {
  const fields: FieldDefinition[] = definition.sections.flatMap((section) => section.fields);
  const byId = new Map(fields.map((field) => [field.id, field]));
  const levels = new Map<FieldId, number>();
  // Definitions are checked to be acyclic, so this recursion terminates.
  const levelOf = (id: FieldId): number => {
    const known = levels.get(id);
    if (known !== undefined) return known;
    const parents = targets(byId.get(id)?.showIf).filter((parent) => byId.has(parent));
    const level = parents.length === 0 ? 0 : 1 + Math.max(...parents.map(levelOf));
    levels.set(id, level);
    return level;
  };
  return new Map(
    fields.map((field) => [
      field.id,
      {
        fieldId: field.id,
        level: levelOf(field.id),
        availableThrough: targets(field.showIf),
        requiredThrough: targets(field.requiredIf),
        enables: fields
          .filter((other) => targets(other.showIf).includes(field.id))
          .map((other) => other.id),
      },
    ]),
  );
}
