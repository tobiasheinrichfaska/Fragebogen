// The hosted app is installable and starts offline (Tobias 2026-11-15: „warum ist Fragebogen nicht
// installierbar?“ — „1b machen wir“). Served at an https address by Playwright itself: the page
// links manifest and icons and registers the service worker; online it stays out of the way, offline
// it starts the stored app. A downloaded copy (file://) links nothing. Only Chromium routes a service
// worker's own requests through Playwright, so the offline start runs there.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { WEB_APP_FILES } from '../../src/logic/webApp';
import { APP, openApp, TEST_APP } from './app';
import { rememberAccess } from './guards';

const ORIGIN = 'https://fragebogen.test';

interface Served {
  /** Paths the browser asked for, in order. */
  asked: string[];
  /** Requests that are no file of the build. */
  foreign: string[];
  errors: string[];
}

/** Every file of a build at the origin, as the web server serves them; nothing else. */
async function serveBuild(context: BrowserContext, page: Page, index: string): Promise<Served> {
  const dir = dirname(index);
  const types: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    json: 'application/json',
    js: 'text/javascript; charset=utf-8',
    png: 'image/png',
  };
  const served: Served = { asked: [], foreign: [], errors: [] };
  await rememberAccess(context);
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      if (!/^(data|blob):/.test(url.href)) served.foreign.push(url.href);
      return route.abort();
    }
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    served.asked.push(url.pathname);
    const path = join(dir, name);
    if (name.includes('..') || !existsSync(path)) return route.fulfill({ status: 404 });
    return route.fulfill({
      status: 200,
      contentType: types[name.split('.').at(-1) ?? ''] ?? 'application/octet-stream',
      body: readFileSync(path),
    });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') served.errors.push(message.text());
  });
  page.on('pageerror', (error) => served.errors.push(error.message));
  return served;
}

const linked = (page: Page, rel: string) =>
  page.locator(`head link[rel="${rel}"]`).getAttribute('href');

test.describe('at an https address', () => {
  test('links manifest and touch icon, with the login cookie for the manifest', async ({
    context,
    page,
  }) => {
    const served = await serveBuild(context, page, APP);
    await page.goto(`${ORIGIN}/`);
    await expect(page.locator('#root main')).toBeVisible();
    expect(await linked(page, 'manifest')).toBe(WEB_APP_FILES.manifest);
    await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute(
      'crossorigin',
      'use-credentials',
    );
    expect(await linked(page, 'apple-touch-icon')).toBe(WEB_APP_FILES.appleTouch);
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("worker-src 'self'");
    expect(csp).toContain("manifest-src 'self'");
    expect(csp).toContain("connect-src 'none'");
    expect(served.foreign).toEqual([]);
    expect(served.errors).toEqual([]);
  });

  test.describe('with its service worker', () => {
    test.use({ serviceWorkers: 'allow' });

    test('stays out of the way online and starts the stored app offline', async ({
      browserName,
      context,
      page,
    }) => {
      test.skip(browserName !== 'chromium', 'only Chromium routes a service worker’s requests');
      const served = await serveBuild(context, page, APP);
      await page.goto(`${ORIGIN}/`);
      await expect(page.locator('#root main')).toBeVisible();
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      expect(served.asked).toEqual(
        expect.arrayContaining(['/sw.js', '/manifest.json', '/icon-192.png']),
      );

      const online = await page.reload();
      expect(online?.fromServiceWorker()).toBe(false);
      await expect(page.locator('#root main')).toBeVisible();

      await context.setOffline(true);
      const offline = await page.reload();
      expect(offline?.fromServiceWorker()).toBe(true);
      await expect(page.locator('#root main')).toContainText('Neuer Fragebogen');
      await context.setOffline(false);
      expect(served.foreign).toEqual([]);
      expect(served.errors).toEqual([]);
    });
  });
});

test('a downloaded copy links nothing and registers no service worker', async ({ page }) => {
  const { found } = await openApp(page);
  expect(await page.locator('head link[rel="manifest"]').count()).toBe(0);
  expect(await page.locator('head link[rel="apple-touch-icon"]').count()).toBe(0);
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
});

test('both hosted builds carry their files; the test build its own name', () => {
  for (const [index, name] of [
    [APP, 'Fragebogen'],
    [TEST_APP, 'Fragebogen-Test'],
  ] as const) {
    for (const file of Object.values(WEB_APP_FILES)) {
      expect(existsSync(join(dirname(index), file)), `${index}: ${file}`).toBe(true);
    }
    const manifest = JSON.parse(
      readFileSync(join(dirname(index), WEB_APP_FILES.manifest), 'utf8'),
    ) as { name: string };
    expect(manifest.name).toBe(name);
    expect(pathToFileURL(index).href).toMatch(/index\.html$/);
  }
});
