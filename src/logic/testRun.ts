// A tester's run on the test page (Tobias 2026-11-01): per test a result, a comment and the time —
// start and end measured, the duration correctable by the tester; the whole run summed up. Pure
// state transitions; the page keeps the run in its own browser storage and prints it as a PDF.

// Two results (Tobias 2026-11-07: "ja oder nein … teilweise kann über den Text kommen"); the keys
// stay those stored since 2026-11-01.
export const RESULTS = ['bestanden', 'nichtBestanden'] as const;
export type TestResult = (typeof RESULTS)[number];

export const RESULT_LABELS: Readonly<Record<TestResult, string>> = {
  bestanden: 'wie erwartet',
  nichtBestanden: 'klappt nicht',
};

/** "teilweise", stored until 2026-11-07, reads as "klappt nicht"; the comment says what worked. */
const STORED_RESULTS: Readonly<Record<string, TestResult>> = {
  bestanden: 'bestanden',
  teilweise: 'nichtBestanden',
  nichtBestanden: 'nichtBestanden',
};

export interface TestEntry {
  /** ISO times from the device clock. */
  started?: string;
  ended?: string;
  result?: TestResult;
  comment: string;
  /** The tester's own duration in minutes, when the measured one is wrong (a break, a phone call). */
  correctedMinutes?: number;
  /** caseVersion of the test text the result was given for (12 hex digits). */
  version?: string;
  /**
   * When the test went into a report (ISO time): the list still shows it done, the next report
   * leaves it out until its result, comment or duration changes — or the tester takes it in again.
   */
  reported?: string;
}

/** The longest duration a tester can enter; a longer measured one spans a break. */
export const LONGEST_TEST_MINUTES = 600;

export interface TestRun {
  tester: string;
  entries: Record<string, TestEntry>;
  comment: string;
}

export const emptyRun = (): TestRun => ({ tester: '', entries: {}, comment: '' });

const entryOf = (run: TestRun, id: string): TestEntry => run.entries[id] ?? { comment: '' };

const withEntry = (run: TestRun, id: string, entry: TestEntry): TestRun => ({
  ...run,
  entries: { ...run.entries, [id]: entry },
});

/** A changed entry belongs in the next report again. */
function unreported(entry: TestEntry): TestEntry {
  const rest: TestEntry = { ...entry };
  delete rest.reported;
  return rest;
}

/** Whether a report has anything to say about the test: a result, a start or a comment. */
export function inReport(entry: TestEntry | undefined): boolean {
  return (
    entry !== undefined &&
    (entry.result !== undefined || entry.started !== undefined || entry.comment.trim() !== '')
  );
}

/** "Test beginnen": starts the clock; a test begun again keeps its first start. */
export function startTest(run: TestRun, id: string, now: string): TestRun {
  const entry = entryOf(run, id);
  return entry.started ? run : withEntry(run, id, { ...unreported(entry), started: now });
}

/** A result stops the clock (started now if the tester never pressed "beginnen"). */
export function setResult(
  run: TestRun,
  id: string,
  result: TestResult,
  now: string,
  version?: string,
): TestRun {
  const entry = entryOf(run, id);
  const rest: TestEntry = unreported(entry);
  delete rest.version;
  return withEntry(run, id, {
    ...rest,
    started: entry.started ?? now,
    ended: now,
    result,
    ...(version === undefined ? {} : { version }),
  });
}

/**
 * The test was rewritten after the tester's result: the result belongs to an older text. A result
 * without a version (given before 2026-11-01) cannot tell.
 */
export function changedSince(entry: TestEntry | undefined, current: string): boolean {
  return entry?.result !== undefined && entry.version !== undefined && entry.version !== current;
}

export function setComment(run: TestRun, id: string, comment: string): TestRun {
  const entry = entryOf(run, id);
  return withEntry(run, id, {
    ...(entry.comment === comment ? entry : unreported(entry)),
    comment,
  });
}

/** A corrected duration in whole minutes (0–600); undefined drops the correction. */
export function correctDuration(run: TestRun, id: string, minutes: number | undefined): TestRun {
  const entry = entryOf(run, id);
  const rest: TestEntry = unreported(entry);
  delete rest.correctedMinutes;
  if (minutes === undefined) return withEntry(run, id, rest);
  const clean = Math.min(LONGEST_TEST_MINUTES, Math.max(0, Math.round(minutes)));
  return withEntry(run, id, { ...rest, correctedMinutes: clean });
}

/** Back to "not tested": result, times and correction gone, the comment stays. */
export function resetTest(run: TestRun, id: string): TestRun {
  return withEntry(run, id, { comment: entryOf(run, id).comment });
}

/** Measured minutes (rounded up to whole minutes, at least 1), if the test was started and ended. */
export function measuredMinutes(entry: TestEntry): number | undefined {
  if (!entry.started || !entry.ended) return undefined;
  const ms = Date.parse(entry.ended) - Date.parse(entry.started);
  return Number.isFinite(ms) && ms >= 0 ? Math.max(1, Math.ceil(ms / 60_000)) : undefined;
}

/** The minutes that count: the tester's correction, else the measured ones. */
export function countedMinutes(entry: TestEntry): number | undefined {
  return entry.correctedMinutes ?? measuredMinutes(entry);
}

/** Measured over more than a tester can enter (a test begun one day, rated another) and uncorrected. */
export function needsCorrection(entry: TestEntry): boolean {
  const measured = measuredMinutes(entry);
  return (
    entry.correctedMinutes === undefined &&
    measured !== undefined &&
    measured > LONGEST_TEST_MINUTES
  );
}

/**
 * A device time for the page and the report: "14:42 Uhr" on the given day, else with the date
 * ("01.11. 14:42 Uhr") — a test begun days before its result read as minutes only (2026-11-06).
 */
export function testTime(local: string | undefined, day: string): string {
  if (local === undefined || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return '–';
  const clock = `${local.slice(11, 16)} Uhr`;
  if (local.slice(0, 10) === day.slice(0, 10)) return clock;
  const date = `${local.slice(8, 10)}.${local.slice(5, 7)}.`;
  return `${local.slice(0, 4) === day.slice(0, 4) ? date : `${date}${local.slice(0, 4)}`} ${clock}`;
}

/**
 * A report was written (Tobias 2026-11-06, automatic since 2026-11-07): every test it can name is
 * marked now; the list keeps showing it done, the next report leaves it out unless asked to.
 */
export function markReported(run: TestRun, now: string): TestRun {
  const entries = Object.fromEntries(
    Object.entries(run.entries).map(([id, entry]) => [
      id,
      inReport(entry) && !entry.reported ? { ...entry, reported: now } : entry,
    ]),
  );
  return { ...run, entries };
}

/** The run as the next report shows it: without the tests reported before, unless taken in again. */
export function forReport(run: TestRun, withReported = false): TestRun {
  const entries = Object.fromEntries(
    Object.entries(run.entries).filter(
      ([, entry]) => inReport(entry) && (withReported || entry.reported === undefined),
    ),
  );
  return { ...run, entries };
}

/** How many tests a report can name: not reported yet / in an earlier report. */
export function reportCounts(run: TestRun): { open: number; reported: number } {
  const named = Object.values(run.entries).filter(inReport);
  const reported = named.filter((entry) => entry.reported !== undefined).length;
  return { open: named.length - reported, reported };
}

export interface RunTotals {
  tested: number;
  byResult: Record<TestResult, number>;
  measuredMinutes: number;
  countedMinutes: number;
}

export function totalsOf(run: TestRun): RunTotals {
  const totals: RunTotals = {
    tested: 0,
    byResult: { bestanden: 0, nichtBestanden: 0 },
    measuredMinutes: 0,
    countedMinutes: 0,
  };
  for (const entry of Object.values(run.entries)) {
    if (!entry.result) continue;
    totals.tested += 1;
    totals.byResult[entry.result] += 1;
    totals.measuredMinutes += measuredMinutes(entry) ?? 0;
    totals.countedMinutes += countedMinutes(entry) ?? 0;
  }
  return totals;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** The run kept in the page's browser storage; anything malformed is dropped, never trusted. */
export function decodeRun(raw: unknown): TestRun {
  if (!isRecord(raw)) return emptyRun();
  const entries: Record<string, TestEntry> = {};
  if (isRecord(raw.entries)) {
    for (const [id, value] of Object.entries(raw.entries)) {
      if (!isRecord(value) || !/^MT-\d+[a-z]?$|^L-\d+[a-z]?$/.test(id)) continue;
      const result =
        typeof value.result === 'string' && Object.hasOwn(STORED_RESULTS, value.result)
          ? STORED_RESULTS[value.result]
          : undefined;
      const minutes = value.correctedMinutes;
      const entry: TestEntry = {
        comment: typeof value.comment === 'string' ? value.comment.slice(0, 4000) : '',
        ...(isTime(value.started) ? { started: value.started } : {}),
        ...(isTime(value.ended) ? { ended: value.ended } : {}),
        ...(result ? { result } : {}),
        ...(typeof value.version === 'string' && /^[0-9a-f]{12}$/.test(value.version)
          ? { version: value.version }
          : {}),
        ...(typeof minutes === 'number' &&
        Number.isInteger(minutes) &&
        minutes >= 0 &&
        minutes <= LONGEST_TEST_MINUTES
          ? { correctedMinutes: minutes }
          : {}),
      };
      entries[id] =
        inReport(entry) && isTime(value.reported) ? { ...entry, reported: value.reported } : entry;
    }
  }
  return {
    tester: typeof raw.tester === 'string' ? raw.tester.slice(0, 80) : '',
    entries,
    comment: typeof raw.comment === 'string' ? raw.comment.slice(0, 8000) : '',
  };
}
