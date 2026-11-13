// The confirmation asked before the hosted app opens (logic/accessGate.ts, Tobias 2026-11-13).
import { useState } from 'react';
import { Card } from './common';

export function AccessGate({
  notice,
  onConfirm,
}: {
  notice: string;
  onConfirm: (remember: boolean) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [remember, setRemember] = useState(false);
  return (
    <Card title="Bitte bestätigen">
      <label className="confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {notice}
      </label>
      <label className="confirm">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        Antwort für die Zukunft merken
      </label>
      <p className="muted">
        Gemerkt wird nur in diesem Browser; „Alle Daten auf diesem Gerät löschen“ nimmt es wieder
        weg.
      </p>
      <div className="nav">
        <button
          type="button"
          className="primary"
          disabled={!confirmed}
          onClick={() => onConfirm(remember)}
        >
          Weiter
        </button>
      </div>
    </Card>
  );
}
