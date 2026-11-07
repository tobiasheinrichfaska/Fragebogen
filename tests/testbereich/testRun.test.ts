// A tester's run (Tobias 2026-11-01): result, comment and time per test, totals for the PDF.
import {
  changedSince,
  correctDuration,
  countedMinutes,
  decodeRun,
  emptyRun,
  forReport,
  inReport,
  markReported,
  measuredMinutes,
  needsCorrection,
  reportCounts,
  resetTest,
  setComment,
  setResult,
  startTest,
  testTime,
  totalsOf,
  type TestRun,
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
    const run = setResult(emptyRun(), 'MT-14', 'nichtBestanden', T0);
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
      byResult: { bestanden: 1, nichtBestanden: 1 },
      measuredMinutes: 30,
      countedMinutes: 15,
    });
  });
});

describe('decodeRun', () => {
  it('reads back what was stored', () => {
    let run = { ...emptyRun(), tester: 'Erika M.', comment: 'Alles gut' };
    run = correctDuration(
      setResult(startTest(run, 'MT-13', T0), 'MT-13', 'nichtBestanden', at(3)),
      'MT-13',
      2,
    );
    expect(decodeRun(JSON.parse(JSON.stringify(run)))).toEqual(run);
  });

  // Tobias 2026-11-07: two results; a stored "teilweise" must not be lost.
  it('reads a stored "teilweise" as "klappt nicht", with its comment', () => {
    const run = decodeRun({
      entries: { 'MT-13': { result: 'teilweise', comment: 'Knopf erst nach Neuladen' } },
    });
    expect(run.entries['MT-13']).toEqual({
      result: 'nichtBestanden',
      comment: 'Knopf erst nach Neuladen',
    });
    expect(decodeRun({ entries: { 'MT-1': { result: 'toString', comment: '' } } }).entries).toEqual(
      { 'MT-1': { comment: '' } },
    );
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

// Tobias 2026-11-01: "bekommen die Tester Hinweise, welche Tests … geändert wurden?"
describe('a test rewritten after the result', () => {
  it('keeps the version of the text the result was given for', () => {
    const run = setResult(emptyRun(), 'MT-13', 'bestanden', T0, 'aaaaaaaaaaaa');
    expect(run.entries['MT-13']?.version).toBe('aaaaaaaaaaaa');
    expect(changedSince(run.entries['MT-13'], 'aaaaaaaaaaaa')).toBe(false);
    expect(changedSince(run.entries['MT-13'], 'bbbbbbbbbbbb')).toBe(true);
    // A new result for the new text clears the mark; a reset drops the version.
    const again = setResult(run, 'MT-13', 'nichtBestanden', at(5), 'bbbbbbbbbbbb');
    expect(changedSince(again.entries['MT-13'], 'bbbbbbbbbbbb')).toBe(false);
    expect(resetTest(again, 'MT-13').entries['MT-13']).not.toHaveProperty('version');
  });

  it('cannot tell for results without a version, and for tests without a result', () => {
    expect(changedSince(setResult(emptyRun(), 'MT-1', 'bestanden', T0).entries['MT-1'], 'x')).toBe(
      false,
    );
    expect(changedSince(startTest(emptyRun(), 'MT-1', T0).entries['MT-1'], 'x')).toBe(false);
    expect(changedSince(undefined, 'x')).toBe(false);
  });

  it('reads a stored version back and drops a malformed one', () => {
    const stored = decodeRun({
      entries: {
        'MT-1': { result: 'bestanden', version: 'abcdef012345', comment: '' },
        'MT-2': { result: 'bestanden', version: '<script>', comment: '' },
      },
    });
    expect(stored.entries['MT-1']?.version).toBe('abcdef012345');
    expect(stored.entries['MT-2']).not.toHaveProperty('version');
  });
});

describe('tests reported before (Tobias 2026-11-06, automatic since 2026-11-07)', () => {
  const done = (): TestRun => {
    let run = setResult(emptyRun(), 'MT-119', 'bestanden', at(1));
    run = setResult(run, 'MT-120', 'nichtBestanden', at(2));
    run = startTest(run, 'MT-121', at(3)); // begun, no result yet
    run = setComment(run, 'MT-17', 'Achtung, hier kam keine Warnmeldung!'); // comment only
    return { ...run, entries: { ...run.entries, 'MT-30': { comment: '  ' } } }; // nothing to say
  };

  it('names a test in a report when it has a result, a start or a comment', () => {
    const run = done();
    expect(
      Object.keys(run.entries)
        .filter((id) => inReport(run.entries[id]))
        .sort(),
    ).toEqual(['MT-119', 'MT-120', 'MT-121', 'MT-17']);
    expect(inReport(undefined)).toBe(false);
  });

  // Test report 2026-11-07: the comments of MT-17 and MT-122 (no result) came back in every report.
  it('marks every test the report named, also those without a result', () => {
    const run = markReported(done(), at(10));
    expect(run.entries['MT-119']).toMatchObject({ result: 'bestanden', reported: at(10) });
    expect(run.entries['MT-121']?.reported).toBe(at(10));
    expect(run.entries['MT-17']?.reported).toBe(at(10));
    expect(run.entries['MT-30']?.reported).toBeUndefined();
    expect(reportCounts(run)).toEqual({ open: 0, reported: 4 });
    expect(Object.keys(forReport(run).entries)).toEqual([]);
    expect(totalsOf(run).tested).toBe(2);
  });

  it('takes the tests reported before in again when the tester wants them', () => {
    const run = setResult(markReported(done(), at(10)), 'MT-13', 'bestanden', at(11));
    expect(reportCounts(run)).toEqual({ open: 1, reported: 4 });
    expect(Object.keys(forReport(run).entries)).toEqual(['MT-13']);
    expect(Object.keys(forReport(run, true).entries).sort()).toEqual([
      'MT-119',
      'MT-120',
      'MT-121',
      'MT-13',
      'MT-17',
    ]);
  });

  it('leaves out what a report cannot name, reported or not', () => {
    expect(forReport(done(), true).entries).not.toHaveProperty('MT-30');
    expect(reportCounts(done())).toEqual({ open: 4, reported: 0 });
  });

  it('keeps the first mark when marked again', () => {
    const run = markReported(markReported(done(), at(10)), at(20));
    expect(run.entries['MT-120']?.reported).toBe(at(10));
  });

  it('brings a test back into the report when its result, comment, start or duration changes', () => {
    const marked = markReported(done(), at(10));
    expect(setResult(marked, 'MT-119', 'nichtBestanden', at(11)).entries['MT-119']?.reported).toBe(
      undefined,
    );
    expect(setResult(marked, 'MT-121', 'bestanden', at(11)).entries['MT-121']?.reported).toBe(
      undefined,
    );
    expect(setComment(marked, 'MT-120', 'neu').entries['MT-120']?.reported).toBeUndefined();
    expect(setComment(marked, 'MT-120', '').entries['MT-120']?.reported).toBe(at(10));
    expect(correctDuration(marked, 'MT-120', 5).entries['MT-120']?.reported).toBeUndefined();
    expect(startTest(marked, 'MT-17', at(12)).entries['MT-17']?.reported).toBeUndefined();
    expect(startTest(marked, 'MT-121', at(12)).entries['MT-121']?.reported).toBe(at(10));
    expect(resetTest(marked, 'MT-119').entries['MT-119']).toEqual({ comment: '' });
  });

  it('reads a stored mark back, only on a test a report can name', () => {
    const stored = JSON.parse(JSON.stringify(markReported(done(), at(10)))) as unknown;
    expect(decodeRun(stored).entries['MT-119']?.reported).toBe(at(10));
    expect(decodeRun(stored).entries['MT-17']?.reported).toBe(at(10));
    const odd = {
      tester: '',
      comment: '',
      entries: {
        'MT-1': { comment: '', reported: at(10) },
        'MT-2': { comment: '', result: 'bestanden', reported: 'gestern' },
      },
    };
    expect(decodeRun(odd).entries['MT-1']?.reported).toBeUndefined();
    expect(decodeRun(odd).entries['MT-2']?.reported).toBeUndefined();
  });
});

// iPhone report 2026-11-06: MT-01 begun 01.11., rated 06.11. — "Beginn 14:42 · gemessen 7308 Min.".
describe('a test begun on another day', () => {
  it('shows the time alone on the same day, else with the date', () => {
    const day = '2026-11-06T16:39:00.000+01:00';
    expect(testTime('2026-11-06T14:42:10.000+01:00', day)).toBe('14:42 Uhr');
    expect(testTime('2026-11-01T14:42:10.000+01:00', day)).toBe('01.11. 14:42 Uhr');
    expect(testTime('2025-12-31T23:59:00.000+01:00', day)).toBe('31.12.2025 23:59 Uhr');
    expect(testTime(undefined, day)).toBe('–');
    expect(testTime('gestern', day)).toBe('–');
  });

  it('asks for a correction when the measured time is longer than a tester can enter', () => {
    const run = setResult(
      startTest(emptyRun(), 'MT-01', '2026-11-01T14:42:00.000+01:00'),
      'MT-01',
      'bestanden',
      '2026-11-06T16:29:00.000+01:00',
    );
    const entry = run.entries['MT-01'] ?? { comment: '' };
    expect(measuredMinutes(entry)).toBe(7307);
    expect(needsCorrection(entry)).toBe(true);
    const corrected = correctDuration(run, 'MT-01', 4).entries['MT-01'] ?? { comment: '' };
    expect(needsCorrection(corrected)).toBe(false);
    expect(
      needsCorrection(
        setResult(emptyRun(), 'MT-02', 'bestanden', T0).entries['MT-02'] ?? { comment: '' },
      ),
    ).toBe(false);
  });
});
