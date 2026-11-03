// Renders the test texts (inline Markdown, paragraphs, lists, code) as React elements — never HTML.
// A reference to another test ("MT-10") becomes a button that opens it, when the page knows it.
import { inlineMarkdown, type Block } from '../../logic/manualTests';

export interface RefHandler {
  open: (id: string) => void;
  knows: (id: string) => boolean;
  /** A start link opens its prepared questionnaire in the app. */
  start?: (id: string) => void;
  startKnown?: (id: string) => boolean;
}

export function Inline({ text, refs }: { text: string; refs?: RefHandler }) {
  return (
    <>
      {inlineMarkdown(text).map((token, i) => {
        switch (token.kind) {
          case 'strong':
            return <strong key={i}>{token.text}</strong>;
          case 'em':
            return <em key={i}>{token.text}</em>;
          case 'code':
            return <code key={i}>{token.text}</code>;
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

export function Blocks({ blocks, refs }: { blocks: readonly Block[]; refs?: RefHandler }) {
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
        if (block.kind === 'text') {
          return (
            <p key={i}>
              <Inline text={block.text} {...(refs ? { refs } : {})} />
            </p>
          );
        }
        const items = block.items.map((item, j) => (
          <li key={j}>
            <Inline text={item} {...(refs ? { refs } : {})} />
          </li>
        ));
        return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
      })}
    </>
  );
}
