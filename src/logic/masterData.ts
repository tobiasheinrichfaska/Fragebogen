// Master data a station may remember on its own device (e.g. company name, Betriebsnummer) and
// reuse in every form that names the same key (`FieldDefinition.masterData`). Pure: the io layer
// stores and loads the record. A loaded record is untrusted and goes through setValue exactly like
// typed input; every value that cannot be used is reported with its reason, never dropped silently.
import { fieldsOfRole, type PartData } from './form';
import type { RegisteredForm } from './formRegistry';
import { isPlainObject } from './jcs';
import type { FieldId, FieldValue, FormDefinition, Questionnaire, RoleId } from './model';
import { currentPart, setValue, type TransitionCode } from './questionnaire';

/** Remembered master data: key → normalised value. */
export type MasterData = Record<string, FieldValue>;

/** The role's master data in this part; unanswered fields are left out. */
export function masterDataOf(definition: FormDefinition, role: RoleId, data: PartData): MasterData {
  return Object.fromEntries(
    fieldsOfRole(definition, role).flatMap((field) => {
      const value = data[field.id] ?? null;
      return field.masterData === undefined || value === null ? [] : [[field.masterData, value]];
    }),
  );
}

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
      /** Fields filled from the record. */
      applied: FieldId[];
      /** Fields that already had an answer; the answer is kept. */
      kept: FieldId[];
      /** Remembered values the form refused (e.g. wrong format) — to be shown to the user. */
      skipped: MasterDataSkip[];
    }
  | { ok: false; code: 'noDraft' | 'invalidRecord' };

/**
 * Fills the empty master-data fields of the role's open draft from a remembered record. Keys of
 * other forms are ignored; answers already given are kept.
 */
export function applyMasterData(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  role: RoleId,
  stored: unknown,
): MasterDataResult {
  if (!isPlainObject(stored)) return { ok: false, code: 'invalidRecord' };
  const draft = currentPart(questionnaire, role);
  if (draft?.status !== 'draft') return { ok: false, code: 'noDraft' };
  let q = questionnaire;
  const applied: FieldId[] = [];
  const kept: FieldId[] = [];
  const skipped: MasterDataSkip[] = [];
  for (const field of fieldsOfRole(form.definition, role)) {
    const key = field.masterData;
    if (key === undefined || !Object.hasOwn(stored, key)) continue;
    if ((draft.data[field.id] ?? null) !== null) {
      kept.push(field.id);
      continue;
    }
    const result = setValue(q, form, role, field.id, stored[key]);
    if (result.ok) {
      q = result.questionnaire;
      applied.push(field.id);
    } else {
      skipped.push({ fieldId: field.id, key, code: result.code, detail: result.detail });
    }
  }
  return { ok: true, questionnaire: q, applied, kept, skipped };
}
