// Master data a station may remember on its own device (e.g. company name, Betriebsnummer) and
// reuse in every form that names the same key (`FieldDefinition.masterData`, or one key per case
// in `masterDataCases`). Pure: the io layer stores and loads the record. A loaded record is
// untrusted and goes through setValue exactly like typed input; every value that cannot be used is
// reported with its reason, never dropped silently.
//
// A link value is a preselection (Tobias 2026-11-03): it fills a question as soon as the question
// is available — a conditional one once its condition holds — and follows the case while nobody
// changes it; an answer the person gave, changed or cleared is never touched again. The draft marks
// which values are the link's (Part.preset, Tobias 2026-11-14), so this holds after an interim
// file, too.
import { evaluateCondition } from './conditions';
import { fieldsOfRole, visibility, type PartData } from './form';
import type { RegisteredForm } from './formRegistry';
import { isPlainObject } from './jcs';
import type {
  FieldDefinition,
  FieldId,
  FieldValue,
  FormDefinition,
  Questionnaire,
  RoleId,
} from './model';
import {
  currentPart,
  markPreset,
  presetOf,
  resetPreset,
  setValue,
  type TransitionCode,
} from './questionnaire';

/** Remembered master data: key → normalised value. */
export type MasterData = Record<string, FieldValue>;

/** Yes/no master data travel as text in the link (Tobias 2026-10-30: firm attributes). */
export const MASTER_DATA_YES = 'ja';
export const MASTER_DATA_NO = 'nein';

/** A key a field can carry: its fixed key, or one of its cases. */
export interface MasterDataKey {
  key: string;
  /** Case heading (`masterDataCases`); the field label otherwise. */
  label: string;
  /** Answers that fit the case; every option otherwise. */
  options?: readonly string[];
}

/**
 * Labels of the roles that carry master data, in role order — whom a link prefills: the employer
 * in the Sofortmeldung, the Kanzlei in the SEPA-Mandat (2026-11-05: the texts said "Arbeitgeber").
 */
export function masterDataRoleLabels(definition: FormDefinition): string[] {
  const owners = new Set(
    definition.sections
      .flatMap((section) => section.fields)
      .filter((field) => masterDataKeysOf(field).length > 0)
      .map((field) => field.role),
  );
  return definition.roles.filter((role) => owners.has(role.id)).map((role) => role.label);
}

/** Those roles quoted for a sentence ("… stehen schon im Teil „Arbeitgeber“"): „A“ und „B“. */
export function masterDataRolesText(definition: FormDefinition): string {
  const labels = masterDataRoleLabels(definition).map((label) => `„${label}“`);
  return labels.length <= 1
    ? (labels[0] ?? '')
    : `${labels.slice(0, -1).join(', ')} und ${labels[labels.length - 1] ?? ''}`;
}

export function masterDataKeysOf(field: FieldDefinition): MasterDataKey[] {
  if (field.masterData !== undefined) return [{ key: field.masterData, label: field.label }];
  return (field.masterDataCases ?? []).map((entry) => ({
    key: entry.key,
    label: entry.label,
    ...(entry.options === undefined ? {} : { options: entry.options }),
  }));
}

/** The key the field carries with these answers: the fixed key or the first case that holds. */
export function masterDataKeyFor(
  field: FieldDefinition,
  valueOf: (id: FieldId) => FieldValue,
): MasterDataKey | undefined {
  if (field.masterData !== undefined) return { key: field.masterData, label: field.label };
  const entry = field.masterDataCases?.find((candidate) =>
    evaluateCondition(candidate.when, valueOf),
  );
  if (!entry) return undefined;
  return {
    key: entry.key,
    label: entry.label,
    ...(entry.options === undefined ? {} : { options: entry.options }),
  };
}

const fits = (key: MasterDataKey, value: FieldValue) =>
  key.options === undefined ||
  (typeof value === 'string' && key.options.includes(value)) ||
  (Array.isArray(value) && value.every((v) => typeof v === 'string' && key.options?.includes(v)));

/**
 * Separator of a multiple choice in the link (Tobias 2026-11-26: „Mehrfachauswahl passt in einen
 * Link, indem alle Werte aufgezählt werden“): the chosen option ids, e.g. „sokaBau,ukbBayern“.
 * Option ids never hold a comma (ID pattern), so the list reads back unambiguously.
 */
export const MASTER_DATA_LIST_SEPARATOR = ',';

/**
 * A stored answer as it travels in the link: yes/no as "ja"/"nein", a multiple choice as its
 * option ids joined by commas.
 */
export function linkValue(value: FieldValue): FieldValue {
  if (Array.isArray(value)) return value.join(MASTER_DATA_LIST_SEPARATOR);
  return typeof value === 'boolean' ? (value ? MASTER_DATA_YES : MASTER_DATA_NO) : value;
}

/** A link value as the field stores it (setValue still checks it). */
export function storedValue(field: { type: string }, value: unknown): unknown {
  if (field.type === 'multiChoice') {
    return typeof value === 'string' ? value.split(MASTER_DATA_LIST_SEPARATOR) : value;
  }
  if (field.type !== 'boolean') return value;
  return value === MASTER_DATA_YES ? true : value === MASTER_DATA_NO ? false : value;
}

function visibleValues(definition: FormDefinition, role: RoleId, data: PartData) {
  const visible = visibility(definition, role, data);
  return (id: FieldId): FieldValue => (visible.get(id) === true ? (data[id] ?? null) : null);
}

/**
 * The role's master data in this part: answered, available fields only, each under the key its
 * case names (an answer that does not fit the case is left out), yes/no as "ja"/"nein".
 */
export function masterDataOf(definition: FormDefinition, role: RoleId, data: PartData): MasterData {
  const valueOf = visibleValues(definition, role, data);
  return Object.fromEntries(
    fieldsOfRole(definition, role).flatMap((field) => {
      const value = valueOf(field.id);
      const key = masterDataKeyFor(field, valueOf);
      if (key === undefined || value === null || !fits(key, value)) return [];
      return [[key.key, linkValue(value)]];
    }),
  );
}

/**
 * The link for next time: the loaded record with this part's master data on top — keys of other
 * forms stay, the current answers win, an unanswered field keeps the remembered value.
 */
export function mergedMasterData(
  remembered: MasterData | undefined,
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): MasterData {
  return { ...(remembered ?? {}), ...masterDataOf(definition, role, data) };
}

/**
 * What the link did with a field in this session: `filled` (the value is the link's), `released`
 * (the field holds an answer — given, changed or cleared by a person — and is never touched
 * again), `refused` (the form did not accept the value; tried again only for another key). Only
 * for reporting each field once: whether a value is the link's is marked in the draft itself
 * (Part.preset), so it holds after an interim file, too.
 */
export interface MasterDataFill {
  key: string;
  value: FieldValue;
  state: 'filled' | 'released' | 'refused';
}
export type MasterDataFills = Readonly<Record<FieldId, MasterDataFill>>;

export interface MasterDataSkip {
  fieldId: FieldId;
  key: string;
  code: TransitionCode;
  detail: readonly string[];
}

export type MasterDataResult =
  | {
      ok: true;
      questionnaire: Questionnaire;
      fills: MasterDataFills;
      /** Fields filled from the record in this pass. */
      applied: FieldId[];
      /** Fields whose link value no longer fits the case and went back to the preselection. */
      cleared: FieldId[];
      /** Fields that already had an answer; the answer is kept. */
      kept: FieldId[];
      /** Remembered values the form refused (e.g. wrong format) — to be shown to the user. */
      skipped: MasterDataSkip[];
    }
  | { ok: false; code: 'noDraft' | 'invalidRecord' };

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Fills the available master-data fields of the role's open draft from a remembered record, in
 * form order (a filled answer may open the next question). Call it on entering the role and after
 * every answer with the `fills` it returned. Only an empty field or one holding a preselection
 * (the form's or the link's own, Part.preset) is filled — never a value a person gave or changed;
 * a link value a person emptied stays empty while the questionnaire is open. The filled value is
 * marked as the link's. Keys of other forms are ignored.
 */
export function applyMasterData(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  role: RoleId,
  stored: unknown,
  previous: MasterDataFills = {},
): MasterDataResult {
  if (!isPlainObject(stored)) return { ok: false, code: 'invalidRecord' };
  if (currentPart(questionnaire, role)?.status !== 'draft') return { ok: false, code: 'noDraft' };
  const { definition } = form;
  let q = questionnaire;
  const fills: Record<FieldId, MasterDataFill> = { ...previous };
  const applied: FieldId[] = [];
  const cleared: FieldId[] = [];
  const kept: FieldId[] = [];
  const skipped: MasterDataSkip[] = [];
  for (const field of fieldsOfRole(definition, role)) {
    if (field.masterData === undefined && field.masterDataCases === undefined) continue;
    const part = currentPart(q, role);
    const data = part?.data ?? {};
    if (visibility(definition, role, data).get(field.id) !== true) continue;
    const mark = presetOf(part, field.id);
    const present = data[field.id];
    const choice = masterDataKeyFor(field, visibleValues(definition, role, data));
    const target = choice !== undefined && Object.hasOwn(stored, choice.key) ? choice : undefined;
    const fill = fills[field.id];
    // Empty is no answer: a field never answered, left empty or signed empty in an earlier version
    // is filled — except one emptied in this session after the link had filled it (the person
    // took the link's value out; `fills` remembers that while the questionnaire is open).
    const clearedHere = present === null && mark === undefined && fill !== undefined;
    if (clearedHere && fill.state !== 'refused') {
      fills[field.id] = { ...fill, value: null, state: 'released' };
      continue;
    }
    if (present !== undefined && present !== null && mark !== 'initial' && mark !== 'link') {
      // An answer — given or changed — is never touched (Tobias 2026-11-14).
      if (target !== undefined && fill?.state !== 'released') {
        kept.push(field.id);
        fills[field.id] = { key: target.key, value: present, state: 'released' };
      }
      continue;
    }
    if (!target) {
      // The case changed (e.g. Minijob → kind unclear): the old case's value is not an answer.
      const reset = mark === 'link' ? resetPreset(q, form, role, field.id) : undefined;
      if (reset?.ok === true) {
        q = reset.questionnaire;
        cleared.push(field.id);
        Reflect.deleteProperty(fills, field.id);
      }
      continue;
    }
    if (fill?.state === 'refused' && fill.key === target.key) continue;
    const value = storedValue(field, stored[target.key]);
    if (mark === 'link' && same(present ?? null, value as FieldValue)) continue;
    const result = fits(target, value as FieldValue)
      ? setValue(q, form, role, field.id, value)
      : ({ ok: false, code: 'invalidValue', detail: [field.id, 'choice.unknown'] } as const);
    if (result.ok) {
      q = markPreset(result.questionnaire, role, field.id, 'link');
      const now = currentPart(q, role)?.data[field.id] ?? null;
      if (mark !== 'link' || !same(present ?? null, now)) applied.push(field.id);
      fills[field.id] = { key: target.key, value: now, state: 'filled' };
    } else {
      skipped.push({
        fieldId: field.id,
        key: target.key,
        code: result.code,
        detail: result.detail,
      });
      fills[field.id] = { key: target.key, value: present ?? null, state: 'refused' };
    }
  }
  return { ok: true, questionnaire: q, fills, applied, cleared, kept, skipped };
}
