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
      'bicPasstNichtZurIban',
      'geringfuegigEntlohnt',
      'geringfuegigNebenKurzfristigen',
      'hoechstensGeringfuegigkeitsgrenze',
      'hoechstensGeringverdienergrenze',
      'imUebergangsbereich',
      'inSpaeteremMonat',
      'keinArbeitsentgelt',
      'kuerzerAlsEineWoche',
      'kuerzerAlsZehnWochen',
      'kurzfristigBefristetBisDreiMonate',
      'kurzfristigGegeben',
      'kurzfristigGegebenBisGeringfuegigkeitsgrenze',
      'listeneintragNichtGueltig',
      'minijobNebenHauptbeschaeftigung',
      'nichtKurzfristigGegeben',
      'nichtKurzfristigGegebenBisGeringfuegigkeitsgrenze',
      'plzAuslandFormat',
      'regelaltersgrenzeErreicht',
      'regelaltersgrenzeInnerhalbEinesJahres',
      'regelaltersgrenzeNichtErreicht',
      'spaeterAls',
      'ueberBeitragsbemessungsgrenze',
      'ueberGeringfuegigkeitsgrenze',
      'ueberMassgeblicheJahresarbeitsentgeltgrenze',
      'versicherungsnummerWeichtAb',
      'weitererMinijobNebenJaegFreierHauptbeschaeftigung',
      'weitererMinijobNebenJaegFreierHauptbeschaeftigungBisGrenze',
      'weitererMinijobUeberJaeg',
      'werkstudentenprivileg',
      'werkstudentenprivilegNachArbeitszeit',
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

// 2026-11-02, GfR 2026 B 2.2.4.1 and example 36 (official example GFR-36b).
describe('a later calendar month', () => {
  const later = (a: unknown, b: unknown) =>
    HINT_TESTS.inSpaeteremMonat?.run([a as never, b as never]);

  it('compares months, not days, and names the start of the effect', () => {
    expect(later('2026-05-31', '2026-05-03')?.holds).toBe(false);
    expect(later('2026-04-20', '2026-05-03')?.holds).toBe(false);
    expect(later('2026-06-01', '2026-05-31')).toEqual({
      holds: true,
      detail: ['Wirkt ab 01.06.2026.'],
    });
    expect(later('2027-01-02', '2026-12-31')?.holds).toBe(true);
    expect(later(null, '2026-05-03')).toBeUndefined();
  });
});

// 2026-11-03, bug: "höchstens zehn Wochen" gave the reduced KV rate at exactly 70 days, where four
// weeks of waiting leave six weeks of continued pay (Besprechungsergebnis 12.06.2008, TOP 3: "kürzeren
// Zeitraum als zehn Wochen"). A main employment pays Krankengeld (GfR 2026, Beispiel 40 → 1-1-1-1),
// one resting in parental leave does not (Beispiel 4b → 3-1-1-1).
describe('limited in advance to less than ten weeks', () => {
  const short = (until: string, arts: unknown = null, leave: unknown = false) =>
    HINT_TESTS.kuerzerAlsZehnWochen?.run([
      '2026-08-01',
      until as never,
      arts as never,
      leave as never,
    ]);

  it('counts the days of the contract and stops before the tenth week ends', () => {
    expect(short('2026-10-08')).toEqual({ holds: true, detail: ['Dauer: 69 Tage.'] });
    expect(short('2026-10-09')).toEqual({ holds: false, detail: ['Dauer: 70 Tage.'] });
    expect(short('2026-08-20')?.holds).toBe(true);
  });

  it('gives no reduced rate next to a main employment, unless it rests in parental leave', () => {
    expect(short('2026-09-20', ['svpflichtig'])?.holds).toBe(false);
    expect(short('2026-09-20', ['ausbildung'])?.holds).toBe(false);
    expect(short('2026-09-20', ['minijob', 'kurzfristig'])?.holds).toBe(true);
    expect(short('2026-09-20', ['svpflichtig'], true)?.holds).toBe(true);
  });

  it('needs both dates', () => {
    expect(short('')).toBeUndefined();
    expect(HINT_TESTS.kuerzerAlsZehnWochen?.run([null, null, null, null])).toBeUndefined();
  });
});

// 2026-11-03, group K (TK FI Studierende 2026, Beispiel 6 = KK-TK-04): a student whose job the
// employer chose as Minijob or "sv-pflichtig" is a Werkstudent at most 20 hours a week with the other
// jobs; the hours come from the working-time answers. Arguments: model, weekly hours, Monday–Sunday,
// on-call weekly hours, monthly hours, yearly hours, fixed term, start, until, over 20 in the last 12
// months, hours of the other jobs.
describe('the Werkstudentenprivileg after the working time', () => {
  const run = (model: string, hours: Record<string, string>, others: string[] = []) => {
    const at = (key: string) => hours[key] ?? null;
    return HINT_TESTS.werkstudentenprivilegNachArbeitszeit?.run([
      model,
      at('woche'),
      ...['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'].map(at),
      at('abruf'),
      at('monat'),
      at('jahr'),
      false,
      '2026-09-01',
      null,
      false,
      others,
    ] as never);
  };

  it('adds the hours of the other jobs (5 + 7 = 12)', () => {
    expect(run('wechselnd', { woche: '5.00' }, ['7.00'])).toEqual({
      holds: true,
      detail: [
        '5 + 7 Stunden anderer Beschäftigungen = 12 Wochenstunden: höchstens 20 (Rundschreiben Studenten und Praktikanten Tz. A 1.2.4 a).',
      ],
    });
    expect(run('wechselnd', { woche: '15.00' }, ['7.00'])?.holds).toBe(false);
  });

  it('reads the hours of each working-time model', () => {
    expect(run('festeTage', { mo: '4.00', mi: '4.00', fr: '4.00' })?.detail[0]).toMatch(/^12 /);
    expect(run('abruf', { abruf: '10.00' })?.holds).toBe(true);
    expect(run('monatsstunden', { monat: '86.67' })?.detail[0]).toMatch(/^20 /);
    expect(run('monatsstunden', { monat: '100.00' })?.holds).toBe(false);
    expect(run('jahresarbeitszeit', { jahr: '1040.00' })?.detail[0]).toMatch(/^20 /);
    expect(run('gleitzeit', { woche: '20.50' })?.holds).toBe(false);
  });

  it('gives no proposal without hours, and none for shifts or partial retirement', () => {
    expect(run('wechselnd', {})).toBeUndefined();
    expect(run('festeTage', {})).toBeUndefined();
    expect(run('schicht', { woche: '10.00' })).toBeUndefined();
    expect(run('altersteilzeit', { woche: '10.00' })).toBeUndefined();
    expect(run('', { woche: '10.00' })).toBeUndefined();
  });
});

// 2026-11-02, Geringfügigkeits-Richtlinien 2026 B 2.3 (official examples GFR-03b2, -04c, -04dB, -37,
// -40B, -42, -45B, -48). Arguments as in the definition: start, end, working days, framework agreement,
// fixed term, earlier jobs (kind, from, until, days, pay), pay, other current jobs.
describe('the short-term tests', () => {
  interface Facts {
    bis?: string;
    tage?: string;
    rahmen?: boolean;
    befristet?: boolean;
    frueher?: [string, string, string, string | null, string | null][];
    pay?: string;
    jobs?: [string, string, string, string | null][];
  }
  const args = (f: Facts) => {
    const vb = f.frueher ?? [];
    const jobs = f.jobs ?? [];
    return [
      '2026-04-16',
      f.bis ?? '2026-04-30',
      f.tage ?? '11',
      f.rahmen ?? false,
      f.befristet ?? true,
      vb.map((r) => r[0]),
      vb.map((r) => r[1]),
      vb.map((r) => r[2]),
      vb.map((r) => r[3]),
      vb.map((r) => r[4]),
      f.pay ?? '380.00',
      null,
      null,
      null,
      jobs.map((r) => r[0]),
      jobs.map((r) => r[1]),
      jobs.map((r) => r[2]),
      jobs.map((r) => r[3]),
    ] as never[];
  };
  const run = (fn: string, f: Facts) => {
    const result = HINT_TESTS[fn]?.run(args(f));
    return { holds: result?.holds, uncertain: result?.uncertain === true };
  };
  const yes = { holds: true, uncertain: false };
  const no = { holds: false, uncertain: false };

  it('keeps a short-term job within the limits', () => {
    expect(run('kurzfristigGegeben', {})).toEqual(yes);
    expect(run('kurzfristigGegebenBisGeringfuegigkeitsgrenze', {})).toEqual(yes);
  });

  it('is no short-term job above both time limits or with a framework agreement without end', () => {
    expect(run('kurzfristigGegeben', { bis: '2026-09-30', tage: '71' })).toEqual(no);
    expect(run('kurzfristigGegeben', { rahmen: true, befristet: false })).toEqual(no);
  });

  it('adds the pay of a short-term job in the same month for a person berufsmäßig by status (4c)', () => {
    const april: Facts = { frueher: [['kurzfristig', '2026-04-01', '2026-04-15', '11', '320.00']] };
    expect(run('kurzfristigGegebenBisGeringfuegigkeitsgrenze', april)).toEqual(no);
    // Not berufsmäßig by status and not by earlier jobs: still short-term.
    expect(run('kurzfristigGegeben', april)).toEqual(yes);
  });

  it('adds the pay of a short-term job running at the same time (4d)', () => {
    const parallel: Facts = {
      bis: '2026-12-18',
      tage: '24',
      pay: '440.00',
      jobs: [['kurzfristig', '600.00', '2026-04-16', '2026-10-15']],
    };
    expect(run('kurzfristigGegebenBisGeringfuegigkeitsgrenze', parallel)).toEqual(no);
    expect(run('geringfuegigNebenKurzfristigen', parallel)).toEqual(no);
    // Ended before this one began: it does not count.
    const ended: Facts = {
      ...parallel,
      jobs: [['kurzfristig', '600.00', '2026-01-01', '2026-03-31']],
    };
    expect(run('kurzfristigGegebenBisGeringfuegigkeitsgrenze', ended)).toEqual(yes);
  });

  it('is berufsmäßig from earlier jobs only with pay above the limit (example 48)', () => {
    const earlier: Facts = {
      bis: '2026-05-25',
      tage: '27',
      frueher: [['mehr', '2026-01-02', '2026-04-15', '75', null]],
    };
    expect(run('kurzfristigGegeben', { ...earlier, pay: '1400.00' })).toEqual(no);
    expect(run('kurzfristigGegeben', { ...earlier, pay: '500.00' })).toEqual(yes);
  });

  it('leaves the employer’s choice standing, with a check, when the end and days are missing', () => {
    const open = HINT_TESTS.kurzfristigGegeben?.run(
      args({}).map((value, i) => (i === 1 || i === 2 ? null : value)) as never[],
    );
    expect(open).toMatchObject({ holds: true, uncertain: true });
    expect(open?.detail.join(' ')).toContain('Ende oder Arbeitstage der Aushilfe fehlen');
  });

  it('is a Minijob when no longer short-term and the pay is within the limit (4c)', () => {
    expect(run('geringfuegigNebenKurzfristigen', {})).toEqual(yes);
    expect(run('geringfuegigNebenKurzfristigen', { pay: '1400.00' })).toEqual(no);
  });
});

// 2026-11-02, Geringfügigkeits-Richtlinien 2026 B 2.2.2.8 and examples 25, 26 (GFR-25C, -26C,
// D-JAEGMJ).
describe('Minijobs next to a main job above the JAEG', () => {
  const rows = (main: string, first: string) => [
    ['svpflichtig', 'minijob'],
    [main, first],
    ['2020-01-01', '2026-07-01'],
  ];
  const run = (fn: string, own: string, main: string, first: string) => {
    const [arts, pays, starts] = rows(main, first);
    return HINT_TESTS[fn]?.run([
      own,
      null,
      null,
      null,
      '2026-09-01',
      arts as never,
      pays as never,
      starts as never,
      null,
    ])?.holds;
  };
  const KV = 'weitererMinijobNebenJaegFreierHauptbeschaeftigung';
  const PV = 'weitererMinijobNebenJaegFreierHauptbeschaeftigungBisGrenze';

  it('frees a second Minijob in the KV when the main job is above the JAEG (example 25)', () => {
    expect(run(KV, '300.00', '7000.00', '300.00')).toBe(true);
    expect(run(PV, '300.00', '7000.00', '300.00')).toBe(true);
  });

  it('keeps the PV when the Minijobs together are above the limit (example 26)', () => {
    expect(run(KV, '300.00', '7000.00', '400.00')).toBe(true);
    expect(run(PV, '300.00', '7000.00', '400.00')).toBe(false);
  });

  it('does not apply below the JAEG, to the first Minijob or above the Minijob limit', () => {
    expect(run(KV, '300.00', '6450.00', '300.00')).toBe(false);
    const first = HINT_TESTS[KV]?.run([
      '300.00',
      null,
      null,
      null,
      '2026-09-01',
      ['svpflichtig'] as never,
      ['7000.00'] as never,
      ['2020-01-01'] as never,
      null,
    ]);
    expect(first?.holds).toBe(false);
    expect(run(KV, '650.00', '7000.00', '300.00')).toBe(false);
  });

  it('leaves the first Minijob out of the JAEG sum (B 2.2.2.8)', () => {
    const jaeg = (others: string[], arts: string[], starts: string[]) =>
      HINT_TESTS.ueberMassgeblicheJahresarbeitsentgeltgrenze?.run([
        '6100.00',
        null,
        others as never,
        null,
        null,
        null,
        '2026-03-01',
        arts as never,
        starts as never,
      ])?.holds;
    // 73.200 € + a first Minijob of 450 €: not added, below 77.400 €.
    expect(jaeg(['450.00'], ['minijob'], ['2025-01-01'])).toBe(false);
    // A second job subject to insurance is added.
    expect(jaeg(['450.00'], ['svpflichtig'], ['2025-01-01'])).toBe(true);
  });
});

// 2026-11-02, Geringfügigkeits-Richtlinien 2026 example 14 (GFR-14): Entgeltumwandlung up to 4 % of
// the BBG RV (2026: 338,00 € a month) is no Arbeitsentgelt.
describe('Entgeltumwandlung in the pay tests', () => {
  const within = (pay: string, kind: string | null, beitrag: string[], zuschuss: string[]) =>
    HINT_TESTS.hoechstensGeringfuegigkeitsgrenze?.run([
      pay,
      null,
      null,
      null,
      '2026-06-01',
      kind as never,
      beitrag as never,
      zuschuss as never,
    ]);

  it('lowers the pay by the converted amount (example 14: 720 € − 120 €)', () => {
    const result = within('720.00', 'umwandlung', ['120.00'], ['0.00']);
    expect(result?.holds).toBe(true);
    expect(result?.detail.join(' ')).toContain('Entgeltumwandlung 120,00 € im Monat abgezogen');
  });

  it('takes off only the contribution minus the employer subsidy', () => {
    expect(within('720.00', 'beides', ['140.00'], ['20.00'])?.holds).toBe(true);
    expect(within('720.00', 'beides', ['140.00'], ['30.00'])?.holds).toBe(false);
  });

  it('takes off nothing for an employer-financed bAV or none', () => {
    expect(within('720.00', 'arbeitgeber', ['120.00'], ['120.00'])?.holds).toBe(false);
    expect(within('720.00', 'keine', [], [])?.holds).toBe(false);
    expect(within('600.00', null, [], [])?.holds).toBe(true);
  });

  it('caps the free part at 4 % of the BBG RV and marks more as uncertain', () => {
    const capped = within('940.00', 'umwandlung', ['400.00'], ['0.00']);
    // 940 € − 338 € = 602 €: within; the 62 € above the cap stay Arbeitsentgelt.
    expect(capped).toMatchObject({ holds: true, uncertain: true });
    expect(within('942.00', 'umwandlung', ['400.00'], ['0.00'])?.holds).toBe(false);
  });

  it('is uncertain when a contribution is missing', () => {
    expect(
      within('720.00', 'umwandlung', [null as never, '120.00'], ['0.00', '0.00']),
    ).toMatchObject({
      holds: true,
      uncertain: true,
    });
  });
});

// 2026-11-02, Rundschreiben Studenten und Praktikanten Tz. A 1.2.4 and C 1 (ST-01, -02A, -04, -KF,
// -WS, -WSMJ, -SF, -FZPMJ). Arguments: semester breaks only, hours, edges of the day, fixed term,
// start, until, more than 20 hours in the last 12 months, hours of the other jobs.
describe('the Werkstudent tests', () => {
  const privileg = (
    ferien: boolean | null,
    stunden: string | null,
    rand: boolean | null,
    befristet: boolean | null,
    bis: string | null,
    ueber20: boolean | null = false,
    andere: string[] = [],
  ) => {
    const result = HINT_TESTS.werkstudentenprivileg?.run([
      ferien,
      stunden,
      rand,
      befristet,
      '2026-04-01',
      bis,
      ueber20,
      andere as never,
    ]);
    return { holds: result?.holds, uncertain: result?.uncertain === true };
  };
  const yes = { holds: true, uncertain: false };
  const no = { holds: false, uncertain: false };

  it.each<[string, ReturnType<typeof privileg>, typeof yes]>([
    ['only in the semester breaks, any hours', privileg(true, '40.00', null, false, null), yes],
    ['exactly 20 hours', privileg(false, '20.00', null, false, null), yes],
    [
      '20,01 hours, not at the edges of the day (example 4)',
      privileg(false, '20.01', false, true, '2026-05-31'),
      no,
    ],
    [
      '18 hours + 7 in a Minijob (example 2)',
      privileg(false, '18.00', null, false, null, false, ['7.00']),
      no,
    ],
    [
      '25 hours at weekends, without end (example 1)',
      privileg(false, '25.00', true, false, null),
      no,
    ],
    [
      '25 hours at weekends, 26 weeks exactly',
      privileg(false, '25.00', true, true, '2026-09-29'),
      yes,
    ],
    [
      '25 hours at weekends, 26 weeks and a day',
      privileg(false, '25.00', true, true, '2026-09-30'),
      no,
    ],
    ['hours missing', privileg(false, null, null, false, null), { holds: true, uncertain: true }],
    [
      'at weekends within 26 weeks, but over 20 hours elsewhere this year',
      privileg(false, '25.00', true, true, '2026-06-30', true),
      { holds: true, uncertain: true },
    ],
  ])('%s', (_label, actual, expected) => {
    expect(actual).toEqual(expected);
  });

  it('takes a Werkstudent job of at most three months as short-term (Tz. C 1)', () => {
    const run = (bis: string | null, pay = '2400.00') =>
      HINT_TESTS.kurzfristigBefristetBisDreiMonate?.run([
        '2026-08-01',
        bis,
        null,
        null,
        true,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        pay,
        null,
        null,
        null,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        null,
        [] as never,
        [] as never,
      ])?.holds;
    expect(run('2026-09-30')).toBe(true);
    expect(run('2026-10-31')).toBe(true);
    expect(run('2026-11-01')).toBe(false);
    expect(run(null)).toBe(false);
  });
});

// 2026-11-02, TK Beratungsblatt Minijobs examples 7 and 12 (KK-TK-33, KK-TK-37).
describe('found by the insurer cases', () => {
  it('is no short-term job without a fixed term (GfR B 2.3, 2.4)', () => {
    const run = (befristet: boolean) =>
      HINT_TESTS.kurzfristigGegeben?.run([
        '2026-07-01',
        '2026-07-31',
        '23',
        false,
        befristet,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        '1500.00',
        null,
        null,
        null,
        [] as never,
        [] as never,
        [] as never,
        [] as never,
        null,
        [] as never,
        [] as never,
        null,
        null,
        null,
      ]);
    expect(run(true)?.holds).toBe(true);
    const open = run(false);
    expect(open?.holds).toBe(false);
    expect(open?.detail.join(' ')).toContain('Nicht im Voraus befristet');
  });

  it('keeps a further Minijob KV-pflichtig when only it lifts the main job above the JAEG (B 2.2.2.8)', () => {
    const run = (main: string) =>
      HINT_TESTS.weitererMinijobUeberJaeg?.run([
        '400.00',
        null,
        null,
        null,
        '2026-07-01',
        ['svpflichtig', 'minijob'] as never,
        [main, '300.00'] as never,
        ['2020-01-01', '2026-05-01'] as never,
        null,
        [] as never,
        [] as never,
        null,
      ])?.holds;
    // 76.800 € + 4.800 € = 81.600 € > 77.400 €; the first Minijob (300 €) does not count.
    expect(run('6400.00')).toBe(true);
    // 6.000 € a month: 72.000 + 4.800 = 76.800 €, still within.
    expect(run('6000.00')).toBe(false);
    // Above already without it: the other case (KV-free main job).
    expect(run('7000.00')).toBe(false);
  });
});

describe('the Versicherungsnummer against the person (Tobias 2026-11-03: only a hint)', () => {
  // 65 170590 M 520: born 17.05.1990, Geburtsname with M, serial 52 (a woman). Fictitious.
  const run = (
    number: string,
    birth: string,
    birthName: string | null,
    name: string,
    gender: string,
  ) => HINT_TESTS.versicherungsnummerWeichtAb?.run([number, birth, birthName, name, gender]);

  it('is quiet when date, initial and serial fit', () => {
    expect(run('65170590M520', '1990-05-17', null, 'Muster', 'weiblich')).toEqual({
      holds: false,
      detail: [],
    });
    expect(run('65170590M520', '1990-05-17', 'Meyer', 'Schulz', 'divers')?.holds).toBe(false);
    expect(run('65170590M520', '1990-05-17', 'Meyer', 'Schulz', 'unbestimmt')?.holds).toBe(false);
    expect(run('65170590M020', '1990-05-17', 'Meyer', 'Schulz', 'maennlich')?.holds).toBe(false);
  });

  it('names a birth date that differs', () => {
    expect(run('65170590M520', '1990-05-18', null, 'Muster', 'weiblich')?.detail).toEqual([
      'Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.',
    ]);
    expect(run('65170591M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(true);
    expect(run('65170690M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(true);
  });

  it('accepts the dates the Rundschreiben allows (Tz. 3.1.1.2)', () => {
    // Serial numbers used up: the day raised by 32, if need be twice.
    expect(run('65490590M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(false);
    expect(run('65810590M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(false);
    // No day or month in the passport.
    expect(run('65000590M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(false);
    expect(run('65000090M520', '1990-05-17', null, 'Muster', 'weiblich')?.holds).toBe(false);
  });

  it('takes the Geburtsname, else the Familienname, with umlauts resolved', () => {
    expect(run('65170590M520', '1990-05-17', 'Schulz', 'Muster', 'weiblich')?.detail).toEqual([
      'Buchstabe in der Versicherungsnummer: M; Anfangsbuchstabe des Geburtsnamens: S.',
    ]);
    expect(run('65170590O520', '1990-05-17', null, 'Özdemir', 'weiblich')?.holds).toBe(false);
    expect(run('65170590E520', '1990-05-17', 'Écrivain', 'Muster', 'weiblich')?.holds).toBe(false);
    // A Vorsatzwort comes first; the initial of a later part of the name is no hint either.
    expect(run('65170590M520', '1990-05-17', 'von Müller', 'Schulz', 'weiblich')?.holds).toBe(
      false,
    );
    expect(run('65170590M520', '1990-05-17', 'Lang-Müller', 'Schulz', 'weiblich')?.holds).toBe(
      false,
    );
    // Not a Latin letter: nothing to compare.
    expect(run('65170590M520', '1990-05-17', 'Øster', 'Schulz', 'weiblich')?.holds).toBe(false);
  });

  it('compares the serial with the gender (Tz. 3.1.1.4)', () => {
    expect(run('65170590M520', '1990-05-17', null, 'Muster', 'maennlich')?.detail).toEqual([
      'Seriennummer 52: 50 bis 99 (Frauen, divers, unbestimmt).',
    ]);
    expect(run('65170590M490', '1990-05-17', null, 'Muster', 'weiblich')?.detail).toEqual([
      'Seriennummer 49: 00 bis 49 (Männer).',
    ]);
  });

  it('lists every difference and skips missing answers', () => {
    expect(run('65170590M520', '1991-05-17', 'Schulz', 'Muster', 'maennlich')?.detail).toHaveLength(
      3,
    );
    expect(
      HINT_TESTS.versicherungsnummerWeichtAb?.run([null, null, null, null, null]),
    ).toBeUndefined();
    expect(
      HINT_TESTS.versicherungsnummerWeichtAb?.run(['65170590M520', null, null, null, null]),
    ).toEqual({ holds: false, detail: [] });
  });

  it('is a check hint of the Personalfragebogen, not an error of the field', () => {
    const q = answers({
      geburtsdatum: '18.05.1990',
      familienname: 'Muster',
      geschlecht: 'weiblich',
      versicherungsnummer: '65 170590 M 520',
    });
    expect(ids(q)).toContain('versicherungsnummerWeichtAb');
  });
});

describe('the BIC against the IBAN', () => {
  const run = (iban: string, bic: string) => HINT_TESTS.bicPasstNichtZurIban?.run([iban, bic]);

  it('compares the country of the BIC (ISO 9362) with that of the IBAN', () => {
    expect(run('DE02120300000000202051', 'BYLADEM1001')).toEqual({ holds: false, detail: [] });
    expect(run('DE02120300000000202051', 'BYLADEM1')?.holds).toBe(false);
    expect(run('AT611904300234573201', 'BYLADEM1')).toEqual({
      holds: true,
      detail: ['Land im BIC: DE; Land der IBAN: AT.'],
    });
  });

  it('knows the territories with IBANs of another country', () => {
    expect(run('GB29NWBK60161331926819', 'ABCDJESHXXX')?.holds).toBe(false);
    expect(run('FR1420041010050500013M02606', 'ABCDRERRXXX')?.holds).toBe(false);
    expect(run('FI2112345600000785', 'ABCDAXAA')?.holds).toBe(false);
    expect(run('DE02120300000000202051', 'ABCDJESHXXX')?.holds).toBe(true);
  });

  it('skips missing answers', () => {
    expect(HINT_TESTS.bicPasstNichtZurIban?.run([null, 'BYLADEM1'])).toBeUndefined();
    expect(HINT_TESTS.bicPasstNichtZurIban?.run(['DE02120300000000202051', null])).toBeUndefined();
  });
});

describe('the postcode abroad (DEÜV Anlage 18)', () => {
  const run = (state: string, plz: string) => HINT_TESTS.plzAuslandFormat?.run([state, plz]);

  it('checks the format of the states in Anlage 18', () => {
    expect(run('Niederlande', '1234 AB')).toEqual({ holds: false, detail: [] });
    expect(run('Niederlande', '1234 ab')?.holds).toBe(false);
    expect(run('Polen', '00-950')?.holds).toBe(false);
    expect(run('Malta', 'VLT 1117')?.holds).toBe(false);
    expect(run('Kanada', 'K1A 0B1')?.holds).toBe(false);
    expect(run('Österreich', '1010')?.holds).toBe(false);
    expect(run('Österreich', '10101')).toEqual({
      holds: true,
      detail: ['Format in Österreich: NNNN (N = Ziffer, A = Buchstabe), zum Beispiel 1234.'],
    });
    expect(run('Niederlande', '1234AB')?.detail).toEqual([
      'Format in Niederlande: NNNN AA (N = Ziffer, A = Buchstabe), zum Beispiel 1234 FG.',
    ]);
    expect(run('Polen', '00950')?.holds).toBe(true);
  });

  it('says nothing for a state without a format', () => {
    expect(run('Türkei', '34000 ABC')).toBeUndefined();
    expect(HINT_TESTS.plzAuslandFormat?.run([null, '1234'])).toBeUndefined();
  });
});
