// The master-data link as text to bookmark or send, with a copy button and inline feedback.
import { useState } from 'react';

export function MasterDataLink({ url }: { url: string }) {
  const [copied, setCopied] = useState<'ok' | 'manual' | undefined>();
  return (
    <>
      <div className="master-link">
        <input
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          aria-label="Stammdaten-Link"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url).then(
              () => setCopied('ok'),
              () => setCopied('manual'),
            );
          }}
        >
          Kopieren
        </button>
      </div>
      {copied === 'ok' && <p className="muted">Link kopiert.</p>}
      {copied === 'manual' && <p className="muted">Bitte den Link markieren und kopieren.</p>}
    </>
  );
}
