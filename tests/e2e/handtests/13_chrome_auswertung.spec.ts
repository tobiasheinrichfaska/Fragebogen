// Findings of the Claude-in-Chrome evaluation (2026-11-13, import chrome-evaluierung-teil1/2.json)
// that only show in the running app: typed input kept by the links that leave a step (part 2 B1),
// buttons that stay where they are (B24), every new page from its top (B28). The public build,
// fictitious data only.
import { expect, test, type Locator } from '@playwright/test';
import { expectQuiet, heading, openApp, press } from '../app';

const SOFORT = 'Personalfragebogen: Angaben für die Sofortmeldung';
const SUMMARY_LINK = 'Zur Zusammenfassung – alle Angaben ansehen und ändern';
const PAUSE_LINK = 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)';
const FIRMA = 'Wie lautet die Firma des Arbeitgebers?';
const BETRIEBSNUMMER = 'Wie lautet die Betriebsnummer?';

const field = (app: Locator) => app.locator('.question input').first();
const summaryValue = (app: Locator, label: string) =>
  app
    .locator('.summary-row')
    .filter({ has: app.page().locator('dt', { hasText: label }) })
    .locator('dd')
    .first();

async function employerAtFirstQuestion(app: Locator): Promise<void> {
  await press(app, SOFORT);
  await app.getByRole('button', { name: 'Ich bin: Arbeitgeber' }).click();
  await expect.poll(() => heading(app)).toBe(FIRMA);
}

test.describe('part 2 B1: a link that leaves a step keeps what was typed there', () => {
  test('„Zur Zusammenfassung …“ takes the typed answer over', async ({ page }) => {
    const { found, app } = await openApp(page);
    await employerAtFirstQuestion(app);
    await field(app).fill('Beispiel Bau GmbH');
    await app.getByRole('button', { name: SUMMARY_LINK }).click();
    await expect.poll(() => heading(app)).toBe('Zusammenfassung');
    await expect(summaryValue(app, 'Firma des Arbeitgebers')).toHaveText('Beispiel Bau GmbH');
    await expectQuiet(page, found);
  });

  test('an answer the app refuses keeps the person on the step with its message', async ({
    page,
  }) => {
    const { found, app } = await openApp(page);
    await employerAtFirstQuestion(app);
    await field(app).fill('Beispiel Bau GmbH');
    await app.locator('.card .nav button.primary').click();
    await expect.poll(() => heading(app)).toBe(BETRIEBSNUMMER);
    await field(app).fill('123');
    await app.getByRole('button', { name: SUMMARY_LINK }).click();
    await expect(app.locator('.field-error')).toBeVisible();
    expect(await heading(app)).toBe(BETRIEBSNUMMER);
    await expectQuiet(page, found);
  });

  test('„Unterbrechen …“ keeps the typed answer, as it says', async ({ page }) => {
    const { found, app } = await openApp(page);
    await employerAtFirstQuestion(app);
    await field(app).fill('Beispiel Bau GmbH');
    await app.getByRole('button', { name: PAUSE_LINK }).click();
    await expect.poll(() => heading(app)).toBe('Wer füllt jetzt aus?');
    await app.getByRole('button', { name: 'Weitermachen' }).click();
    await app.getByRole('button', { name: SUMMARY_LINK }).click();
    await expect(summaryValue(app, 'Firma des Arbeitgebers')).toHaveText('Beispiel Bau GmbH');
    await expectQuiet(page, found);
  });
});

test('B24: on a phone „Weiter“ stays where it is when „Vorerst überspringen“ goes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 420, height: 800 });
  const { found, app } = await openApp(page);
  await employerAtFirstQuestion(app);
  const next = app.locator('.card .nav button.primary');
  await expect(app.getByRole('button', { name: 'Vorerst überspringen' })).toBeVisible();
  const before = await next.boundingBox();
  await field(app).fill('B');
  await expect(app.getByRole('button', { name: 'Vorerst überspringen' })).toHaveCount(0);
  const after = await next.boundingBox();
  expect(after?.y).toBe(before?.y);
  await expectQuiet(page, found);
});

test('B28: a new page begins at its top, not where the last one was scrolled to', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 500 });
  const { found, app } = await openApp(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await press(app, SOFORT);
  await expect.poll(() => heading(app)).toBe('Wer füllt jetzt aus?');
  const top = await page.evaluate(
    () => document.querySelector('main.shell')?.getBoundingClientRect().top ?? -1,
  );
  expect(top).toBeGreaterThanOrEqual(-1);
  await expectQuiet(page, found);
});
