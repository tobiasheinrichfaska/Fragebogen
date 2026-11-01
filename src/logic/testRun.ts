// A tester's run on the test page (Tobias 2026-11-01): per test a result, a comment and the time —
// start and end measured, the duration correctable by the tester; the whole run summed up. Pure
// state transitions; the page keeps the run in its own browser storage and prints it as a PDF.

export const RESULTS = ['bestanden', 'teilweise', 'nichtBestanden'] as const;
export type TestResult = (typeof RESULTS)[number];

export const RESULT_LABELS: Readonly<Record<TestResult, string>> = {
  bestanden: 'bestanden',
  teilweise: 'teilweise',
  nichtBestanden: 'nicht bestanden',
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
}

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

/** "Test beginnen": starts the clock; a test begun again keeps its first start. */
export function startTest(run: TestRun, id: string, now: string): TestRun {
  const entry = entryOf(run, id);
  return entry.started ? run : withEntry(run, id, { ...entry, started: now });
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
  const rest: TestEntry = { ...entry };
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
  return withEntry(run, id, { ...entryOf(run, id), comment });
}

/** A corrected duration in whole minutes (0–600); undefined drops the correction. */
export function correctDuration(run: TestRun, id: string, minutes: number | undefined): TestRun {
  const entry = entryOf(run, id);
  const rest: TestEntry = { ...entry };
  delete rest.correctedMinutes;
  if (minutes === undefined) return withEntry(run, id, rest);
  const clean = Math.min(600, Math.max(0, Math.round(minutes)));
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

export interface RunTotals {
  tested: number;
  byResult: Record<TestResult, number>;
  measuredMinutes: number;
  countedMinutes: number;
}

export function totalsOf(run: TestRun): RunTotals {
  const totals: RunTotals = {
    tested: 0,
    byResult: { bestanden: 0, teilweise: 0, nichtBestanden: 0 },
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
      const result = RESULTS.find((r) => r === value.result);
      const minutes = value.correctedMinutes;
      entries[id] = {
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
        minutes <= 600
          ? { correctedMinutes: minutes }
          : {}),
      };
    }
  }
  return {
    tester: typeof raw.tester === 'string' ? raw.tester.slice(0, 80) : '',
    entries,
    comment: typeof raw.comment === 'string' ? raw.comment.slice(0, 8000) : '',
  };
}
