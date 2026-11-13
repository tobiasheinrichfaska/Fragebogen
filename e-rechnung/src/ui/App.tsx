import { useState } from 'react';
import { APP_NAME, APP_VERSION } from '../appInfo';
import { analyzeFile } from '../io/analyze';
import { loadPdfJs } from '../io/pdfjs';
import type { Analysis } from '../logic/analysis';
import { TEXTS } from '../logic/texts';
import { verdictOf } from '../logic/verdict';
import type { Verdict } from '../logic/verdict';
import { DropZone } from './DropZone';
import { ResultView } from './ResultView';

type State =
  | { step: 'idle' }
  | { step: 'checking'; fileName: string }
  | { step: 'done'; analysis: Analysis; verdict: Verdict }
  | { step: 'failed'; fileName: string; message: string };

export function App() {
  const [state, setState] = useState<State>({ step: 'idle' });

  const check = async (file: File) => {
    setState({ step: 'checking', fileName: file.name });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const analysis = await analyzeFile(file.name, bytes, loadPdfJs);
      setState({ step: 'done', analysis, verdict: verdictOf(analysis) });
    } catch (error) {
      // Never swallow: an unexpected error is shown with its message.
      setState({
        step: 'failed',
        fileName: file.name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <main className="page">
      <h1>{APP_NAME}</h1>
      <p className="lead">
        Ziehen Sie eine Rechnung hierher. Das Tool zeigt, ob es eine E-Rechnung ist und welche
        Angaben sie enthält.
      </p>

      <DropZone onFile={(file) => void check(file)} disabled={state.step === 'checking'} />

      {state.step === 'checking' && (
        <p className="status" role="status">
          „{state.fileName}“ wird geprüft …
        </p>
      )}
      {state.step === 'done' && (
        <>
          <p className="status">Geprüfte Datei: „{state.analysis.fileName}“</p>
          <ResultView analysis={state.analysis} verdict={state.verdict} />
        </>
      )}
      {state.step === 'failed' && (
        <div className="verdict tone-bad" role="alert" data-testid="verdict">
          <h2 data-testid="headline">Die Prüfung ist abgebrochen</h2>
          <p>
            Bei „{state.fileName}“ ist ein unerwarteter Fehler aufgetreten: {state.message}
          </p>
          <p>Bitte versuchen Sie es erneut oder wenden Sie sich an Ihre Kanzlei.</p>
        </div>
      )}

      <p className="notice" data-testid="fixed-notice">
        {TEXTS.fixedNotice}
      </p>
      <p className="version">Version {APP_VERSION} · in Entwicklung</p>
    </main>
  );
}
