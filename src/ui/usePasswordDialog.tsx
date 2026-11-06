// The password dialog of a screen that reads files (Tobias 2026-11-06): render `dialog`, pass
// `ask` to `openAnyFile`; each question waits for "Öffnen" or "Abbrechen".
import { useCallback, useState, type ReactNode } from 'react';
import { PasswordDialog } from './PasswordDialog';
import type { AskPassword } from './pdfActions';

interface Pending {
  fileName: string;
  wrong: boolean;
  resolve: (password: string | undefined) => void;
}

/** The dialog to render and the `ask` to pass to `openAnyFile`. */
export function usePasswordDialog(): { dialog: ReactNode; ask: AskPassword } {
  const [pending, setPending] = useState<Pending | undefined>();
  const ask = useCallback<AskPassword>(
    (fileName, wrong) => new Promise((resolve) => setPending({ fileName, wrong, resolve })),
    [],
  );
  const dialog = pending && (
    <PasswordDialog
      fileName={pending.fileName}
      wrong={pending.wrong}
      onDone={(password) => {
        setPending(undefined);
        pending.resolve(password);
      }}
    />
  );
  return { dialog, ask };
}
