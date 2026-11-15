// „Tester einladen“ (Tobias 2026-11-15, Testumgebung docs/plan.md): the login script of the protected
// test zone makes a one-time invitation link (7 days) at /_zugang/einladen and leads back with
// „Zurück zur App“. Whoever sees the test version is logged in, so the link needs no request — a
// plain navigation in the same tab, the CSP stays as it is. Only the test build carries it (the live
// build drops this module), and only at an https address: a downloaded file would lead nowhere.
import { TEST_AREA } from './catalogue';

const INVITE_ADDRESS = '/_zugang/einladen';

export function TesterInvite() {
  if (!TEST_AREA || location.protocol !== 'https:') return null;
  return (
    <p className="legal">
      <a href={INVITE_ADDRESS}>Tester einladen</a>
    </p>
  );
}
