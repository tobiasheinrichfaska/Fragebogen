// The test page of the test folder (manual test MT-85 of manual_tests/08_auslieferung.md; MT-130
// and MT-133 went with the own test page on 2026-11-15). Since 2026-11-15 it is the shared test page of Testumgebung
// (Tobias: „setze den Auftrag zum Testrahmen um“), a copy in testrahmen/: its own behaviour — clock,
// results, steps, reasons, the report's check — is tested there. Here: how the Fragebogen binds it —
// its manual tests, its start points, restart and reset of this app only, the report naming this
// app and build, the tabs on a phone, „Tester einladen“, and that the live build carries none of it.
// The test folder build is served at an https address as the hosted test folder is — Playwright
// answers it itself, nothing goes on the network.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { ACCESS_NOTICE, passAccessGate, rememberAccess, webAppFile } from '../guards';
import { parseManualTests, testEnvironment } from '../../../src/logic/manualTests';
import { APP, expectQuiet as expectQuietFile, openTestApp, TEST_APP } from '../app';

const MANUAL = fileURLToPath(new URL('../../../manual_tests/', import.meta.url));
const FILES = readdirSync(MANUAL)
  .filter((name) => /^\d\d_.*\.md$/.test(name))
  .sort()
  .map((name) => parseManualTests(readFileSync(join(MANUAL, name), 'utf8'), name));
const CASES = FILES.flatMap((file) => file.cases);

interface Point {
  id: string;
  title: string;
  link?: string;
}
const POINTS = new Map(
  readdirSync(join(MANUAL, 'startpunkte'))
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(MANUAL, 'startpunkte', name), 'utf8')) as Point)
    .map((point) => [point.id, point]),
);

/** A test that begins with a prepared questionnaire (not a bookmark link). */
const START_CASE = CASES.find((c) => {
  const env = testEnvironment(c);
  return env.kind === 'start' && POINTS.has(env.id) && POINTS.get(env.id)?.link === undefined;
});
const LINK_POINT = [...POINTS.values()].find((point) => point.link !== undefined);
const VERSION = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;

function needed<T>(value: T | undefined, what: string): T {
  expect(value, `a manual test ${what}`).toBeDefined();
  return value as T;
}

const ORIGIN = 'https://fragebogen.test';
const PAGE_URL = `${ORIGIN}/test/index.html`;
const RUN_KEY = 'testrahmen:fragebogen';
const REPORT_URL = `${ORIGIN}/_zugang/bericht`;

interface Seen {
  foreign: string[];
  errors: string[];
}

/** The test zone's answer to a report: status and text; the bodies it received are kept. */
interface ReportEndpoint {
  answers: { status: number; text: string }[];
  received: unknown[];
}

/**
 * The test folder at its https address; anything else asked for is refused and noted. With
 * `reports` the login script's report address answers as given, one answer per report.
 */
async function serve(
  context: BrowserContext,
  page: Page,
  reports?: ReportEndpoint,
  remember = true,
): Promise<Seen> {
  if (remember) await rememberAccess(context);
  const html = readFileSync(TEST_APP);
  const seen: Seen = { foreign: [], errors: [] };
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === ORIGIN && ['/test/', '/test/index.html'].includes(url.pathname)) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (reports && url.href === REPORT_URL && route.request().method() === 'POST') {
      reports.received.push(JSON.parse(route.request().postData() ?? 'null'));
      const answer = reports.answers.shift() ?? { status: 201, text: '' };
      return route.fulfill({ status: answer.status, contentType: 'text/plain', body: answer.text });
    }
    const file = webAppFile(url.href, { [`${ORIGIN}/test/`]: TEST_APP });
    if (file) return route.fulfill(file);
    seen.foreign.push(url.href);
    return route.abort();
  });
  page.on('request', (request) => {
    const url = request.url();
    if (/^(data|blob):/.test(url) || url.startsWith(`${ORIGIN}/test/`)) return;
    if (!(reports && url === REPORT_URL)) seen.foreign.push(url);
  });
  page.on('console', (message) => {
    // The test zone's refusal is an answer the page shows, not a fault of the page.
    if (message.type() === 'error' && !message.text().includes('the server responded with')) {
      seen.errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => seen.errors.push(error.message));
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations?.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  return seen;
}

const app = (page: Page) => page.locator('.tr-app');
const side = (page: Page) => page.locator('.tr-feld');
const action = (page: Page, name: string, extra = '') =>
  side(page).locator(`[data-aktion="${name}"]${extra}`);

async function open(
  context: BrowserContext,
  page: Page,
  query = '',
  reports?: ReportEndpoint,
): Promise<Seen> {
  const seen = await serve(context, page, reports);
  await page.goto(PAGE_URL + query);
  await expect(app(page).locator('main')).toBeVisible();
  return seen;
}

async function expectQuiet(page: Page, seen: Seen): Promise<void> {
  expect(seen.foreign, 'requests that left the device').toEqual([]);
  expect(seen.errors, 'console errors').toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? []), 'CSP violations').toEqual([]);
}

/** Asks the page's question (`frage`) and answers it with „ja“. */
async function confirm(page: Page, frage: 'neustart' | 'zuruecksetzen' | 'senden'): Promise<void> {
  await action(page, 'frage', `[data-frage="${frage}"]`).click();
  await action(page, 'ja').click();
  await expect(side(page).locator('.tr-frage')).toHaveCount(0);
}

const storedKeys = (page: Page) => page.evaluate(() => Object.keys(localStorage).sort());

test.describe('MT-85: the shared test page with the Fragebogen', () => {
  test('lists every manual test of manual_tests/, names this app and its version', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page);
    await expect(side(page)).toContainText(`Testbereich · Fragebogen ${VERSION}`);
    // Local tests (config/tests.local.md) come on top where the file exists.
    const listed = await action(page, 'oeffnen', '.tr-test').evaluateAll((boxes) =>
      boxes.map((box) => (box as HTMLElement).dataset.id ?? ''),
    );
    expect(listed.filter((id) => id.startsWith('MT-'))).toEqual(CASES.map((c) => c.id));
    // The binding is complete: no warning on top of the page.
    await expect(side(page).locator('.tr-kopf .tr-meldung.tr-fehler')).toHaveCount(0);
    await expectQuiet(page, seen);
  });

  test('a start link opens its prepared questionnaire after the question, results stay', async ({
    context,
    page,
  }) => {
    const testCase = needed(START_CASE, 'that begins with a prepared questionnaire');
    const env = testEnvironment(testCase);
    const point = env.kind === 'start' ? POINTS.get(env.id) : undefined;
    const seen = await open(context, page);
    await action(page, 'oeffnen', `.tr-test[data-id="${testCase.id}"]`).click();
    await action(page, 'startpunkt', `[data-id="${point?.id ?? ''}"]`)
      .first()
      .click();
    await action(page, 'ja').click();
    await expect(app(page)).toContainText(`Vorbereitet: ${point?.title ?? ''}`);
    await action(page, 'ergebnis', '[data-wert="bestanden"]').click();
    await expect(action(page, 'ergebnis', '[data-wert="bestanden"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await confirm(page, 'neustart');
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    await expect(app(page)).not.toContainText('Vorbereitet:');
    await expect(action(page, 'ergebnis', '[data-wert="bestanden"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expectQuiet(page, seen);
  });

  test('„App vollständig zurücksetzen“ removes only what this app keeps here', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page, '?startpunkt=sofortmeldung-person-ab-geburtsdatum');
    await action(page, 'oeffnen', '.tr-test').first().click();
    await action(page, 'ergebnis', '[data-wert="bestanden"]').click();
    // What the public app at the root keeps shares the address and stays (2026-11-13).
    await page.evaluate(() => {
      localStorage.setItem('fragebogen-angefangen', 'öffentliche App');
      // A remembered access notice exists only where the local config names one: set it here as
      // well, so the reset is checked without the config too (the CI has none).
      if (localStorage.getItem('fragebogen-zugang@/test/') === null) {
        localStorage.setItem('fragebogen-zugang@/test/', 'gemerkt');
      }
    });
    // The test folder's own keys: the remembered access notice and the interrupted questionnaire.
    expect(await storedKeys(page)).toEqual(
      [
        'fragebogen-angefangen',
        'fragebogen-angefangen@/test/',
        'fragebogen-zugang@/test/',
        RUN_KEY,
      ].sort(),
    );

    await confirm(page, 'zuruecksetzen');
    // The remembered access notice went with it: asked again (2026-11-13).
    await passAccessGate(app(page));
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    expect(await storedKeys(page)).toEqual(['fragebogen-angefangen', RUN_KEY].sort());
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(action(page, 'ergebnis', '[data-wert="bestanden"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expectQuiet(page, seen);
  });

  test('a link start point opens the app as the bookmark would, a restart drops it', async ({
    context,
    page,
  }) => {
    const point = needed(LINK_POINT, 'start point with a link');
    const seen = await open(context, page, `?startpunkt=${point.id}`);
    await expect(app(page)).toContainText('aus Ihrem Lesezeichen.');
    expect(await page.evaluate(() => location.search)).toBe('');
    expect(await page.evaluate(() => location.hash)).toBe(`#${point.link ?? ''}`);
    await confirm(page, 'neustart');
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(app(page)).not.toContainText('aus Ihrem Lesezeichen');
    await expectQuiet(page, seen);
  });

  // Audit 2026-11-16: every start point mounts the app afresh, and the access notice was asked again
  // each time unless „merken“ was ticked — although it is meant once per visit.
  test('asks the access notice once per visit, not again for every start point', async ({
    context,
    page,
  }) => {
    test.skip(ACCESS_NOTICE === undefined, 'needs the access notice of config/kanzlei.local.json');
    const notice = ACCESS_NOTICE ?? '';
    const testCase = needed(START_CASE, 'that begins with a prepared questionnaire');
    const env = testEnvironment(testCase);
    const point = env.kind === 'start' ? POINTS.get(env.id) : undefined;
    const seen = await serve(context, page, undefined, false);
    await page.goto(PAGE_URL);
    await expect(app(page).getByRole('checkbox', { name: notice })).toBeVisible();
    await passAccessGate(app(page));
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    await action(page, 'oeffnen', `.tr-test[data-id="${testCase.id}"]`).click();
    await action(page, 'startpunkt', `[data-id="${point?.id ?? ''}"]`)
      .first()
      .click();
    await action(page, 'ja').click();
    await expect(app(page)).toContainText(`Vorbereitet: ${point?.title ?? ''}`);
    await expect(app(page).getByRole('checkbox', { name: notice })).toHaveCount(0);
    // A full reset forgets it: asked again.
    await confirm(page, 'zuruecksetzen');
    await expect(app(page).getByRole('checkbox', { name: notice })).toBeVisible();
    await expectQuiet(page, seen);
  });

  // Audit 2026-11-15: a start point that no longer builds mounted the app afresh with the link of the
  // last test still in the address, so the app opened that link once more.
  test('a start point that no longer builds leaves no earlier link in the address', async ({
    context,
    page,
  }) => {
    const point = needed(LINK_POINT, 'start point with a link');
    const failing = needed(
      CASES.find((c) => {
        const env = testEnvironment(c);
        return env.kind === 'start' && env.id === 'sofortmeldung-vollstaendig';
      }),
      'that begins with the complete Sofortmeldung',
    );
    // A device clock before the person's birth date: that start point cannot be built.
    await page.clock.install({ time: new Date('1985-06-01T10:00:00+02:00') });
    const seen = await open(context, page, `?startpunkt=${point.id}`);
    await expect(app(page)).toContainText('aus Ihrem Lesezeichen.');
    await action(page, 'oeffnen', `.tr-test[data-id="${failing.id}"]`).click();
    await action(page, 'startpunkt', '[data-id="sofortmeldung-vollstaendig"]').first().click();
    await action(page, 'ja').click();
    await expect(app(page).locator('.test-start-problem')).toContainText('passt nicht mehr');
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(app(page)).not.toContainText('aus Ihrem Lesezeichen');
    await expectQuiet(page, seen);
  });

  test('an unknown start point in the address is named, the app starts plainly', async ({
    context,
    page,
  }) => {
    await open(context, page, '?startpunkt=gibt-es-nicht');
    await expect(app(page).locator('.test-start-problem')).toContainText(
      'Den Startpunkt „gibt-es-nicht“ gibt es nicht.',
    );
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
  });
});

// The report goes to the test zone (Tobias 2026-11-15; Testumgebung docs/testbericht.md); here the
// login script's address answers as the test needs.
test.describe('the report names this app and build', () => {
  test('sends the result with app, version and commit, the other tests as not tested', async ({
    context,
    page,
  }) => {
    const reports: ReportEndpoint = {
      answers: [{ status: 201, text: 'Bericht gespeichert.' }],
      received: [],
    };
    const seen = await open(context, page, '', reports);
    const first = needed(
      CASES.find((c) => testEnvironment(c).kind !== 'elsewhere'),
      'at all',
    );
    await action(page, 'oeffnen', `.tr-test[data-id="${first.id}"]`).click();
    await action(page, 'ergebnis', '[data-wert="bestanden"]').click();
    await confirm(page, 'senden');
    await expect(side(page).locator('.tr-kopf .tr-meldung[data-meldung]')).toContainText(
      'Bericht gespeichert.',
    );

    const [body] = reports.received as {
      app: string;
      version: string;
      stand: string;
      tests: { id: string; ergebnis: string }[];
    }[];
    expect(body?.app).toBe('fragebogen');
    expect(body?.version).toBe(VERSION);
    expect(body?.stand).toMatch(/^[0-9a-f]{7,40}$/);
    expect(body?.tests.find((t) => t.id === first.id)?.ergebnis).toBe('bestanden');
    expect(
      body?.tests.filter((t) => t.id !== first.id).map((t) => t.ergebnis),
      'the tests not opened',
    ).toEqual(CASES.filter((c) => c.id !== first.id).map(() => 'nicht getestet'));
    // Every test of manual_tests/ is in it; local tests never are.
    expect(body?.tests.map((t) => t.id).sort()).toEqual(CASES.map((c) => c.id).sort());
    await expectQuiet(page, seen);
  });
});

/** On a phone the page shows a tab at a time; a start point from the address shows the app. */
async function twoTabs(context: BrowserContext, page: Page): Promise<void> {
  const seen = await serve(context, page);
  await page.goto(PAGE_URL);
  const tab = (name: string) => page.locator('.tr-reiter').getByRole('button', { name });
  await expect(tab('Tests')).toHaveAttribute('aria-pressed', 'true');
  await expect(side(page)).toBeVisible();
  await expect(app(page)).toBeHidden();
  await tab('App').click();
  await expect(app(page).locator('main')).toBeVisible();

  await page.goto(`${PAGE_URL}?startpunkt=sofortmeldung-person-ab-geburtsdatum`);
  await expect(tab('App')).toHaveAttribute('aria-pressed', 'true');
  await expect(app(page)).toContainText('Vorbereitet:');
  await expectQuiet(page, seen);
}

test.describe('MT-85 on a phone', () => {
  const { viewport, deviceScaleFactor, userAgent } = devices['Pixel 7'];
  test.use({ viewport, deviceScaleFactor, userAgent, isMobile: true, hasTouch: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'an Android phone runs Chrome');

  test('two tabs; a start point in the address shows the app first', async ({ context, page }) => {
    await twoTabs(context, page);
  });
});

// The iPhone runs WebKit: the tabs once more there (audit 2026-11-15: only Chromium checked them).
test.describe('MT-85 on an iPhone', () => {
  const { viewport, deviceScaleFactor, userAgent } = devices['iPhone 13'];
  test.use({ viewport, deviceScaleFactor, userAgent, isMobile: true, hasTouch: true });
  test.skip(({ browserName }) => browserName !== 'webkit', 'an iPhone runs Safari');

  test('two tabs; a start point in the address shows the app first @webkit', async ({
    context,
    page,
  }) => {
    await twoTabs(context, page);
  });
});

// „Tester einladen“ (Tobias 2026-11-15, Testumgebung docs/plan.md): the test version links the login
// script's invitation page of its protected zone; a plain navigation in the same tab, which the page
// answers with „Zurück zur App“. Only the test build, and only where it is served at an https address.
// The shared test page offers the same link on top.
test.describe('„Tester einladen“ in the footer of the test version', () => {
  const invite = (page: Page) =>
    app(page).locator('footer').getByRole('link', { name: 'Tester einladen', exact: true });

  test('leads to the invitation page of the login script, in the same tab', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page);
    await expect(invite(page)).toHaveAttribute('href', '/_zugang/einladen');
    expect(await invite(page).getAttribute('target')).toBeNull();
    await expectQuiet(page, seen);
  });

  test('is not offered by a downloaded test file, where it would lead nowhere', async ({
    page,
  }) => {
    const { found, app: shown } = await openTestApp(page);
    await expect(shown).toContainText('Neuer Fragebogen');
    await expect(
      shown.locator('footer').getByRole('link', { name: 'Tester einladen' }),
    ).toHaveCount(0);
    await expectQuietFile(page, found);
  });
});

test('the live version carries neither the test page nor its invitation link', () => {
  const html = readFileSync(APP, 'utf8');
  for (const absent of ['tr-huelle', 'testrahmen:', '/_zugang/', 'Tester einladen']) {
    expect(html, absent).not.toContain(absent);
  }
});
