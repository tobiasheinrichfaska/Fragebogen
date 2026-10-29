import {
  MINOR_VALUES,
  NONCE_GUARDIAN,
  QUESTIONNAIRE_ID,
  STROKES,
  beispielForm,
  fill,
  guardianForm,
  minorSigned,
  note,
  ok,
  personSealInput,
} from '../../tests/support/sample';
import type { RegisteredForm } from './formRegistry';
import type { Questionnaire, ReceivedPart } from './model';
import {
  createQuestionnaire,
  latestSealed,
  receivedPartFor,
  sealPart,
  startPart,
  type SealInput,
  type SignatureInput,
  type Transition,
} from './questionnaire';
import { encodeStrokes } from './strokes';

const RECEIVED_AT = { local: '2026-10-29T10:16:00.000+01:00', utc: '2026-10-29T09:16:00.000Z' };

function personPart(q: Questionnaire) {
  const part = latestSealed(q, 'person');
  if (!part) throw new Error('no person part');
  return part;
}

function guardianInput(
  q: Questionnaire,
  signature: SignatureInput = { method: 'drawn', strokes: STROKES },
  receivedParts: ReceivedPart[] = [receivedPartFor(personPart(q), RECEIVED_AT, 'same-device')],
): SealInput {
  return {
    nonce: NONCE_GUARDIAN,
    systemNote: note('2026-10-29T10:20:00.000+01:00', '2026-10-29T09:20:00.000Z', ['touch']),
    acknowledged: [],
    signature,
    receivedParts,
  };
}

function guardianSeal(
  q: Questionnaire,
  form: RegisteredForm,
  values: Record<string, unknown>,
  input: (q: Questionnaire) => SealInput = guardianInput,
): Transition {
  const draft = fill(ok(startPart(q, form, 'vertretung')), 'vertretung', values, form);
  return sealPart(draft, form, 'vertretung', input(q));
}

function refusal(transition: Transition) {
  if (transition.ok) throw new Error('expected a refusal');
  return { code: transition.code, detail: transition.detail };
}

describe('sealing the guardian part', () => {
  const form = guardianForm();

  it('records name, signature and the binding to the person part', () => {
    const q = ok(guardianSeal(minorSigned(), form, { vertretungName: 'Max Musterfrau' }));
    const guardian = latestSealed(q, 'vertretung');
    expect(guardian?.status).toBe('signed');
    expect(guardian?.data).toEqual({ vertretungName: 'Max Musterfrau' });
    expect(guardian?.seal?.payload.receivedParts).toEqual([
      expect.objectContaining({
        role: 'person',
        contentHash: personPart(q).seal?.contentHash,
        source: 'same-device',
      }),
    ]);
  });

  it('refuses without the name', () => {
    expect(refusal(guardianSeal(minorSigned(), form, {}))).toEqual({
      code: 'missingRequired',
      detail: ['vertretungName'],
    });
  });

  it('refuses without a signature', () => {
    const transition = guardianSeal(
      minorSigned(),
      form,
      { vertretungName: 'Max Musterfrau' },
      (q) => {
        const input = guardianInput(q);
        delete input.signature;
        return input;
      },
    );
    expect(refusal(transition).code).toBe('signatureRequired');
  });

  it('refuses when it does not bind the person part', () => {
    const transition = guardianSeal(
      minorSigned(),
      form,
      { vertretungName: 'Max Musterfrau' },
      (q) => guardianInput(q, undefined, []),
    );
    expect(refusal(transition)).toEqual({ code: 'mustBindPart', detail: ['person'] });
  });

  it('refuses before the person has signed', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    q = fill(q, 'person', MINOR_VALUES, form);
    const fake: ReceivedPart = {
      role: 'person',
      contentHash: 'e'.repeat(64),
      receivedAtLocal: RECEIVED_AT.local,
      receivedAtUtc: RECEIVED_AT.utc,
      source: 'same-device',
    };
    const draft = fill(
      ok(startPart(q, form, 'vertretung')),
      'vertretung',
      { vertretungName: 'Max Musterfrau' },
      form,
    );
    expect(
      refusal(sealPart(draft, form, 'vertretung', guardianInput(q, undefined, [fake]))).code,
    ).toBe('mustBindPart');
  });

  it('warns when a typed name differs from the stated name, not when only the case differs', () => {
    const differs = guardianSeal(minorSigned(), form, { vertretungName: 'Max Musterfrau' }, (q) =>
      guardianInput(q, { method: 'typed', name: 'Erika Beispiel' }),
    );
    expect(differs.ok && differs.warnings).toEqual(['signature.nameMismatch']);
    const sameName = guardianSeal(minorSigned(), form, { vertretungName: 'Max Musterfrau' }, (q) =>
      guardianInput(q, { method: 'typed', name: 'max MUSTERFRAU' }),
    );
    expect(sameName.ok && sameName.warnings).toEqual([]);
  });

  describe('on a form without a name field (1.0.0)', () => {
    const plain = beispielForm();
    const minor = () => minorSigned(plain);

    it('refuses a drawn signature, because no name would be recorded', () => {
      expect(refusal(guardianSeal(minor(), plain, {})).code).toBe('signerNameMissing');
    });

    it('accepts a typed name as the name', () => {
      const transition = guardianSeal(minor(), plain, {}, (q) =>
        guardianInput(q, { method: 'typed', name: 'Max Musterfrau' }),
      );
      expect(transition.ok).toBe(true);
    });
  });
});

describe('signature plausibility', () => {
  const form = beispielForm();
  const draft = () =>
    fill(
      ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person')),
      'person',
      MINOR_VALUES,
      form,
    );

  it.each<[string, SignatureInput]>([
    ['a tap (one point)', { method: 'drawn', strokes: encodeStrokes([[{ x: 500, y: 200 }]]) }],
    [
      'a short tick (few points)',
      {
        method: 'drawn',
        strokes: encodeStrokes([
          [
            { x: 1, y: 1 },
            { x: 60, y: 2 },
            { x: 90, y: 3 },
          ],
        ]),
      },
    ],
    [
      'a narrow scribble',
      {
        method: 'drawn',
        strokes: encodeStrokes([
          Array.from({ length: 20 }, (_, i) => ({ x: 500 + (i % 3), y: 100 + i })),
        ]),
      },
    ],
    ['a single typed letter', { method: 'typed', name: 'X' }],
    ['typed digits', { method: 'typed', name: '1 2 3' }],
  ])('refuses %s as signature', (_label, signature) => {
    const result = refusal(sealPart(draft(), form, 'person', personSealInput({ signature })));
    expect(result.code).toBe('invalidSignature');
    expect(result.detail[0]).toMatch(/^[A-ZÄÖÜ].*\.$/);
  });

  it('accepts a short but real name', () => {
    expect(
      sealPart(
        draft(),
        form,
        'person',
        personSealInput({ signature: { method: 'typed', name: 'Li' } }),
      ).ok,
    ).toBe(true);
  });
});
