// An interrupted questionnaire (Tobias 2026-11-04: "nach Schließen auch wieder geöffnet werden"):
// the public build is served at an https address by Playwright itself — nothing goes on the
// network — because only the hosted app keeps anything. A page closed with unsaved answers offers
// to continue them; continuing brings the answers back; discarding leaves nothing behind. Under
// file:// the other specs' guards keep proving that nothing is stored.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { sealed, type ResumeRecord } from '../../src/logic/resume';
import { APP_STORAGE, storageKey } from '../../src/logic/storageKeys';

const withoutCheck = (record: ResumeRecord): Omit<ResumeRecord, 'check'> => {
  const body: Omit<ResumeRecord, 'check'> & { check?: string } = { ...record };
  delete body.check;
  return body;
};

const APP = fileURLToPath(new URL('../../dist/index.html', import.meta.url));
const ORIGIN = 'https://fragebogen.test';

async function serve(page: Page): Promise<string[]> {
  const html = readFileSync(APP);
  const foreign: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url === `${ORIGIN}/` || url === `${ORIGIN}/index.html`) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (!/^(data|blob):/.test(url)) foreign.push(url);
    return route.abort();
  });
  page.on('dialog', (dialog) => void dialog.accept());
  return foreign;
}

const TEST_APP = fileURLToPath(new URL('../../dist-test/index.html', import.meta.url));

/** The public app at / and the test folder at /test/ under one origin, as on the web server. */
async function serveBoth(page: Page): Promise<string[]> {
  const pages = new Map([
    [`${ORIGIN}/`, readFileSync(APP)],
    [`${ORIGIN}/index.html`, readFileSync(APP)],
    [`${ORIGIN}/test/`, readFileSync(TEST_APP)],
    [`${ORIGIN}/test/index.html`, readFileSync(TEST_APP)],
  ]);
  const foreign: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const body = pages.get(url);
    if (body) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body });
    if (!/^(data|blob):/.test(url)) foreign.push(url);
    return route.abort();
  });
  page.on('dialog', (dialog) => void dialog.accept());
  return foreign;
}

const stored = (page: Page) => page.evaluate(() => localStorage.getItem('fragebogen-angefangen'));
const storedInTestFolder = (page: Page) =>
  page.evaluate(
    (key) => localStorage.getItem(key),
    storageKey(APP_STORAGE.resume, '/test/index.html'),
  );
const OFFER = 'Angefangener Fragebogen gefunden';

async function startEmployer(page: Page): Promise<void> {
  await page.goto(`${ORIGIN}/`);
  await page
    .getByRole('button', { name: /Personalfragebogen: Angaben für die Sofortmeldung/ })
    .click();
  await page.getByRole('button', { name: /^Ich bin: Arbeitgeber/ }).click();
  const first = await page.locator('.card h2').first().innerText();
  await page.locator('.question input').first().fill('Beispiel Bau GmbH');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(page.locator('.card h2').first()).not.toHaveText(first);
}

test('a closed page offers the interrupted questionnaire and continues it', async ({ page }) => {
  const foreign = await serve(page);
  await startEmployer(page);
  await expect.poll(() => stored(page)).not.toBeNull();

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Angefangener Fragebogen gefunden' }),
  ).toBeVisible();
  await expect(page.locator('main')).toContainText(
    'Personalfragebogen: Angaben für die Sofortmeldung',
  );
  await page.getByRole('button', { name: 'Fortsetzen' }).click();
  await expect(page.locator('main')).toContainText(
    'Angefangener Fragebogen aus diesem Browser fortgesetzt.',
  );
  await expect(page.locator('main')).toContainText('begonnen, nicht abgeschlossen');
  await page.getByRole('button', { name: 'Weitermachen' }).click();
  await page.getByRole('button', { name: /^Zur Zusammenfassung/ }).click();
  await expect(page.locator('main')).toContainText('Beispiel Bau GmbH');
  expect(foreign).toEqual([]);
});

test('an answer given right before the page closes is kept', async ({ page }) => {
  // Regression 2026-11-04 (1 of 48 runs): the save waited 300 ms, a page closed earlier lost the
  // last answer. Now it is written at once when the page is hidden or closed.
  await serve(page);
  await page.goto(`${ORIGIN}/`);
  await page
    .getByRole('button', { name: /Personalfragebogen: Angaben für die Sofortmeldung/ })
    .click();
  await page.getByRole('button', { name: /^Ich bin: Arbeitgeber/ }).click();
  await page.locator('.question input').first().fill('Sofort Bau GmbH');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Fortsetzen' }).click();
  await page.getByRole('button', { name: 'Weitermachen' }).click();
  await page.getByRole('button', { name: /^Zur Zusammenfassung/ }).click();
  await expect(page.locator('main')).toContainText('Sofort Bau GmbH');
});

test('discarding removes it from the browser; nothing is offered again', async ({ page }) => {
  await serve(page);
  await startEmployer(page);
  await expect.poll(() => stored(page)).not.toBeNull();
  await page.getByRole('button', { name: 'Fragebogen verwerfen' }).click();
  await expect.poll(() => stored(page)).toBeNull();
  await page.reload();
  await expect(page.locator('main')).toContainText('Neuer Fragebogen');
  await expect(page.getByRole('heading', { name: 'Angefangener Fragebogen gefunden' })).toHaveCount(
    0,
  );
});

test('"Löschen" in the offer removes it', async ({ page }) => {
  await serve(page);
  await startEmployer(page);
  await expect.poll(() => stored(page)).not.toBeNull();
  await page.reload();
  await page.getByRole('button', { name: 'Löschen', exact: true }).click();
  await expect(page.locator('main')).toContainText('Der angefangene Fragebogen wurde gelöscht.');
  expect(await stored(page)).toBeNull();
});

test('a record older than 7 days is dropped with a note', async ({ page }) => {
  await serve(page);
  await startEmployer(page);
  await expect.poll(() => stored(page)).not.toBeNull();
  // The same record, saved eight days ago (with its check), is what the reloaded page finds.
  const record = JSON.parse((await stored(page)) ?? '{}') as ResumeRecord;
  const aged = sealed({
    ...withoutCheck(record),
    savedAt: new Date(Date.parse(record.savedAt) - 8 * 24 * 60 * 60 * 1000).toISOString(),
  });
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    'fragebogen-angefangen',
    JSON.stringify(aged),
  ] as const);
  await page.reload();
  await expect(page.locator('main')).toContainText('länger als 7 Tage');
  await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});

// Found 2026-11-13: the test folder at /test/ shares its origin, and so its localStorage, with the
// public app. It offered the public app's interrupted questionnaire, and "App vollständig
// zurücksetzen" deleted it; a questionnaire begun in the test folder turned up in the public app.
test.describe('the test folder keeps its own browser memory', () => {
  test('it neither offers nor deletes the public app’s interrupted questionnaire', async ({
    page,
  }) => {
    const foreign = await serveBoth(page);
    await startEmployer(page);
    await expect.poll(() => stored(page)).not.toBeNull();

    await page.goto(`${ORIGIN}/test/`);
    await expect(page.locator('.test-app main')).toContainText('Neuer Fragebogen');
    await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);
    await page
      .locator('.test-header')
      .getByRole('button', { name: 'App vollständig zurücksetzen' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Zurücksetzen', exact: true })
      .click();
    await expect(page.getByText('nichts mehr vom Testbereich in diesem Browser')).toBeVisible();
    expect(await stored(page)).not.toBeNull();

    await page.goto(`${ORIGIN}/`);
    await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
    await expect(page.locator('main')).toContainText(
      'Personalfragebogen: Angaben für die Sofortmeldung',
    );
    expect(foreign).toEqual([]);
  });

  test('a questionnaire begun in the test folder stays there', async ({ page }) => {
    const foreign = await serveBoth(page);
    await page.goto(`${ORIGIN}/test/`);
    const app = page.locator('.test-app');
    await app
      .getByRole('button', { name: /Personalfragebogen: Angaben für die Sofortmeldung/ })
      .click();
    await app.getByRole('button', { name: /^Ich bin: Arbeitgeber/ }).click();
    await app.locator('.question input').first().fill('Test Bau GmbH');
    await app.getByRole('button', { name: 'Weiter', exact: true }).click();
    await expect.poll(() => storedInTestFolder(page)).not.toBeNull();
    expect(await stored(page)).toBeNull();

    await page.goto(`${ORIGIN}/`);
    await expect(page.locator('main')).toContainText('Neuer Fragebogen');
    await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);

    await page.goto(`${ORIGIN}/test/`);
    await expect(app.getByRole('heading', { name: OFFER })).toBeVisible();
    expect(foreign).toEqual([]);
  });
});
