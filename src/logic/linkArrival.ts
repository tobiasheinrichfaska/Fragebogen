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
 * Whether a link the app read may leave the address bar now (audit 2026-11-18). It goes, so the same
 * link opened again in this tab moves the fragment and starts the app anew — also a link with an
 * error or a form the app lacks, whose message then comes again. It waits while the access notice
 * covers the app (a reload there would lose it) and while an interrupted questionnaire of this
 * browser is offered (choosing that one must not lose the link; iOS Safari reloads without asking).
 */
export function linkLeavesAddress(input: {
  link: boolean;
  accessOpen: boolean;
  offerOpen: boolean;
}): boolean {
  return input.link && !input.accessOpen && !input.offerOpen;
}
