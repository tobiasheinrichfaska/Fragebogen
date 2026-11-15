// Content-Security-Policy of the single HTML file (step 10): the browser itself refuses every
// network connection, every foreign script and eval — whatever the code does. The one inlined
// script and style are allowed by their SHA-256 hashes, computed after the single-file step.
import { createHash } from 'node:crypto';

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const STYLE = /<style\b([^>]*)>([\s\S]*?)<\/style>/g;

function hashOf(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

export interface CspOptions {
  /**
   * The hosted builds are installable (Tobias 2026-11-15, „1b“): the page may read its manifest and
   * icons from its own address and register the service worker next to it (src/build/webApp.ts).
   * Connections stay forbidden; the service worker is the only script besides the inlined one.
   */
  webApp?: boolean;
  /**
   * The test build sends its test reports to its own address (`POST /_zugang/bericht`, Testumgebung
   * docs/testbericht.md): `connect-src 'self'`. Every other build connects nowhere.
   */
  report?: boolean;
}

/** The policy for these inline script and style hashes. */
export function cspFor(
  scriptHashes: readonly string[],
  styleHashes: readonly string[],
  options: CspOptions = {},
): string {
  const own = options.webApp === true;
  return [
    "default-src 'none'",
    `script-src ${scriptHashes.join(' ')}`,
    `style-src ${styleHashes.join(' ')}`,
    own ? "img-src 'self' data: blob:" : 'img-src data: blob:',
    'font-src data:',
    options.report === true ? "connect-src 'self'" : "connect-src 'none'",
    own ? "worker-src 'self'" : "worker-src 'none'",
    ...(own ? ["manifest-src 'self'"] : []),
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/**
 * Inserts the policy as the first element after `<meta charset>`. Refuses a page that loads a
 * script or stylesheet from outside or already carries a policy — the single file must not.
 */
export function withCsp(html: string, options: CspOptions = {}): string {
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
    options,
  );
  const charset = /<meta charset="UTF-8" \/>|<meta charset="utf-8">/i.exec(html);
  if (!charset) throw new Error('The page has no <meta charset>');
  const at = charset.index + charset[0].length;
  return `${html.slice(0, at)}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />${html.slice(at)}`;
}
