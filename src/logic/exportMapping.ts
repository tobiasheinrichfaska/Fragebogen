// Mapping of a form's answers to a payroll program's master-data import (Tobias 2026-10-30: import
// file and Erfassungsblatt for DATEV Lohn und Gehalt, LODAS later). The mapping is data: records
// named like the program's input masks, fields with one value source per sub-field. The real
// mappings name the program's fields and stay out of the public repo (config/export.local.json).
import { Decoder, type DecodeIssue } from './decode';
import { forEachLeaf, leafProblem } from './conditions';
import { decodeCondition, ID } from './formDefinition';
import { fieldsById } from './form';
import { listCodesOf, listOf, REFERENCE_LISTS } from './options';
import type { Condition, FieldDefinition, FormDefinition } from './model';

export const EXPORT_FORMAT = 'fragebogen.export';
export const EXPORT_TARGETS = ['LuG'] as const;
export type ExportTarget = (typeof EXPORT_TARGETS)[number];
/** How a value is written: as stored text, date TT.MM.JJJJ, month MM/JJJJ, decimal comma, J/N. */
export const EXPORT_FORMATS = ['text', 'date', 'month', 'decimal', 'jn'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** One value: exactly one source, then slice, map and format in this order. */
export interface ExportValue {
  /** Answer of a top-level field of any role (current parts; hidden counts as empty). */
  field?: string;
  /** A proposal of the form (only when proposed). */
  derivation?: string;
  const?: string;
  /** Always empty: a value only the program's user knows (e.g. a client's wage type). Unless
   * `optional`, the field is then not written — the Erfassungsblatt still shows its other values. */
  blank?: true;
  /** Entered in the Kanzlei station per questionnaire (`ExportMapping.inputs`); empty counts like `blank`. */
  input?: string;
  /** The first of these sources that yields a value, e.g. the exact count behind "mehr als 3". */
  first?: ExportValue[];
  /** Written as is, but with a note to check (keyed by the value before `map`). */
  notes?: Record<string, string>;
  /** Characters [start, end) of the value, e.g. one digit of the Beitragsgruppen. */
  slice?: [number, number];
  /** List-backed choice: one of the entry's codes (e.g. "laenderkennzeichen") instead of its id. */
  code?: string;
  /** Stored value (choice id, "true"/"false" for yes/no) → target text; unmapped values are reported. */
  map?: Record<string, string>;
  format?: ExportFormat;
  /** Inside a combination field: may stay empty (the program fills it, e.g. a state name). */
  optional?: boolean;
  /**
   * Inside a combination field: written only along with the field's other values (e.g. the
   * valid-from month of a history field); when those are all empty the field is simply left out.
   */
  companion?: boolean;
}

/** A target field; a combination field ("Name(a;b)") has one value per sub-field. */
export interface ExportField {
  name: string;
  /** Readable name for the Erfassungsblatt; default: the target name. */
  label?: string;
  values: ExportValue[];
}

export interface ExportRecord {
  /** The program's mask path: menu items and mask, separated by "|". */
  mask: string;
  /** Written only while this condition (any role) holds. */
  when?: Condition;
  fields: ExportField[];
}

/**
 * A value the Kanzlei enters per questionnaire because only it knows it (the client's wage type,
 * the health insurer's number in the program). Asked only while a record using it is written.
 */
export interface ExportInput {
  id: string;
  label: string;
  help?: string;
  /** Digits only, between [min, max] of them. */
  digits?: [number, number];
  /**
   * A search list (shown as "value – label"). Alone: the value must be one of them; with `digits`:
   * suggestions, any value of the right digits is accepted (e.g. an insurer missing from the list).
   */
  options?: { value: string; label: string }[];
  /** Prefilled, e.g. the wage type the Kanzlei usually uses; can be changed per questionnaire. */
  default?: string;
  /** Prefilled from the questionnaire (before `default`), e.g. the number of the insurer chosen from the list. */
  defaultFrom?: ExportValue;
  /** Asked only while this condition (any role) holds. */
  when?: Condition;
  /** Answers shown next to the input, e.g. the health insurer the person named. */
  context?: string[];
}

/** Whether the import creates the employee or completes one that already exists. */
export const EMPLOYEE_MODES = ['neu', 'vorhanden'] as const;
export type EmployeeMode = (typeof EMPLOYEE_MODES)[number];

export interface ExportMapping {
  format: typeof EXPORT_FORMAT;
  version: 1;
  target: ExportTarget;
  /** Shown to people, e.g. "DATEV Lohn und Gehalt". */
  title: string;
  /** The form whose answers are mapped. */
  form: string;
  /** Only this version of the form (the fields of other versions may differ). */
  formVersion?: string;
  /** Where the file is read in, shown next to the download (e.g. the program's menu path). */
  howTo?: string[];
  /** Version of the import file format (LuG: VersionImportDatei). */
  importVersion: string;
  /** The program's fixed record descriptions, copied unchanged ("2; MandantSel; …"). */
  special: { mandantSel: string; mitarbeiterSel: string; mitarbeiterNeu: string };
  inputs?: ExportInput[];
  employee: {
    number?: ExportValue;
    name: ExportValue;
    firstName: ExportValue;
    start: ExportValue;
    firstMonth: ExportValue;
  };
  records: ExportRecord[];
}

/** Leaf sub-fields of a target field: "Land(Nationalität;Staatsname)" → two, nested ones flattened. */
export function subFields(name: string): string[] {
  const open = name.indexOf('(');
  if (open < 0 || !name.endsWith(')')) return [name];
  const inner = name.slice(open + 1, -1);
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ';' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  parts.push(current.trim());
  return parts.flatMap((part) => subFields(part));
}

const MAP_KEY = /^[^\n]{1,64}$/;
const SPECIAL = /^\d{1,5};\s*[A-Za-z]+;[^\n]*$/;

const SOURCES = 'needs exactly one of field, derivation, const, blank, input, first';
const MAX_FIRST_DEPTH = 2;

function decodeValue(d: Decoder, raw: unknown, path: string, depth = 0): ExportValue | undefined {
  const o = d.object(raw, path, [
    'field',
    'derivation',
    'const',
    'blank',
    'input',
    'first',
    'notes',
    'slice',
    'code',
    'map',
    'format',
    'optional',
    'companion',
  ]);
  if (!o) return undefined;
  const field = o.field === undefined ? undefined : d.string(o.field, `${path}.field`, ID);
  const derivation =
    o.derivation === undefined ? undefined : d.string(o.derivation, `${path}.derivation`, ID);
  const constant = o.const === undefined ? undefined : d.string(o.const, `${path}.const`);
  const blank =
    o.blank === undefined
      ? undefined
      : o.blank === true
        ? true
        : d.report(`${path}.blank`, 'expected true');
  const input = o.input === undefined ? undefined : d.string(o.input, `${path}.input`, ID);
  const first =
    o.first === undefined
      ? undefined
      : depth >= MAX_FIRST_DEPTH
        ? d.report(`${path}.first`, 'nested too deeply')
        : d.array(o.first, `${path}.first`, (v, p) => decodeValue(d, v, p, depth + 1), 1);
  const notes =
    o.notes === undefined
      ? undefined
      : d.record(o.notes, `${path}.notes`, MAP_KEY, (v, p) =>
          typeof v === 'string' && v !== '' ? v : d.report(p, 'expected a text'),
        );
  const slice =
    o.slice === undefined
      ? undefined
      : d.array(o.slice, `${path}.slice`, (v, p) => d.integer(v, p), 2);
  const code = o.code === undefined ? undefined : d.string(o.code, `${path}.code`, ID);
  const map =
    o.map === undefined
      ? undefined
      : d.record(o.map, `${path}.map`, MAP_KEY, (v, p) =>
          typeof v === 'string' ? v : d.report(p, 'expected a string'),
        );
  const format =
    o.format === undefined ? undefined : d.literal(o.format, `${path}.format`, EXPORT_FORMATS);
  const optional = o.optional === undefined ? undefined : d.boolean(o.optional, `${path}.optional`);
  const companion =
    o.companion === undefined ? undefined : d.boolean(o.companion, `${path}.companion`);
  const given = [o.field, o.derivation, o.const, o.blank, o.input, o.first];
  if (given.filter((s) => s !== undefined).length !== 1) d.report(path, SOURCES);
  if (slice !== undefined && (slice.length !== 2 || (slice[0] ?? 0) >= (slice[1] ?? 0))) {
    d.report(`${path}.slice`, 'expected [start, end) with start < end');
  }
  return {
    ...(field === undefined ? {} : { field }),
    ...(derivation === undefined ? {} : { derivation }),
    ...(constant === undefined ? {} : { const: constant }),
    ...(blank === undefined ? {} : { blank }),
    ...(input === undefined ? {} : { input }),
    ...(first === undefined ? {} : { first }),
    ...(notes === undefined ? {} : { notes }),
    ...(slice === undefined ? {} : { slice: [slice[0] ?? 0, slice[1] ?? 0] as [number, number] }),
    ...(code === undefined ? {} : { code }),
    ...(map === undefined ? {} : { map }),
    ...(format === undefined ? {} : { format }),
    ...(optional === undefined ? {} : { optional }),
    ...(companion === undefined ? {} : { companion }),
  };
}

function decodeInput(d: Decoder, raw: unknown, path: string): ExportInput | undefined {
  const o = d.object(raw, path, [
    'id',
    'label',
    'help',
    'digits',
    'options',
    'default',
    'defaultFrom',
    'when',
    'context',
  ]);
  if (!o) return undefined;
  const id = d.string(o.id, `${path}.id`, ID);
  const label = d.string(o.label, `${path}.label`);
  const help = o.help === undefined ? undefined : d.string(o.help, `${path}.help`);
  const digits =
    o.digits === undefined
      ? undefined
      : d.array(o.digits, `${path}.digits`, (v, p) => d.integer(v, p, 1), 2);
  if (digits !== undefined && (digits.length !== 2 || (digits[0] ?? 0) > (digits[1] ?? 0))) {
    d.report(`${path}.digits`, 'expected [min, max] with min <= max');
  }
  const options =
    o.options === undefined
      ? undefined
      : d.array(
          o.options,
          `${path}.options`,
          (v, p) => {
            const option = d.object(v, p, ['value', 'label']);
            const value = option && d.string(option.value, `${p}.value`, MAP_KEY);
            const text = option && d.string(option.label, `${p}.label`);
            return value === undefined || text === undefined ? undefined : { value, label: text };
          },
          1,
        );
  if (o.digits === undefined && o.options === undefined) {
    d.report(path, 'needs digits or options');
  }
  const preset = o.default === undefined ? undefined : d.string(o.default, `${path}.default`);
  const defaultFrom =
    o.defaultFrom === undefined ? undefined : decodeValue(d, o.defaultFrom, `${path}.defaultFrom`);
  const when = o.when === undefined ? undefined : decodeCondition(d, o.when, `${path}.when`, 0);
  const context =
    o.context === undefined
      ? undefined
      : d.array(o.context, `${path}.context`, (v, p) => d.string(v, p, ID), 1);
  if (id === undefined || label === undefined) return undefined;
  const input: ExportInput = {
    id,
    label,
    ...(help === undefined ? {} : { help }),
    ...(digits === undefined ? {} : { digits: [digits[0] ?? 1, digits[1] ?? 1] }),
    ...(options === undefined ? {} : { options }),
    ...(preset === undefined ? {} : { default: preset }),
    ...(defaultFrom === undefined ? {} : { defaultFrom }),
    ...(when === undefined ? {} : { when }),
    ...(context === undefined ? {} : { context }),
  };
  if (preset !== undefined && inputProblem(input, preset) !== undefined) {
    d.report(`${path}.default`, 'does not fit digits or options');
  }
  return input;
}

/** Why an entered value does not fit the input (German, for the Kanzlei), or undefined. */
export function inputProblem(input: ExportInput, value: string): string | undefined {
  if (input.digits) {
    const [min, max] = input.digits;
    if (/^\d+$/.test(value) && value.length >= min && value.length <= max) return undefined;
    return min === max ? `genau ${min} Ziffern` : `${min} bis ${max} Ziffern`;
  }
  return (input.options ?? []).some((option) => option.value === value)
    ? undefined
    : 'bitte aus der Liste wählen';
}

function decodeMapping(d: Decoder, raw: unknown, path: string): ExportMapping | undefined {
  const o = d.object(raw, path, [
    'format',
    'version',
    'target',
    'title',
    'form',
    'formVersion',
    'howTo',
    'importVersion',
    'special',
    'inputs',
    'employee',
    'records',
  ]);
  if (!o) return undefined;
  const format = d.literal(o.format, `${path}.format`, [EXPORT_FORMAT] as const);
  const version = o.version === 1 ? 1 : d.report(`${path}.version`, 'expected 1');
  const target = d.literal(o.target, `${path}.target`, EXPORT_TARGETS);
  const title = d.string(o.title, `${path}.title`);
  const form = d.string(o.form, `${path}.form`);
  const formVersion =
    o.formVersion === undefined ? undefined : d.string(o.formVersion, `${path}.formVersion`);
  const howTo =
    o.howTo === undefined
      ? undefined
      : d.array(o.howTo, `${path}.howTo`, (v, p) => d.string(v, p), 1);
  const importVersion = d.string(o.importVersion, `${path}.importVersion`);
  const s = d.object(o.special, `${path}.special`, [
    'mandantSel',
    'mitarbeiterSel',
    'mitarbeiterNeu',
  ]);
  const special = s && {
    mandantSel: d.string(s.mandantSel, `${path}.special.mandantSel`, SPECIAL),
    mitarbeiterSel: d.string(s.mitarbeiterSel, `${path}.special.mitarbeiterSel`, SPECIAL),
    mitarbeiterNeu: d.string(s.mitarbeiterNeu, `${path}.special.mitarbeiterNeu`, SPECIAL),
  };
  const inputs =
    o.inputs === undefined
      ? undefined
      : d.array(o.inputs, `${path}.inputs`, (v, p) => decodeInput(d, v, p), 1);
  const ids = (inputs ?? []).map((input) => input.id);
  if (new Set(ids).size !== ids.length) d.report(`${path}.inputs`, 'input ids must be unique');
  const e = d.object(o.employee, `${path}.employee`, [
    'number',
    'name',
    'firstName',
    'start',
    'firstMonth',
  ]);
  const at = `${path}.employee`;
  const employee = e && {
    number: e.number === undefined ? undefined : decodeValue(d, e.number, `${at}.number`),
    name: decodeValue(d, e.name, `${at}.name`),
    firstName: decodeValue(d, e.firstName, `${at}.firstName`),
    start: decodeValue(d, e.start, `${at}.start`),
    firstMonth: decodeValue(d, e.firstMonth, `${at}.firstMonth`),
  };
  const records = d.array(
    o.records,
    `${path}.records`,
    (v, p) => {
      const r = d.object(v, p, ['mask', 'when', 'fields']);
      if (!r) return undefined;
      const mask = d.string(r.mask, `${p}.mask`);
      const when = r.when === undefined ? undefined : decodeCondition(d, r.when, `${p}.when`, 0);
      const fields = d.array(
        r.fields,
        `${p}.fields`,
        (fv, fp) => {
          const f = d.object(fv, fp, ['name', 'label', 'values']);
          if (!f) return undefined;
          const name = d.string(f.name, `${fp}.name`);
          const label = f.label === undefined ? undefined : d.string(f.label, `${fp}.label`);
          const values = d.array(f.values, `${fp}.values`, (vv, vp) => decodeValue(d, vv, vp), 1);
          if (name === undefined || values === undefined) return undefined;
          return { name, ...(label === undefined ? {} : { label }), values };
        },
        1,
      );
      if (mask === undefined || fields === undefined) return undefined;
      return { mask, ...(when === undefined ? {} : { when }), fields };
    },
    1,
  );
  if (
    !format ||
    !version ||
    !target ||
    !title ||
    !form ||
    !importVersion ||
    !special?.mandantSel ||
    !special.mitarbeiterSel ||
    !special.mitarbeiterNeu ||
    !employee?.name ||
    !employee.firstName ||
    !employee.start ||
    !employee.firstMonth ||
    !records ||
    (e?.number !== undefined && !employee.number) ||
    (o.inputs !== undefined && !inputs) ||
    (o.howTo !== undefined && !howTo)
  ) {
    return undefined;
  }
  return {
    format,
    version: 1,
    target,
    title,
    form,
    ...(formVersion === undefined ? {} : { formVersion }),
    ...(howTo === undefined ? {} : { howTo }),
    importVersion,
    special: {
      mandantSel: special.mandantSel,
      mitarbeiterSel: special.mitarbeiterSel,
      mitarbeiterNeu: special.mitarbeiterNeu,
    },
    ...(inputs === undefined ? {} : { inputs }),
    employee: {
      ...(employee.number === undefined ? {} : { number: employee.number }),
      name: employee.name,
      firstName: employee.firstName,
      start: employee.start,
      firstMonth: employee.firstMonth,
    },
    records,
  };
}

/** Strict decoding of the mappings of a build (an array, possibly empty). */
export function parseExportMappings(
  raw: unknown,
): { ok: true; mappings: ExportMapping[] } | { ok: false; issues: DecodeIssue[] } {
  const d = new Decoder();
  const mappings = Array.isArray(raw)
    ? d.array(raw, '$', (v, p) => decodeMapping(d, v, p))
    : d.report('$', 'expected an array');
  if (!mappings || d.issues.length > 0) return { ok: false, issues: d.issues };
  return { ok: true, mappings };
}

function inputIdsIn(value: ExportValue): string[] {
  return [
    ...(value.input === undefined ? [] : [value.input]),
    ...(value.first ?? []).flatMap(inputIdsIn),
  ];
}

function valueProblems(
  value: ExportValue,
  path: string,
  fields: ReadonlyMap<string, FieldDefinition>,
  definition: FormDefinition,
  inputs: ReadonlySet<string>,
): DecodeIssue[] {
  const issues: DecodeIssue[] = [];
  const report = (message: string) => issues.push({ path, message });
  if (value.input !== undefined && !inputs.has(value.input)) {
    report(`unknown input "${value.input}"`);
  }
  (value.first ?? []).forEach((inner, i) => {
    issues.push(...valueProblems(inner, `${path}.first[${i}]`, fields, definition, inputs));
  });
  if (value.field !== undefined) {
    const field = fields.get(value.field);
    if (!field) report(`unknown field "${value.field}"`);
    else if (field.type === 'repeatGroup') report(`"${value.field}" is a table`);
    else if (value.code !== undefined) {
      const listId = listOf(field);
      const list = listId === undefined ? undefined : REFERENCE_LISTS[listId];
      const first = list?.options[0];
      if (!list || !first || listCodesOf(listId ?? '', first.id)[value.code] === undefined) {
        report(`"${value.field}" has no list code "${value.code}"`);
      }
    }
  }
  if (value.derivation !== undefined) {
    if (!(definition.derivations ?? []).some((d) => d.id === value.derivation)) {
      report(`unknown derivation "${value.derivation}"`);
    }
  }
  if (value.code !== undefined && value.field === undefined) report('code needs a list field');
  return issues;
}

/** Whether the mapping is meant for this form version (by id, and by version if it names one). */
export function mappingFor(mapping: ExportMapping, definition: FormDefinition): boolean {
  return (
    mapping.form === definition.id &&
    (mapping.formVersion === undefined || mapping.formVersion === definition.version)
  );
}

/** Whether a mapping fits the form definition: fields, proposals, list codes, inputs, conditions. */
export function checkExportMapping(
  mapping: ExportMapping,
  definition: FormDefinition,
): DecodeIssue[] {
  const fields = fieldsById(definition);
  const issues: DecodeIssue[] = [];
  const inputs = new Set((mapping.inputs ?? []).map((input) => input.id));
  if (!mappingFor(mapping, definition)) {
    issues.push({
      path: '$.form',
      message: `mapping for "${mapping.form}" ${mapping.formVersion ?? ''}, not "${definition.id}" ${definition.version}`,
    });
  }
  const checkCondition = (condition: Condition, path: string) => {
    forEachLeaf(condition, path, (leaf, leafPath) => {
      const target = fields.get(leaf.field);
      if (!target) issues.push({ path: leafPath, message: `unknown field "${leaf.field}"` });
      else {
        const problem = leafProblem(leaf, target);
        if (problem) issues.push({ path: leafPath, message: problem.message });
      }
    });
  };
  (mapping.inputs ?? []).forEach((input, i) => {
    if (input.when) checkCondition(input.when, `$.inputs[${i}].when`);
    if (input.defaultFrom) {
      const at = `$.inputs[${i}].defaultFrom`;
      // An input prefilled from another input could go round in circles.
      if (inputIdsIn(input.defaultFrom).length > 0) {
        issues.push({ path: at, message: 'cannot come from an input' });
      }
      issues.push(...valueProblems(input.defaultFrom, at, fields, definition, inputs));
    }
    (input.context ?? []).forEach((id, c) => {
      if (!fields.has(id)) {
        issues.push({ path: `$.inputs[${i}].context[${c}]`, message: `unknown field "${id}"` });
      }
    });
  });
  for (const [key, value] of Object.entries(mapping.employee)) {
    issues.push(...valueProblems(value, `$.employee.${key}`, fields, definition, inputs));
  }
  mapping.records.forEach((record, r) => {
    if (record.when) checkCondition(record.when, `$.records[${r}].when`);
    record.fields.forEach((field, f) => {
      const subs = subFields(field.name).length;
      if (field.values.length !== subs) {
        issues.push({
          path: `$.records[${r}].fields[${f}].values`,
          message: `"${field.name}" has ${subs} sub-field(s), ${field.values.length} value(s) given`,
        });
      }
      field.values.forEach((value, v) => {
        issues.push(
          ...valueProblems(
            value,
            `$.records[${r}].fields[${f}].values[${v}]`,
            fields,
            definition,
            inputs,
          ),
        );
      });
    });
  });
  return issues;
}
