// Completing a part (step 7): confirmation text, then draw or type the signature — or, for roles
// whose signature is optional, complete without one. The seal itself is pure logic (session.seal);
// time, nonce and the system note come from the device.
import { useState } from 'react';
import { deviceNow, newNonce, systemNoteFor, type InputTracker } from '../io/environment';
import { SIGNATURE_POLICY_LABELS } from '../logic/catalogue';
import { roleOf } from '../logic/form';
import { seal, type Session } from '../logic/session';
import { encodeStrokes, type Point } from '../logic/strokes';
import { Banner, Card, type BannerMessage } from './common';
import { SignaturePad } from './SignaturePad';

type Method = 'drawn' | 'typed' | 'none';

interface Props {
  session: Session;
  tracker: InputTracker;
  onSealed: (session: Session, role: string, warnings: readonly string[]) => void;
  onBack: () => void;
}

/** Encoding refuses impossible strokes; that becomes an empty signature the seal refuses with a reason. */
function safeEncode(strokes: Point[][]): string {
  try {
    return encodeStrokes(strokes);
  } catch {
    return '';
  }
}

export function SignatureScreen({ session, tracker, onSealed, onBack }: Props) {
  const role =
    session.role === undefined ? undefined : roleOf(session.form.definition, session.role);
  const [confirmed, setConfirmed] = useState(false);
  const [method, setMethod] = useState<Method>(role?.signature === 'none' ? 'none' : 'drawn');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<BannerMessage | undefined>();
  if (!role) return null;
  const definition = session.form.definition;

  const methods: { id: Method; label: string }[] = [
    ...(role.signature === 'none' ? [] : [{ id: 'drawn' as const, label: 'Unterschreiben' }]),
    // A typed name is a simple electronic signature too — offered only where the form needs no
    // particular form (signaturePolicy "electronic").
    ...(role.signature === 'none' || definition.signaturePolicy !== 'electronic'
      ? []
      : [{ id: 'typed' as const, label: 'Namen tippen' }]),
    ...(role.signature === 'required'
      ? []
      : [{ id: 'none' as const, label: 'Ohne Unterschrift abschließen' }]),
  ];

  const complete = () => {
    const now = deviceNow();
    const signature =
      method === 'drawn'
        ? { method: 'drawn' as const, strokes: safeEncode(strokes) }
        : method === 'typed'
          ? { method: 'typed' as const, name: typed }
          : undefined;
    const result = seal(session, {
      nonce: newNonce(),
      systemNote: systemNoteFor(now, tracker.types()),
      now: { local: now.local, utc: now.utc },
      ...(signature ? { signature } : {}),
    });
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message, detail: result.detail });
      return;
    }
    onSealed(result.session, role.id, result.warnings);
  };

  const ready =
    confirmed &&
    (method === 'none' ||
      (method === 'drawn' && strokes.length > 0) ||
      (method === 'typed' && typed.trim() !== ''));

  return (
    <Card title={`Abschließen: ${role.label}`}>
      {message && <Banner message={message} onClose={() => setMessage(undefined)} />}
      <label className="confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {role.confirmationText}
      </label>

      {methods.length > 1 && (
        <div className="choices choices-inline" role="radiogroup" aria-label="Art des Abschlusses">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              className={method === m.id ? 'choice chosen' : 'choice'}
              onClick={() => setMethod(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {method === 'drawn' && (
        <div className="signature">
          <SignaturePad strokes={strokes} onChange={setStrokes} />
          <button type="button" className="link" onClick={() => setStrokes([])}>
            Unterschrift löschen
          </button>
        </div>
      )}
      {method === 'typed' && (
        <label className="typed-name">
          Ihr vollständiger Name
          <input
            value={typed}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setTyped(e.target.value)}
          />
        </label>
      )}

      <p className="muted">
        Das ist eine einfache elektronische Signatur. Mit dem Abschluss werden Ihre Angaben
        gesiegelt; Datum, Uhrzeit und Gerät laut diesem Gerät werden vermerkt. Danach lassen sie
        sich nur noch als neue Fassung ändern.
      </p>
      <details className="signature-basis">
        <summary>Warum genügt das?</summary>
        <p>{definition.signatureBasis ?? SIGNATURE_POLICY_LABELS[definition.signaturePolicy]}</p>
      </details>
      <div className="nav">
        <button type="button" onClick={onBack}>
          Zurück zur Zusammenfassung
        </button>
        <button type="button" className="primary" disabled={!ready} onClick={complete}>
          {method === 'none' ? 'Abschließen' : 'Unterschreiben und abschließen'}
        </button>
      </div>
    </Card>
  );
}
