// The device session (src/logic/session.ts) driven through the Sofortmeldung 0.1.0 the way the UI
// drives it: role choice, interview steps, notices, sealing with receipt notes, reopening, new
// versions, files and master data. All data invented.
import { join } from 'node:path';
import { completenessGaps, transmissionBlockers } from '../../src/logic/requirements';
import { latestSealed } from '../../src/logic/questionnaire';
import {
  acknowledge,
  answer,
  currentStep,
  enterRole,
  fillMasterData,
  goTo,
  nextStep,
  previousStep,
  reopen,
  roleStates,
  seal,
  sessionFromFile,
  startNewVersion,
  startSession,
  summaryOf,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import {
  NONCE_EMPLOYER,
  NONCE_GUARDIAN,
  NONCE_PERSON,
  QUESTIONNAIRE_ID,
  STROKES,
  note,
} from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.1.0.json')));

const PERSON = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsdatum: '17.05.1990',
  geburtsort: 'Musterstadt',
  geburtsland: 'Deutschland',
  geschlecht: 'weiblich',
  staatsangehoerigkeit: 'deutsch',
  strasse: 'Musterweg 1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

const EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345678',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
};

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}

function fill(session: Session, values: Readonly<Record<string, unknown>>): Session {
  return Object.entries(values).reduce((s, [id, raw]) => must(answer(s, id, raw)), session);
}

const at = (local: string, utc: string) => ({ local, utc });
const T_EMPLOYER = at('2026-10-30T08:30:00.000+01:00', '2026-10-30T07:30:00.000Z');
const T_PERSON = at('2026-10-30T09:00:00.000+01:00', '2026-10-30T08:00:00.000Z');

function employerSeals(session: Session): Session {
  let s = fill(must(enterRole(session, 'arbeitgeber')), EMPLOYER);
  s = must(
    seal(s, {
      nonce: NONCE_EMPLOYER,
      systemNote: note(T_EMPLOYER.local, T_EMPLOYER.utc, ['keyboard']),
      now: T_EMPLOYER,
    }),
  );
  return s;
}

function personSigns(
  session: Session,
  values: Readonly<Record<string, unknown>> = PERSON,
): Session {
  let s = fill(must(enterRole(session, 'person')), values);
  s = acknowledge(acknowledge(s, 'datenschutz', true), 'mitfuehrungspflicht', true);
  return must(
    seal(s, {
      nonce: NONCE_PERSON,
      systemNote: note(T_PERSON.local, T_PERSON.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: T_PERSON,
    }),
  );
}

const fresh = () => startSession(form, QUESTIONNAIRE_ID);

describe('session — Sofortmeldung on one device', () => {
  it('employer first, then the person: linked, complete, nothing blocks', () => {
    const s = personSigns(employerSeals(fresh()));
    const person = latestSealed(s.questionnaire, 'person');
    const employer = latestSealed(s.questionnaire, 'arbeitgeber');
    expect(person?.seal?.payload.receivedParts).toEqual([
      {
        role: 'arbeitgeber',
        contentHash: employer?.seal?.contentHash,
        receivedAtLocal: T_EMPLOYER.local,
        receivedAtUtc: T_EMPLOYER.utc,
        source: 'same-device',
      },
    ]);
    expect(transmissionBlockers(s.questionnaire, form)).toEqual([]);
    expect(completenessGaps(s.questionnaire, form)).toEqual([]);
    expect(s.role).toBeUndefined();
    expect(s.dirty).toBe(true);
  });

  it('starts a fresh part with the notices, then the first question', () => {
    let s = must(enterRole(fresh(), 'person'));
    expect(currentStep(s)?.key).toBe('notice:datenschutz');
    s = nextStep(nextStep(s));
    expect(currentStep(s)?.key).toBe('question:familienname');
    expect(currentStep(previousStep(s))?.key).toBe('notice:mitfuehrungspflicht');
    expect(currentStep(goTo(s, 'summary'))?.kind).toBe('summary');
  });

  it('continues a draft at its first open question', () => {
    let s = fill(must(enterRole(fresh(), 'person')), { familienname: 'Musterfrau' });
    s = must(enterRole({ ...s, stepKey: 'summary' }, 'person'));
    expect(s.stepKey).toBe('question:vorname');
  });

  it('cannot sign before both notices are confirmed, and names what is missing', () => {
    let s = fill(must(enterRole(fresh(), 'person')), PERSON);
    s = acknowledge(s, 'datenschutz', true);
    expect(summaryOf(s)).toMatchObject({
      missingNotices: ['mitfuehrungspflicht'],
      readyToSign: false,
    });
    const refused = seal(s, {
      nonce: NONCE_PERSON,
      systemNote: note(T_PERSON.local, T_PERSON.utc),
      signature: { method: 'drawn', strokes: STROKES },
      now: T_PERSON,
    });
    expect(refused).toMatchObject({
      ok: false,
      message: 'Es wurden nicht alle Hinweise zur Kenntnis genommen.',
    });
    expect(summaryOf(acknowledge(s, 'datenschutz', false))?.missingNotices).toEqual([
      'datenschutz',
      'mitfuehrungspflicht',
    ]);
  });

  it('reports invalid input in German with the field label', () => {
    const s = must(enterRole(fresh(), 'person'));
    expect(answer(s, 'versicherungsnummer', '65170590M521')).toEqual({
      ok: false,
      message: 'Die Versicherungsnummer stimmt nicht (Prüfziffer).',
      detail: ['Versicherungsnummer der Rentenversicherung (falls bekannt)'],
    });
  });

  it('refuses to re-enter a sealed part; reopening works only before it is passed on', () => {
    let s = personSigns(fresh());
    expect(enterRole(s, 'person')).toMatchObject({ ok: false });
    expect(roleStates(s).find((r) => r.role.id === 'person')).toMatchObject({
      state: 'signed',
      canReopen: true,
    });
    const reopened = must(reopen(s, 'person'));
    expect(reopened.role).toBe('person');
    expect(roleStates(reopened).find((r) => r.role.id === 'person')?.state).toBe('draft');

    s = employerSeals(s);
    expect(roleStates(s).find((r) => r.role.id === 'person')?.canReopen).toBe(false);
    expect(reopen(s, 'person')).toMatchObject({ ok: false });
    const second = must(startNewVersion(s, 'person'));
    expect(second.stepKey).toBe('summary');
  });

  it('shows the guardian as required once a minor has signed, and the guardian binds the person', () => {
    let s = personSigns(fresh(), { ...PERSON, geburtsdatum: '01.03.2010' });
    expect(roleStates(s).find((r) => r.role.id === 'vertretung')?.requirement).toMatchObject({
      required: true,
      reason: 'minor',
    });
    expect(transmissionBlockers(s.questionnaire, form).map((b) => b.code)).toEqual([
      'guardianMissing',
    ]);
    s = fill(must(enterRole(s, 'vertretung')), { vertretungName: 'Max Musterfrau' });
    const later = at('2026-10-30T09:05:00.000+01:00', '2026-10-30T08:05:00.000Z');
    s = must(
      seal(s, {
        nonce: NONCE_GUARDIAN,
        systemNote: note(later.local, later.utc, ['touch']),
        signature: { method: 'drawn', strokes: STROKES },
        now: later,
      }),
    );
    expect(transmissionBlockers(s.questionnaire, form)).toEqual([]);
  });

  it('records the file of an imported part in the next receipt note', () => {
    const imported = personSigns(fresh());
    const file = {
      local: '2026-10-30T10:00:00.000+01:00',
      utc: '2026-10-30T09:00:00.000Z',
      source: 'file' as const,
      fileSha256: 'c'.repeat(64),
    };
    let s = sessionFromFile(
      { questionnaire: imported.questionnaire, form, origin: 'published' },
      file,
    );
    expect(s.dirty).toBe(false);
    const later = at('2026-10-30T10:30:00.000+01:00', '2026-10-30T09:30:00.000Z');
    s = fill(must(enterRole(s, 'arbeitgeber')), EMPLOYER);
    s = must(
      seal(s, { nonce: NONCE_EMPLOYER, systemNote: note(later.local, later.utc), now: later }),
    );
    expect(
      latestSealed(s.questionnaire, 'arbeitgeber')?.seal?.payload.receivedParts[0],
    ).toMatchObject({
      role: 'person',
      source: 'file',
      fileSha256: 'c'.repeat(64),
      receivedAtLocal: file.local,
    });
    expect(completenessGaps(s.questionnaire, form)).toEqual([]);
  });

  it('fills the employer master data from the bookmark link', () => {
    const s = must(enterRole(fresh(), 'arbeitgeber'));
    const result = fillMasterData(s, { firma: 'Beispiel Bau GmbH', betriebsnummer: '1234 5678' });
    expect(result).toMatchObject({
      ok: true,
      applied: ['agFirma', 'agBetriebsnummer'],
      skipped: [],
    });
    expect(fillMasterData(fresh(), {})).toEqual({ ok: false });
  });

  it('keeps confirmations per role, sorted and without duplicates', () => {
    let s = must(enterRole(fresh(), 'person'));
    s = acknowledge(
      acknowledge(acknowledge(s, 'mitfuehrungspflicht', true), 'datenschutz', true),
      'datenschutz',
      true,
    );
    expect(s.acknowledged).toEqual({ person: ['datenschutz', 'mitfuehrungspflicht'] });
  });
});
