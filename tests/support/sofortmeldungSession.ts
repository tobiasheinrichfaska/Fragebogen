// A completed Sofortmeldung 0.1.0 played through the device session (employer first, then the
// person with a drawn signature) — fictitious data, shared by the PDF tests.
import { join } from 'node:path';
import {
  acknowledge,
  answer,
  enterRole,
  seal,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { FORMS_DIR, readJson, registeredFrom } from './formFiles';
import { NONCE_EMPLOYER, NONCE_PERSON, QUESTIONNAIRE_ID, STROKES, note } from './sample';

export const sofortmeldung = registeredFrom(
  readJson(join(FORMS_DIR, 'sofortmeldung', '0.1.0.json')),
);

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

const fill = (session: Session, values: Readonly<Record<string, unknown>>) =>
  Object.entries(values).reduce((s, [id, raw]) => must(answer(s, id, raw)), session);

export function employerOnly(): Session {
  let s = fill(must(enterRole(startSession(sofortmeldung, QUESTIONNAIRE_ID), 'arbeitgeber')), {
    agFirma: 'Beispiel Bau GmbH',
    agBetriebsnummer: '12345678',
    agFamilienname: 'Müller-Lüdenscheidt',
    agVorname: 'Jürgen',
    agBeschaeftigungsbeginn: '02.11.2026',
  });
  const at = { local: '2026-10-30T08:30:00.000+01:00', utc: '2026-10-30T07:30:00.000Z' };
  s = must(
    seal(s, { nonce: NONCE_EMPLOYER, systemNote: note(at.local, at.utc, ['keyboard']), now: at }),
  );
  return s;
}

export function completeSofortmeldung(): Session {
  let s = fill(must(enterRole(employerOnly(), 'person')), {
    familienname: 'Müller-Lüdenscheidt',
    vorname: 'Jürgen',
    geburtsdatum: '17.05.1990',
    geburtsort: 'Musterstadt',
    geburtsland: 'Deutschland',
    geschlecht: 'maennlich',
    staatsangehoerigkeit: 'deutsch',
    versicherungsnummer: '65 170590 M 520',
    strasse: 'Musterweg 1',
    anschriftZusatz: 'Hinterhaus',
    postleitzahl: '12345',
    wohnort: 'Musterstadt',
  });
  s = acknowledge(acknowledge(s, 'datenschutz', true), 'mitfuehrungspflicht', true);
  const at = { local: '2026-10-30T09:00:00.000+01:00', utc: '2026-10-30T08:00:00.000Z' };
  return must(
    seal(s, {
      nonce: NONCE_PERSON,
      systemNote: note(at.local, at.utc, ['touch']),
      signature: { method: 'drawn', strokes: STROKES },
      now: at,
    }),
  );
}
