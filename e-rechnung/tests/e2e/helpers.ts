import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const APP = pathToFileURL(join(import.meta.dirname, '..', '..', 'dist', 'index.html')).href;

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

/** Opens the built file with the spy; the returned list collects console errors and requests. */
export async function openApp(page: Page): Promise<string[]> {
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

/** Picks a file and waits until the result for exactly this file is shown. */
export async function upload(page: Page, name: string, bytes: Uint8Array, mimeType: string) {
  await page
    .getByTestId('file-input')
    .setInputFiles({ name, mimeType, buffer: Buffer.from(bytes) });
  await expect(
    page
      .getByText(`Geprüfte Datei: „${name}“`)
      .or(page.getByText(`Bei „${name}“ ist ein unerwarteter Fehler`)),
  ).toBeVisible({ timeout: 30_000 });
}

export async function sideEffects(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __sideEffects: string[] }).__sideEffects);
}
