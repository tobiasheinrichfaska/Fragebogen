// Master-data import file for DATEV Lohn und Gehalt (Kanzleiebene: Extras | Stammdatenimport) and the
// Erfassungsblatt in the order of its masks, from a questionnaire and an export mapping (data). Pure:
// the io layer encodes the text (Windows-1252) and downloads it. Nothing is guessed — a value that
// cannot be written is left out and named.
import { evaluateCondition } from './conditions';
import { isIsoDate } from './dates';
import { derive } from './derivations';
import { subFields, type ExportField, type ExportMapping, type ExportValue } from './exportMapping';
import { fieldsById } from './form';
import { valuesOf } from './hints';
import type { FormDefinition, Questionnaire } from './model';
import { listCodesOf } from './options';

export interface SheetRow {
  mask: string;
  /** Target field, with the sub-field of a combination field ("Land › Staatsname"). */
  field: string;
  /** The value as written into the file; empty = nothing to enter. */
  value: string;
  problem?: string;
}

export interface LugImport {
  /** The import file, or undefined while a blocking problem is open. */
  text?: string;
  sheet: SheetRow[];
  /** Values left out, with the reason. */
  problems: string[];
  /** Why no file can be written (e.g. missing Mandantennummer). */
  blocking: string[];
}

const baseName = (name: string) => {
  const open = name.indexOf('(');
  return open < 0 ? name : name.slice(0, open).trim();
};

type Resolved = { text: string } | { empty: true } | { problem: string };

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

export function buildLugImport(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  mapping: ExportMapping,
  numbers: { mandantennummer?: string; mitarbeiternummer?: string },
): LugImport {
  const values = valuesOf(questionnaire, definition);
  const fields = fieldsById(definition);
  const proposals = new Map(derive(questionnaire, definition).map((d) => [d.id, d] as const));

  const resolve = (value: ExportValue): Resolved => {
    let text: string | undefined;
    if (value.blank) return { empty: true };
    if (value.const !== undefined) text = value.const;
    else if (value.derivation !== undefined) {
      const proposal = proposals.get(value.derivation);
      if (proposal?.status !== 'proposed' || proposal.value === undefined) {
        return { problem: `Vorschlag „${proposal?.label ?? value.derivation}“ fehlt` };
      }
      text = proposal.value;
    } else if (value.field !== undefined) {
      const stored = values.valueOf(value.field);
      if (stored === null) return { empty: true };
      if (typeof stored === 'boolean') text = String(stored);
      else if (typeof stored === 'string') text = stored;
      else return { problem: 'Tabellen werden nicht übertragen' };
      if (value.code !== undefined) {
        const listId = fields.get(value.field)?.optionsFrom ?? '';
        text = listCodesOf(listId, text)[value.code];
        if (text === undefined) return { empty: true };
      }
    }
    if (text === undefined) return { empty: true };
    if (value.slice) text = text.slice(value.slice[0], value.slice[1]);
    if (text.includes('?')) return { problem: `Vorschlag „${text}“ ist noch offen` };
    if (value.map) {
      const mapped = value.map[text];
      if (mapped === undefined) return { problem: `für „${text}“ gibt es keine Zuordnung` };
      text = mapped;
    }
    if (text === '') return { empty: true };
    const formatted = format(text, value);
    return 'text' in formatted ? escape(formatted.text) : formatted;
  };

  const sheet: SheetRow[] = [];
  const problems: string[] = [];
  const records: { mask: string; fields: ExportField[]; written: string[] }[] = [];
  for (const record of mapping.records) {
    if (record.when && !evaluateCondition(record.when, values.valueOf)) continue;
    const used: ExportField[] = [];
    const written: string[] = [];
    // A value only the program's user knows (blank, not optional) in a single field is a key of the
    // record (e.g. the wage type): without it the record must not be written at all.
    let missingKey: string | undefined;
    for (const field of record.fields) {
      const subs = subFields(field.name);
      const results = field.values.map(resolve);
      const label = field.label ?? baseName(field.name);
      results.forEach((result, i) => {
        const sub = subs.length > 1 ? `${label} › ${subs[i] ?? ''}` : label;
        const value = field.values[i];
        if ('problem' in result) {
          sheet.push({ mask: record.mask, field: sub, value: '', problem: result.problem });
          problems.push(`${record.mask} – ${sub}: ${result.problem}`);
        } else if (value?.blank && value.optional !== true) {
          sheet.push({ mask: record.mask, field: sub, value: '', problem: 'selbst erfassen' });
        } else {
          sheet.push({ mask: record.mask, field: sub, value: 'text' in result ? result.text : '' });
        }
      });
      if (subs.length === 1 && field.values[0]?.blank && field.values[0].optional !== true) {
        missingKey = label;
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
    }
    if (missingKey !== undefined) {
      problems.push(`${record.mask}: „${missingKey}“ selbst erfassen – Datensatz nicht übertragen`);
      continue;
    }
    if (used.length > 0) records.push({ mask: record.mask, fields: used, written });
  }

  const blocking: string[] = [];
  const mandant = numbers.mandantennummer?.trim() ?? '';
  if (!/^\d{1,5}$/.test(mandant)) blocking.push('Mandantennummer (1 bis 5 Ziffern) fehlt.');
  const fromForm = mapping.employee.number ? resolve(mapping.employee.number) : { empty: true };
  const employeeNumber =
    numbers.mitarbeiternummer?.trim() || ('text' in fromForm ? fromForm.text : '');
  if (!/^\d{1,5}$/.test(employeeNumber))
    blocking.push('Mitarbeiternummer (1 bis 5 Ziffern) fehlt.');
  const HEAD = {
    name: 'Familienname',
    firstName: 'Vorname',
    start: 'Eintrittsdatum',
    firstMonth: 'erster abzurechnender Monat',
  } as const;
  const head = (Object.keys(HEAD) as (keyof typeof HEAD)[]).map((key) => {
    const result = resolve(mapping.employee[key]);
    if (!('text' in result)) blocking.push(`Für die Neuanlage fehlt: ${HEAD[key]}.`);
    return 'text' in result ? result.text : '';
  });
  if (blocking.length > 0) return { sheet, problems, blocking };

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
    mapping.special.mitarbeiterSelOderNeu,
    ...records.map(
      (record, i) => `${1000 + i};${record.mask};${record.fields.map((f) => f.name).join(';')}`,
    ),
    '',
    '[Mandant]',
    `${idOf(mapping.special.mandantSel)};${mandant}`,
    '',
    '[Mitarbeiter]',
    `${idOf(mapping.special.mitarbeiterSelOderNeu)};${[employeeNumber, ...head].join(';')}`,
    '',
    '[Mitarbeiter]',
    `${idOf(mapping.special.mitarbeiterSel)};${employeeNumber}`,
    ...records.map((record, i) => `${1000 + i};${record.written.join(';')}`),
    '',
  ];
  return { text: lines.join('\r\n'), sheet, problems, blocking };
}
