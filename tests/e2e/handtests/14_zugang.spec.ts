// The access notice before the hosted app opens (Tobias 2026-11-13: „Ich bestätige, dass ich Mandant
// der Kanzlei … bin“, with „Antwort für die Zukunft merken“). Its text lives in the local Kanzlei
// configuration: with it the notice is tested, without it (the public repo) the app must open at
// once — one of the two branches runs, the other is skipped with its reason.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { APP } from '../app';
import { ACCESS_NOTICE } from '../guards';

const ORIGIN = 'https://fragebogen.test';

/** The public build at an https address, nothing remembered; anything else is refused. */
async function serve(page: Page): Promise<string[]> {
  const html = readFileSync(APP);
  const foreign: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url().split('#')[0] ?? '';
    if (url === `${ORIGIN}/`) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (!/^(data|blob):/.test(url)) foreign.push(url);
    return route.abort();
  });
  page.on('dialog', (dialog) => void dialog.accept());
  return foreign;
}

const gate = (page: Page) => page.getByRole('heading', { name: 'Bitte bestätigen' });
const start = (page: Page) => page.getByRole('heading', { name: 'Neuer Fragebogen' });

test.describe('with the notice of the local configuration', () => {
  test.skip(ACCESS_NOTICE === undefined, 'no access notice configured (public repo)');
  const notice = ACCESS_NOTICE ?? '';

  test('nothing of the app before the notice is confirmed; „Weiter“ only with the tick', async ({
    page,
  }) => {
    const foreign = await serve(page);
    await page.goto(`${ORIGIN}/`);
    await expect(gate(page)).toBeVisible();
    await expect(page.locator('main')).toContainText(notice);
    await expect(start(page)).toHaveCount(0);
    const next = page.getByRole('button', { name: 'Weiter', exact: true });
    await expect(next).toBeDisabled();
    await page.getByRole('checkbox', { name: notice }).check();
    await next.click();
    await expect(start(page)).toBeVisible();
    expect(foreign).toEqual([]);
  });

  test('asked again on the next visit unless „Antwort für die Zukunft merken“ was ticked', async ({
    page,
  }) => {
    await serve(page);
    await page.goto(`${ORIGIN}/`);
    await page.getByRole('checkbox', { name: notice }).check();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await expect(start(page)).toBeVisible();
    await page.reload();
    await expect(gate(page)).toBeVisible();

    await page.getByRole('checkbox', { name: notice }).check();
    await page.getByRole('checkbox', { name: 'Antwort für die Zukunft merken' }).check();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.reload();
    await expect(start(page)).toBeVisible();
    await expect(gate(page)).toHaveCount(0);
    // Kept in the browser, never as a cookie (it would travel to the web server).
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(await page.evaluate(() => localStorage.getItem('fragebogen-zugang'))).not.toBeNull();

    // „Alle Daten auf diesem Gerät löschen“ takes it away again.
    await page.getByRole('button', { name: 'Alle Daten auf diesem Gerät löschen' }).click();
    await expect(gate(page)).toBeVisible();
  });

  test('a downloaded copy (file://) does not ask', async ({ page }) => {
    await page.goto(pathToFileURL(APP).href);
    await expect(start(page)).toBeVisible();
    await expect(gate(page)).toHaveCount(0);
  });
});

test('without a configured notice the hosted app opens at once', async ({ page }) => {
  test.skip(ACCESS_NOTICE !== undefined, 'an access notice is configured (local Kanzlei build)');
  await serve(page);
  await page.goto(`${ORIGIN}/`);
  await expect(start(page)).toBeVisible();
  await expect(gate(page)).toHaveCount(0);
});
