// Guards for every end-to-end run: nothing may leave the device (only file:, data: and blob:
// requests), the Content-Security-Policy is never violated, no error reaches the console and
// nothing is left in the browser's storage.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { accessToken } from '../../src/logic/accessGate';
import { parseAppConfig } from '../../src/logic/appConfig';

// The configuration the builds were made with, as vite.config.ts reads it: the local Kanzlei
// configuration where it exists, else the neutral example of the public repo.
const LOCAL_CONFIG = fileURLToPath(new URL('../../config/kanzlei.local.json', import.meta.url));
const EXAMPLE_CONFIG = fileURLToPath(new URL('../../config/kanzlei.example.json', import.meta.url));
const parsedConfig = parseAppConfig(
  JSON.parse(readFileSync(existsSync(LOCAL_CONFIG) ? LOCAL_CONFIG : EXAMPLE_CONFIG, 'utf8')),
);
/** The access notice the hosted app asks before it opens (none in the public repo). */
export const ACCESS_NOTICE = parsedConfig.ok ? parsedConfig.config.accessNotice : undefined;
const ACCESS_KEY = 'fragebogen-zugang';

/**
 * As if the person had once ticked „Antwort für die Zukunft merken“: the hosted app opens at once.
 * Only the test of the notice itself (handtests/14_zugang.spec.ts) goes without.
 */
export async function rememberAccess(target: Page | BrowserContext): Promise<void> {
  if (ACCESS_NOTICE === undefined) return;
  await target.addInitScript(
    ([name, token]) => {
      if (location.protocol !== 'https:') return;
      const cut = location.pathname.lastIndexOf('/');
      const folder = cut < 0 ? '/' : location.pathname.slice(0, cut + 1);
      const key = folder === '/' ? name : `${name}@${folder}`;
      try {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, token);
      } catch {
        // no storage: the notice is asked, the test will say so
      }
    },
    [ACCESS_KEY, accessToken(ACCESS_NOTICE)] as const,
  );
}

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

/** Confirms the access notice where the app asks it (after a full reset, for example). */
export async function passAccessGate(app: Locator): Promise<void> {
  if (ACCESS_NOTICE === undefined) return;
  await app.getByRole('checkbox', { name: ACCESS_NOTICE }).check();
  await app.getByRole('button', { name: 'Weiter', exact: true }).click();
}

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
  await rememberAccess(page);
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
      // The remembered access notice is set by the test itself (rememberAccess), not left behind.
      const keys = Object.keys(localStorage).filter((key) => !key.startsWith('fragebogen-zugang'));
      count += keys.length + sessionStorage.length;
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
