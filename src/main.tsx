import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { TEST_AREA } from './ui/testbereich/catalogue';
import { TestShell } from './ui/testbereich/TestShell';
import './ui/styles.css';

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
