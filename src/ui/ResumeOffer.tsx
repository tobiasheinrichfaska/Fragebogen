// "Angefangener Fragebogen gefunden": the hosted app found an interrupted questionnaire in this
// browser (logic/resume.ts). Nothing is written while the offer is open, so it cannot be lost.
import type { ResumeRecord } from '../logic/resume';
import { Card } from './common';

interface Props {
  record: ResumeRecord;
  onContinue: () => void;
  onDelete: () => void;
}

export function ResumeOffer({ record, onContinue, onDelete }: Props) {
  const saved = new Date(record.savedAt).toLocaleString('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <Card title="Angefangener Fragebogen gefunden">
      <p>
        Auf diesem Gerät ist ein angefangener Fragebogen „{record.title}“ gemerkt, zuletzt am{' '}
        {saved}. Er wird höchstens 7 Tage aufbewahrt.
      </p>
      <p className="muted">
        Fortsetzen öffnet ihn so, wie er war. Löschen entfernt ihn aus diesem Browser; bereits
        gespeicherte Dateien bleiben erhalten.
      </p>
      <div className="nav">
        <button type="button" onClick={onDelete}>
          Löschen
        </button>
        <button type="button" className="primary" onClick={onContinue}>
          Fortsetzen
        </button>
      </div>
    </Card>
  );
}
