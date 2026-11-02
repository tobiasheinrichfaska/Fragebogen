// Official DEÜV lists in the drafts (Tobias 2026-10-30): state of a foreign address, name prefix and
// suffix are chosen from the tables; street and house number apart. Country of birth and nationality
// (Tobias 2026-11-01): yes/no for Germany first, then a search list where free text is allowed with a
// warning. The same ids in the Sofortmeldung 0.2.0 and the Personalfragebogen, so they are taken
// over. Fictitious data.
import { join } from 'node:path';
import { listCodesOf, listEntryOf, listOf } from '../../src/logic/options';
import { prefillFrom } from '../../src/logic/prefill';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const sofort = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.2.0.json')));

const LISTS = {
  anschriftStaat: 'deuevStaatenAusland2025',
  vorsatzwort: 'deuevVorsatzworte2026',
  namenszusatz: 'deuevNamenszusaetze2006',
};

describe.each([
  ['Personalfragebogen', personal],
  ['Sofortmeldung 0.2.0', sofort],
])('%s', (_name, form) => {
  const fields = new Map(
    form.definition.sections.flatMap((s) => s.fields).map((f) => [f.id, f] as const),
  );
  const started = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));

  it('takes these answers from the official lists', () => {
    for (const [id, list] of Object.entries(LISTS)) {
      expect(fields.get(id)).toMatchObject({ type: 'choice', optionsFrom: list });
    }
  });

  it('asks "in Deutschland?" first, preselected Ja, and the list only on Nein', () => {
    for (const [question, listed, list] of [
      ['geborenInDeutschland', 'geburtsstaat', 'deuevStaatenAusland2025'],
      [
        'deutscheStaatsangehoerigkeit',
        'andereStaatsangehoerigkeit',
        'deuevStaatsangehoerigkeitAusland2025',
      ],
    ] as const) {
      expect(fields.get(question)).toMatchObject({
        type: 'boolean',
        initial: true,
        required: true,
      });
      expect(fields.get(listed)).toMatchObject({
        type: 'text',
        suggestionsFrom: list,
        showIf: { field: question, equals: false },
      });
    }
    const ids = form.definition.sections.flatMap((s) => s.fields).map((f) => f.id);
    expect(ids.slice(ids.indexOf('geburtsdatum'), ids.indexOf('geburtsdatum') + 4)).toEqual([
      'geburtsdatum',
      'geborenInDeutschland',
      'geburtsstaat',
      'geburtsort',
    ]);
    expect(fields.get('geburtsort')?.question).toBe(
      'In welcher Stadt oder Gemeinde sind Sie geboren?',
    );
  });

  it('stores a listed country by its official name and keeps free text with a warning', () => {
    let q = ok(setValue(started(), form, 'person', 'geborenInDeutschland', false));
    const listed = setValue(q, form, 'person', 'geburtsstaat', 'türkei');
    expect(listed).toMatchObject({ ok: true, warnings: [] });
    q = ok(listed);
    expect(q.parts.person?.[0]?.data.geburtsstaat).toBe('Türkei');
    const free = setValue(q, form, 'person', 'geburtsstaat', 'Sowjetunion');
    expect(free).toMatchObject({ ok: true, warnings: ['list.freeEntry'] });
    expect(ok(free).parts.person?.[0]?.data.geburtsstaat).toBe('Sowjetunion');
    // Germany is answered by the yes/no question, not in the list.
    expect(setValue(q, form, 'person', 'geburtsstaat', 'Deutschland')).toMatchObject({
      warnings: ['list.freeEntry'],
    });
  });

  it('stores a listed nationality by its name; its Destatis key follows from the list', () => {
    let q = ok(setValue(started(), form, 'person', 'deutscheStaatsangehoerigkeit', false));
    q = ok(setValue(q, form, 'person', 'andereStaatsangehoerigkeit', 'Türkisch'));
    expect(q.parts.person?.[0]?.data.andereStaatsangehoerigkeit).toBe('türkisch');
    const field = fields.get('andereStaatsangehoerigkeit');
    const entry = field ? listEntryOf(field, 'türkisch') : undefined;
    expect(listCodesOf(field ? (listOf(field) ?? '') : '', entry ?? '')).toEqual({
      schluessel: '163',
    });
    expect(setValue(q, form, 'person', 'andereStaatsangehoerigkeit', 'deutsch')).toMatchObject({
      warnings: ['list.freeEntry'],
    });
  });

  it('accepts a listed name prefix and refuses one that belongs to the family name', () => {
    let q = ok(setValue(started(), form, 'person', 'namensbestandteile', true));
    q = ok(setValue(q, form, 'person', 'vorsatzwort', 'Van der'));
    expect(q.parts.person?.[0]?.data.vorsatzwort).toBe('van der');
    expect(setValue(q, form, 'person', 'vorsatzwort', 'zum Kuckuck')).toMatchObject({
      ok: false,
    });
    expect(setValue(q, form, 'person', 'namenszusatz', 'Freiherr')).toMatchObject({ ok: true });
    expect(setValue(q, form, 'person', 'namenszusatz', 'Doktor')).toMatchObject({ ok: false });
  });

  it('refuses Germany as a foreign address', () => {
    const q = ok(setValue(started(), form, 'person', 'anschriftAusland', true));
    expect(setValue(q, form, 'person', 'anschriftStaat', 'Deutschland')).toMatchObject({
      ok: false,
    });
    expect(setValue(q, form, 'person', 'anschriftStaat', 'österreich')).toMatchObject({
      ok: true,
    });
  });

  it('asks the house number right after the street', () => {
    const ids = form.definition.sections.flatMap((s) => s.fields).map((f) => f.id);
    expect(ids[ids.indexOf('strassenname') + 1]).toBe('hausnummer');
  });
});

it('takes the list answers over from the Sofortmeldung into the Personalfragebogen', () => {
  let source = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, sofort), sofort, 'person'));
  for (const [id, raw] of Object.entries({
    geborenInDeutschland: false,
    geburtsstaat: 'Türkei',
    deutscheStaatsangehoerigkeit: false,
    andereStaatsangehoerigkeit: 'türkisch',
    strassenname: 'Musterweg',
    hausnummer: '12a',
  })) {
    source = ok(setValue(source, sofort, 'person', id, raw));
  }
  const target = createQuestionnaire('9b1f3c2a-4d5e-4f60-8a71-b2c3d4e5f607', personal);
  const { questionnaire } = prefillFrom(target, personal, source, sofort);
  expect(questionnaire.parts.person?.[0]?.data).toMatchObject({
    geborenInDeutschland: false,
    geburtsstaat: 'Türkei',
    deutscheStaatsangehoerigkeit: false,
    andereStaatsangehoerigkeit: 'türkisch',
    strassenname: 'Musterweg',
    hausnummer: '12a',
  });
});
