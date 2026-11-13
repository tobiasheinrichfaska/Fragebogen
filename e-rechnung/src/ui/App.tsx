import { APP_NAME, APP_VERSION } from '../appInfo';

/** Placeholder until step 1a: the page frame with the fixed notice. */
export function App() {
  return (
    <main className="page">
      <h1>{APP_NAME}</h1>
      <p className="notice">
        Technische Erstprüfung, keine steuerliche Prüfung. Maßgeblich sind die Daten in der XML. Bei
        Fragen wenden Sie sich an Ihre Kanzlei.
      </p>
      <p className="version">Version {APP_VERSION} · in Entwicklung</p>
    </main>
  );
}
