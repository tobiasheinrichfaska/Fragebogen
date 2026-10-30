// The flow plan (Ablaufplan) of a form for people: which station fills what, in which order the
// interview asks, which answers open which questions and why (`because`). Generated from the
// definition alone, like the catalogue; src/build/flowPlanPage.ts renders it as one HTML page.
import { describeCondition, forEachLeaf } from './conditions';
import { fieldDependencies } from './dependencies';
import { placeholderIds } from './display';
import { describeFieldRules, fieldsById, fieldsOfRole } from './form';
import type { RegisteredForm } from './formRegistry';
import { describeValidity } from './validity';
import type { Condition, FieldDefinition, FieldId, FormDefinition, RoleDefinition } from './model';

export interface FlowStep {
  /** Running number within the station, in interview order. */
  number: number;
  fieldId: FieldId;
  label: string;
  /** What the interview asks (placeholders shown as ‹Label›). */
  question: string;
  kind: string;
  /** 0 = always asked; n = rests on an answer of level n-1. */
  level: number;
  requirement: string;
  /** When the question is asked at all, e.g. "erst wenn …". */
  when?: string;
  /** Numbers of the questions of this station the condition looks at. */
  dependsOn: number[];
  because?: string;
  /** Another station decides the answer, e.g. "Arbeitgeber: „Art der Lohnsteuer“". */
  fromRole?: string;
  /** Numbers of the questions this answer opens or makes required. */
  opens: number[];
  /** Help text of a decision point: it often says why the question comes first. */
  help?: string;
}

export interface FlowSection {
  title: string;
  steps: FlowStep[];
}

export interface FlowStation {
  role: RoleDefinition;
  /** "immer" or the condition under which the station is needed. */
  needed: string;
  because?: string;
  signature: string;
  notices: string[];
  sections: FlowSection[];
}

export interface FlowPlan {
  id: string;
  version: string;
  title: string;
  definitionHash: string;
  /** "gilt für „…“ vom … bis …", when the version states its validity. */
  validity?: string;
  /** What the questionnaire does not cover. */
  limits: string[];
  /** Notes on the order of the stations. */
  order: string[];
  stations: FlowStation[];
}

const SIGNATURE: Readonly<Record<RoleDefinition['signature'], string>> = {
  required: 'unterschreibt',
  optional: 'schließt ab, Unterschrift freiwillig',
  none: 'schließt ohne Unterschrift ab',
};

const KIND: Readonly<Record<FieldDefinition['type'], string>> = {
  text: 'Text',
  date: 'Datum',
  choice: 'Auswahl',
  multiChoice: 'Mehrfachauswahl',
  boolean: 'Ja/Nein',
  iban: 'IBAN',
  taxId: 'Steuer-ID',
  svNumber: 'Versicherungsnummer',
  betriebsnummer: 'Betriebsnummer',
  money: 'Betrag',
  repeatGroup: 'Tabelle',
  file: 'Datei',
  number: 'Zahl',
  month: 'Monat',
};

function leaves(condition: Condition | undefined): FieldId[] {
  const ids: FieldId[] = [];
  if (condition) forEachLeaf(condition, '$', (leaf) => ids.push(leaf.field));
  return ids;
}

function roleLabel(definition: FormDefinition, id: string): string {
  return definition.roles.find((role) => role.id === id)?.label ?? id;
}

function shown(definition: FormDefinition, text: string): string {
  const fields = fieldsById(definition);
  return placeholderIds(text).reduce(
    (out, id) => out.replace(`{${id}}`, `„‹${fields.get(id)?.label ?? id}›“`),
    text,
  );
}

function kindOf(field: FieldDefinition): string {
  const options = field.options?.map((option) => option.label).join(' · ');
  const columns = field.columns?.map((column) => column.label).join(' · ');
  if (options) return `${KIND[field.type]}: ${options}`;
  if (columns) return `${KIND[field.type]} mit den Spalten ${columns}`;
  return KIND[field.type];
}

function stationNeeded(definition: FormDefinition, role: RoleDefinition): string {
  const condition = role.requiredIf;
  if (!condition) return 'immer';
  if (condition.kind === 'minorOnSigning') {
    const birth = fieldsById(definition).get(condition.birthDateField)?.label ?? '';
    return `nur wenn die Person laut „${birth}“ am Tag ihrer Unterschrift unter 18 ist`;
  }
  return `nur wenn ${describeCondition(condition.when, fieldsById(definition))}`;
}

/** Order notes: free order, linking, and which station should go first and why. */
function orderNotes(definition: FormDefinition): string[] {
  const notes = [
    'Die Reihenfolge der Stationen ist frei: auf einem Gerät nacheinander („Wer füllt jetzt aus?“) ' +
      'oder über die PDF von Station zu Station.',
  ];
  for (const [a, b] of definition.partLinks ?? []) {
    notes.push(
      `${roleLabel(definition, a)} und ${roleLabel(definition, b)}: Wer zuletzt abschließt, ` +
        'bestätigt die aktuelle Fassung des anderen Teils; erst dann sind beide verknüpft.',
    );
  }
  const fields = fieldsById(definition);
  const bySource = new Map<string, FieldDefinition[]>();
  for (const field of fields.values()) {
    if (!field.fromRole) continue;
    const key = `${field.fromRole.role}>${field.role}`;
    bySource.set(key, [...(bySource.get(key) ?? []), field]);
  }
  for (const [key, taken] of bySource) {
    const [from = '', to = ''] = key.split('>');
    const labels = taken.map((field) => `„${field.label}“`).join(', ');
    notes.push(
      `Empfohlen: ${roleLabel(definition, from)} zuerst. Dann übernimmt der Fragebogen ${labels} ` +
        `in den Teil „${roleLabel(definition, to)}“ und fragt dort nur, was dazu passt. Ist ` +
        `„${roleLabel(definition, to)}“ zuerst dran, wird ${labels} dort gefragt.`,
    );
  }
  for (const role of definition.roles) {
    if (role.requiredIf) {
      notes.push(
        `${role.label} kommt nur dazu, ${stationNeeded(definition, role).replace(/^nur /, '')}.`,
      );
    }
  }
  return notes;
}

function stationOf(definition: FormDefinition, role: RoleDefinition): FlowStation {
  const fields = fieldsById(definition);
  const own = fieldsOfRole(definition, role.id);
  const numbers = new Map(own.map((field, i) => [field.id, i + 1]));
  const dependencies = fieldDependencies(definition);
  const numbered = (ids: readonly FieldId[]) => [
    ...new Set(ids.flatMap((id) => numbers.get(id) ?? [])),
  ];
  const requiredBy = (id: FieldId) =>
    own.filter((other) => leaves(other.requiredIf).includes(id)).map((other) => other.id);
  const step = (field: FieldDefinition): FlowStep => {
    const { input, requirement } = describeFieldRules(definition, field);
    const source = field.fromRole && fields.get(field.fromRole.field);
    return {
      number: numbers.get(field.id) ?? 0,
      fieldId: field.id,
      label: field.label,
      question: shown(definition, field.question ?? field.label),
      kind: kindOf(field),
      level: dependencies.get(field.id)?.level ?? 0,
      requirement,
      ...(field.showIf ? { when: input } : {}),
      dependsOn: numbered([...leaves(field.showIf), ...leaves(field.requiredIf)]),
      ...(field.because === undefined ? {} : { because: field.because }),
      ...(field.fromRole && source
        ? { fromRole: `${roleLabel(definition, field.fromRole.role)}: „${source.label}“` }
        : {}),
      opens: numbered([...(dependencies.get(field.id)?.enables ?? []), ...requiredBy(field.id)]),
      ...(field.help !== undefined &&
      ((dependencies.get(field.id)?.enables.length ?? 0) > 0 || requiredBy(field.id).length > 0)
        ? { help: shown(definition, field.help) }
        : {}),
    };
  };
  return {
    role,
    needed: stationNeeded(definition, role),
    ...(role.because === undefined ? {} : { because: role.because }),
    signature: SIGNATURE[role.signature],
    notices: definition.infoBlocks
      .filter((block) => block.role === role.id)
      .map((block) => block.title),
    sections: definition.sections
      .map((section) => ({
        title: section.title,
        steps: section.fields.filter((field) => field.role === role.id).map(step),
      }))
      .filter((section) => section.steps.length > 0),
  };
}

export function flowPlan(form: RegisteredForm): FlowPlan {
  const { definition } = form;
  return {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    definitionHash: form.definitionHash,
    ...(describeValidity(definition) === undefined
      ? {}
      : { validity: describeValidity(definition) ?? '' }),
    limits: definition.limits ?? [],
    order: orderNotes(definition),
    stations: definition.roles.map((role) => stationOf(definition, role)),
  };
}

/** Conditional questions or stations without a `because` — a draft must explain every one. */
export function unexplainedConditions(definition: FormDefinition): string[] {
  const missing: string[] = [];
  for (const field of fieldsById(definition).values()) {
    const conditional = field.showIf ?? field.requiredIf ?? field.fromRole;
    if (conditional && field.because === undefined) missing.push(field.id);
  }
  for (const role of definition.roles) {
    if (role.requiredIf && role.because === undefined) missing.push(`role:${role.id}`);
  }
  return missing;
}
