// Master-data import file for DATEV Lohn und Gehalt (Kanzleiebene: Extras | Stammdatenimport) and the
// Erfassungsblatt in the order of its masks, from a questionnaire and an export mapping (data). Pure:
// the io layer encodes the text (Windows-1252) and downloads it. Nothing is guessed — a value that
// cannot be written is left out and named; what only the Kanzlei knows it enters per questionnaire.
import { evaluateCondition } from './conditions';
import { isIsoDate } from './dates';
import { derive } from './derivations';
import { displayValue } from './display';
import {
  inputProblem,
  subFields,
  type EmployeeMode,
  type ExportField,
  type ExportInput,
  type ExportMapping,
  type ExportValue,
} from './exportMapping';
import { fieldsById } from './form';
import { valuesOf } from './hints';
import type { FormDefinition, Questionnaire } from './model';
import { listCodesOf, listEntryOf, listOf, optionsOf } from './options';

export interface SheetRow {
  mask: string;
  /** Target field, with the sub-field of a combination field ("Land › Staatsname"). */
  field: string;
  /** The value as written into the file; empty = nothing to enter. */
  value: string;
  problem?: string;
  /** Written, but to be checked (e.g. a value the program's description does not list). */
  note?: string;
}

export interface LugEntries {
  mandantennummer?: string;
  mitarbeiternummer?: string;
  /** neu: the import creates the employee; vorhanden: it only completes an existing one. */
  mode?: EmployeeMode;
  /** Values of the mapping's inputs, by input id. */
  inputs?: Readonly<Record<string, string>>;
}

export interface LugImport {
  /** The import file, or undefined while a blocking problem is open. */
  text?: string;
  sheet: SheetRow[];
  /** Values left out, with the reason. */
  problems: string[];
  /** Values written that should be checked in the program's import report. */
  notes: string[];
  /** Why no file can be written (e.g. missing Mandantennummer). */
  blocking: string[];
  /** Whom the file is about — to compare with the program before reading it in. */
  employee: {
    number: string;
    /** Where the number comes from: entered in the station, the questionnaire, or nowhere. */
    source: 'entered' | 'form' | 'none';
    name: string;
    firstName: string;
    start: string;
  };
  /** Asked before the download (the number decides which employee the file changes). */
  confirm?: string;
}

export interface NeededInput {
  input: ExportInput;
  /** Entered value, else the default; empty when neither. */
  value: string;
  problem?: string;
  /** Answers that help to fill it in, e.g. the health insurer the person named. */
  context: { label: string; value: string }[];
}

const baseName = (name: string) => {
  const open = name.indexOf('(');
  return open < 0 ? name : name.slice(0, open).trim();
};

type Resolved =
  | { text: string; note?: string }
  | { empty: true }
  /** An input the Kanzlei has not filled in (its label). */
  | { missing: string }
  | { problem: string };

function format(text: string, value: ExportValue): Resolved {
  switch (value.format ?? 'text') {
    case 'date':
      return isIsoDate(text)
        ? { text: `${text.slice(8, 10)}.${text.slice(5, 7)}.${text.slice(0, 4)}` }
        : { problem: `„${text}“ ist kein Datum` };
    case 'month':
      return /^\d{4}-\d{2}(?:-\d{2})?$/.test(text)
        ? { text: `${text.slice(5, 7)}/${text.slice(0, 4)}` }
        : { problem: `„${text}“ ist kein Monat` };
    case 'decimal':
      return /^-?\d+(?:\.\d+)?$/.test(text)
        ? { text: text.replace('.', ',') }
        : { problem: `„${text}“ ist keine Zahl` };
    case 'jn':
      return text === 'true'
        ? { text: 'J' }
        : text === 'false'
          ? { text: 'N' }
          : { problem: `„${text}“ ist kein Ja/Nein` };
    default:
      return { text };
  }
}

/** Values of the import file are separated by ";"; text that needs it goes in double quotes. */
function escape(text: string): Resolved {
  if (/["\n\r]/.test(text)) return { problem: 'enthält Anführungszeichen oder Zeilenumbrüche' };
  return { text: /[;]|^\s|\s$/.test(text) ? `"${text}"` : text };
}

/** Input ids a value uses, nested `first` sources included. */
function inputIdsOf(value: ExportValue): string[] {
  return [
    ...(value.input === undefined ? [] : [value.input]),
    ...(value.first ?? []).flatMap(inputIdsOf),
  ];
}

/** Evaluates the mapping's values against a questionnaire and the Kanzlei's entries. */
function resolverFor(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  mapping: ExportMapping,
  entered: Readonly<Record<string, string>>,
) {
  const values = valuesOf(questionnaire, definition);
  const applies = (when: ExportInput['when']) =>
    when === undefined || evaluateCondition(when, values.valueOf);
  const fields = fieldsById(definition);
  const proposals = new Map(derive(questionnaire, definition).map((d) => [d.id, d] as const));
  const inputs = new Map((mapping.inputs ?? []).map((input) => [input.id, input] as const));
  // Entered, else prefilled from the questionnaire, else the mapping's default.
  const inputValue = (input: ExportInput): string => {
    const typed = entered[input.id]?.trim();
    if (typed) return typed;
    const from = input.defaultFrom === undefined ? undefined : resolve(input.defaultFrom);
    return (from && 'text' in from ? from.text : '') || input.default || '';
  };

  const source = (value: ExportValue): Resolved => {
    if (value.blank) return { empty: true };
    if (value.const !== undefined) return { text: value.const };
    if (value.first !== undefined) {
      const results = value.first.map(resolve);
      // The first value wins. A value that cannot be exported (e.g. a free entry without a list
      // code) ends the search, so a fallback never hides it; an input not yet entered does not.
      const found = results.find((r) => 'text' in r || 'problem' in r);
      if (found && 'text' in found) return found;
      return results.find((r) => 'missing' in r) ?? found ?? { empty: true };
    }
    if (value.input !== undefined) {
      const input = inputs.get(value.input);
      if (!input || !applies(input.when)) return { empty: true };
      const text = inputValue(input);
      if (text === '') return { missing: input.label };
      const problem = inputProblem(input, text);
      return problem === undefined ? { text } : { problem: `„${input.label}“: ${problem}` };
    }
    if (value.derivation !== undefined) {
      const proposal = proposals.get(value.derivation);
      if (proposal?.status !== 'proposed' || proposal.value === undefined) {
        return { problem: `Vorschlag „${proposal?.label ?? value.derivation}“ fehlt` };
      }
      return { text: proposal.value };
    }
    if (value.field !== undefined) {
      const stored = values.valueOf(value.field);
      if (stored === null) return { empty: true };
      if (typeof stored === 'boolean') return { text: String(stored) };
      if (typeof stored !== 'string') return { problem: 'Tabellen werden nicht übertragen' };
      if (value.code === undefined) return { text: stored };
      const target = fields.get(value.field);
      const entry = target ? listEntryOf(target, stored) : undefined;
      // A free entry (or an entry without that code) is named, never left blank silently — and a
      // `first` with a fallback must not skip over it.
      if (entry === undefined) {
        return { problem: `„${stored}“ steht nicht in der Liste – bitte von Hand eintragen` };
      }
      const code = listCodesOf(listOf(target ?? {}) ?? '', entry)[value.code];
      return code === undefined
        ? { problem: `Für „${stored}“ ist kein Schlüssel hinterlegt – bitte von Hand eintragen` }
        : { text: code };
    }
    return { empty: true };
  };

  const resolve = (value: ExportValue): Resolved => {
    const found = source(value);
    if (!('text' in found)) return found;
    let text = found.text;
    if (value.slice) text = text.slice(value.slice[0], value.slice[1]);
    if (value.derivation !== undefined && text.includes('?')) {
      return { problem: `Vorschlag „${text}“ ist noch offen` };
    }
    const note = value.notes?.[text] ?? found.note;
    if (value.map) {
      const mapped = value.map[text];
      if (mapped === undefined) {
        const field = value.field === undefined ? undefined : fields.get(value.field);
        const shown = field ? (optionsOf(field).find((o) => o.id === text)?.label ?? text) : text;
        return { problem: `für „${shown}“ gibt es keine Zuordnung` };
      }
      text = mapped;
    }
    if (text === '') return { empty: true };
    const formatted = format(text, value);
    if (!('text' in formatted)) return formatted;
    const escaped = escape(formatted.text);
    return 'text' in escaped && note !== undefined ? { ...escaped, note } : escaped;
  };

  return { values, applies, fields, resolve, inputValue };
}

/** The inputs the Kanzlei has to fill in for this questionnaire, in the mapping's order. */
export function neededInputs(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  mapping: ExportMapping,
  entered: Readonly<Record<string, string>> = {},
): NeededInput[] {
  const { values, applies, fields, inputValue } = resolverFor(
    questionnaire,
    definition,
    mapping,
    entered,
  );
  const used = new Set(
    mapping.records
      .filter((record) => applies(record.when))
      .flatMap((record) => record.fields.flatMap((field) => field.values.flatMap(inputIdsOf))),
  );
  return (mapping.inputs ?? [])
    .filter((input) => used.has(input.id) && applies(input.when))
    .map((input) => {
      const value = inputValue(input);
      const problem = value === '' ? undefined : inputProblem(input, value);
      return {
        input,
        value,
        ...(problem === undefined ? {} : { problem }),
        context: (input.context ?? []).flatMap((id) => {
          const field = fields.get(id);
          const stored = values.valueOf(id);
          return field && stored !== null
            ? [{ label: field.label, value: displayValue(field, stored) }]
            : [];
        }),
      };
    });
}

const NUMBER_MESSAGES: Readonly<
  Record<LugImport['employee']['source'], (number: string) => string>
> = {
  none: () =>
    'Mitarbeiternummer fehlt: Der Fragebogen nennt keine Personalnummer. Bitte oben die Nummer aus dem Lohnprogramm eintragen (1 bis 5 Ziffern).',
  form: (number) =>
    `Die Personalnummer laut Fragebogen („${number}“) passt nicht (1 bis 5 Ziffern). Bitte oben die Mitarbeiternummer aus dem Lohnprogramm eintragen.`,
  entered: () => 'Die eingetragene Mitarbeiternummer muss 1 bis 5 Ziffern haben.',
};

/** The safety question before the download: the number decides which employee the file changes. */
export function employeeQuestion(
  title: string,
  mandant: string,
  employee: LugImport['employee'],
  mode: EmployeeMode,
): string {
  const who = [employee.name, employee.firstName].filter(Boolean).join(', ') || 'diese Person';
  const source = employee.source === 'form' ? 'aus dem Fragebogen' : 'eingetragen';
  return mode === 'neu'
    ? `Mitarbeiternummer ${employee.number} (${source}): Ist sie in ${title} beim Mandanten ${mandant} noch frei? Die Datei legt ${who} unter dieser Nummer neu an.`
    : `Gehört die Mitarbeiternummer ${employee.number} (${source}) in ${title} beim Mandanten ${mandant} zu ${who}${employee.start ? `, Eintritt ${employee.start}` : ''}? Die Datei überschreibt die Stammdaten dieses Mitarbeiters mit den Angaben des Fragebogens.`;
}

export function buildLugImport(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  mapping: ExportMapping,
  entries: LugEntries,
): LugImport {
  const { applies, resolve } = resolverFor(
    questionnaire,
    definition,
    mapping,
    entries.inputs ?? {},
  );

  const sheet: SheetRow[] = [];
  const problems: string[] = [];
  const notes: string[] = [];
  const records: { mask: string; fields: ExportField[]; written: string[]; notes: string[] }[] = [];
  for (const record of mapping.records) {
    if (!applies(record.when)) continue;
    const used: ExportField[] = [];
    const written: string[] = [];
    const recordNotes: string[] = [];
    // A value only the Kanzlei knows (blank or an input not filled in) in a single field is a key
    // of the record (e.g. the wage type): without it the record must not be written at all.
    let missingKey: { label: string; input: boolean } | undefined;
    for (const field of record.fields) {
      const subs = subFields(field.name);
      const results = field.values.map((value): Resolved => {
        const result = resolve(value);
        return 'missing' in result && value.optional === true ? { empty: true } : result;
      });
      const label = field.label ?? baseName(field.name);
      const fieldNotes: string[] = [];
      results.forEach((result, i) => {
        const sub = subs.length > 1 ? `${label} › ${subs[i] ?? ''}` : label;
        const value = field.values[i];
        if ('problem' in result) {
          sheet.push({ mask: record.mask, field: sub, value: '', problem: result.problem });
          problems.push(`${record.mask} – ${sub}: ${result.problem}`);
        } else if ('missing' in result) {
          sheet.push({ mask: record.mask, field: sub, value: '', problem: 'oben eintragen' });
        } else if (value?.blank && value.optional !== true) {
          sheet.push({ mask: record.mask, field: sub, value: '', problem: 'selbst erfassen' });
        } else if ('text' in result) {
          sheet.push({
            mask: record.mask,
            field: sub,
            value: result.text,
            ...(result.note === undefined ? {} : { note: result.note }),
          });
          if (result.note !== undefined) fieldNotes.push(`${record.mask} – ${sub}: ${result.note}`);
        } else {
          sheet.push({ mask: record.mask, field: sub, value: '' });
        }
      });
      const missing = results.flatMap((r) => ('missing' in r ? [r.missing] : []));
      if (
        subs.length === 1 &&
        (missing.length > 0 || (field.values[0]?.blank && field.values[0].optional !== true))
      ) {
        missingKey = { label: missing[0] ?? label, input: missing.length > 0 };
        continue;
      }
      if (missing.length > 0) {
        problems.push(
          `${record.mask} – ${label}: „${missing.join('“, „')}“ oben eintragen – nicht übertragen`,
        );
        continue;
      }
      // A field is written only complete; a combination with a gap stays out (the sheet shows why).
      // Companion values (e.g. a valid-from month) do not count when everything else is empty.
      const core = results.filter((_, i) => field.values[i]?.companion !== true);
      if (results.some((r) => 'problem' in r) || core.every((r) => 'empty' in r)) continue;
      if (results.some((r, i) => 'empty' in r && field.values[i]?.optional !== true)) {
        problems.push(`${record.mask} – ${label}: unvollständig, nicht übertragen`);
        continue;
      }
      used.push(field);
      written.push(...results.map((r) => ('text' in r ? r.text : '')));
      recordNotes.push(...fieldNotes);
    }
    if (missingKey !== undefined) {
      problems.push(
        missingKey.input
          ? `${record.mask}: „${missingKey.label}“ oben eintragen – Datensatz nicht übertragen`
          : `${record.mask}: „${missingKey.label}“ selbst erfassen – Datensatz nicht übertragen`,
      );
      continue;
    }
    if (used.length > 0) {
      records.push({ mask: record.mask, fields: used, written, notes: recordNotes });
      notes.push(...recordNotes);
    }
  }

  const textOf = (value: ExportValue | undefined) => {
    const result = value === undefined ? { empty: true as const } : resolve(value);
    return 'text' in result ? result.text : '';
  };
  const entered = entries.mitarbeiternummer?.trim() ?? '';
  const fromForm = textOf(mapping.employee.number);
  const employee = {
    number: entered || fromForm,
    source: entered ? ('entered' as const) : fromForm ? ('form' as const) : ('none' as const),
    name: textOf(mapping.employee.name),
    firstName: textOf(mapping.employee.firstName),
    start: textOf(mapping.employee.start),
  };

  const blocking: string[] = [];
  const mandant = entries.mandantennummer?.trim() ?? '';
  if (!/^\d{1,5}$/.test(mandant)) blocking.push('Mandantennummer (1 bis 5 Ziffern) fehlt.');
  if (!/^\d{1,5}$/.test(employee.number))
    blocking.push(NUMBER_MESSAGES[employee.source](employee.number));
  if (entries.mode === undefined) {
    blocking.push('Bitte wählen: Mitarbeiter neu anlegen oder vorhandenen Mitarbeiter ergänzen.');
  }
  for (const problem of neededInputs(questionnaire, definition, mapping, entries.inputs ?? {})) {
    if (problem.problem !== undefined) {
      blocking.push(`„${problem.input.label}“: ${problem.problem}.`);
    }
  }
  const HEAD = {
    name: 'Familienname',
    firstName: 'Vorname',
    start: 'Eintrittsdatum',
    firstMonth: 'erster abzurechnender Monat',
  } as const;
  const head =
    entries.mode === 'neu'
      ? (Object.keys(HEAD) as (keyof typeof HEAD)[]).map((key) => {
          const result = resolve(mapping.employee[key]);
          if (!('text' in result)) blocking.push(`Für die Neuanlage fehlt: ${HEAD[key]}.`);
          return 'text' in result ? result.text : '';
        })
      : [];
  if (blocking.length > 0) return { sheet, problems, notes, blocking, employee };
  const confirm = employeeQuestion(mapping.title, mandant, employee, entries.mode ?? 'neu');

  const idOf = (special: string) => special.split(';')[0]?.trim() ?? '';
  const lines = [
    '[Allgemein]',
    'Ziel=LuG',
    `VersionImportDatei=${mapping.importVersion}`,
    'Protokollart=lang',
    'Kommentarzeichen=#',
    'Feldtrennzeichen=;',
    'Zahlenkomma=,',
    'Stringbegrenzer="',
    'Kombifeldbegrenzer=(',
    'Datumsformat=TT.MM.JJJJ',
    '',
    '[Satzbeschreibung]',
    mapping.special.mandantSel,
    mapping.special.mitarbeiterSel,
    mapping.special.mitarbeiterNeu,
    ...records.map(
      (record, i) => `${1000 + i};${record.mask};${record.fields.map((f) => f.name).join(';')}`,
    ),
    '',
    '[Mandant]',
    `${idOf(mapping.special.mandantSel)};${mandant}`,
    '',
    // A new employee is created in a section of its own, then selected like an existing one.
    ...(entries.mode === 'neu'
      ? [
          '[Mitarbeiter]',
          `${idOf(mapping.special.mitarbeiterNeu)};${[employee.number, ...head].join(';')}`,
          '',
        ]
      : []),
    '[Mitarbeiter]',
    `${idOf(mapping.special.mitarbeiterSel)};${employee.number}`,
    ...records.map((record, i) => `${1000 + i};${record.written.join(';')}`),
    '',
  ];
  return { text: lines.join('\r\n'), sheet, problems, notes, blocking, employee, confirm };
}
