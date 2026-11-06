// The test folder build (dist-test) from file://: a start link of a manual test opens its prepared
// questionnaire in the app next to the instructions (start points, Tobias 2026-11-03). The test page
// keeps its results in the browser on purpose, so only network, console and CSP are guarded here.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { guard, type Guard } from './guards';

const TEST_APP = fileURLToPath(new URL('../../dist-test/index.html', import.meta.url));

async function openCase(page: Page, id: string): Promise<Guard> {
  expect(existsSync(TEST_APP), 'dist-test/index.html (npm run build:test)').toBe(true);
  const found = await guard(page);
  await page.goto(pathToFileURL(TEST_APP).href);
  await page
    .locator('.test-list button')
    .filter({ hasText: new RegExp(`^\\S*\\s*${id} `) })
    .click();
  return found;
}

async function expectQuiet(page: Page, found: Guard): Promise<void> {
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
}

const heading = (page: Page) => page.locator('.test-app .card h2').first();

test('a start link opens the Sofortmeldung ready to sign', async ({ page }) => {
  const found = await openCase(page, 'MT-21');
  await page.getByRole('button', { name: '▶ Zum Unterschreiben öffnen' }).click();
  await expect(page.getByText(/^Vorbereitet: Sofortmeldung – alles ausgefüllt/)).toBeVisible();
  await expect(heading(page)).toContainText('Zusammenfassung');
  await expect(page.locator('.test-app').getByText('Beispiel Bau GmbH').first()).toBeVisible();
  await expectQuiet(page, found);
});

test('a start link opens the Personalfragebogen at the decisive question', async ({ page }) => {
  const found = await openCase(page, 'MT-96');
  // The case opens the same start link again for its counter-checks (small steps, 2026-11-06).
  await page.getByRole('button', { name: '▶ Aushilfe vorbereitet öffnen' }).first().click();
  await expect(heading(page)).toContainText('Wie ist die Beschäftigung vorgesehen?');
  await expectQuiet(page, found);
});

test('a Kanzlei start link opens the station with prepared inputs', async ({ page }) => {
  const found = await openCase(page, 'MT-42');
  await page.getByRole('button', { name: '▶ Zwei Fassungen öffnen' }).click();
  await expect(page.getByText(/^Vorbereitet: Kanzlei – zwei Fassungen/)).toBeVisible();
  await expect(page.locator('.test-app')).toContainText(
    'Für dieselbe Rolle liegen verschiedene Fassungen vor',
  );
  await expectQuiet(page, found);
});
