// Taking answers over from another questionnaire: the Sofortmeldung into the Personalfragebogen
// (draft), and last month's values into a new questionnaire of the same form with month values
// left empty. Fictitious data.
import { join } from 'node:path';
import {
  createQuestionnaire,
  currentPart,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { describePrefill, prefillFrom } from '../../src/logic/prefill';
import {
  answer,
  enterRole,
  startSession,
  takeOver,
  type SessionResult,
} from '../../src/logic/session';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { definitionHash } from '../../src/logic/formRegistry';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { NONCE_PERSON, ok, personSealInput, PERSON_VALUES, tableForm } from '../support/sample';
import {
  completeSofortmeldung,
  employerOnly,
  sofortmeldung,
} from '../support/sofortmeldungSession';

const must = (result: SessionResult) => {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
};

const OTHER_ID = '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const personalfragebogen = registeredFrom(
  readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')),
);

describe('prefillFrom — Sofortmeldung into the Personalfragebogen', () => {
  const source = completeSofortmeldung();
  const { questionnaire, reports } = prefillFrom(
    createQuestionnaire(OTHER_ID, personalfragebogen),
    personalfragebogen,
    source.questionnaire,
    source.form,
  );

  it('takes over the person data and the employer data by field id', () => {
    const person = reports.find((r) => r.role === 'person');
    const employer = reports.find((r) => r.role === 'arbeitgeber');
    expect(person?.applied).toEqual(
      expect.arrayContaining([
        'familienname',
        'vorname',
        'geburtsdatum',
        'versicherungsnummer',
        'wohnort',
      ]),
    );
    expect(employer?.applied).toEqual(
      expect.arrayContaining([
        'agFirma',
        'agBetriebsnummer',
        'agFamilienname',
        'agBeschaeftigungsbeginn',
      ]),
    );
    expect(person?.skipped).toEqual([]);
    expect(currentPart(questionnaire, 'person')).toMatchObject({
      status: 'draft',
      data: { familienname: 'Müller-Lüdenscheidt', geburtsdatum: '1990-05-17' },
    });
  });

  it('leaves the new questionnaire to be checked and signed — nothing is sealed', () => {
    expect(currentPart(questionnaire, 'person')?.seal).toBeUndefined();
    expect(currentPart(questionnaire, 'arbeitgeber')?.status).toBe('draft');
    expect(questionnaire.questionnaireId).toBe(OTHER_ID);
  });
});

describe('prefillFrom — last month into a new questionnaire of the same form', () => {
  /** The table form with month values: the children's relationship column and remarks reset. */
  function monthly(): RegisteredForm {
    const definition = structuredClone(tableForm().definition);
    const personal = definition.sections[0];
    const table = personal?.fields.find((f) => f.id === 'kinder');
    const column = table?.columns?.find((c) => c.id === 'kindVerhaeltnis');
    const remarks = personal?.fields.find((f) => f.id === 'bemerkungen');
    if (!column || !remarks) throw new Error('fixture changed');
    column.carryOver = false;
    remarks.carryOver = false;
    definition.version = '1.5.0';
    return { definition, definitionHash: definitionHash(definition) };
  }

  const form = monthly();
  const lastMonth = () => {
    let q = ok(startPart(createQuestionnaire(OTHER_ID, form), form, 'person'));
    q = Object.entries(PERSON_VALUES).reduce(
      (acc, [id, raw]) => ok(setValue(acc, form, 'person', id, raw)),
      q,
    );
    q = ok(
      setValue(q, form, 'person', 'kinder', [
        {
          rowId: 'r1',
          kindName: 'Anna',
          kindGeburtsdatum: '01.02.2015',
          kindVerhaeltnis: 'leiblich',
        },
      ]),
    );
    return ok(sealPart(q, form, 'person', personSealInput({ nonce: NONCE_PERSON })));
  };

  it('keeps carried-over answers and table rows, leaves month values empty', () => {
    const { questionnaire, reports } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', form),
      form,
      lastMonth(),
      form,
    );
    const data = currentPart(questionnaire, 'person')?.data ?? {};
    expect(data.nachname).toBe('Musterfrau');
    expect(data.bemerkungen).toBeUndefined();
    expect(data.kinder).toEqual([
      { rowId: 'r1', kindName: 'Anna', kindGeburtsdatum: '2015-02-01', kindVerhaeltnis: null },
    ]);
    expect(reports[0]?.applied).not.toContain('bemerkungen');
  });

  it('keeps answers already given and does not touch a sealed part', () => {
    let target = ok(
      startPart(createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', form), form, 'person'),
    );
    target = ok(setValue(target, form, 'person', 'nachname', 'Anders'));
    const kept = prefillFrom(target, form, lastMonth(), form);
    expect(currentPart(kept.questionnaire, 'person')?.data.nachname).toBe('Anders');
    expect(kept.reports[0]?.kept).toContain('nachname');

    const sealedTarget = lastMonth();
    const untouched = prefillFrom(sealedTarget, form, lastMonth(), form);
    expect(untouched.reports[0]?.untouched).toContain('schon abgeschlossen');
    expect(untouched.questionnaire).toBe(sealedTarget);
  });
});

describe('prefillFrom — preselections and roles without data', () => {
  const sofort = sofortmeldung;
  /** A person draft with a birth name: the preselected "Ja" was changed to "Nein". */
  const source = () => {
    let s = must(enterRole(startSession(sofort, OTHER_ID), 'person'));
    s = must(answer(s, 'familienname', 'Neumann'));
    s = must(answer(s, 'geburtsnameWieFamilienname', false));
    s = must(answer(s, 'geburtsname', 'Altmann'));
    return s.questionnaire;
  };

  it('replaces a preselection with the other file’s answer, so the follow-up is filled too', () => {
    const { questionnaire, reports } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', sofort),
      sofort,
      source(),
      sofort,
    );
    expect(currentPart(questionnaire, 'person')?.data).toMatchObject({
      geburtsnameWieFamilienname: false,
      geburtsname: 'Altmann',
    });
    expect(reports[0]?.skipped).toEqual([]);
    expect(reports[0]?.kept).toEqual([]);
  });

  it('starts no empty draft for a role the other file has nothing for', () => {
    const employerOnlySource = employerOnly().questionnaire;
    const target = createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', personalfragebogen);
    const { questionnaire } = prefillFrom(target, personalfragebogen, employerOnlySource, sofort);
    expect(currentPart(questionnaire, 'person')).toBeUndefined();
    expect(currentPart(questionnaire, 'arbeitgeber')?.status).toBe('draft');
  });
});

describe('describePrefill and takeOver', () => {
  it('names counts per role, kept answers and every value not taken over with its reason', () => {
    const { lines, applied } = describePrefill(
      [
        { role: 'person', applied: ['familienname'], kept: ['vorname'], skipped: [] },
        {
          role: 'arbeitgeber',
          applied: [],
          kept: [],
          skipped: [{ fieldId: 'agFirma', reason: 'Grund X' }],
        },
        { role: 'gesetzlicherVertreter', applied: [], kept: [], skipped: [], untouched: 'fertig' },
      ],
      sofortmeldung.definition,
    );
    expect(applied).toBe(1);
    expect(lines[0]).toMatch(
      /^Beschäftigte Person: 1 Angabe übernommen, 1 vorhandene behalten \(Vornamen\)\.$/,
    );
    expect(lines.some((l) => l.includes('nicht übernommen: Grund X'))).toBe(true);
    expect(lines.at(-1)).toMatch(/: fertig$/);
  });

  it('refuses the same questionnaire and an altered file, and takes over otherwise', () => {
    const source = completeSofortmeldung();
    const target = startSession(personalfragebogen, OTHER_ID);
    const same = takeOver(startSession(sofortmeldung, source.questionnaire.questionnaireId), {
      questionnaire: source.questionnaire,
      form: source.form,
      altered: false,
    });
    expect(same).toMatchObject({ ok: false, message: expect.stringContaining('derselbe') });
    const altered = takeOver(target, { ...source, altered: true });
    expect(altered).toMatchObject({ ok: false, message: expect.stringContaining('verändert') });

    const taken = takeOver(target, { ...source, altered: false });
    if (!taken.ok) throw new Error(taken.message);
    expect(taken.applied).toBeGreaterThan(10);
    expect(taken.session.dirty).toBe(true);
    expect(taken.session.questionnaire.questionnaireId).toBe(OTHER_ID);
  });
});

describe('prefillFrom — month fields move on by one month', () => {
  function withMonths(): RegisteredForm {
    const definition = structuredClone(tableForm().definition);
    const personal = definition.sections[0];
    if (!personal) throw new Error('fixture changed');
    personal.fields.unshift({
      id: 'abrechnungsmonat',
      role: 'person',
      type: 'month',
      label: 'Abrechnungsmonat',
      required: false,
      purpose: 'Test',
      carryOver: 'nextMonth',
    });
    const table = personal.fields.find((f) => f.id === 'kinder');
    table?.columns?.push({
      id: 'kindBisMonat',
      role: 'person',
      type: 'month',
      label: 'bis Monat',
      required: false,
      purpose: 'Test',
      carryOver: 'nextMonth',
    });
    definition.version = '1.7.0';
    return { definition, definitionHash: definitionHash(definition) };
  }

  it('takes December over as January of the next year, in fields and table cells', () => {
    const form = withMonths();
    let source = ok(startPart(createQuestionnaire(OTHER_ID, form), form, 'person'));
    source = ok(setValue(source, form, 'person', 'abrechnungsmonat', '12.2026'));
    source = ok(
      setValue(source, form, 'person', 'kinder', [
        { rowId: 'r1', kindName: 'Anna', kindGeburtsdatum: '01.02.2015', kindBisMonat: '12.2026' },
      ]),
    );
    const { questionnaire } = prefillFrom(
      createQuestionnaire('8d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a', form),
      form,
      source,
      form,
    );
    const data = currentPart(questionnaire, 'person')?.data ?? {};
    expect(data.abrechnungsmonat).toBe('2027-01');
    expect(data.kinder).toEqual([
      {
        rowId: 'r1',
        kindName: 'Anna',
        kindGeburtsdatum: '2015-02-01',
        kindVerhaeltnis: null,
        kindBisMonat: '2027-01',
      },
    ]);
  });
});
