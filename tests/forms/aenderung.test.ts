// Personalfragebogen 1.1.0: a change of an existing employment (Tobias 2026-11-24). A change of the
// Personengruppe or the Beitragsgruppen is a de-registration plus a registration, so the assessed
// employment "begins" at the change date; the whole questionnaire is filled with the state from
// then on. Fictitious people.
import { join } from 'node:path';
import { missingRequired, visibleFields } from '../../src/logic/form';
import {
  currentPart,
  createQuestionnaire,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { outsideValidity } from '../../src/logic/validity';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';
import { assess, shownValue, type Answers } from '../support/svCase';

const draft = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json')));
const fields = draft.definition.sections.flatMap((section) => section.fields);
const field = (id: string) => fields.find((f) => f.id === id);

const PERSON: Answers = {
  geburtsdatum: '1985-06-01',
  status: 'arbeitnehmer',
  grundsicherung: false,
  elternzeitAnderswo: false,
  bezugRente: false,
  weitereBeschaeftigung: false,
  krankenversicherung: 'gesetzlich',
  artLautVereinbarung: 'festeStelle',
};
const EMPLOYER: Answers = {
  agBeschaeftigungsbeginn: '2027-01-01',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2000.00',
  agUeberJaeg: false,
  agBeschaeftigungsart: 'svpflichtig',
  agBefristet: false,
};

const shown = (employer: Answers) =>
  visibleFields(
    draft.definition,
    'arbeitgeber',
    employer as Parameters<typeof visibleFields>[2],
  ).map((f) => f.id);

describe('Personalfragebogen 1.1.0: a change of an existing employment', () => {
  it('has the cause question with Neueinstellung preselected', () => {
    const f = field('agAnlass');
    expect(f?.type).toBe('choice');
    expect(f?.initial).toBe('neueinstellung');
    expect(f?.required).toBe(true);
    expect(f?.options?.map((o) => o.id)).toEqual(['neueinstellung', 'aenderung']);
  });

  it('asks nothing new for a Neueinstellung', () => {
    const ids = shown({ agAnlass: 'neueinstellung', ...EMPLOYER });
    expect(ids).toContain('agAnlass');
    expect(ids).toContain('agFrueherBeschaeftigt');
    expect(ids).not.toContain('agAenderungWas');
    expect(ids).not.toContain('agErsteintritt');
    expect(shown({ agAnlass: 'neueinstellung', agFrueherBeschaeftigt: true })).toContain(
      'agErsteintritt',
    );
  });

  it('asks for the change and the original start, not for an earlier employment', () => {
    const ids = shown({ agAnlass: 'aenderung', ...EMPLOYER });
    expect(ids).toContain('agAenderungWas');
    expect(ids).toContain('agErsteintritt');
    expect(ids).not.toContain('agFrueherBeschaeftigt');
  });

  it('seals the employer part of a change from 2027 and proposes 101 with the values of 2027', () => {
    const employer: Answers = {
      ...EMPLOYER,
      agAnlass: 'aenderung',
      agAenderungWas: 'Wechsel vom Minijob in eine Stelle mit 2.000 € im Monat',
      agErsteintritt: '2019-04-01',
    };
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'person'));
    for (const [id, v] of Object.entries(PERSON)) q = ok(setValue(q, draft, 'person', id, v));
    q = ok(startPart(q, draft, 'arbeitgeber'));
    for (const [id, v] of Object.entries(employer)) {
      q = ok(setValue(q, draft, 'arbeitgeber', id, v));
    }
    const data = currentPart(q, 'arbeitgeber')?.data ?? {};
    expect(outsideValidity(draft.definition, 'arbeitgeber', data)).toBeUndefined();
    expect(missingRequired(draft.definition, 'arbeitgeber', data)).not.toContain('agAnlass');
    expect(data.agAnlass).toBe('aenderung');

    const r = assess(PERSON, employer, draft);
    expect(r.skipped).toEqual([]);
    expect(shownValue(r.pgr)).toMatch(/^101/);
  });

  it('assesses a change like a new employment starting at the change date', () => {
    const base = { ...EMPLOYER, agBeschaeftigungsart: 'minijob', agMonatsentgelt: '600.00' };
    const person = { ...PERSON, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' };
    const neu = assess(person, { agAnlass: 'neueinstellung', ...base }, draft);
    const aenderung = assess(
      person,
      { agAnlass: 'aenderung', agAenderungWas: 'x', agErsteintritt: '2019-04-01', ...base },
      draft,
    );
    expect(shownValue(aenderung.pgr)).toBe(shownValue(neu.pgr));
    expect(shownValue(aenderung.bgr)).toBe(shownValue(neu.bgr));
  });

  it('reads the values of the year of the change (620 € is a Minijob from 2027, not in 2026)', () => {
    const person = { ...PERSON, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' };
    const change = (start: string) =>
      assess(
        person,
        {
          ...EMPLOYER,
          agAnlass: 'aenderung',
          agAenderungWas: 'Entgelt',
          agErsteintritt: '2019-04-01',
          agBeschaeftigungsart: 'minijob',
          agMonatsentgelt: '620.00',
          agBeschaeftigungsbeginn: start,
        },
        draft,
      );
    expect(shownValue(change('2027-01-01').pgr)).toMatch(/^109/);
    expect(shownValue(change('2026-12-01').pgr)).not.toMatch(/^109/);
  });
});
