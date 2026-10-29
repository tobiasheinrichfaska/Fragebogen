import { APP_NAME, APP_VERSION } from '../appInfo';

export function App() {
  return (
    <main className="shell">
      <header>
        <h1>{APP_NAME}</h1>
        <p className="lead">
          Fragebögen ausfüllen, unterschreiben und weitergeben – vollständig lokal auf diesem Gerät.
        </p>
      </header>

      <section className="notice" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Ihre Daten bleiben auf diesem Gerät</h2>
        <p>
          Diese Seite sendet keine Daten ins Internet und speichert nichts im Browser. Ergebnis ist
          eine PDF-Datei, die Sie selbst weitergeben.
        </p>
      </section>

      <p className="status">In Entwicklung – es sind noch keine Fragebögen verfügbar.</p>

      <footer className="footer">Version {APP_VERSION}</footer>
    </main>
  );
}
