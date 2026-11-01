// Renders the test texts (inline Markdown, paragraphs, lists, code) as React elements — never HTML.
import { inlineMarkdown, type Block } from '../../logic/manualTests';

export function Inline({ text }: { text: string }) {
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
          default:
            return <span key={i}>{token.text}</span>;
        }
      })}
    </>
  );
}

export function Blocks({ blocks }: { blocks: readonly Block[] }) {
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
              <Inline text={block.text} />
            </p>
          );
        }
        const items = block.items.map((item, j) => (
          <li key={j}>
            <Inline text={item} />
          </li>
        ));
        return block.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
      })}
    </>
  );
}
