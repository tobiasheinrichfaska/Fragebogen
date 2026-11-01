// Which answers move which proposal (Tobias 2026-11-01: "für jeden Eingabepunkt prüfen, in welchen
// Kombinationen dies Auswirkungen auf die BGS und PGRS hat"). Read off the rule tables: a field acts
// directly when a rule's condition, test or value names it, and indirectly when it decides whether
// such a field is asked at all (showIf, a table's condition for its columns, an answer taken from
// another role). Pure: the catalogue renders the result for review.
import { forEachLeaf } from './conditions';
import { describeRule } from './derivations';
import type { Condition, FieldDefinition, FieldId, FormDefinition } from './model';

export interface DerivationUse {
  derivation: string;
  /** Proposed values of the rules that name the field directly, in rule order, each once. */
  values: string[];
}

export interface FieldImpact {
  field: FieldDefinition;
  /** Section title, for grouping. */
  section: string;
  direct: DerivationUse[];
  /** Fields this one decides the visibility of, which act on a proposal (directly or further on). */
  gates: FieldId[];
}

function leavesOf(condition: Condition | undefined): FieldId[] {
  const ids: FieldId[] = [];
  if (condition) forEachLeaf(condition, '', (leaf) => ids.push(leaf.field));
  return ids;
}

/** The derivations that are rule tables (joined ones like the Beitragsgruppen only list parts). */
function ruleDerivations(definition: FormDefinition) {
  return (definition.derivations ?? []).filter((derivation) => derivation.rules);
}

export function derivationImpact(definition: FormDefinition): FieldImpact[] {
  const owner = new Map<FieldId, { field: FieldDefinition; table?: FieldDefinition }>();
  const order: { field: FieldDefinition; section: string }[] = [];
  for (const section of definition.sections) {
    for (const field of section.fields) {
      owner.set(field.id, { field });
      order.push({ field, section: section.title });
      for (const column of field.columns ?? [])
        owner.set(column.id, { field: column, table: field });
    }
  }

  const direct = new Map<FieldId, Map<string, Set<string>>>();
  for (const derivation of ruleDerivations(definition)) {
    for (const rule of derivation.rules ?? []) {
      const named = [
        ...leavesOf(rule.when),
        ...(rule.test?.args ?? []),
        ...(rule.valueFrom === undefined ? [] : [rule.valueFrom]),
      ];
      for (const id of new Set(named)) {
        // A column acts through its table: the person answers the table.
        const target = owner.get(id)?.table?.id ?? id;
        const uses = direct.get(target) ?? new Map<string, Set<string>>();
        const values = uses.get(derivation.id) ?? new Set<string>();
        values.add(rule.value ?? `„${rule.valueFrom ?? ''}“`);
        uses.set(derivation.id, values);
        direct.set(target, uses);
      }
    }
  }

  // Fields that decide whether a field is asked: its showIf, and an answer taken from another role.
  const deciders = (field: FieldDefinition): FieldId[] => [
    ...leavesOf(field.showIf),
    ...(field.fromRole ? [field.fromRole.field] : []),
  ];
  const acting = new Set(direct.keys());
  // Grow the set backwards: whoever decides about an acting field acts too (indirectly).
  const gates = new Map<FieldId, Set<FieldId>>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of [...acting]) {
      const field = owner.get(id)?.field;
      if (!field) continue;
      for (const decider of deciders(field)) {
        const set = gates.get(decider) ?? new Set<FieldId>();
        if (!set.has(id)) {
          set.add(id);
          gates.set(decider, set);
          grew = true;
        }
        if (!acting.has(decider)) {
          acting.add(decider);
          grew = true;
        }
      }
    }
  }

  return order.flatMap(({ field, section }) => {
    const uses = direct.get(field.id);
    const gated = [...(gates.get(field.id) ?? [])];
    if (!uses && gated.length === 0) return [];
    return [
      {
        field,
        section,
        direct: ruleDerivations(definition).flatMap((derivation) => {
          const values = uses?.get(derivation.id);
          return values ? [{ derivation: derivation.id, values: [...values] }] : [];
        }),
        gates: gated,
      },
    ];
  });
}

const md = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** The impact as Markdown: per answer the proposals it moves, then every rule table in German. */
export function impactReport(definition: FormDefinition): string {
  const labels = new Map(
    (definition.derivations ?? []).map((derivation) => [derivation.id, derivation.label]),
  );
  const fieldLabel = new Map(
    definition.sections
      .flatMap((section) => section.fields.flatMap((field) => [field, ...(field.columns ?? [])]))
      .map((field) => [field.id, field.label]),
  );
  const impact = derivationImpact(definition);
  const lines = [
    `# Wirkung der Angaben auf die Vorschläge – ${definition.title} ${definition.version}`,
    '',
    '> Erzeugt aus der Formulardefinition (`npm run catalogue`), nicht von Hand bearbeiten.',
    '> „Direkt“: Die Angabe steht in einer Regel des Vorschlags (Bedingung, Prüfung oder Wert).',
    '> „Entscheidet, ob gefragt wird“: Von der Angabe hängt ab, ob eine wirksame Angabe überhaupt',
    '> gefragt wird. Die Regeln selbst stehen im zweiten Teil, in der Reihenfolge, in der sie gelten',
    '> (die erste zutreffende Regel gibt den Wert).',
    '',
    `${impact.length} Angaben wirken auf mindestens einen Vorschlag.`,
    '',
    '## Je Angabe',
    '',
    '| Abschnitt | Angabe | Rolle | Direkt (Vorschlag: Werte) | Entscheidet, ob gefragt wird |',
    '| --- | --- | --- | --- | --- |',
    ...impact.map(
      ({ field, section, direct, gates }) =>
        `| ${md(section)} | ${md(field.label)} (\`${field.id}\`) | ${field.role} | ${
          direct
            .map(
              (use) =>
                `${md(labels.get(use.derivation) ?? use.derivation)}: ${use.values.join(', ')}`,
            )
            .join('; ') || '–'
        } | ${gates.map((id) => md(fieldLabel.get(id) ?? id)).join(', ') || '–'} |`,
    ),
    '',
    '## Die Regeln',
  ];
  for (const derivation of definition.derivations ?? []) {
    lines.push('', `### ${derivation.label} (\`${derivation.id}\`)`, '');
    if (derivation.parts) {
      lines.push(
        `Zusammengesetzt aus: ${derivation.parts.map((id) => labels.get(id) ?? id).join(' · ')}.`,
      );
      continue;
    }
    (derivation.rules ?? []).forEach((rule, i) => {
      lines.push(`${i + 1}. ${describeRule(rule, definition)}`);
    });
  }
  return `${lines.join('\n')}\n`;
}
