// "Mit Kennwort schützen" (Tobias 2026-11-06): one password for the PDF and the link of a screen,
// proposed by the app, with a copy button and "Neues Kennwort". It lives in the screen's state
// only — gone when the screen closes, never in the questionnaire or the browser memory.
import { newPassword } from '../io/environment';
import { MasterDataLink } from './MasterDataLink';

export function PasswordOption({
  password,
  onChange,
}: {
  password: string | undefined;
  onChange: (password: string | undefined) => void;
}) {
  return (
    <div className="password-option">
      <label className="lock-option">
        <input
          type="checkbox"
          checked={password !== undefined}
          onChange={(event) => onChange(event.target.checked ? newPassword() : undefined)}
        />
        Mit Kennwort schützen (PDF und Link)
      </label>
      {password !== undefined && (
        <>
          <div className="password-field">
            <MasterDataLink url={password} label="Kennwort" copiedText="Kennwort kopiert." />
          </div>
          <p className="muted">
            Geben Sie das Kennwort auf einem anderen Weg weiter als die PDF oder den Link – zum
            Beispiel am Telefon oder per SMS, nicht in derselben Mail oder Nachricht. In der App
            spielen Groß- und Kleinschreibung, Leerzeichen und Bindestriche keine Rolle; ein
            PDF-Programm will es genau so, klein und mit Bindestrichen. Die App merkt sich das
            Kennwort nicht.
          </p>
          <p>
            <button type="button" onClick={() => onChange(newPassword())}>
              Neues Kennwort
            </button>
          </p>
        </>
      )}
    </div>
  );
}
