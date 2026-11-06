// "Als Link weitergeben" (Tobias 2026-11-05) — on the done screen and, since the test report of
// 2026-11-06, in the overview, so a closed part can be passed on later too.
import { TRANSFER_LINK_MESSAGES, type TransferOffer } from '../logic/transferLink';
import { MasterDataLink } from './MasterDataLink';

export function TransferLinkSection({
  transfer,
  onLinkCopied,
}: {
  transfer: TransferOffer;
  onLinkCopied: () => void;
}) {
  if (transfer.kind === 'tooLong') {
    return <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>;
  }
  if (transfer.kind !== 'link') return null;
  return (
    <div className="summary-section">
      <h3>Als Link weitergeben</h3>
      <p className="muted">
        Statt der PDF genügt dieser Link: Wer ihn öffnet, bekommt den Fragebogen mit allen
        bisherigen Teilen, geprüft wie eine eingelesene PDF. Er enthält alle Angaben – schicken Sie
        ihn nur an die Person, die als Nächstes ausfüllt.
      </p>
      <MasterDataLink url={transfer.url} label="Link zur Weitergabe" onCopied={onLinkCopied} />
    </div>
  );
}
