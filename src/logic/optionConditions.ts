// Answers offered only where they make sense (Tobias 2026-11-13, the list of documents: „nur
// anzeigen, was sinnvoll ist“). An option's `showIf` may name fields of its own role — read from the
// draft — and of other roles — read from their sealed part. While such a part is missing the option
// stays offered: only what surely does not fit is hidden. Hiding is for the person filling in; an
// answer chosen before stays stored.
import { evaluateCondition, forEachLeaf } from './conditions';
import { fieldsById, visibility, type PartData } from './form';
import type {
  ChoiceOption,
  FieldDefinition,
  FieldId,
  FieldValue,
  FormDefinition,
  RoleId,
} from './model';
import { optionsOf } from './options';

export function availableOptions(
  definition: FormDefinition,
  field: FieldDefinition,
  ownData: PartData,
  /** The latest sealed data of another role, undefined while it has none. */
  sealedOf: (role: RoleId) => PartData | undefined,
): ChoiceOption[] {
  const fields = fieldsById(definition);
  const own = visibility(definition, field.role, ownData);
  const others = new Map<RoleId, ReadonlyMap<FieldId, boolean>>();
  const shownOf = (role: RoleId, data: PartData) => {
    const known = others.get(role);
    if (known) return known;
    const made = visibility(definition, role, data);
    others.set(role, made);
    return made;
  };
  return optionsOf(field).filter((option) => {
    if (!option.showIf) return true;
    let unknown = false;
    forEachLeaf(option.showIf, '$', (leaf) => {
      const owner = fields.get(leaf.field)?.role;
      if (owner !== undefined && owner !== field.role && sealedOf(owner) === undefined)
        unknown = true;
    });
    if (unknown) return true;
    const valueOf = (id: FieldId): FieldValue => {
      const owner = fields.get(id)?.role;
      if (owner === undefined) return null;
      if (owner === field.role) return own.get(id) === true ? (ownData[id] ?? null) : null;
      const data = sealedOf(owner) ?? {};
      return shownOf(owner, data).get(id) === true ? (data[id] ?? null) : null;
    };
    return evaluateCondition(option.showIf, valueOf);
  });
}
