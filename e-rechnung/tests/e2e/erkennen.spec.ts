import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { encode, official, officialText, withInvoiceNumber, withSpecId } from '../support/fixtures';
import { miniPdf } from '../support/minipdf';

const APP = pathToFileURL(join(import.meta.dirname, '..', '..', 'dist', 'index.html')).href;
const CII = officialText('cen/CII_example1.xml');

// Records every attempt to store something or to leave the page: the fixed frame says nothing is
// stored (other apps share the origin) and the file never leaves the computer.
const SPY = () => {
  const seen: string[] = [];
  (window as unknown as { __sideEffects: string[] }).__sideEffects = seen;
  for (const method of ['getItem', 'setItem', 'removeItem', 'clear', 'key'] as const) {
    const original = Storage.prototype[method] as (...args: unknown[]) => unknown;
    Storage.prototype[method] = function (this: Storage, ...args: unknown[]) {
      seen.push(`storage.${method}`);
      return original.apply(this, args);
    } as never;
  }
  const idb = window.indexedDB;
  if (idb) {
    const open = idb.open.bind(idb);
    idb.open = ((...args: Parameters<IDBFactory['open']>) => {
      seen.push('indexedDB.open');
      return open(...args);
    }) as IDBFactory['open'];
  }
  const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  Object.defineProperty(document, 'cookie', {
    get() {
      seen.push('cookie.get');
      return cookie?.get?.call(document) as string;
    },
    set(value: string) {
      seen.push('cookie.set');
      cookie?.set?.call(document, value);
    },
  });
  document.addEventListener('securitypolicyviolation', (event) => {
    seen.push(`csp:${event.violatedDirective}:${event.blockedURI}`);
  });
};

async function openApp(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('request', (request) => {
    if (!/^(file|data|blob):/.test(request.url())) problems.push(`request: ${request.url()}`);
  });
  await page.addInitScript(SPY);
  await page.goto(APP);
  return problems;
}

async function upload(page: Page, name: string, bytes: Uint8Array, mimeType: string) {
  await page
    .getByTestId('file-input')
    .setInputFiles({ name, mimeType, buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('headline')).toBeVisible({ timeout: 30_000 });
}

async function sideEffects(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __sideEffects: string[] }).__sideEffects);
}

test('the spy notices storage and cookie access (so an empty list means something)', async ({
  page,
}) => {
  await openApp(page);
  const seen = await page.evaluate(() => {
    try {
      window.localStorage.setItem('probe', '1');
      window.localStorage.removeItem('probe');
    } catch {
      // file:// may refuse storage — the attempt is still recorded
    }
    void document.cookie;
    return (window as unknown as { __sideEffects: string[] }).__sideEffects;
  });
  expect(seen).toEqual(expect.arrayContaining(['storage.setItem', 'cookie.get']));
});

test('shows the page with the fixed notice and a CSP', async ({ page }) => {
  const problems = await openApp(page);
  await expect(page.getByRole('heading', { name: 'E-Rechnung prüfen' })).toBeVisible();
  await expect(page.getByTestId('fixed-notice')).toContainText('keine steuerliche Prüfung');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("connect-src 'none'");
  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});

test('recognises an XML e-invoice, a hybrid PDF and a plain PDF without storing or sending anything', async ({
  page,
}) => {
  const problems = await openApp(page);

  await upload(page, 'rechnung.xml', official('cen/CII_example1.xml'), 'application/xml');
  await expect(page.getByTestId('headline')).toHaveText(/^E-Rechnung erkannt \(EN 16931/);
  await expect(page.getByRole('row', { name: /Syntax/ })).toContainText('UN/CEFACT CII');

  const hybrid = miniPdf({
    text: 'Rechnung',
    attachments: [
      { name: 'factur-x.xml', bytes: encode(CII), mime: 'text/xml', relationship: 'Alternative' },
    ],
  });
  await upload(page, 'hybrid.pdf', hybrid, 'application/pdf');
  await expect(page.getByTestId('verdict')).toContainText('Anhang „factur-x.xml“');
  await expect(page.getByTestId('verdict')).toHaveClass(/tone-ok/);

  await upload(page, 'scan.pdf', miniPdf({ text: 'Rechnung' }), 'application/pdf');
  await expect(page.getByTestId('headline')).toHaveText('Keine E-Rechnung: einfaches PDF');

  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});

test('names MINIMUM, contradicting invoice data and a protected PDF', async ({ page }) => {
  const problems = await openApp(page);
  const xml = (name: string, text: string) => ({ name, bytes: encode(text), mime: 'text/xml' });

  await upload(
    page,
    'minimum.pdf',
    miniPdf({ attachments: [xml('factur-x.xml', withSpecId(CII, 'urn:factur-x.eu:1p0:minimum'))] }),
    'application/pdf',
  );
  await expect(page.getByTestId('headline')).toHaveText(
    'PDF mit Rechnungsdaten, Profil MINIMUM: keine E-Rechnung im Sinne des UStG',
  );

  await upload(
    page,
    'zwei.pdf',
    miniPdf({ attachments: [xml('a.xml', CII), xml('b.xml', withInvoiceNumber(CII, 'X-2'))] }),
    'application/pdf',
  );
  await expect(page.getByTestId('headline')).toHaveText(
    'Mögliche Auffälligkeit: widersprüchliche Rechnungsdaten im PDF',
  );
  await expect(page.getByTestId('differing')).toContainText('Rechnungsnummer');
  await expect(page.getByText('Rechnungsdaten 2 von 2')).toBeVisible();

  await upload(page, 'geschuetzt.pdf', miniPdf({ passwordProtected: true }), 'application/pdf');
  await expect(page.getByTestId('headline')).toHaveText('Das PDF ist mit einem Kennwort geschützt');

  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});

test('takes a dropped file', async ({ page }) => {
  const problems = await openApp(page);
  const bytes = [...official('kosit/01.01a-INVOICE_ubl.xml')];
  const transfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(data)], 'xrechnung.xml', { type: 'application/xml' }));
    return dt;
  }, bytes);
  await page.locator('.dropzone').dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.getByTestId('headline')).toHaveText('E-Rechnung erkannt (XRechnung 3.0)');
  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});
