// The test folder build (Tobias 2026-11-15: the shared test page of Testumgebung replaces the own
// one): the test page next to the app, the app mounted into its container. A start point mounts the
// app afresh with a prepared questionnaire; `?startpunkt=<id>` opens one at once (the automated
// tests, 2026-11-08). Restart and full reset leave the test page's results alone. The copy in
// testrahmen/ is never changed here (`tests/static/testrahmen.test.ts`).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { starteTestrahmen } from '../../../testrahmen/testrahmen.js';
import '../../../testrahmen/testrahmen.css';
import { APP_COMMIT, APP_VERSION } from '../../appInfo';
import { App } from '../App';
import { Banner } from '../common';
import { HANDTESTS, START_POINTS } from './catalogue';
import { prepare, type Prepared } from './prepare';
import { REPORT_APP } from './report';
import { resetAppStorage } from './reset';

/**
 * `?startpunkt=<id>` read once when the page loads and taken out of the address, so a later restart
 * starts the app plainly; a link start point leaves its link for the app to read.
 */
function startFromAddress(): Prepared | string | undefined {
  const params = new URLSearchParams(location.search);
  const id = params.get('startpunkt');
  if (id === null) return undefined;
  params.delete('startpunkt');
  const prepared = prepare(id);
  const rest = params.toString();
  const link = typeof prepared === 'string' || !prepared.link ? '' : `#${prepared.link}`;
  history.replaceState(null, '', location.pathname + (rest === '' ? '' : `?${rest}`) + link);
  return prepared;
}

export function startTestArea(): void {
  const fromAddress = startFromAddress();
  // The test page holds the app; the plain mount point of the live build stays unused.
  document.getElementById('root')?.remove();
  const frame = starteTestrahmen(document.body, {
    app: REPORT_APP,
    name: 'Fragebogen',
    version: APP_VERSION,
    stand: APP_COMMIT,
    handtests: HANDTESTS,
    startpunkte: [...START_POINTS.values()].map((point) => ({ id: point.id, titel: point.title })),
    laden: (id) => {
      const prepared = prepare(id);
      // A start point that cannot be built still starts the app plainly, without the last link.
      if (typeof prepared === 'string') launch(undefined, prepared);
      else launch(prepared);
    },
    neuStarten: () => launch(undefined),
    zuruecksetzen: () => {
      const problem = resetAppStorage();
      launch(
        undefined,
        problem === undefined ? undefined : `Der Browser hat nicht alles gelöscht. ${problem}`,
      );
    },
  });
  const root = createRoot(frame.appBehaelter);
  // A new key mounts the app afresh: back to its start page or a start point.
  let generation = 0;

  function show(prepared: Prepared | undefined, problem?: string): void {
    generation += 1;
    root.render(
      <StrictMode>
        {problem !== undefined && (
          <div className="test-start-problem">
            <Banner message={{ tone: 'error', text: problem }} />
          </div>
        )}
        <App key={generation} {...(prepared?.start ? { start: prepared.start } : {})} />
      </StrictMode>,
    );
  }

  function launch(prepared: Prepared | undefined, problem?: string): void {
    // The app reads a link from the address bar when it mounts: set it for a link start point,
    // clear it for every other start, so no link carries over into the next test.
    history.replaceState(
      null,
      '',
      location.pathname + location.search + (prepared?.link ? `#${prepared.link}` : ''),
    );
    show(prepared, problem);
  }

  if (typeof fromAddress === 'string') show(undefined, fromAddress);
  else show(fromAddress);
  // Opened at a start point, the app is what the person came for — on a phone its tab comes first.
  if (fromAddress !== undefined) {
    document.querySelector<HTMLButtonElement>('.tr-reiter [data-wert="app"]')?.click();
  }
}
