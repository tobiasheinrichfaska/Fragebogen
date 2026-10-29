import {
  NONCE_EMPLOYER,
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  fill,
  linkedForm,
  note,
  ok,
  personSealInput,
  twoRoles,
  beispielForm,
} from '../../tests/support/sample';
import type { Questionnaire, ReceivedPart } from './model';
import {
  createQuestionnaire,
  latestSealed,
  receivedPartFor,
  sealPart,
  startPart,
} from './questionnaire';
import { completenessGaps, transmissionBlockers } from './requirements';

const form = linkedForm();

const EMPLOYER_VALUES = {
  agFirma: 'Beispiel GmbH',
  agNachname: 'Musterfrau',
  eintritt: '01.11.2026',
  bruttoMonat: '2.450,00',
};

function received(q: Questionnaire, role: string, local: string, utc: string): ReceivedPart {
  const part = latestSealed(q, role);
  if (!part) throw new Error(`${role} part missing`);
  return receivedPartFor(part, { local, utc }, 'same-device');
}

function employerSeals(
  q: Questionnaire,
  values: Readonly<Record<string, unknown>>,
  receivedParts: ReceivedPart[],
  nonce = NONCE_EMPLOYER,
  at: [string, string] = ['2026-10-29T09:00:00.000+01:00', '2026-10-29T08:00:00.000Z'],
): Questionnaire {
  const draft = fill(ok(startPart(q, form, 'arbeitgeber')), 'arbeitgeber', values, form);
  return ok(
    sealPart(draft, form, 'arbeitgeber', {
      nonce,
      systemNote: note(at[0], at[1], ['keyboard']),
      acknowledged: [],
      receivedParts,
    }),
  );
}

function personSigns(q: Questionnaire, receivedParts: ReceivedPart[] = []): Questionnaire {
  const draft = fill(ok(startPart(q, form, 'person')), 'person', PERSON_VALUES, form);
  return ok(sealPart(draft, form, 'person', personSealInput({ receivedParts })));
}

const empty = () => createQuestionnaire(QUESTIONNAIRE_ID, form);
const codes = (q: Questionnaire) => completenessGaps(q, form).map((gap) => gap.code);

describe('completenessGaps — linked parts (partLinks)', () => {
  it('is satisfied when the employer, sealing last, confirms the person part', () => {
    const person = personSigns(empty());
    const q = employerSeals(
      person,
      EMPLOYER_VALUES,
      [received(person, 'person', '2026-10-30T08:00:00.000+01:00', '2026-10-30T07:00:00.000Z')],
      NONCE_EMPLOYER,
      ['2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z'],
    );
    expect(codes(q)).toEqual([]);
  });

  it('is satisfied when the person, signing last, confirms the employer part', () => {
    const employer = employerSeals(empty(), EMPLOYER_VALUES, []);
    expect(transmissionBlockers(employer, form)).toEqual([]);
    const q = personSigns(employer, [
      received(
        employer,
        'arbeitgeber',
        '2026-10-29T09:05:00.000+01:00',
        '2026-10-29T08:05:00.000Z',
      ),
    ]);
    expect(codes(q)).toEqual([]);
  });

  it('reports parts that never referenced each other', () => {
    const q = personSigns(employerSeals(empty(), EMPLOYER_VALUES, []));
    expect(completenessGaps(q, form)).toEqual([
      { code: 'partsNotLinked', detail: ['Beschäftigte Person', 'Arbeitgeber'] },
    ]);
    expect(transmissionBlockers(q, form)).toEqual([]);
  });

  it('reports the link as lost when the employer changes its part afterwards', () => {
    const employer = employerSeals(empty(), EMPLOYER_VALUES, []);
    const signed = personSigns(employer, [
      received(
        employer,
        'arbeitgeber',
        '2026-10-29T09:05:00.000+01:00',
        '2026-10-29T08:05:00.000Z',
      ),
    ]);
    const later: [string, string] = ['2026-10-29T11:00:00.000+01:00', '2026-10-29T10:00:00.000Z'];
    const changed = employerSeals(signed, { eintritt: '15.11.2026' }, [], 'ab'.repeat(16), later);
    expect(codes(changed)).toEqual(['partsNotLinked']);
    expect(transmissionBlockers(changed, form)).toEqual([]);

    const relinked = employerSeals(
      signed,
      { eintritt: '15.11.2026' },
      [received(signed, 'person', '2026-10-29T10:55:00.000+01:00', '2026-10-29T09:55:00.000Z')],
      'ab'.repeat(16),
      later,
    );
    expect(codes(relinked)).toEqual([]);
  });

  it('is not checked while a linked part is missing or on forms without partLinks', () => {
    expect(codes(personSigns(empty()))).toEqual(['roleMissing']);
    expect(completenessGaps(twoRoles(), beispielForm())).toEqual([]);
  });
});
