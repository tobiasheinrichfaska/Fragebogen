import { expect, test } from '@playwright/test';
import { official } from '../support/fixtures';
import { openApp, sideEffects, upload } from './helpers';

test('shows every Pflichtangabe of a complete invoice with its values', async ({ page }) => {
  const problems = await openApp(page);
  await upload(page, 'cen-beispiel-2.xml', official('cen/CII_example2.xml'), 'application/xml');

  await expect(
    page.getByRole('heading', { name: 'Pflichtangaben nach § 14 Abs. 4 UStG' }),
  ).toBeVisible();
  await expect(page.getByTestId('pflicht-summary')).toHaveText(
    'Alle Pflichtfelder belegt. Bitte prüfen Sie die Werte.',
  );
  const number = page.getByTestId('pflicht-rechnungsnummer');
  await expect(number.getByTestId('status')).toHaveText('vorhanden');
  await expect(number).toContainText('§ 14 Abs. 4 Satz 1 Nr. 4 UStG');

  // positions open on demand
  const positions = page.getByTestId('pflicht-menge-art').locator('details');
  await expect(positions.locator('ol')).toBeHidden();
  await positions.locator('summary').click();
  await expect(positions.locator('ol li').first()).toBeVisible();

  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});

test('names what is missing, with the missing parts', async ({ page }) => {
  const problems = await openApp(page);
  // KoSIT test file: seller and buyer address without street, tax representative without address
  await upload(
    page,
    '01.14a.xml',
    official('kosit/paare/01.14a-INVOICE_ubl.xml'),
    'application/xml',
  );

  await expect(page.getByTestId('pflicht-summary')).toContainText(
    'Es fehlt: Anschrift des leistenden Unternehmers',
  );
  const address = page.getByTestId('pflicht-anschrift-leistender');
  await expect(address.getByTestId('status')).toHaveText('fehlt');
  await expect(address).toContainText('Es fehlt: Straße oder Postfach.');
  await expect(page.getByRole('heading', { name: /Angaben in besonderen Fällen/ })).toBeVisible();
  await expect(page.getByTestId('pflicht-fiskalvertreter').getByTestId('status')).toHaveText(
    'fehlt',
  );

  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});

test('applies the reduced list of a Kleinbetragsrechnung', async ({ page }) => {
  const problems = await openApp(page);
  await upload(
    page,
    '01.02a.xml',
    official('kosit/paare/01.02a-INVOICE_ubl.xml'),
    'application/xml',
  );

  await expect(page.locator('.pflicht .mode')).toContainText('§ 33 UStDV');
  await expect(page.getByTestId('pflicht-summe').getByTestId('status')).toHaveText('vorhanden');

  expect(problems).toEqual([]);
  expect(await sideEffects(page)).toEqual([]);
});
