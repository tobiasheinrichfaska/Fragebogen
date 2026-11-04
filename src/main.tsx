import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { TEST_AREA } from './ui/testbereich/catalogue';
import { TestShell } from './ui/testbereich/TestShell';
import { APP_CONFIG } from './config';
import { colorVariables } from './logic/appConfig';
import './ui/styles.css';

// The Kanzlei colours of this build (config "colors"), set through the CSSOM — allowed by the CSP.
for (const [name, value] of Object.entries(colorVariables(APP_CONFIG.colors))) {
  document.documentElement.style.setProperty(name, value);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing');

createRoot(root).render(
  <StrictMode>
    {TEST_AREA ? (
      <TestShell>{(start) => <App {...(start ? { start } : {})} />}</TestShell>
    ) : (
      <App />
    )}
  </StrictMode>,
);
