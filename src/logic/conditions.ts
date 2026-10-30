// Field conditions: when a field is available for input (`showIf`) and when it becomes required
// (`requiredIf`). The leaf operators are data — each declares the field types it applies to, how
// its operand is checked, how it evaluates and how it reads in German. Unanswered and hidden
// fields have the value null.
import {
  FIELD_TYPES,
  type Condition,
  type FieldDefinition,
  type FieldId,
  type FieldType,
  type FieldValue,
} from './model';
import { optionsOf } from './options';

export type LeafCondition = Extract<Condition, { field: FieldId }>;
export const CONDITION_OPERATORS = ['equals', 'in', 'contains', 'answered', 'startsWith'] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];
type Operand = string | boolean | readonly string[];

interface OperatorSpec {
  targets: readonly FieldType[];
  /** Why the operand does not fit the target field, if so. */
  checkOperand(operand: Operand, target: FieldDefinition): string | undefined;
  evaluate(value: FieldValue, operand: Operand): boolean;
  describe(label: string, operand: Operand, target: FieldDefinition): string;
}

const isOption = (target: FieldDefinition, id: unknown) =>
  typeof id === 'string' && optionsOf(target).some((option) => option.id === id);

function shown(target: FieldDefinition, operand: unknown): string {
  if (typeof operand === 'boolean') return operand ? 'Ja' : 'Nein';
  return optionsOf(target).find((option) => option.id === operand)?.label ?? String(operand);
}

const OPERATORS: Readonly<Record<ConditionOperator, OperatorSpec>> = {
  equals: {
    targets: ['boolean', 'choice'],
    checkOperand: (operand, target) => {
      if (target.type === 'boolean')
        return typeof operand === 'boolean' ? undefined : 'expected a boolean';
      return isOption(target, operand) ? undefined : `"${String(operand)}" is not an option id`;
    },
    evaluate: (value, operand) => value === operand,
    describe: (label, operand, target) =>
      typeof operand === 'boolean'
        ? `„${label}“ mit „${shown(target, operand)}“ beantwortet ist`
        : `bei „${label}“ „${shown(target, operand)}“ gewählt ist`,
  },
  in: {
    targets: ['choice'],
    checkOperand: (operand, target) => {
      if (!Array.isArray(operand) || operand.length === 0) return 'expected a non-empty list';
      const unknown = operand.filter((id) => !isOption(target, id));
      if (unknown.length > 0) return `"${unknown.join('", "')}" is not an option id`;
      return new Set(operand).size === operand.length ? undefined : 'lists an option twice';
    },
    evaluate: (value, operand) =>
      typeof value === 'string' && Array.isArray(operand) && operand.includes(value),
    describe: (label, operand, target) => {
      const options = (Array.isArray(operand) ? operand : []).map((id) => `„${shown(target, id)}“`);
      return `bei „${label}“ ${options.join(' oder ')} gewählt ist`;
    },
  },
  contains: {
    targets: ['multiChoice'],
    checkOperand: (operand, target) =>
      isOption(target, operand) ? undefined : `"${String(operand)}" is not an option id`,
    evaluate: (value, operand) =>
      Array.isArray(value) && typeof operand === 'string' && value.includes(operand),
    describe: (label, operand, target) =>
      `bei „${label}“ „${shown(target, operand)}“ angekreuzt ist`,
  },
  // e.g. a BIC only for an IBAN outside Germany: { "not": { "field": "iban", "startsWith": "DE" } }
  startsWith: {
    targets: ['text', 'iban', 'taxId', 'svNumber', 'betriebsnummer'],
    checkOperand: (operand, target) => {
      if (typeof operand !== 'string' || operand === '') return 'expected a non-empty text';
      if (target.type === 'iban' && !/^[A-Z0-9]+$/.test(operand)) {
        return 'IBANs are stored in capitals without spaces';
      }
      return undefined;
    },
    evaluate: (value, operand) =>
      typeof value === 'string' && typeof operand === 'string' && value.startsWith(operand),
    describe: (label, operand) => `„${label}“ mit „${String(operand)}“ beginnt`,
  },
  answered: {
    targets: FIELD_TYPES,
    checkOperand: (operand) => (typeof operand === 'boolean' ? undefined : 'expected a boolean'),
    evaluate: (value, operand) => (value !== null) === operand,
    describe: (label, operand) => (operand ? `„${label}“ ausgefüllt ist` : `„${label}“ leer ist`),
  },
};

export function leafOperator(leaf: LeafCondition): {
  operator: ConditionOperator;
  operand: Operand;
} {
  if ('equals' in leaf) return { operator: 'equals', operand: leaf.equals };
  if ('in' in leaf) return { operator: 'in', operand: leaf.in };
  if ('contains' in leaf) return { operator: 'contains', operand: leaf.contains };
  if ('startsWith' in leaf) return { operator: 'startsWith', operand: leaf.startsWith };
  return { operator: 'answered', operand: leaf.answered };
}

/** Why the leaf does not fit its target field: at `field` (wrong type) or at the operator key. */
export function leafProblem(
  leaf: LeafCondition,
  target: FieldDefinition,
): { at: 'field' | ConditionOperator; message: string } | undefined {
  const { operator, operand } = leafOperator(leaf);
  const spec = OPERATORS[operator];
  if (!spec.targets.includes(target.type)) {
    return {
      at: 'field',
      message: `"${operator}" only applies to ${spec.targets.join(' or ')} fields`,
    };
  }
  const message = spec.checkOperand(operand, target);
  return message === undefined ? undefined : { at: operator, message };
}

export function evaluateCondition(
  condition: Condition,
  valueOf: (fieldId: FieldId) => FieldValue,
): boolean {
  if ('all' in condition) return condition.all.every((child) => evaluateCondition(child, valueOf));
  if ('any' in condition) return condition.any.some((child) => evaluateCondition(child, valueOf));
  if ('not' in condition) return !evaluateCondition(condition.not, valueOf);
  const { operator, operand } = leafOperator(condition);
  return OPERATORS[operator].evaluate(valueOf(condition.field), operand);
}

/** Visits every leaf with its path (for definition checks). */
export function forEachLeaf(
  condition: Condition,
  path: string,
  visit: (leaf: LeafCondition, path: string) => void,
): void {
  if ('all' in condition) {
    condition.all.forEach((child, i) => {
      forEachLeaf(child, `${path}.all[${i}]`, visit);
    });
  } else if ('any' in condition) {
    condition.any.forEach((child, i) => {
      forEachLeaf(child, `${path}.any[${i}]`, visit);
    });
  } else if ('not' in condition) {
    forEachLeaf(condition.not, `${path}.not`, visit);
  } else {
    visit(condition, path);
  }
}

/**
 * The condition as a German subordinate clause (verb last) that follows "wenn", e.g.
 * „Weitere Beschäftigung“ mit „Ja“ beantwortet ist.
 */
export function describeCondition(
  condition: Condition,
  fields: ReadonlyMap<FieldId, FieldDefinition>,
): string {
  const nested = (child: Condition) => {
    const text = describeCondition(child, fields);
    return 'all' in child || 'any' in child ? `(${text})` : text;
  };
  if ('all' in condition) return condition.all.map(nested).join(' und ');
  if ('any' in condition) return condition.any.map(nested).join(' oder ');
  if ('not' in condition) return `nicht zutrifft, dass ${nested(condition.not)}`;
  const target = fields.get(condition.field);
  if (!target) return `„${condition.field}“ (unbekanntes Feld)`;
  const { operator, operand } = leafOperator(condition);
  return OPERATORS[operator].describe(target.label, operand, target);
}
