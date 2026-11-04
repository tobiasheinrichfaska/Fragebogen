// An interrupted questionnaire (Tobias 2026-11-04: "nach Schließen auch wieder geöffnet werden"):
// the public build is served at an https address by Playwright itself — nothing goes on the
// network — because only the hosted app keeps anything. A page closed with unsaved answers offers
// to continue them; continuing brings the answers back; discarding leaves nothing behind. Under
// file:// the other specs' guards keep proving that nothing is stored.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { sealed, type ResumeRecord } from '../../src/logic/resume';

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

const stored = (page: Page) => page.evaluate(() => localStorage.getItem('fragebogen-angefangen'));

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
  await expect(page.getByRole('heading', { name: 'Angefangener Fragebogen gefunden' })).toHaveCount(
    0,
  );
  expect(await stored(page)).toBeNull();
});
