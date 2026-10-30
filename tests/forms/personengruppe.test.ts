// The Personengruppe as a proposal (Tobias 2026-10-30): the rule table of the Personalfragebogen
// draft, first match wins (order after DEÜV Anlage 2). Never decided by the app. Fictitious data.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));

function filled(role: string, values: Record<string, unknown>, base: Questionnaire): Questionnaire {
  let q = ok(startPart(base, form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

function proposal(employer: Record<string, unknown>, person: Record<string, unknown> = {}) {
  const base = createQuestionnaire(QUESTIONNAIRE_ID, form);
  const q = filled(
    'arbeitgeber',
    { agBeschaeftigungsbeginn: '02.11.2026', ...employer },
    filled('person', { weitereBeschaeftigung: false, ...person }, base),
  );
  const result = derive(q, form.definition).find((d) => d.id === 'personengruppe');
  if (!result) throw new Error('no Personengruppe');
  return result;
}

const MINIJOB = { agBeschaeftigungsart: 'minijob', agEntgeltArt: 'monatsentgelt' };

describe('Personengruppe proposed from the answers', () => {
  it.each([
    [
      'a Minijob with a fixed monthly pay',
      { ...MINIJOB, agMonatsentgelt: '520,00' },
      {},
      '109',
      false,
    ],
    [
      'a Minijob next to another job',
      { ...MINIJOB, agMonatsentgelt: '520,00' },
      { weitereBeschaeftigung: true },
      '109',
      true,
    ],
    ['a "Minijob" above the limit', { ...MINIJOB, agMonatsentgelt: '700,00' }, {}, '101', true],
    [
      'a Minijob paid by the hour',
      {
        agBeschaeftigungsart: 'minijob',
        agEntgeltArt: 'stundenlohn',
        agStundenlohn: '14,50',
        agErwartetMonat: '500,00',
      },
      {},
      '109',
      false,
    ],
    ['a short-term job', { agBeschaeftigungsart: 'kurzfristig' }, {}, '110', false],
    [
      'a trainee up to 325 €',
      {
        agBeschaeftigungsart: 'ausbildung',
        agAusserbetrieblich: false,
        agEntgeltArt: 'ausbildungsverguetung',
        agAusbildungsverguetung: [
          { rowId: 'r1', avJahr: '1', avBetrag: '300,00', avGueltigAb: '01.09.2026' },
        ],
      },
      {},
      '121',
      false,
    ],
    [
      'a trainee above 325 €',
      {
        agBeschaeftigungsart: 'ausbildung',
        agAusserbetrieblich: false,
        agEntgeltArt: 'ausbildungsverguetung',
        agAusbildungsverguetung: [
          { rowId: 'r1', avJahr: '1', avBetrag: '1.000,00', avGueltigAb: '01.09.2026' },
        ],
      },
      {},
      '102',
      false,
    ],
    [
      'an apprenticeship outside a business',
      { agBeschaeftigungsart: 'ausbildung', agAusserbetrieblich: true },
      {},
      '122',
      false,
    ],
    ['a voluntary service', { agBeschaeftigungsart: 'freiwilligendienst' }, {}, '123', false],
    [
      'a compulsory internship during studies',
      { agBeschaeftigungsart: 'praktikum', agPraktikumArt: 'pflichtStudium' },
      {},
      '190',
      false,
    ],
    [
      'a compulsory pre-study internship with pay',
      {
        agBeschaeftigungsart: 'praktikum',
        agPraktikumArt: 'pflichtVorNach',
        agEntgeltArt: 'monatsentgelt',
        agMonatsentgelt: '800,00',
      },
      {},
      '105',
      false,
    ],
    [
      'a Werkstudent in the semester break',
      { agBeschaeftigungsart: 'werkstudent', agNurSemesterferien: true },
      {},
      '106',
      false,
    ],
    [
      'a Werkstudent during lectures',
      { agBeschaeftigungsart: 'werkstudent', agNurSemesterferien: false },
      {},
      '106',
      true,
    ],
    ['Vorruhestandsgeld', { agBeschaeftigungsart: 'vorruhestand' }, {}, '108', false],
    [
      'partial retirement',
      { agBeschaeftigungsart: 'svpflichtig', agArbeitszeitmodell: 'altersteilzeit' },
      {},
      '103',
      true,
    ],
    [
      'a full old-age pensioner past the Regelaltersgrenze',
      { agBeschaeftigungsart: 'svpflichtig' },
      { situation: ['rente', 'regelaltersgrenze'], rentenart: 'altersvoll', rvVerzicht: 'nein' },
      '119',
      false,
    ],
    [
      'the same with a waiver',
      { agBeschaeftigungsart: 'svpflichtig' },
      { situation: ['rente', 'regelaltersgrenze'], rentenart: 'altersvoll', rvVerzicht: 'ja' },
      '120',
      false,
    ],
    [
      'a full old-age pension before the Regelaltersgrenze',
      { agBeschaeftigungsart: 'svpflichtig' },
      { situation: ['rente'], rentenart: 'altersvoll' },
      '120',
      false,
    ],
    ['an ordinary employee', { agBeschaeftigungsart: 'svpflichtig' }, {}, '101', false],
  ])('%s → %s', (_name, employer, person, value, check) => {
    const result = proposal(employer, person);
    expect(result).toMatchObject({ status: 'proposed', value, check });
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it('names the Minijob limit of the year in the facts', () => {
    expect(proposal({ ...MINIJOB, agMonatsentgelt: '520,00' }).detail.join(' ')).toContain(
      'Geringfügigkeitsgrenze 2026: 603,00 €',
    );
  });

  it('asks for a check instead of guessing in a year without Rechengrößen', () => {
    const result = proposal({
      ...MINIJOB,
      agMonatsentgelt: '520,00',
      agBeschaeftigungsbeginn: '04.01.2027',
    });
    expect(result).toMatchObject({ value: '109', check: true });
    expect(result.detail.join(' ')).toContain(
      'Für 2027 ist die Geringfügigkeitsgrenze in der App nicht hinterlegt',
    );
  });

  it('proposes nothing for a special case', () => {
    expect(proposal({ agHeimarbeit: true })).toMatchObject({ status: 'excluded', check: true });
  });

  it('waits for the parts it needs', () => {
    const q = filled(
      'arbeitgeber',
      { agBeschaeftigungsart: 'svpflichtig' },
      createQuestionnaire(QUESTIONNAIRE_ID, form),
    );
    expect(derive(q, form.definition)[0]).toMatchObject({
      status: 'incomplete',
      reason: 'Es fehlt noch der Teil „Beschäftigte Person“.',
    });
  });

  it('checks the rules of a derivation like hints', () => {
    const d = structuredClone(form.definition);
    const rules = d.derivations?.[0]?.rules;
    if (!rules) throw new Error('draft changed');
    rules.unshift({ value: 'x', reason: 'x', when: { field: 'gibtEsNicht', equals: true } });
    d.derivations?.push({ ...(d.derivations[0] ?? { id: '', label: '', rules: [] }) });
    expect(checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('$.derivations[0].rules[0].when.field unknown field "gibtEsNicht"'),
        expect.stringContaining('duplicate derivation id "personengruppe"'),
      ]),
    );
  });
});
