// Check hints (Prüfhinweise): definition rules on a fixture and the hints of the Personalfragebogen
// draft for combined answers of person and employer. Fictitious data.
import { join } from 'node:path';
import { visibleFields } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { checkHints, describeHint, HINT_TESTS } from '../../src/logic/hints';
import type { FormDefinition, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const raw = () =>
  structuredClone(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json'))) as FormDefinition;
const form = registeredFrom(raw());

function answers(
  person: Record<string, unknown>,
  employer?: Record<string, unknown>,
): Questionnaire {
  let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
  for (const [id, value] of Object.entries(person)) q = ok(setValue(q, form, 'person', id, value));
  if (employer) {
    q = ok(startPart(q, form, 'arbeitgeber'));
    for (const [id, value] of Object.entries(employer)) {
      q = ok(setValue(q, form, 'arbeitgeber', id, value));
    }
  }
  return q;
}

const ids = (q: Questionnaire) => checkHints(q, form.definition).map((hint) => hint.id);

describe('check hints of the Personalfragebogen draft', () => {
  it('flags a registered job seeker planned as short-term help', () => {
    const q = answers(
      { situation: ['arbeitslos'], artLautVereinbarung: 'aushilfe' },
      { agBeschaeftigungsart: 'kurzfristig' },
    );
    expect(ids(q)).toContain('kurzfristigArbeitslos');
    const hint = checkHints(q, form.definition).find((h) => h.id === 'kurzfristigArbeitslos');
    expect(hint?.source).toContain('§ 8 Abs. 1 Nr. 2 SGB IV');
  });

  it('waits for every part a hint names', () => {
    const personOnly = answers({ situation: ['arbeitslos'], artLautVereinbarung: 'aushilfe' });
    expect(ids(personOnly)).not.toContain('kurzfristigArbeitslos');
    expect(ids(personOnly)).not.toContain('artWeichtAb');
  });

  it('compares the kind of employment, except where one side leaves it open', () => {
    expect(
      ids(answers({ artLautVereinbarung: 'minijob' }, { agBeschaeftigungsart: 'svpflichtig' })),
    ).toContain('artWeichtAb');
    expect(
      ids(answers({ artLautVereinbarung: 'minijob' }, { agBeschaeftigungsart: 'minijob' })),
    ).not.toContain('artWeichtAb');
    expect(
      ids(answers({ artLautVereinbarung: 'unbekannt' }, { agBeschaeftigungsart: 'svpflichtig' })),
    ).not.toContain('artWeichtAb');
    expect(
      ids(answers({ artLautVereinbarung: 'minijob' }, { agBeschaeftigungsart: 'pruefen' })),
    ).not.toContain('artWeichtAb');
  });

  it('computes the Regelaltersgrenze from the birth date and the start of employment', () => {
    const notStated = answers(
      { geburtsdatum: '15.03.1960', situation: ['arbeitnehmer'] },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    const hint = checkHints(notStated, form.definition).find(
      (h) => h.id === 'regelaltersgrenzeNichtAngegeben',
    );
    expect(hint?.detail).toEqual([
      'Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.',
    ]);

    const stated = answers(
      { geburtsdatum: '15.03.1960', situation: ['regelaltersgrenze'] },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    expect(ids(stated)).not.toContain('regelaltersgrenzeNichtAngegeben');
    expect(ids(stated)).not.toContain('regelaltersgrenzeFalschAngegeben');

    const tooYoung = answers(
      { geburtsdatum: '17.05.1990', situation: ['regelaltersgrenze'] },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    expect(ids(tooYoung)).toContain('regelaltersgrenzeFalschAngegeben');

    const soon = answers(
      { geburtsdatum: '15.03.1960', situation: ['arbeitnehmer'] },
      { agBeschaeftigungsbeginn: '01.01.2026' },
    );
    expect(ids(soon)).toContain('regelaltersgrenzeBald');
    expect(ids(soon)).not.toContain('regelaltersgrenzeNichtAngegeben');
  });

  it('shows no age hint while the start of employment is missing', () => {
    const q = answers({ geburtsdatum: '15.03.1960', situation: ['arbeitnehmer'] }, {});
    expect(ids(q).filter((id) => id.startsWith('regelaltersgrenze'))).toEqual([]);
  });

  it('describes every hint in German for the catalogue', () => {
    for (const hint of form.definition.checkHints ?? []) {
      expect(describeHint(hint, form.definition)).toMatch(/^wenn /);
    }
  });
});

describe('check hints — definition rules', () => {
  const problems = (change: (d: FormDefinition) => void) => {
    const d = raw();
    change(d);
    return checkFormDefinition(d).map((issue) => issue.message);
  };

  it('accepts the draft', () => {
    expect(problems(() => undefined)).toEqual([]);
  });

  it('refuses an empty hint, a duplicate id, an unknown test and a wrong argument', () => {
    expect(problems((d) => d.checkHints?.push({ id: 'leer', message: 'Leer' }))).toContain(
      'a hint needs a condition or a test',
    );
    expect(
      problems((d) =>
        d.checkHints?.push({
          id: 'artWeichtAb',
          when: { field: 'kinder', equals: true },
          message: 'x',
        }),
      ),
    ).toContain('duplicate hint id "artWeichtAb"');
    expect(
      problems((d) =>
        d.checkHints?.push({
          id: 'neu',
          test: { fn: 'gibtEsNicht', args: ['geburtsdatum'] },
          message: 'x',
        }),
      ),
    ).toContain('unknown test "gibtEsNicht"');
    expect(
      problems((d) =>
        d.checkHints?.push({
          id: 'neu',
          test: { fn: 'regelaltersgrenzeErreicht', args: ['geburtsdatum', 'situation'] },
          message: 'x',
        }),
      ),
    ).toContain('"situation" must be a date field');
  });

  it('refuses a condition on a table column', () => {
    expect(
      problems((d) =>
        d.checkHints?.push({
          id: 'neu',
          when: { field: 'jobArt', equals: 'minijob' },
          message: 'x',
        }),
      ),
    ).toContain('unknown field "jobArt"');
  });

  it('knows the tests the forms use', () => {
    expect(Object.keys(HINT_TESTS).sort()).toEqual([
      'regelaltersgrenzeErreicht',
      'regelaltersgrenzeInnerhalbEinesJahres',
      'regelaltersgrenzeNichtErreicht',
      'spaeterAls',
      'ueberBeitragsbemessungsgrenze',
      'ueberJahresarbeitsentgeltgrenze',
    ]);
  });
});

describe('pension insurance declarations on paper (Tobias 2026-10-30)', () => {
  it('asks the employer for the day of receipt once the paper original is ticked', () => {
    const fields = (data: Record<string, unknown>) =>
      visibleFields(form.definition, 'arbeitgeber', data as never).map((f) => f.id);
    expect(fields({ agUnterlagen: ['rvBefreiung'] })).toContain('agRvBefreiungEingang');
    expect(fields({ agUnterlagen: ['rvVerzicht'] })).toContain('agRvVerzichtEingang');
    expect(fields({ agUnterlagen: ['arbeitsvertrag'] })).not.toContain('agRvBefreiungEingang');
  });

  it('flags a wish without the paper and paper without the wish', () => {
    const wish = { artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'ja' };
    expect(ids(answers(wish, { agUnterlagen: ['arbeitsvertrag'] }))).toContain(
      'befreiungsantragFehlt',
    );
    const received = answers(wish, {
      agUnterlagen: ['rvBefreiung'],
      agRvBefreiungEingang: '30.10.2026',
    });
    expect(ids(received)).not.toContain('befreiungsantragFehlt');
    expect(
      ids(
        answers(
          { artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' },
          { agUnterlagen: ['rvBefreiung'] },
        ),
      ),
    ).toContain('befreiungsantragOhneWunsch');
  });
});
