// Changing answers afterwards (check of 2026-10-30): from the summary, "Weiter" returns there
// after the follow-ups the change opened instead of walking through every later question; a
// voluntary yes/no answer can be taken back; the definition rules for `fromRole` and `because`.
import { join } from 'node:path';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { nextMissingStep, type InterviewStep } from '../../src/logic/interview';
import type { FieldDefinition, FormDefinition } from '../../src/logic/model';
import { createQuestionnaire } from '../../src/logic/questionnaire';
import {
  answer,
  defer,
  editFromSummary,
  enterRole,
  goTo,
  leaveRole,
  nextChoice,
  nextStep,
  previousStep,
  sessionFromFile,
  skipToMissing,
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

describe('revising: "Weiter" or straight to the next missing answer', () => {
  it('offers the shortcut when "Weiter" would show an answered question', () => {
    const choice = nextChoice(goTo(person(BASE), 'question:familienname'));
    expect(choice.next?.key).toBe('question:vorname');
    expect(choice.skip?.key).toBe('question:geburtsdatum');
    expect(skipToMissing(goTo(person(BASE), 'question:familienname')).stepKey).toBe(
      'question:geburtsdatum',
    );
  });

  it('stops at a required question put back with "Weiß ich gerade nicht"', () => {
    const deferred = goTo(
      must(defer(goTo(person(BASE), 'question:geburtsdatum'), 'geburtsdatum')),
      'question:familienname',
    );
    expect(nextChoice(deferred).skip?.key).toBe('question:geburtsdatum');
  });

  it('offers no shortcut while the next question is still open', () => {
    expect(nextChoice(goTo(person(BASE), 'question:geburtsdatum')).skip).toBeUndefined();
  });

  it('stops at a voluntary question left empty as well', () => {
    const filled = person({
      ...BASE,
      geburtsdatum: '17.05.1990',
      geburtsort: 'Musterstadt',
      geburtsstaat: 'Deutschland',
      geschlecht: 'weiblich',
      staatsangehoerigkeitSchluessel: 'deutsch',
    });
    expect(nextChoice(goTo(filled, 'question:familienname')).skip?.key).toBe(
      'question:versicherungsnummer',
    );
  });

  it('leads to the summary once every question is answered', () => {
    const question = (key: string, state: 'answered' | 'open', required: boolean) =>
      ({ kind: 'question', key, fieldId: key, sectionId: 's', level: 0, required, state }) as const;
    const optionalOpen: InterviewStep[] = [
      question('a', 'answered', true),
      question('b', 'answered', true),
      question('c', 'open', false),
      { kind: 'summary', key: 'summary' },
    ];
    expect(nextMissingStep(optionalOpen, 'a').key).toBe('c');
    const allAnswered: InterviewStep[] = [
      question('a', 'answered', true),
      question('b', 'answered', false),
      { kind: 'summary', key: 'summary' },
    ];
    expect(nextMissingStep(allAnswered, 'a').key).toBe('summary');
  });

  it('says "Zurück zur Zusammenfassung" when a change from the summary opens nothing', () => {
    const editing = editFromSummary(person(BASE), 'vorname');
    expect(nextChoice(editing)).toMatchObject({ backToSummary: true });
    expect(nextChoice(editing).skip).toBeUndefined();
    const opened = must(answer(editFromSummary(person(BASE), 'situation'), 'situation', ['rente']));
    expect(nextChoice(opened)).toMatchObject({ backToSummary: false });
    expect(nextChoice(opened).next?.key).toBe('question:rentenart');
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
