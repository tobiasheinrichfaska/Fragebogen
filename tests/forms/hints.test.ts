// Check hints (Prüfhinweise): definition rules on a fixture and the hints of the Personalfragebogen
// draft for combined answers of person and employer. Fictitious data.
import { join } from 'node:path';
import { visibleFields } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { checkHints, describeHint, HINT_TESTS } from '../../src/logic/hints';
import type { FormDefinition, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { regelaltersgrenze } from '../../src/logic/regelaltersgrenze';
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
      { status: 'arbeitslos', artLautVereinbarung: 'aushilfe' },
      { agBeschaeftigungsart: 'kurzfristig' },
    );
    expect(ids(q)).toContain('kurzfristigArbeitslos');
    const hint = checkHints(q, form.definition).find((h) => h.id === 'kurzfristigArbeitslos');
    expect(hint?.source).toContain('§ 8 Abs. 1 Nr. 2 SGB IV');
  });

  it('waits for every part a hint names', () => {
    const personOnly = answers({ status: 'arbeitslos', artLautVereinbarung: 'aushilfe' });
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
    // Born 15.03.1960: the Regelaltersgrenze falls inside 2026, so the person is asked.
    const notStated = answers(
      { geburtsdatum: '15.03.1960', ragErreicht: 'nein' },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    const hint = checkHints(notStated, form.definition).find(
      (h) => h.id === 'regelaltersgrenzeNichtAngegeben',
    );
    expect(hint?.detail).toEqual([
      'Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.',
    ]);
    const unknown = answers(
      { geburtsdatum: '15.03.1960', ragErreicht: 'unbekannt' },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    expect(ids(unknown)).toContain('regelaltersgrenzeNichtAngegeben');

    const stated = answers(
      { geburtsdatum: '15.03.1960', ragErreicht: 'ja' },
      { agBeschaeftigungsbeginn: '02.11.2026' },
    );
    expect(ids(stated)).not.toContain('regelaltersgrenzeNichtAngegeben');
    expect(ids(stated)).not.toContain('regelaltersgrenzeFalschAngegeben');

    const tooEarly = answers(
      { geburtsdatum: '15.03.1960', ragErreicht: 'ja' },
      { agBeschaeftigungsbeginn: '01.01.2026' },
    );
    expect(ids(tooEarly)).toContain('regelaltersgrenzeFalschAngegeben');

    const soon = answers(
      { geburtsdatum: '15.03.1960', ragErreicht: 'nein' },
      { agBeschaeftigungsbeginn: '01.01.2026' },
    );
    expect(ids(soon)).toContain('regelaltersgrenzeBald');
    expect(ids(soon)).not.toContain('regelaltersgrenzeNichtAngegeben');
  });

  // Tobias 2026-11-01: the Regelaltersgrenze follows from the birth date; only where the start in
  // 2026 decides it, the person is asked.
  it('asks about the Regelaltersgrenze only for birth dates where the start in 2026 decides it', () => {
    const shownFor = (geburtsdatum: string) =>
      visibleFields(form.definition, 'person', { geburtsdatum }).map((field) => field.id);
    expect(shownFor('1959-11-02')).not.toContain('ragErreicht');
    expect(shownFor('1959-11-02')).toContain('aktivrenteMonat');
    expect(shownFor('1959-11-03')).toContain('ragErreicht');
    expect(shownFor('1960-09-01')).toContain('ragErreicht');
    expect(shownFor('1960-09-02')).not.toContain('ragErreicht');
    expect(shownFor('1960-09-02')).not.toContain('aktivrenteMonat');
  });

  it('draws the limits of that range from the Regelaltersgrenze and the validity of the version', () => {
    const { validity } = form.definition;
    const ask = form.definition.sections
      .flatMap((section) => section.fields)
      .find((field) => field.id === 'ragErreicht')?.showIf;
    const limits = JSON.stringify(ask).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const [sure = '', open = ''] = limits;
    const dayAfter = (date: string) => {
      const next = new Date(`${date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString().slice(0, 10);
    };
    expect(validity).toMatchObject({ from: '2026-01-01', until: '2026-12-31' });
    const reached = (birth: string) => regelaltersgrenze(birth) ?? '';
    expect(reached(sure) <= '2026-01-01').toBe(true);
    expect(reached(dayAfter(sure)) > '2026-01-01').toBe(true);
    expect(reached(open) <= '2026-12-31').toBe(true);
    expect(reached(dayAfter(open)) > '2026-12-31').toBe(true);
  });

  it('shows no age hint while the start of employment is missing', () => {
    const q = answers({ geburtsdatum: '15.03.1960', ragErreicht: 'nein' }, {});
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
          test: { fn: 'regelaltersgrenzeErreicht', args: ['geburtsdatum', 'status'] },
          message: 'x',
        }),
      ),
    ).toContain('"status" must be a date field');
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
      'ab55Jahren',
      'andereBeschaeftigungAusbildung',
      'geringfuegigEntlohnt',
      'hoechstensGeringfuegigkeitsgrenze',
      'hoechstensGeringverdienergrenze',
      'hoechstensZehnWochen',
      'imUebergangsbereich',
      'keinArbeitsentgelt',
      'kuerzerAlsEineWoche',
      'listeneintragNichtGueltig',
      'minijobNebenHauptbeschaeftigung',
      'regelaltersgrenzeErreicht',
      'regelaltersgrenzeInnerhalbEinesJahres',
      'regelaltersgrenzeNichtErreicht',
      'spaeterAls',
      'ueberBeitragsbemessungsgrenze',
      'ueberGeringfuegigkeitsgrenze',
      'ueberMassgeblicheJahresarbeitsentgeltgrenze',
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

// Tobias 2026-11-01 (F3): Minijobs are judged together with the other jobs.
describe('the Minijob test with other jobs', () => {
  const run = (arts: unknown[], pays: unknown[], starts: unknown[], own = '450.00') =>
    HINT_TESTS.geringfuegigEntlohnt?.run([
      own,
      null,
      null,
      null,
      '2026-11-02',
      arts as never,
      pays as never,
      starts as never,
    ]);

  it('is a Minijob alone or next to short-term jobs only', () => {
    expect(run([], [], [])?.holds).toBe(true);
    expect(run(['kurzfristig'], ['2000.00'], ['2026-01-01'])?.holds).toBe(true);
  });

  it('adds the Minijobs up without a main job', () => {
    expect(run(['minijob'], ['150.00'], ['2025-01-01'])?.holds).toBe(true);
    expect(run(['minijob'], ['154.00'], ['2025-01-01'])?.holds).toBe(false);
    expect(run(['minijob'], [null], ['2025-01-01'])?.uncertain).toBe(true);
  });

  it('keeps only the first Minijob next to a main job (also a training) free', () => {
    expect(run(['svpflichtig'], ['3000.00'], ['2020-01-01'])?.holds).toBe(true);
    expect(
      run(['ausbildung', 'minijob'], ['900.00', '100.00'], ['2024-08-01', '2025-01-01'])?.holds,
    ).toBe(false);
    expect(
      run(['svpflichtig', 'minijob'], ['3000.00', '100.00'], ['2020-01-01', '2027-01-01'])?.holds,
    ).toBe(true);
    // Started the same day: not earlier, this one counts as the first.
    expect(
      run(['svpflichtig', 'minijob'], ['3000.00', '100.00'], ['2020-01-01', '2026-11-02'])?.holds,
    ).toBe(true);
    expect(
      run(['svpflichtig', 'minijob'], ['3000.00', '100.00'], ['2020-01-01', null])?.uncertain,
    ).toBe(true);
  });

  it('is no Minijob when its own pay is above the limit', () => {
    expect(run([], [], [], '650.00')?.holds).toBe(false);
  });

  it('frees a Minijob next to a main job from the unemployment insurance', () => {
    const next = (arts: unknown[]) =>
      HINT_TESTS.minijobNebenHauptbeschaeftigung?.run([
        '450.00',
        null,
        null,
        null,
        '2026-11-02',
        arts as never,
        [] as never,
        [] as never,
      ])?.holds;
    expect(next(['svpflichtig', 'minijob'])).toBe(true);
    expect(next(['minijob'])).toBe(false);
  });
});

// 2026-11-02, Rundschreiben Übergangsbereich 20.12.2022 Tz. 4.2.2 (official examples GFR-19A, GFR-21,
// GFR-23B, UEB-03, UEB-KF): only the pay of other jobs subject to insurance counts.
describe('the Übergangsbereich test with other jobs', () => {
  type Row = [string, string | null, string | null];
  const run = (own: string, rows: Row[]) => {
    const result = HINT_TESTS.imUebergangsbereich?.run([
      own,
      null,
      null,
      null,
      '2026-03-01',
      rows.map((r) => r[0]) as never,
      rows.map((r) => r[1]) as never,
      rows.map((r) => r[2]) as never,
    ]);
    return { holds: result?.holds, uncertain: result?.uncertain === true };
  };
  const inside = { holds: true, uncertain: false };
  const outside = { holds: false, uncertain: false };

  it.each<[string, string, Row[], { holds: boolean; uncertain: boolean }]>([
    ['alone at 1.500 €', '1500.00', [], inside],
    ['alone at 2.000,01 €', '2000.01', [], outside],
    [
      'main job 1.800 € with the first Minijob 600 €',
      '1800.00',
      [['minijob', '600.00', '2025-01-01']],
      inside,
    ],
    [
      'main job 1.800 € with a first and a second Minijob (the second counts)',
      '1800.00',
      [
        ['minijob', '600.00', '2025-01-01'],
        ['minijob', '300.00', '2025-06-01'],
      ],
      outside,
    ],
    [
      '1.500 € next to a short-term job of 800 €',
      '1500.00',
      [['kurzfristig', '800.00', '2026-03-01']],
      inside,
    ],
    [
      '800 € next to a civil servant’s pay',
      '800.00',
      [['beamter', '4000.00', '2010-01-01']],
      inside,
    ],
    [
      '1.500 € next to another job subject to insurance of 800 €',
      '1500.00',
      [['svpflichtig', '800.00', '2020-01-01']],
      outside,
    ],
    [
      'a Minijob 400 € added to another one without a main job (civil servant)',
      '400.00',
      [
        ['beamter', '4000.00', '2010-01-01'],
        ['minijob', '300.00', '2025-01-01'],
      ],
      inside,
    ],
    [
      'a second Minijob 310 € next to a main job 1.200 € and the first Minijob 400 €',
      '310.00',
      [
        ['svpflichtig', '1200.00', '2015-01-01'],
        ['minijob', '400.00', '2026-01-01'],
      ],
      inside,
    ],
    [
      'a job abroad is left out, uncertain',
      '1500.00',
      [['ausland', '800.00', '2020-01-01']],
      { holds: true, uncertain: true },
    ],
    [
      'a Minijob without start next to the main job, uncertain',
      '1800.00',
      [['minijob', '600.00', null]],
      { holds: true, uncertain: true },
    ],
    [
      'another job without pay, uncertain',
      '1500.00',
      [['svpflichtig', null, '2020-01-01']],
      { holds: true, uncertain: true },
    ],
  ])('%s', (_label, own, rows, expected) => {
    expect(run(own, rows)).toEqual(expected);
  });

  it('names what it counts and what not', () => {
    const detail = HINT_TESTS.imUebergangsbereich?.run([
      '1500.00',
      null,
      null,
      null,
      '2026-03-01',
      ['kurzfristig', 'beamter'] as never,
      ['800.00', '4000.00'] as never,
      ['2026-03-01', '2010-01-01'] as never,
    ])?.detail;
    expect(detail?.join(' ')).toContain(
      'nicht mitgerechnet: kurzfristige Beschäftigung, Bezüge als Beamtin oder Beamter',
    );
  });

  it('finds a training among the other jobs', () => {
    const run2 = (arts: string[]) =>
      HINT_TESTS.andereBeschaeftigungAusbildung?.run([arts as never])?.holds;
    expect(run2(['svpflichtig', 'ausbildung'])).toBe(true);
    expect(run2(['svpflichtig', 'minijob'])).toBe(false);
    expect(run2([])).toBe(false);
  });
});

// 2026-11-02, DEÜV Anlage 2 (121: "Dies gilt nicht für Auszubildende ohne Arbeitsentgelt") and
// RS Studenten und Praktikanten Teil C (official examples ST-VP0, D-102-0).
describe('training without pay', () => {
  const low = (pay: unknown) => HINT_TESTS.hoechstensGeringverdienergrenze?.run([pay as never]);
  const none = (fixed: unknown, expected: unknown = null) =>
    HINT_TESTS.keinArbeitsentgelt?.run([fixed as never, expected as never]);

  it('is no low earner (121) at 0 €, from 0,01 € to 325 € it is', () => {
    expect(low('0.00')?.holds).toBe(false);
    expect(low(['0.00'])?.holds).toBe(false);
    expect(low('0.01')?.holds).toBe(true);
    expect(low(['325.00', '400.00'])?.holds).toBe(true);
    expect(low('325.01')?.holds).toBe(false);
    expect(low(null)).toBeUndefined();
  });

  it('finds no pay in the amount, the first row of a table or the expected month', () => {
    expect(none('0.00')?.holds).toBe(true);
    expect(none(['0.00', '300.00'])?.holds).toBe(true);
    expect(none(null, '0.00')?.holds).toBe(true);
    expect(none('0.01')?.holds).toBe(false);
    expect(none(['300.00'])?.holds).toBe(false);
    expect(none(null, null)).toBeUndefined();
  });
});
