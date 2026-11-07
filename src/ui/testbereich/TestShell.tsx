// The test folder build: a header (restart, full reset, report — Tobias 2026-11-07), the test page
// next to the app; on a narrow screen two tabs. The app stays mounted while the instructions are
// shown, so nothing typed into it is lost. A start link of a test mounts the app afresh with a
// prepared questionnaire (start points, Tobias 2026-11-03); opening a test asks whether to restart
// the app with the environment that suits it.
import { Fragment, useRef, useState, type ReactNode } from 'react';
import { BUNDLED_FORMS } from '../../io/bundledForms';
import { deviceNow, newNonce, newQuestionnaireId, systemNoteFor } from '../../io/environment';
import {
  caseVersion,
  inlineMarkdown,
  testAreaOf,
  testEnvironment,
  type ManualTestCase,
} from '../../logic/manualTests';
import {
  buildKanzleiStart,
  buildStartPoint,
  isKanzleiStart,
  type StartEnvironment,
} from '../../logic/startPoints';
import { forReport, markReported, reportCounts, type TestRun } from '../../logic/testRun';
import type { PreparedStart } from '../App';
import { Banner, type BannerMessage } from '../common';
import { createTestReportPdf } from '../pdfActions';
import { START_POINTS, TEST_CASES } from './catalogue';
import { ChoiceDialog, type Question } from './ChoiceDialog';
import { loadRun, resetAppStorage, saveRun } from './storage';
import { TestPanel } from './TestPanel';

const RESTART_QUESTION =
  'Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.';

const plain = (text: string) =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');

/** The prepared questionnaire of a start point, or why there is none. */
function prepare(id: string): PreparedStart | string {
  const point = START_POINTS.get(id);
  if (!point) return `Den Startpunkt „${id}“ gibt es nicht.`;
  const registry = BUNDLED_FORMS.ok ? BUNDLED_FORMS.registry : undefined;
  const now = deviceNow();
  const systemNote = systemNoteFor(now, ['keyboard']);
  // Inputs with one label share the questionnaire id and the nonces (equal parts, equal seals).
  const shared = new Map<string, { id: string; nonces: string[] }>();
  const envOf = (label: string | undefined): StartEnvironment => {
    const own = (label === undefined ? undefined : shared.get(label)) ?? {
      id: newQuestionnaireId(),
      nonces: [],
    };
    if (label !== undefined) shared.set(label, own);
    let next = 0;
    return {
      questionnaireId: own.id,
      nonce: () => {
        if (next === own.nonces.length) own.nonces.push(newNonce());
        return own.nonces[next++] ?? newNonce();
      },
      now: { local: now.local, utc: now.utc },
      systemNote,
    };
  };
  if (isKanzleiStart(point)) {
    const inbox = buildKanzleiStart(
      point,
      START_POINTS,
      (formId) => registry?.latest(formId),
      envOf,
      { local: now.local, utc: now.utc, timeZone: now.timeZone },
    );
    if (!inbox.ok) {
      return `Der Startpunkt „${point.title}“ passt nicht mehr zum Formular:\n\n${inbox.problems.join('\n')}`;
    }
    return { title: point.title, screen: 'kanzlei', inbox: inbox.inbox };
  }
  const form = registry?.latest(point.form);
  if (!form) return `Das Formular „${point.form}“ ist in dieser Fassung der App nicht enthalten.`;
  const built = buildStartPoint(point, form, envOf(undefined));
  if (!built.ok) {
    return `Der Startpunkt „${point.title}“ passt nicht mehr zum Formular:\n\n${built.problems.join('\n')}`;
  }
  return { title: point.title, session: built.session, screen: built.screen };
}

export function TestShell({ children }: { children: (start?: PreparedStart) => ReactNode }) {
  const [tab, setTab] = useState<'anleitung' | 'app'>('anleitung');
  // A new key mounts the app afresh: back to its start page (or a start point), results stay.
  const [appKey, setAppKey] = useState(0);
  const [start, setStart] = useState<PreparedStart>();
  const [run, setRun] = useState<TestRun>(loadRun);
  // The run as last changed: a report marks it when its PDF is ready, after any typing meanwhile.
  const latest = useRef(run);
  const [stored, setStored] = useState(true);
  const [question, setQuestion] = useState<Question>();
  const [banner, setBanner] = useState<BannerMessage>();
  const update = (next: TestRun) => {
    latest.current = next;
    setRun(next);
    setStored(saveRun(next));
  };

  const launch = (prepared: PreparedStart | undefined, showApp: boolean) => {
    setStart(prepared);
    setAppKey((key) => key + 1);
    if (showApp) setTab('app');
  };
  const restartChoice = (label: string, primary: boolean, showApp: boolean) => ({
    label,
    primary,
    onChoose: () => launch(undefined, showApp),
  });
  const keepChoice = (primary: boolean) => ({ label: 'App so lassen', primary });

  const askRestart = () =>
    setQuestion({
      title: 'App neu starten?',
      text: ['Die App beginnt wieder auf ihrer Startseite.', RESTART_QUESTION],
      choices: [{ label: 'Abbrechen' }, restartChoice('App neu starten', true, true)],
    });

  const reset = () => {
    const problem = resetAppStorage();
    // A link fragment (transfer or master-data link) would else fill the fresh app again.
    history.replaceState(null, '', location.pathname + location.search);
    launch(undefined, true);
    setBanner(
      problem === undefined
        ? {
            tone: 'success',
            text: 'Die App ist zurückgesetzt: nichts mehr in diesem Browser gespeichert, kein Link in der Adresszeile. Die Testergebnisse sind erhalten.',
          }
        : {
            tone: 'error',
            text: 'Der Browser hat nicht alles gelöscht.',
            detail: [problem],
          },
    );
  };
  const askReset = () =>
    setQuestion({
      title: 'App vollständig zurücksetzen?',
      text: [
        'Die App löscht alles, was sie in diesem Browser gespeichert hat – auch einen angefangenen Fragebogen zum Fortsetzen – und den Link in der Adresszeile. Dann beginnt sie auf ihrer Startseite.',
        'Ihre Testergebnisse bleiben erhalten.',
      ],
      choices: [{ label: 'Abbrechen' }, { label: 'Zurücksetzen', primary: true, onChoose: reset }],
    });

  const openStart = (id: string) => {
    const prepared = prepare(id);
    if (typeof prepared === 'string') {
      setBanner({ tone: 'error', text: prepared });
      return;
    }
    setQuestion({
      title: 'Vorbereiteten Fragebogen öffnen?',
      text: [`„${prepared.title}“`, RESTART_QUESTION],
      choices: [
        { label: 'Abbrechen' },
        { label: 'Öffnen', primary: true, onChoose: () => launch(prepared, true) },
      ],
    });
  };

  // Tobias 2026-11-07: "beim Aufrufen eines neuen Tests immer fragen, ob die App neu gestartet
  // werden soll – mit der für diesen Test sinnvollen Umgebung".
  const openTest = (testCase: ManualTestCase) => {
    if (!testAreaOf(testCase).offered) return;
    const env = testEnvironment(testCase);
    const title = `App für ${testCase.id} neu starten?`;
    if (env.kind === 'start') {
      const prepared = prepare(env.id);
      if (typeof prepared === 'string') {
        setQuestion({
          title,
          text: [prepared],
          choices: [restartChoice('App neu starten (Startseite)', false, false), keepChoice(true)],
        });
        return;
      }
      setQuestion({
        title,
        text: [`Dieser Test beginnt mit „${prepared.title}“.`, RESTART_QUESTION],
        choices: [
          keepChoice(false),
          {
            label: 'Mit diesem Einstieg neu starten',
            primary: true,
            onChoose: () => launch(prepared, false),
          },
        ],
      });
    } else if (env.kind === 'home') {
      setQuestion({
        title,
        text: ['Dieser Test beginnt auf der Startseite der App.', RESTART_QUESTION],
        choices: [keepChoice(false), restartChoice('App neu starten', true, false)],
      });
    } else {
      setQuestion({
        title,
        text: [`Einstieg: ${env.text}`, 'Die App kann dafür bleiben, wie sie ist.'],
        choices: [restartChoice('App neu starten (Startseite)', false, false), keepChoice(true)],
      });
    }
  };

  const writeReport = async (withReported: boolean) => {
    const message = await createTestReportPdf(
      forReport(run, withReported),
      TEST_CASES.map((c) => ({
        id: c.id,
        title: plain(c.title),
        area: c.area,
        version: caseVersion(c),
      })),
    );
    setBanner(message);
    // Tobias 2026-11-07: tests in a report leave the next one by themselves.
    if (message.tone === 'success') update(markReported(latest.current, deviceNow().local));
  };
  const report = () => {
    const counts = reportCounts(run);
    if (counts.reported === 0) {
      void writeReport(false);
      return;
    }
    setQuestion({
      title: 'Schon gemeldete Tests mitnehmen?',
      text: [
        `${counts.reported} ${counts.reported === 1 ? 'Test stand' : 'Tests standen'} schon in einem früheren Testbericht; ${counts.open} ${counts.open === 1 ? 'ist' : 'sind'} neu oder geändert.`,
        'Sollen die schon gemeldeten Tests wieder in diesen Bericht?',
      ],
      choices: [
        { label: 'Abbrechen' },
        { label: 'Ja, alle mitnehmen', onChoose: () => void writeReport(true) },
        {
          label: counts.open === 0 ? 'Nein (Bericht ohne Tests)' : 'Nein, nur neue und geänderte',
          primary: true,
          onChoose: () => void writeReport(false),
        },
      ],
    });
  };

  return (
    <>
      <header className="test-header">
        <strong>Testbereich</strong>
        <div className="test-header-actions">
          <button type="button" onClick={askRestart}>
            App neu starten
          </button>
          <button type="button" onClick={askReset}>
            App vollständig zurücksetzen
          </button>
          <button type="button" className="primary" onClick={report}>
            Testbericht herunterladen
          </button>
        </div>
      </header>
      {banner && (
        <div className="test-banner">
          <Banner message={banner} onClose={() => setBanner(undefined)} />
        </div>
      )}
      {question && <ChoiceDialog question={question} onClose={() => setQuestion(undefined)} />}
      <div className="test-shell" data-tab={tab}>
        <div className="test-tabs" role="tablist" aria-label="Ansicht">
          {(
            [
              ['anleitung', 'Testanleitung'],
              ['app', 'App'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'choice chosen' : 'choice'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <aside className="test-panel" aria-label="Testanleitung">
          <TestPanel
            run={run}
            stored={stored}
            onRun={update}
            onOpenTest={openTest}
            onStart={openStart}
            onReport={report}
          />
        </aside>
        <div className="test-app">
          <Fragment key={appKey}>{children(start)}</Fragment>
        </div>
      </div>
    </>
  );
}
