// Asks for the password of a protected PDF (Tobias 2026-11-06) while a file is read — on the start
// page, for a takeover and in the Kanzlei inbox. A modal <dialog>, so it shows wherever the page is
// scrolled; Esc or "Abbrechen" leaves the file unopened.
import { useEffect, useRef, useState } from 'react';

export function PasswordDialog({
  fileName,
  wrong,
  onDone,
}: {
  fileName: string;
  wrong: boolean;
  onDone: (password: string | undefined) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="password-dialog"
      aria-labelledby="pdf-password-title"
      onCancel={(event) => {
        event.preventDefault();
        onDone(undefined);
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDone(typed);
        }}
      >
        <h2 id="pdf-password-title">Geschützte PDF</h2>
        <p>
          „{fileName}“ ist mit einem Kennwort geschützt. Das Kennwort haben Sie getrennt von der
          Datei bekommen, zum Beispiel am Telefon oder per SMS.
        </p>
        <label className="master-question" htmlFor="pdf-password">
          Kennwort
        </label>
        <input
          id="pdf-password"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {wrong && (
          <p className="field-error" role="alert">
            Das Kennwort passt nicht zu dieser PDF. Bitte prüfen Sie es und geben Sie es noch einmal
            ein.
          </p>
        )}
        <div className="nav">
          <button type="button" onClick={() => onDone(undefined)}>
            Abbrechen
          </button>
          <button type="submit" className="primary">
            Öffnen
          </button>
        </div>
      </form>
    </dialog>
  );
}
