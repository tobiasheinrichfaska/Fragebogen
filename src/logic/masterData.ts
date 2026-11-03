// Master data a station may remember on its own device (e.g. company name, Betriebsnummer) and
// reuse in every form that names the same key (`FieldDefinition.masterData`, or one key per case
// in `masterDataCases`). Pure: the io layer stores and loads the record. A loaded record is
// untrusted and goes through setValue exactly like typed input; every value that cannot be used is
// reported with its reason, never dropped silently.
//
// A link value is a preselection (Tobias 2026-11-03): it fills a question as soon as the question
// is available — a conditional one once its condition holds — and follows the case while nobody
// changes it; an answer the person gave or changed is never touched again.
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
import { currentPart, setValue, type TransitionCode } from './questionnaire';

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
  key.options === undefined || (typeof value === 'string' && key.options.includes(value));

/** A stored answer as it travels in the link (yes/no as "ja"/"nein"). */
export function linkValue(value: FieldValue): FieldValue {
  return typeof value === 'boolean' ? (value ? MASTER_DATA_YES : MASTER_DATA_NO) : value;
}

/** A link value as the field stores it (setValue still checks it). */
export function storedValue(field: { type: string }, value: unknown): unknown {
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
 * What the link did with a field in this session: `filled` (the value is still the link's),
 * `released` (someone answered or changed it — never touched again), `refused` (the form did not
 * accept the value; tried again only for another key).
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
      /** Fields whose link value no longer fits the case and went back to empty. */
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
 * every answer with the `fills` it returned. A preselection counts as empty; keys of other forms
 * are ignored.
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
  const set = (fieldId: FieldId, value: unknown) => {
    const result = setValue(q, form, role, fieldId, value);
    if (result.ok) q = result.questionnaire;
    return result;
  };
  for (const field of fieldsOfRole(definition, role)) {
    if (field.masterData === undefined && field.masterDataCases === undefined) continue;
    const data = currentPart(q, role)?.data ?? {};
    const valueOf = visibleValues(definition, role, data);
    if (visibility(definition, role, data).get(field.id) !== true) continue;
    const fill = fills[field.id];
    const present = data[field.id] ?? null;
    if (fill?.state === 'released') continue;
    if (fill?.state === 'filled' && !same(present, fill.value)) {
      fills[field.id] = { ...fill, state: 'released' };
      continue;
    }
    const ours = fill?.state === 'filled';
    const choice = masterDataKeyFor(field, valueOf);
    const target = choice !== undefined && Object.hasOwn(stored, choice.key) ? choice : undefined;
    if (!target) {
      // The case changed (e.g. Minijob → kind unclear): the old case's value is not an answer.
      if (ours && set(field.id, field.initial ?? null).ok) {
        cleared.push(field.id);
        Reflect.deleteProperty(fills, field.id);
      }
      continue;
    }
    if (ours && fill.key === target.key) continue;
    if (fill?.state === 'refused' && fill.key === target.key) continue;
    if (!ours && present !== null && present !== field.initial) {
      kept.push(field.id);
      fills[field.id] = { key: target.key, value: present, state: 'released' };
      continue;
    }
    const value = storedValue(field, stored[target.key]);
    const result = fits(target, value as FieldValue)
      ? set(field.id, value)
      : ({ ok: false, code: 'invalidValue', detail: [field.id, 'choice.unknown'] } as const);
    if (result.ok) {
      applied.push(field.id);
      const now = currentPart(q, role)?.data[field.id] ?? null;
      fills[field.id] = { key: target.key, value: now, state: 'filled' };
    } else {
      skipped.push({
        fieldId: field.id,
        key: target.key,
        code: result.code,
        detail: result.detail,
      });
      fills[field.id] = { key: target.key, value: present, state: 'refused' };
    }
  }
  return { ok: true, questionnaire: q, fills, applied, cleared, kept, skipped };
}
