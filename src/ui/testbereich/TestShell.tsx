// The test folder build: the test page next to the app; on a narrow screen two tabs. The app stays
// mounted while the instructions are shown, so nothing typed into it is lost.
import { useState, type ReactNode } from 'react';
import { TestPanel } from './TestPanel';

export function TestShell({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<'anleitung' | 'app'>('anleitung');
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
        <TestPanel />
      </aside>
      <div className="test-app">{children}</div>
    </div>
  );
}
