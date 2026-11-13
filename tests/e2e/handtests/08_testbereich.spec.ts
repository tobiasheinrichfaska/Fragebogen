// Former manual tests MT-85, MT-130 and MT-133 of manual_tests/08_auslieferung.md: the test page of
// the test folder (Tobias 2026-11-08: only what a virtual browser cannot check stays a manual test).
// The test folder build is served at an https address as the hosted test folder is — Playwright
// answers it itself, nothing goes on the network — so every engine keeps the run in its storage.
// The tests it opens are chosen from manual_tests/ by their kind (a prepared start, the start page,
// elsewhere, not in the test area), so these tests keep working as manual tests come and go.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  inlineMarkdown,
  parseManualTests,
  testAreaOf,
  testEnvironment,
  textsOf,
  type ManualTestCase,
} from '../../../src/logic/manualTests';
import { pdfPages, TEST_APP } from '../app';

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

/** The test folder at its https address; anything else asked for is refused and noted. */
async function serve(context: BrowserContext, page: Page): Promise<Seen> {
  const html = readFileSync(TEST_APP);
  const seen: Seen = { foreign: [], errors: [] };
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === ORIGIN && ['/test/', '/test/index.html'].includes(url.pathname)) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    seen.foreign.push(url.href);
    return route.abort();
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!/^(data|blob):/.test(url) && !url.startsWith(`${ORIGIN}/test/`)) seen.foreign.push(url);
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

async function open(context: BrowserContext, page: Page, query = ''): Promise<Seen> {
  const seen = await serve(context, page);
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

const result = (page: Page, name: '✓ Wie erwartet' | '✗ Klappt nicht') =>
  panel(page).getByRole('radiogroup', { name: 'Ergebnis' }).getByRole('radio', { name });

/** Downloads the test report — from the header, or with `answer` from the question it asked. */
async function report(page: Page, path: string, answer?: string): Promise<string> {
  const button =
    answer === undefined
      ? header(page).getByRole('button', { name: 'Testbericht herunterladen' })
      : dialog(page).getByRole('button', { name: answer, exact: true });
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
    await expect(
      header(page).getByRole('button', { name: 'Testbericht herunterladen' }),
    ).toBeVisible();
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
      `0 von ${boxes.length} geprüft · ✓ wie erwartet 0 · ✗ klappt nicht 0 · Zeit 0 Min.`,
    );
    await expectQuiet(page, seen);
  });

  test('one test at a time: from its top, two results only, coloured boxes, kept on reload', async ({
    context,
    page,
  }) => {
    const seen = await open(context, page);
    const total = await grid(page).locator('.test-chip').count();
    await panel(page).getByLabel('Ihr Name (erscheint im Testbericht)').fill('Probe Tester');
    const testCase = needed(HOME_CASE, 'that begins on the start page');
    await openCase(page, testCase);
    await expect(grid(page)).toBeHidden();
    await expect(caseHeading(page)).toBeInViewport();
    await expect(panel(page).locator('.test-case-nav .muted')).toHaveText(/^\d+ von \d+$/);
    for (const name of ['‹ Vorheriger', 'Nächster ›']) {
      await expect(panel(page).getByRole('button', { name, exact: true })).toBeVisible();
    }

    await panel(page).getByRole('button', { name: 'Test beginnen (Zeit läuft)' }).click();
    await expect(panel(page).getByText(/^Begonnen \d\d:\d\d Uhr/)).toBeVisible();
    await expect(
      panel(page).getByRole('radiogroup', { name: 'Ergebnis' }).getByRole('radio'),
    ).toHaveText(['✓ Wie erwartet', '✗ Klappt nicht']);
    await expect(panel(page)).toContainText(
      'Hat es nur zum Teil geklappt? Bitte „Klappt nicht“ und im Kommentar, was.',
    );
    await result(page, '✗ Klappt nicht').click();
    await panel(page).getByLabel('Kommentar – was ist aufgefallen?').fill('Probe');
    await panel(page)
      .getByLabel(/^Dauer korrigieren/)
      .fill('7');
    await toOverview(page);
    const box = chip(page, testCase.id);
    await expect(box).toHaveText(`✗ ${short(testCase.id)}`);
    await expect(box).toHaveClass(/\bnichtBestanden\b/);
    await expect(box).toHaveAttribute('aria-current', 'true');
    await expect(box).toHaveAccessibleName(/– klappt nicht/);

    // The same test again asks nothing: it is the one opened last.
    await box.click();
    await expect(dialog(page)).toBeHidden();
    await result(page, '✓ Wie erwartet').click();
    await toOverview(page);
    await expect(box).toHaveText(`✓ ${short(testCase.id)}`);
    await expect(box).toHaveClass(/\bbestanden\b/);
    await expect(panel(page)).toContainText(
      new RegExp(`1 von ${total} geprüft · ✓ wie erwartet 1 · ✗ klappt nicht 0 · Zeit 7 Min\\.`),
    );

    await panel(page).getByLabel('Erledigte ausblenden').check();
    await expect(box).toHaveCount(0);
    await expect(grid(page).locator('.test-chip')).toHaveCount(total - 1);
    await panel(page).getByLabel('Erledigte ausblenden').uncheck();

    await page.reload();
    await expect(panel(page).getByLabel('Ihr Name (erscheint im Testbericht)')).toHaveValue(
      'Probe Tester',
    );
    await expect(box).toHaveText(`✓ ${short(testCase.id)}`);
    await box.click();
    await choose(page, 'App so lassen');
    await expect(panel(page).getByLabel('Kommentar – was ist aufgefallen?')).toHaveValue('Probe');
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

  test('a test changed after its rating asks for a new one; "teilweise" reads as "Klappt nicht"', async ({
    context,
    page,
  }, testInfo) => {
    const [changed, older] = offered;
    if (!changed || !older) throw new Error('two manual tests needed');
    const run = {
      tester: 'Probe Tester',
      comment: '',
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
    await expect(chip(page, older.id)).toHaveAccessibleName(/– klappt nicht/);

    await chip(page, changed.id).click();
    await choose(page, 'App so lassen');
    await expect(panel(page)).toContainText(
      'Dieser Test wurde geändert, seit Sie ihn bewertet haben. Bitte gehen Sie ihn noch einmal durch und bewerten Sie ihn neu.',
    );
    await toOverview(page);
    await chip(page, older.id).click();
    await choose(page, 'App so lassen');
    await expect(result(page, '✗ Klappt nicht')).toHaveAttribute('aria-checked', 'true');
    await expect(panel(page).getByLabel('Kommentar – was ist aufgefallen?')).toHaveValue(
      'Hälfte ging',
    );

    const text = await report(page, testInfo.outputPath('bericht.pdf'));
    expect(text).toContain('Hinweis: Der Test wurde nach diesem Ergebnis geändert.');
    expect(text).toContain('Kommentar: Hälfte ging');
    await expectQuiet(page, seen);
  });

  test('a browser that keeps nothing gets a warning', async ({ context, page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
    });
    await open(context, page);
    await panel(page).getByLabel('Ihr Name (erscheint im Testbericht)').fill('Probe');
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
    await result(page, '✓ Wie erwartet').click();
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

test.describe('MT-130: reported tests leave the next report', () => {
  test.use({ timezoneId: 'Europe/Berlin' });

  test('the first report asks nothing; then "Nein", "nur neue und geänderte" and "Ja, alle"', async ({
    context,
    page,
  }, testInfo) => {
    const [first, second, third] = offered;
    if (!first || !second || !third) throw new Error('three manual tests needed');
    const seen = await open(context, page);
    await panel(page).getByLabel('Gesamteindruck (freiwillig)').fill('Insgesamt gut.');
    const rate = async (testCase: ManualTestCase, name?: '✓ Wie erwartet' | '✗ Klappt nicht') => {
      await openCase(page, testCase);
      if (name) await result(page, name).click();
      else
        await panel(page).getByLabel('Kommentar – was ist aufgefallen?').fill('Nur ein Kommentar');
      await toOverview(page);
    };
    await rate(first, '✓ Wie erwartet');
    await rate(second, '✗ Klappt nicht');
    await rate(third);
    const heading = (c: ManualTestCase) => `${c.id} ${plain(c.title)}`;

    let text = await report(page, testInfo.outputPath('erster.pdf'));
    for (const c of [first, second, third]) expect(text).toContain(heading(c));
    expect(text).toContain('Kommentar: Nur ein Kommentar');
    for (const c of [first, second, third]) {
      await expect(chip(page, c.id)).toHaveAccessibleName(/– berichtet/);
    }
    await expect(chip(page, first.id)).toHaveClass(/\bbestanden\b/);
    await expect(chip(page, second.id)).toHaveClass(/\bnichtBestanden\b/);
    await openCase(page, first);
    await expect(panel(page).locator('.test-case')).toContainText('im Testbericht vom ');
    await toOverview(page);

    await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
    await expect(dialog(page)).toHaveAccessibleName('Schon gemeldete Tests mitnehmen?');
    await expect(dialog(page)).toContainText(
      '3 Tests standen schon in einem früheren Testbericht; 0 sind neu oder geändert.',
    );
    await expect(dialog(page).locator('button')).toHaveText([
      'Abbrechen',
      'Ja, alle mitnehmen',
      'Nein (Bericht ohne Tests)',
    ]);
    text = await report(page, testInfo.outputPath('ohne.pdf'), 'Nein (Bericht ohne Tests)');
    for (const c of [first, second, third]) expect(text).not.toContain(heading(c));
    expect(text).toContain('Testbericht Fragebogen-Test');
    expect(text).toContain('Getestet: 0');
    expect(text).toContain('Insgesamt gut.');

    await openCase(page, second);
    await panel(page).getByLabel('Kommentar – was ist aufgefallen?').fill('Jetzt mit Kommentar');
    await toOverview(page);
    await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
    await expect(dialog(page)).toContainText(
      '2 Tests standen schon in einem früheren Testbericht; 1 ist neu oder geändert.',
    );
    text = await report(page, testInfo.outputPath('geaendert.pdf'), 'Nein, nur neue und geänderte');
    expect(text).toContain(heading(second));
    expect(text).toContain('Kommentar: Jetzt mit Kommentar');
    for (const c of [first, third]) expect(text).not.toContain(heading(c));

    await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
    text = await report(page, testInfo.outputPath('alle.pdf'), 'Ja, alle mitnehmen');
    for (const c of [first, second, third]) expect(text).toContain(heading(c));
    await expectQuiet(page, seen);
  });

  test('a test begun one day and rated the next asks to correct its duration', async ({
    context,
    page,
  }, testInfo) => {
    await page.clock.install({ time: new Date('2026-11-01T14:42:00+01:00') });
    const testCase = needed(HOME_CASE, 'that begins on the start page');
    await open(context, page);
    await chip(page, testCase.id).click();
    await choose(page, 'App so lassen');
    await panel(page).getByRole('button', { name: 'Test beginnen (Zeit läuft)' }).click();
    await page.clock.setSystemTime(new Date('2026-11-02T10:00:00+01:00'));
    await result(page, '✓ Wie erwartet').click();
    await expect(panel(page)).toContainText(
      'Gemessen sind 1158 Minuten (Beginn 01.11. 14:42 Uhr). Bitte tragen Sie die Dauer ein, die der Test wirklich gebraucht hat – höchstens 600 Minuten.',
    );
    const text = await report(page, testInfo.outputPath('bericht.pdf'));
    expect(text).toContain('Beginn 01.11. 14:42 Uhr');
  });
});

/** The report on a phone: downloaded at once, or saved from the "Speichern" the page offers. */
async function phoneReport(page: Page, path: string): Promise<string> {
  const downloaded = page.waitForEvent('download');
  await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
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
  await panel(page).getByLabel('Ihr Name (erscheint im Testbericht)').fill('Probe Handy');
  await chip(page, testCase.id).tap();
  await choose(page, 'Mit diesem Einstieg neu starten');
  await expect(tab('Testanleitung')).toHaveAttribute('aria-selected', 'true');
  await panel(page).getByRole('button', { name: 'Test beginnen (Zeit läuft)' }).tap();
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
  await result(page, '✓ Wie erwartet').tap();
  const text = await phoneReport(page, path);
  expect(text).toContain('Tester: Probe Handy');
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
