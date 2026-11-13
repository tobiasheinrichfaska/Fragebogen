// The order of two dates of one role (Tobias 2026-11-13, after the walk over every form found an end
// of a fixed term before its start taken without a word): a date field may name an earlier asked
// date field it must not lie before (`notBefore`, e.g. "Befristet bis" and the start) or after
// (`notAfter`, e.g. the day a notice arrived and the end of employment). Typing a date on the wrong
// side is refused at once; moving the other date later puts the pair into the summary, and sealing
// waits until it fits. Only top-level fields; table columns have no order yet.
import { formatGermanDate, isIsoDate } from './dates';
import { visibility, type PartData } from './form';
import type { FieldDefinition, FieldId, FormDefinition, IsoDate, RoleId } from './model';

export const DATE_ORDER_RELATIONS = {
  notBefore: { holds: (value: IsoDate, other: IsoDate) => value >= other, word: 'vor' },
  notAfter: { holds: (value: IsoDate, other: IsoDate) => value <= other, word: 'nach' },
} as const;

export type DateOrderRelation = keyof typeof DATE_ORDER_RELATIONS;
export const DATE_ORDER_KEYS = Object.keys(DATE_ORDER_RELATIONS) as DateOrderRelation[];

export interface DateOrderProblem {
  /** The field carrying the rule, i.e. the one to change. */
  fieldId: FieldId;
  relation: DateOrderRelation;
  /** The earlier asked date it is compared with. */
  other: FieldId;
  value: IsoDate;
  otherValue: IsoDate;
}

/** The rules a field carries, as [relation, other field]. */
export function dateOrderRules(field: FieldDefinition): [DateOrderRelation, FieldId][] {
  return DATE_ORDER_KEYS.flatMap((relation) => {
    const other = field[relation];
    return other === undefined ? [] : [[relation, other] as [DateOrderRelation, FieldId]];
  });
}

/**
 * The pairs of the role that do not fit: both dates answered and available (a hidden field counts
 * as unanswered), the field on the wrong side of the other. `only` limits it to one field's rules.
 */
export function dateOrderProblems(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
  only?: FieldId,
): DateOrderProblem[] {
  const visible = visibility(definition, role, data);
  const dateOf = (id: FieldId) => {
    const value = visible.get(id) === true ? data[id] : undefined;
    return typeof value === 'string' && isIsoDate(value) ? value : undefined;
  };
  return definition.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.role === role && (only === undefined || field.id === only))
    .flatMap((field) =>
      dateOrderRules(field).flatMap(([relation, other]) => {
        const value = dateOf(field.id);
        const otherValue = dateOf(other);
        if (value === undefined || otherValue === undefined) return [];
        if (DATE_ORDER_RELATIONS[relation].holds(value, otherValue)) return [];
        return [{ fieldId: field.id, relation, other, value, otherValue }];
      }),
    );
}

/** "Das Datum liegt vor „Tag der Beschäftigungsaufnahme“ (01.11.2026)." — said at the field. */
export function dateOrderMessage(
  problem: DateOrderProblem,
  label: (id: FieldId) => string,
): string {
  const { word } = DATE_ORDER_RELATIONS[problem.relation];
  return `Das Datum liegt ${word} „${label(problem.other)}“ (${formatGermanDate(problem.otherValue)}).`;
}

/** "„Befristet bis“ (17.05.2026) liegt vor „…“ (01.11.2026)." — said in the summary. */
export function describeDateOrderProblem(
  problem: DateOrderProblem,
  label: (id: FieldId) => string,
): string {
  const { word } = DATE_ORDER_RELATIONS[problem.relation];
  return `„${label(problem.fieldId)}“ (${formatGermanDate(problem.value)}) liegt ${word} „${label(problem.other)}“ (${formatGermanDate(problem.otherValue)}).`;
}

/** For the catalogue and the flow plan: "nicht vor „Tag der Beschäftigungsaufnahme“". */
export function describeDateOrderRules(
  field: FieldDefinition,
  label: (id: FieldId) => string,
): string[] {
  return dateOrderRules(field).map(
    ([relation, other]) => `nicht ${DATE_ORDER_RELATIONS[relation].word} „${label(other)}“`,
  );
}
