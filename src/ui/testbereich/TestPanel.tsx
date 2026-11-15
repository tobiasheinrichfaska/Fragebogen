// The test page next to the app (Tobias 2026-11-01): the manual tests as a catalogue. Since
// 2026-11-07 like the Arbeitszeitplaner's: an overview with one box per test (done ones coloured,
// hideable), and one test at a time with "Zurück zur Testübersicht". Since 2026-11-15 without any
// free text (Testumgebung docs/testbericht.md): per test „Bestanden“ or „Nicht bestanden“ with the
// failed steps and a reason from a fixed list; the clock runs while a test is open. The report is
// sent from the header (TestShell). All rules live in logic/testRun.ts and logic/manualTests.ts;
// this only renders and dispatches.
import { useEffect, useRef, useState } from 'react';
import { deviceNow } from '../../io/environment';
import {
  caseVersion,
  inlineMarkdown,
  stepsOf,
  testAreaOf,
  type ManualTestCase,
} from '../../logic/manualTests';
import {
  RESULTS,
  RESULT_LABELS,
  STEP_REASONS,
  STEP_REASON_LABELS,
  changedSince,
  checkpoint,
  elapsedSeconds,
  leaveTest,
  minutesOf,
  openTest,
  resetTest,
  setResult,
  setStep,
  testTime,
  totalsOf,
  type StepReason,
  type TestEntry,
  type TestResult,
  type TestRun,
} from '../../logic/testRun';
import { Banner } from '../common';
import { START_POINT_PROBLEMS, START_POINTS, TEST_CASES, TEST_FILES } from './catalogue';
import { Blocks, Inline, type RefHandler } from './Markdown';

const SYMBOL: Readonly<Record<TestResult, string>> = { bestanden: '✓', nichtBestanden: '✗' };

const BUTTON: Readonly<Record<TestResult, string>> = {
  bestanden: '✓ Bestanden',
  nichtBestanden: '✗ Nicht bestanden',
};

const plain = (text: string) =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');

const chipId = (id: string) => `test-chip-${id}`;

/**
 * Brings an element of the test page into view: on a wide screen only the page's own column
 * scrolls (the app next to it stays where it is), on a narrow one the window.
 */
function bringIntoView(element: HTMLElement | null, block: 'start' | 'center'): void {
  if (!element) return;
  const panel = element.closest<HTMLElement>('.test-panel');
  if (!panel || window.matchMedia('(max-width: 900px)').matches) {
    element.scrollIntoView({ block });
    return;
  }
  const offset = element.getBoundingClientRect().top - panel.getBoundingClientRect().top;
  panel.scrollTop +=
    block === 'start' ? offset - 16 : offset - (panel.clientHeight - element.offsetHeight) / 2;
}

type TestCase = (typeof TEST_CASES)[number];

/** What a box says to a screen reader and on hover: id, title, result, reported, changed. */
function chipLabel(testCase: TestCase, entry: TestEntry | undefined): string {
  return [
    `${testCase.id}: ${plain(testCase.title)}`,
    entry?.result && RESULT_LABELS[entry.result],
    entry?.reported && 'gesendet',
    changedSince(entry, caseVersion(testCase)) && 'geändert seit Ihrem Test',
    !testAreaOf(testCase).offered && 'nicht im Testbereich',
  ]
    .filter(Boolean)
    .join(' – ');
}

export function TestPanel({
  run,
  stored,
  onRun,
  onOpenTest,
  onStart,
  onSend,
}: {
  run: TestRun;
  stored: boolean;
  onRun: (run: TestRun) => void;
  /** A test other than the last one was opened: TestShell asks whether to restart the app. */
  onOpenTest: (testCase: ManualTestCase) => void;
  onStart: (id: string) => void;
  onSend: () => void;
}) {
  const [area, setArea] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const [selected, setSelected] = useState<string>();
  // The test opened last: outlined in the overview, and no second restart question for it.
  const [last, setLast] = useState<string>();
  const done = (id: string) => run.entries[id]?.result !== undefined;
  const inArea = TEST_CASES.filter((c) => area === '' || c.area === area);
  // The open test stays in the sequence even when it is done and done tests are hidden.
  const shown = inArea.filter((c) => !hideDone || !done(c.id) || c.id === selected);
  const current = TEST_CASES.find((c) => c.id === selected);
  const totals = totalsOf(run);
  const intro = TEST_FILES.find((file) => file.area === area)?.intro ?? [];
  // The run as last rendered, for the page's own events (hidden, closed).
  const current$ = useRef({ run, selected, onRun });
  useEffect(() => {
    current$.current = { run, selected, onRun };
  });
  /** Leaving one test pauses its clock, opening another starts it (logic/testRun.ts). */
  const open = (id: string | undefined) => {
    const now = deviceNow().local;
    let next = selected === undefined ? run : leaveTest(run, selected, now);
    if (id !== undefined) next = openTest(next, id, now);
    if (next !== run) onRun(next);
    setSelected(id);
    const testCase = TEST_CASES.find((c) => c.id === id);
    if (!testCase || testCase.id === last) return;
    setLast(testCase.id);
    onOpenTest(testCase);
  };
  // A hidden page keeps the time so far; a closed one stops the clock of the open test.
  useEffect(() => {
    const store = (stop: boolean) => {
      const { run: now$, selected: id, onRun: save } = current$.current;
      if (id === undefined) return;
      const now = deviceNow().local;
      const next = stop ? leaveTest(now$, id, now) : checkpoint(now$, id, now);
      if (next !== now$) save(next);
    };
    const hidden = () => {
      if (document.visibilityState === 'hidden') store(false);
    };
    const closed = () => store(true);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', closed);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', closed);
    };
  }, []);
  // Back in the overview, the box of the test just left stands in view.
  useEffect(() => {
    if (selected === undefined && last !== undefined) {
      bringIntoView(document.getElementById(chipId(last)), 'center');
    }
  }, [selected, last]);
  const refs: RefHandler = {
    open,
    knows: (id) => TEST_CASES.some((c) => c.id === id),
    start: onStart,
    startKnown: (id) => START_POINTS.has(id),
  };
  const at = current ? shown.findIndex((c) => c.id === current.id) : -1;

  return (
    <div className="test-panel-inner">
      {START_POINT_PROBLEMS.length > 0 && (
        <Banner
          message={{
            tone: 'error',
            text: 'Einige vorbereitete Startpunkte sind fehlerhaft und fehlen deshalb:',
            detail: [...START_POINT_PROBLEMS],
          }}
        />
      )}
      {!stored && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Dieser Browser speichert die Testergebnisse nicht (z. B. privates Fenster). Bitte die Seite bis zum Testbericht nicht schließen.',
          }}
        />
      )}
      {current ? (
        <TestCaseView
          key={current.id}
          testCase={current}
          entry={run.entries[current.id] ?? { seconds: 0 }}
          run={run}
          refs={refs}
          position={`${at + 1} von ${shown.length}`}
          onRun={onRun}
          onOverview={() => open(undefined)}
          {...(at > 0 ? { onPrevious: () => open(shown[at - 1]?.id) } : {})}
          {...(at + 1 < shown.length ? { onNext: () => open(shown[at + 1]?.id) } : {})}
        />
      ) : (
        <>
          <h2>Testübersicht</h2>
          <div className="test-filters">
            <label className="test-field">
              Bereich
              <select value={area} onChange={(event) => setArea(event.target.value)}>
                <option value="">Alle Bereiche ({TEST_CASES.length} Tests)</option>
                {TEST_FILES.map((file) => (
                  <option key={file.source} value={file.area}>
                    {file.area} ({file.cases.length})
                  </option>
                ))}
              </select>
            </label>
            <label className="test-check">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(event) => setHideDone(event.target.checked)}
              />
              Erledigte ausblenden
            </label>
          </div>
          <p>
            <strong>{totals.tested}</strong> von {TEST_CASES.length} geprüft · {SYMBOL.bestanden}{' '}
            {RESULT_LABELS.bestanden} {totals.byResult.bestanden} · {SYMBOL.nichtBestanden}{' '}
            {RESULT_LABELS.nichtBestanden} {totals.byResult.nichtBestanden} · Zeit{' '}
            {minutesOf(totals.seconds)} Min.
          </p>
          {intro.length > 0 && (
            <div className="test-intro">
              <Blocks blocks={intro} />
            </div>
          )}
          <div className="test-grid">
            {TEST_FILES.filter((file) => area === '' || file.area === area).map((file) => {
              const cases = shown.filter((c) => c.area === file.area);
              if (cases.length === 0) return null;
              return (
                <div key={file.source} className="test-grid-row">
                  <span className="test-grid-area">{file.area}</span>
                  <div className="test-grid-chips">
                    {cases.map((c) => {
                      const entry = run.entries[c.id];
                      const result = entry?.result;
                      const label = chipLabel(c, entry);
                      const classes = [
                        'test-chip',
                        result,
                        changedSince(entry, caseVersion(c)) && 'changed',
                        !testAreaOf(c).offered && 'elsewhere',
                      ];
                      return (
                        <button
                          key={c.id}
                          id={chipId(c.id)}
                          type="button"
                          className={classes.filter(Boolean).join(' ')}
                          aria-label={label}
                          title={label}
                          aria-current={c.id === last ? 'true' : undefined}
                          onClick={() => open(c.id)}
                        >
                          {result ? `${SYMBOL[result]} ` : ''}
                          {c.id.replace(/^MT-/, '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <p className="muted">
                Alle Tests {area === '' ? '' : 'dieses Bereichs '}sind erledigt.
              </p>
            )}
          </div>
          <div className="test-summary">
            <button type="button" className="primary" onClick={onSend}>
              Bericht senden
            </button>
            <p className="muted">
              Der Bericht enthält nur, welche Tests bestanden sind, welche nicht und in welchen
              Schritten, dazu die gemessene Zeit – keinen Namen und keinen Text. Ihre Eingaben in
              der App kommen nicht hinein. Ein gesendetes Ergebnis kommt erst wieder mit, wenn Sie
              es ändern.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function TestCaseView({
  testCase,
  entry,
  run,
  refs,
  position,
  onRun,
  onOverview,
  onPrevious,
  onNext,
}: {
  testCase: TestCase;
  entry: TestEntry;
  run: TestRun;
  refs: RefHandler;
  position: string;
  onRun: (run: TestRun) => void;
  onOverview: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const running = entry.openedAt !== undefined;
  const top = useRef<HTMLElement>(null);
  // Tobias 2026-11-07: a test opened from far down the list began at its bottom.
  useEffect(() => bringIntoView(top.current, 'start'), []);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, [running]);
  const now = () => deviceNow().local;
  const minutes = minutesOf(elapsedSeconds(entry, now()));
  const steps = stepsOf(testCase);
  const reasonOf = (nr: number) => entry.steps?.find((step) => step.nr === nr)?.reason ?? '';
  const area = testAreaOf(testCase);
  const nav = (
    <div className="test-case-nav">
      <button type="button" disabled={!onPrevious} onClick={onPrevious}>
        ‹ Vorheriger
      </button>
      <span className="muted">{position}</span>
      <button type="button" disabled={!onNext} onClick={onNext}>
        Nächster ›
      </button>
    </div>
  );

  return (
    <article className="test-case" ref={top}>
      <button type="button" className="link" onClick={onOverview}>
        ← Zurück zur Testübersicht
      </button>
      <h2>
        {testCase.id}: <Inline text={testCase.title} />
      </h2>
      <p className="muted">
        {testCase.area}
        {entry.reported ? ` · gesendet ${testTime(entry.reported, '')}` : ''}
      </p>
      {nav}
      {changedSince(entry, caseVersion(testCase)) && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Dieser Test wurde geändert, seit Sie ihn bewertet haben. Bitte gehen Sie ihn noch einmal durch und bewerten Sie ihn neu.',
          }}
        />
      )}
      {area.note === undefined ? (
        !testCase.parts.some((part) => part.label === 'Einstieg') && (
          <p className="muted">
            Einstieg, wenn nicht anders angegeben: die Startseite der App („App neu starten“ oben).
          </p>
        )
      ) : (
        <Banner
          message={{
            tone: area.offered ? 'info' : 'warning',
            text: `${area.offered ? 'Im Testbereich' : 'Nicht im Testbereich'}: ${plain(area.note).replace(/^nein\s*[–-]\s*/i, '')}`,
          }}
        />
      )}
      {testCase.parts
        .filter((part) => part.label !== 'Testbereich')
        .map((part, i) => (
          <section key={`${part.label}-${i}`}>
            {part.label && <h3>{part.label}</h3>}
            <Blocks blocks={part.blocks} refs={refs} copy={part.label === 'Schritte'} />
          </section>
        ))}

      <div className="test-controls">
        <p className="muted">
          {running
            ? `Zeit läuft: ${minutes} Min. – sie hält an, wenn Sie den Test verlassen, und endet mit dem Ergebnis.`
            : `Zeit: ${minutes} Min.`}
        </p>
        <div className="choices choices-inline" role="radiogroup" aria-label="Ergebnis">
          {RESULTS.map((result) => (
            <button
              key={result}
              type="button"
              role="radio"
              aria-checked={entry.result === result}
              className={entry.result === result ? 'choice chosen' : 'choice'}
              onClick={() =>
                onRun(setResult(run, testCase.id, result, now(), caseVersion(testCase)))
              }
            >
              {BUTTON[result]}
            </button>
          ))}
        </div>
        {entry.result === 'nichtBestanden' ? (
          <fieldset className="test-steps">
            <legend>In welchen Schritten gab es ein Problem?</legend>
            {(entry.steps ?? []).length === 0 && (
              <p className="test-steps-missing">
                Bitte mindestens einen Schritt mit seinem Grund wählen.
              </p>
            )}
            {steps.map((text, i) => {
              const nr = i + 1;
              return (
                <label key={nr} className="test-step-reason">
                  <span>
                    Schritt {nr}: {text.length > 70 ? `${text.slice(0, 69)}…` : text}
                  </span>
                  <select
                    value={reasonOf(nr)}
                    onChange={(event) =>
                      onRun(
                        setStep(
                          run,
                          testCase.id,
                          nr,
                          event.target.value === ''
                            ? undefined
                            : (event.target.value as StepReason),
                        ),
                      )
                    }
                  >
                    <option value="">in Ordnung</option>
                    {STEP_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {STEP_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <p className="muted">
            Hat es nur zum Teil geklappt? Bitte „Nicht bestanden“ und dann den Schritt wählen.
          </p>
        )}
        <div className="nav">
          {entry.result && (
            <button
              type="button"
              className="link"
              onClick={() => onRun(resetTest(run, testCase.id, now()))}
            >
              Test zurücksetzen
            </button>
          )}
          <button type="button" onClick={onOverview}>
            Zurück zur Testübersicht
          </button>
          <button type="button" className="primary" disabled={!onNext} onClick={onNext}>
            Nächster Test
          </button>
        </div>
      </div>
    </article>
  );
}
