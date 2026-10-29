import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import {
  NONCE_PERSON,
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  STROKES,
  beispielForm,
  fill,
  kanzleiReceipt,
  note,
  ok,
  personSealInput,
  personSigned,
  twoRoles,
  withEmployer,
} from '../../tests/support/sample';
import { parseFormDefinition } from './formDefinition';
import { definitionHash, type RegisteredForm } from './formRegistry';
import type { Questionnaire, Receipt, ReceivedPart } from './model';
import {
  addReceipt,
  createQuestionnaire,
  currentPart,
  discardDraft,
  latestSealed,
  receivedPartFor,
  sealPart,
  setValue,
  startPart,
  type SealInput,
  type Transition,
} from './questionnaire';
import { contentHashOf, fieldHashesOf, strokesHashOf } from './seal';

const form = beispielForm();

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function refused(transition: Transition): { code: string; detail: readonly string[] } {
  if (transition.ok) throw new Error('expected a refusal');
  return { code: transition.code, detail: transition.detail };
}

function personDraft(values: Readonly<Record<string, unknown>> = PERSON_VALUES): Questionnaire {
  const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
  return fill(q, 'person', values);
}

function unsigned(overrides: Partial<SealInput> = {}): SealInput {
  const input = personSealInput(overrides);
  delete input.signature;
  return input;
}

function formWith(change: (raw: typeof beispiel) => void): RegisteredForm {
  const raw = structuredClone(beispiel);
  change(raw);
  const parsed = parseFormDefinition(raw);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  return { definition: parsed.definition, definitionHash: definitionHash(parsed.definition) };
}

describe('createQuestionnaire', () => {
  it('starts empty and pinned to the form version', () => {
    expect(createQuestionnaire(QUESTIONNAIRE_ID, form)).toEqual({
      format: 'fragebogen',
      formatVersion: 1,
      questionnaireId: QUESTIONNAIRE_ID,
      form: { id: 'beispiel', version: '1.0.0', definitionHash: form.definitionHash },
      parts: {},
      receipts: [],
    });
  });

  it.each(['', 'not-a-uuid', '3F2B8C1E-5D4A-4B6F-9A1C-2E7D8F9A0B1C'])('rejects the id %j', (id) => {
    expect(() => createQuestionnaire(id, form)).toThrow(RangeError);
  });
});

describe('drafts and values', () => {
  it('normalises values as they are set', () => {
    const draft = currentPart(personDraft(), 'person');
    expect(draft?.status).toBe('draft');
    expect(draft?.data).toEqual({
      nachname: 'Musterfrau',
      geburtsdatum: '1990-05-17',
      steuerId: '86095742719',
      weitereBeschaeftigung: true,
      weitereArt: 'minijob',
      bemerkungen: 'Erste Zeile\nZweite Zeile',
    });
  });

  it.each<[string, (q: Questionnaire) => Transition, string]>([
    ['a second draft', (q) => startPart(q, form, 'person'), 'draftExists'],
    ['an unknown role', (q) => startPart(q, form, 'kanzlei'), 'unknownRole'],
    [
      'another form',
      (q) =>
        startPart(
          q,
          formWith((raw) => {
            raw.title = 'Anders';
          }),
          'arbeitgeber',
        ),
      'wrongForm',
    ],
    [
      'a value without draft',
      (q) => setValue(q, form, 'arbeitgeber', 'eintritt', '1.1.2027'),
      'noDraft',
    ],
    ['an unknown field', (q) => setValue(q, form, 'person', 'vorname', 'Erika'), 'unknownField'],
    [
      'a field of another role',
      (q) => setValue(q, form, 'person', 'eintritt', '1.1.2027'),
      'notOwnField',
    ],
    [
      'an invalid value',
      (q) => setValue(q, form, 'person', 'steuerId', '86095742718'),
      'invalidValue',
    ],
    ['discarding a missing draft', (q) => discardDraft(q, 'arbeitgeber'), 'noDraft'],
  ])('refuses %s', (_label, transition, code) => {
    expect(refused(transition(deepFreeze(personDraft()))).code).toBe(code);
  });

  it('names field and issue of an invalid value', () => {
    expect(
      refused(setValue(personDraft(), form, 'person', 'steuerId', '86095742718')).detail,
    ).toEqual(['steuerId', 'taxId.checksum']);
  });

  it('discards a draft', () => {
    expect(ok(discardDraft(personDraft(), 'person')).parts).toEqual({});
  });

  it('never mutates its input', () => {
    const frozen = deepFreeze(personDraft());
    expect(() => ok(setValue(frozen, form, 'person', 'nachname', 'Neu'))).not.toThrow();
    expect(() => ok(sealPart(frozen, form, 'person', personSealInput()))).not.toThrow();
    expect(currentPart(frozen, 'person')?.status).toBe('draft');
  });
});

describe('sealPart', () => {
  it('signs: payload, field hashes, notices, signature, content hash', () => {
    const part = latestSealed(personSigned(), 'person');
    if (!part?.seal) throw new Error('not sealed');
    const { payload, contentHash } = part.seal;
    expect(part.status).toBe('signed');
    expect(part.signatureStrokes).toBe(STROKES);
    expect(payload).toMatchObject({
      schema: 'fragebogen.siegel/1',
      canon: 1,
      questionnaireId: QUESTIONNAIRE_ID,
      form: { id: 'beispiel', version: '1.0.0', definitionHash: form.definitionHash },
      role: 'person',
      version: 1,
      confirmationText: 'Ich bestätige, dass meine Angaben richtig und vollständig sind.',
      signature: { method: 'drawn', strokesHash: strokesHashOf(STROKES) },
      nonce: NONCE_PERSON,
      receivedParts: [],
    });
    expect(payload).not.toHaveProperty('supersedes');
    expect(payload.fieldHashes).toEqual(fieldHashesOf(NONCE_PERSON, part.data));
    expect(payload.acknowledgements).toEqual([
      {
        infoBlockId: 'datenschutz',
        kind: 'read',
        textHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
    ]);
    expect(contentHash).toBe(contentHashOf(payload));
  });

  it('is deterministic for the same input', () => {
    expect(personSigned()).toEqual(personSigned());
  });

  it('drops hidden values and seals unanswered visible fields as null', () => {
    const q = personDraft({ ...PERSON_VALUES, weitereBeschaeftigung: false, bemerkungen: '' });
    const part = latestSealed(ok(sealPart(q, form, 'person', personSealInput())), 'person');
    expect(part?.data).not.toHaveProperty('weitereArt');
    expect(part?.data.bemerkungen).toBeNull();
    expect(Object.keys(part?.seal?.payload.fieldHashes ?? {})).toEqual(
      Object.keys(part?.data ?? {}),
    );
  });

  it('seals without signature where the role allows it', () => {
    const part = latestSealed(withEmployer(personSigned()), 'arbeitgeber');
    expect(part?.status).toBe('sealed');
    expect(part?.seal?.payload).not.toHaveProperty('signature');
    expect(part?.seal?.payload.receivedParts).toHaveLength(1);
  });

  it('stores a typed name normalised', () => {
    const q = ok(
      sealPart(
        personDraft(),
        form,
        'person',
        personSealInput({ signature: { method: 'typed', name: '  Erika \t Musterfrau ' } }),
      ),
    );
    expect(latestSealed(q, 'person')?.seal?.payload.signature).toEqual({
      method: 'typed',
      typedName: 'Erika Musterfrau',
    });
    expect(latestSealed(q, 'person')).not.toHaveProperty('signatureStrokes');
  });

  it('re-seals as the next version superseding the previous one', () => {
    const first = personSigned();
    const v1 = latestSealed(first, 'person');
    let q = ok(startPart(first, form, 'person'));
    expect(currentPart(q, 'person')?.data).toEqual(v1?.data);
    q = ok(setValue(q, form, 'person', 'bemerkungen', 'Neu'));
    q = ok(sealPart(q, form, 'person', personSealInput({ nonce: 'e'.repeat(32) })));
    const v2 = latestSealed(q, 'person');
    expect(q.parts.person).toHaveLength(2);
    expect(v2?.seal?.payload.version).toBe(2);
    expect(v2?.seal?.payload.supersedes).toBe(v1?.seal?.contentHash);
  });

  const roleNone = formWith((raw) => {
    const role = raw.roles[2];
    if (role) role.signature = 'none';
  });

  it.each<[string, () => Transition, string]>([
    ['without draft', () => sealPart(personSigned(), form, 'person', personSealInput()), 'noDraft'],
    [
      'with a bad nonce',
      () => sealPart(personDraft(), form, 'person', personSealInput({ nonce: 'xyz' })),
      'invalidNonce',
    ],
    [
      'with a broken system note',
      () =>
        sealPart(
          personDraft(),
          form,
          'person',
          personSealInput({ systemNote: note('2026-10-29T10:15:00', '2026-10-29T09:15:00Z') }),
        ),
      'invalidSystemNote',
    ],
    [
      'with contradicting times',
      () =>
        sealPart(
          personDraft(),
          form,
          'person',
          personSealInput({
            systemNote: note('2026-10-29T10:15:00+02:00', '2026-10-29T09:15:00Z'),
          }),
        ),
      'invalidSystemNote',
    ],
    [
      'without the required signature',
      () => sealPart(personDraft(), form, 'person', unsigned()),
      'signatureRequired',
    ],
    [
      'with empty strokes',
      () =>
        sealPart(
          personDraft(),
          form,
          'person',
          personSealInput({ signature: { method: 'drawn', strokes: '' } }),
        ),
      'invalidSignature',
    ],
    [
      'with a blank typed name',
      () =>
        sealPart(
          personDraft(),
          form,
          'person',
          personSealInput({ signature: { method: 'typed', name: ' \u{200B} ' } }),
        ),
      'invalidSignature',
    ],
    [
      'without the notice',
      () => sealPart(personDraft(), form, 'person', personSealInput({ acknowledged: [] })),
      'noticeNotAcknowledged',
    ],
    [
      'with a notice of another form',
      () =>
        sealPart(
          personDraft(),
          form,
          'person',
          personSealInput({ acknowledged: ['datenschutz', 'agb'] }),
        ),
      'unknownNotice',
    ],
    [
      'with missing answers',
      () => sealPart(personDraft({ nachname: 'Musterfrau' }), form, 'person', personSealInput()),
      'missingRequired',
    ],
    [
      'with a signature the role does not have',
      () => {
        let q = ok(
          startPart(createQuestionnaire(QUESTIONNAIRE_ID, roleNone), roleNone, 'arbeitgeber'),
        );
        q = fill(
          q,
          'arbeitgeber',
          { agNachname: 'X', eintritt: '1.1.2027', bruttoMonat: '1' },
          roleNone,
        );
        return sealPart(q, roleNone, 'arbeitgeber', { ...personSealInput(), acknowledged: [] });
      },
      'signatureNotAllowed',
    ],
  ])('refuses to seal %s', (_label, transition, code) => {
    expect(refused(transition()).code).toBe(code);
  });

  it('lists the missing answers', () => {
    expect(
      refused(
        sealPart(
          personDraft({ nachname: 'Musterfrau', weitereBeschaeftigung: true }),
          form,
          'person',
          personSealInput(),
        ),
      ).detail,
    ).toEqual(['geburtsdatum', 'steuerId', 'weitereArt']);
  });

  it('re-checks values that entered the draft without normalisation', () => {
    const q = personDraft();
    const draft = currentPart(q, 'person');
    if (!draft) throw new Error('no draft');
    const tampered: Questionnaire = {
      ...q,
      parts: { person: [{ ...draft, data: { ...draft.data, geburtsdatum: '17.05.1990' } }] },
    };
    expect(refused(sealPart(tampered, form, 'person', personSealInput()))).toEqual({
      code: 'invalidValue',
      detail: ['geburtsdatum'],
    });
  });

  describe('receipt notes of other parts', () => {
    const person = latestSealed(personSigned(), 'person');
    if (!person) throw new Error('no person part');
    const valid = receivedPartFor(
      person,
      { local: '2026-10-30T08:00:00+01:00', utc: '2026-10-30T07:00:00Z' },
      'file',
    );

    function employerSeal(receivedParts: ReceivedPart[]): Transition {
      let q = ok(startPart(personSigned(), form, 'arbeitgeber'));
      q = fill(q, 'arbeitgeber', { agNachname: 'X', eintritt: '1.1.2027', bruttoMonat: '1' });
      return sealPart(q, form, 'arbeitgeber', unsigned({ acknowledged: [], receivedParts }));
    }

    it('accepts a valid note', () => {
      expect(employerSeal([valid]).ok).toBe(true);
    });

    it.each<[string, ReceivedPart[]]>([
      ['own role', [{ ...valid, role: 'arbeitgeber' }]],
      ['unknown role', [{ ...valid, role: 'kanzlei' }]],
      ['twice', [valid, valid]],
      ['contradicting times', [{ ...valid, receivedAtLocal: '2026-10-30T08:00:00+02:00' }]],
      ['bad hash', [{ ...valid, contentHash: 'abc' }]],
    ])('refuses a note with %s', (_label, receivedParts) => {
      expect(refused(employerSeal(receivedParts)).code).toBe('invalidReceivedPart');
    });
  });
});

describe('receipts', () => {
  it('appends a receipt for present parts', () => {
    expect(twoRoles().receipts).toHaveLength(1);
  });

  it('refuses a receipt for a part that is not present', () => {
    const q = withEmployer(personSigned());
    const receipt = kanzleiReceipt(q);
    expect(
      refused(
        addReceipt(q, { ...receipt, parts: [{ role: 'person', contentHash: 'c'.repeat(64) }] }),
      ).code,
    ).toBe('unknownPart');
  });

  it.each([
    ['a broken time', { receivedAtUtc: '2.11.2026' }],
    ['contradicting times', { receivedAtLocal: '2026-11-02T09:00:00.000+02:00' }],
    ['an unknown source', { source: 'mail' }],
  ])('refuses a receipt with %s', (_label, change) => {
    const q = withEmployer(personSigned());
    expect(
      refused(addReceipt(q, { ...kanzleiReceipt(q), ...change } as unknown as Receipt)).code,
    ).toBe('invalidReceipt');
  });

  it('builds receipt notes only for sealed parts', () => {
    const draft = currentPart(personDraft(), 'person');
    if (!draft) throw new Error('no draft');
    expect(() =>
      receivedPartFor(
        draft,
        { local: '2026-10-30T08:00:00+01:00', utc: '2026-10-30T07:00:00Z' },
        'file',
      ),
    ).toThrow(RangeError);
  });
});
