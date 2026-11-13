// „Mit Kennwort schützen?“ is asked when a PDF or a link is requested (Tobias 2026-11-13: „als
// Dialog … mit kurzer Erläuterung, dass dann das Kennwort auch weitergegeben werden muss“; before,
// a box on the screen, 2026-11-06). The choice holds for the screen — one password for the PDF and
// the link — and can be changed there; it lives in the screen's state only, never in the
// questionnaire or the browser memory.
import { useEffect, useRef, useState } from 'react';
import { newPassword } from '../io/environment';
import { MasterDataLink } from './MasterDataLink';

export const PASS_ON =
  'Geben Sie das Kennwort auf einem anderen Weg weiter als die PDF oder den Link – zum Beispiel am Telefon oder per SMS, nicht in derselben Mail oder Nachricht. In der App spielen Groß- und Kleinschreibung, Leerzeichen und Bindestriche keine Rolle; ein PDF-Programm will es genau so, klein und mit Bindestrichen. Die App merkt sich das Kennwort nicht.';

export function ProtectionDialog({
  current,
  onChoose,
  onCancel,
}: {
  current: { password?: string } | undefined;
  onChoose: (choice: { password?: string }) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState<string | undefined>(current?.password);
  const [step, setStep] = useState<'ask' | 'password'>('ask');
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="password-dialog"
      aria-labelledby="protection-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="protection-title">Mit Kennwort schützen?</h2>
      {step === 'ask' ? (
        <>
          <p>
            Mit Kennwort öffnet die PDF oder den Link nur, wer auch das Kennwort hat. Dann müssen
            Sie das Kennwort zusätzlich weitergeben – auf einem anderen Weg als die Datei.
          </p>
          <div className="nav">
            <button type="button" onClick={onCancel}>
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword((known) => known ?? newPassword());
                setStep('password');
              }}
            >
              Mit Kennwort schützen
            </button>
            <button type="button" className="primary" autoFocus onClick={() => onChoose({})}>
              Ohne Kennwort
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="password-field">
            <MasterDataLink url={password ?? ''} label="Kennwort" copiedText="Kennwort kopiert." />
          </div>
          <p className="muted">{PASS_ON}</p>
          <div className="nav">
            <button type="button" onClick={() => setStep('ask')}>
              Zurück
            </button>
            <button type="button" onClick={() => setPassword(newPassword())}>
              Neues Kennwort
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => onChoose(password === undefined ? {} : { password })}
            >
              Mit diesem Kennwort weiter
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
