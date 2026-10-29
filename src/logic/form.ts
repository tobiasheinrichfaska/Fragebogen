// Evaluating a form definition against a role's data: visibility (showIf), completeness and the
// notices a role must acknowledge. A field hidden by its condition counts as unanswered, so
// conditions that depend on it are false as well.
import { canonicalHash } from './hash';
import type {
  Condition,
  FieldDefinition,
  FieldId,
  FieldValue,
  FormDefinition,
  InfoBlock,
  RoleDefinition,
  RoleId,
  Sha256Hex,
} from './model';

export type PartData = Readonly<Record<FieldId, FieldValue>>;

export function roleOf(definition: FormDefinition, role: RoleId): RoleDefinition | undefined {
  return definition.roles.find((candidate) => candidate.id === role);
}

/** Top-level fields owned by the role, in form order. */
export function fieldsOfRole(definition: FormDefinition, role: RoleId): FieldDefinition[] {
  return definition.sections.flatMap((section) =>
    section.fields.filter((field) => field.role === role),
  );
}

export function infoBlocksOfRole(definition: FormDefinition, role: RoleId): InfoBlock[] {
  return definition.infoBlocks.filter((block) => block.role === role);
}

/** Hash of exactly what a notice shows: title, text and its "Stand". */
export function noticeHash(block: InfoBlock): Sha256Hex {
  return canonicalHash({ asOf: block.asOf, text: block.text, title: block.title });
}

/** Visibility of every field of the role; conditions only reference fields of the same role. */
export function visibility(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): ReadonlyMap<FieldId, boolean> {
  const fields = new Map(fieldsOfRole(definition, role).map((field) => [field.id, field]));
  const visible = new Map<FieldId, boolean>();
  const isVisible = (id: FieldId): boolean => {
    const known = visible.get(id);
    if (known !== undefined) return known;
    const field = fields.get(id);
    // Definitions are checked to be acyclic, so this recursion terminates.
    const result = field !== undefined && (!field.showIf || holds(field.showIf));
    visible.set(id, result);
    return result;
  };
  const holds = (condition: Condition): boolean => {
    if ('all' in condition) return condition.all.every(holds);
    if ('any' in condition) return condition.any.some(holds);
    return isVisible(condition.field) && data[condition.field] === condition.equals;
  };
  for (const id of fields.keys()) isVisible(id);
  return visible;
}

export function visibleFields(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): FieldDefinition[] {
  const visible = visibility(definition, role, data);
  return fieldsOfRole(definition, role).filter((field) => visible.get(field.id) === true);
}

/** The data as it is sealed: visible fields only, unanswered ones as null. */
export function sealableData(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): Record<FieldId, FieldValue> {
  return Object.fromEntries(
    visibleFields(definition, role, data).map((field) => [field.id, data[field.id] ?? null]),
  );
}

export function missingRequired(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): FieldId[] {
  return visibleFields(definition, role, data)
    .filter((field) => field.required && (data[field.id] ?? null) === null)
    .map((field) => field.id);
}
