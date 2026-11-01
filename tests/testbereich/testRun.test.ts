// A tester's run (Tobias 2026-11-01): result, comment and time per test, totals for the PDF.
import {
  correctDuration,
  countedMinutes,
  decodeRun,
  emptyRun,
  measuredMinutes,
  resetTest,
  setComment,
  setResult,
  startTest,
  totalsOf,
} from '../../src/logic/testRun';

const T0 = '2026-11-01T09:00:00.000Z';
const at = (minutes: number, seconds = 0) =>
  new Date(Date.parse(T0) + minutes * 60_000 + seconds * 1000).toISOString();

describe('one test', () => {
  it('measures from "beginnen" to the result, rounded up to whole minutes', () => {
    let run = startTest(emptyRun(), 'MT-13', T0);
    run = startTest(run, 'MT-13', at(5)); // beginning again keeps the first start
    run = setResult(run, 'MT-13', 'bestanden', at(7, 10));
    const entry = run.entries['MT-13'];
    expect(entry).toEqual({ comment: '', started: T0, ended: at(7, 10), result: 'bestanden' });
    expect(entry && measuredMinutes(entry)).toBe(8);
  });

  it('counts a result without "beginnen" as at least one minute', () => {
    const run = setResult(emptyRun(), 'MT-14', 'teilweise', T0);
    const entry = run.entries['MT-14'];
    expect(entry && measuredMinutes(entry)).toBe(1);
  });

  it('lets the tester correct the duration, within 0–600 minutes, and take it back', () => {
    let run = setResult(startTest(emptyRun(), 'MT-13', T0), 'MT-13', 'bestanden', at(45));
    run = correctDuration(run, 'MT-13', 12.4);
    expect(run.entries['MT-13']?.correctedMinutes).toBe(12);
    expect(countedMinutes(run.entries['MT-13'] ?? { comment: '' })).toBe(12);
    expect(correctDuration(run, 'MT-13', 9999).entries['MT-13']?.correctedMinutes).toBe(600);
    const back = correctDuration(run, 'MT-13', undefined).entries['MT-13'];
    expect(back).not.toHaveProperty('correctedMinutes');
    expect(back && countedMinutes(back)).toBe(45);
  });

  it('resets a test but keeps its comment', () => {
    let run = setComment(emptyRun(), 'MT-13', 'Knopf schwer zu finden');
    run = setResult(run, 'MT-13', 'nichtBestanden', T0);
    expect(resetTest(run, 'MT-13').entries['MT-13']).toEqual({ comment: 'Knopf schwer zu finden' });
  });
});

describe('totals', () => {
  it('counts results and minutes, measured and counted', () => {
    let run = emptyRun();
    run = setResult(startTest(run, 'MT-01', T0), 'MT-01', 'bestanden', at(10));
    run = setResult(startTest(run, 'MT-02', T0), 'MT-02', 'nichtBestanden', at(20));
    run = correctDuration(run, 'MT-02', 5);
    run = startTest(run, 'MT-03', T0); // begun, no result: not counted
    expect(totalsOf(run)).toEqual({
      tested: 2,
      byResult: { bestanden: 1, teilweise: 0, nichtBestanden: 1 },
      measuredMinutes: 30,
      countedMinutes: 15,
    });
  });
});

describe('decodeRun', () => {
  it('reads back what was stored', () => {
    let run = { ...emptyRun(), tester: 'Erika M.', comment: 'Alles gut' };
    run = correctDuration(
      setResult(startTest(run, 'MT-13', T0), 'MT-13', 'teilweise', at(3)),
      'MT-13',
      2,
    );
    expect(decodeRun(JSON.parse(JSON.stringify(run)))).toEqual(run);
  });

  it('drops what is malformed instead of trusting it', () => {
    expect(
      decodeRun({
        tester: 7,
        entries: {
          'MT-1': { result: 'super', started: 'gestern', correctedMinutes: -3, comment: 5 },
          '<script>': { comment: 'x' },
        },
      }),
    ).toEqual({ tester: '', entries: { 'MT-1': { comment: '' } }, comment: '' });
    expect(decodeRun('kaputt')).toEqual(emptyRun());
  });
});
