// The test page next to the app (Tobias 2026-11-01): the manual tests as a catalogue; per test
// "Test beginnen", a result, a comment and the time (correctable). Since 2026-11-07 like the
// Arbeitszeitplaner's: an overview with one box per test (done ones coloured, hideable), and one
// test at a time with "Zurück zur Testübersicht"; the report comes from the header (TestShell).
// All rules live in logic/testRun.ts and logic/manualTests.ts; this only renders and dispatches.
import { useEffect, useRef, useState } from 'react';
import { deviceNow } from '../../io/environment';
import {
  caseVersion,
  inlineMarkdown,
  testAreaOf,
  type ManualTestCase,
} from '../../logic/manualTests';
import {
  LONGEST_TEST_MINUTES,
  RESULTS,
  RESULT_LABELS,
  changedSince,
  correctDuration,
  measuredMinutes,
  needsCorrection,
  resetTest,
  setComment,
  setResult,
  startTest,
  testTime,
  totalsOf,
  type TestEntry,
  type TestResult,
  type TestRun,
} from '../../logic/testRun';
import { Banner } from '../common';
import { START_POINT_PROBLEMS, START_POINTS, TEST_CASES, TEST_FILES } from './catalogue';
import { Blocks, Inline, type RefHandler } from './Markdown';

const SYMBOL: Readonly<Record<TestResult, string>> = { bestanden: '✓', nichtBestanden: '✗' };

const BUTTON: Readonly<Record<TestResult, string>> = {
  bestanden: '✓ Wie erwartet',
  nichtBestanden: '✗ Klappt nicht',
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
    entry?.reported && 'berichtet',
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
  onReport,
}: {
  run: TestRun;
  stored: boolean;
  onRun: (run: TestRun) => void;
  /** A test other than the last one was opened: TestShell asks whether to restart the app. */
  onOpenTest: (testCase: ManualTestCase) => void;
  onStart: (id: string) => void;
  onReport: () => void;
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
  const open = (id: string | undefined) => {
    setSelected(id);
    const testCase = TEST_CASES.find((c) => c.id === id);
    if (!testCase || testCase.id === last) return;
    setLast(testCase.id);
    onOpenTest(testCase);
  };
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
          entry={run.entries[current.id] ?? { comment: '' }}
          run={run}
          refs={refs}
          position={`${at + 1} von ${shown.length}`}
          onRun={onRun}
          onOverview={() => setSelected(undefined)}
          {...(at > 0 ? { onPrevious: () => open(shown[at - 1]?.id) } : {})}
          {...(at + 1 < shown.length ? { onNext: () => open(shown[at + 1]?.id) } : {})}
        />
      ) : (
        <>
          <h2>Testübersicht</h2>
          <label className="test-field">
            Ihr Name (erscheint im Testbericht)
            <input
              value={run.tester}
              maxLength={80}
              onChange={(event) => onRun({ ...run, tester: event.target.value })}
            />
          </label>
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
            {totals.countedMinutes} Min.
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
            <label className="test-field">
              Gesamteindruck (freiwillig)
              <textarea
                rows={4}
                value={run.comment}
                onChange={(event) => onRun({ ...run, comment: event.target.value })}
              />
            </label>
            <button type="button" className="primary" onClick={onReport}>
              Testbericht herunterladen
            </button>
            <p className="muted">
              Die PDF enthält Ihre Ergebnisse, Zeiten und Kommentare – bitte per E-Mail an die
              Kanzlei schicken. Ihre Eingaben in der App kommen nicht hinein. Tests aus einem
              Bericht fehlen im nächsten, außer Sie ändern sie oder nehmen sie beim Herunterladen
              wieder mit.
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
  const running = entry.started !== undefined && entry.result === undefined;
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
  const clock = (local: string | undefined) => testTime(local, now());
  const measured = measuredMinutes(entry);
  const elapsed = running ? measuredMinutes({ ...entry, ended: now() }) : undefined;
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
        {entry.reported ? ` · im Testbericht vom ${testTime(entry.reported, '')}` : ''}
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
        {entry.started === undefined ? (
          <button
            type="button"
            className="primary"
            onClick={() => onRun(startTest(run, testCase.id, now()))}
          >
            Test beginnen (Zeit läuft)
          </button>
        ) : (
          <p className="muted">
            Begonnen {clock(entry.started)}
            {running && elapsed !== undefined ? ` · läuft seit etwa ${elapsed} Min.` : ''}
            {entry.ended
              ? ` · beendet ${clock(entry.ended)} · gemessen ${measured ?? '–'} Min.`
              : ''}
          </p>
        )}
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
        <p className="muted">
          Hat es nur zum Teil geklappt? Bitte „Klappt nicht“ und im Kommentar, was.
        </p>
        {needsCorrection(entry) && (
          <Banner
            message={{
              tone: 'warning',
              text: `Gemessen sind ${measured ?? '–'} Minuten (Beginn ${clock(entry.started)}). Bitte tragen Sie die Dauer ein, die der Test wirklich gebraucht hat – höchstens ${LONGEST_TEST_MINUTES} Minuten.`,
            }}
          />
        )}
        {entry.result && (
          <label className="test-field">
            Dauer korrigieren (Minuten, z. B. ohne Pause) – leer = gemessen
            <input
              type="text"
              inputMode="numeric"
              value={entry.correctedMinutes ?? ''}
              onChange={(event) => {
                const text = event.target.value.trim();
                const minutes = Number(text);
                onRun(
                  correctDuration(
                    run,
                    testCase.id,
                    text === '' || !Number.isFinite(minutes) ? undefined : minutes,
                  ),
                );
              }}
            />
          </label>
        )}
        <label className="test-field">
          Kommentar – was ist aufgefallen?
          <textarea
            rows={4}
            value={entry.comment}
            onChange={(event) => onRun(setComment(run, testCase.id, event.target.value))}
          />
        </label>
        <div className="nav">
          {(entry.started || entry.result) && (
            <button
              type="button"
              className="link"
              onClick={() => onRun(resetTest(run, testCase.id))}
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
