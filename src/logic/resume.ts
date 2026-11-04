// An interrupted questionnaire kept in the browser (Tobias 2026-11-04, replaces "the browser stores
// nothing"): the browser holds exactly what is not saved anywhere else — unsaved changes are kept,
// a PDF, an interim file, discarding or closing removes them — for at most 7 days, and only in the
// hosted app (https). Never in a downloaded copy opened from file://: there every local HTML file
// shares one storage. Never a cookie: it would travel to the web server with every request.
// Written at once on every change (a delayed save lost the last answer when the page closed, found
// 2026-11-04), so the record holds the questionnaire only; the form comes from the app by its hash,
// its text only when the app does not carry it.
import { canonicalize } from './jcs';
import { canonicalHash } from './hash';
import { PACKAGE_FORMAT, PACKAGE_FORMAT_VERSION } from './dataPackage';
import type { FormDefinition } from './model';

export const RESUME_FORMAT = 'fragebogen-merker' as const;
export const RESUME_VERSION = 2;
export const RESUME_MAX_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResumeRecord {
  format: typeof RESUME_FORMAT;
  version: typeof RESUME_VERSION;
  /** UTC time of the last save (device clock). */
  savedAt: string;
  /** Title of the form, shown in the offer before anything is decoded. */
  title: string;
  definitionHash: string;
  /** The questionnaire as canonical JSON (RFC 8785). */
  questionnaireText: string;
  /** The form definition as canonical JSON — only when the app does not carry the form. */
  definitionText?: string;
  /** SHA-256 of the record without this field: a damaged entry is dropped, never half read. */
  check: string;
}

/** Only the hosted app keeps anything; file:// and anything else never. */
export function resumeAllowed(protocol: string): boolean {
  return protocol === 'https:';
}

export type ResumeAction = 'save' | 'clear' | 'none';

/**
 * What the browser storage should do after the app's state changed. While an offer to continue an
 * earlier questionnaire is open, nothing is written — the earlier one must not be overwritten.
 */
export function resumeAction(input: {
  allowed: boolean;
  offerOpen: boolean;
  session: { dirty: boolean } | undefined;
}): ResumeAction {
  if (!input.allowed || input.offerOpen) return 'none';
  if (!input.session) return 'clear';
  return input.session.dirty ? 'save' : 'clear';
}

type Body = Omit<ResumeRecord, 'check'>;

/** The record with its check (also for tests that move a record in time). */
export function sealed(body: Body): ResumeRecord {
  return { ...body, check: canonicalHash(body) };
}

export function resumeRecord(input: {
  title: string;
  definitionHash: string;
  questionnaire: unknown;
  /** Given only when the app does not carry the form. */
  definition?: FormDefinition;
  savedAt: string;
}): ResumeRecord {
  return sealed({
    format: RESUME_FORMAT,
    version: RESUME_VERSION,
    savedAt: input.savedAt,
    title: input.title,
    definitionHash: input.definitionHash,
    questionnaireText: canonicalize(input.questionnaire),
    ...(input.definition === undefined ? {} : { definitionText: canonicalize(input.definition) }),
  });
}

/**
 * The data package text the app opens like an interim file (decoded and verified there): the
 * questionnaire with the form the app carries, else the stored form text; undefined when neither.
 */
export function resumePackageText(
  record: ResumeRecord,
  carried: (hash: string) => FormDefinition | undefined,
): string | undefined {
  let questionnaire: unknown;
  let definition: unknown = carried(record.definitionHash);
  try {
    questionnaire = JSON.parse(record.questionnaireText);
    if (definition === undefined && record.definitionText !== undefined) {
      definition = JSON.parse(record.definitionText);
    }
  } catch {
    return undefined;
  }
  if (definition === undefined) return undefined;
  return canonicalize({
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_FORMAT_VERSION,
    questionnaire,
    definition,
  });
}

export type ResumeRead =
  | { kind: 'none' }
  | { kind: 'found'; record: ResumeRecord }
  | { kind: 'expired'; savedAt: string }
  | { kind: 'outdated' }
  | { kind: 'damaged' };

const KEYS = [
  'check',
  'definitionHash',
  'format',
  'questionnaireText',
  'savedAt',
  'title',
  'version',
] as const;

/** Reads what the storage holds; anything malformed or changed is "damaged", never trusted. */
export function readResume(raw: string | null, now: string): ResumeRead {
  if (raw === null) return { kind: 'none' };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: 'damaged' };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { kind: 'damaged' };
  }
  const o = value as Record<string, unknown>;
  if (o.format !== RESUME_FORMAT) return { kind: 'damaged' };
  // A record of an earlier app version (version 1 kept the whole package): not read, dropped.
  if (o.version !== RESUME_VERSION) return { kind: 'outdated' };
  const keys = Object.keys(o).filter((key) => key !== 'definitionText');
  if (keys.sort().join(',') !== KEYS.join(',')) return { kind: 'damaged' };
  const texts = [...KEYS.filter((key) => key !== 'version'), 'definitionText'];
  if (texts.some((key) => o[key] !== undefined && typeof o[key] !== 'string')) {
    return { kind: 'damaged' };
  }
  const record = o as unknown as ResumeRecord;
  const saved = Date.parse(record.savedAt);
  if (Number.isNaN(saved)) return { kind: 'damaged' };
  const { check, ...body } = record;
  if (canonicalHash(body) !== check) return { kind: 'damaged' };
  if (Date.parse(now) - saved > RESUME_MAX_DAYS * DAY_MS) {
    return { kind: 'expired', savedAt: record.savedAt };
  }
  return { kind: 'found', record };
}
