// Small shared UI pieces: message banner, explainer link, multi-line notice text.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { APP_CONFIG } from '../config';
import { downloadFile, shareFile, type OutFile } from '../io/files';
import { explainerUrl } from '../logic/appConfig';
import type { FormDefinition } from '../logic/model';
import { describeValidity } from '../logic/validity';

export interface BannerMessage {
  tone: 'error' | 'warning' | 'info' | 'success';
  text: string;
  detail?: readonly string[];
  /** A file just written: "Teilen" / "Speichern" where its delivery offers them. */
  file?: OutFile;
}

export function Banner({ message, onClose }: { message: BannerMessage; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shareNote, setShareNote] = useState<string>();
  const file = message.file;
  const offers = file !== undefined && (file.delivery.share || file.delivery.save);
  useEffect(() => {
    // On a phone the banner sits above the button that wrote the file; bring it into view.
    if (offers) ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [offers, message]);
  const share = async () => {
    if (!file) return;
    const outcome = await shareFile(file);
    setShareNote(
      outcome === 'downloaded'
        ? 'Teilen hat nicht geklappt; die Datei wurde stattdessen heruntergeladen.'
        : undefined,
    );
  };
  return (
    <div
      ref={ref}
      className={`banner banner-${message.tone}`}
      role={message.tone === 'error' ? 'alert' : 'status'}
    >
      <div>
        <p>{message.text}</p>
        {message.detail && message.detail.length > 0 && (
          <ul>
            {message.detail.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {file && offers && (
          <div className="nav banner-actions">
            {file.delivery.share && (
              <button type="button" className="primary" onClick={() => void share()}>
                Teilen
              </button>
            )}
            {file.delivery.save && (
              <button
                type="button"
                onClick={() => downloadFile(file.name, file.content, file.mime)}
              >
                Speichern
              </button>
            )}
          </div>
        )}
        {shareNote && <p className="muted">{shareNote}</p>}
      </div>
      {onClose && (
        <button type="button" className="link" onClick={onClose} aria-label="Meldung schließen">
          Schließen
        </button>
      )}
    </div>
  );
}

/**
 * Link to the help page "Wo finde ich …?" — only when the build configures one. A relative base
 * works only on the hosted app; a downloaded file would link into nothing, so it shows no link.
 */
export function Explainer({ path }: { path: string | undefined }) {
  const url = explainerUrl(APP_CONFIG, path);
  if (!url) return null;
  if (!url.startsWith('https://') && location.protocol !== 'https:') return null;
  return (
    <p className="explainer">
      <a href={url} target="_blank" rel="noopener noreferrer">
        Wo finde ich das?
      </a>{' '}
      <span className="muted">(Hilfe, öffnet eine neue Seite)</span>
    </p>
  );
}

/** Notice text: blank lines separate paragraphs, lines starting with "- " form a list. */
export function NoticeText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="notice-text">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.join(' ')}</p>;
      })}
    </div>
  );
}

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {title !== undefined && <h2>{title}</h2>}
      {children}
    </section>
  );
}

/** What this form version covers: its validity and, open by default, what it does not cover. */
export function FormScope({ definition }: { definition: FormDefinition }) {
  const validity = describeValidity(definition);
  const limits = definition.limits ?? [];
  if (validity === undefined && limits.length === 0) return null;
  return (
    <div className="form-scope">
      {validity !== undefined && (
        <p>
          <strong>Diese Fassung {validity}.</strong>
        </p>
      )}
      {limits.length > 0 && (
        <details open>
          <summary>Was dieser Fragebogen nicht abdeckt</summary>
          <ul>
            {limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
