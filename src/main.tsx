import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { TEST_AREA } from './ui/testbereich/catalogue';
import { APP_CONFIG } from './config';
import { colorVariables } from './logic/appConfig';
import { offerInstallation } from './io/webApp';
import './ui/styles.css';

// The Kanzlei colours of this build (config "colors"), set through the CSSOM — allowed by the CSP.
for (const [name, value] of Object.entries(colorVariables(APP_CONFIG.colors))) {
  document.documentElement.style.setProperty(name, value);
}

// The hosted builds can be installed and start offline (only at an https address).
offerInstallation();

if (TEST_AREA) {
  // Only the test folder build carries the shared test page: the condition is fixed at build time,
  // so the live build holds neither the page nor its styles (tests/e2e/flow.spec.ts).
  void import('./ui/testbereich/testbereich').then(({ startTestArea }) => startTestArea());
} else {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element #root is missing');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
