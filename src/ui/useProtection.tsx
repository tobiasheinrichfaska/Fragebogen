// The screen's answer to „Mit Kennwort schützen?“ (ProtectionDialog.tsx, Tobias 2026-11-13): asked
// once per screen when a PDF or a link is requested, shown with „ändern“ afterwards.
import { useState, type ReactNode } from 'react';
import { MasterDataLink } from './MasterDataLink';
import { PASS_ON, ProtectionDialog } from './ProtectionDialog';

/** The choice of a screen: undefined until asked, then with or without a password. */
export type ProtectionChoice = { password?: string } | undefined;

/**
 * The screen's protection: `withProtection(then)` asks once, then runs `then` with the password
 * (or none); `dialog` is rendered by the screen, `status` shows the choice with „ändern“.
 */
export function useProtection(): {
  choice: ProtectionChoice;
  withProtection: (then: (password: string | undefined) => void) => void;
  dialog: ReactNode;
  status: ReactNode;
} {
  const [choice, setChoice] = useState<ProtectionChoice>();
  const [asking, setAsking] = useState<{ then?: (password: string | undefined) => void }>();
  const withProtection = (then: (password: string | undefined) => void) => {
    if (choice) then(choice.password);
    else setAsking({ then });
  };
  const dialog = asking ? (
    <ProtectionDialog
      current={choice}
      onCancel={() => setAsking(undefined)}
      onChoose={(chosen) => {
        setChoice(chosen);
        setAsking(undefined);
        asking.then?.(chosen.password);
      }}
    />
  ) : null;
  const change = (
    <button type="button" className="link" onClick={() => setAsking({})}>
      ändern
    </button>
  );
  const status =
    choice === undefined ? null : choice.password === undefined ? (
      <p className="muted protection-status">Ohne Kennwort. {change}</p>
    ) : (
      <div className="password-option protection-status">
        <p className="muted">Mit Kennwort geschützt (PDF und Link). {change}</p>
        <div className="password-field">
          <MasterDataLink url={choice.password} label="Kennwort" copiedText="Kennwort kopiert." />
        </div>
        <p className="muted">{PASS_ON}</p>
      </div>
    );
  return { choice, withProtection, dialog, status };
}
