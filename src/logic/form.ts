// Evaluating a form definition against a role's data: availability (showIf), requiredness
// (required / requiredIf), completeness and the notices a role must acknowledge. A field hidden by
// its condition counts as unanswered, so conditions that depend on it are false as well.
import { describeCondition, evaluateCondition, forEachLeaf } from './conditions';
import { canonicalHash } from './hash';
import { missingCells } from './normalize';
import type {
  FieldDefinition,
  FieldId,
  FieldValue,
  FormDefinition,
  InfoBlock,
  RoleCondition,
  RoleDefinition,
  RoleId,
  SealSignature,
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

export function ownerOfField(definition: FormDefinition, fieldId: FieldId): RoleId | undefined {
  return definition.sections
    .flatMap((section) => section.fields)
    .find((field) => field.id === fieldId)?.role;
}

/** At least two letters: a typed signature must be a name, not a mark. */
/** The role whose latest sealed part decides a conditional role (definition rule: exactly one). */
export function triggerRoleOf(
  definition: FormDefinition,
  condition: RoleCondition,
): RoleId | undefined {
  if (condition.kind === 'minorOnSigning')
    return ownerOfField(definition, condition.birthDateField);
  let owner: RoleId | undefined;
  forEachLeaf(condition.when, '$', (leaf) => {
    owner ??= ownerOfField(definition, leaf.field);
  });
  return owner;
}

export function typedNameIsPlausible(name: string): boolean {
  return (name.match(/\p{L}/gu) ?? []).length >= 2;
}

/** The signer's name: the role's name field if it has one, otherwise the typed signature. */
export function signerName(
  role: RoleDefinition,
  data: PartData,
  signature: SealSignature | undefined,
): string | undefined {
  if (role.signerNameField !== undefined) {
    const value = data[role.signerNameField];
    return typeof value === 'string' && value !== '' ? value : undefined;
  }
  return signature?.method === 'typed' ? signature.typedName : undefined;
}

export function infoBlocksOfRole(definition: FormDefinition, role: RoleId): InfoBlock[] {
  return definition.infoBlocks.filter((block) => block.role === role);
}

/** Hash of exactly what a notice shows: title, text and its "Stand". */
export function noticeHash(block: InfoBlock): Sha256Hex {
  return canonicalHash({ asOf: block.asOf, text: block.text, title: block.title });
}

/**
 * Visibility of every field of the role (`showIf`: available for input). A hidden field counts as
 * unanswered for every condition that depends on it.
 */
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
    const result =
      field !== undefined && (!field.showIf || evaluateCondition(field.showIf, valueOf));
    visible.set(id, result);
    return result;
  };
  const valueOf = (id: FieldId): FieldValue => (isVisible(id) ? (data[id] ?? null) : null);
  for (const id of fields.keys()) isVisible(id);
  return visible;
}

export interface FieldState {
  /** Available for input (its `showIf` holds). */
  visible: boolean;
  /** Visible and either always required or its `requiredIf` holds. */
  required: boolean;
  /** Required but without an answer. */
  missing: boolean;
}

export function fieldStates(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): ReadonlyMap<FieldId, FieldState> {
  const visible = visibility(definition, role, data);
  const valueOf = (id: FieldId): FieldValue =>
    visible.get(id) === true ? (data[id] ?? null) : null;
  return new Map(
    fieldsOfRole(definition, role).map((field) => {
      const isVisible = visible.get(field.id) === true;
      const required =
        isVisible &&
        (field.required ||
          (field.requiredIf !== undefined && evaluateCondition(field.requiredIf, valueOf)));
      // A table is also incomplete when a row leaves a required column empty.
      const incomplete = isVisible && missingCells(field, valueOf(field.id)).length > 0;
      return [
        field.id,
        {
          visible: isVisible,
          required,
          missing: (required && valueOf(field.id) === null) || incomplete,
        },
      ];
    }),
  );
}

export function visibleFields(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): FieldDefinition[] {
  const visible = visibility(definition, role, data);
  return fieldsOfRole(definition, role).filter((field) => visible.get(field.id) === true);
}

/** Preselected answers (`initial`) of the role's fields — the start of its first version. */
export function initialData(definition: FormDefinition, role: RoleId): Record<FieldId, FieldValue> {
  return Object.fromEntries(
    fieldsOfRole(definition, role).flatMap((field) =>
      field.initial === undefined ? [] : [[field.id, field.initial]],
    ),
  );
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

/** Required fields (always or by `requiredIf`) that are available but unanswered. */
export function missingRequired(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): FieldId[] {
  return [...fieldStates(definition, role, data)]
    .filter(([, state]) => state.missing)
    .map(([id]) => id);
}

export function fieldsById(definition: FormDefinition): ReadonlyMap<FieldId, FieldDefinition> {
  return new Map(
    definition.sections.flatMap((section) => section.fields).map((field) => [field.id, field]),
  );
}

/** The field's rules in German, for hints on screen and the catalogue overview. */
export function describeFieldRules(
  definition: FormDefinition,
  field: FieldDefinition,
): { input: string; requirement: string } {
  const fields = fieldsById(definition);
  const input = field.showIf ? `erst wenn ${describeCondition(field.showIf, fields)}` : 'immer';
  let requirement = field.voluntary ? 'freiwillige Angabe' : 'optional';
  if (field.required) requirement = 'Pflicht';
  else if (field.requiredIf)
    requirement = `Pflicht, wenn ${describeCondition(field.requiredIf, fields)}`;
  return { input, requirement };
}
