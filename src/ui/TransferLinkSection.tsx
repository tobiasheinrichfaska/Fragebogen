// "Als Link weitergeben" (Tobias 2026-11-05) — on the done screen and, since the test report of
// 2026-11-06, in the overview, so a closed part can be passed on later too. "Mit Kennwort
// schützen" (Tobias 2026-11-06) encrypts the link with a password the app proposes; the password
// lives only in this component and is gone when the screen closes.
import { useEffect, useState } from 'react';
import { lockAvailable, lockTransfer, newTransferPassword } from '../io/transferLock';
import {
  TRANSFER_LINK_MESSAGES,
  type TransferLinkResult,
  type TransferOffer,
} from '../logic/transferLink';
import { MasterDataLink } from './MasterDataLink';

type Locked = { password: string } & ({ result: TransferLinkResult } | { failed: true });

export function TransferLinkSection({
  transfer,
  onLinkCopied,
}: {
  transfer: TransferOffer;
  onLinkCopied: () => void;
}) {
  const [password, setPassword] = useState<string | undefined>();
  const [locked, setLocked] = useState<Locked | undefined>();
  const questionnaire = transfer.kind === 'link' ? transfer.questionnaire : undefined;

  useEffect(() => {
    if (questionnaire === undefined || password === undefined) return;
    let current = true;
    lockTransfer(questionnaire, password).then(
      (result) => current && setLocked({ password, result }),
      () => current && setLocked({ password, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [questionnaire, password]);

  if (transfer.kind === 'tooLong') {
    return <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>;
  }
  if (transfer.kind !== 'link') return null;
  const available = lockAvailable();
  const made = locked?.password === password ? locked : undefined;
  return (
    <div className="summary-section">
      <h3>Als Link weitergeben</h3>
      <p className="muted">
        Statt der PDF genügt dieser Link: Wer ihn öffnet, bekommt den Fragebogen mit allen
        bisherigen Teilen, geprüft wie eine eingelesene PDF. Er enthält alle Angaben – schicken Sie
        ihn nur an die Person, die als Nächstes ausfüllt. Mit Kennwort kann ihn nur öffnen, wer auch
        das Kennwort hat.
      </p>
      <label className="lock-option">
        <input
          type="checkbox"
          checked={password !== undefined}
          disabled={!available}
          onChange={(event) =>
            setPassword(event.target.checked ? newTransferPassword() : undefined)
          }
        />
        Mit Kennwort schützen
      </label>
      {!available && <p className="muted">{TRANSFER_LINK_MESSAGES.lockUnavailable}</p>}
      {password === undefined ? (
        <MasterDataLink url={transfer.url} label="Link zur Weitergabe" onCopied={onLinkCopied} />
      ) : (
        <>
          <div className="password-field">
            <MasterDataLink url={password} label="Kennwort" copiedText="Kennwort kopiert." />
          </div>
          <p className="muted">
            Geben Sie das Kennwort auf einem anderen Weg weiter als den Link – zum Beispiel am
            Telefon oder per SMS, nicht in derselben Mail oder Nachricht. Groß- und Kleinschreibung,
            Leerzeichen und Bindestriche spielen beim Eingeben keine Rolle. Die App merkt sich das
            Kennwort nicht.
          </p>
          <p>
            <button type="button" onClick={() => setPassword(newTransferPassword())}>
              Neues Kennwort
            </button>
          </p>
          {made === undefined ? (
            <p className="muted">Der Link wird verschlüsselt …</p>
          ) : 'failed' in made ? (
            <p className="error-text">{TRANSFER_LINK_MESSAGES.lockUnavailable}</p>
          ) : made.result.ok ? (
            <MasterDataLink
              url={`${transfer.base}${made.result.fragment}`}
              label="Link zur Weitergabe"
              onCopied={onLinkCopied}
            />
          ) : (
            <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>
          )}
        </>
      )}
    </div>
  );
}
