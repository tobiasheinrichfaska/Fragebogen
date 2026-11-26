// A link that arrives in a tab where the app is already open (bug 2026-11-17, Tobias: „in der
// Live-Version funktioniert ein Vorbelegungslink im Personalfragebogen nicht“): the browser then only
// changes the fragment and does not load the page again — Safari, for example, opens a link from a
// mail in the tab that already shows the same address. The app reads its links once at the start,
// so such a link has to load the page anew.
import { parseMasterDataFragment } from './masterDataLink';
import { parseTransferFragment } from './transferLink';

/**
 * Whether a fragment the browser moved to carries something the app reads only at its start: a
 * master-data link or a link that passes a questionnaire on — also a malformed one, whose message
 * the start shows. Any other fragment changes nothing.
 */
export function linkNeedsStart(hash: string): boolean {
  const master = parseMasterDataFragment(hash);
  return !master.ok || master.data !== undefined || parseTransferFragment(hash) !== undefined;
}

/**
 * Whether the app may take a link it has read out of the address bar (audit 2026-11-18). Only once
 * nothing can still replace what the link opened or hide it: while the access notice covers the app
 * a reload would otherwise show a plain start page, and while the offer of an interrupted
 * questionnaire is open (iOS Safari reloads without asking) „Fortsetzen“ replaces the link's new
 * questionnaire — the link stays, so a reload shows both again. A link the app could not follow
 * (an error, a form it lacks) leaves as well, so the same link opened again in that tab moves the
 * fragment and starts anew; its message is shown once.
 */
export function linkMayLeaveAddressBar(state: {
  hash: string;
  accessOpen: boolean;
  offerOpen: boolean;
}): boolean {
  return linkNeedsStart(state.hash) && !state.accessOpen && !state.offerOpen;
}
