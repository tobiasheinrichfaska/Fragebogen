// Start: new questionnaire (latest published version of each form), open a file, delete all data.
import { useRef } from 'react';
import { isTestVersion, type FormRegistry, type RegisteredForm } from '../logic/formRegistry';
import { DRAFT_HASHES } from '../io/bundledForms';
import { describeValidity } from '../logic/validity';
import { Card } from './common';

interface Props {
  registry: FormRegistry;
  onNew: (form: RegisteredForm) => void;
  onOpen: (file: File) => void;
  onKanzlei: () => void;
  onClearAll: () => void;
}

export function StartScreen({ registry, onNew, onOpen, onKanzlei, onClearAll }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const latest = [...new Set(registry.forms.map((form) => form.definition.id))]
    .map((id) => registry.latest(id))
    .filter((form): form is RegisteredForm => form !== undefined);
  return (
    <>
      <Card title="Neuer Fragebogen">
        {latest.length === 0 && (
          <p className="muted">Es sind noch keine Formulare veröffentlicht.</p>
        )}
        <ul className="form-list">
          {latest.map((form) => (
            <li key={form.definitionHash}>
              <button type="button" className="primary wide" onClick={() => onNew(form)}>
                {form.definition.title}
              </button>
              <span className="muted">
                Version {form.definition.version}
                {DRAFT_HASHES.has(form.definitionHash)
                  ? ' · Entwurf (nur Vorschau)'
                  : isTestVersion(form.definition.version)
                    ? ' · Testfassung'
                    : ''}
                {describeValidity(form.definition) === undefined
                  ? ''
                  : ` · ${describeValidity(form.definition) ?? ''}`}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Weiterbearbeiten oder prüfen">
        <p>
          Öffnen Sie eine PDF dieser App, einen gespeicherten Zwischenstand oder ein Foto der
          QR-Codes einer ausgedruckten PDF.
        </p>
        <input
          ref={input}
          type="file"
          accept=".pdf,.json,application/pdf,application/json,image/*"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onOpen(file);
            event.target.value = '';
          }}
        />
        <button type="button" onClick={() => input.current?.click()}>
          Datei öffnen …
        </button>
      </Card>
      <Card title="Kanzlei">
        <p>
          Viele eingegangene Dateien auf einmal prüfen, nach Fragebogen ordnen, zusammenführen und
          als PDF für die Personalakte ausgeben.
        </p>
        <button type="button" onClick={onKanzlei}>
          Eingänge zusammenführen …
        </button>
      </Card>
      <Card title="Ihre Daten bleiben auf diesem Gerät">
        <p>
          Diese Seite sendet keine Daten ins Internet und speichert nichts im Browser. Ergebnis ist
          eine Datei, die Sie selbst weitergeben.
        </p>
        <button type="button" className="danger" onClick={onClearAll}>
          Alle Daten auf diesem Gerät löschen
        </button>
      </Card>
    </>
  );
}
