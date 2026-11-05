// After sealing: what was recorded, and what comes next (hand the device on, save, PDF — or a link
// when the questionnaire holds only a few values, Tobias 2026-11-05).
import { roleOf } from '../logic/form';
import { latestSealed } from '../logic/questionnaire';
import type { Session } from '../logic/session';
import { formatLocalDateTime } from '../logic/time';
import { TRANSFER_LINK_MESSAGES, type TransferOffer } from '../logic/transferLink';
import { Card } from './common';
import { MasterDataLink } from './MasterDataLink';

interface Props {
  session: Session;
  role: string;
  onOverview: () => void;
  onSaveInterim: () => void;
  onPdf: () => void;
  transfer: TransferOffer;
  onLinkCopied: () => void;
}

export function DoneScreen({
  session,
  role,
  onOverview,
  onSaveInterim,
  onPdf,
  transfer,
  onLinkCopied,
}: Props) {
  const definition = roleOf(session.form.definition, role);
  const part = latestSealed(session.questionnaire, role);
  const note = part?.seal?.payload.systemNote;
  return (
    <Card title={`${definition?.label ?? role}: abgeschlossen`}>
      <p>
        {part?.status === 'signed' ? 'Unterschrieben' : 'Abgeschlossen'}
        {note
          ? ` am ${formatLocalDateTime(note.signedAtLocal)} laut diesem Gerät`
          : ''} (Fassung {part?.seal?.payload.version ?? 1}).
      </p>
      {note && (
        <p className="muted">
          Systemvermerk: {note.os} · {note.browser} {note.browserVersion} · Eingabe:{' '}
          {note.inputTypes.join(', ')} · App {note.appVersion}
        </p>
      )}
      <p className="muted mono">Prüfwert (SHA-256): {part?.seal?.contentHash}</p>
      <p>
        Füllt noch jemand auf diesem Gerät aus? Dann geben Sie das Gerät weiter und wählen dort die
        eigene Rolle. Sonst geben Sie {transfer.kind === 'link' ? 'den Link unten oder ' : ''}die
        PDF weiter.
      </p>
      <div className="nav">
        <button type="button" className="primary" onClick={onOverview}>
          Gerät weitergeben – zur Übersicht
        </button>
        <button type="button" onClick={onPdf}>
          PDF erstellen
        </button>
        <button type="button" onClick={onSaveInterim}>
          Zwischenstand speichern
        </button>
      </div>
      {transfer.kind === 'link' && (
        <div className="summary-section">
          <h3>Als Link weitergeben</h3>
          <p className="muted">
            Statt der PDF genügt dieser Link: Wer ihn öffnet, bekommt den Fragebogen mit allen
            bisherigen Teilen, geprüft wie eine eingelesene PDF. Er enthält alle Angaben – schicken
            Sie ihn nur an die Person, die als Nächstes ausfüllt.
          </p>
          <MasterDataLink url={transfer.url} label="Link zur Weitergabe" onCopied={onLinkCopied} />
        </div>
      )}
      {transfer.kind === 'tooLong' && <p className="muted">{TRANSFER_LINK_MESSAGES.tooLong}</p>}
    </Card>
  );
}
