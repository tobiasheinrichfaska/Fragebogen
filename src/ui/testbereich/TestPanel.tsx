// The test page next to the app (Tobias 2026-11-01): the manual tests as a catalogue; per test
// "Test beginnen", a result, a comment and the time (correctable); at the end a report as a PDF.
// All rules live in logic/testRun.ts and logic/manualTests.ts; this only renders and dispatches.
import { useEffect, useState } from 'react';
import { deviceNow } from '../../io/environment';
import { caseVersion, inlineMarkdown, testAreaOf } from '../../logic/manualTests';
import {
  RESULTS,
  RESULT_LABELS,
  changedSince,
  correctDuration,
  measuredMinutes,
  resetTest,
  setComment,
  setResult,
  startTest,
  totalsOf,
  type TestEntry,
  type TestRun,
} from '../../logic/testRun';
import { Banner, type BannerMessage } from '../common';
import { createTestReportPdf } from '../pdfActions';
import { START_POINT_PROBLEMS, START_POINTS, TEST_CASES, TEST_FILES } from './catalogue';
import { Blocks, Inline, type RefHandler } from './Markdown';
import { loadRun, saveRun } from './storage';

const SYMBOL: Readonly<Record<string, string>> = {
  bestanden: '✓',
  teilweise: '◐',
  nichtBestanden: '✗',
};

const plain = (text: string) =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');

const clock = (local: string | undefined) => (local ? `${local.slice(11, 16)} Uhr` : '–');

export function TestPanel({
  onRestartApp,
  onStart,
}: {
  onRestartApp: () => void;
  onStart: (id: string) => void;
}) {
  const [run, setRun] = useState<TestRun>(loadRun);
  const [stored, setStored] = useState(true);
  const [area, setArea] = useState('');
  const [selected, setSelected] = useState<string>();
  const [banner, setBanner] = useState<BannerMessage>();
  const update = (next: TestRun) => {
    setRun(next);
    setStored(saveRun(next));
  };
  const shown = TEST_CASES.filter((c) => area === '' || c.area === area);
  const current = TEST_CASES.find((c) => c.id === selected);
  const totals = totalsOf(run);
  const intro = TEST_FILES.find((file) => file.area === area)?.intro ?? [];
  const refs: RefHandler = {
    open: (id) => setSelected(id),
    knows: (id) => TEST_CASES.some((c) => c.id === id),
    start: onStart,
    startKnown: (id) => START_POINTS.has(id),
  };

  const report = async () => {
    setBanner(
      await createTestReportPdf(
        run,
        TEST_CASES.map((c) => ({
          id: c.id,
          title: plain(c.title),
          area: c.area,
          version: caseVersion(c),
        })),
      ),
    );
  };

  return (
    <div className="test-panel-inner">
      <h1>Testbereich</h1>
      <p className="test-restart">
        <button type="button" onClick={onRestartApp}>
          App neu starten (Startseite)
        </button>
      </p>
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
      {banner && <Banner message={banner} onClose={() => setBanner(undefined)} />}
      {current ? (
        <TestCaseView
          key={current.id}
          testCase={current}
          entry={run.entries[current.id] ?? { comment: '' }}
          run={run}
          refs={refs}
          onRun={update}
          onBack={() => setSelected(undefined)}
          onNext={() => {
            const at = shown.findIndex((c) => c.id === current.id);
            setSelected(shown[at + 1]?.id);
          }}
        />
      ) : (
        <>
          <label className="test-field">
            Ihr Name (erscheint im Testbericht)
            <input
              value={run.tester}
              maxLength={80}
              onChange={(event) => update({ ...run, tester: event.target.value })}
            />
          </label>
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
          {intro.length > 0 && (
            <div className="test-intro">
              <Blocks blocks={intro} />
            </div>
          )}
          <ul className="test-list">
            {shown.map((c) => {
              const result = run.entries[c.id]?.result;
              return (
                <li key={c.id}>
                  <button type="button" className="wide" onClick={() => setSelected(c.id)}>
                    <span className={`test-symbol ${result ?? ''}`} aria-hidden="true">
                      {result ? SYMBOL[result] : '○'}
                    </span>
                    <span>
                      <strong>{c.id}</strong> <Inline text={c.title} />
                      {result && <span className="muted"> – {RESULT_LABELS[result]}</span>}
                      {changedSince(run.entries[c.id], caseVersion(c)) && (
                        <span className="test-changed"> – geändert seit Ihrem Test</span>
                      )}
                      {!testAreaOf(c).offered && (
                        <span className="muted"> – nicht im Testbereich</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="test-summary">
            <p>
              Getestet: <strong>{totals.tested}</strong> von {TEST_CASES.length} · bestanden{' '}
              {totals.byResult.bestanden}, teilweise {totals.byResult.teilweise}, nicht bestanden{' '}
              {totals.byResult.nichtBestanden} · Zeit {totals.countedMinutes} Min.
            </p>
            <label className="test-field">
              Gesamteindruck (freiwillig)
              <textarea
                rows={4}
                value={run.comment}
                onChange={(event) => update({ ...run, comment: event.target.value })}
              />
            </label>
            <button type="button" className="primary" onClick={() => void report()}>
              Testbericht als PDF
            </button>
            <p className="muted">
              Die PDF enthält Ihre Ergebnisse, Zeiten und Kommentare – bitte per E-Mail an die
              Kanzlei schicken. Ihre Eingaben in der App kommen nicht hinein.
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
  onRun,
  onBack,
  onNext,
}: {
  testCase: (typeof TEST_CASES)[number];
  entry: TestEntry;
  run: TestRun;
  refs: RefHandler;
  onRun: (run: TestRun) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const running = entry.started !== undefined && entry.result === undefined;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, [running]);
  const now = () => deviceNow().local;
  const measured = measuredMinutes(entry);
  const elapsed = running ? measuredMinutes({ ...entry, ended: now() }) : undefined;
  const area = testAreaOf(testCase);

  return (
    <article className="test-case">
      <button type="button" className="link" onClick={onBack}>
        ← Zur Liste
      </button>
      <h2>
        {testCase.id}: <Inline text={testCase.title} />
      </h2>
      <p className="muted">{testCase.area}</p>
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
            <Blocks blocks={part.blocks} refs={refs} />
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
              {RESULT_LABELS[result]}
            </button>
          ))}
        </div>
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
          <button type="button" onClick={onBack}>
            Zur Liste
          </button>
          <button type="button" className="primary" onClick={onNext}>
            Nächster Test
          </button>
        </div>
      </div>
    </article>
  );
}
