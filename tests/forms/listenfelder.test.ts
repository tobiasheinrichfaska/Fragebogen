// Official DEÜV lists in the drafts (Tobias 2026-10-30): nationality, state of birth and of a foreign
// address, name prefix and suffix are chosen from the tables; street and house number apart. The
// same ids in the Sofortmeldung 0.2.0 and the Personalfragebogen, so they are taken over. Fictitious data.
import { join } from 'node:path';
import { prefillFrom } from '../../src/logic/prefill';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const sofort = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '0.2.0.json')));

const LISTS = {
  staatsangehoerigkeitSchluessel: 'deuevStaatsangehoerigkeit2025',
  geburtsstaat: 'deuevStaaten2025',
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

  it('stores the Destatis key for the nationality and refuses Germany as a foreign address', () => {
    let q = ok(setValue(started(), form, 'person', 'staatsangehoerigkeitSchluessel', 'deutsch'));
    expect(q.parts.person?.[0]?.data.staatsangehoerigkeitSchluessel).toBe('000');
    q = ok(setValue(q, form, 'person', 'anschriftAusland', true));
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
    staatsangehoerigkeitSchluessel: 'türkisch',
    geburtsstaat: 'Türkei',
    strassenname: 'Musterweg',
    hausnummer: '12a',
  })) {
    source = ok(setValue(source, sofort, 'person', id, raw));
  }
  const target = createQuestionnaire('9b1f3c2a-4d5e-4f60-8a71-b2c3d4e5f607', personal);
  const { questionnaire } = prefillFrom(target, personal, source, sofort);
  expect(questionnaire.parts.person?.[0]?.data).toMatchObject({
    staatsangehoerigkeitSchluessel: '163',
    geburtsstaat: 'Türkei',
    strassenname: 'Musterweg',
    hausnummer: '12a',
  });
});
