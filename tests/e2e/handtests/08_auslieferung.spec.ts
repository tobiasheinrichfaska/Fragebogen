// Former manual tests of manual_tests/08_auslieferung.md (Tobias 2026-11-08: only what a virtual
// browser cannot check stays a manual test). The help pages are opened from docs/hilfe/ by file://,
// on a computer, on an emulated phone and with reduced motion.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { devices, expect, test, type Page } from '@playwright/test';
import { guard } from '../guards';

const HELP = (path: string) =>
  pathToFileURL(fileURLToPath(new URL(`../../../docs/hilfe/${path}/index.html`, import.meta.url)))
    .href;

const svgOf = (page: Page, id: string) => page.locator(`#${id} .stage svg`);
const animation = (page: Page, id: string) =>
  svgOf(page, id).evaluate((svg) => getComputedStyle(svg).animationName);

async function helpPages(page: Page, choose: (name: string) => Promise<void>, moving: boolean) {
  const found = await guard(page);
  await page.goto(HELP('steuer-id'));
  await choose('Lohnsteuerbescheinigung eines früheren Arbeitgebers');
  const section = page.locator('#lohnsteuerbescheinigung');
  await expect(section).toBeVisible();
  await expect(section.locator('.found')).toHaveText('Hier: Identifikationsnummer:');
  await expect(section.locator('text.watermark')).toHaveText('MUSTER');
  // Every number on a sample is made of nines.
  const numbers = await section.locator('text.value').allTextContents();
  expect(numbers.filter((value) => /\d{3}/.test(value))).toEqual(['99 999 999 999']);
  if (moving) {
    // The sheet zooms onto the field after about half a second, then the mark appears.
    expect(await animation(page, 'lohnsteuerbescheinigung')).toBe('zoom');
    await expect
      .poll(() =>
        svgOf(page, 'lohnsteuerbescheinigung').evaluate((svg) => getComputedStyle(svg).transform),
      )
      .not.toBe('none');
  } else {
    // Reduced motion: no animation, the whole sheet with its mark at once.
    expect(await animation(page, 'lohnsteuerbescheinigung')).toBe('none');
    expect(
      await svgOf(page, 'lohnsteuerbescheinigung').evaluate(
        (svg) => getComputedStyle(svg).transform,
      ),
    ).toBe('none');
  }
  await expect
    .poll(() =>
      section.locator('rect.mark').evaluate((mark) => Number(getComputedStyle(mark).opacity)),
    )
    .toBe(1);

  await choose('Andere Auswahl');
  await choose('Nichts davon');
  const nothing = page.locator('#nichts');
  await expect(nothing).toBeVisible();
  await expect(nothing.locator('svg')).toHaveCount(0);
  await expect(nothing).toContainText('beim Bundeszentralamt für Steuern neu anfordern');
  await expect(
    nothing.getByRole('link', { name: /Identifikationsnummer erneut mitteilen/ }),
  ).toHaveAttribute('href', /^https:\/\/www\.bzst\.de\//);

  await page.goto(HELP('versicherungsnummer'));
  await choose('Gesundheitskarte der Krankenkasse');
  const card = page.locator('#gesundheitskarte');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Achtung, andere Nummer: Versichertennummer');
  expect(
    await card.locator('rect.mark.trap').evaluate((mark) => getComputedStyle(mark).strokeDasharray),
  ).not.toBe('none');

  // Nothing is loaded from outside; only the source links lead there, and none is followed.
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
}

test('MT-81: the help pages on a computer: sample, zoom, mark, the way without a document', async ({
  page,
}) => {
  await helpPages(
    page,
    (name) => page.getByRole('link', { name, exact: true }).first().click(),
    true,
  );
});

test.describe('MT-81 on a phone', { tag: '@webkit' }, () => {
  const { viewport, deviceScaleFactor, userAgent } = devices['Pixel 7'];
  test.use({ viewport, deviceScaleFactor, userAgent, isMobile: true, hasTouch: true });
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox has no mobile emulation');

  test('MT-81: the help pages on an emulated phone, tapped', async ({ page }) => {
    await helpPages(
      page,
      (name) => page.getByRole('link', { name, exact: true }).first().tap(),
      true,
    );
  });

  test('MT-81: with reduced motion the whole sheet shows at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await helpPages(
      page,
      (name) => page.getByRole('link', { name, exact: true }).first().tap(),
      false,
    );
  });
});
