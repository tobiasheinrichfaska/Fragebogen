// Check hints (Prüfhinweise) for the lohnabrechnende Stelle (research 2026-10-30): the app collects
// the facts, people decide the status. A hint combines answers of any roles and named tests (pure
// functions, e.g. the Regelaltersgrenze from the birth date). Informational only — hints never
// block and are never sealed, so verification stays independent of other roles.
import { describeCondition, evaluateCondition, forEachLeaf } from './conditions';
import { dayNumber, formatGermanDate, isIsoDate, MONTH_NAMES } from './dates';
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
import { GERINGVERDIENERGRENZE, RECHENGROESSEN } from './data/rechengroessen';
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
  /**
   * undefined when an argument is missing — the hint is then not shown. `uncertain`: the test could
   * not decide for sure (e.g. a year without Rechengrößen); a derivation then asks for a check.
   */
  run: (
    values: readonly FieldValue[],
  ) => { holds: boolean; detail: string[]; uncertain?: boolean } | undefined;
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

/** A stored money value ("1234.56") or a column of them (summed) in cents; null = nothing. */
function cents(value: FieldValue): number | undefined {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    const parts = value.map(cents).filter((part): part is number => part !== undefined);
    return parts.length === 0 ? undefined : parts.reduce((a, b) => a + b, 0);
  }
  if (typeof value !== 'string' || !/^\d+(?:\.\d{2})?$/.test(value)) return undefined;
  const [euros = '0', rest = '00'] = value.split('.');
  return Number(euros) * 100 + Number(rest);
}

function euro(amount: number): string {
  const [euros = '0', rest = '00'] = (amount / 100).toFixed(2).split('.');
  return `${euros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${rest} €`;
}

/**
 * Own monthly pay plus the monthly pay of other jobs (a table column, summed; may be empty) against
 * a Rechengröße of the year of the start date. A year without data is a hint of its own kind: it
 * holds and says so, never guesses.
 */
function overLimit(
  limit: (year: string) => { monthly: number; label: string } | undefined,
  describe: (labels: readonly string[]) => string,
): HintTest {
  return {
    args: ['money', 'money', 'date'],
    describe,
    run: ([own, others, on]) => {
      const mine = cents(own ?? null);
      if (mine === undefined || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const together = mine + (cents(others ?? null) ?? 0);
      const year = on.slice(0, 4);
      const found = limit(year);
      if (!found) {
        return {
          holds: true,
          detail: [
            `Für ${year} sind die Rechengrößen in der App nicht hinterlegt – bitte selbst prüfen (zusammen ${euro(together)} im Monat).`,
          ],
        };
      }
      return {
        holds: together > found.monthly,
        detail: [
          `Zusammen ${euro(together)} im Monat (davon diese Beschäftigung ${euro(mine)}); ${found.label} ${year}: ${euro(found.monthly)} im Monat.`,
        ],
      };
    },
  };
}

const rechengroesse = (year: string, key: 'bbgKvMonat' | 'bbgRvMonat') => {
  const value = RECHENGROESSEN[year]?.[key];
  return value === undefined ? undefined : cents(value);
};

export const HINT_TESTS: Readonly<Record<string, HintTest>> = {
  hoechstensGeringfuegigkeitsgrenze: {
    args: ['money', 'date'],
    describe: ([pay = '', on = '']) =>
      `„${pay}“ höchstens die Geringfügigkeitsgrenze des Jahres von „${on}“ beträgt`,
    run: ([pay, on]) => {
      const amount = cents(pay ?? null);
      if (amount === undefined || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const year = on.slice(0, 4);
      const limit = RECHENGROESSEN[year]?.geringfuegigkeitsgrenzeMonat;
      if (limit === undefined) {
        return {
          holds: true,
          uncertain: true,
          detail: [
            `Für ${year} ist die Geringfügigkeitsgrenze in der App nicht hinterlegt – bitte selbst prüfen.`,
          ],
        };
      }
      const max = cents(limit) ?? 0;
      return {
        holds: amount <= max,
        detail: [`${euro(amount)} im Monat; Geringfügigkeitsgrenze ${year}: ${euro(max)}.`],
      };
    },
  },
  hoechstensGeringverdienergrenze: {
    args: ['money'],
    describe: ([pay = '']) =>
      `„${pay}“ (bei einer Tabelle die erste Zeile) höchstens 325 € im Monat beträgt`,
    run: ([pay]) => {
      const amount = cents(Array.isArray(pay) ? (pay[0] ?? null) : (pay ?? null));
      if (amount === undefined) return undefined;
      const max = cents(GERINGVERDIENERGRENZE) ?? 0;
      return {
        holds: amount <= max,
        detail: [`${euro(amount)} im Monat; Geringverdienergrenze: ${euro(max)}.`],
      };
    },
  },
  kuerzerAlsEineWoche: {
    args: ['date', 'date'],
    describe: ([from = '', until = '']) =>
      `von „${from}“ bis „${until}“ weniger als eine Woche liegt`,
    run: ([from, until]) =>
      typeof from === 'string' && typeof until === 'string' && isIsoDate(from) && isIsoDate(until)
        ? { holds: dayNumber(until) - dayNumber(from) + 1 < 7, detail: [] }
        : undefined,
  },
  spaeterAls: {
    args: ['date', 'date'],
    describe: ([later = '', earlier = '']) => `„${later}“ nach „${earlier}“ liegt`,
    run: ([later, earlier]) =>
      typeof later === 'string' &&
      typeof earlier === 'string' &&
      isIsoDate(later) &&
      isIsoDate(earlier)
        ? { holds: later > earlier, detail: [] }
        : undefined,
  },
  ueberJahresarbeitsentgeltgrenze: overLimit(
    (year) => {
      const yearly = RECHENGROESSEN[year]?.jaegJahr;
      const amount = yearly === undefined ? undefined : cents(yearly);
      return amount === undefined
        ? undefined
        : {
            monthly: Math.round(amount / 12),
            label: 'Jahresarbeitsentgeltgrenze (auf den Monat gerechnet)',
          };
    },
    ([own = '', others = '', on = '']) =>
      `„${own}“ und „${others}“ zusammen die Jahresarbeitsentgeltgrenze des Jahres von „${on}“ übersteigen`,
  ),
  ueberBeitragsbemessungsgrenze: overLimit(
    (year) => {
      const kv = rechengroesse(year, 'bbgKvMonat');
      const rv = rechengroesse(year, 'bbgRvMonat');
      return kv === undefined || rv === undefined
        ? undefined
        : {
            monthly: kv,
            label: `Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (Renten- und Arbeitslosenversicherung: ${euro(rv)})`,
          };
    },
    ([own = '', others = '', on = '']) =>
      `„${own}“ und „${others}“ zusammen die Beitragsbemessungsgrenze der Krankenversicherung des Jahres von „${on}“ übersteigen`,
  ),
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

/** Roles whose answers a hint, exclusion or derivation rule reads. */
export function rolesOf(
  hint: Pick<CheckHint, 'when' | 'test'>,
  definition: FormDefinition,
): Set<RoleId> {
  const roles = new Set<RoleId>();
  const add = (id: FieldId) => {
    const role =
      ownerOfField(definition, id) ??
      definition.sections
        .flatMap((section) => section.fields)
        .find((field) => field.columns?.some((column) => column.id === id))?.role;
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
const currentPart = (questionnaire: Questionnaire, role: RoleId) =>
  questionnaire.parts[role]?.at(-1);

export interface Values {
  valueOf: (id: FieldId) => FieldValue;
  argumentOf: (id: FieldId) => FieldValue;
}

/** Values of the current parts (drafts included); hidden fields count as unanswered. */
export function valuesOf(questionnaire: Questionnaire, definition: FormDefinition): Values {
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
  // A table column in a test stands for the list of its values in the table's rows.
  const tables = new Map<FieldId, FieldDefinition>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      for (const column of field.columns ?? []) tables.set(column.id, field);
    }
  }
  const argumentOf = (id: FieldId): FieldValue => {
    const table = tables.get(id);
    if (!table) return valueOf(id);
    const rows = valueOf(table.id);
    if (!Array.isArray(rows)) return null;
    return rows.map((row) =>
      row !== null && typeof row === 'object' && !Array.isArray(row) ? (row[id] ?? null) : null,
    );
  };
  return { valueOf, argumentOf };
}

/** Whether a condition and named test hold, with the test's facts. */
export function ruleHolds(
  rule: Pick<CheckHint, 'when' | 'test'>,
  values: Values,
): { holds: boolean; detail: string[]; uncertain: boolean } {
  if (rule.when && !evaluateCondition(rule.when, values.valueOf)) {
    return { holds: false, detail: [], uncertain: false };
  }
  if (!rule.test) return { holds: true, detail: [], uncertain: false };
  const outcome = HINT_TESTS[rule.test.fn]?.run(rule.test.args.map(values.argumentOf));
  return {
    holds: outcome?.holds === true,
    detail: outcome?.detail ?? [],
    uncertain: outcome?.uncertain === true,
  };
}

function holding(
  hints: readonly CheckHint[],
  values: Values,
  ready: (hint: CheckHint) => boolean,
): HintResult[] {
  const results: HintResult[] = [];
  for (const hint of hints) {
    if (!ready(hint)) continue;
    if (hint.when && !evaluateCondition(hint.when, values.valueOf)) continue;
    let detail: string[] = [];
    if (hint.test) {
      const outcome = HINT_TESTS[hint.test.fn]?.run(hint.test.args.map(values.argumentOf));
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
  return results;
}

/**
 * Special cases (`exclusions`) that hold for the questionnaire as it stands — evaluated as soon as
 * the answers exist, whichever role gave them. While one holds, signing and passing on are refused.
 */
export function activeExclusions(
  questionnaire: Questionnaire,
  definition: FormDefinition,
): HintResult[] {
  return holding(definition.exclusions ?? [], valuesOf(questionnaire, definition), () => true);
}

export function checkHints(questionnaire: Questionnaire, definition: FormDefinition): HintResult[] {
  const values = valuesOf(questionnaire, definition);
  const { valueOf } = values;
  const results = holding(definition.checkHints ?? [], values, (hint) =>
    [...rolesOf(hint, definition)].every((role) => currentPart(questionnaire, role)),
  );
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
