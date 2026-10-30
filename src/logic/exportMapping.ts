// Mapping of a form's answers to a payroll program's master-data import (Tobias 2026-10-30: import
// file and Erfassungsblatt for DATEV Lohn und Gehalt, LODAS later). The mapping is data: records
// named like the program's input masks, fields with one value source per sub-field. The real
// mappings name the program's fields and stay out of the public repo (config/export.local.json).
import { Decoder, type DecodeIssue } from './decode';
import { forEachLeaf, leafProblem } from './conditions';
import { decodeCondition, ID } from './formDefinition';
import { fieldsById } from './form';
import { listCodesOf, REFERENCE_LISTS } from './options';
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
  /** Characters [start, end) of the value, e.g. one digit of the Beitragsgruppen. */
  slice?: [number, number];
  /** List-backed choice: one of the entry's codes (e.g. "laenderkennzeichen") instead of its id. */
  code?: string;
  /** Stored value (choice id, "true"/"false" for yes/no) → target text; unmapped values are reported. */
  map?: Record<string, string>;
  format?: ExportFormat;
  /** Inside a combination field: may stay empty (the program fills it, e.g. a state name). */
  optional?: boolean;
}

/** A target field; a combination field ("Name(a;b)") has one value per sub-field. */
export interface ExportField {
  name: string;
  /** Readable name for the Erfassungsblatt; default: the target name. */
  label?: string;
  values: ExportValue[];
}

export interface ExportRecord {
  /** The program's mask path, e.g. "Mitarbeiter|Stammdaten|…". */
  mask: string;
  /** Written only while this condition (any role) holds. */
  when?: Condition;
  fields: ExportField[];
}

export interface ExportMapping {
  format: typeof EXPORT_FORMAT;
  version: 1;
  target: ExportTarget;
  /** Shown to people, e.g. "DATEV Lohn und Gehalt". */
  title: string;
  /** The form whose answers are mapped. */
  form: string;
  /** Version of the import file format (LuG: VersionImportDatei). */
  importVersion: string;
  /** The program's fixed record descriptions, copied unchanged ("2; MandantSel; …"). */
  special: { mandantSel: string; mitarbeiterSel: string; mitarbeiterSelOderNeu: string };
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

function decodeValue(d: Decoder, raw: unknown, path: string): ExportValue | undefined {
  const o = d.object(raw, path, [
    'field',
    'derivation',
    'const',
    'slice',
    'code',
    'map',
    'format',
    'optional',
  ]);
  if (!o) return undefined;
  const field = o.field === undefined ? undefined : d.string(o.field, `${path}.field`, ID);
  const derivation =
    o.derivation === undefined ? undefined : d.string(o.derivation, `${path}.derivation`, ID);
  const constant = o.const === undefined ? undefined : d.string(o.const, `${path}.const`);
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
  const sources = [field, derivation, constant].filter((s) => s !== undefined).length;
  if (sources !== 1) d.report(path, 'needs exactly one of field, derivation, const');
  if (slice !== undefined && (slice.length !== 2 || (slice[0] ?? 0) >= (slice[1] ?? 0))) {
    d.report(`${path}.slice`, 'expected [start, end) with start < end');
  }
  return {
    ...(field === undefined ? {} : { field }),
    ...(derivation === undefined ? {} : { derivation }),
    ...(constant === undefined ? {} : { const: constant }),
    ...(slice === undefined ? {} : { slice: [slice[0] ?? 0, slice[1] ?? 0] as [number, number] }),
    ...(code === undefined ? {} : { code }),
    ...(map === undefined ? {} : { map }),
    ...(format === undefined ? {} : { format }),
    ...(optional === undefined ? {} : { optional }),
  };
}

function decodeMapping(d: Decoder, raw: unknown, path: string): ExportMapping | undefined {
  const o = d.object(raw, path, [
    'format',
    'version',
    'target',
    'title',
    'form',
    'importVersion',
    'special',
    'employee',
    'records',
  ]);
  if (!o) return undefined;
  const format = d.literal(o.format, `${path}.format`, [EXPORT_FORMAT] as const);
  const version = o.version === 1 ? 1 : d.report(`${path}.version`, 'expected 1');
  const target = d.literal(o.target, `${path}.target`, EXPORT_TARGETS);
  const title = d.string(o.title, `${path}.title`);
  const form = d.string(o.form, `${path}.form`);
  const importVersion = d.string(o.importVersion, `${path}.importVersion`);
  const s = d.object(o.special, `${path}.special`, [
    'mandantSel',
    'mitarbeiterSel',
    'mitarbeiterSelOderNeu',
  ]);
  const special = s && {
    mandantSel: d.string(s.mandantSel, `${path}.special.mandantSel`, SPECIAL),
    mitarbeiterSel: d.string(s.mitarbeiterSel, `${path}.special.mitarbeiterSel`, SPECIAL),
    mitarbeiterSelOderNeu: d.string(
      s.mitarbeiterSelOderNeu,
      `${path}.special.mitarbeiterSelOderNeu`,
      SPECIAL,
    ),
  };
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
    !special.mitarbeiterSelOderNeu ||
    !employee?.name ||
    !employee.firstName ||
    !employee.start ||
    !employee.firstMonth ||
    !records ||
    (e?.number !== undefined && !employee.number)
  ) {
    return undefined;
  }
  return {
    format,
    version: 1,
    target,
    title,
    form,
    importVersion,
    special: {
      mandantSel: special.mandantSel,
      mitarbeiterSel: special.mitarbeiterSel,
      mitarbeiterSelOderNeu: special.mitarbeiterSelOderNeu,
    },
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

function valueProblems(
  value: ExportValue,
  path: string,
  fields: ReadonlyMap<string, FieldDefinition>,
  definition: FormDefinition,
): DecodeIssue[] {
  const issues: DecodeIssue[] = [];
  const report = (message: string) => issues.push({ path, message });
  if (value.field !== undefined) {
    const field = fields.get(value.field);
    if (!field) report(`unknown field "${value.field}"`);
    else if (field.type === 'repeatGroup') report(`"${value.field}" is a table`);
    else if (value.code !== undefined) {
      const list = field.optionsFrom === undefined ? undefined : REFERENCE_LISTS[field.optionsFrom];
      const first = list?.options[0];
      if (
        !list ||
        !first ||
        listCodesOf(field.optionsFrom ?? '', first.id)[value.code] === undefined
      ) {
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

/** Whether a mapping fits the form definition: fields, proposals, list codes and conditions. */
export function checkExportMapping(
  mapping: ExportMapping,
  definition: FormDefinition,
): DecodeIssue[] {
  const fields = fieldsById(definition);
  const issues: DecodeIssue[] = [];
  if (mapping.form !== definition.id) {
    issues.push({
      path: '$.form',
      message: `mapping for "${mapping.form}", not "${definition.id}"`,
    });
  }
  for (const [key, value] of Object.entries(mapping.employee)) {
    issues.push(...valueProblems(value, `$.employee.${key}`, fields, definition));
  }
  mapping.records.forEach((record, r) => {
    if (record.when) {
      forEachLeaf(record.when, `$.records[${r}].when`, (leaf, leafPath) => {
        const target = fields.get(leaf.field);
        if (!target) issues.push({ path: leafPath, message: `unknown field "${leaf.field}"` });
        else {
          const problem = leafProblem(leaf, target);
          if (problem) issues.push({ path: leafPath, message: problem.message });
        }
      });
    }
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
          ...valueProblems(value, `$.records[${r}].fields[${f}].values[${v}]`, fields, definition),
        );
      });
    });
  });
  return issues;
}
