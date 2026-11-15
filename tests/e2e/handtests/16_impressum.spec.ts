// Impressum and Datenschutz of the Kanzlei homepage (Tobias 2026-11-15: „überall in der Fußzeile“,
// on the help pages by the build from the configuration). The addresses live in the local Kanzlei
// configuration: with them the links are tested, without them (the public repo) nothing may be
// linked — one of the two branches runs, the other is skipped with its reason. Nothing is clicked:
// the links lead to the internet, which no end-to-end test may reach.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { APP, expectQuiet, openApp, press } from '../app';
import { ACCESS_NOTICE, LEGAL_LINKS } from '../guards';

const ORIGIN = 'https://fragebogen.test';
const HELP_PAGES = ['index.html', 'steuer-id/index.html', 'versicherungsnummer/index.html'];
const built = (dir: string, file: string) =>
  readFileSync(fileURLToPath(new URL(`../../../${dir}/hilfe/${file}`, import.meta.url)), 'utf8');

/** The public build at an https address, nothing remembered; anything else is refused. */
async function serve(page: Page): Promise<void> {
  const html = readFileSync(APP);
  await page.route('**/*', (route) => {
    const url = route.request().url().split('#')[0] ?? '';
    if (url === `${ORIGIN}/`) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    return route.abort();
  });
}

async function expectLegalLinks(page: Page): Promise<void> {
  const footer = page.locator('footer');
  for (const link of LEGAL_LINKS) {
    const anchor = footer.getByRole('link', { name: link.label, exact: true });
    await expect(anchor).toHaveAttribute('href', link.href);
    await expect(anchor).toHaveAttribute('target', '_blank');
    await expect(anchor).toHaveAttribute('rel', /noopener/);
  }
}

test.describe('with the addresses of the local configuration', () => {
  test.skip(LEGAL_LINKS.length === 0, 'no Impressum or Datenschutz configured (public repo)');

  test('the access notice links them before anything of the app opens', async ({ page }) => {
    test.skip(ACCESS_NOTICE === undefined, 'no access notice configured');
    await serve(page);
    await page.goto(`${ORIGIN}/`);
    await expect(page.getByRole('heading', { name: 'Bitte bestätigen' })).toBeVisible();
    await expectLegalLinks(page);
  });

  test('every screen of the app links them in its footer', async ({ page }) => {
    const { found, app } = await openApp(page);
    await expect(app).toContainText('Neuer Fragebogen');
    await expectLegalLinks(page);
    await press(app, 'Personalfragebogen: Angaben für die Sofortmeldung');
    await expect(app).toContainText('Wer füllt jetzt aus?');
    await expectLegalLinks(page);
    await press(app, 'Ich bin: Arbeitgeber');
    await expectLegalLinks(page);
    await expectQuiet(page, found);
  });

  test('the help pages of both uploaded builds link them on every page', () => {
    for (const dir of ['dist', 'dist-test']) {
      for (const file of HELP_PAGES) {
        const html = built(dir, file);
        for (const link of LEGAL_LINKS) {
          expect(html, `${dir}/hilfe/${file}`).toContain(
            `<a href="${link.href}">${link.label}</a>`,
          );
        }
      }
    }
  });
});

test('without configured addresses nothing is linked', async ({ page }) => {
  test.skip(LEGAL_LINKS.length > 0, 'Impressum or Datenschutz configured (local Kanzlei build)');
  const { found, app } = await openApp(page);
  await expect(app).toContainText('Neuer Fragebogen');
  for (const label of ['Impressum', 'Datenschutz']) {
    await expect(page.locator('footer').getByRole('link', { name: label })).toHaveCount(0);
  }
  for (const file of HELP_PAGES) expect(built('dist', file)).not.toContain('class="legal"');
  await expectQuiet(page, found);
});
