// "Teilen" for a written PDF (Tobias 2026-11-04: on Android the PDF could only be opened). A phone
// is played in every engine: touch as the main input ((pointer: coarse)) and a stand-in for the
// Web Share API that records what it gets. On such a device the app must not download at once,
// must offer "Teilen" and "Speichern", and "Teilen" must hand over the PDF itself. On a computer
// (no stand-in) the PDF downloads at once as before.
import { expect, test, type Page } from '@playwright/test';
import { openTestApp, protect } from './app';
import type { Guard } from './guards';

declare global {
  interface Window {
    __shared?: { name: string; type: string; size: number }[];
  }
}

async function phone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const coarse = window.matchMedia.bind(window);
    window.matchMedia = (query: string) =>
      query === '(pointer: coarse)'
        ? ({ ...coarse(query), matches: true, media: query } as MediaQueryList)
        : coarse(query);
    window.__shared = [];
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data?: ShareData) => (data?.files?.length ?? 0) > 0,
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data?: ShareData) => {
        for (const file of data?.files ?? []) {
          window.__shared?.push({ name: file.name, type: file.type, size: file.size });
        }
      },
    });
  });
}

// The complete Sofortmeldung, opened at once from its start point (2026-11-08: no manual test needed).
async function openComplete(page: Page): Promise<Guard> {
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  await expect(app).toContainText('Vollständig');
  return found;
}

test('on a phone the PDF is shared, not downloaded at once', async ({ page }) => {
  await phone(page);
  const found = await openComplete(page);
  let downloads = 0;
  page.on('download', () => (downloads += 1));

  await page.locator('.test-app').getByRole('button', { name: 'PDF erstellen' }).click();
  await protect(page, 'Ohne Kennwort');
  const banner = page.locator('.test-app .banner-success').filter({ hasText: 'PDF „' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Speichern' })).toBeVisible();
  expect(downloads).toBe(0);

  await banner.getByRole('button', { name: 'Teilen' }).click();
  await expect.poll(() => page.evaluate(() => window.__shared ?? [])).toHaveLength(1);
  const [shared] = await page.evaluate(() => window.__shared ?? []);
  expect(shared?.name).toMatch(/\.pdf$/);
  expect(shared?.type).toBe('application/pdf');
  expect(shared?.size).toBeGreaterThan(10_000);
  expect(downloads).toBe(0);

  const [file] = await Promise.all([
    page.waitForEvent('download'),
    banner.getByRole('button', { name: 'Speichern' }).click(),
  ]);
  expect(file.suggestedFilename()).toBe(shared?.name);
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
});

test('on a computer the PDF downloads at once as before', async ({ page }) => {
  const found = await openComplete(page);
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    (async () => {
      await page.locator('.test-app').getByRole('button', { name: 'PDF erstellen' }).click();
      await protect(page, 'Ohne Kennwort');
    })(),
  ]);
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const banner = page.locator('.test-app .banner-success').filter({ hasText: 'PDF „' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Speichern' })).toHaveCount(0);
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
});
