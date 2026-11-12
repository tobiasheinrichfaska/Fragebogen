// Former manual tests of manual_tests/01_start.md (Tobias 2026-11-08: only what a virtual browser
// cannot check stays a manual test): the start page of the downloaded file, no request that leaves
// the device — offline too — and the dark palette's contrast. The double click in the file manager
// and the impression on a real screen stay manual.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { compareVersions } from '../../../src/logic/formRegistry';
import { answerUntil, expectQuiet, formFields, heading, openApp, openTestApp, press } from '../app';
import { expectClean } from '../guards';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** Title and version of the newest published version of every form in forms/. */
function publishedNewest(): { title: string; version: string }[] {
  return readdirSync(join(ROOT, 'forms'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folder = join(ROOT, 'forms', entry.name);
      const newest = readdirSync(folder)
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.slice(0, -'.json'.length))
        .sort(compareVersions)
        .at(-1);
      const { title } = JSON.parse(readFileSync(join(folder, `${newest}.json`), 'utf8')) as {
        title: string;
      };
      return { title, version: newest ?? '' };
    });
}

/** Titles of the forms that exist only as drafts: the public build must not offer them. */
function draftOnlyTitles(): string[] {
  const published = new Set(readdirSync(join(ROOT, 'forms')));
  return readdirSync(join(ROOT, 'form-drafts'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !published.has(entry.name))
    .flatMap((entry) => {
      const folder = join(ROOT, 'form-drafts', entry.name);
      return readdirSync(folder)
        .filter((file) => file.endsWith('.json'))
        .map(
          (file) =>
            (JSON.parse(readFileSync(join(folder, file), 'utf8')) as { title: string }).title,
        );
    });
}

test('MT-01: the downloaded file opens on the start page with the published forms only', async ({
  page,
}) => {
  const { found, app } = await openApp(page);
  expect(page.url()).toMatch(/^file:\/\/\//);
  await expect(app.locator('h1')).toHaveText('Fragebogen');
  for (const card of [
    'Neuer Fragebogen',
    'Weiterbearbeiten oder prüfen',
    'Ihre Daten bleiben auf diesem Gerät',
  ]) {
    await expect(app.locator('.card h2', { hasText: card })).toBeVisible();
  }
  // Every published form is offered in its newest version; a production version (from 1.0.0, e.g.
  // the Personalfragebogen since 2026-11-12) without a test or draft mark.
  const published = publishedNewest();
  expect(published.map((form) => form.title)).toContain(
    'Personalfragebogen: Angaben für die Lohnabrechnung',
  );
  for (const { title, version } of published) {
    const item = app.locator('.form-list li').filter({
      has: page.getByRole('button', { name: title, exact: true }),
    });
    await expect(item, title).toHaveCount(1);
    const shown = (await item.locator('.muted').textContent()) ?? '';
    expect(shown, title).toContain(`Version ${version}`);
    if (!version.startsWith('0.')) expect(shown, title).not.toMatch(/Testfassung|Entwurf/);
  }

  const drafts = draftOnlyTitles();
  expect(drafts.length).toBeGreaterThan(0);
  for (const title of drafts) {
    await expect(app.getByRole('button', { name: title, exact: true }), title).toHaveCount(0);
  }
  await expect(app.locator('footer')).toHaveText(
    /^Fragebogen \d+\.\d+\.\d+( · .+)? · läuft vollständig auf diesem Gerät$/,
  );
  await expectClean(page, found);
});

const ANSWERS: Readonly<Record<string, string>> = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agBranche: 'bau',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agPersonalnummer: '',
  agBeschaeftigungsbeginn: '02.11.2026',
};

test('MT-02: only the page itself loads, and filling in goes on offline', async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const { found, app } = await openApp(page);
  const self = (url: string) => url.split('#')[0] === page.url().split('#')[0];
  const local = (url: string) => /^(data|blob):/.test(url);
  expect(requests.filter((url) => !self(url) && !local(url))).toEqual([]);
  // `data:,` keeps the browser from fetching a symbol from the internet.
  await expect(page.locator('link[rel~="icon"]')).toHaveAttribute('href', 'data:,');

  const loaded = requests.length;
  await press(app, 'Personalfragebogen: Angaben für die Sofortmeldung');
  await press(app, 'Ich bin: Arbeitgeber');
  const fields = formFields('sofortmeldung', false);
  await answerUntil(app, fields, ANSWERS, 'agVorname');
  expect(requests.slice(loaded).filter((url) => !local(url))).toEqual([]);

  await context.setOffline(true);
  await answerUntil(app, fields, ANSWERS);
  expect(await heading(app)).toBe('Zusammenfassung');
  await expect(app).toContainText('Beispiel Bau GmbH');
  expect(requests.slice(loaded).filter((url) => !local(url))).toEqual([]);
  await expectClean(page, found);
});

test('MT-02: the test build loads nothing from outside either', async ({ page }) => {
  const { found, app } = await openTestApp(page);
  await expect(app).toContainText('Neuer Fragebogen');
  await expectQuiet(page, found);
});

interface Contrast {
  background: number;
  text: number;
  checked: number;
  low: string[];
}

/**
 * Luminance of the page's background and text, and every visible text whose contrast to its
 * effective background is below WCAG AA (4.5:1, large text 3:1). Disabled controls are exempt.
 */
async function contrast(page: Page): Promise<Contrast> {
  return page.evaluate(() => {
    type Rgba = [number, number, number, number];
    const parse = (value: string): Rgba => {
      const parts =
        /rgba?\(([^)]*)\)/
          .exec(value)?.[1]
          ?.split(/[\s,/]+/)
          .filter(Boolean) ?? [];
      const [r = 0, g = 0, b = 0, a = 1] = parts.map(Number);
      return [r, g, b, parts.length > 3 ? a : 1];
    };
    const over = (top: Rgba, below: Rgba): Rgba => {
      const a = top[3];
      return [
        top[0] * a + below[0] * (1 - a),
        top[1] * a + below[1] * (1 - a),
        top[2] * a + below[2] * (1 - a),
        1,
      ];
    };
    const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (c: Rgba) =>
      0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
    const backgroundOf = (element: Element): Rgba => {
      const chain: Rgba[] = [];
      for (let at: Element | null = element; at; at = at.parentElement) {
        chain.push(parse(getComputedStyle(at).backgroundColor));
      }
      return chain.reverse().reduce<Rgba>((below, top) => over(top, below), [255, 255, 255, 1]);
    };
    const opacityOf = (element: Element) => {
      let product = 1;
      for (let at: Element | null = element; at; at = at.parentElement) {
        product *= Number(getComputedStyle(at).opacity);
      }
      return product;
    };
    const low: string[] = [];
    let checked = 0;
    const check = (element: Element, text: string) => {
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible' || element.getClientRects().length === 0) return;
      if (element.closest('[disabled], :disabled')) return;
      checked++;
      const background = backgroundOf(element);
      const color = parse(style.color);
      const foreground = over(
        [color[0], color[1], color[2], color[3] * opacityOf(element)],
        background,
      );
      const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      const ratio = ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5)) {
        const name = `${element.tagName.toLowerCase()}${
          typeof element.className === 'string' && element.className
            ? `.${element.className.trim().split(/\s+/).join('.')}`
            : ''
        }`;
        low.push(`${name} „${text.slice(0, 40)}“ ${ratio.toFixed(2)}`);
      }
    };
    for (const element of document.body.querySelectorAll('*')) {
      if (['SCRIPT', 'STYLE', 'OPTION'].includes(element.tagName)) continue;
      if (element.closest('svg')) continue;
      const own = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
      if (own !== '') check(element, own);
      if (element instanceof HTMLInputElement && element.type === 'text' && element.value !== '') {
        check(element, element.value);
      }
    }
    const body = getComputedStyle(document.body);
    return {
      background: luminance(parse(body.backgroundColor)),
      text: luminance(parse(body.color)),
      checked,
      low,
    };
  });
}

async function expectDark(page: Page, where: string): Promise<void> {
  // The measure itself must find a grey text on grey, or an empty result would prove nothing.
  await page.evaluate(() => {
    const probe = document.createElement('p');
    probe.id = 'contrast-probe';
    probe.textContent = 'Probe';
    probe.style.cssText = 'color:#555;background:#444';
    document.body.append(probe);
  });
  const probed = await contrast(page);
  await page.evaluate(() => document.getElementById('contrast-probe')?.remove());
  expect(probed.low.filter((line) => line.includes('„Probe“'))).toHaveLength(1);

  const found = await contrast(page);
  expect(found.checked, `${where}: texts checked`).toBeGreaterThan(5);
  expect(found.background, `${where}: background`).toBeLessThan(0.2);
  expect(found.text, `${where}: text`).toBeGreaterThan(0.5);
  expect(found.low, `${where}: texts below WCAG AA`).toEqual([]);
}

test('MT-03: the dark palette keeps every text readable in the app', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const { found, app } = await openApp(page);
  await expectDark(page, 'start page');
  await press(app, 'Personalfragebogen: Angaben für die Sofortmeldung');
  await expectDark(page, 'roles');
  await press(app, 'Ich bin: Arbeitgeber');
  await expectDark(page, 'interview');
  const fields = formFields('sofortmeldung', false);
  await answerUntil(app, fields, { ...ANSWERS, agBetriebsnummer: '' }, 'agBeschaeftigungsbeginn');
  await app.locator('.question input').first().fill('31.02.2026');
  await press(app, 'Weiter');
  await expect(app.getByRole('alert')).toBeVisible();
  await expectDark(page, 'date with an error');
  await app.locator('.question input').first().fill('02.11.2026');
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  await expectDark(page, 'summary');
  await press(app, 'Unterbrechen');
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await expect(app.locator('.card h2').first()).toBeVisible();
  await expectDark(page, 'Kanzlei');
  await expectClean(page, found);
});

const caseBox = (page: Page, id: string): Locator =>
  page.locator('.test-grid').getByRole('button', { name: new RegExp(`^${id}: `) });

test('MT-03: the dark palette keeps the test page readable too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const { found } = await openTestApp(page);
  await expectDark(page, 'test overview');
  await caseBox(page, 'MT-03').click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'App so lassen', exact: true })
    .click();
  await expect(page.locator('.test-case h2')).toContainText('MT-03:');
  await expectDark(page, 'test text');
  await expectQuiet(page, found);
});
