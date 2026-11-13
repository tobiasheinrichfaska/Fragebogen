// After sealing: what was recorded, and what comes next (hand the device on, save, PDF — or a link
// when the questionnaire holds only a few values, Tobias 2026-11-05). Once every needed part is
// done, the PDF comes first and handing on steps back (Tobias 2026-11-12).
import { describeInputTypes } from '../logic/display';
import { roleOf } from '../logic/form';
import { latestSealed } from '../logic/questionnaire';
import { allPartsDone, type Session } from '../logic/session';
import { formatLocalDateTime } from '../logic/time';
import type { TransferOffer } from '../logic/transferLink';
import { Card } from './common';
import { useProtection } from './useProtection';
import { TransferLinkSection } from './TransferLinkSection';

interface Props {
  session: Session;
  role: string;
  onOverview: () => void;
  onSaveInterim: () => void;
  onPdf: (password: string | undefined) => void;
  /** The PDF is being written (the page stands still for seconds). */
  pdfBusy: boolean;
  /** The PDF of exactly this state has been made. */
  pdfMade: boolean;
  transfer: TransferOffer;
  onLinkCopied: () => void;
}

export function DoneScreen({
  session,
  role,
  onOverview,
  onSaveInterim,
  onPdf,
  pdfBusy,
  pdfMade,
  transfer,
  onLinkCopied,
}: Props) {
  const definition = roleOf(session.form.definition, role);
  const part = latestSealed(session.questionnaire, role);
  const note = part?.seal?.payload.systemNote;
  const protection = useProtection();
  const done = allPartsDone(session);
  // Once the PDF is made, „Zur Übersicht“ leads on; a second PDF stays possible (part 3 B11).
  const pdfFirst = done && !pdfMade;
  const pdfButton = (
    <button
      type="button"
      className={pdfFirst ? 'primary' : undefined}
      disabled={pdfBusy}
      onClick={() => protection.withProtection(onPdf)}
    >
      {pdfBusy ? 'PDF wird erstellt …' : 'PDF erstellen'}
    </button>
  );
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
          {describeInputTypes(note.inputTypes)} · App {note.appVersion}
        </p>
      )}
      <p className="muted">
        Prüfwert, an dem sich später zeigt, dass die Angaben unverändert sind:{' '}
        <span className="mono">{part?.seal?.contentHash}</span>
      </p>
      {done && pdfMade ? (
        <p>
          Die PDF ist erstellt. Geben Sie sie weiter; danach können Sie den Fragebogen schließen.
        </p>
      ) : done ? (
        <p>Alle nötigen Teile sind abgeschlossen. Erstellen Sie jetzt die PDF.</p>
      ) : (
        <p>
          Füllt noch jemand auf diesem Gerät aus? Dann geben Sie das Gerät weiter und wählen dort
          die eigene Rolle. Sonst geben Sie {transfer.kind === 'link' ? 'den Link unten oder ' : ''}
          die PDF weiter.
        </p>
      )}
      {protection.status}
      <div className="nav">
        {done ? (
          <>
            {pdfButton}
            <button type="button" className={pdfFirst ? undefined : 'primary'} onClick={onOverview}>
              Zur Übersicht
            </button>
          </>
        ) : (
          <>
            <button type="button" className="primary" onClick={onOverview}>
              Gerät weitergeben – zur Übersicht
            </button>
            {pdfButton}
          </>
        )}
        <button type="button" onClick={onSaveInterim}>
          Zwischenstand speichern
        </button>
      </div>
      <TransferLinkSection
        transfer={transfer}
        choice={protection.choice}
        onRequest={() => protection.withProtection(() => undefined)}
        onLinkCopied={onLinkCopied}
      />
      {protection.dialog}
    </Card>
  );
}
