// The test folder build: the test page next to the app; on a narrow screen two tabs. The app stays
// mounted while the instructions are shown, so nothing typed into it is lost. A start link of a test
// mounts the app afresh with a prepared questionnaire (start points, Tobias 2026-11-03).
import { Fragment, useState, type ReactNode } from 'react';
import { BUNDLED_FORMS } from '../../io/bundledForms';
import { deviceNow, newNonce, newQuestionnaireId, systemNoteFor } from '../../io/environment';
import { buildStartPoint } from '../../logic/startPoints';
import type { PreparedStart } from '../App';
import { START_POINTS } from './catalogue';
import { TestPanel } from './TestPanel';

const RESTART_QUESTION =
  'Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.';

/** The prepared questionnaire of a start point, or why there is none. */
function prepare(id: string): PreparedStart | string {
  const point = START_POINTS.get(id);
  if (!point) return `Den Startpunkt „${id}“ gibt es nicht.`;
  const form = BUNDLED_FORMS.ok ? BUNDLED_FORMS.registry.latest(point.form) : undefined;
  if (!form) return `Das Formular „${point.form}“ ist in dieser Fassung der App nicht enthalten.`;
  const now = deviceNow();
  const built = buildStartPoint(point, form, {
    questionnaireId: newQuestionnaireId(),
    nonce: newNonce,
    now: { local: now.local, utc: now.utc },
    systemNote: systemNoteFor(now, ['keyboard']),
  });
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
  const restart = () => {
    if (confirm(`App neu starten? ${RESTART_QUESTION}`)) {
      setStart(undefined);
      setAppKey((key) => key + 1);
      setTab('app');
    }
  };
  const openStart = (id: string) => {
    const prepared = prepare(id);
    if (typeof prepared === 'string') {
      alert(prepared);
      return;
    }
    if (!confirm(`Vorbereiteten Fragebogen öffnen: „${prepared.title}“? ${RESTART_QUESTION}`)) {
      return;
    }
    setStart(prepared);
    setAppKey((key) => key + 1);
    setTab('app');
  };
  return (
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
        <TestPanel onRestartApp={restart} onStart={openStart} />
      </aside>
      <div className="test-app">
        <Fragment key={appKey}>{children(start)}</Fragment>
      </div>
    </div>
  );
}
