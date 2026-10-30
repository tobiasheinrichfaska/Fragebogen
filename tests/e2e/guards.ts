// Guards for every end-to-end run: nothing may leave the device (only file:, data: and blob:
// requests), the Content-Security-Policy is never violated, no error reaches the console and
// nothing is left in the browser's storage.
import { expect, type Page } from '@playwright/test';

export interface Guard {
  external: string[];
  errors: string[];
}

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

const LOCAL = /^(file|data|blob):/;

export async function guard(page: Page): Promise<Guard> {
  const found: Guard = { external: [], errors: [] };
  page.on('request', (request) => {
    if (!LOCAL.test(request.url())) found.external.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') found.errors.push(message.text());
  });
  page.on('pageerror', (error) => found.errors.push(error.message));
  page.on('dialog', (dialog) => void dialog.accept());
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations?.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  return found;
}

/** Storage the page left behind; an inaccessible storage counts as empty. */
async function leftInStorage(page: Page): Promise<number> {
  return page.evaluate(async () => {
    let count = 0;
    try {
      count += localStorage.length + sessionStorage.length;
    } catch {
      // not available on file:// in this engine — nothing can be stored there either
    }
    try {
      if ('databases' in indexedDB) count += (await indexedDB.databases()).length;
    } catch {
      // as above
    }
    return count;
  });
}

export async function expectClean(page: Page, found: Guard): Promise<void> {
  expect(found.external, 'requests that left the device').toEqual([]);
  expect(found.errors, 'console errors').toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? []), 'CSP violations').toEqual([]);
  expect(await leftInStorage(page), 'entries left in browser storage').toBe(0);
}
