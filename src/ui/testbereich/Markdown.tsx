// Renders the test texts (inline Markdown, paragraphs, lists, code) as React elements — never HTML.
// A reference to another test ("MT-10") becomes a button that opens it, when the page knows it. In
// the steps a value to enter gets a copy button, a value to type by hand (<kbd>) none, and each
// step shows what it brings right under it (Tobias 2026-11-06).
import { useState } from 'react';
import { inlineMarkdown, STEP_NOTE_LABEL, type Block } from '../../logic/manualTests';

export interface RefHandler {
  open: (id: string) => void;
  knows: (id: string) => boolean;
  /** A start link opens its prepared questionnaire in the app. */
  start?: (id: string) => void;
  startKnown?: (id: string) => boolean;
}

/** A value of a step with a button that copies it (it does not type it into the app). */
function CopyValue({ text }: { text: string }) {
  const [copied, setCopied] = useState<'ok' | 'manual' | undefined>();
  return (
    <span className="copy-value">
      <code>{text}</code>
      <button
        type="button"
        className="copy-button"
        aria-label={`„${text}“ kopieren`}
        title="Kopieren"
        onClick={() => {
          navigator.clipboard.writeText(text).then(
            () => setCopied('ok'),
            () => setCopied('manual'),
          );
        }}
      >
        {copied === 'ok' ? '✓' : '⧉'}
      </button>
      {copied === 'manual' && <span className="muted"> (bitte markieren und kopieren)</span>}
    </span>
  );
}

export function Inline({
  text,
  refs,
  copy = false,
}: {
  text: string;
  refs?: RefHandler;
  /** Values (`code`) get a copy button — in the steps only. */
  copy?: boolean;
}) {
  return (
    <>
      {inlineMarkdown(text).map((token, i) => {
        switch (token.kind) {
          case 'strong':
            return <strong key={i}>{token.text}</strong>;
          case 'em':
            return <em key={i}>{token.text}</em>;
          case 'code':
            return copy ? (
              <CopyValue key={i} text={token.text} />
            ) : (
              <code key={i}>{token.text}</code>
            );
          case 'kbd':
            return (
              <kbd key={i} title="Bitte selbst tippen">
                {token.text}
              </kbd>
            );
          case 'link':
            return (
              <a key={i} href={token.href} target="_blank" rel="noopener noreferrer">
                {token.text}
              </a>
            );
          case 'start': {
            const start = refs?.start;
            return start && refs.startKnown?.(token.id) ? (
              <button key={i} type="button" className="start-link" onClick={() => start(token.id)}>
                ▶ {token.text}
              </button>
            ) : (
              <span key={i}>{token.text}</span>
            );
          }
          case 'ref':
            return refs?.knows(token.id) ? (
              <button key={i} type="button" className="link" onClick={() => refs.open(token.id)}>
                {token.text}
              </button>
            ) : (
              <span key={i}>{token.text}</span>
            );
          default:
            return <span key={i}>{token.text}</span>;
        }
      })}
    </>
  );
}

export function Blocks({
  blocks,
  refs,
  copy = false,
}: {
  blocks: readonly Block[];
  refs?: RefHandler;
  copy?: boolean;
}) {
  const inline = (text: string, withCopy = false) => (
    <Inline text={text} copy={withCopy} {...(refs ? { refs } : {})} />
  );
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'code') {
          return (
            <pre key={i}>
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.kind === 'text') return <p key={i}>{inline(block.text, copy)}</p>;
        const items = block.items.map((item, j) => {
          const notes = block.notes?.[j];
          if (!notes) return <li key={j}>{inline(item, copy)}</li>;
          return (
            <li key={j} className="test-step">
              <p className="step-do">{inline(item, copy)}</p>
              {notes.map((text, k) => (
                <p key={k} className="step-note step-after">
                  <strong>{STEP_NOTE_LABEL}:</strong> {inline(text)}
                </p>
              ))}
            </li>
          );
        });
        return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
      })}
    </>
  );
}
