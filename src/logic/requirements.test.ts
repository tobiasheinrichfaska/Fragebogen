import {
  MINOR_VALUES,
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  beispielForm,
  fill,
  guardianForm,
  logicForm,
  minorSigned,
  minorWithGuardian,
  note,
  ok,
  personSealInput,
  personSigned,
  twoRoles,
  withGuardian,
} from '../../tests/support/sample';
import type { RegisteredForm } from './formRegistry';
import type { Part, Questionnaire } from './model';
import { createQuestionnaire, sealPart, setValue, startPart } from './questionnaire';
import {
  BLOCKER_MESSAGES,
  completenessGaps,
  roleRequirement,
  transmissionBlockers,
  type Blocker,
} from './requirements';
import { contentHashOf, fieldHash } from './seal';

const codes = (blockers: readonly Blocker[]) =>
  blockers.map((b) => (b.role ? `${b.code}@${b.role}` : b.code));

function guardianRole(form: RegisteredForm) {
  const role = form.definition.roles.find((r) => r.id === 'vertretung');
  if (!role) throw new Error('no guardian role');
  return role;
}

/** Person signs with the given birth date on the given local day (10:15, CET/CEST offset given). */
function signedOn(
  birth: string,
  day: string,
  offset = '+01:00',
  form = guardianForm(),
): Questionnaire {
  const hour = offset === '+02:00' ? '08' : '09';
  let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
  q = ok(startPart(q, form, 'person'));
  q = fill(q, 'person', { ...PERSON_VALUES, geburtsdatum: birth }, form);
  return ok(
    sealPart(
      q,
      form,
      'person',
      personSealInput({
        systemNote: note(`${day}T10:15:00.000${offset}`, `${day}T${hour}:15:00.000Z`),
      }),
    ),
  );
}

function forgeReseal(part: Part): void {
  const seal = part.seal;
  if (!seal) throw new Error('not sealed');
  seal.payload.fieldHashes = Object.fromEntries(
    Object.entries(part.data).map(([id, value]) => [id, fieldHash(seal.payload.nonce, id, value)]),
  );
  seal.contentHash = contentHashOf(seal.payload);
}

describe('roleRequirement', () => {
  const form = guardianForm();

  it('marks unconditional roles as always required', () => {
    const person = form.definition.roles.find((r) => r.id === 'person');
    if (!person) throw new Error('no person role');
    expect(roleRequirement(form.definition, minorSigned(), person)).toEqual({
      role: 'person',
      required: true,
      reason: 'always',
    });
  });

  it('is pending while the person has not signed', () => {
    const q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    expect(roleRequirement(form.definition, q, guardianRole(form))).toMatchObject({
      required: false,
      reason: 'pending',
      triggerRole: 'person',
    });
  });

  it('requires the guardian for a minor, by the date of the signing device', () => {
    expect(roleRequirement(form.definition, minorSigned(), guardianRole(form))).toEqual({
      role: 'vertretung',
      required: true,
      reason: 'minor',
      triggerRole: 'person',
      signingDate: '2026-10-29',
      age: 16,
    });
  });

  it.each([
    ['2008-10-30', '2026-10-29', true, 17],
    ['2008-10-29', '2026-10-29', false, 18],
    ['2008-02-29', '2026-02-28', true, 17],
    ['2008-02-29', '2026-03-01', false, 18],
  ])('born %s, signed %s → guardian required: %s (age %i)', (birth, day, required, age) => {
    const requirement = roleRequirement(form.definition, signedOn(birth, day), guardianRole(form));
    expect(requirement).toMatchObject({ required, age, reason: required ? 'minor' : 'adult' });
  });

  it('uses the local day of the signature, not the UTC day', () => {
    // 00:30 on 30.10. in Berlin is still 29.10. in UTC: the person turns 18 on the local day.
    let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    q = ok(startPart(q, form, 'person'));
    q = fill(q, 'person', { ...PERSON_VALUES, geburtsdatum: '2008-10-30' }, form);
    q = ok(
      sealPart(
        q,
        form,
        'person',
        personSealInput({
          systemNote: note('2026-10-30T00:30:00.000+01:00', '2026-10-29T23:30:00.000Z'),
        }),
      ),
    );
    expect(roleRequirement(form.definition, q, guardianRole(form))).toMatchObject({
      required: false,
      age: 18,
    });
  });

  it('treats a birth date after the signing day as unknown and therefore required', () => {
    const q = structuredClone(minorSigned());
    const person = q.parts.person?.[0];
    if (!person) throw new Error('no person');
    person.data.geburtsdatum = '2027-01-01';
    forgeReseal(person);
    expect(roleRequirement(form.definition, q, guardianRole(form))).toMatchObject({
      required: true,
      reason: 'ageUnknown',
    });
  });
});

describe('transmissionBlockers', () => {
  it('lets an adult pass on the signed part', () => {
    expect(transmissionBlockers(personSigned(), beispielForm())).toEqual([]);
    expect(transmissionBlockers(signedOn('1990-05-17', '2026-10-29'), guardianForm())).toEqual([]);
  });

  it('blocks an empty questionnaire', () => {
    const form = beispielForm();
    expect(codes(transmissionBlockers(createQuestionnaire(QUESTIONNAIRE_ID, form), form))).toEqual([
      'nothingSealed',
    ]);
  });

  it('blocks while the person has not signed (draft)', () => {
    const form = beispielForm();
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    q = fill(q, 'person', PERSON_VALUES, form);
    expect(codes(transmissionBlockers(q, form))).toEqual(['nothingSealed', 'draftOpen@person']);
  });

  it('blocks a part that is sealed but lacks the required signature', () => {
    const q = structuredClone(personSigned());
    const person = q.parts.person?.[0];
    if (!person?.seal) throw new Error('no person');
    delete person.seal.payload.signature;
    delete person.signatureStrokes;
    person.status = 'sealed';
    forgeReseal(person);
    expect(codes(transmissionBlockers(q, beispielForm()))).toEqual(['signatureMissing@person']);
  });

  it('blocks an altered part', () => {
    const q = structuredClone(twoRoles());
    const person = q.parts.person?.[0];
    if (person) person.data.nachname = 'Mustermann';
    expect(codes(transmissionBlockers(q, beispielForm()))).toEqual(['partInvalid@person']);
  });

  it('blocks a re-opened part until it is sealed again', () => {
    const form = beispielForm();
    const q = ok(startPart(personSigned(), form, 'person'));
    expect(codes(transmissionBlockers(q, form))).toEqual(['draftOpen@person']);
  });

  it('blocks a minor without the guardian and says why', () => {
    const blockers = transmissionBlockers(minorSigned(), guardianForm());
    expect(blockers).toEqual([
      {
        code: 'guardianMissing',
        role: 'vertretung',
        detail: ['Gesetzliche Vertretung', '16 Jahre am 29.10.2026'],
      },
    ]);
  });

  it('lets a minor with the guardian pass on', () => {
    expect(transmissionBlockers(minorWithGuardian(), guardianForm())).toEqual([]);
  });

  it('blocks when the person re-signed after the guardian', () => {
    const form = guardianForm();
    let q = ok(startPart(minorWithGuardian(), form, 'person'));
    q = ok(setValue(q, form, 'person', 'bemerkungen', 'Nachtrag'));
    q = ok(sealPart(q, form, 'person', personSealInput({ nonce: 'c'.repeat(32) })));
    expect(codes(transmissionBlockers(q, form))).toEqual(['guardianNotBound@vertretung']);
    expect(transmissionBlockers(withGuardianAgain(q), form)).toEqual([]);
  });

  function withGuardianAgain(q: Questionnaire): Questionnaire {
    return withGuardian(q);
  }

  it('blocks a guardian part without a name (crafted file)', () => {
    const q = structuredClone(minorWithGuardian());
    const guardian = q.parts.vertretung?.[0];
    if (!guardian) throw new Error('no guardian');
    guardian.data.vertretungName = null;
    forgeReseal(guardian);
    expect(codes(transmissionBlockers(q, guardianForm()))).toEqual([
      'requiredFieldMissing@vertretung',
      'guardianNameMissing@vertretung',
    ]);
  });

  it('blocks when the age cannot be determined', () => {
    const q = structuredClone(minorSigned());
    const person = q.parts.person?.[0];
    if (!person) throw new Error('no person');
    person.data.geburtsdatum = '2027-01-01';
    forgeReseal(person);
    expect(codes(transmissionBlockers(q, guardianForm()))).toEqual(['ageUnknown@vertretung']);
  });

  it('accepts a guardian with a typed name on a form without a name field', () => {
    const form = beispielForm();
    let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    q = ok(startPart(q, form, 'person'));
    q = fill(q, 'person', MINOR_VALUES, form);
    q = ok(sealPart(q, form, 'person', personSealInput()));
    expect(codes(transmissionBlockers(q, form))).toEqual(['guardianMissing@vertretung']);
    const person = q.parts.person?.[0];
    if (!person?.seal) throw new Error('no person');
    q = ok(startPart(q, form, 'vertretung'));
    q = ok(
      sealPart(q, form, 'vertretung', {
        ...personSealInput({ nonce: 'd'.repeat(32), acknowledged: [] }),
        signature: { method: 'typed', name: 'Max Musterfrau' },
        receivedParts: [
          {
            role: 'person',
            contentHash: person.seal.contentHash,
            receivedAtLocal: '2026-10-29T10:16:00.000+01:00',
            receivedAtUtc: '2026-10-29T09:16:00.000Z',
            source: 'same-device',
          },
        ],
      }),
    );
    expect(transmissionBlockers(q, form)).toEqual([]);
  });

  it('refuses a form that does not belong to the questionnaire', () => {
    expect(() => transmissionBlockers(personSigned(), guardianForm())).toThrow(RangeError);
  });
});

describe('completenessGaps', () => {
  it('reports the missing employer part to the Kanzlei', () => {
    expect(codes(completenessGaps(personSigned(), beispielForm()))).toEqual([
      'roleMissing@arbeitgeber',
    ]);
  });

  it('is empty for the complete two-role scenario', () => {
    expect(completenessGaps(twoRoles(), beispielForm())).toEqual([]);
  });

  it('reports the guardian of a minor, not as a plain missing role', () => {
    expect(codes(completenessGaps(minorSigned(), guardianForm()))).toEqual([
      'guardianMissing@vertretung',
      'roleMissing@arbeitgeber',
    ]);
  });

  it('reports every role of an empty questionnaire', () => {
    const form = beispielForm();
    expect(codes(completenessGaps(createQuestionnaire(QUESTIONNAIRE_ID, form), form))).toEqual([
      'roleMissing@person',
      'roleMissing@arbeitgeber',
    ]);
  });
});

describe('BLOCKER_MESSAGES', () => {
  it('has a German sentence for every blocker', () => {
    for (const message of Object.values(BLOCKER_MESSAGES))
      expect(message).toMatch(/^[A-ZÄÖÜ].*\.$/);
  });
});

describe('transmissionBlockers — required fields', () => {
  it('blocks a sealed part that lacks a conditionally required answer (crafted file)', () => {
    const form = logicForm();
    let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    q = ok(startPart(q, form, 'person'));
    q = fill(q, 'person', { ...PERSON_VALUES, telefon: '0721 1234' }, form);
    q = ok(sealPart(q, form, 'person', personSealInput()));
    expect(transmissionBlockers(q, form)).toEqual([]);
    const crafted = structuredClone(q);
    const person = crafted.parts.person?.[0];
    if (!person) throw new Error('no person');
    person.data.telefon = null;
    forgeReseal(person);
    expect(transmissionBlockers(crafted, form)).toEqual([
      {
        code: 'requiredFieldMissing',
        role: 'person',
        detail: ['Beschäftigte Person', 'Telefon', 'E-Mail'],
      },
    ]);
  });

  it('refuses to seal while a conditionally required answer is missing', () => {
    const form = logicForm();
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    q = fill(q, 'person', { ...PERSON_VALUES, kvArt: 'gesetzlich', email: 'a@b.de' }, form);
    const result = sealPart(q, form, 'person', personSealInput());
    expect(result.ok ? [] : [result.code, ...result.detail]).toEqual(['missingRequired', 'kvName']);
  });
});
