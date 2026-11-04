import { canonicalize } from './jcs';
import type { FormDefinition } from './model';
import {
  readResume,
  resumeAction,
  resumeAllowed,
  resumePackageText,
  resumeRecord,
  RESUME_MAX_DAYS,
  sealed,
} from './resume';

const SAVED = '2026-11-04T09:00:00.000Z';
const FORM = { id: 'beispiel', version: '1.0.0' } as unknown as FormDefinition;
const QUESTIONNAIRE = { questionnaireId: 'q', parts: { person: [{ data: { a: 'b' } }] } };
const record = resumeRecord({
  title: 'Sofortmeldung',
  definitionHash: 'ab'.repeat(32),
  questionnaire: QUESTIONNAIRE,
  savedAt: SAVED,
});
const text = JSON.stringify(record);
const later = (days: number, ms = 0) =>
  new Date(Date.parse(SAVED) + days * 24 * 60 * 60 * 1000 + ms).toISOString();

describe('resumeAllowed', () => {
  it('only the hosted app (https) keeps anything', () => {
    expect(resumeAllowed('https:')).toBe(true);
    expect(resumeAllowed('file:')).toBe(false);
    expect(resumeAllowed('http:')).toBe(false);
    expect(resumeAllowed('blob:')).toBe(false);
  });
});

describe('resumeAction', () => {
  const dirty = { dirty: true };
  const saved = { dirty: false };

  it('keeps unsaved changes and removes them once they are saved elsewhere', () => {
    expect(resumeAction({ allowed: true, offerOpen: false, session: dirty })).toBe('save');
    expect(resumeAction({ allowed: true, offerOpen: false, session: saved })).toBe('clear');
  });

  it('removes them when the questionnaire is discarded or closed', () => {
    expect(resumeAction({ allowed: true, offerOpen: false, session: undefined })).toBe('clear');
  });

  it('writes nothing while the offer to continue an earlier questionnaire is open', () => {
    for (const session of [dirty, saved, undefined]) {
      expect(resumeAction({ allowed: true, offerOpen: true, session })).toBe('none');
    }
  });

  it('never touches the storage outside the hosted app', () => {
    for (const session of [dirty, saved, undefined]) {
      expect(resumeAction({ allowed: false, offerOpen: false, session })).toBe('none');
    }
  });
});

describe('the record', () => {
  it('holds the questionnaire only, not the form the app carries', () => {
    expect(record.questionnaireText).toBe(canonicalize(QUESTIONNAIRE));
    expect(record.definitionText).toBeUndefined();
  });

  it('holds the form text when the app does not carry the form', () => {
    const own = resumeRecord({
      title: 'x',
      definitionHash: 'cd'.repeat(32),
      questionnaire: QUESTIONNAIRE,
      definition: FORM,
      savedAt: SAVED,
    });
    expect(own.definitionText).toBe(canonicalize(FORM));
    expect(readResume(JSON.stringify(own), SAVED)).toEqual({ kind: 'found', record: own });
  });

  it('opens as a data package with the carried form, else with the stored one', () => {
    const carried = resumePackageText(record, (hash) =>
      hash === record.definitionHash ? FORM : undefined,
    );
    expect(JSON.parse(carried ?? '{}')).toEqual({
      format: 'fragebogen-paket',
      formatVersion: 1,
      questionnaire: QUESTIONNAIRE,
      definition: FORM,
    });
    expect(resumePackageText(record, () => undefined)).toBeUndefined();
  });
});

describe('readResume', () => {
  it('finds a record up to 7 days after the last save', () => {
    expect(readResume(text, SAVED)).toEqual({ kind: 'found', record });
    expect(readResume(text, later(RESUME_MAX_DAYS))).toMatchObject({ kind: 'found' });
  });

  it('calls a record older than 7 days expired', () => {
    expect(readResume(text, later(RESUME_MAX_DAYS, 1))).toEqual({
      kind: 'expired',
      savedAt: SAVED,
    });
  });

  it('has nothing without an entry', () => {
    expect(readResume(null, SAVED)).toEqual({ kind: 'none' });
  });

  it('calls a record of the first app version (whole package) outdated', () => {
    const first = { format: 'fragebogen-merker', version: 1, packageText: '{}', check: 'x' };
    expect(readResume(JSON.stringify(first), SAVED)).toEqual({ kind: 'outdated' });
  });

  const body: Omit<typeof record, 'check'> & { check?: string } = { ...record };
  delete body.check;
  it.each([
    ['no JSON', '{'],
    ['an array', '[]'],
    ['another format', JSON.stringify({ ...record, format: 'x' })],
    ['an extra key', JSON.stringify({ ...record, extra: 1 })],
    ['a missing key', JSON.stringify({ ...record, title: undefined })],
    ['a changed questionnaire', JSON.stringify({ ...record, questionnaireText: '{}' })],
    ['a changed time', JSON.stringify({ ...record, savedAt: later(1) })],
    ['a broken time', JSON.stringify(sealed({ ...body, savedAt: 'gestern' }))],
    ['a number for a text', JSON.stringify(sealed({ ...body, title: 5 as unknown as string }))],
  ])('calls %s damaged', (_name, raw) => {
    expect(readResume(raw, SAVED)).toEqual({ kind: 'damaged' });
  });
});
