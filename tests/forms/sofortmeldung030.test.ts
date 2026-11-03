// Sofortmeldung 0.3.0 (field limits, Tobias 2026-11-03): the DEÜV lengths are enforced in the input
// and checked again, the DEÜV character rules and the Versicherungsnummer against the person are
// only hints. And a bookmark link keeps working when a new version comes out: the newest version of
// every form knows all master-data keys of its older versions. Fictitious data.
import { join } from 'node:path';
import { fieldsById } from '../../src/logic/form';
import { compareVersions } from '../../src/logic/formRegistry';
import { checkHints } from '../../src/logic/hints';
import { masterDataKeysOf } from '../../src/logic/masterData';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import {
  answer,
  enterRole,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.3.0.json')));
const older = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.2.0.json')));
const fields = fieldsById(form.definition);

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}

describe('Sofortmeldung 0.3.0', () => {
  it('carries the DEÜV lengths and character rules on the name and address fields', () => {
    const limits = Object.fromEntries(
      [...fields.values()]
        .filter((field) => field.maxLength !== undefined)
        .map((field) => [field.id, [field.maxLength, field.deuevRule ?? null]]),
    );
    expect(limits).toEqual({
      familienname: [30, 'familienname'],
      vorname: [30, 'vorname'],
      titel: [20, 'titel'],
      geburtsname: [30, 'familienname'],
      geburtsort: [34, 'geburtsort'],
      strassenname: [33, 'strasse'],
      hausnummer: [9, 'hausnummer'],
      anschriftZusatz: [40, null],
      postleitzahlAusland: [10, 'plzAusland'],
      wohnort: [34, 'wohnort'],
      agFamilienname: [30, null],
      agVorname: [30, null],
    });
    expect(fields.get('geburtsdatum')).toMatchObject({
      minDate: '1876-01-01',
      maxDate: '2026-12-31',
    });
  });

  it('differs from 0.2.0 only by the limits, two texts and the check hints', () => {
    const strip = (definition: typeof form.definition) =>
      JSON.parse(
        JSON.stringify(definition, (key, value: unknown) =>
          ['maxLength', 'deuevRule', 'minDate', 'maxDate', 'checkHints', 'version'].includes(key)
            ? undefined
            : value,
        ),
      ) as unknown;
    const changed = (definition: typeof form.definition) =>
      [...fieldsById(definition).values()]
        .filter((field) => ['anschriftAusland', 'postleitzahlAusland'].includes(field.id))
        .map((field) => [field.help, field.because]);
    const sameTexts = (definition: typeof form.definition) => {
      const copy = structuredClone(definition);
      for (const field of copy.sections.flatMap((section) => section.fields)) {
        if (field.id === 'anschriftAusland') delete field.help;
        if (field.id === 'postleitzahlAusland') delete field.because;
      }
      return strip(copy);
    };
    expect(sameTexts(form.definition)).toEqual(sameTexts(older.definition));
    expect(changed(form.definition)).not.toEqual(changed(older.definition));
    expect(form.definition.checkHints?.map((hint) => hint.id)).toEqual([
      'versicherungsnummerWeichtAb',
      'plzAuslandFormat',
    ]);
  });

  it('refuses a name longer than the report takes, with the limit in the message', () => {
    const s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'person'));
    expect(answer(s, 'familienname', 'A'.repeat(31))).toEqual({
      ok: false,
      message: 'Höchstens 30 Zeichen.',
      detail: ['Familienname'],
    });
    expect(answer(s, 'geburtsdatum', '31.12.1875')).toEqual({
      ok: false,
      message: 'Das Datum liegt zu weit zurück – frühestens 01.01.1876.',
      detail: ['Geburtsdatum'],
    });
  });

  it('takes a name with unusual characters and only adds a hint', () => {
    const s = must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'person'));
    const result = answer(s, 'familienname', 'Müller!');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.join(' ')).toContain('Meldung zur Sozialversicherung');
    expect(result.session.questionnaire.parts.person?.[0]?.data.familienname).toBe('Müller!');
  });

  it('shows the Versicherungsnummer hint, never refuses the number for it', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    for (const [id, value] of [
      ['familienname', 'Musterfrau'],
      ['geburtsdatum', '18.05.1990'],
      ['geschlecht', 'weiblich'],
      ['versicherungsnummer', '65 170590 M 520'],
    ] as const) {
      q = ok(setValue(q, form, 'person', id, value));
    }
    const hint = checkHints(q, form.definition).find((h) => h.id === 'versicherungsnummerWeichtAb');
    expect(hint?.detail).toEqual([
      'Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.',
    ]);
  });

  it('checks a postcode abroad against Anlage 18', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    q = ok(setValue(q, form, 'person', 'anschriftAusland', true));
    q = ok(setValue(q, form, 'person', 'anschriftStaat', 'Niederlande'));
    q = ok(setValue(q, form, 'person', 'postleitzahlAusland', '1234AB'));
    expect(checkHints(q, form.definition).map((h) => h.id)).toContain('plzAuslandFormat');
    q = ok(setValue(q, form, 'person', 'postleitzahlAusland', '1234 AB'));
    expect(checkHints(q, form.definition).map((h) => h.id)).not.toContain('plzAuslandFormat');
  });
});

describe('master-data keys across versions (bookmark links stay valid)', () => {
  const versions = [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
    .filter((file) => file.file.endsWith('.json'))
    .map((file) => registeredFrom(readJson(file.path)).definition);
  const keysOf = (definition: (typeof versions)[number]) =>
    new Set(
      [...fieldsById(definition).values()].flatMap((field) =>
        masterDataKeysOf(field).map((entry) => entry.key),
      ),
    );

  it.each([...new Set(versions.map((definition) => definition.id))])('%s', (id) => {
    const ofForm = versions
      .filter((definition) => definition.id === id)
      .sort((a, b) => compareVersions(a.version, b.version));
    const newest = ofForm.at(-1);
    if (!newest) return;
    const newestKeys = keysOf(newest);
    for (const definition of ofForm) {
      const lost = [...keysOf(definition)].filter((key) => !newestKeys.has(key));
      expect(lost, `${id} ${definition.version} → ${newest.version}`).toEqual([]);
    }
  });

  it('the Sofortmeldung link fills firm and Betriebsnummer in both versions', () => {
    expect([...keysOf(form.definition)].sort()).toEqual(['betriebsnummer', 'firma']);
    expect([...keysOf(older.definition)].sort()).toEqual(['betriebsnummer', 'firma']);
  });
});
