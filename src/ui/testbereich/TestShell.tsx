// The test folder build: a header (restart, full reset, report — Tobias 2026-11-07), the test page
// next to the app; on a narrow screen two tabs. The app stays mounted while the instructions are
// shown, so nothing typed into it is lost. A start link of a test mounts the app afresh with a
// prepared questionnaire (start points, Tobias 2026-11-03); opening a test asks whether to restart
// the app with the environment that suits it. A link start point opens the app as its bookmark link
// would; every other start leaves no link in the address bar for the next test.
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
  isLinkStart,
  type StartEnvironment,
} from '../../logic/startPoints';
import { forReport, markReported, reportCounts, type TestRun } from '../../logic/testRun';
import type { SystemNote } from '../../logic/model';
import type { PreparedStart } from '../App';
import { Banner, type BannerMessage } from '../common';
import { createTestReportPdf } from '../pdfActions';
import { START_POINTS, TEST_AREA, TEST_CASES } from './catalogue';
import { ChoiceDialog, type Question } from './ChoiceDialog';
import { loadRun, resetAppStorage, saveRun } from './storage';
import { TestPanel } from './TestPanel';

const RESTART_QUESTION =
  'Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.';

const plain = (text: string) =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');

/** Everything a seal takes from the device: one label, one row of it. */
interface Shared {
  id: string;
  nonces: string[];
  now: { local: string; utc: string };
  systemNote: SystemNote;
}

/**
 * Form start points with one label, for as long as the page is open: the same questionnaire id,
 * nonces, time and system note, so the second start point seals the parts it shares exactly like
 * the first (without the shared system note the Kanzlei saw two versions, e2e 2026-11-07).
 */
const LABELLED = new Map<string, Shared>();

/** What a start link opens: a prepared questionnaire, a bookmark link, or why there is none. */
type Prepared = { title: string; start?: PreparedStart; link?: string };

function prepare(id: string): Prepared | string {
  const point = START_POINTS.get(id);
  if (!point) return `Den Startpunkt „${id}“ gibt es nicht.`;
  if (isLinkStart(point)) return { title: point.title, link: point.link };
  const registry = BUNDLED_FORMS.ok ? BUNDLED_FORMS.registry : undefined;
  const now = deviceNow();
  // Inputs with one label share the questionnaire id and the nonces (equal parts, equal seals).
  const shared = new Map<string, Shared>();
  const envFrom = (own: Shared): StartEnvironment => {
    let next = 0;
    return {
      questionnaireId: own.id,
      nonce: () => {
        if (next === own.nonces.length) own.nonces.push(newNonce());
        return own.nonces[next++] ?? newNonce();
      },
      now: own.now,
      systemNote: own.systemNote,
    };
  };
  const fresh = (): Shared => ({
    id: newQuestionnaireId(),
    nonces: [],
    now: { local: now.local, utc: now.utc },
    systemNote: systemNoteFor(now, ['keyboard']),
  });
  const envOf = (label: string | undefined, labels = shared): StartEnvironment => {
    const own = (label === undefined ? undefined : labels.get(label)) ?? fresh();
    if (label !== undefined) labels.set(label, own);
    return envFrom(own);
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
    return {
      title: point.title,
      start: { title: point.title, screen: 'kanzlei', inbox: inbox.inbox },
    };
  }
  const form = registry?.latest(point.form);
  if (!form) return `Das Formular „${point.form}“ ist in dieser Fassung der App nicht enthalten.`;
  const built = buildStartPoint(point, form, envOf(point.questionnaire, LABELLED));
  if (!built.ok) {
    return `Der Startpunkt „${point.title}“ passt nicht mehr zum Formular:\n\n${built.problems.join('\n')}`;
  }
  return {
    title: point.title,
    start: { title: point.title, session: built.session, screen: built.screen },
  };
}

/**
 * `?startpunkt=<id>` opens a start point right away, without a test text (the automated tests,
 * Tobias 2026-11-08). Read once when the page loads and taken out of the address, so a later
 * restart starts the app plainly; a link start point leaves its link for the app to read.
 */
function startFromAddress(): Prepared | string | undefined {
  const params = new URLSearchParams(location.search);
  const id = params.get('startpunkt');
  if (id === null) return undefined;
  params.delete('startpunkt');
  const prepared = prepare(id);
  const rest = params.toString();
  const search = rest === '' ? '' : `?${rest}`;
  const link = typeof prepared === 'string' || !prepared.link ? '' : `#${prepared.link}`;
  history.replaceState(null, '', location.pathname + search + link);
  return prepared;
}

const FROM_ADDRESS = TEST_AREA ? startFromAddress() : undefined;

export function TestShell({ children }: { children: (start?: PreparedStart) => ReactNode }) {
  const [tab, setTab] = useState<'anleitung' | 'app'>(
    typeof FROM_ADDRESS === 'object' ? 'app' : 'anleitung',
  );
  // A new key mounts the app afresh: back to its start page (or a start point), results stay.
  const [appKey, setAppKey] = useState(0);
  const [start, setStart] = useState<PreparedStart | undefined>(
    typeof FROM_ADDRESS === 'object' ? FROM_ADDRESS.start : undefined,
  );
  const [run, setRun] = useState<TestRun>(loadRun);
  // The run as last changed: a report marks it when its PDF is ready, after any typing meanwhile.
  const latest = useRef(run);
  const [stored, setStored] = useState(true);
  const [question, setQuestion] = useState<Question>();
  const [banner, setBanner] = useState<BannerMessage | undefined>(
    typeof FROM_ADDRESS === 'string' ? { tone: 'error', text: FROM_ADDRESS } : undefined,
  );
  const update = (next: TestRun) => {
    latest.current = next;
    setRun(next);
    setStored(saveRun(next));
  };

  const launch = (prepared: Prepared | undefined, showApp: boolean) => {
    // The app reads a link from the address bar when it mounts: set it for a link start point,
    // clear it for every other start, so no link carries over into the next test.
    history.replaceState(
      null,
      '',
      location.pathname + location.search + (prepared?.link ? `#${prepared.link}` : ''),
    );
    setStart(prepared?.start);
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
    // launch clears the address bar too: a link would else fill the fresh app again.
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
