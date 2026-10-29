// Form definitions are data (forms/<id>/<version>.json). parseFormDefinition decodes untrusted JSON
// strictly into a typed FormDefinition (see decode.ts) and then checks every id reference inside it.
import { COMPUTE_FUNCTIONS } from './compute';
import { CONDITION_OPERATORS, forEachLeaf, leafProblem } from './conditions';
import { isIsoDate } from './dates';
import { Decoder, type DecodeIssue } from './decode';
import { isPlainObject } from './jcs';
import {
  ACKNOWLEDGEMENT_KINDS,
  FIELD_TYPES,
  SIGNATURE_POLICIES,
  SIGNATURE_REQUIREMENTS,
  type ChoiceOption,
  type Condition,
  type ConsistencyRule,
  type FieldDefinition,
  type FieldType,
  type FormDefinition,
  type InfoBlock,
  type MatchKey,
  type RoleCondition,
  type RoleDefinition,
  type SectionDefinition,
} from './model';

/** Form id, also the folder name under forms/. */
export const FORM_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
/** Ids of roles, sections, fields and notices — they appear in stored data and hashes. */
export const ID = /^[a-z][a-zA-Z0-9]{0,63}$/;
/** Option ids may also be codes such as "101". */
export const OPTION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CONDITION_DEPTH = 8;

export type DefinitionResult =
  { ok: true; definition: FormDefinition } | { ok: false; issues: DecodeIssue[] };

export function parseFormDefinition(raw: unknown): DefinitionResult {
  const decoder = new Decoder();
  const definition = decodeForm(decoder, raw, '$');
  if (!definition || decoder.issues.length > 0) return { ok: false, issues: decoder.issues };
  const issues = checkFormDefinition(definition);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, definition };
}

// ---------------------------------------------------------------------------
// Decoding (shape and types)
// ---------------------------------------------------------------------------

function decodeForm(d: Decoder, raw: unknown, path: string): FormDefinition | undefined {
  const o = d.object(raw, path, [
    'id',
    'version',
    'title',
    'signaturePolicy',
    'roles',
    'recipient',
    'sections',
    'infoBlocks',
    'consistencyRules',
    'matchKeys',
    'legalNotes',
    'partLinks',
  ]);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, FORM_ID);
  const version = d.string(o.version, `${path}.version`, SEMVER);
  const title = d.string(o.title, `${path}.title`);
  const signaturePolicy = d.literal(
    o.signaturePolicy,
    `${path}.signaturePolicy`,
    SIGNATURE_POLICIES,
  );
  const roles = d.array(o.roles, `${path}.roles`, (v, p) => decodeRole(d, v, p), 1);
  const recipientObject = d.object(o.recipient, `${path}.recipient`, ['label']);
  const recipientLabel =
    recipientObject && d.string(recipientObject.label, `${path}.recipient.label`);
  const sections = d.array(o.sections, `${path}.sections`, (v, p) => decodeSection(d, v, p), 1);
  const infoBlocks = d.array(o.infoBlocks, `${path}.infoBlocks`, (v, p) =>
    decodeInfoBlock(d, v, p),
  );
  const consistencyRules = d.array(o.consistencyRules, `${path}.consistencyRules`, (v, p) =>
    decodeConsistencyRule(d, v, p),
  );
  const matchKeys = d.array(o.matchKeys, `${path}.matchKeys`, (v, p) => decodeMatchKey(d, v, p));
  const legalNotes = d.array(o.legalNotes, `${path}.legalNotes`, (v, p) => d.string(v, p));
  const partLinks =
    o.partLinks === undefined
      ? undefined
      : d.array(o.partLinks, `${path}.partLinks`, (v, p) => decodeRolePair(d, v, p), 1);
  if (
    id === undefined ||
    version === undefined ||
    title === undefined ||
    signaturePolicy === undefined ||
    roles === undefined ||
    recipientLabel === undefined ||
    sections === undefined ||
    infoBlocks === undefined ||
    consistencyRules === undefined ||
    matchKeys === undefined ||
    legalNotes === undefined
  ) {
    return undefined;
  }
  return {
    id,
    version,
    title,
    signaturePolicy,
    roles,
    recipient: { label: recipientLabel },
    sections,
    infoBlocks,
    consistencyRules,
    matchKeys,
    legalNotes,
    ...(partLinks === undefined ? {} : { partLinks }),
  };
}

function decodeRolePair(d: Decoder, raw: unknown, path: string): [string, string] | undefined {
  const ids = d.array(raw, path, (v, p) => d.string(v, p, ID), 2);
  if (!ids) return undefined;
  const [first, second, ...rest] = ids;
  if (first === undefined || second === undefined || rest.length > 0) {
    return d.report(path, 'needs exactly 2 role ids');
  }
  return [first, second];
}

function decodeRole(d: Decoder, raw: unknown, path: string): RoleDefinition | undefined {
  const o = d.object(raw, path, [
    'id',
    'label',
    'stationHeading',
    'confirmationText',
    'signature',
    'requiredIf',
    'signerNameField',
  ]);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const label = d.string(o.label, `${path}.label`);
  const stationHeading = d.string(o.stationHeading, `${path}.stationHeading`);
  const confirmationText = d.string(o.confirmationText, `${path}.confirmationText`);
  const signature = d.literal(o.signature, `${path}.signature`, SIGNATURE_REQUIREMENTS);
  const requiredIf =
    o.requiredIf === undefined
      ? undefined
      : decodeRoleCondition(d, o.requiredIf, `${path}.requiredIf`);
  const signerNameField =
    o.signerNameField === undefined
      ? undefined
      : d.string(o.signerNameField, `${path}.signerNameField`, ID);
  if (
    id === undefined ||
    label === undefined ||
    stationHeading === undefined ||
    confirmationText === undefined ||
    signature === undefined
  ) {
    return undefined;
  }
  return {
    id,
    label,
    stationHeading,
    confirmationText,
    signature,
    ...(requiredIf === undefined ? {} : { requiredIf }),
    ...(signerNameField === undefined ? {} : { signerNameField }),
  };
}

function decodeRoleCondition(d: Decoder, raw: unknown, path: string): RoleCondition | undefined {
  const o = d.object(raw, path, ['kind', 'birthDateField']);
  if (!o) return undefined;
  const kind = d.literal(o.kind, `${path}.kind`, ['minorOnSigning'] as const);
  const birthDateField = d.string(o.birthDateField, `${path}.birthDateField`, ID);
  if (kind === undefined || birthDateField === undefined) return undefined;
  return { kind, birthDateField };
}

function decodeSection(d: Decoder, raw: unknown, path: string): SectionDefinition | undefined {
  const o = d.object(raw, path, ['id', 'title', 'fields']);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const title = d.string(o.title, `${path}.title`);
  const fields = d.array(o.fields, `${path}.fields`, (v, p) => decodeField(d, v, p), 1);
  if (id === undefined || title === undefined || fields === undefined) return undefined;
  return { id, title, fields };
}

const FIELD_KEYS = [
  'id',
  'role',
  'type',
  'label',
  'question',
  'help',
  'required',
  'requiredIf',
  'purpose',
  'voluntary',
  'multiline',
  'options',
  'showIf',
  'columns',
  'computed',
  'initial',
  'masterData',
] as const;

function decodeField(d: Decoder, raw: unknown, path: string): FieldDefinition | undefined {
  const o = d.object(raw, path, FIELD_KEYS);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const role = d.string(o.role, `${path}.role`, ID);
  const type = d.literal(o.type, `${path}.type`, FIELD_TYPES);
  const label = d.string(o.label, `${path}.label`);
  const question = o.question === undefined ? undefined : d.string(o.question, `${path}.question`);
  const help = o.help === undefined ? undefined : d.string(o.help, `${path}.help`);
  const required = d.boolean(o.required, `${path}.required`);
  const requiredIf =
    o.requiredIf === undefined
      ? undefined
      : decodeCondition(d, o.requiredIf, `${path}.requiredIf`, 0);
  const purpose = d.string(o.purpose, `${path}.purpose`);
  const voluntary =
    o.voluntary === undefined ? undefined : d.boolean(o.voluntary, `${path}.voluntary`);
  const multiline =
    o.multiline === undefined ? undefined : d.boolean(o.multiline, `${path}.multiline`);
  const options =
    o.options === undefined
      ? undefined
      : d.array(o.options, `${path}.options`, (v, p) => decodeOption(d, v, p), 1);
  const showIf =
    o.showIf === undefined ? undefined : decodeCondition(d, o.showIf, `${path}.showIf`, 0);
  const columns =
    o.columns === undefined
      ? undefined
      : d.array(o.columns, `${path}.columns`, (v, p) => decodeField(d, v, p), 1);
  const computed =
    o.computed === undefined ? undefined : decodeComputed(d, o.computed, `${path}.computed`);
  const initial =
    o.initial === undefined || typeof o.initial === 'boolean'
      ? o.initial
      : d.string(o.initial, `${path}.initial`, OPTION_ID);
  const masterData =
    o.masterData === undefined ? undefined : d.string(o.masterData, `${path}.masterData`, ID);
  if (
    id === undefined ||
    role === undefined ||
    type === undefined ||
    label === undefined ||
    required === undefined ||
    purpose === undefined
  ) {
    return undefined;
  }
  return {
    id,
    role,
    type,
    label,
    ...(question === undefined ? {} : { question }),
    ...(help === undefined ? {} : { help }),
    required,
    ...(requiredIf === undefined ? {} : { requiredIf }),
    purpose,
    ...(voluntary === undefined ? {} : { voluntary }),
    ...(multiline === undefined ? {} : { multiline }),
    ...(options === undefined ? {} : { options }),
    ...(showIf === undefined ? {} : { showIf }),
    ...(columns === undefined ? {} : { columns }),
    ...(computed === undefined ? {} : { computed }),
    ...(initial === undefined ? {} : { initial }),
    ...(masterData === undefined ? {} : { masterData }),
  };
}

function decodeOption(d: Decoder, raw: unknown, path: string): ChoiceOption | undefined {
  const o = d.object(raw, path, ['id', 'label']);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, OPTION_ID);
  const label = d.string(o.label, `${path}.label`);
  if (id === undefined || label === undefined) return undefined;
  return { id, label };
}

function decodeCondition(
  d: Decoder,
  raw: unknown,
  path: string,
  depth: number,
): Condition | undefined {
  if (depth >= MAX_CONDITION_DEPTH) return d.report(path, 'condition nested too deeply');
  if (isPlainObject(raw) && ('all' in raw || 'any' in raw)) {
    const key = 'all' in raw ? 'all' : 'any';
    const o = d.object(raw, path, [key]);
    const items =
      o && d.array(o[key], `${path}.${key}`, (v, p) => decodeCondition(d, v, p, depth + 1), 1);
    if (!items) return undefined;
    return key === 'all' ? { all: items } : { any: items };
  }
  if (isPlainObject(raw) && 'not' in raw) {
    const o = d.object(raw, path, ['not']);
    const inner = o && decodeCondition(d, o.not, `${path}.not`, depth + 1);
    return inner === undefined ? undefined : { not: inner };
  }
  const o = d.object(raw, path, ['field', ...CONDITION_OPERATORS]);
  if (!o) return undefined;
  const field = d.string(o.field, `${path}.field`, ID);
  const operators = CONDITION_OPERATORS.filter((operator) => operator in o);
  if (operators.length !== 1) {
    return d.report(path, `needs exactly one of: ${CONDITION_OPERATORS.join(', ')}`);
  }
  switch (operators[0]) {
    case 'equals': {
      const equals =
        typeof o.equals === 'boolean' ? o.equals : d.string(o.equals, `${path}.equals`, OPTION_ID);
      return field === undefined || equals === undefined ? undefined : { field, equals };
    }
    case 'in': {
      const values = d.array(o.in, `${path}.in`, (v, p) => d.string(v, p, OPTION_ID), 1);
      return field === undefined || values === undefined ? undefined : { field, in: values };
    }
    case 'contains': {
      const contains = d.string(o.contains, `${path}.contains`, OPTION_ID);
      return field === undefined || contains === undefined ? undefined : { field, contains };
    }
    default: {
      const answered = d.boolean(o.answered, `${path}.answered`);
      return field === undefined || answered === undefined ? undefined : { field, answered };
    }
  }
}

function decodeComputed(
  d: Decoder,
  raw: unknown,
  path: string,
): FieldDefinition['computed'] | undefined {
  const o = d.object(raw, path, ['fn', 'args']);
  if (!o) return undefined;
  const fn = d.string(o.fn, `${path}.fn`, ID);
  const args = d.array(o.args, `${path}.args`, (v, p) => d.string(v, p, ID));
  if (fn === undefined || args === undefined) return undefined;
  return { fn, args };
}

function decodeInfoBlock(d: Decoder, raw: unknown, path: string): InfoBlock | undefined {
  const o = d.object(raw, path, ['id', 'role', 'title', 'text', 'asOf', 'acknowledgement']);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const role = d.string(o.role, `${path}.role`, ID);
  const title = d.string(o.title, `${path}.title`);
  const text = d.string(o.text, `${path}.text`);
  const asOf = d.string(o.asOf, `${path}.asOf`, ISO_DATE_SHAPE);
  const acknowledgement = d.literal(
    o.acknowledgement,
    `${path}.acknowledgement`,
    ACKNOWLEDGEMENT_KINDS,
  );
  if (
    id === undefined ||
    role === undefined ||
    title === undefined ||
    text === undefined ||
    asOf === undefined ||
    acknowledgement === undefined
  ) {
    return undefined;
  }
  return { id, role, title, text, asOf, acknowledgement };
}

function decodeConsistencyRule(
  d: Decoder,
  raw: unknown,
  path: string,
): ConsistencyRule | undefined {
  const o = d.object(raw, path, ['kind', 'fields', 'message']);
  if (!o) return undefined;
  const kind = d.literal(o.kind, `${path}.kind`, ['equal'] as const);
  const fields = d.array(o.fields, `${path}.fields`, (v, p) => d.string(v, p, ID), 2);
  const message = d.string(o.message, `${path}.message`);
  if (kind === undefined || fields === undefined || message === undefined) return undefined;
  const [first, second, ...rest] = fields;
  if (first === undefined || second === undefined || rest.length > 0) {
    return d.report(`${path}.fields`, 'needs exactly 2 field ids');
  }
  return { kind, fields: [first, second], message };
}

function decodeMatchKey(d: Decoder, raw: unknown, path: string): MatchKey | undefined {
  const o = d.object(raw, path, ['label', 'fields']);
  if (!o) return undefined;
  const label = d.string(o.label, `${path}.label`);
  const fields = d.record(o.fields, `${path}.fields`, ID, (v, p) => d.string(v, p, ID));
  if (label === undefined || fields === undefined) return undefined;
  return { label, fields };
}

// ---------------------------------------------------------------------------
// Reference checks (ids between roles, fields, notices and rules)
// ---------------------------------------------------------------------------

interface FieldEntry {
  field: FieldDefinition;
  path: string;
  isColumn: boolean;
}

interface CheckContext {
  definition: FormDefinition;
  roleIds: ReadonlySet<string>;
  fields: ReadonlyMap<string, FieldEntry>;
  report(path: string, message: string): void;
}

type DefinitionRule = (context: CheckContext) => void;

/** Reference checks on an already decoded definition; an empty list means the definition is sound. */
export function checkFormDefinition(definition: FormDefinition): DecodeIssue[] {
  const issues: DecodeIssue[] = [];
  const report = (path: string, message: string) => {
    issues.push({ path, message });
  };
  const fields = collectFields(definition, report);
  const context: CheckContext = {
    definition,
    roleIds: new Set(definition.roles.map((role) => role.id)),
    fields,
    report,
  };
  for (const rule of DEFINITION_RULES) rule(context);
  return issues;
}

/** Field ids are unique across the whole form, columns included. */
function collectFields(
  definition: FormDefinition,
  report: (path: string, message: string) => void,
): Map<string, FieldEntry> {
  const fields = new Map<string, FieldEntry>();
  const add = (field: FieldDefinition, path: string, isColumn: boolean) => {
    const existing = fields.get(field.id);
    if (existing) report(`${path}.id`, `duplicate field id "${field.id}" (also ${existing.path})`);
    else fields.set(field.id, { field, path, isColumn });
  };
  definition.sections.forEach((section, s) => {
    section.fields.forEach((field, f) => {
      const path = `$.sections[${s}].fields[${f}]`;
      add(field, path, false);
      field.columns?.forEach((column, c) => {
        add(column, `${path}.columns[${c}]`, true);
      });
    });
  });
  return fields;
}

function uniqueIds({ definition, report }: CheckContext): void {
  const groups: [string, readonly { id: string }[]][] = [
    ['roles', definition.roles],
    ['sections', definition.sections],
    ['infoBlocks', definition.infoBlocks],
  ];
  for (const [name, items] of groups) {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      if (seen.has(item.id)) report(`$.${name}[${i}].id`, `duplicate id "${item.id}"`);
      seen.add(item.id);
    });
  }
}

function fieldShapes({ fields, roleIds, report }: CheckContext): void {
  for (const { field, path, isColumn } of fields.values()) {
    if (!roleIds.has(field.role)) report(`${path}.role`, `unknown role "${field.role}"`);
    const isChoice = field.type === 'choice' || field.type === 'multiChoice';
    if (isChoice && !field.options) report(path, `${field.type} field needs options`);
    if (!isChoice && field.options) report(`${path}.options`, `only choice fields have options`);
    const optionIds = new Set<string>();
    field.options?.forEach((option, i) => {
      if (optionIds.has(option.id)) {
        report(`${path}.options[${i}].id`, `duplicate option id "${option.id}"`);
      }
      optionIds.add(option.id);
    });
    if (field.type === 'repeatGroup' && !field.columns) report(path, 'repeatGroup needs columns');
    if (field.type !== 'repeatGroup' && field.columns) {
      report(`${path}.columns`, 'only repeatGroup fields have columns');
    }
    if (isColumn && field.type === 'repeatGroup') report(path, 'repeat groups cannot be nested');
    if (field.multiline !== undefined && field.type !== 'text') {
      report(`${path}.multiline`, 'only text fields can be multiline');
    }
  }
}

/**
 * showIf (available for input) and requiredIf (conditionally required) reference fields of the
 * same role only; every leaf must fit its target field. Only showIf affects visibility, so only
 * showIf dependencies must be acyclic.
 */
function conditions({ fields, report }: CheckContext): void {
  const dependsOn = new Map<string, string[]>();
  for (const { field, path } of fields.values()) {
    if (field.required && field.requiredIf) {
      report(`${path}.requiredIf`, 'use either "required": true or "requiredIf", not both');
    }
    for (const kind of ['showIf', 'requiredIf'] as const) {
      const condition = field[kind];
      if (!condition) continue;
      const targets: string[] = [];
      forEachLeaf(condition, `${path}.${kind}`, (leaf, leafPath) => {
        targets.push(leaf.field);
        const target = fields.get(leaf.field);
        if (!target) return report(`${leafPath}.field`, `unknown field "${leaf.field}"`);
        if (target.field.role !== field.role) {
          report(`${leafPath}.field`, `${kind} may only reference fields of the same role`);
        }
        if (target.isColumn)
          report(`${leafPath}.field`, `${kind} cannot reference a repeat-group column`);
        if (kind === 'requiredIf' && leaf.field === field.id) {
          report(`${leafPath}.field`, 'a field cannot make itself required');
        }
        const problem = leafProblem(leaf, target.field);
        if (problem) report(`${leafPath}.${problem.at}`, problem.message);
      });
      if (kind === 'showIf') dependsOn.set(field.id, targets);
    }
  }
  const cycle = findCycle(dependsOn);
  if (cycle) report('$', `showIf conditions form a cycle: ${cycle.join(' → ')}`);
}

/** Returns one cycle (start … start) in the dependency graph, if any. */
export function findCycle(graph: ReadonlyMap<string, readonly string[]>): string[] | undefined {
  const done = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): string[] | undefined => {
    const index = stack.indexOf(node);
    if (index >= 0) return [...stack.slice(index), node];
    if (done.has(node)) return undefined;
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    done.add(node);
    return undefined;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return undefined;
}

function computedFields({ fields, report }: CheckContext): void {
  for (const { field, path } of fields.values()) {
    if (!field.computed) continue;
    if (!Object.hasOwn(COMPUTE_FUNCTIONS, field.computed.fn)) {
      report(`${path}.computed.fn`, `unknown compute function "${field.computed.fn}"`);
    }
    field.computed.args.forEach((arg, i) => {
      if (!fields.has(arg)) report(`${path}.computed.args[${i}]`, `unknown field "${arg}"`);
    });
  }
}

function roles({ definition, fields, report }: CheckContext): void {
  definition.roles.forEach((role, i) => {
    const path = `$.roles[${i}]`;
    const condition = role.requiredIf;
    if (condition) {
      const target = fields.get(condition.birthDateField);
      if (!target) {
        report(`${path}.requiredIf.birthDateField`, `unknown field "${condition.birthDateField}"`);
      } else if (target.field.type !== 'date') {
        report(`${path}.requiredIf.birthDateField`, 'must reference a date field');
      } else if (target.field.role === role.id) {
        report(`${path}.requiredIf.birthDateField`, 'must belong to another role');
      } else {
        // The person whose age triggers the guardian must sign as well — no signature, no transmission.
        const subject = definition.roles.find((candidate) => candidate.id === target.field.role);
        if (subject && subject.signature !== 'required') {
          report(
            `${path}.requiredIf.birthDateField`,
            `role "${subject.id}" must sign ("required")`,
          );
        }
      }
      if (role.signature !== 'required') {
        report(`${path}.signature`, 'a conditional role must sign ("required")');
      }
    }
    if (role.signerNameField !== undefined) {
      const name = fields.get(role.signerNameField);
      const fieldPath = `${path}.signerNameField`;
      if (!name) report(fieldPath, `unknown field "${role.signerNameField}"`);
      else if (name.isColumn || name.field.role !== role.id) {
        report(fieldPath, 'must be a top-level field of the same role');
      } else if (name.field.type !== 'text' || !name.field.required || name.field.showIf) {
        report(fieldPath, 'must be a required, always visible text field');
      }
    }
    const hasFields = [...fields.values()].some((entry) => entry.field.role === role.id);
    if (!hasFields && role.signature === 'none') {
      report(path, `role "${role.id}" has neither fields nor a signature`);
    }
  });
}

function infoBlocks({ definition, roleIds, report }: CheckContext): void {
  definition.infoBlocks.forEach((block, i) => {
    const path = `$.infoBlocks[${i}]`;
    if (!roleIds.has(block.role)) report(`${path}.role`, `unknown role "${block.role}"`);
    if (!isIsoDate(block.asOf)) report(`${path}.asOf`, `"${block.asOf}" is not a calendar date`);
  });
}

function consistencyRules({ definition, fields, report }: CheckContext): void {
  definition.consistencyRules.forEach((rule, i) => {
    const path = `$.consistencyRules[${i}].fields`;
    rule.fields.forEach((id, f) => {
      if (!fields.has(id)) report(`${path}[${f}]`, `unknown field "${id}"`);
    });
    if (rule.fields[0] === rule.fields[1]) report(path, 'compares a field with itself');
  });
}

function matchKeys({ definition, fields, roleIds, report }: CheckContext): void {
  definition.matchKeys.forEach((key, i) => {
    const path = `$.matchKeys[${i}].fields`;
    const entries = Object.entries(key.fields);
    if (entries.length < 2) report(path, 'a match key links at least 2 roles');
    for (const [role, id] of entries) {
      if (!roleIds.has(role)) report(`${path}.${role}`, `unknown role "${role}"`);
      const target = fields.get(id);
      if (!target) report(`${path}.${role}`, `unknown field "${id}"`);
      else if (target.field.role !== role) {
        report(`${path}.${role}`, `field "${id}" belongs to role "${target.field.role}"`);
      }
    }
  });
}

/** A preselection is a valid answer of an always available yes/no or choice field. */
function initialValues({ fields, report }: CheckContext): void {
  for (const { field, path, isColumn } of fields.values()) {
    if (field.initial === undefined) continue;
    const at = `${path}.initial`;
    if (field.type === 'boolean') {
      if (typeof field.initial !== 'boolean') report(at, 'expected a boolean');
    } else if (field.type === 'choice') {
      if (!field.options?.some((option) => option.id === field.initial)) {
        report(at, `"${String(field.initial)}" is not an option id`);
      }
    } else {
      report(at, 'only yes/no and choice fields can be preselected');
    }
    if (field.showIf || isColumn)
      report(at, 'only always available top-level fields can be preselected');
  }
}

/** Field types whose stored value is one string — the only ones a bookmark link can carry. */
const MASTER_DATA_TYPES: readonly FieldType[] = [
  'text',
  'date',
  'choice',
  'iban',
  'taxId',
  'svNumber',
  'betriebsnummer',
  'money',
];

/**
 * The interview asks in form order, so a field can only become available through an earlier
 * answer; otherwise its question would appear behind the person. requiredIf may look ahead (phone
 * or e-mail) — the summary before signing catches that.
 */
function interviewOrder({ definition, report }: CheckContext): void {
  const position = new Map(
    definition.sections.flatMap((section) => section.fields).map((field, i) => [field.id, i]),
  );
  definition.sections.forEach((section, s) => {
    section.fields.forEach((field, f) => {
      if (!field.showIf) return;
      const own = position.get(field.id) ?? 0;
      forEachLeaf(field.showIf, `$.sections[${s}].fields[${f}].showIf`, (leaf, leafPath) => {
        const target = position.get(leaf.field);
        if (target !== undefined && target >= own) {
          report(
            `${leafPath}.field`,
            `"${leaf.field}" must come before "${field.id}" (interview order)`,
          );
        }
      });
    });
  });
}

/** A master-data key names one top-level text-like field per form. */
function masterDataKeys({ fields, report }: CheckContext): void {
  const seen = new Map<string, string>();
  for (const { field, path, isColumn } of fields.values()) {
    if (field.masterData === undefined) continue;
    const at = `${path}.masterData`;
    if (isColumn || !MASTER_DATA_TYPES.includes(field.type)) {
      report(at, 'only single text values (top-level, not yes/no or lists) can be master data');
    }
    const other = seen.get(field.masterData);
    if (other !== undefined) report(at, `key "${field.masterData}" is already used by "${other}"`);
    else seen.set(field.masterData, field.id);
  }
}

/** Linked parts belong to two different unconditional roles; each pair is listed once. */
function partLinks({ definition, roleIds, report }: CheckContext): void {
  const pairs = new Set<string>();
  definition.partLinks?.forEach((pair, i) => {
    const path = `$.partLinks[${i}]`;
    for (const role of pair) {
      if (!roleIds.has(role)) report(path, `unknown role "${role}"`);
      else if (definition.roles.find((candidate) => candidate.id === role)?.requiredIf) {
        report(path, `role "${role}" is conditional and binds the person's part itself`);
      }
    }
    if (pair[0] === pair[1]) report(path, 'links a role with itself');
    const key = [...pair].sort().join(' ');
    if (pairs.has(key)) report(path, `the pair ${pair.join(' / ')} is listed twice`);
    pairs.add(key);
  });
}

const DEFINITION_RULES: readonly DefinitionRule[] = [
  uniqueIds,
  fieldShapes,
  conditions,
  computedFields,
  roles,
  infoBlocks,
  consistencyRules,
  matchKeys,
  initialValues,
  masterDataKeys,
  partLinks,
  interviewOrder,
];
