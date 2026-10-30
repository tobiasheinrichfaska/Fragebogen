// Check hints (Prüfhinweise) for the lohnabrechnende Stelle (research 2026-10-30): the app collects
// the facts, people decide the status. A hint combines answers of any roles and named tests (pure
// functions, e.g. the Regelaltersgrenze from the birth date). Informational only — hints never
// block and are never sealed, so verification stays independent of other roles.
import { describeCondition, evaluateCondition, forEachLeaf } from './conditions';
import { formatGermanDate, isIsoDate, MONTH_NAMES } from './dates';
import { displayValue } from './display';
import { fieldsById, ownerOfField, roleOf, visibility } from './form';
import { canonicalize } from './jcs';
import type {
  CheckHint,
  FieldDefinition,
  FieldId,
  FieldType,
  FieldValue,
  FormDefinition,
  IsoDate,
  Questionnaire,
  RoleId,
} from './model';
import { currentPart } from './questionnaire';
import { monthAfter, regelaltersgrenze } from './regelaltersgrenze';

export interface HintResult {
  id: string;
  message: string;
  source?: string;
  /** Computed facts behind the hint, e.g. the day the Regelaltersgrenze is reached. */
  detail: string[];
}

interface HintTest {
  args: readonly FieldType[];
  /** German clause for the catalogue, from the argument labels. */
  describe: (labels: readonly string[]) => string;
  /** undefined when an argument is missing — the hint is then not shown. */
  run: (values: readonly FieldValue[]) => { holds: boolean; detail: string[] } | undefined;
}

function germanMonth(month: string): string {
  const [year = '', number = '1'] = month.split('-');
  return `${MONTH_NAMES[Number(number) - 1] ?? number} ${year}`;
}

/** Regelaltersgrenze of `birth` compared with a reference day (e.g. the start of employment). */
function ragTest(
  holds: (reached: IsoDate, on: IsoDate) => boolean,
  describe: (birth: string, on: string) => string,
): HintTest {
  return {
    args: ['date', 'date'],
    describe: ([birth = '', on = '']) => describe(birth, on),
    run: ([birth, on]) => {
      if (typeof birth !== 'string' || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const reached = regelaltersgrenze(birth);
      if (!reached) return undefined;
      return {
        holds: holds(reached, on),
        detail: [
          `Regelaltersgrenze laut Geburtsdatum: ${formatGermanDate(reached)}; Folgemonat: ${germanMonth(monthAfter(reached))}.`,
        ],
      };
    },
  };
}

const oneYearLater = (date: IsoDate): IsoDate => {
  const [year = 0, rest = ''] = [Number(date.slice(0, 4)), date.slice(4)];
  return `${String(year + 1).padStart(4, '0')}${rest === '-02-29' ? '-02-28' : rest}` as IsoDate;
};

export const HINT_TESTS: Readonly<Record<string, HintTest>> = {
  regelaltersgrenzeErreicht: ragTest(
    (reached, on) => reached <= on,
    (birth, on) => `laut „${birth}“ die Regelaltersgrenze am „${on}“ erreicht ist`,
  ),
  regelaltersgrenzeNichtErreicht: ragTest(
    (reached, on) => reached > on,
    (birth, on) => `laut „${birth}“ die Regelaltersgrenze am „${on}“ noch nicht erreicht ist`,
  ),
  regelaltersgrenzeInnerhalbEinesJahres: ragTest(
    (reached, on) => reached > on && reached <= oneYearLater(on),
    (birth, on) =>
      `laut „${birth}“ die Regelaltersgrenze innerhalb eines Jahres nach „${on}“ erreicht wird`,
  ),
};

/** Why a hint's test does not fit the definition, or undefined. */
export function hintTestProblem(
  test: NonNullable<CheckHint['test']>,
  fieldOf: (id: FieldId) => FieldDefinition | undefined,
): string | undefined {
  const spec = HINT_TESTS[test.fn];
  if (!spec) return `unknown test "${test.fn}"`;
  if (test.args.length !== spec.args.length) return `"${test.fn}" takes ${spec.args.length} fields`;
  for (const [i, id] of test.args.entries()) {
    const field = fieldOf(id);
    if (!field) return `unknown field "${id}"`;
    if (field.type !== spec.args[i]) return `"${id}" must be a ${spec.args[i] ?? '?'} field`;
  }
  return undefined;
}

function rolesOf(hint: CheckHint, definition: FormDefinition): Set<RoleId> {
  const roles = new Set<RoleId>();
  const add = (id: FieldId) => {
    const role = ownerOfField(definition, id);
    if (role !== undefined) roles.add(role);
  };
  if (hint.when) forEachLeaf(hint.when, '$', (leaf) => add(leaf.field));
  hint.test?.args.forEach(add);
  return roles;
}

/**
 * The hints that hold for the questionnaire as it stands: each role's current part (the latest
 * version, a draft included), hidden fields counting as unanswered.
 */
export function checkHints(questionnaire: Questionnaire, definition: FormDefinition): HintResult[] {
  const visible = new Map<RoleId, ReadonlyMap<FieldId, boolean>>();
  const valueOf = (id: FieldId): FieldValue => {
    const role = ownerOfField(definition, id);
    const part = role === undefined ? undefined : currentPart(questionnaire, role);
    if (role === undefined || !part) return null;
    let map = visible.get(role);
    if (!map) {
      map = visibility(definition, role, part.data);
      visible.set(role, map);
    }
    return map.get(id) === true ? (part.data[id] ?? null) : null;
  };
  const results: HintResult[] = [];
  for (const hint of definition.checkHints ?? []) {
    const roles = rolesOf(hint, definition);
    if ([...roles].some((role) => !currentPart(questionnaire, role))) continue;
    if (hint.when && !evaluateCondition(hint.when, valueOf)) continue;
    let detail: string[] = [];
    if (hint.test) {
      const outcome = HINT_TESTS[hint.test.fn]?.run(hint.test.args.map(valueOf));
      if (!outcome?.holds) continue;
      detail = outcome.detail;
    }
    results.push({
      id: hint.id,
      message: hint.message,
      ...(hint.source === undefined ? {} : { source: hint.source }),
      detail,
    });
  }
  return [...results, ...fromRoleHints(questionnaire, definition, valueOf)];
}

/**
 * A field another role decides (fromRole) that differs from that role's answer — e.g. the person
 * signed before the employer changed the kind of wage tax. An own extra option ("Weiß ich nicht")
 * is no contradiction.
 */
function fromRoleHints(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  valueOf: (id: FieldId) => FieldValue,
): HintResult[] {
  const fields = fieldsById(definition);
  const results: HintResult[] = [];
  for (const field of fields.values()) {
    const from = field.fromRole;
    const source = from && fields.get(from.field);
    if (!from || !source) continue;
    if (!currentPart(questionnaire, field.role) || !currentPart(questionnaire, from.role)) continue;
    const own = valueOf(field.id);
    const decided = valueOf(source.id);
    if (own === null || decided === null || canonicalize(own) === canonicalize(decided)) continue;
    if (source.type === 'choice' && !source.options?.some((option) => option.id === own)) continue;
    const ownRole = roleOf(definition, field.role)?.label ?? field.role;
    const fromRole = roleOf(definition, from.role)?.label ?? from.role;
    results.push({
      id: `fromRole:${field.id}`,
      message: `„${field.label}“ weicht ab: ${fromRole} gibt „${displayValue(source, decided)}“ an, im Teil „${ownRole}“ steht „${displayValue(field, own)}“. Davon hängen Fragen an „${ownRole}“ ab; bitte klären und gegebenenfalls neu unterschreiben lassen.`,
      detail: [],
    });
  }
  return results;
}

/** When a hint applies, in German (catalogue). */
export function describeHint(hint: CheckHint, definition: FormDefinition): string {
  const fields = fieldsById(definition);
  const parts: string[] = [];
  if (hint.when) parts.push(describeCondition(hint.when, fields));
  if (hint.test) {
    const labels = hint.test.args.map((id) => fields.get(id)?.label ?? id);
    parts.push(HINT_TESTS[hint.test.fn]?.describe(labels) ?? hint.test.fn);
  }
  return `wenn ${parts.join(' und ')}`;
}
