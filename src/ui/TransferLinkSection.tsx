// "Als Link weitergeben" (Tobias 2026-11-05) — on the done screen and, since the test report of
// 2026-11-06, in the overview, so a closed part can be passed on later too. With the screen's
// password („Mit Kennwort schützen“, PasswordOption — Tobias 2026-11-06) the link is encrypted.
import { useEffect, useState } from 'react';
import { lockAvailable, lockTransfer } from '../io/transferLock';
import {
  TRANSFER_LINK_MESSAGES,
  type TransferLinkResult,
  type TransferOffer,
} from '../logic/transferLink';
import { MasterDataLink } from './MasterDataLink';

type Locked = { password: string } & ({ result: TransferLinkResult } | { failed: true });

export function TransferLinkSection({
  transfer,
  password,
  onLinkCopied,
}: {
  transfer: TransferOffer;
  password: string | undefined;
  onLinkCopied: () => void;
}) {
  const [locked, setLocked] = useState<Locked | undefined>();
  const questionnaire = transfer.kind === 'link' ? transfer.questionnaire : undefined;
  const available = lockAvailable();

  useEffect(() => {
    if (questionnaire === undefined || password === undefined || !available) return;
    let current = true;
    lockTransfer(questionnaire, password).then(
      (result) => current && setLocked({ password, result }),
      () => current && setLocked({ password, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [questionnaire, password, available]);

  if (transfer.kind === 'tooLong') {
    return <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>;
  }
  if (transfer.kind !== 'link') return null;
  const made = locked?.password === password ? locked : undefined;
  return (
    <div className="summary-section">
      <h3>Als Link weitergeben</h3>
      <p className="muted">
        Statt der PDF genügt dieser Link: Wer ihn öffnet, bekommt den Fragebogen mit allen
        bisherigen Teilen, geprüft wie eine eingelesene PDF. Er enthält alle Angaben – schicken Sie
        ihn nur an die Person, die als Nächstes ausfüllt.
        {password !== undefined &&
          ' Geschützt mit dem Kennwort oben: Öffnen kann ihn nur, wer auch das Kennwort hat.'}
      </p>
      {password === undefined ? (
        <MasterDataLink url={transfer.url} label="Link zur Weitergabe" onCopied={onLinkCopied} />
      ) : !available || (made !== undefined && 'failed' in made) ? (
        <p className="error-text">{TRANSFER_LINK_MESSAGES.lockUnavailable}</p>
      ) : made === undefined ? (
        <p className="muted">Der Link wird verschlüsselt …</p>
      ) : made.result.ok ? (
        <MasterDataLink
          url={`${transfer.base}${made.result.fragment}`}
          label="Link zur Weitergabe"
          onCopied={onLinkCopied}
        />
      ) : (
        <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>
      )}
    </div>
  );
}
