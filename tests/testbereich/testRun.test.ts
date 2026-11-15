// A tester's run without free text (Tobias 2026-11-15: „es zählt nur noch, welche Tests bestehen
// oder nicht bestehen und wenn sie nicht bestehen, in welchen Schritten“; Testumgebung
// docs/testbericht.md): result, measured seconds and failed steps per test, the report to send.
import {
  MAX_SECONDS,
  changedSince,
  checkpoint,
  decodeRun,
  elapsedSeconds,
  emptyRun,
  leaveTest,
  markReported,
  minutesOf,
  missingSteps,
  openTest,
  reportPlan,
  resetTest,
  sendOutcome,
  setResult,
  setStep,
  testTime,
  totalsOf,
  type ReportBuild,
  type TestRun,
} from '../../src/logic/testRun';

const T0 = '2026-11-15T09:00:00.000Z';
const at = (minutes: number, seconds = 0) =>
  new Date(Date.parse(T0) + minutes * 60_000 + seconds * 1000).toISOString();
const BUILD: ReportBuild = { app: 'fragebogen', version: '0.1.0', stand: 'd4ce28b0a1b2' };

describe('the clock', () => {
  it('runs while the test is open, pauses when it is left and ends with the result', () => {
    let run = openTest(emptyRun(), 'MT-13', T0);
    expect(elapsedSeconds(run.entries['MT-13'], at(2))).toBe(120);
    run = leaveTest(run, 'MT-13', at(2));
    expect(run.entries['MT-13']).toEqual({ seconds: 120 });
    expect(elapsedSeconds(run.entries['MT-13'], at(30))).toBe(120); // left: no time passes
    run = openTest(run, 'MT-13', at(30));
    run = setResult(run, 'MT-13', 'bestanden', at(31, 30));
    expect(run.entries['MT-13']).toMatchObject({ seconds: 210, result: 'bestanden' });
    expect(run.entries['MT-13']?.openedAt).toBeUndefined();
    // Opened again after the result: the time stays as it was.
    run = openTest(run, 'MT-13', at(40));
    expect(elapsedSeconds(run.entries['MT-13'], at(50))).toBe(210);
  });

  it('opening a test twice keeps the first start', () => {
    let run = openTest(emptyRun(), 'MT-13', T0);
    run = openTest(run, 'MT-13', at(5));
    expect(elapsedSeconds(run.entries['MT-13'], at(6))).toBe(360);
  });

  it('a hidden page stores the time so far and the clock goes on', () => {
    let run = openTest(emptyRun(), 'MT-13', T0);
    run = checkpoint(run, 'MT-13', at(3));
    expect(run.entries['MT-13']).toEqual({ seconds: 180, openedAt: at(3) });
    expect(elapsedSeconds(run.entries['MT-13'], at(4))).toBe(240);
    expect(checkpoint(run, 'MT-99', at(5))).toBe(run);
  });

  it('never counts more than a day, nor a clock that went back', () => {
    const long = openTest(emptyRun(), 'MT-13', T0);
    expect(elapsedSeconds(long.entries['MT-13'], at(3 * 24 * 60))).toBe(MAX_SECONDS);
    expect(elapsedSeconds(long.entries['MT-13'], at(-5))).toBe(0);
  });

  it('shows whole minutes, rounded up', () => {
    expect([0, 1, 59, 60, 61].map(minutesOf)).toEqual([0, 1, 1, 1, 2]);
  });
});

describe('results and failed steps', () => {
  const failed = (steps: [number, Parameters<typeof setStep>[3]][]) =>
    steps.reduce(
      (run, [nr, reason]) => setStep(run, 'MT-13', nr, reason),
      setResult(openTest(emptyRun(), 'MT-13', T0), 'MT-13', 'nichtBestanden', at(1)),
    );

  it('keeps the failed steps in order, one reason each, and takes one out again', () => {
    let run = failed([
      [6, 'anderes-ergebnis'],
      [4, 'fehlermeldung'],
      [6, 'darstellung'],
    ]);
    expect(run.entries['MT-13']?.steps).toEqual([
      { nr: 4, reason: 'fehlermeldung' },
      { nr: 6, reason: 'darstellung' },
    ]);
    run = setStep(run, 'MT-13', 4, undefined);
    expect(run.entries['MT-13']?.steps).toEqual([{ nr: 6, reason: 'darstellung' }]);
    run = setStep(run, 'MT-13', 6, undefined);
    expect(run.entries['MT-13']).not.toHaveProperty('steps');
  });

  it('takes steps only for a failed test and only with a number from 1 to 99', () => {
    const passed = setResult(emptyRun(), 'MT-13', 'bestanden', T0);
    expect(setStep(passed, 'MT-13', 2, 'fehlt')).toBe(passed);
    const run = failed([]);
    for (const nr of [0, 100, 1.5]) expect(setStep(run, 'MT-13', nr, 'fehlt')).toBe(run);
  });

  it('drops the steps when the test is passed after all', () => {
    const run = setResult(failed([[2, 'haengt']]), 'MT-13', 'bestanden', at(2));
    expect(run.entries['MT-13']).not.toHaveProperty('steps');
  });

  it('names failed tests without a step', () => {
    const run = setResult(failed([]), 'MT-14', 'nichtBestanden', T0);
    expect(missingSteps(run)).toEqual(['MT-13', 'MT-14']);
    expect(missingSteps(setStep(run, 'MT-13', 1, 'fehlt'))).toEqual(['MT-14']);
  });

  it('resets a test to „nicht getestet“; an open one starts its clock anew', () => {
    const run = failed([[1, 'fehlt']]);
    expect(resetTest(run, 'MT-13').entries).toEqual({});
    expect(resetTest(run, 'MT-13', at(9)).entries['MT-13']).toEqual({
      seconds: 0,
      openedAt: at(9),
    });
  });

  it('adds up results and seconds', () => {
    let run = setResult(openTest(emptyRun(), 'MT-13', T0), 'MT-13', 'bestanden', at(2));
    run = setResult(openTest(run, 'MT-14', T0), 'MT-14', 'nichtBestanden', at(1));
    run = openTest(run, 'MT-15', T0);
    expect(totalsOf(run)).toEqual({
      tested: 2,
      byResult: { bestanden: 1, nichtBestanden: 1 },
      seconds: 180,
    });
  });
});

describe('a test rewritten after the result', () => {
  it('keeps the version of the text the result was given for', () => {
    const run = setResult(emptyRun(), 'MT-13', 'bestanden', T0, 'aaaaaaaaaaaa');
    expect(changedSince(run.entries['MT-13'], 'aaaaaaaaaaaa')).toBe(false);
    expect(changedSince(run.entries['MT-13'], 'bbbbbbbbbbbb')).toBe(true);
    expect(changedSince(undefined, 'bbbbbbbbbbbb')).toBe(false);
  });
});

describe('the report (testbericht/1)', () => {
  const CASES = ['MT-01', 'MT-13', 'MT-14', 'MT-15', 'L-01'];
  let run: TestRun = setResult(openTest(emptyRun(), 'MT-13', T0), 'MT-13', 'bestanden', at(3, 4));
  run = setResult(openTest(run, 'MT-14', T0), 'MT-14', 'nichtBestanden', at(1, 35));
  run = setStep(run, 'MT-14', 6, 'anderes-ergebnis');
  run = setStep(run, 'MT-14', 4, 'fehlermeldung');
  run = setResult(run, 'L-01', 'bestanden', T0);
  run = openTest(run, 'MT-15', T0);

  it('names every test of the catalogue: results with their time and steps, the rest untested', () => {
    const plan = reportPlan(run, CASES, BUILD);
    expect(plan).toEqual({
      ok: true,
      sent: ['MT-13', 'MT-14'],
      body: {
        format: 'testbericht/1',
        app: 'fragebogen',
        version: '0.1.0',
        stand: 'd4ce28b0a1b2',
        tests: [
          { id: 'MT-01', ergebnis: 'nicht getestet' },
          { id: 'MT-13', ergebnis: 'bestanden', sekunden: 184 },
          {
            id: 'MT-14',
            ergebnis: 'nicht bestanden',
            sekunden: 95,
            schritte: [
              { nr: 4, grund: 'fehlermeldung' },
              { nr: 6, grund: 'anderes-ergebnis' },
            ],
          },
          { id: 'MT-15', ergebnis: 'nicht getestet' },
        ],
      },
    });
  });

  it('carries no text of its own: only the fixed keys and values', () => {
    const plan = reportPlan(run, CASES, BUILD);
    if (!plan.ok) throw new Error(plan.problem);
    const keys = new Set<string>();
    JSON.stringify(plan.body, (key, value: unknown) => {
      if (!/^\d+$/.test(key)) keys.add(key);
      return value;
    });
    expect([...keys].filter(Boolean).sort()).toEqual(
      [
        'app',
        'ergebnis',
        'format',
        'grund',
        'id',
        'nr',
        'schritte',
        'sekunden',
        'stand',
        'tests',
        'version',
      ].sort(),
    );
  });

  it('leaves out local tests, which name the payroll program', () => {
    const plan = reportPlan(run, CASES, BUILD);
    expect(plan.ok && plan.body.tests.map((t) => t.id)).not.toContain('L-01');
  });

  it('is refused while a failed test names no step', () => {
    const open = setStep(run, 'MT-14', 4, undefined);
    const without = setStep(open, 'MT-14', 6, undefined);
    expect(reportPlan(without, CASES, BUILD)).toEqual({
      ok: false,
      problem: 'Bei „Nicht bestanden“ fehlt noch der Schritt mit dem Problem: MT-14.',
    });
  });

  it('leaves a sent result out of the next report until it changes', () => {
    const sent = markReported(run, ['MT-13', 'MT-14'], at(10));
    expect(reportPlan(sent, CASES, BUILD)).toEqual({
      ok: false,
      problem: 'Es gibt kein neues Ergebnis zu senden.',
    });
    const changed = setStep(sent, 'MT-14', 2, 'haengt');
    const plan = reportPlan(changed, CASES, BUILD);
    expect(plan.ok && plan.sent).toEqual(['MT-14']);
    expect(plan.ok && plan.body.tests.map((t) => t.id)).toEqual(['MT-01', 'MT-14', 'MT-15']);
  });

  it('needs the version and the commit of the build', () => {
    for (const build of [
      { ...BUILD, version: '0.1' },
      { ...BUILD, stand: '' },
      { ...BUILD, stand: 'XYZ1234' },
    ]) {
      expect(reportPlan(run, CASES, build).ok).toBe(false);
    }
  });
});

describe('the answer of the test zone', () => {
  it('says what happened, the script’s own message on 400', () => {
    expect(sendOutcome(200, '')).toEqual({ sent: true, message: 'Bericht gesendet.' });
    expect(sendOutcome(400, '  Feld   „tests“ fehlt\n')).toEqual({
      sent: false,
      message: 'Der Testbereich hat den Bericht abgelehnt: Feld „tests“ fehlt',
    });
    expect(sendOutcome(404, '').message).toContain('nimmt noch keine Berichte an');
    expect(sendOutcome(401, '').message).toContain('anmelden');
    expect(sendOutcome(500, '').message).toBe(
      'Der Testbereich antwortet mit Fehler 500. Bitte später noch einmal senden.',
    );
    expect(sendOutcome(400, 'x'.repeat(1000)).message.length).toBeLessThan(400);
  });
});

describe('decodeRun', () => {
  it('reads back what was stored, but never a running clock', () => {
    const run = markReported(
      setStep(
        setResult(
          openTest(emptyRun(), 'MT-13', T0),
          'MT-13',
          'nichtBestanden',
          at(2),
          'aaaaaaaaaaaa',
        ),
        'MT-13',
        3,
        'fehlt',
      ),
      ['MT-13'],
      at(5),
    );
    const open = openTest(run, 'MT-14', T0);
    expect(decodeRun(JSON.parse(JSON.stringify(open)))).toEqual(run);
  });

  it('turns a run stored before 2026-11-15 into the new one without any text', () => {
    const old = {
      tester: 'Erika Mustermann',
      comment: 'Gesamteindruck',
      entries: {
        'MT-13': {
          result: 'teilweise',
          comment: 'Hälfte ging',
          started: '2026-11-08T09:00:00+01:00',
          ended: '2026-11-08T09:05:00+01:00',
          correctedMinutes: 3,
          version: 'aaaaaaaaaaaa',
          reported: '2026-11-08T10:00:00+01:00',
        },
        'MT-14': { comment: 'Nur ein Kommentar' },
        'MT-15': { result: 'bestanden', started: T0, ended: at(3 * 24 * 60) },
      },
    };
    expect(decodeRun(old)).toEqual({
      entries: {
        'MT-13': {
          seconds: 300,
          result: 'nichtBestanden',
          version: 'aaaaaaaaaaaa',
          reported: '2026-11-08T10:00:00+01:00',
        },
        'MT-15': { seconds: 0, result: 'bestanden' },
      },
    });
    expect(JSON.stringify(decodeRun(old))).not.toMatch(/Erika|Hälfte|Kommentar|Gesamteindruck/);
  });

  it('drops what is malformed instead of trusting it', () => {
    expect(decodeRun(null)).toEqual(emptyRun());
    expect(decodeRun({ entries: [] })).toEqual(emptyRun());
    expect(
      decodeRun({
        entries: {
          'MT-13': { result: 'gut', seconds: -5 },
          'MT-14': {
            result: 'nichtBestanden',
            seconds: 1e9,
            steps: [
              { nr: 0, reason: 'fehlt' },
              { nr: 2, reason: 'anders' },
              { nr: 3, reason: 'fehlt' },
            ],
          },
          'X-1': { result: 'bestanden' },
        },
      }),
    ).toEqual({
      entries: {
        'MT-14': {
          seconds: MAX_SECONDS,
          result: 'nichtBestanden',
          steps: [{ nr: 3, reason: 'fehlt' }],
        },
      },
    });
  });
});

describe('testTime', () => {
  it('shows the time alone on the same day, else with the date', () => {
    expect(testTime('2026-11-01T14:42:00+01:00', '2026-11-01T18:00:00+01:00')).toBe('14:42 Uhr');
    expect(testTime('2026-10-27T14:42:00+01:00', '2026-11-01T18:00:00+01:00')).toBe(
      '27.10. 14:42 Uhr',
    );
    expect(testTime('2025-12-30T08:05:00+01:00', '2026-11-01')).toBe('30.12.2025 08:05 Uhr');
    expect(testTime(undefined, '2026-11-01')).toBe('–');
  });
});
