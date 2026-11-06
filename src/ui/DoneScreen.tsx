// After sealing: what was recorded, and what comes next (hand the device on, save, PDF — or a link
// when the questionnaire holds only a few values, Tobias 2026-11-05).
import { useState } from 'react';
import { roleOf } from '../logic/form';
import { latestSealed } from '../logic/questionnaire';
import type { Session } from '../logic/session';
import { formatLocalDateTime } from '../logic/time';
import type { TransferOffer } from '../logic/transferLink';
import { Card } from './common';
import { PasswordOption } from './PasswordOption';
import { TransferLinkSection } from './TransferLinkSection';

interface Props {
  session: Session;
  role: string;
  onOverview: () => void;
  onSaveInterim: () => void;
  onPdf: (password: string | undefined) => void;
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
  const [password, setPassword] = useState<string | undefined>();
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
      <PasswordOption password={password} onChange={setPassword} />
      <div className="nav">
        <button type="button" className="primary" onClick={onOverview}>
          Gerät weitergeben – zur Übersicht
        </button>
        <button type="button" onClick={() => onPdf(password)}>
          PDF erstellen
        </button>
        <button type="button" onClick={onSaveInterim}>
          Zwischenstand speichern
        </button>
      </div>
      <TransferLinkSection transfer={transfer} password={password} onLinkCopied={onLinkCopied} />
    </Card>
  );
}
