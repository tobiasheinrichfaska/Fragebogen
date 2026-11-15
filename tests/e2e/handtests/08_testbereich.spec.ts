// Former manual tests MT-85, MT-130 and MT-133 of manual_tests/08_auslieferung.md: the test page of
// the test folder (Tobias 2026-11-08: only what a virtual browser cannot check stays a manual test).
// Since 2026-11-15 without free text: „Bestanden“ / „Nicht bestanden“ with the failed steps, the
// time measured by the page, the report sent to the test zone (Testumgebung docs/testbericht.md).
// The test folder build is served at an https address as the hosted test folder is — Playwright
// answers it itself, nothing goes on the network — so every engine keeps the run in its storage.
// The tests it opens are chosen from manual_tests/ by their kind (a prepared start, the start page,
// elsewhere, not in the test area), so these tests keep working as manual tests come and go.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { passAccessGate, rememberAccess, webAppFile } from '../guards';
import {
  inlineMarkdown,
  parseManualTests,
  testAreaOf,
  testEnvironment,
  stepsOf,
  textsOf,
  type ManualTestCase,
} from '../../../src/logic/manualTests';
import { APP, expectQuiet as expectQuietFile, openTestApp, pdfPages, TEST_APP } from '../app';

const MANUAL = fileURLToPath(new URL('../../../manual_tests/', import.meta.url));
const FILES = readdirSync(MANUAL)
  .filter((name) => /^\d\d_.*\.md$/.test(name))
  .sort()
  .map((name) => parseManualTests(readFileSync(join(MANUAL, name), 'utf8'), name));
// The public tests in the page's order; local tests (config/tests.local.md) come after them.
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

const plain = (text: string) =>
  inlineMarkdown(text)
    .map((token) => token.text)
    .join('');
const offered = CASES.filter((c) => testAreaOf(c).offered);
const kindOf = (c: ManualTestCase) => testEnvironment(c).kind;
const stepTokens = (c: ManualTestCase) =>
  c.parts
    .filter((part) => part.label === 'Schritte')
    .flatMap((part) => part.blocks)
    .flatMap((block) =>
      block.kind === 'list' ? block.items : block.kind === 'text' ? [block.text] : [],
    )
    .flatMap(inlineMarkdown);

/** A test that begins with a prepared questionnaire (not a bookmark link) and is not the last one. */
const START_CASE = offered.find((c, i) => {
  const env = testEnvironment(c);
  return (
    env.kind === 'start' &&
    POINTS.get(env.id)?.link === undefined &&
    POINTS.has(env.id) &&
    i < offered.length - 1 &&
    CASES[CASES.indexOf(c) + 1] !== undefined
  );
});
const HOME_CASE = offered.find((c) => kindOf(c) === 'home');
const ELSEWHERE_CASE = offered.find((c) => kindOf(c) === 'elsewhere');
const NOT_OFFERED = CASES.find((c) => !testAreaOf(c).offered);
const NOTES_CASE = offered.find((c) =>
  c.parts.some((part) =>
    part.blocks.some((block) => block.kind === 'list' && block.notes !== undefined),
  ),
);
const COPY_CASE = offered.find((c) => stepTokens(c).some((token) => token.kind === 'code'));
const KBD_CASE = offered.find((c) => stepTokens(c).some((token) => token.kind === 'kbd'));
/** A test whose text names another offered test. */
const REFERRING = offered
  .map((c) => {
    const target = c.parts
      .flatMap((part) => part.blocks.flatMap(textsOf))
      .flatMap(inlineMarkdown)
      .flatMap((token) => (token.kind === 'ref' ? [token.id] : []))
      .find((id) => id !== c.id && offered.some((o) => o.id === id));
    return target === undefined ? undefined : { from: c, to: target };
  })
  .find((pair) => pair !== undefined);
const LINK_POINT = [...POINTS.values()].find((point) => point.link !== undefined);

function needed<T>(value: T | undefined, what: string): T {
  expect(value, `a manual test ${what}`).toBeDefined();
  return value as T;
}

const ORIGIN = 'https://fragebogen.test';
const PAGE_URL = `${ORIGIN}/test/index.html`;
const RUN_KEY = 'fragebogen-testlauf';

interface Seen {
  foreign: string[];
  errors: string[];
}

/** The test zone's answer to a report: status and text; the bodies it received are kept. */
interface ReportEndpoint {
  answers: { status: number; text: string }[];
  received: unknown[];
}

const REPORT_URL = `${ORIGIN}/_zugang/bericht`;

/**
 * The test folder at its https address; anything else asked for is refused and noted. With
 * `reports` the login script's report address answers as given, one answer per report.
 */
async function serve(context: BrowserContext, page: Page, reports?: ReportEndpoint): Promise<Seen> {
  await rememberAccess(context);
  const html = readFileSync(TEST_APP);
  const seen: Seen = { foreign: [], errors: [] };
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === ORIGIN && ['/test/', '/test/index.html'].includes(url.pathname)) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (reports && url.href === REPORT_URL && route.request().method() === 'POST') {
      reports.received.push(JSON.parse(route.request().postData() ?? 'null'));
      const answer = reports.answers.shift() ?? { status: 200, text: '' };
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
    if (message.type() === 'error') seen.errors.push(message.text());
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

async function open(
  context: BrowserContext,
  page: Page,
  query = '',
  reports?: ReportEndpoint,
): Promise<Seen> {
  const seen = await serve(context, page, reports);
  await page.goto(PAGE_URL + query);
  await expect(page.locator('.test-app main')).toBeVisible();
  return seen;
}

async function expectQuiet(page: Page, seen: Seen): Promise<void> {
  expect(seen.foreign, 'requests that left the device').toEqual([]);
  expect(seen.errors, 'console errors').toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? []), 'CSP violations').toEqual([]);
}

const dialog = (page: Page) => page.getByRole('dialog');
const header = (page: Page) => page.locator('.test-header');
const panel = (page: Page) => page.locator('.test-panel');
const app = (page: Page) => page.locator('.test-app');
const grid = (page: Page) => page.locator('.test-grid');
const chip = (page: Page, id: string) =>
  grid(page).getByRole('button', { name: new RegExp(`^${id}: `) });
const caseHeading = (page: Page) => page.locator('.test-case h2');
const short = (id: string) => id.replace(/^MT-/, '');

async function choose(page: Page, name: string): Promise<void> {
  await dialog(page).getByRole('button', { name, exact: true }).click();
  await expect(dialog(page)).toBeHidden();
}

/** Opens a test from the overview; `answer` is the button chosen in the restart question. */
async function openCase(page: Page, testCase: ManualTestCase, answer = 'App so lassen') {
  await chip(page, testCase.id).click();
  await expect(dialog(page)).toHaveAccessibleName(`App für ${testCase.id} neu starten?`);
  await choose(page, answer);
  await expect(caseHeading(page)).toContainText(`${testCase.id}:`);
}

async function toOverview(page: Page): Promise<void> {
  await panel(page).getByRole('button', { name: '← Zurück zur Testübersicht' }).click();
  await expect(grid(page)).toBeVisible();
}

const result = (page: Page, name: '✓ Bestanden' | '✗ Nicht bestanden') =>
  panel(page).getByRole('radiogroup', { name: 'Ergebnis' }).getByRole('radio', { name });
/** The reason chosen for a step of a failed test. */
const stepReason = (page: Page, nr: number) =>
  panel(page)
    .locator('.test-step-reason')
    .filter({ hasText: `Schritt ${nr}:` })
    .locator('select');

/** Downloads the copy of the report from the header. */
async function copy(page: Page, path: string): Promise<string> {
  const button = header(page).getByRole('button', { name: 'Kopie als PDF' });
  const [file] = await Promise.all([page.waitForEvent('download'), button.click()]);
  await file.saveAs(path);
  return (await pdfPages(path)).join('\n');
}

const storedKeys = (page: Page) => page.evaluate(() => Object.keys(localStorage).sort());

test.describe('MT-85: the test page', () => {
  test('the overview: header, a row per area, a box per test with its title on hover', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page);
    for (const name of ['App neu starten', 'App vollständig zurücksetzen']) {
      await expect(header(page).getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(header(page).getByRole('button', { name: 'Kopie als PDF' })).toBeVisible();
    await expect(header(page).getByRole('button', { name: 'Bericht senden' })).toBeVisible();
    await expect(panel(page).getByRole('heading', { name: 'Testübersicht' })).toBeVisible();
    const areas = await grid(page).locator('.test-grid-area').allTextContents();
    expect(areas.slice(0, FILES.filter((f) => f.cases.length > 0).length)).toEqual(
      FILES.filter((f) => f.cases.length > 0).map((f) => f.area),
    );
    // One box per test, the number without "MT-", in the order of manual_tests/.
    const boxes = await grid(page).locator('.test-chip').allTextContents();
    expect(boxes.slice(0, CASES.length)).toEqual(CASES.map((c) => short(c.id)));
    const sample = needed(HOME_CASE, 'that begins on the start page');
    await expect(chip(page, sample.id)).toHaveAttribute(
      'title',
      `${sample.id}: ${plain(sample.title)}`,
    );
    await expect(panel(page)).toContainText(
      `0 von ${boxes.length} geprüft · ✓ Bestanden 0 · ✗ Nicht bestanden 0 · Zeit 0 Min.`,
    );
    await expectQuiet(page, seen);
  });

  test('one test at a time: from its top, two results, failed steps with a reason, kept on reload', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page);
    const total = await grid(page).locator('.test-chip').count();
    // No free text anywhere on the test page (Tobias 2026-11-15).
    await expect(panel(page).locator('input[type=text], textarea, input:not([type])')).toHaveCount(
      0,
    );
    const testCase = needed(HOME_CASE, 'that begins on the start page');
    await openCase(page, testCase);
    await expect(grid(page)).toBeHidden();
    await expect(caseHeading(page)).toBeInViewport();
    await expect(panel(page).locator('.test-case-nav .muted')).toHaveText(/^\d+ von \d+$/);
    for (const name of ['‹ Vorheriger', 'Nächster ›']) {
      await expect(panel(page).getByRole('button', { name, exact: true })).toBeVisible();
    }
    // The clock runs at once; there is nothing to start.
    await expect(panel(page).getByText(/^Zeit läuft: \d+ Min\./)).toBeVisible();
    await expect(panel(page).getByRole('button', { name: /Test beginnen/ })).toHaveCount(0);
    await expect(
      panel(page).getByRole('radiogroup', { name: 'Ergebnis' }).getByRole('radio'),
    ).toHaveText(['✓ Bestanden', '✗ Nicht bestanden']);

    await result(page, '✗ Nicht bestanden').click();
    await expect(
      panel(page).getByRole('group', { name: 'In welchen Schritten gab es ein Problem?' }),
    ).toBeVisible();
    await expect(panel(page)).toContainText(
      'Bitte mindestens einen Schritt mit seinem Grund wählen.',
    );
    await expect(panel(page).locator('.test-step-reason')).toHaveCount(stepsOf(testCase).length);
    await expect(stepReason(page, 1).locator('option')).toHaveText([
      'in Ordnung',
      'Anderes Ergebnis als erwartet',
      'Fehlermeldung',
      'Knopf oder Text fehlt',
      'Lädt nicht oder hängt',
      'Darstellung falsch',
    ]);
    await stepReason(page, 1).selectOption({ label: 'Fehlermeldung' });
    await expect(panel(page)).not.toContainText('Bitte mindestens einen Schritt');
    await expect(panel(page).getByText(/^Zeit: \d+ Min\.$/)).toBeVisible();
    await toOverview(page);
    const box = chip(page, testCase.id);
    await expect(box).toHaveText(`✗ ${short(testCase.id)}`);
    await expect(box).toHaveClass(/\bnichtBestanden\b/);
    await expect(box).toHaveAttribute('aria-current', 'true');
    await expect(box).toHaveAccessibleName(/– Nicht bestanden/);

    // The same test again asks nothing: it is the one opened last.
    await box.click();
    await expect(dialog(page)).toBeHidden();
    await expect(stepReason(page, 1)).toHaveValue('fehlermeldung');
    await result(page, '✓ Bestanden').click();
    await expect(panel(page).locator('.test-steps')).toHaveCount(0);
    await toOverview(page);
    await expect(box).toHaveText(`✓ ${short(testCase.id)}`);
    await expect(box).toHaveClass(/\bbestanden\b/);
    await expect(panel(page)).toContainText(
      new RegExp(`1 von ${total} geprüft · ✓ Bestanden 1 · ✗ Nicht bestanden 0 · Zeit \\d+ Min\\.`),
    );

    await panel(page).getByLabel('Erledigte ausblenden').check();
    await expect(box).toHaveCount(0);
    await expect(grid(page).locator('.test-chip')).toHaveCount(total - 1);
    await panel(page).getByLabel('Erledigte ausblenden').uncheck();

    await page.reload();
    await expect(box).toHaveText(`✓ ${short(testCase.id)}`);
    await box.click();
    await choose(page, 'App so lassen');
    await expect(result(page, '✓ Bestanden')).toHaveAttribute('aria-checked', 'true');
    await expectQuiet(page, seen);
  });

  test('a step shows what it brings right under it, in green', async ({ context, page }) => {
    const testCase = NOTES_CASE;
    test.skip(!testCase, 'no manual test has notes under its steps');
    if (!testCase) return;
    await open(context, page);
    await chip(page, testCase.id).click();
    if (testAreaOf(testCase).offered) await choose(page, 'App so lassen');
    const note = panel(page).locator('li.test-step > p.step-after').first();
    await expect(note).toHaveText(/^Danach: /);
    await expect(note.locator('xpath=preceding-sibling::p[1]')).toHaveClass(/step-do/);
    const [red, green] = (await note.evaluate((p) => getComputedStyle(p).color))
      .match(/\d+/g)
      ?.map(Number) ?? [0, 0];
    expect(green ?? 0).toBeGreaterThan(red ?? 0);
  });

  test('a value of a step is copied with ⧉, a value to type by hand has no button', async ({
    browserName,
    context,
    page,
  }) => {
    const testCase = COPY_CASE;
    test.skip(!testCase, 'no manual test has a value to copy in its steps');
    if (!testCase) return;
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    }
    await open(context, page);
    await openCase(page, testCase);
    const value = stepTokens(testCase).find((token) => token.kind === 'code')?.text ?? '';
    const copy = panel(page)
      .getByRole('button', { name: `„${value}“ kopieren` })
      .first();
    await expect(copy).toHaveText('⧉');
    await copy.click();
    if (browserName === 'chromium') {
      await expect(copy).toHaveText('✓');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
    } else {
      // Where the browser refuses the clipboard the page says to copy by hand.
      await expect(
        copy.or(panel(page).getByText('(bitte markieren und kopieren)').first()),
      ).toBeVisible();
    }

    if (KBD_CASE) {
      if (KBD_CASE.id !== testCase.id) {
        await toOverview(page);
        await chip(page, KBD_CASE.id).click();
        await choose(page, 'App so lassen');
      }
      const key = panel(page).locator('.test-case kbd').first();
      await expect(key).toHaveAttribute('title', 'Bitte selbst tippen');
      await expect(key.locator('xpath=..')).not.toHaveClass(/copy-value/);
    }
  });

  test('a test named in another one opens from there, after its own restart question', async ({
    context,
    page,
  }) => {
    const pair = REFERRING;
    test.skip(!pair, 'no manual test names another one');
    if (!pair) return;
    const seen = await open(context, page);
    await openCase(page, pair.from);
    await panel(page)
      .locator('.test-case')
      .getByRole('button', { name: pair.to, exact: true })
      .first()
      .click();
    await expect(dialog(page)).toHaveAccessibleName(`App für ${pair.to} neu starten?`);
    await choose(page, 'App so lassen');
    await expect(caseHeading(page)).toContainText(`${pair.to}:`);
    await expectQuiet(page, seen);
  });

  test('a test outside the test area asks nothing and says why', async ({ context, page }) => {
    const testCase = needed(NOT_OFFERED, 'marked "Testbereich: nein"');
    const seen = await open(context, page);
    const box = chip(page, testCase.id);
    await expect(box).toHaveClass(/\belsewhere\b/);
    expect(Number(await box.evaluate((b) => getComputedStyle(b).opacity))).toBeLessThan(1);
    await box.click();
    await expect(caseHeading(page)).toContainText(`${testCase.id}:`);
    await expect(dialog(page)).toBeHidden();
    await expect(panel(page).locator('.test-case')).toContainText('Nicht im Testbereich: ');
    await expectQuiet(page, seen);
  });

  test('a test changed after its rating asks for a new one; an older run loses its texts', async ({
    context,
    page,
  }, testInfo) => {
    const [changed, older] = offered;
    if (!changed || !older) throw new Error('two manual tests needed');
    // A run stored before 2026-11-15, with a name, comments and „teilweise“.
    const run = {
      tester: 'Probe Tester',
      comment: 'Insgesamt gut.',
      entries: {
        [changed.id]: {
          result: 'bestanden',
          comment: '',
          started: '2026-11-08T09:00:00+01:00',
          ended: '2026-11-08T09:05:00+01:00',
          version: '000000000000',
        },
        [older.id]: { result: 'teilweise', comment: 'Hälfte ging' },
      },
    };
    await page.addInitScript(
      ([key, text]) => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, text);
      },
      [RUN_KEY, JSON.stringify(run)] as const,
    );
    const seen = await open(context, page);
    await expect(chip(page, changed.id)).toHaveClass(/\bchanged\b/);
    await expect(chip(page, changed.id)).toHaveAccessibleName(/– geändert seit Ihrem Test/);
    await expect(chip(page, older.id)).toHaveText(`✗ ${short(older.id)}`);
    await expect(chip(page, older.id)).toHaveAccessibleName(/– Nicht bestanden/);

    await chip(page, changed.id).click();
    await choose(page, 'App so lassen');
    await expect(panel(page)).toContainText(
      'Dieser Test wurde geändert, seit Sie ihn bewertet haben. Bitte gehen Sie ihn noch einmal durch und bewerten Sie ihn neu.',
    );
    await toOverview(page);
    await chip(page, older.id).click();
    await choose(page, 'App so lassen');
    await expect(result(page, '✗ Nicht bestanden')).toHaveAttribute('aria-checked', 'true');
    await expect(panel(page)).toContainText(
      'Bitte mindestens einen Schritt mit seinem Grund wählen.',
    );

    const text = await copy(page, testInfo.outputPath('bericht.pdf'));
    expect(text).toContain('Hinweis: Der Test wurde nach diesem Ergebnis geändert.');
    expect(text).toContain('Ergebnis: Bestanden · Zeit 5 Min.');
    expect(text).not.toMatch(/Hälfte ging|Probe Tester|Insgesamt gut/);
    await expectQuiet(page, seen);
  });

  test('a browser that keeps nothing gets a warning', async ({ context, page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
    });
    await open(context, page);
    await openCase(page, needed(HOME_CASE, 'that begins on the start page'));
    await result(page, '✓ Bestanden').click();
    await expect(panel(page)).toContainText(
      'Dieser Browser speichert die Testergebnisse nicht (z. B. privates Fenster).',
    );
  });
});

test.describe('MT-133: opening a test restarts the app with its entry', () => {
  test('a prepared start, the same test again, the next one, the start page, elsewhere', async ({
    context,
    page,
  }) => {
    const testCase = needed(START_CASE, 'that begins with a prepared questionnaire');
    const env = testEnvironment(testCase);
    const title = env.kind === 'start' ? (POINTS.get(env.id)?.title ?? '') : '';
    const seen = await open(context, page);
    await chip(page, testCase.id).click();
    await expect(dialog(page)).toHaveAccessibleName(`App für ${testCase.id} neu starten?`);
    await expect(dialog(page)).toContainText(`Dieser Test beginnt mit „${title}“.`);
    await expect(dialog(page)).toContainText(
      'Ihre Eingaben in der App gehen verloren; die Testergebnisse bleiben erhalten.',
    );
    await expect(dialog(page).locator('button')).toHaveText([
      'App so lassen',
      'Mit diesem Einstieg neu starten',
    ]);
    await expect(dialog(page).locator('button.primary')).toHaveText(
      'Mit diesem Einstieg neu starten',
    );
    await choose(page, 'Mit diesem Einstieg neu starten');
    await expect(app(page).getByText(`Vorbereitet: ${title}.`)).toBeVisible();
    await expect(caseHeading(page)).toContainText(`${testCase.id}:`);
    await expect(caseHeading(page)).toBeInViewport();

    await toOverview(page);
    await chip(page, testCase.id).click();
    await expect(caseHeading(page)).toContainText(`${testCase.id}:`);
    await expect(dialog(page)).toBeHidden();

    const next = CASES[CASES.indexOf(testCase) + 1];
    if (!next) throw new Error('the start case has a next test');
    await panel(page).getByRole('button', { name: 'Nächster ›' }).click();
    if (testAreaOf(next).offered) {
      await expect(dialog(page)).toHaveAccessibleName(`App für ${next.id} neu starten?`);
      await choose(page, 'App so lassen');
    }
    await expect(caseHeading(page)).toContainText(`${next.id}:`);
    // Kept as it was: still the prepared questionnaire.
    await expect(app(page).getByText(`Vorbereitet: ${title}.`)).toBeVisible();

    const home = needed(HOME_CASE, 'that begins on the start page');
    await toOverview(page);
    await chip(page, home.id).click();
    await expect(dialog(page)).toContainText('Dieser Test beginnt auf der Startseite der App.');
    await expect(dialog(page).locator('button')).toHaveText(['App so lassen', 'App neu starten']);
    await choose(page, 'App neu starten');
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();

    const elsewhere = needed(ELSEWHERE_CASE, 'that begins elsewhere');
    await toOverview(page);
    await chip(page, elsewhere.id).click();
    await expect(dialog(page)).toContainText(/^.*Einstieg: /);
    await expect(dialog(page)).toContainText('Die App kann dafür bleiben, wie sie ist.');
    await expect(dialog(page).locator('button')).toHaveText([
      'App neu starten (Startseite)',
      'App so lassen',
    ]);
    await expect(dialog(page).locator('button.primary')).toHaveText('App so lassen');
    await choose(page, 'App so lassen');
    await expectQuiet(page, seen);
  });

  test('the header restarts the app and resets it fully, the test results stay', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page, '?startpunkt=sofortmeldung-person-ab-geburtsdatum');
    const question = app(page).locator('.card h2').first();
    const asked = (await question.textContent()) ?? '';
    const rated = needed(HOME_CASE, 'that begins on the start page');
    await chip(page, rated.id).click();
    await choose(page, 'App so lassen');
    await result(page, '✓ Bestanden').click();
    await toOverview(page);

    await header(page).getByRole('button', { name: 'App neu starten', exact: true }).click();
    await expect(dialog(page)).toHaveAccessibleName('App neu starten?');
    await expect(dialog(page).locator('button')).toHaveText(['Abbrechen', 'App neu starten']);
    await choose(page, 'Abbrechen');
    await expect(question).toHaveText(asked);

    await header(page).getByRole('button', { name: 'App vollständig zurücksetzen' }).click();
    await expect(dialog(page)).toHaveAccessibleName('App vollständig zurücksetzen?');
    await expect(dialog(page)).toContainText(
      'auch einen angefangenen Fragebogen zum Fortsetzen – und den Link in der Adresszeile',
    );
    await expect(dialog(page)).toContainText(
      'Ihre Testergebnisse bleiben erhalten, ebenso alles, was die öffentliche App gespeichert hat.',
    );
    await choose(page, 'Zurücksetzen');
    // The remembered access notice went with it: asked again (2026-11-13).
    await passAccessGate(app(page));
    await expect(
      page.getByText(
        'Die App ist zurückgesetzt: nichts mehr vom Testbereich in diesem Browser gespeichert, kein Link in der Adresszeile. Die Testergebnisse sind erhalten.',
      ),
    ).toBeVisible();
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    expect(await storedKeys(page)).toEqual([RUN_KEY]);
    await expect(chip(page, rated.id)).toHaveText(`✓ ${short(rated.id)}`);
    await expectQuiet(page, seen);
  });

  test('a link start point opens the app as the bookmark would, the next start drops it', async ({
    context,
    page,
  }) => {
    const point = needed(LINK_POINT, 'start point with a link');
    const seen = await open(context, page, `?startpunkt=${point.id}`);
    await expect(app(page)).toContainText('aus Ihrem Lesezeichen.');
    expect(await page.evaluate(() => location.search)).toBe('');
    expect(await page.evaluate(() => location.hash)).toBe(`#${point.link ?? ''}`);
    await header(page).getByRole('button', { name: 'App neu starten', exact: true }).click();
    await choose(page, 'App neu starten');
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(app(page)).not.toContainText('aus Ihrem Lesezeichen');
    await expectQuiet(page, seen);
  });

  test('an unknown start point in the address is named, the app starts plainly', async ({
    context,
    page,
  }) => {
    await open(context, page, '?startpunkt=gibt-es-nicht');
    await expect(page.locator('.test-banner')).toContainText(
      'Den Startpunkt „gibt-es-nicht“ gibt es nicht.',
    );
    await expect(app(page).getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
  });
});

// The report goes to the test zone (Tobias 2026-11-15; Testumgebung docs/testbericht.md). Here the
// login script's address answers as each step needs: not there yet (404), a refusal (400), arrived.
test.describe('the report goes to the test zone, without any text', () => {
  test.use({ timezoneId: 'Europe/Berlin' });

  test('a failed test needs its step; 404 and 400 are said; a sent result leaves the next report', async ({
    context,
    page,
  }, testInfo) => {
    const [first, second] = offered;
    if (!first || !second) throw new Error('two manual tests needed');
    const reports: ReportEndpoint = {
      answers: [
        { status: 404, text: '' },
        { status: 400, text: 'Unbekanntes Feld „kommentar“.' },
        { status: 200, text: '' },
      ],
      received: [],
    };
    const seen = await open(context, page, '', reports);
    const banner = page.locator('.test-banner');
    const send = async () => {
      await header(page).getByRole('button', { name: 'Bericht senden' }).click();
      await expect(dialog(page)).toHaveAccessibleName('Bericht senden?');
      await expect(dialog(page)).toContainText(
        'Gesendet werden nur die Ergebnisse, die Zeiten und die Schritte mit Problem – kein Name, kein Text.',
      );
      await choose(page, 'Senden');
    };

    await openCase(page, first);
    await result(page, '✓ Bestanden').click();
    await toOverview(page);
    await openCase(page, second);
    await result(page, '✗ Nicht bestanden').click();
    await toOverview(page);
    await header(page).getByRole('button', { name: 'Bericht senden' }).click();
    await expect(banner).toContainText(
      `Bei „Nicht bestanden“ fehlt noch der Schritt mit dem Problem: ${second.id}.`,
    );
    // The test opened last opens again without the restart question.
    await chip(page, second.id).click();
    await stepReason(page, 2).selectOption({ label: 'Lädt nicht oder hängt' });
    await toOverview(page);

    await send();
    await expect(banner).toContainText(
      'Der Testbereich nimmt noch keine Berichte an (Antwort 404).',
    );
    await expect(chip(page, first.id)).not.toHaveAccessibleName(/– gesendet/);
    await send();
    await expect(banner).toContainText(
      'Der Testbereich hat den Bericht abgelehnt: Unbekanntes Feld „kommentar“.',
    );
    await send();
    await expect(banner).toContainText('Bericht gesendet.');
    for (const c of [first, second]) {
      await expect(chip(page, c.id)).toHaveAccessibleName(/– gesendet/);
    }

    expect(reports.received).toHaveLength(3);
    const body = reports.received[2] as {
      format: string;
      app: string;
      version: string;
      stand: string;
      tests: { id: string; ergebnis: string; sekunden?: number; schritte?: unknown }[];
    };
    expect(body).toMatchObject({ format: 'testbericht/1', app: 'fragebogen' });
    expect(body.version).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    expect(body.stand).toMatch(/^[0-9a-f]{7,40}$/);
    expect(Object.keys(body).sort()).toEqual(['app', 'format', 'stand', 'tests', 'version']);
    const byId = new Map(body.tests.map((t) => [t.id, t]));
    expect(byId.get(first.id)).toEqual({
      id: first.id,
      ergebnis: 'bestanden',
      sekunden: expect.any(Number) as unknown,
    });
    expect(byId.get(second.id)).toEqual({
      id: second.id,
      ergebnis: 'nicht bestanden',
      sekunden: expect.any(Number) as unknown,
      schritte: [{ nr: 2, grund: 'haengt' }],
    });
    const untested = CASES.filter((c) => c !== first && c !== second && /^MT-/.test(c.id));
    for (const c of untested)
      expect(byId.get(c.id)).toEqual({ id: c.id, ergebnis: 'nicht getestet' });

    // Sent once is enough; a changed result goes again.
    await header(page).getByRole('button', { name: 'Bericht senden' }).click();
    await expect(banner).toContainText('Es gibt kein neues Ergebnis zu senden.');

    const text = await copy(page, testInfo.outputPath('kopie.pdf'));
    expect(text).toContain(`${second.id} ${plain(second.title)}`);
    expect(text).toContain('Schritt 2: Lädt nicht oder hängt');
    expect(text).toMatch(/Ergebnis: Bestanden · Zeit \d+ Min\. · gesendet \d\d:\d\d Uhr/);
    // A browser may log the two refusals the test zone gave on purpose (Chromium does); nothing else.
    expect(seen.errors.filter((error) => !/status of (404|400)\b/.test(error))).toEqual([]);
    seen.errors.length = 0;
    await expectQuiet(page, seen);
  });

  test('the clock runs while a test is open, pauses outside it and ends with the result', async ({
    context,
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-11-15T14:00:00+01:00') });
    const testCase = needed(HOME_CASE, 'that begins on the start page');
    await open(context, page);
    await openCase(page, testCase);
    await page.clock.setSystemTime(new Date('2026-11-15T14:05:00+01:00'));
    await toOverview(page);
    // An hour in the overview does not count.
    await page.clock.setSystemTime(new Date('2026-11-15T15:05:00+01:00'));
    await chip(page, testCase.id).click();
    await page.clock.setSystemTime(new Date('2026-11-15T15:07:00+01:00'));
    await result(page, '✓ Bestanden').click();
    await expect(panel(page).getByText('Zeit: 7 Min.', { exact: true })).toBeVisible();
    // After the result the clock stands still.
    await page.clock.setSystemTime(new Date('2026-11-15T16:00:00+01:00'));
    await toOverview(page);
    await chip(page, testCase.id).click();
    await expect(panel(page).getByText('Zeit: 7 Min.', { exact: true })).toBeVisible();
  });
});

/** The report on a phone: downloaded at once, or saved from the "Speichern" the page offers. */
async function phoneReport(page: Page, path: string): Promise<string> {
  const downloaded = page.waitForEvent('download');
  await header(page).getByRole('button', { name: 'Kopie als PDF' }).click();
  const save = page.getByRole('button', { name: 'Speichern', exact: true });
  const file = await Promise.race([
    downloaded,
    save.waitFor().then(async () => {
      const [saved] = await Promise.all([page.waitForEvent('download'), save.click()]);
      return saved;
    }),
  ]);
  await file.saveAs(path);
  return (await pdfPages(path)).join('\n');
}

async function onPhone(page: Page, context: BrowserContext, path: string): Promise<string> {
  const seen = await open(context, page, '?startpunkt=sofortmeldung-person-ab-geburtsdatum');
  const tab = (name: string) => page.getByRole('tab', { name, exact: true });
  // Opened from the address, the app shows first; an answer typed in survives the tabs.
  await expect(tab('App')).toHaveAttribute('aria-selected', 'true');
  const field = app(page).locator('.question input').first();
  await field.fill('17.05.1990');
  await tab('Testanleitung').tap();
  await expect(panel(page)).toBeVisible();
  await tab('App').tap();
  await expect(field).toHaveValue('17.05.1990');

  // A prepared start chosen in the question keeps the instructions in view, a start link in the
  // text switches to the app.
  const testCase = needed(START_CASE, 'that begins with a prepared questionnaire');
  const env = testEnvironment(testCase);
  const point = env.kind === 'start' ? env : undefined;
  await tab('Testanleitung').tap();
  await chip(page, testCase.id).tap();
  await choose(page, 'Mit diesem Einstieg neu starten');
  await expect(tab('Testanleitung')).toHaveAttribute('aria-selected', 'true');
  await panel(page)
    .getByRole('button', { name: `▶ ${point?.text ?? ''}` })
    .first()
    .tap();
  await expect(dialog(page)).toHaveAccessibleName('Vorbereiteten Fragebogen öffnen?');
  await expect(dialog(page).locator('button')).toHaveText(['Abbrechen', 'Öffnen']);
  await choose(page, 'Öffnen');
  await expect(tab('App')).toHaveAttribute('aria-selected', 'true');
  await expect(
    app(page).getByText(`Vorbereitet: ${POINTS.get(point?.id ?? '')?.title ?? ''}.`),
  ).toBeVisible();

  await tab('Testanleitung').tap();
  await result(page, '✓ Bestanden').tap();
  const text = await phoneReport(page, path);
  expect(text).toContain(`${testCase.id} ${plain(testCase.title)}`);
  await expectQuiet(page, seen);
  return text;
}

test.describe('MT-85 on an Android phone', () => {
  const { viewport, deviceScaleFactor, userAgent } = devices['Pixel 7'];
  test.use({ viewport, deviceScaleFactor, userAgent, isMobile: true, hasTouch: true });
  test.skip(({ browserName }) => browserName !== 'chromium', 'an Android phone runs Chrome');

  test('tabs keep the app, starts switch as they should, the report names the phone', async ({
    context,
    page,
  }, testInfo) => {
    const text = await onPhone(page, context, testInfo.outputPath('bericht.pdf'));
    expect(text).toMatch(/Gerät laut Browser: Android-Smartphone · /);
  });
});

test.describe('MT-85 on an iPhone', { tag: '@webkit' }, () => {
  const { viewport, deviceScaleFactor, userAgent } = devices['iPhone 13'];
  test.use({ viewport, deviceScaleFactor, userAgent, isMobile: true, hasTouch: true });
  test.skip(({ browserName }) => browserName !== 'webkit', 'an iPhone runs Safari (WebKit)');

  test('tabs keep the app, starts switch as they should, the report names the phone', async ({
    context,
    page,
  }, testInfo) => {
    const text = await onPhone(page, context, testInfo.outputPath('bericht.pdf'));
    expect(text).toMatch(/Gerät laut Browser: iPhone · /);
  });
});

// „Tester einladen“ (Tobias 2026-11-15, Testumgebung docs/plan.md): the test version links the login
// script's invitation page of its protected zone; a plain navigation in the same tab, which the page
// answers with „Zurück zur App“. Only the test build, and only where it is served at an https address.
test.describe('„Tester einladen“ in the footer of the test version', () => {
  const invite = (page: Page) =>
    page.locator('.test-app footer').getByRole('link', { name: 'Tester einladen', exact: true });

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
    const { found, app } = await openTestApp(page);
    await expect(app).toContainText('Neuer Fragebogen');
    await expect(invite(page)).toHaveCount(0);
    await expectQuietFile(page, found);
  });

  test('never reaches the live version', () => {
    const html = readFileSync(APP, 'utf8');
    expect(html).not.toContain('/_zugang/einladen');
    expect(html).not.toContain('Tester einladen');
  });
});
