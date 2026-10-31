// Test versions may be removed from the app at any time (Tobias 2026-10-31): a questionnaire started
// with a removed version is still read, continued and verified from its own file, because the file
// carries the form definition (`origin: embedded`). Fictitious data.
import { buildPackage, decodePackage, packageText } from '../../src/logic/dataPackage';
import { registryOf } from '../../src/logic/formRegistry';
import {
  acknowledge,
  answer,
  enterRole,
  seal,
  sessionFromFile,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { verifyQuestionnaire } from '../../src/logic/verify';
import { NONCE_PERSON, STROKES, note } from '../support/sample';
import { employerOnly, sofortmeldung } from '../support/sofortmeldungSession';

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

describe('a form version removed from the app', () => {
  it('still opens, is continued by the next station and verifies', () => {
    const started = employerOnly();
    // The app no longer publishes the version: an empty registry.
    const decoded = decodePackage(
      JSON.parse(packageText(buildPackage(started.questionnaire, sofortmeldung))),
      registryOf([]),
    );
    expect(decoded).toMatchObject({ ok: true, origin: 'embedded' });
    if (!decoded.ok) return;
    const arrival = {
      local: '2026-10-30T08:45:00.000+01:00',
      utc: '2026-10-30T07:45:00.000Z',
      source: 'file' as const,
    };
    let s = must(enterRole(sessionFromFile(decoded, arrival), 'person'));
    for (const [id, raw] of Object.entries({
      familienname: 'Müller-Lüdenscheidt',
      vorname: 'Jürgen',
      geburtsdatum: '17.05.1990',
      geburtsort: 'Musterstadt',
      geburtsland: 'Deutschland',
      geschlecht: 'maennlich',
      staatsangehoerigkeit: 'deutsch',
      strasse: 'Musterweg 1',
      postleitzahl: '12345',
      wohnort: 'Musterstadt',
    })) {
      s = must(answer(s, id, raw));
    }
    s = acknowledge(acknowledge(s, 'datenschutz', true), 'mitfuehrungspflicht', true);
    const at = { local: '2026-10-30T09:00:00.000+01:00', utc: '2026-10-30T08:00:00.000Z' };
    s = must(
      seal(s, {
        nonce: NONCE_PERSON,
        systemNote: note(at.local, at.utc, ['touch']),
        signature: { method: 'drawn', strokes: STROKES },
        now: at,
      }),
    );
    expect(s.origin).toBe('embedded');
    const verdict = verifyQuestionnaire(s.questionnaire, { registry: registryOf([s.form]) });
    expect(verdict.level).not.toBe('invalid');
    expect(verdict.parts.map((p) => p.level)).not.toContain('invalid');
  });
});
