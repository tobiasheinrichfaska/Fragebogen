// Taking answers over from another questionnaire (Tobias, 2026-10-30): a Sofortmeldung fills the
// Personalfragebogen, last month's payroll report fills the new one. The same field id means the
// same thing across forms (definition rule within a form, workspace convention across forms), so
// values move by id — only when the type matches, only into empty fields, never for fields marked
// `carryOver: false`. They go through setValue in form order, so a follow-up is filled only when
// its condition holds, and every value that cannot be taken over is reported with its reason.
import { addMonths, isIsoMonth } from './dates';
import { fieldsById, fieldsOfRole } from './form';
import type { RegisteredForm } from './formRegistry';
import type {
  FieldDefinition,
  FieldId,
  FieldValue,
  FormDefinition,
  Questionnaire,
  RoleId,
} from './model';
import { ROW_ID_KEY } from './normalize';
import {
  currentPart,
  latestSealed,
  setValue,
  startPart,
  TRANSITION_MESSAGES,
} from './questionnaire';
import { isPlainObject } from './jcs';

export interface PrefillReport {
  role: RoleId;
  /** Fields filled from the other questionnaire. */
  applied: FieldId[];
  /** Fields that already had an answer here; it is kept. */
  kept: FieldId[];
  /** Values the form refused, with the German reason. */
  skipped: { fieldId: FieldId; reason: string }[];
  /** Set when the role was not touched at all, e.g. because its part is already sealed. */
  untouched?: string;
}

/** The value as taken over: a `nextMonth` month moves on by one month. */
function carried(field: FieldDefinition, value: FieldValue): FieldValue {
  return field.carryOver === 'nextMonth' && typeof value === 'string' && isIsoMonth(value)
    ? addMonths(value, 1)
    : value;
}

/** A table's rows restricted to the target's columns; columns marked carryOver: false stay empty. */
function tableValue(
  source: FieldDefinition,
  target: FieldDefinition,
  value: FieldValue,
): FieldValue {
  if (!Array.isArray(value)) return null;
  const sourceColumns = new Map((source.columns ?? []).map((column) => [column.id, column]));
  const columns = (target.columns ?? []).filter(
    (column) => column.carryOver !== false && sourceColumns.get(column.id)?.type === column.type,
  );
  const rows = value.flatMap((row) => {
    if (!isPlainObject(row)) return [];
    const cells: Record<string, FieldValue> = { [ROW_ID_KEY]: row[ROW_ID_KEY] ?? null };
    for (const column of columns)
      cells[column.id] = carried(column, (row[column.id] as FieldValue | undefined) ?? null);
    return columns.some((column) => cells[column.id] !== null) ? [cells] : [];
  });
  return rows.length === 0 ? null : rows;
}

/**
 * Fills the roles of `target` from the latest version (sealed, else draft) of the same roles in
 * `source`. A role without a part gets a new draft; a role whose part is already sealed is left
 * alone.
 */
export function prefillFrom(
  target: Questionnaire,
  targetForm: RegisteredForm,
  source: Questionnaire,
  sourceForm: RegisteredForm,
): { questionnaire: Questionnaire; reports: PrefillReport[] } {
  const sourceFields = fieldsById(sourceForm.definition);
  let q = target;
  const reports: PrefillReport[] = [];
  for (const role of targetForm.definition.roles) {
    const from = latestSealed(source, role.id) ?? currentPart(source, role.id);
    if (!from) continue;
    const report: PrefillReport = { role: role.id, applied: [], kept: [], skipped: [] };
    reports.push(report);
    const existing = currentPart(q, role.id);
    if (existing && existing.status !== 'draft') {
      report.untouched = 'Dieser Teil ist hier schon abgeschlossen; es wurde nichts übernommen.';
      continue;
    }
    const before = q;
    if (!existing) {
      const started = startPart(q, targetForm, role.id);
      if (!started.ok) {
        report.untouched = TRANSITION_MESSAGES[started.code];
        continue;
      }
      q = started.questionnaire;
    }
    for (const field of fieldsOfRole(targetForm.definition, role.id)) {
      const origin = sourceFields.get(field.id);
      const value = from.data[field.id];
      if (
        field.carryOver === false ||
        !origin ||
        origin.role !== role.id ||
        origin.type !== field.type ||
        value === undefined ||
        value === null
      ) {
        continue;
      }
      const present = currentPart(q, role.id)?.data[field.id] ?? null;
      // A preselection is not an answer yet: the other file's answer replaces it.
      if (present !== null && present !== field.initial) {
        report.kept.push(field.id);
        continue;
      }
      if (present !== null && present === value) continue;
      const taken =
        field.type === 'repeatGroup' ? tableValue(origin, field, value) : carried(field, value);
      if (taken === null) continue;
      const result = setValue(q, targetForm, role.id, field.id, taken);
      if (result.ok) {
        q = result.questionnaire;
        report.applied.push(field.id);
      } else {
        report.skipped.push({ fieldId: field.id, reason: TRANSITION_MESSAGES[result.code] });
      }
    }
    // Nothing to take over: no empty draft is left behind for this role.
    if (!existing && report.applied.length === 0) q = before;
  }
  return { questionnaire: q, reports };
}

/** The report as people read it: one line per role, every value not taken over with its reason. */
export function describePrefill(
  reports: readonly PrefillReport[],
  definition: FormDefinition,
): { applied: number; lines: string[] } {
  const fields = fieldsById(definition);
  const label = (id: FieldId) => fields.get(id)?.label ?? id;
  const lines: string[] = [];
  for (const report of reports) {
    const role = definition.roles.find((r) => r.id === report.role)?.label ?? report.role;
    if (report.untouched !== undefined) {
      lines.push(`${role}: ${report.untouched}`);
      continue;
    }
    const counts = [
      `${report.applied.length} ${report.applied.length === 1 ? 'Angabe' : 'Angaben'} übernommen`,
      ...(report.kept.length > 0
        ? [`${report.kept.length} vorhandene behalten (${report.kept.map(label).join(', ')})`]
        : []),
    ];
    lines.push(`${role}: ${counts.join(', ')}.`);
    for (const skip of report.skipped) {
      lines.push(`${role} – „${label(skip.fieldId)}“ nicht übernommen: ${skip.reason}`);
    }
  }
  return { applied: reports.reduce((sum, r) => sum + r.applied.length, 0), lines };
}
