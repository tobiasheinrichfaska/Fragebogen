// The Sofortmeldung draft run through the engine: what is asked, the preselected questions, both
// notices, the guardian of a minor, both station orders (employer first or person first), the
// link between the parts, the name cross-check and the employer's master data. All data invented.
import { join } from 'node:path';
import { contradictions } from '../../src/logic/consistency';
import { missingRequired, visibleFields } from '../../src/logic/form';
import { interviewSteps, interviewSummary, stepAfter } from '../../src/logic/interview';
import { applyMasterData, masterDataOf } from '../../src/logic/masterData';
import { masterDataFragment, parseMasterDataFragment } from '../../src/logic/masterDataLink';
import type { Questionnaire, ReceivedPart } from '../../src/logic/model';
import {
  createQuestionnaire,
  currentPart,
  deferQuestion,
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

  it('carries company name and Betriebsnummer through a bookmark link into a new questionnaire', () => {
    const link = masterDataFragment(
      masterDataOf(
        definition,
        'arbeitgeber',
        dataOf(draft(empty(), 'arbeitgeber', EMPLOYER), 'arbeitgeber'),
      ),
    );
    if (!link.ok) throw new Error(link.issue);
    expect(link.fragment).toBe('#stammdaten=1&betriebsnummer=12345678&firma=Beispiel+Bau+GmbH');
    const parsed = parseMasterDataFragment(link.fragment);
    if (!parsed.ok || !parsed.data) throw new Error('no master data');
    const result = applyMasterData(
      ok(startPart(empty(), form, 'arbeitgeber')),
      form,
      'arbeitgeber',
      parsed.data,
    );
    if (!result.ok) throw new Error(result.code);
    expect([result.applied, result.skipped]).toEqual([['agFirma', 'agBetriebsnummer'], []]);
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

describe('Sofortmeldung draft — interview', () => {
  it('starts with both notices for the person and asks the birth name right after its question', () => {
    let q = ok(startPart(empty(), form, 'person'));
    q = ok(setValue(q, form, 'person', 'geburtsnameWieFamilienname', false));
    const steps = interviewSteps(definition, 'person', dataOfPart(q, 'person'));
    expect(steps.slice(0, 2).map((step) => step.key)).toEqual([
      'notice:datenschutz',
      'notice:mitfuehrungspflicht',
    ]);
    expect(stepAfter(steps, 'question:geburtsnameWieFamilienname')).toMatchObject({
      key: 'question:geburtsname',
      level: 1,
    });
  });

  it('asks the employer its own questions only, without notices', () => {
    const steps = interviewSteps(
      definition,
      'arbeitgeber',
      dataOfPart(ok(startPart(empty(), form, 'arbeitgeber')), 'arbeitgeber'),
    );
    expect(steps.map((step) => step.key)).toEqual([
      'question:agFirma',
      'question:agBetriebsnummer',
      'question:agFamilienname',
      'question:agVorname',
      'question:agPersonalnummer',
      'question:agBeschaeftigungsbeginn',
      'summary',
    ]);
  });

  it('keeps a birth name typed before switching back to "gleich", and does not sign it', () => {
    let q = draft(empty(), 'person', { ...PERSON, geburtsnameWieFamilienname: false });
    q = ok(setValue(q, form, 'person', 'geburtsname', 'Mustermann'));
    q = ok(setValue(q, form, 'person', 'geburtsnameWieFamilienname', true));
    const summary = interviewSummary(definition, 'person', dataOfPart(q, 'person'), BOTH_NOTICES);
    expect(summary.inactive.map((entry) => entry.fieldId)).toEqual(['geburtsname']);
    expect(summary.readyToSign).toBe(true);
    const signed = ok(sealPart(q, form, 'person', personSealInput({ acknowledged: BOTH_NOTICES })));
    expect(latestSealed(signed, 'person')?.data).not.toHaveProperty('geburtsname');
  });

  it('lets the person skip the Versicherungsnummer with "Weiß ich gerade nicht" and still sign', () => {
    const withoutNumber = Object.fromEntries(
      Object.entries(PERSON).filter(([id]) => id !== 'versicherungsnummer'),
    );
    let q = draft(empty(), 'person', withoutNumber);
    q = ok(deferQuestion(q, form, 'person', 'versicherungsnummer'));
    expect(
      interviewSummary(definition, 'person', dataOfPart(q, 'person'), BOTH_NOTICES),
    ).toMatchObject({ deferred: ['versicherungsnummer'], readyToSign: true });
  });
});

function dataOfPart(q: Questionnaire, role: string) {
  const part = currentPart(q, role);
  if (!part) throw new Error(`${role} part missing`);
  return part;
}
