// The Sofortmeldung draft run through the engine: what is asked with and without a
// Versicherungsnummer, both notices, the guardian of a minor, the employer's part and the
// cross-check of the names. All data is invented.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { missingRequired, visibleFields } from '../../src/logic/form';
import type { Questionnaire } from '../../src/logic/model';
import {
  createQuestionnaire,
  currentPart,
  latestSealed,
  receivedPartFor,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import {
  FILE_SHA256,
  NONCE_EMPLOYER,
  NONCE_GUARDIAN,
  QUESTIONNAIRE_ID,
  STROKES,
  note,
  ok,
  personSealInput,
} from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '1.0.0.json')));
const { definition } = form;

const ADULT = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  staatsangehoerigkeit: 'deutsch',
  versicherungsnummer: '65 170590 M 520',
};

const WITHOUT_NUMBER = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  staatsangehoerigkeit: 'deutsch',
};

const BIRTH_AND_ADDRESS = {
  geschlecht: 'weiblich',
  geburtsort: 'Musterstadt',
  geburtsland: 'Deutschland',
  strasse: 'Musterweg 1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

function fill(q: Questionnaire, role: string, values: Readonly<Record<string, unknown>>) {
  return Object.entries(values).reduce(
    (acc, [fieldId, raw]) => ok(setValue(acc, form, role, fieldId, raw)),
    q,
  );
}

function personDraft(values: Readonly<Record<string, unknown>>): Questionnaire {
  const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
  return fill(q, 'person', values);
}

function dataOf(q: Questionnaire, role: string) {
  const part = currentPart(q, role);
  if (!part) throw new Error(`${role} part missing`);
  return part.data;
}

const BOTH_NOTICES = ['datenschutz', 'mitfuehrungspflicht'];

function personSigned(values: Readonly<Record<string, unknown>> = ADULT): Questionnaire {
  return ok(
    sealPart(personDraft(values), form, 'person', personSealInput({ acknowledged: BOTH_NOTICES })),
  );
}

function withEmployer(q: Questionnaire, agVorname = 'Erika'): Questionnaire {
  const person = latestSealed(q, 'person');
  if (!person) throw new Error('person part missing');
  const draft = fill(ok(startPart(q, form, 'arbeitgeber')), 'arbeitgeber', {
    agFirma: 'Beispiel Bau GmbH',
    agBetriebsnummer: '1234 5678',
    agFamilienname: 'Musterfrau',
    agVorname,
    agBeschaeftigungsbeginn: '02.11.2026',
  });
  return ok(
    sealPart(draft, form, 'arbeitgeber', {
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

describe('Sofortmeldung draft', () => {
  it('asks nothing about birth place and address when the Versicherungsnummer is given', () => {
    const q = personDraft(ADULT);
    expect(missingRequired(definition, 'person', dataOf(q, 'person'))).toEqual([]);
    expect(visibleFields(definition, 'person', dataOf(q, 'person')).map((f) => f.id)).toEqual([
      'familienname',
      'vorname',
      'geburtsdatum',
      'staatsangehoerigkeit',
      'versicherungsnummer',
    ]);
    const refused = setValue(q, form, 'person', 'strasse', 'Musterweg 1');
    expect(refused.ok ? 'accepted' : refused.code).toBe('fieldNotAvailable');
  });

  it('requires birth and address details without a Versicherungsnummer', () => {
    const q = personDraft(WITHOUT_NUMBER);
    expect(missingRequired(definition, 'person', dataOf(q, 'person'))).toEqual([
      'geschlecht',
      'geburtsort',
      'geburtsland',
      'strasse',
      'postleitzahl',
      'wohnort',
    ]);
    const complete = fill(q, 'person', BIRTH_AND_ADDRESS);
    expect(missingRequired(definition, 'person', dataOf(complete, 'person'))).toEqual([]);
  });

  it('rejects a Versicherungsnummer with a wrong check digit', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    const refused = setValue(q, form, 'person', 'versicherungsnummer', '65170590M521');
    expect(refused.ok ? 'accepted' : [refused.code, ...refused.detail]).toEqual([
      'invalidValue',
      'versicherungsnummer',
      'svNumber.checksum',
    ]);
  });

  it('cannot be signed without confirming both notices', () => {
    const refused = sealPart(personDraft(ADULT), form, 'person', personSealInput());
    expect(refused.ok ? 'accepted' : refused.code).toBe('noticeNotAcknowledged');
  });

  it('lets an adult pass it on after signing; the employer part is a gap until it arrives', () => {
    const q = personSigned();
    expect(transmissionBlockers(q, form)).toEqual([]);
    expect(completenessGaps(q, form).map((gap) => `${gap.code}@${gap.role ?? ''}`)).toEqual([
      'roleMissing@arbeitgeber',
    ]);
  });

  it('is complete and consistent once the employer has sealed its part', () => {
    const q = withEmployer(personSigned());
    expect(transmissionBlockers(q, form)).toEqual([]);
    expect(completenessGaps(q, form)).toEqual([]);
    expect(contradictions(q, definition)).toEqual([]);
    expect(latestSealed(q, 'arbeitgeber')?.data.agBetriebsnummer).toBe('12345678');
  });

  it('reports different first names between person and employer', () => {
    const q = withEmployer(personSigned(), 'Erica');
    expect(contradictions(q, definition).map((c) => c.message)).toEqual([
      'Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.',
    ]);
  });

  it('needs the named guardian when the person is a minor on the day of signing', () => {
    const minor = personSigned({ ...ADULT, geburtsdatum: '01.03.2010' });
    expect(transmissionBlockers(minor, form).map((b) => b.code)).toEqual(['guardianMissing']);

    const person = latestSealed(minor, 'person');
    if (!person) throw new Error('person part missing');
    const draft = fill(ok(startPart(minor, form, 'vertretung')), 'vertretung', {
      vertretungName: 'Max Musterfrau',
    });
    const signed = ok(
      sealPart(draft, form, 'vertretung', {
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
    expect(transmissionBlockers(signed, form)).toEqual([]);
  });
});
