// Clients only (Tobias 2026-11-13): before the hosted app opens, the person confirms the notice of
// the local configuration („Ich bestätige, dass ich Mandant der Kanzlei … bin.“). Only the hosted
// app asks — a downloaded copy came through it, and on file:// nothing may be remembered. „Antwort
// für die Zukunft merken“ keeps a fingerprint of the notice in the browser (not a cookie: it would
// travel to the web server with every request); a changed notice is asked again.
import { sha256Hex } from './hash';

/** What the browser keeps for a remembered confirmation: the fingerprint of the notice. */
export function accessToken(notice: string): string {
  return sha256Hex(notice);
}

export function accessGateNeeded(input: {
  notice: string | undefined;
  protocol: string;
  /** What the browser keeps under the access key, null when nothing. */
  remembered: string | null;
}): boolean {
  if (input.notice === undefined || input.protocol !== 'https:') return false;
  return input.remembered !== accessToken(input.notice);
}
