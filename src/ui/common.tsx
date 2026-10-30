// Small shared UI pieces: message banner, explainer link, multi-line notice text.
import type { ReactNode } from 'react';
import { APP_CONFIG } from '../config';
import { explainerUrl } from '../logic/appConfig';
import type { FormDefinition } from '../logic/model';
import { describeValidity } from '../logic/validity';

export interface BannerMessage {
  tone: 'error' | 'warning' | 'info' | 'success';
  text: string;
  detail?: readonly string[];
}

export function Banner({ message, onClose }: { message: BannerMessage; onClose?: () => void }) {
  return (
    <div
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
      </div>
      {onClose && (
        <button type="button" className="link" onClick={onClose} aria-label="Meldung schließen">
          Schließen
        </button>
      )}
    </div>
  );
}

/** Link to an explainer video on the Kanzlei homepage — only when the build configures one. */
export function Explainer({ path }: { path: string | undefined }) {
  const url = explainerUrl(APP_CONFIG, path);
  if (!url) return null;
  return (
    <p className="explainer">
      <a href={url} target="_blank" rel="noopener noreferrer">
        Erklärvideo ansehen
      </a>{' '}
      <span className="muted">(öffnet eine Webseite außerhalb der App)</span>
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
