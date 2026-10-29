// Shared test scenarios on the fictitious fixture form "beispiel": the person signs, the employer
// seals with a receipt note for the person's part, the Kanzlei records the DATEV filing; version
// 1.1.0 adds a name field for the legal guardian of a minor. All data is invented. The golden files
// under tests/golden are built from these functions — changing a builder breaks them on purpose.
import beispiel from '../fixtures/forms/beispiel/1.0.0.json';
import beispiel110 from '../fixtures/forms/beispiel/1.1.0.json';
import { parseFormDefinition } from '../../src/logic/formDefinition';
import {
  buildFormRegistry,
  definitionHash,
  type FormRegistry,
  type RegisteredForm,
} from '../../src/logic/formRegistry';
import type { Questionnaire, Receipt, SystemNote } from '../../src/logic/model';
import {
  addReceipt,
  createQuestionnaire,
  latestSealed,
  receivedPartFor,
  sealPart,
  setValue,
  startPart,
  type SealInput,
  type Transition,
} from '../../src/logic/questionnaire';
import { encodeStrokes } from '../../src/logic/strokes';

export const QUESTIONNAIRE_ID = '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c';
export const NONCE_PERSON = '0123456789abcdef0123456789abcdef';
export const NONCE_PERSON_V2 = '00112233445566778899aabbccddeeff';
export const NONCE_EMPLOYER = 'fedcba9876543210fedcba9876543210';
export const NONCE_GUARDIAN = '13579bdf02468ace13579bdf02468ace';
export const FILE_SHA256 = 'a'.repeat(64);

export const STROKES = encodeStrokes([
  [
    { x: 100, y: 200 },
    { x: 112, y: 188 },
    { x: 130, y: 181 },
    { x: 151, y: 190 },
  ],
  [
    { x: 300, y: 210 },
    { x: 306, y: 204 },
  ],
]);

function registered(raw: unknown): RegisteredForm {
  const parsed = parseFormDefinition(structuredClone(raw));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  return { definition: parsed.definition, definitionHash: definitionHash(parsed.definition) };
}

/** Fixture form 1.0.0: the guardian has no fields and can only sign with a typed name. */
export function beispielForm(): RegisteredForm {
  return registered(beispiel);
}

/** Fixture form 1.1.0: the guardian states the name in the field vertretungName. */
export function guardianForm(): RegisteredForm {
  return registered(beispiel110);
}

export function beispielRegistry(): FormRegistry {
  const result = buildFormRegistry(
    [
      { name: 'tests/fixtures/forms/beispiel/1.0.0.json', raw: structuredClone(beispiel) },
      { name: 'tests/fixtures/forms/beispiel/1.1.0.json', raw: structuredClone(beispiel110) },
    ],
    [beispielForm(), guardianForm()].map(({ definition, definitionHash }) => ({
      id: definition.id,
      version: definition.version,
      definitionHash,
    })),
  );
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.registry;
}

export function note(
  local: string,
  utc: string,
  inputTypes: SystemNote['inputTypes'] = ['mouse'],
): SystemNote {
  return {
    signedAtLocal: local,
    timeZone: 'Europe/Berlin',
    signedAtUtc: utc,
    os: 'Windows',
    browser: 'Edge',
    browserVersion: '141',
    uaSource: 'ua-ch',
    language: 'de-DE',
    inputTypes,
    appVersion: '0.1.0',
  };
}

export function ok(transition: Transition): Questionnaire {
  if (!transition.ok) throw new Error(`${transition.code}: ${transition.detail.join('; ')}`);
  return transition.questionnaire;
}

export function fill(
  questionnaire: Questionnaire,
  role: string,
  values: Readonly<Record<string, unknown>>,
  form = beispielForm(),
): Questionnaire {
  return Object.entries(values).reduce(
    (q, [fieldId, raw]) => ok(setValue(q, form, role, fieldId, raw)),
    questionnaire,
  );
}

export const PERSON_VALUES = {
  nachname: '  Musterfrau ',
  geburtsdatum: '17.05.1990',
  steuerId: '86 095 742 719',
  weitereBeschaeftigung: true,
  weitereArt: 'minijob',
  bemerkungen: 'Erste Zeile\r\nZweite Zeile',
};

export function personSealInput(overrides: Partial<SealInput> = {}): SealInput {
  return {
    nonce: NONCE_PERSON,
    systemNote: note('2026-10-29T10:15:00.000+01:00', '2026-10-29T09:15:00.000Z'),
    acknowledged: ['datenschutz'],
    signature: { method: 'drawn', strokes: STROKES },
    ...overrides,
  };
}

/** Questionnaire with the person's part signed (drawn signature). */
export function personSigned(form = beispielForm()): Questionnaire {
  let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
  q = ok(startPart(q, form, 'person'));
  q = fill(q, 'person', PERSON_VALUES, form);
  return ok(sealPart(q, form, 'person', personSealInput()));
}

/** Adds the employer's part: sealed without signature, chaining the person's part it received. */
export function withEmployer(questionnaire: Questionnaire, form = beispielForm()): Questionnaire {
  const person = latestSealed(questionnaire, 'person');
  if (!person) throw new Error('person part missing');
  let q = ok(startPart(questionnaire, form, 'arbeitgeber'));
  q = fill(
    q,
    'arbeitgeber',
    { agNachname: 'Musterfrau', eintritt: '01.11.2026', bruttoMonat: '2.450,00' },
    form,
  );
  return ok(
    sealPart(q, form, 'arbeitgeber', {
      nonce: NONCE_EMPLOYER,
      systemNote: note('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z', ['keyboard']),
      acknowledged: [],
      receivedParts: [
        receivedPartFor(
          person,
          { local: '2026-10-30T08:00:00.000+01:00', utc: '2026-10-30T07:00:00.000Z' },
          'file',
          FILE_SHA256,
        ),
      ],
    }),
  );
}

export function kanzleiReceipt(questionnaire: Questionnaire): Receipt {
  const parts = Object.keys(questionnaire.parts).flatMap((role) => {
    const part = latestSealed(questionnaire, role);
    return part?.seal ? [{ role, contentHash: part.seal.contentHash }] : [];
  });
  return {
    station: 'Kanzlei',
    receivedAtLocal: '2026-11-02T09:00:00.000+01:00',
    receivedAtUtc: '2026-11-02T08:00:00.000Z',
    timeZone: 'Europe/Berlin',
    source: 'datev',
    fileName: `${QUESTIONNAIRE_ID}.pdf`,
    fileSha256: 'b'.repeat(64),
    parts,
    appVersion: '0.1.0',
  };
}

/** The full clean scenario: person signed, employer sealed, Kanzlei receipt. */
export function twoRoles(): Questionnaire {
  const q = withEmployer(personSigned());
  return ok(addReceipt(q, kanzleiReceipt(q)));
}

/** Person signs (typed), employer chains that version, then the person re-signs a second version. */
export function newVersion(): Questionnaire {
  const form = beispielForm();
  let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
  q = ok(startPart(q, form, 'person'));
  q = fill(q, 'person', PERSON_VALUES, form);
  q = ok(
    sealPart(
      q,
      form,
      'person',
      personSealInput({ signature: { method: 'typed', name: ' Erika  Musterfrau ' } }),
    ),
  );
  q = withEmployer(q, form);
  q = ok(startPart(q, form, 'person'));
  q = fill(q, 'person', { bemerkungen: 'Korrigierte Bemerkung' }, form);
  return ok(
    sealPart(
      q,
      form,
      'person',
      personSealInput({
        nonce: NONCE_PERSON_V2,
        systemNote: note('2026-10-31T11:00:00.000+01:00', '2026-10-31T10:00:00.000Z', ['touch']),
      }),
    ),
  );
}

export const MINOR_VALUES = { ...PERSON_VALUES, geburtsdatum: '01.03.2010' };

/** A 16-year-old signs on 29.10.2026 (device date); the guardian has not signed yet. */
export function minorSigned(form = guardianForm()): Questionnaire {
  let q = createQuestionnaire(QUESTIONNAIRE_ID, form);
  q = ok(startPart(q, form, 'person'));
  q = fill(q, 'person', MINOR_VALUES, form);
  return ok(sealPart(q, form, 'person', personSealInput()));
}

/** The guardian signs on the same device, five minutes later, binding the person's part. */
export function withGuardian(questionnaire: Questionnaire, form = guardianForm()): Questionnaire {
  const person = latestSealed(questionnaire, 'person');
  if (!person) throw new Error('person part missing');
  let q = ok(startPart(questionnaire, form, 'vertretung'));
  q = fill(q, 'vertretung', { vertretungName: 'Max Musterfrau' }, form);
  return ok(
    sealPart(q, form, 'vertretung', {
      nonce: NONCE_GUARDIAN,
      systemNote: note('2026-10-29T10:20:00.000+01:00', '2026-10-29T09:20:00.000Z', ['touch']),
      acknowledged: [],
      signature: { method: 'drawn', strokes: STROKES },
      receivedParts: [
        receivedPartFor(
          person,
          { local: '2026-10-29T10:16:00.000+01:00', utc: '2026-10-29T09:16:00.000Z' },
          'same-device',
        ),
      ],
    }),
  );
}

/** Minor with the guardian's signature — ready to be passed on. */
export function minorWithGuardian(): Questionnaire {
  return withGuardian(minorSigned());
}
