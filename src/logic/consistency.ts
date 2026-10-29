// Contradictions between the answers of different roles (the form's consistencyRules), e.g. the
// name the person gave differs from the name in the employer's part. Text is compared without
// regard to case; unanswered fields never contradict.
import { ownerOfField } from './form';
import { canonicalize } from './jcs';
import type { FieldId, FieldValue, FormDefinition, Questionnaire } from './model';
import { latestSealed } from './questionnaire';

export interface Contradiction {
  message: string;
  fields: readonly [FieldId, FieldId];
  values: readonly [FieldValue, FieldValue];
}

/** Text compared without regard to case, everything else canonically. */
export function comparable(value: FieldValue): string {
  return typeof value === 'string' ? value.toLocaleLowerCase('de') : canonicalize(value);
}

function currentValue(
  definition: FormDefinition,
  questionnaire: Questionnaire,
  fieldId: FieldId,
): FieldValue {
  const role = ownerOfField(definition, fieldId);
  const part = role === undefined ? undefined : latestSealed(questionnaire, role);
  return part?.data[fieldId] ?? null;
}

export function contradictions(
  questionnaire: Questionnaire,
  definition: FormDefinition,
): Contradiction[] {
  return definition.consistencyRules.flatMap((rule) => {
    const [a, b] = rule.fields;
    const left = currentValue(definition, questionnaire, a);
    const right = currentValue(definition, questionnaire, b);
    if (left === null || right === null || comparable(left) === comparable(right)) return [];
    return [{ message: rule.message, fields: [a, b] as const, values: [left, right] as const }];
  });
}
