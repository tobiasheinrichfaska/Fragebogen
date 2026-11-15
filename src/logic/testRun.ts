// A tester's run on the test page. Since 2026-11-15 without any free text (Tobias: „es zählt nur
// noch, welche Tests bestehen oder nicht bestehen und wenn sie nicht bestehen, in welchen Schritten
// sie nicht bestehen“; format: Testumgebung docs/testbericht.md, `testbericht/1`): per test the
// result, the seconds the page measured and, for a failed test, the steps with a reason from a fixed
// list. The clock runs while a test is open and has no result; leaving the test pauses it, the
// result ends it — no correction by hand. Pure state transitions; the page keeps the run in its own
// browser storage, sends it to the test zone and prints a copy.

export const RESULTS = ['bestanden', 'nichtBestanden'] as const;
export type TestResult = (typeof RESULTS)[number];

export const RESULT_LABELS: Readonly<Record<TestResult, string>> = {
  bestanden: 'Bestanden',
  nichtBestanden: 'Nicht bestanden',
};

/** The fixed reasons of a failed step, keys as the report sends them. */
export const STEP_REASONS = [
  'anderes-ergebnis',
  'fehlermeldung',
  'fehlt',
  'haengt',
  'darstellung',
] as const;
export type StepReason = (typeof STEP_REASONS)[number];

export const STEP_REASON_LABELS: Readonly<Record<StepReason, string>> = {
  'anderes-ergebnis': 'Anderes Ergebnis als erwartet',
  fehlermeldung: 'Fehlermeldung',
  fehlt: 'Knopf oder Text fehlt',
  haengt: 'Lädt nicht oder hängt',
  darstellung: 'Darstellung falsch',
};

export interface FailedStep {
  /** The number of the step in the manual test (1 … 99). */
  nr: number;
  reason: StepReason;
}

export interface TestEntry {
  /** Seconds the test was open before `openedAt` (whole seconds, at most a day). */
  seconds: number;
  /** While the test is open and has no result: when the clock started this time (ISO). */
  openedAt?: string;
  result?: TestResult;
  /** Only with „nicht bestanden“: the steps with a problem, by number. */
  steps?: FailedStep[];
  /** caseVersion of the test text the result was given for (12 hex digits). */
  version?: string;
  /** When the result was sent (ISO): the next report leaves it out until it changes. */
  reported?: string;
}

export interface TestRun {
  entries: Record<string, TestEntry>;
}

/** The longest time a report may name for one test (`tests[].sekunden`). */
export const MAX_SECONDS = 86_400;
export const MAX_STEP = 99;

export const emptyRun = (): TestRun => ({ entries: {} });

const entryOf = (run: TestRun, id: string): TestEntry => run.entries[id] ?? { seconds: 0 };

const withEntry = (run: TestRun, id: string, entry: TestEntry): TestRun => ({
  ...run,
  entries: { ...run.entries, [id]: entry },
});

/** A changed result belongs in the next report again. */
function unreported(entry: TestEntry): TestEntry {
  const rest: TestEntry = { ...entry };
  delete rest.reported;
  return rest;
}

/** The seconds the test has been open so far, the running part up to `now` included. */
export function elapsedSeconds(entry: TestEntry | undefined, now: string): number {
  if (!entry) return 0;
  const running =
    entry.openedAt === undefined ? 0 : (Date.parse(now) - Date.parse(entry.openedAt)) / 1000;
  const total = entry.seconds + (Number.isFinite(running) && running > 0 ? running : 0);
  return Math.min(MAX_SECONDS, Math.floor(total));
}

/** The test is opened: its clock runs, unless it has a result already. */
export function openTest(run: TestRun, id: string, now: string): TestRun {
  const entry = entryOf(run, id);
  if (entry.result !== undefined || entry.openedAt !== undefined) return run;
  return withEntry(run, id, { ...entry, openedAt: now });
}

/** The test is left (another test, the overview, the page closed): its clock pauses. */
export function leaveTest(run: TestRun, id: string, now: string): TestRun {
  const entry = run.entries[id];
  if (entry?.openedAt === undefined) return run;
  const rest: TestEntry = { ...entry, seconds: elapsedSeconds(entry, now) };
  delete rest.openedAt;
  return withEntry(run, id, rest);
}

/**
 * The page is hidden (another app, the phone locked): the time so far is stored while the clock
 * goes on — a page closed for good then loses only the time since.
 */
export function checkpoint(run: TestRun, id: string, now: string): TestRun {
  const entry = run.entries[id];
  return entry?.openedAt === undefined ? run : openTest(leaveTest(run, id, now), id, now);
}

/** A result ends the clock. „Bestanden“ drops the failed steps, „nicht bestanden“ keeps them. */
export function setResult(
  run: TestRun,
  id: string,
  result: TestResult,
  now: string,
  version?: string,
): TestRun {
  const entry = entryOf(run, id);
  const rest: TestEntry = { ...unreported(entry), seconds: elapsedSeconds(entry, now) };
  delete rest.openedAt;
  delete rest.version;
  if (result === 'bestanden') delete rest.steps;
  return withEntry(run, id, {
    ...rest,
    result,
    ...(version === undefined ? {} : { version }),
  });
}

/** A step of a failed test with its reason; `undefined` takes it out again. */
export function setStep(
  run: TestRun,
  id: string,
  nr: number,
  reason: StepReason | undefined,
): TestRun {
  const entry = run.entries[id];
  if (entry?.result !== 'nichtBestanden' || !Number.isInteger(nr) || nr < 1 || nr > MAX_STEP) {
    return run;
  }
  const others = (entry.steps ?? []).filter((step) => step.nr !== nr);
  const steps = (reason === undefined ? others : [...others, { nr, reason }]).sort(
    (a, b) => a.nr - b.nr,
  );
  const rest: TestEntry = unreported(entry);
  delete rest.steps;
  return withEntry(run, id, steps.length === 0 ? rest : { ...rest, steps });
}

/** Back to „nicht getestet“: result, steps and time gone; an open test starts its clock anew. */
export function resetTest(run: TestRun, id: string, now?: string): TestRun {
  const entries = Object.fromEntries(Object.entries(run.entries).filter(([key]) => key !== id));
  const reset = { ...run, entries };
  return now === undefined ? reset : openTest(reset, id, now);
}

/**
 * The test was rewritten after the tester's result: the result belongs to an older text. A result
 * without a version (given before 2026-11-01) cannot tell.
 */
export function changedSince(entry: TestEntry | undefined, current: string): boolean {
  return entry?.result !== undefined && entry.version !== undefined && entry.version !== current;
}

/** Failed tests whose steps are still missing — a report cannot be sent with them. */
export function missingSteps(run: TestRun): string[] {
  return Object.entries(run.entries)
    .filter(([, entry]) => entry.result === 'nichtBestanden' && (entry.steps ?? []).length === 0)
    .map(([id]) => id)
    .sort();
}

/** Whole minutes for the page (at least 1 once a second counted). */
export function minutesOf(seconds: number): number {
  return seconds <= 0 ? 0 : Math.ceil(seconds / 60);
}

/**
 * A device time for the page and the report: "14:42 Uhr" on the given day, else with the date
 * ("01.11. 14:42 Uhr").
 */
export function testTime(local: string | undefined, day: string): string {
  if (local === undefined || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return '–';
  const clock = `${local.slice(11, 16)} Uhr`;
  if (local.slice(0, 10) === day.slice(0, 10)) return clock;
  const date = `${local.slice(8, 10)}.${local.slice(5, 7)}.`;
  return `${local.slice(0, 4) === day.slice(0, 4) ? date : `${date}${local.slice(0, 4)}`} ${clock}`;
}

export interface RunTotals {
  tested: number;
  byResult: Record<TestResult, number>;
  seconds: number;
}

export function totalsOf(run: TestRun): RunTotals {
  const totals: RunTotals = {
    tested: 0,
    byResult: { bestanden: 0, nichtBestanden: 0 },
    seconds: 0,
  };
  for (const entry of Object.values(run.entries)) {
    if (!entry.result) continue;
    totals.tested += 1;
    totals.byResult[entry.result] += 1;
    totals.seconds += entry.seconds;
  }
  return totals;
}

// --- The report (`testbericht/1`) -------------------------------------------------------------

/** The ids a report may name (`tests[].id`); local tests („L-…“) stay out of it. */
export const REPORT_ID = /^MT-\d{2,3}(-\d{2})?[a-z]?$/;
export const MAX_REPORT_TESTS = 300;

export interface ReportBuild {
  app: string;
  /** Version of the app from package.json. */
  version: string;
  /** Commit of the build. */
  stand: string;
}

export type ReportTest =
  | { id: string; ergebnis: 'bestanden'; sekunden: number }
  | {
      id: string;
      ergebnis: 'nicht bestanden';
      sekunden: number;
      schritte: { nr: number; grund: StepReason }[];
    }
  | { id: string; ergebnis: 'nicht getestet' };

export interface ReportBody extends ReportBuild {
  format: 'testbericht/1';
  tests: ReportTest[];
}

export type ReportPlan =
  | {
      ok: true;
      body: ReportBody;
      /** The results it sends, to be marked once it arrived. */ sent: string[];
    }
  | { ok: false; problem: string };

/**
 * The report to send: every result not sent yet, and every test of the catalogue without a result
 * as „nicht getestet“; results sent before stay out (they were counted). Refused while a failed
 * test names no step, or when there is no new result at all.
 */
export function reportPlan(
  run: TestRun,
  caseIds: readonly string[],
  build: ReportBuild,
): ReportPlan {
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(build.version) || !/^[0-9a-f]{7,40}$/.test(build.stand)) {
    return {
      ok: false,
      problem:
        'Diese Fassung der App kennt ihre Version oder ihren Stand nicht und kann keinen Bericht senden.',
    };
  }
  const ids = [...new Set(caseIds)].filter((id) => REPORT_ID.test(id));
  const missing = missingSteps(run).filter((id) => ids.includes(id));
  if (missing.length > 0) {
    return {
      ok: false,
      problem: `Bei „Nicht bestanden“ fehlt noch der Schritt mit dem Problem: ${missing.join(', ')}.`,
    };
  }
  const tests: ReportTest[] = [];
  const sent: string[] = [];
  for (const id of ids) {
    const entry = run.entries[id];
    if (entry?.result === undefined) {
      tests.push({ id, ergebnis: 'nicht getestet' });
      continue;
    }
    if (entry.reported !== undefined) continue;
    sent.push(id);
    const sekunden = Math.min(MAX_SECONDS, entry.seconds);
    tests.push(
      entry.result === 'bestanden'
        ? { id, ergebnis: 'bestanden', sekunden }
        : {
            id,
            ergebnis: 'nicht bestanden',
            sekunden,
            schritte: (entry.steps ?? []).map((step) => ({ nr: step.nr, grund: step.reason })),
          },
    );
  }
  if (sent.length === 0) {
    return { ok: false, problem: 'Es gibt kein neues Ergebnis zu senden.' };
  }
  return {
    ok: true,
    body: { format: 'testbericht/1', ...build, tests: tests.slice(0, MAX_REPORT_TESTS) },
    sent,
  };
}

/** The report arrived: its results are marked and leave the next one until they change. */
export function markReported(run: TestRun, ids: readonly string[], now: string): TestRun {
  let next = run;
  for (const id of ids) {
    const entry = next.entries[id];
    if (entry?.result !== undefined) next = withEntry(next, id, { ...entry, reported: now });
  }
  return next;
}

/** What the page says after sending, from the answer of the test zone (status and text). */
export function sendOutcome(status: number, text: string): { sent: boolean; message: string } {
  if (status >= 200 && status < 300) return { sent: true, message: 'Bericht gesendet.' };
  const said = text.replace(/\s+/g, ' ').trim().slice(0, 300);
  if (status === 400) {
    return {
      sent: false,
      message: `Der Testbereich hat den Bericht abgelehnt${said === '' ? '.' : `: ${said}`}`,
    };
  }
  if (status === 401 || status === 403) {
    return {
      sent: false,
      message: 'Bitte im Testbereich anmelden und den Bericht noch einmal senden.',
    };
  }
  if (status === 404) {
    return {
      sent: false,
      message:
        'Der Testbereich nimmt noch keine Berichte an (Antwort 404). Bitte den Bericht vorerst als PDF herunterladen.',
    };
  }
  return {
    sent: false,
    message: `Der Testbereich antwortet mit Fehler ${status}. Bitte später noch einmal senden.`,
  };
}

// --- Stored run -----------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** Results stored before: „teilweise“ (until 2026-11-07) reads as „nicht bestanden“. */
const STORED_RESULTS: Readonly<Record<string, TestResult>> = {
  bestanden: 'bestanden',
  teilweise: 'nichtBestanden',
  nichtBestanden: 'nichtBestanden',
};

function storedSeconds(value: Record<string, unknown>): number {
  if (typeof value.seconds === 'number' && Number.isInteger(value.seconds)) {
    return Math.min(MAX_SECONDS, Math.max(0, value.seconds));
  }
  // Until 2026-11-15 a start and an end were stored; their difference is the measured time.
  if (isTime(value.started) && isTime(value.ended)) {
    const seconds = (Date.parse(value.ended) - Date.parse(value.started)) / 1000;
    if (seconds >= 0 && seconds <= MAX_SECONDS) return Math.floor(seconds);
  }
  return 0;
}

function storedSteps(value: unknown): FailedStep[] {
  if (!Array.isArray(value)) return [];
  const steps = new Map<number, StepReason>();
  for (const step of value) {
    if (!isRecord(step)) continue;
    const { nr, reason } = step;
    if (
      typeof nr === 'number' &&
      Number.isInteger(nr) &&
      nr >= 1 &&
      nr <= MAX_STEP &&
      typeof reason === 'string' &&
      (STEP_REASONS as readonly string[]).includes(reason)
    ) {
      steps.set(nr, reason as StepReason);
    }
  }
  return [...steps].sort(([a], [b]) => a - b).map(([nr, reason]) => ({ nr, reason }));
}

/**
 * The run kept in the page's browser storage; anything malformed is dropped, never trusted. A clock
 * still running from an earlier visit is stopped where it was last saved: the time the page was
 * closed does not count. Comments, the tester's name and corrected minutes of the former run are
 * dropped (2026-11-15: no free text).
 */
export function decodeRun(raw: unknown): TestRun {
  if (!isRecord(raw) || !isRecord(raw.entries)) return emptyRun();
  const entries: Record<string, TestEntry> = {};
  for (const [id, value] of Object.entries(raw.entries)) {
    if (!isRecord(value) || !/^MT-\d+[a-z]?$|^L-\d+[a-z]?$/.test(id)) continue;
    const result =
      typeof value.result === 'string' && Object.hasOwn(STORED_RESULTS, value.result)
        ? STORED_RESULTS[value.result]
        : undefined;
    const steps = result === 'nichtBestanden' ? storedSteps(value.steps) : [];
    const entry: TestEntry = {
      seconds: storedSeconds(value),
      ...(result ? { result } : {}),
      ...(steps.length > 0 ? { steps } : {}),
      ...(result && typeof value.version === 'string' && /^[0-9a-f]{12}$/.test(value.version)
        ? { version: value.version }
        : {}),
      ...(result && isTime(value.reported) ? { reported: value.reported } : {}),
    };
    if (entry.result !== undefined || entry.seconds > 0) entries[id] = entry;
  }
  return { entries };
}
