// Name components of the DEÜV data block "Name" (Tobias 2026-10-30): asked only behind one yes/no
// question, with the same ids in the Sofortmeldung 0.2.0 and the Personalfragebogen, so they are
// taken over from one to the other. Fictitious data.
import { join } from 'node:path';
import { visibleFields } from '../../src/logic/form';
import { prefillFrom } from '../../src/logic/prefill';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const sofort = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '0.2.0.json')));
const COMPONENTS = ['titel', 'vorsatzwort', 'namenszusatz'];

describe.each([
  ['Personalfragebogen', personal],
  ['Sofortmeldung 0.2.0', sofort],
])('%s', (_name, form) => {
  const shown = (data: Record<string, boolean>) =>
    visibleFields(form.definition, 'person', data).map((f) => f.id);

  it('asks title, prefix and suffix only after "Ja"', () => {
    for (const id of COMPONENTS) expect(shown({ namensbestandteile: false })).not.toContain(id);
    expect(shown({ namensbestandteile: true })).toEqual(expect.arrayContaining(COMPONENTS));
  });

  it('places them right after the given names', () => {
    const ids = form.definition.sections[0]?.fields.map((f) => f.id) ?? [];
    expect(ids.slice(ids.indexOf('vorname') + 1, ids.indexOf('vorname') + 5)).toEqual([
      'namensbestandteile',
      ...COMPONENTS,
    ]);
  });
});

it('takes the name components over from the Sofortmeldung into the Personalfragebogen', () => {
  let source = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, sofort), sofort, 'person'));
  for (const [id, raw] of Object.entries({
    familienname: 'Musterfrau',
    vorname: 'Erika',
    namensbestandteile: true,
    titel: 'Dr.',
    vorsatzwort: 'von',
  })) {
    source = ok(setValue(source, sofort, 'person', id, raw));
  }
  const target = createQuestionnaire('9b1f3c2a-4d5e-4f60-8a71-b2c3d4e5f607', personal);
  const { questionnaire } = prefillFrom(target, personal, source, sofort);
  expect(questionnaire.parts.person?.[0]?.data).toMatchObject({
    namensbestandteile: true,
    titel: 'Dr.',
    vorsatzwort: 'von',
  });
});
