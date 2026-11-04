// Hints shown while filling in (Tobias 2026-11-04, a tester: "SV-Nummer, Buchstabe und
// Anfangsbuchstabe Geburtsname stimmen nicht überein – kein Hinweis?"): the check hint existed, but
// only the Kanzlei saw it. A hint marked `showWhileFilling` now warns the person right after the
// answer it reads and stands at the top of the summary; it never blocks, and the Kanzlei's own
// notes stay hidden from the person.
import { join } from 'node:path';
import { parseFormDefinition } from '../../src/logic/formDefinition';
import { fillingHints, hintFields } from '../../src/logic/hints';
import {
  answer,
  enterRole,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const sofort = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '1.1.0.json')));
const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));

const must = (result: SessionResult): Session => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};
const warningsOf = (result: SessionResult) => (result.ok ? result.warnings.join(' ') : '');

// 65 170590 M 520: born 17.05.1990, letter M, serial 52 (women 50–99).
const PERSON = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  namensbestandteile: false,
  geburtsnameWieFamilienname: true,
  geburtsdatum: '17.05.1990',
  geborenInDeutschland: true,
  geburtsort: 'Musterstadt',
  geschlecht: 'weiblich',
};

function person(values: Readonly<Record<string, unknown>>): Session {
  return Object.entries(values).reduce(
    (s, [id, raw]) => must(answer(s, id, raw)),
    must(enterRole(startSession(sofort, QUESTIONNAIRE_ID), 'person')),
  );
}

describe('a hint shown while filling in (Sofortmeldung 1.1.0)', () => {
  it('warns right after the SV number when its letter does not fit the birth name', () => {
    const before = person({
      ...PERSON,
      geburtsnameWieFamilienname: false,
      geburtsname: 'Schmidt',
    });
    const result = answer(before, 'versicherungsnummer', '65 170590 M 520');
    expect(result.ok).toBe(true);
    expect(warningsOf(result)).toContain('Die Versicherungsnummer passt nicht ganz');
    expect(warningsOf(result)).toContain(
      'Buchstabe in der Versicherungsnummer: M; Anfangsbuchstabe des Geburtsnamens: S.',
    );
  });

  it('says nothing when the SV number fits birth date, birth name and gender', () => {
    const result = answer(person(PERSON), 'versicherungsnummer', '65 170590 M 520');
    expect(warningsOf(result)).toBe('');
  });

  it('warns again when an earlier answer it reads is changed later', () => {
    const filled = must(answer(person(PERSON), 'versicherungsnummer', '65 170590 M 520'));
    const changed = answer(filled, 'geburtsdatum', '18.05.1990');
    expect(warningsOf(changed)).toContain(
      'Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.',
    );
  });

  it('lists the hint for the summary with the field to change', () => {
    const filled = must(
      answer(
        person({ ...PERSON, geburtsnameWieFamilienname: false, geburtsname: 'Schmidt' }),
        'versicherungsnummer',
        '65 170590 M 520',
      ),
    );
    const checks = fillingHints(filled.questionnaire, sofort.definition, 'person');
    expect(checks.map((c) => c.id)).toEqual(['versicherungsnummerWeichtAb']);
    expect(checks[0]?.fields[0]).toBe('versicherungsnummer');
  });

  it('shows the person only hints marked for it, never the Kanzlei notes', () => {
    const marked = (personal.definition.checkHints ?? [])
      .filter((h) => h.showWhileFilling)
      .map((h) => h.id);
    expect(marked.sort()).toEqual([
      'bicPasstNichtZurIban',
      'plzAuslandFormat',
      'versicherungsnummerWeichtAb',
    ]);
    expect(marked).not.toContain('arbeitslosengeld');
  });
});

describe('definition rule for showWhileFilling', () => {
  const base = sofort.definition;
  const withHint = (hint: Record<string, unknown>) =>
    parseFormDefinition({ ...base, checkHints: [...(base.checkHints ?? []), hint] });

  it('accepts a hint that reads one role only', () => {
    expect(
      withHint({
        id: 'nurPerson',
        when: { field: 'geborenInDeutschland', equals: false },
        message: 'x',
        showWhileFilling: true,
      }).ok,
    ).toBe(true);
  });

  it('refuses a hint shown while filling that reads two roles', () => {
    const parsed = withHint({
      id: 'zweiRollen',
      when: {
        all: [
          { field: 'geborenInDeutschland', equals: false },
          { field: 'agBranche', equals: 'bau' },
        ],
      },
      message: 'x',
      showWhileFilling: true,
    });
    expect(parsed.ok).toBe(false);
    expect(JSON.stringify(parsed)).toContain('reads the answers of one role only');
  });

  it('names the fields a hint reads, test arguments first', () => {
    const hint = base.checkHints?.find((h) => h.id === 'versicherungsnummerWeichtAb');
    expect(hint && hintFields(hint)).toEqual([
      'versicherungsnummer',
      'geburtsdatum',
      'geburtsname',
      'familienname',
      'geschlecht',
    ]);
  });
});
