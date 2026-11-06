// A link as text to bookmark or send (master data, or a questionnaire passed on), with a copy
// button and inline feedback; also the password of a protected link.
import { useState } from 'react';

export function MasterDataLink({
  url,
  label = 'Stammdaten-Link',
  copiedText = 'Link kopiert.',
  onCopied,
}: {
  url: string;
  label?: string;
  copiedText?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState<'ok' | 'manual' | undefined>();
  return (
    <>
      <div className="master-link">
        <input readOnly value={url} onFocus={(event) => event.target.select()} aria-label={label} />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url).then(
              () => {
                setCopied('ok');
                onCopied?.();
              },
              () => setCopied('manual'),
            );
          }}
        >
          Kopieren
        </button>
      </div>
      {copied === 'ok' && <p className="muted">{copiedText}</p>}
      {copied === 'manual' && <p className="muted">Bitte markieren und kopieren.</p>}
    </>
  );
}
