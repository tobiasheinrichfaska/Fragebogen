// The master-data link screen ("Stammdaten-Link erstellen oder ändern", Tobias 2026-11-03): every
// key the forms of this app carry, once each, with the question, help and input of its field, and
// what a set of link values means before any person is asked — which special cases it excludes
// right away and which it makes possible. Pure; the screen only renders it.
import { evaluateCondition } from './conditions';
import { fieldsById, ownerOfField } from './form';
import type { RegisteredForm } from './formRegistry';
import { masterDataKeysOf, storedValue, type MasterData } from './masterData';
import type { Condition, FieldDefinition, FieldId, FieldValue, FormDefinition } from './model';
import { normalizeFieldValue } from './normalize';
import { optionsOf } from './options';

export interface MasterDataEntry {
  key: string;
  /** Heading: the case label or the field's question. */
  question: string;
  help?: string;
  /** The field to enter it with (a case's options narrowed). */
  field: FieldDefinition;
  /** Titles of the forms that use the key. */
  forms: string[];
}

export interface MasterDataGroup {
  title: string;
  entries: MasterDataEntry[];
}

export interface MasterDataCatalog {
  groups: MasterDataGroup[];
  /** Keys whose fields differ between forms (type, options, format) — a definition error. */
  conflicts: string[];
}

/** What a key accepts; equal across forms, or the link would mean different things. */
function signatureOf(field: FieldDefinition): string {
  return JSON.stringify([
    field.type,
    optionsOf(field).map((option) => option.id),
    field.optionsFrom ?? null,
    field.decimals ?? 0,
    field.signed ?? false,
    field.multiline ?? false,
    field.textFormat ?? null,
  ]);
}

function narrowed(field: FieldDefinition, options: readonly string[] | undefined): FieldDefinition {
  if (options === undefined) return field;
  return { ...field, options: optionsOf(field).filter((option) => options.includes(option.id)) };
}

/**
 * The latest version of every form, the form with the most keys first; each key sits in the
 * section of the first form that has it, so the employer data of the Personalfragebogen lead.
 * For a single form (the link opens it) the sections need no form title.
 */
export function masterDataCatalog(forms: readonly RegisteredForm[]): MasterDataCatalog {
  const definitions = forms
    .map((form) => form.definition)
    .map((definition) => ({ definition, keys: keysOfForm(definition) }))
    .sort(
      (a, b) =>
        b.keys.length - a.keys.length || a.definition.title.localeCompare(b.definition.title, 'de'),
    );
  const groups = new Map<string, MasterDataGroup>();
  const entries = new Map<string, { entry: MasterDataEntry; signature: string }>();
  const conflicts = new Set<string>();
  for (const { definition, keys } of definitions) {
    for (const { key, field, label, options, section } of keys) {
      const shape = narrowed(field, options);
      const known = entries.get(key);
      if (known) {
        if (known.signature !== signatureOf(shape)) conflicts.add(key);
        if (!known.entry.forms.includes(definition.title)) known.entry.forms.push(definition.title);
        continue;
      }
      const entry: MasterDataEntry = {
        key,
        question: label ?? field.question ?? field.label,
        ...(field.help === undefined ? {} : { help: field.help }),
        field: shape,
        forms: [definition.title],
      };
      entries.set(key, { entry, signature: signatureOf(shape) });
      const title = definitions.length === 1 ? section : `${section} (${definition.title})`;
      const group = groups.get(title) ?? { title, entries: [] };
      group.entries.push(entry);
      groups.set(title, group);
    }
  }
  return { groups: [...groups.values()], conflicts: [...conflicts].sort() };
}

function keysOfForm(definition: FormDefinition) {
  return definition.sections.flatMap((section) =>
    section.fields.flatMap((field) =>
      masterDataKeysOf(field).map((key) => ({
        key: key.key,
        field,
        section: section.title,
        ...(field.masterDataCases === undefined ? {} : { label: key.label }),
        ...(key.options === undefined ? {} : { options: key.options }),
      })),
    ),
  );
}

/** A typed link value as it is stored in the record (yes/no as "ja"/"nein"); null clears it. */
export function masterDataInput(
  entry: MasterDataEntry,
  raw: unknown,
): { ok: true; value: FieldValue } | { ok: false; issue: string } {
  const result = normalizeFieldValue(entry.field, raw);
  if (!result.ok) return { ok: false, issue: result.issue };
  const value = result.value;
  return {
    ok: true,
    value: typeof value === 'boolean' ? (value ? 'ja' : 'nein') : value,
  };
}

/** The catalogue's entries in order. */
export function catalogEntries(catalog: MasterDataCatalog): MasterDataEntry[] {
  return catalog.groups.flatMap((group) => group.entries);
}

/**
 * Entries of the whole app that a form's catalogue leaves out (Tobias 2026-11-05: the link is
 * chosen for one form first, then only its data are shown) — values typed or read in for them
 * stay out of that link and are named.
 */
export function entriesOutside(
  all: MasterDataCatalog,
  shown: MasterDataCatalog,
): MasterDataEntry[] {
  const keys = new Set(catalogEntries(shown).map((entry) => entry.key));
  return catalogEntries(all).filter((entry) => !keys.has(entry.key));
}

/** Keys of the record no form of this app uses (kept in the link, shown as such). */
export function unknownMasterDataKeys(catalog: MasterDataCatalog, record: MasterData): string[] {
  const known = new Set(catalogEntries(catalog).map((entry) => entry.key));
  return Object.keys(record)
    .filter((key) => !known.has(key))
    .sort();
}

export interface MasterDataExclusion {
  form: string;
  message: string;
  /** `always`: every questionnaire of the form is excluded; `possible`: per person, by answers. */
  kind: 'always' | 'possible';
}

const UNKNOWN = Symbol('unknown');
type Known = FieldValue | typeof UNKNOWN;

/** Three-valued condition: undefined while it depends on answers nobody gave yet. */
function partial(condition: Condition, valueOf: (id: FieldId) => Known): boolean | undefined {
  if ('all' in condition) {
    const results = condition.all.map((child) => partial(child, valueOf));
    if (results.includes(false)) return false;
    return results.every((result) => result === true) ? true : undefined;
  }
  if ('any' in condition) {
    const results = condition.any.map((child) => partial(child, valueOf));
    if (results.includes(true)) return true;
    return results.every((result) => result === false) ? false : undefined;
  }
  if ('not' in condition) {
    const result = partial(condition.not, valueOf);
    return result === undefined ? undefined : !result;
  }
  const value = valueOf(condition.field);
  return value === UNKNOWN ? undefined : evaluateCondition(condition, () => value);
}

/**
 * The form's answers as far as the link decides them: a field with a fixed key holds the link
 * value (or its preselection), a hidden field counts as unanswered, everything else is unknown.
 */
function linkValues(definition: FormDefinition, record: MasterData | undefined) {
  const fields = fieldsById(definition);
  const memo = new Map<FieldId, Known>();
  const valueOf = (id: FieldId): Known => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    memo.set(id, UNKNOWN);
    const field = fields.get(id);
    let result: Known = UNKNOWN;
    if (field && ownerOfField(definition, id) !== undefined) {
      const shown = field.showIf === undefined ? true : partial(field.showIf, valueOf);
      if (shown === false) result = null;
      else if (field.masterData !== undefined && shown === true) {
        const linked = record?.[field.masterData];
        const value = linked === undefined ? null : storedValue(field, linked);
        result = (value ?? field.initial ?? null) as FieldValue;
      }
    }
    memo.set(id, result);
    return result;
  };
  return valueOf;
}

/**
 * Special cases (`exclusions`) of each form under these link values, before any person is asked:
 * `always` when the link alone excludes, `possible` when the link makes a case possible that the
 * empty link rules out (e.g. Seeschifffahrt opens "an Bord?").
 */
export function masterDataExclusions(
  forms: readonly RegisteredForm[],
  record: MasterData,
): MasterDataExclusion[] {
  return forms.flatMap(({ definition }) => {
    const withLink = linkValues(definition, record);
    const without = linkValues(definition, undefined);
    return (definition.exclusions ?? []).flatMap((exclusion): MasterDataExclusion[] => {
      const holds = (valueOf: (id: FieldId) => Known) => {
        const when = exclusion.when === undefined ? true : partial(exclusion.when, valueOf);
        // A named test needs answers of the person; it can only narrow the case down.
        return when === true && exclusion.test !== undefined ? undefined : when;
      };
      const now = holds(withLink);
      if (now === true)
        return [{ form: definition.title, message: exclusion.message, kind: 'always' }];
      if (now === undefined && holds(without) === false) {
        return [{ form: definition.title, message: exclusion.message, kind: 'possible' }];
      }
      return [];
    });
  });
}
