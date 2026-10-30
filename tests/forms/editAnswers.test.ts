// Changing answers afterwards (check of 2026-10-30): from the summary, "Weiter" returns there
// after the follow-ups the change opened instead of walking through every later question; a
// voluntary yes/no answer can be taken back; the definition rules for `fromRole` and `because`.
import { join } from 'node:path';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { FieldDefinition, FormDefinition } from '../../src/logic/model';
import { createQuestionnaire } from '../../src/logic/questionnaire';
import {
  answer,
  editFromSummary,
  enterRole,
  goTo,
  leaveRole,
  nextStep,
  previousStep,
  sessionFromFile,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const at = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

function person(values: Readonly<Record<string, unknown>>): Session {
  let session = must(
    enterRole(
      sessionFromFile(
        {
          questionnaire: createQuestionnaire(QUESTIONNAIRE_ID, form),
          form,
          origin: 'published',
        },
        { local: at.local, utc: at.utc, source: 'file' },
      ),
      'person',
    ),
  );
  for (const [id, raw] of Object.entries(values)) session = must(answer(session, id, raw));
  return goTo(session, 'summary');
}

const BASE = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  situation: ['arbeitnehmer'],
  artLautVereinbarung: 'festeStelle',
  krankenversicherung: 'gesetzlich',
};

describe('changing an answer from the summary', () => {
  it('returns to the summary right away when the change opens nothing', () => {
    const editing = editFromSummary(person(BASE), 'vorname');
    expect(editing.stepKey).toBe('question:vorname');
    const changed = must(answer(editing, 'vorname', 'Erika Maria'));
    const next = nextStep(changed);
    expect(next.stepKey).toBe('summary');
    expect(next.editing).toBeUndefined();
  });

  it('asks the follow-ups the change opened, then returns to the summary', () => {
    let session = must(answer(editFromSummary(person(BASE), 'situation'), 'situation', ['rente']));
    session = nextStep(session);
    expect(session.stepKey).toBe('question:rentenart');
    session = nextStep(must(answer(session, 'rentenart', 'altersvoll')));
    expect(session.stepKey).toBe('question:renteSeit');
    session = nextStep(must(answer(session, 'renteSeit', '01.07.2026')));
    expect(session.stepKey).toBe('summary');
  });

  it('skips follow-ups that already have an answer', () => {
    const answered = person({ ...BASE, situation: ['rente'], rentenart: 'altersvoll' });
    const session = nextStep(editFromSummary(answered, 'situation'));
    expect(session.stepKey).toBe('question:renteSeit');
  });

  it('keeps going back step by step while editing, and forgets the edit on leaving', () => {
    const editing = editFromSummary(person(BASE), 'vorname');
    const back = previousStep(editing);
    expect(back.stepKey).toBe('question:familienname');
    expect(back.editing).toBe('vorname');
    expect(leaveRole(editing).editing).toBeUndefined();
    expect(goTo(editing, 'summary').editing).toBeUndefined();
  });

  it('walks on through every later question without the summary edit', () => {
    const session = nextStep(goTo(person(BASE), 'question:vorname'));
    expect(session.stepKey).not.toBe('summary');
  });
});

describe('a voluntary yes/no answer can be taken back', () => {
  it('clears pkvWiderspruch', () => {
    const session = person({
      ...BASE,
      krankenversicherung: 'privat',
      pkvWiderspruch: true,
    });
    const cleared = must(answer(session, 'pkvWiderspruch', null));
    expect(cleared.questionnaire.parts.person?.[0]?.data.pkvWiderspruch).toBeNull();
  });
});

describe('definition rules for fromRole and because', () => {
  const problems = (change: (fields: Map<string, FieldDefinition>, d: FormDefinition) => void) => {
    const definition = structuredClone(form.definition);
    const fields = new Map(
      definition.sections.flatMap((section) => section.fields).map((f) => [f.id, f]),
    );
    change(fields, definition);
    return checkFormDefinition(definition).map((issue) => `${issue.path} ${issue.message}`);
  };
  const steuerart = (fields: Map<string, FieldDefinition>) => {
    const field = fields.get('steuerart');
    if (!field) throw new Error('draft changed');
    return field;
  };

  it('accepts the draft as it is', () => {
    expect(problems(() => undefined)).toEqual([]);
  });

  it.each([
    [
      'its own role',
      (f: FieldDefinition) => (f.fromRole = { role: 'person', field: 'agBesteuerung' }),
      'must name another role',
    ],
    [
      'an unknown field',
      (f: FieldDefinition) => (f.fromRole = { role: 'arbeitgeber', field: 'gibtEsNicht' }),
      'unknown field "gibtEsNicht"',
    ],
    [
      'a field of a third role',
      (f: FieldDefinition) => (f.fromRole = { role: 'vertretung', field: 'agBesteuerung' }),
      'belongs to role "arbeitgeber"',
    ],
    [
      'another type',
      (f: FieldDefinition) => (f.fromRole = { role: 'arbeitgeber', field: 'agBefristet' }),
      'must have the type of "agBefristet" (boolean)',
    ],
    [
      'a missing option',
      (f: FieldDefinition) => (f.options = (f.options ?? []).filter((o) => o.id !== 'pauschal5')),
      'option "pauschal5" of the other field is missing',
    ],
    [
      'a preselection',
      (f: FieldDefinition) => (f.initial = 'elstam'),
      'a taken-over field has no preselection',
    ],
  ])('refuses fromRole naming %s', (_name, change, message) => {
    expect(problems((fields) => change(steuerart(fields))).join('\n')).toContain(message);
  });

  it('refuses a because on a field without a condition and on a role that is always needed', () => {
    const found = problems((fields, definition) => {
      const name = fields.get('familienname');
      if (name) name.because = 'Ohne Bedingung.';
      const employer = definition.roles.find((role) => role.id === 'arbeitgeber');
      if (employer) employer.because = 'Immer.';
    });
    expect(found).toEqual([
      expect.stringContaining('only fields with showIf, requiredIf or fromRole explain them'),
      expect.stringContaining('only conditional roles explain their condition'),
    ]);
  });
});
