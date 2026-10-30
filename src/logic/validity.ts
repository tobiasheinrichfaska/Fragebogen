// Validity of a form version (Tobias 2026-10-30): a version applies to a period of one reference
// date of the questionnaire, e.g. the first working day — an entry in October 2026 needs a version
// valid on that day. The reference date is a required, always available date or month field; a
// value outside the period blocks signing the part that holds it and passing the questionnaire on.
import { formatGermanDate } from './dates';
import { fieldsById } from './form';
import type { FieldDefinition, FormDefinition, FormValidity, RoleId } from './model';
import type { PartData } from './form';

/** Whether a date (`YYYY-MM-DD`) or month (`YYYY-MM`) lies within from … until, both inclusive. */
export function withinValidity(value: string, validity: FormValidity): boolean {
  const length = value.length;
  const from = validity.from.slice(0, length);
  const until = validity.until?.slice(0, length);
  return value >= from && (until === undefined || value <= until);
}

function referenceField(definition: FormDefinition): FieldDefinition | undefined {
  return definition.validity && fieldsById(definition).get(definition.validity.field);
}

/** The role that states the reference date. */
export function validityRole(definition: FormDefinition): RoleId | undefined {
  return referenceField(definition)?.role;
}

function shown(field: FieldDefinition | undefined, value: string): string {
  if (field?.type === 'month') {
    const [year = '', month = ''] = value.split('-');
    return `${month}.${year}`;
  }
  return formatGermanDate(value);
}

/** "gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026" — or undefined. */
export function describeValidity(definition: FormDefinition): string | undefined {
  const validity = definition.validity;
  if (!validity) return undefined;
  const field = referenceField(definition);
  const range =
    validity.until === undefined
      ? `ab ${formatGermanDate(validity.from)}`
      : `vom ${formatGermanDate(validity.from)} bis ${formatGermanDate(validity.until)}`;
  return `gilt für „${field?.label ?? validity.field}“ ${range}`;
}

/**
 * The reference date of this role's data as people read it, when it lies outside the validity;
 * undefined when the role does not state it, it is still empty, or it fits.
 */
export function outsideValidity(
  definition: FormDefinition,
  role: RoleId,
  data: PartData,
): string | undefined {
  const validity = definition.validity;
  const field = referenceField(definition);
  if (!validity || field?.role !== role) return undefined;
  const value = data[validity.field];
  if (typeof value !== 'string' || withinValidity(value, validity)) return undefined;
  return shown(field, value);
}
