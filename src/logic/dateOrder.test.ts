import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import { registeredFrom } from '../../tests/support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../../tests/support/sample';
import { formCatalogue } from './catalogue';
import { dateOrderProblems, describeDateOrderProblem } from './dateOrder';
import { checkFormDefinition, parseFormDefinition } from './formDefinition';
import type { FormDefinition } from './model';
import { currentPart } from './questionnaire';
import {
  answer,
  enterRole,
  seal,
  startSession,
  summaryOf,
  type Session,
  type SessionResult,
} from './session';

type RawField = Record<string, unknown>;
const employer = (id: string, extra: RawField): RawField => ({
  id,
  role: 'arbeitgeber',
  type: 'date',
  label: id,
  required: false,
  purpose: 'Test der Datumsreihenfolge',
  ...extra,
});

/** The fixture with a fixed term: its end not before the start, the notice not after the end. */
function orderedRaw(extra: RawField[] = []): unknown {
  const raw = structuredClone(beispiel) as unknown as {
    version: string;
    sections: { id: string; fields: RawField[] }[];
  };
  raw.version = '1.8.0';
  raw.sections[1]?.fields.push(
    employer('befristet', { type: 'boolean', label: 'Befristet' }),
    employer('befristetBis', {
      label: 'Befristet bis',
      showIf: { field: 'befristet', equals: true },
      notBefore: 'eintritt',
    }),
    employer('zugang', { label: 'Zugang der Kündigung', notAfter: 'befristetBis' }),
    ...extra,
  );
  return raw;
}

const form = registeredFrom(orderedRaw());
const AT = { local: '2026-11-13T10:00:00.000+01:00', utc: '2026-11-13T09:00:00.000Z' };

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}
const fill = (s: Session, values: Record<string, unknown>) =>
  Object.entries(values).reduce((next, [id, raw]) => must(answer(next, id, raw)), s);
const employerDraft = (values: Record<string, unknown> = {}) =>
  fill(must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber')), {
    agNachname: 'Musterfrau',
    eintritt: '01.11.2026',
    bruttoMonat: '3200',
    befristet: true,
    ...values,
  });

describe('the order of two dates of one role (2026-11-13)', () => {
  it('is a valid rule on a later date field of the same role', () => {
    expect(checkFormDefinition(form.definition)).toEqual([]);
  });

  it.each<[string, RawField, string]>([
    [
      'a field that is no date',
      employer('x', { type: 'text', notBefore: 'eintritt' }),
      'only date fields have notBefore',
    ],
    ['an unknown field', employer('x', { notBefore: 'nirgends' }), 'unknown field "nirgends"'],
    ['itself', employer('x', { notAfter: 'x' }), 'a field cannot be compared with itself'],
    [
      'a field that is no date',
      employer('x', { notBefore: 'bruttoMonat' }),
      '"bruttoMonat" is not a date field',
    ],
    [
      'a field of another role',
      employer('x', { notBefore: 'geburtsdatum' }),
      '"geburtsdatum" belongs to another role',
    ],
  ])('refuses a rule naming %s', (_what, field, message) => {
    const parsed = parseFormDefinition(orderedRaw([field]));
    expect(parsed.ok ? [] : parsed.issues.map((issue) => issue.message)).toContain(message);
  });

  it('refuses a rule naming a date asked later: the second date is the one checked', () => {
    const definition: FormDefinition = structuredClone(form.definition);
    const fields = definition.sections[1]?.fields ?? [];
    const start = fields.find((f) => f.id === 'eintritt');
    if (start) start.notBefore = 'befristetBis';
    expect(checkFormDefinition(definition).map((issue) => issue.message)).toContain(
      '"befristetBis" must come before "eintritt" (interview order)',
    );
  });

  it('refuses an end before the start as it is typed, naming the start', () => {
    const s = employerDraft();
    const result = answer(s, 'befristetBis', '17.05.2026');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe('Das Datum liegt vor „Eintrittsdatum“ (01.11.2026).');
    expect(result.detail).toEqual(['Befristet bis']);
  });

  it('takes the same day and any later day', () => {
    expect(answer(employerDraft(), 'befristetBis', '01.11.2026').ok).toBe(true);
    expect(answer(employerDraft(), 'befristetBis', '31.12.2026').ok).toBe(true);
  });

  it('refuses a notice after the end ("nach")', () => {
    const result = answer(employerDraft({ befristetBis: '31.12.2026' }), 'zugang', '02.01.2027');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt nach „Befristet bis“ (31.12.2026).',
    );
  });

  it('lets the start move past the end, lists the pair in the summary and refuses to seal', () => {
    const s = must(answer(employerDraft({ befristetBis: '30.11.2026' }), 'eintritt', '01.12.2026'));
    const summary = summaryOf(s);
    expect(summary?.dateOrder).toEqual([
      {
        fieldId: 'befristetBis',
        relation: 'notBefore',
        other: 'eintritt',
        value: '2026-11-30',
        otherValue: '2026-12-01',
      },
    ]);
    expect(summary?.readyToSign).toBe(false);
    const label = (id: string) => (id === 'eintritt' ? 'Eintrittsdatum' : 'Befristet bis');
    expect(summary?.dateOrder.map((p) => describeDateOrderProblem(p, label))).toEqual([
      '„Befristet bis“ (30.11.2026) liegt vor „Eintrittsdatum“ (01.12.2026).',
    ]);
    const sealed = seal(s, { nonce: 'ab'.repeat(16), systemNote: note(AT.local, AT.utc), now: AT });
    expect(sealed.ok ? '' : sealed.message).toBe(
      'Das Datum liegt vor „Eintrittsdatum“ (01.12.2026).',
    );
    const fixed = must(answer(s, 'befristetBis', '31.12.2026'));
    expect(summaryOf(fixed)?.dateOrder).toEqual([]);
  });

  it('ignores a date that is not available (a hidden field counts as unanswered)', () => {
    const s = must(answer(employerDraft({ befristetBis: '30.11.2026' }), 'eintritt', '01.12.2026'));
    const hidden = must(answer(s, 'befristet', false));
    const data = currentPart(hidden.questionnaire, 'arbeitgeber')?.data ?? {};
    expect(dateOrderProblems(form.definition, 'arbeitgeber', data)).toEqual([]);
  });

  it('names the rule in the catalogue', () => {
    const text = formCatalogue(form, 'draft');
    expect(text).toContain('nicht vor „Eintrittsdatum“');
    expect(text).toContain('nicht nach „Befristet bis“');
  });
});
