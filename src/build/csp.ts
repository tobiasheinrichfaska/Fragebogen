// Content-Security-Policy of the single HTML file (step 10): the browser itself refuses every
// network connection, every foreign script and eval — whatever the code does. The one inlined
// script and style are allowed by their SHA-256 hashes, computed after the single-file step.
import { createHash } from 'node:crypto';

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const STYLE = /<style\b([^>]*)>([\s\S]*?)<\/style>/g;

function hashOf(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/** The policy for these inline script and style hashes. */
export function cspFor(scriptHashes: readonly string[], styleHashes: readonly string[]): string {
  return [
    "default-src 'none'",
    `script-src ${scriptHashes.join(' ')}`,
    `style-src ${styleHashes.join(' ')}`,
    'img-src data: blob:',
    'font-src data:',
    "connect-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/**
 * Inserts the policy as the first element after `<meta charset>`. Refuses a page that loads a
 * script or stylesheet from outside or already carries a policy — the single file must not.
 */
export function withCsp(html: string): string {
  if (/<meta[^>]+http-equiv=["']?Content-Security-Policy/i.test(html)) {
    throw new Error('The page already has a Content-Security-Policy');
  }
  if (/<link\b[^>]*rel=["']?stylesheet/i.test(html)) {
    throw new Error('The page loads a stylesheet from outside');
  }
  const scripts = [...html.matchAll(SCRIPT)];
  if (scripts.some((match) => /\bsrc\s*=/i.test(match[1] ?? ''))) {
    throw new Error('The page loads a script from outside');
  }
  if (scripts.length === 0) throw new Error('The page has no inline script');
  const styles = [...html.matchAll(STYLE)];
  const policy = cspFor(
    scripts.map((match) => hashOf(match[2] ?? '')),
    styles.map((match) => hashOf(match[2] ?? '')),
  );
  const charset = /<meta charset="UTF-8" \/>|<meta charset="utf-8">/i.exec(html);
  if (!charset) throw new Error('The page has no <meta charset>');
  const at = charset.index + charset[0].length;
  return `${html.slice(0, at)}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />${html.slice(at)}`;
}
