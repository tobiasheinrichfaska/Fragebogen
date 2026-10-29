// The Sofortmeldung draft run through the engine: what is asked, the preselected questions, both
// notices, the guardian of a minor, both station orders (employer first or person first), the
// link between the parts, the name cross-check and the employer's master data. All data invented.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { missingRequired, visibleFields } from '../../src/logic/form';
import { applyMasterData, masterDataOf } from '../../src/logic/masterData';
import type { Questionnaire, ReceivedPart } from '../../src/logic/model';
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

const PERSON = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  geburtsort: 'Musterstadt',
  geburtsland: 'Deutschland',
  geschlecht: 'weiblich',
  staatsangehoerigkeit: 'deutsch',
  versicherungsnummer: '65 170590 M 520',
  strasse: 'Musterweg 1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

const EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '1234 5678',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
};

const BOTH_NOTICES = ['datenschutz', 'mitfuehrungspflicht'];

function fill(q: Questionnaire, role: string, values: Readonly<Record<string, unknown>>) {
  return Object.entries(values).reduce(
    (acc, [fieldId, raw]) => ok(setValue(acc, form, role, fieldId, raw)),
    q,
  );
}

const empty = () => createQuestionnaire(QUESTIONNAIRE_ID, form);

function draft(q: Questionnaire, role: string, values: Readonly<Record<string, unknown>>) {
  return fill(ok(startPart(q, form, role)), role, values);
}

function dataOf(q: Questionnaire, role: string) {
  const part = currentPart(q, role);
  if (!part) throw new Error(`${role} part missing`);
  return part.data;
}

function received(q: Questionnaire, role: string, local: string, utc: string): ReceivedPart[] {
  const part = latestSealed(q, role);
  if (!part) throw new Error(`${role} part missing`);
  return [receivedPartFor(part, { local, utc }, 'same-device')];
}

function personSigns(
  q: Questionnaire,
  values: Readonly<Record<string, unknown>> = PERSON,
  receivedParts: ReceivedPart[] = [],
): Questionnaire {
  return ok(
    sealPart(
      draft(q, 'person', values),
      form,
      'person',
      personSealInput({ acknowledged: BOTH_NOTICES, receivedParts }),
    ),
  );
}

function employerSeals(
  q: Questionnaire,
  values: Readonly<Record<string, unknown>> = EMPLOYER,
  receivedParts: ReceivedPart[] = [],
  at: [string, string] = ['2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z'],
): Questionnaire {
  return ok(
    sealPart(draft(q, 'arbeitgeber', values), form, 'arbeitgeber', {
      nonce: NONCE_EMPLOYER,
      systemNote: note(at[0], at[1], ['keyboard']),
      acknowledged: [],
      receivedParts,
    }),
  );
}

describe('Sofortmeldung draft — what is asked', () => {
  it('preselects "birth name = family name" and "address in Germany"', () => {
    const q = ok(startPart(empty(), form, 'person'));
    expect(dataOf(q, 'person')).toEqual({
      geburtsnameWieFamilienname: true,
      anschriftAusland: false,
    });
    const hidden = ['geburtsname', 'wohnstaat'];
    const visible = visibleFields(definition, 'person', dataOf(q, 'person')).map((f) => f.id);
    expect(visible.filter((id) => hidden.includes(id))).toEqual([]);
    const refused = setValue(q, form, 'person', 'geburtsname', 'Mustermann');
    expect(refused.ok ? 'accepted' : refused.code).toBe('fieldNotAvailable');
  });

  it('asks birth and address details always, even with a Versicherungsnummer', () => {
    const q = draft(empty(), 'person', {
      familienname: 'Musterfrau',
      vorname: 'Erika',
      geburtsdatum: '17.05.1990',
      staatsangehoerigkeit: 'deutsch',
      versicherungsnummer: '65 170590 M 520',
    });
    expect(missingRequired(definition, 'person', dataOf(q, 'person'))).toEqual([
      'geburtsort',
      'geburtsland',
      'geschlecht',
      'strasse',
      'postleitzahl',
      'wohnort',
    ]);
  });

  it('leaves the Versicherungsnummer optional', () => {
    const withoutNumber = Object.fromEntries(
      Object.entries(PERSON).filter(([id]) => id !== 'versicherungsnummer'),
    );
    const q = draft(empty(), 'person', withoutNumber);
    expect(missingRequired(definition, 'person', dataOf(q, 'person'))).toEqual([]);
  });

  it('requires the birth name once it differs, and the state for an address abroad', () => {
    const q = draft(empty(), 'person', {
      ...PERSON,
      geburtsnameWieFamilienname: false,
      anschriftAusland: true,
    });
    expect(missingRequired(definition, 'person', dataOf(q, 'person'))).toEqual([
      'geburtsname',
      'wohnstaat',
    ]);
  });

  it('rejects a Versicherungsnummer with a wrong check digit', () => {
    const refused = setValue(
      ok(startPart(empty(), form, 'person')),
      form,
      'person',
      'versicherungsnummer',
      '65170590M521',
    );
    expect(refused.ok ? 'accepted' : [refused.code, ...refused.detail]).toEqual([
      'invalidValue',
      'versicherungsnummer',
      'svNumber.checksum',
    ]);
  });

  it('cannot be signed without confirming both notices', () => {
    const refused = sealPart(draft(empty(), 'person', PERSON), form, 'person', personSealInput());
    expect(refused.ok ? 'accepted' : refused.code).toBe('noticeNotAcknowledged');
  });
});

describe('Sofortmeldung draft — station order', () => {
  it('employer first: the person signs over the employer part, nothing is missing', () => {
    const employer = employerSeals(
      empty(),
      EMPLOYER,
      [],
      ['2026-10-29T09:00:00.000+01:00', '2026-10-29T08:00:00.000Z'],
    );
    // The employer's file may go to the person although the person part is still missing.
    expect(transmissionBlockers(employer, form)).toEqual([]);
    const q = personSigns(
      employer,
      PERSON,
      received(
        employer,
        'arbeitgeber',
        '2026-10-29T09:05:00.000+01:00',
        '2026-10-29T08:05:00.000Z',
      ),
    );
    expect(completenessGaps(q, form)).toEqual([]);
    expect(contradictions(q, definition)).toEqual([]);
  });

  it('person first: the employer confirms the person part, nothing is missing', () => {
    const person = personSigns(empty());
    expect(transmissionBlockers(person, form)).toEqual([]);
    expect(completenessGaps(person, form).map((gap) => `${gap.code}@${gap.role ?? ''}`)).toEqual([
      'roleMissing@arbeitgeber',
    ]);
    const q = employerSeals(
      person,
      EMPLOYER,
      received(person, 'person', '2026-10-30T08:00:00.000+01:00', '2026-10-30T07:00:00.000Z'),
    );
    expect(completenessGaps(q, form)).toEqual([]);
    expect(latestSealed(q, 'arbeitgeber')?.data.agBetriebsnummer).toBe('12345678');
  });

  it('is incomplete while the parts do not reference each other', () => {
    const q = employerSeals(personSigns(empty()));
    expect(completenessGaps(q, form).map((gap) => gap.code)).toEqual(['partsNotLinked']);
  });

  it('reports different first names between person and employer', () => {
    const person = personSigns(empty());
    const q = employerSeals(
      person,
      { ...EMPLOYER, agVorname: 'Erica' },
      received(person, 'person', '2026-10-30T08:00:00.000+01:00', '2026-10-30T07:00:00.000Z'),
    );
    expect(contradictions(q, definition).map((c) => c.message)).toEqual([
      'Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.',
    ]);
  });

  it('needs the named guardian when the person is a minor on the day of signing', () => {
    const minor = personSigns(empty(), { ...PERSON, geburtsdatum: '01.03.2010' });
    expect(transmissionBlockers(minor, form).map((b) => b.code)).toEqual(['guardianMissing']);
    const signed = ok(
      sealPart(
        draft(minor, 'vertretung', { vertretungName: 'Max Musterfrau' }),
        form,
        'vertretung',
        {
          nonce: NONCE_GUARDIAN,
          systemNote: note('2026-10-29T10:20:00.000+01:00', '2026-10-29T09:20:00.000Z', ['touch']),
          acknowledged: [],
          signature: { method: 'drawn', strokes: STROKES },
          receivedParts: received(
            minor,
            'person',
            '2026-10-29T10:16:00.000+01:00',
            '2026-10-29T09:16:00.000Z',
          ),
        },
      ),
    );
    expect(transmissionBlockers(signed, form)).toEqual([]);
  });
});

describe('Sofortmeldung draft — employer master data', () => {
  it('remembers company name and Betriebsnummer, nothing about the person', () => {
    const q = draft(empty(), 'arbeitgeber', EMPLOYER);
    expect(masterDataOf(definition, 'arbeitgeber', dataOf(q, 'arbeitgeber'))).toEqual({
      firma: 'Beispiel Bau GmbH',
      betriebsnummer: '12345678',
    });
  });

  it('fills a new employer part and reports a remembered value in the wrong format', () => {
    const q = ok(startPart(empty(), form, 'arbeitgeber'));
    const result = applyMasterData(q, form, 'arbeitgeber', {
      firma: 'Beispiel Bau GmbH',
      betriebsnummer: '1234567',
    });
    if (!result.ok) throw new Error(result.code);
    expect(result.applied).toEqual(['agFirma']);
    expect(result.skipped).toEqual([
      {
        fieldId: 'agBetriebsnummer',
        key: 'betriebsnummer',
        code: 'invalidValue',
        detail: ['agBetriebsnummer', 'betriebsnummer.format'],
      },
    ]);
  });
});
