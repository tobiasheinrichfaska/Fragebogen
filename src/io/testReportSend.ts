// Sends a test report to the test zone (Testumgebung docs/testbericht.md): `POST /_zugang/bericht`
// on the page's own address, JSON in the format `testbericht/1`. Only the test build may connect
// there (its CSP: `connect-src 'self'`); the live build cannot connect anywhere.
import { sendOutcome, type ReportBody } from '../logic/testRun';

export const REPORT_ADDRESS = '/_zugang/bericht';

/** Whether this page can send: the hosted test zone at an https address. */
export const canSendReport = (): boolean => location.protocol === 'https:';

export async function sendTestReport(
  body: ReportBody,
  send: typeof fetch = fetch,
): Promise<{ sent: boolean; message: string }> {
  try {
    const response = await send(REPORT_ADDRESS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const text = response.status === 400 ? await response.text().catch(() => '') : '';
    return sendOutcome(response.status, text);
  } catch {
    return {
      sent: false,
      message:
        'Der Bericht konnte nicht gesendet werden. Bitte die Verbindung prüfen und noch einmal senden.',
    };
  }
}
