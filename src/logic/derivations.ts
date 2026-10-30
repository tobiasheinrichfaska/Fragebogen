// Proposals derived from the answers of all roles (Tobias 2026-10-30): the Personengruppe and the
// Beitragsgruppen. A derivation is a rule table in the form definition; the first rule whose
// condition and named test hold gives the value and its reason. Only a proposal for the recipient
// — never sealed, never decided by the app. A special case (exclusion) gives none at all.
import { describeHint, activeExclusions, rolesOf, ruleHolds, valuesOf } from './hints';
import type { Derivation, DerivationRule, FormDefinition, Questionnaire } from './model';

export type DerivationStatus = 'proposed' | 'incomplete' | 'excluded' | 'none';

export interface DerivationResult {
  id: string;
  label: string;
  status: DerivationStatus;
  /** Only when proposed. */
  value?: string;
  reason: string;
  /** The proposal needs a closer look. */
  check: boolean;
  /** Facts behind it, e.g. the Minijob limit of the year. */
  detail: string[];
  source?: string;
}

function result(
  derivation: Derivation,
  status: DerivationStatus,
  reason: string,
  more: Partial<Pick<DerivationResult, 'value' | 'check' | 'detail'>> = {},
): DerivationResult {
  return {
    id: derivation.id,
    label: derivation.label,
    status,
    reason,
    check: more.check ?? status !== 'proposed',
    detail: more.detail ?? [],
    ...(more.value === undefined ? {} : { value: more.value }),
    ...(derivation.source === undefined ? {} : { source: derivation.source }),
  };
}

export function derive(
  questionnaire: Questionnaire,
  definition: FormDefinition,
): DerivationResult[] {
  const derivations = definition.derivations ?? [];
  if (derivations.length === 0) return [];
  const excluded = activeExclusions(questionnaire, definition);
  const values = valuesOf(questionnaire, definition);
  const single = (derivation: Derivation): DerivationResult => {
    if (excluded.length > 0) {
      return result(derivation, 'excluded', 'Sonderfall – bitte selbst beurteilen.', {
        detail: excluded.map((e) => e.message),
      });
    }
    const rules = derivation.rules ?? [];
    const roles = new Set(rules.flatMap((rule) => [...rolesOf(rule, definition)]));
    const missing = definition.roles.filter(
      (role) => roles.has(role.id) && (questionnaire.parts[role.id] ?? []).length === 0,
    );
    if (missing.length > 0) {
      return result(
        derivation,
        'incomplete',
        `Es fehlt noch der Teil ${missing.map((role) => `„${role.label}“`).join(' und ')}.`,
      );
    }
    for (const rule of rules) {
      const outcome = ruleHolds(rule, values);
      if (!outcome.holds) continue;
      const value =
        rule.valueFrom === undefined ? rule.value : (values.valueOf(rule.valueFrom) ?? undefined);
      if (typeof value !== 'string') continue;
      return result(derivation, 'proposed', rule.reason, {
        value,
        check: rule.check === true || outcome.uncertain,
        detail: outcome.detail,
      });
    }
    return result(derivation, 'none', 'Keine Regel passt – bitte selbst bestimmen.');
  };
  const byId = new Map(derivations.map((derivation) => [derivation.id, derivation]));
  // A joined proposal: every part must give a value; the parts' reasons become its facts.
  const joined = (derivation: Derivation, parts: readonly string[]): DerivationResult => {
    const results = parts.flatMap((id) => {
      const part = byId.get(id);
      return part ? [single(part)] : [];
    });
    const open = results.find((part) => part.status !== 'proposed');
    if (open) {
      return result(derivation, open.status, `${open.label}: ${open.reason}`, {
        detail: open.detail,
      });
    }
    return result(derivation, 'proposed', results.map((part) => part.label).join(' · '), {
      value: results.map((part) => part.value ?? '').join(''),
      check: results.some((part) => part.check),
      detail: results.flatMap((part) => [
        `${part.label} ${part.value ?? ''}: ${part.reason}${part.check ? ' (prüfen)' : ''}`,
        ...part.detail,
      ]),
    });
  };
  const partIds = new Set(derivations.flatMap((derivation) => derivation.parts ?? []));
  return derivations
    .filter((derivation) => !partIds.has(derivation.id))
    .map((derivation) =>
      derivation.parts ? joined(derivation, derivation.parts) : single(derivation),
    );
}

/** One rule as people read it (catalogue, flow plan). */
export function describeRule(rule: DerivationRule, definition: FormDefinition): string {
  const when =
    rule.when || rule.test
      ? describeHint({ id: 'rule', message: rule.reason, ...rule }, definition)
      : 'sonst';
  const from = definition.sections
    .flatMap((section) => section.fields)
    .find((field) => field.id === rule.valueFrom);
  const value = rule.value ?? `Angabe „${from?.label ?? rule.valueFrom ?? ''}“`;
  return `${value}: ${when} – ${rule.reason}${rule.check ? ' (prüfen)' : ''}`;
}
