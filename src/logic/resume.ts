// An interrupted questionnaire kept in the browser (Tobias 2026-11-04, replaces "the browser stores
// nothing"): the browser holds exactly what is not saved anywhere else — unsaved changes are kept,
// a PDF, an interim file, discarding or closing removes them — for at most 7 days, and only in the
// hosted app (https). Never in a downloaded copy opened from file://: there every local HTML file
// shares one storage. Never a cookie: it would travel to the web server with every request.
import { canonicalHash } from './hash';

export const RESUME_FORMAT = 'fragebogen-merker' as const;
export const RESUME_MAX_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResumeRecord {
  format: typeof RESUME_FORMAT;
  version: 1;
  /** UTC time of the last save (device clock). */
  savedAt: string;
  /** Title of the form, shown in the offer before anything is decoded. */
  title: string;
  /** The data package (questionnaire + form definition) as written to an interim file. */
  packageText: string;
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

const checkOf = (record: Omit<ResumeRecord, 'check'>): string => canonicalHash(record);

export function resumeRecord(title: string, packageText: string, savedAt: string): ResumeRecord {
  const body = { format: RESUME_FORMAT, version: 1 as const, savedAt, title, packageText };
  return { ...body, check: checkOf(body) };
}

export type ResumeRead =
  | { kind: 'none' }
  | { kind: 'found'; record: ResumeRecord }
  | { kind: 'expired'; savedAt: string }
  | { kind: 'damaged' };

/** Reads what the storage holds; anything malformed or changed is "damaged", never trusted. */
export function readResume(raw: string | null, now: string): ResumeRead {
  if (raw === null) return { kind: 'none' };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { kind: 'damaged' };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return { kind: 'damaged' };
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort().join(',');
  if (keys !== 'check,format,packageText,savedAt,title,version') return { kind: 'damaged' };
  if (o.format !== RESUME_FORMAT || o.version !== 1) return { kind: 'damaged' };
  if (
    typeof o.savedAt !== 'string' ||
    typeof o.title !== 'string' ||
    typeof o.packageText !== 'string' ||
    typeof o.check !== 'string'
  ) {
    return { kind: 'damaged' };
  }
  const saved = Date.parse(o.savedAt);
  if (Number.isNaN(saved)) return { kind: 'damaged' };
  const record = resumeRecord(o.title, o.packageText, o.savedAt);
  if (record.check !== o.check) return { kind: 'damaged' };
  const age = Date.parse(now) - saved;
  if (age > RESUME_MAX_DAYS * DAY_MS) return { kind: 'expired', savedAt: o.savedAt };
  return { kind: 'found', record };
}
