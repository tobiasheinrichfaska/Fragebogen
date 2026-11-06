// A link passed on with a password (Tobias 2026-11-06) asks for it before anything of the
// questionnaire is read. The link stays in the address bar until it is opened (then the workspace
// clears it like an open link) or set aside.
import { useState } from 'react';
import { APP_NAME } from '../appInfo';
import { lockAvailable, unlockTransfer } from '../io/transferLock';
import { passwordKeyText } from '../logic/passwords';
import {
  TRANSFER_LINK_MESSAGES,
  type LockedTransfer,
  type TransferLinkIssue,
} from '../logic/transferLink';
import { Card } from './common';

export function UnlockLinkScreen({
  locked,
  onOpened,
  onSkip,
}: {
  locked: LockedTransfer;
  onOpened: (questionnaireText: string) => void;
  onSkip: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<TransferLinkIssue | undefined>();
  const available = lockAvailable();

  const open = async () => {
    if (passwordKeyText(typed) === '') {
      setIssue('noPassword');
      return;
    }
    setBusy(true);
    setIssue(undefined);
    try {
      const unlocked = await unlockTransfer(locked, typed);
      if (unlocked.ok) onOpened(unlocked.questionnaireText);
      else setIssue(unlocked.issue);
    } catch {
      setIssue('unlockUnavailable');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="shell">
      <header className="app-header">
        <div>
          <h1>{APP_NAME}</h1>
        </div>
      </header>
      <Card title="Geschützter Link">
        <p>
          Dieser Link zur Weitergabe ist mit einem Kennwort geschützt. Das Kennwort haben Sie
          getrennt vom Link bekommen, zum Beispiel am Telefon oder per SMS.
        </p>
        {available ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void open();
            }}
          >
            <label className="master-question" htmlFor="unlock-password">
              Kennwort
            </label>
            <input
              id="unlock-password"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {issue && (
              <p className="field-error" role="alert">
                {TRANSFER_LINK_MESSAGES[issue]}
              </p>
            )}
            <div className="nav">
              <button type="button" onClick={onSkip}>
                Ohne diesen Link weiter
              </button>
              <button type="submit" className="primary" disabled={busy}>
                {busy ? 'Wird geöffnet …' : 'Öffnen'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="field-error" role="alert">
              {TRANSFER_LINK_MESSAGES.unlockUnavailable}
            </p>
            <div className="nav">
              <button type="button" onClick={onSkip}>
                Ohne diesen Link weiter
              </button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
