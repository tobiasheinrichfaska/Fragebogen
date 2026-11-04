import { readResume, resumeAction, resumeAllowed, resumeRecord, RESUME_MAX_DAYS } from './resume';

const SAVED = '2026-11-04T09:00:00.000Z';
const record = resumeRecord('Sofortmeldung', '{"format":"fragebogen-paket"}', SAVED);
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

  it.each([
    ['no JSON', '{'],
    ['an array', '[]'],
    ['another format', JSON.stringify({ ...record, format: 'x' })],
    ['an extra key', JSON.stringify({ ...record, extra: 1 })],
    ['a missing key', JSON.stringify({ ...record, title: undefined })],
    ['a changed package', JSON.stringify({ ...record, packageText: '{}' })],
    ['a changed time', JSON.stringify({ ...record, savedAt: later(1) })],
    ['a broken time', JSON.stringify(resumeRecord('x', '{}', 'gestern'))],
  ])('calls %s damaged', (_name, raw) => {
    expect(readResume(raw, SAVED)).toEqual({ kind: 'damaged' });
  });
});
