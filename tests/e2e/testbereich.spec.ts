// The test folder build (dist-test) from file://: a start link of a manual test opens its prepared
// questionnaire in the app next to the instructions (start points, Tobias 2026-11-03); opening a
// test asks whether to restart the app with its entry, the header restarts, resets and writes the
// report, and a report leaves the tests it named out of the next one (Tobias 2026-11-07). The test
// page keeps its results in the browser on purpose, so only network, console and CSP are guarded.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { guard, type Guard } from './guards';

const TEST_APP = fileURLToPath(new URL('../../dist-test/index.html', import.meta.url));

const question = (page: Page) => page.getByRole('dialog');

/** Opens a test from the overview; `answer` is the button chosen in the restart question. */
async function openCase(page: Page, id: string, answer = 'App so lassen'): Promise<Guard> {
  expect(existsSync(TEST_APP), 'dist-test/index.html (npm run build:test)').toBe(true);
  const found = await guard(page);
  await page.goto(pathToFileURL(TEST_APP).href);
  await caseButton(page, id).click();
  await expect(question(page)).toHaveAccessibleName(`App für ${id} neu starten?`);
  await question(page).getByRole('button', { name: answer, exact: true }).click();
  await expect(question(page)).toBeHidden();
  return found;
}

// The box of a test in the overview; its accessible name starts with the id.
const caseButton = (page: Page, id: string) =>
  page.locator('.test-grid').getByRole('button', { name: new RegExp(`^${id}: `) });

/** A start link inside the test text, confirmed in the page's own question. */
async function startLink(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name }).first().click();
  await expect(question(page)).toHaveAccessibleName('Vorbereiteten Fragebogen öffnen?');
  await question(page).getByRole('button', { name: 'Öffnen', exact: true }).click();
}

async function expectQuiet(page: Page, found: Guard): Promise<void> {
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
}

const heading = (page: Page) => page.locator('.test-app .card h2').first();
const header = (page: Page) => page.locator('.test-header');
const panel = (page: Page) => page.locator('.test-panel');

async function pdfText(path: string): Promise<string> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages.join('\n');
}

test('a start link opens the Sofortmeldung ready to sign', async ({ page }) => {
  const found = await openCase(page, 'MT-21');
  await startLink(page, '▶ Zum Unterschreiben öffnen');
  await expect(page.getByText(/^Vorbereitet: Sofortmeldung – alles ausgefüllt/)).toBeVisible();
  await expect(heading(page)).toContainText('Zusammenfassung');
  await expect(page.locator('.test-app').getByText('Beispiel Bau GmbH').first()).toBeVisible();
  await expectQuiet(page, found);
});

test('a start link opens the Personalfragebogen at the decisive question', async ({ page }) => {
  const found = await openCase(page, 'MT-96');
  // The case opens the same start link again for its counter-checks (small steps, 2026-11-06).
  await startLink(page, '▶ Aushilfe vorbereitet öffnen');
  await expect(heading(page)).toContainText('Wie ist die Beschäftigung vorgesehen?');
  await expectQuiet(page, found);
});

test('a Kanzlei start link opens the station with prepared inputs', async ({ page }) => {
  const found = await openCase(page, 'MT-42');
  await startLink(page, '▶ Zwei Fassungen öffnen');
  await expect(page.getByText(/^Vorbereitet: Kanzlei – zwei Fassungen/)).toBeVisible();
  await expect(page.locator('.test-app')).toContainText(
    'Für dieselbe Rolle liegen verschiedene Fassungen vor',
  );
  await expectQuiet(page, found);
});

// Tobias 2026-11-07: "beim Aufruf eines neuen Tests landet man immer ganz unten im Test" and "beim
// Aufrufen eines neuen Tests immer fragen, ob die App neu gestartet werden soll".
test('opening a test asks to restart the app with its entry and shows the test from its start', async ({
  page,
}) => {
  const found = await openCase(page, 'MT-132', 'Mit diesem Einstieg neu starten');
  await expect(page.locator('.test-case h2')).toContainText('MT-132:');
  await expect(page.locator('.test-case h2')).toBeInViewport();
  await expect(
    page.locator('.test-app').getByRole('heading', { name: 'Wer füllt jetzt aus?' }),
  ).toBeVisible();

  // Back in the overview and into the same test again: no second question.
  await panel(page).getByRole('button', { name: 'Zurück zur Testübersicht' }).first().click();
  await expect(caseButton(page, 'MT-132')).toBeInViewport();
  await caseButton(page, 'MT-132').click();
  await expect(page.locator('.test-case h2')).toContainText('MT-132:');
  await expect(question(page)).toBeHidden();

  // The next test asks again; one on the start page offers a plain restart.
  await panel(page).getByRole('button', { name: 'Zurück zur Testübersicht' }).first().click();
  await caseButton(page, 'MT-03').click();
  await expect(question(page)).toHaveAccessibleName('App für MT-03 neu starten?');
  await expect(question(page)).toContainText('Dieser Test beginnt auf der Startseite der App.');
  await question(page).getByRole('button', { name: 'App neu starten', exact: true }).click();
  await expect(page.locator('.test-app')).toContainText('Neuer Fragebogen');
  await expectQuiet(page, found);
});

// Tobias 2026-11-07: "Jeder Test startet mit seiner eigenen Umgebung" — MT-40 builds its two files
// of one questionnaire itself, from two start points with one label.
test('two start points with one label give two files of one questionnaire (MT-40)', async ({
  page,
}, testInfo) => {
  const found = await openCase(page, 'MT-40', 'Mit diesem Einstieg neu starten');
  const app = page.locator('.test-app');
  const pdf = async (name: string) => {
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      app.getByRole('button', { name: 'PDF erstellen', exact: true }).click(),
    ]);
    const path = testInfo.outputPath(name);
    await file.saveAs(path);
    return path;
  };
  const number = async () =>
    (await app.getByText(/^Fragebogen [0-9a-f]{8} · /).textContent()) ?? '';
  const first = await number();
  const handover = await pdf('weitergabe.pdf');
  await startLink(page, 'Zweite Datei: vollständig öffnen');
  await expect(app.getByText(/^Vorbereitet: Dieselbe Sofortmeldung/)).toBeVisible();
  expect(await number()).toBe(first);
  const complete = await pdf('vollstaendig.pdf');
  await app.getByRole('button', { name: 'Fragebogen schließen' }).click();
  await app.getByRole('button', { name: /^Eingänge zusammenführen/ }).click();
  await app.locator('input[type=file]').first().setInputFiles([handover, complete]);
  await expect(app).toContainText('2 Datei(en)');
  await expect(app).toContainText('Dieselbe Fassung ist mehrfach eingegangen');
  await expect(app).toContainText('Vollständig und ohne Widersprüche.');
  await expectQuiet(page, found);
});

// MT-100/101 start with the Kanzlei's master-data link instead of the link MT-99 made.
test('a link start point opens the app as the bookmark would, the next start drops it', async ({
  page,
}) => {
  const found = await openCase(page, 'MT-100', 'Mit diesem Einstieg neu starten');
  const app = page.locator('.test-app');
  await expect(app).toContainText(
    'Neuer Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ aus Ihrem Lesezeichen.',
  );
  expect(await page.evaluate(() => location.hash)).toContain('lohnsteuerAushilfe=pauschal25');
  await app.getByRole('button', { name: 'Ich bin: Arbeitgeber' }).click();
  await expect(app).toContainText('Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.');

  await panel(page).getByRole('button', { name: 'Zurück zur Testübersicht' }).first().click();
  await caseButton(page, 'MT-03').click();
  await question(page).getByRole('button', { name: 'App neu starten', exact: true }).click();
  await expect(app).toContainText('Neuer Fragebogen');
  expect(await page.evaluate(() => location.hash)).toBe('');
  await expect(app).not.toContainText('aus Ihrem Lesezeichen');
  await expectQuiet(page, found);
});

test('the header restarts the app and resets it fully, the test results stay', async ({ page }) => {
  const found = await openCase(page, 'MT-03', 'App neu starten');
  await panel(page).getByRole('radio', { name: '✓ Wie erwartet' }).click();
  const stored = await page.evaluate(() => {
    try {
      localStorage.setItem('fragebogen-fortsetzen', 'angefangen');
      return true;
    } catch {
      return false; // no storage on file:// in this engine — nothing to delete either
    }
  });

  await header(page).getByRole('button', { name: 'App neu starten' }).click();
  await expect(question(page)).toHaveAccessibleName('App neu starten?');
  await question(page).getByRole('button', { name: 'Abbrechen' }).click();
  await expect(question(page)).toBeHidden();

  await header(page).getByRole('button', { name: 'App vollständig zurücksetzen' }).click();
  await expect(question(page)).toContainText('Ihre Testergebnisse bleiben erhalten.');
  await question(page).getByRole('button', { name: 'Zurücksetzen' }).click();
  await expect(page.getByText(/^Die App ist zurückgesetzt/)).toBeVisible();
  await expect(page.locator('.test-app')).toContainText('Neuer Fragebogen');
  if (stored) {
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['fragebogen-testlauf']);
  }
  await panel(page).getByRole('button', { name: 'Zurück zur Testübersicht' }).first().click();
  await expect(caseButton(page, 'MT-03')).toHaveAccessibleName(/– wie erwartet/);
  await expectQuiet(page, found);
});

test('a report leaves the tests it named out of the next one, unless taken in again', async ({
  page,
}, testInfo) => {
  const found = await openCase(page, 'MT-03');
  await panel(page).getByRole('radio', { name: '✓ Wie erwartet' }).click();
  await panel(page).getByLabel('Kommentar – was ist aufgefallen?').fill('Dunkel gut lesbar.');

  const [first] = await Promise.all([
    page.waitForEvent('download'),
    header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click(),
  ]);
  const firstPath = testInfo.outputPath('erster.pdf');
  await first.saveAs(firstPath);
  expect(await pdfText(firstPath)).toContain('Dunkel gut lesbar.');
  await panel(page).getByRole('button', { name: 'Zurück zur Testübersicht' }).first().click();
  await expect(caseButton(page, 'MT-03')).toHaveAccessibleName(/– berichtet/);

  // The next report asks; "Nein" leaves MT-03 out, "Ja" takes it in again.
  await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
  await expect(question(page)).toHaveAccessibleName('Schon gemeldete Tests mitnehmen?');
  await expect(question(page)).toContainText('1 Test stand schon in einem früheren Testbericht');
  const [without] = await Promise.all([
    page.waitForEvent('download'),
    question(page).getByRole('button', { name: 'Nein (Bericht ohne Tests)' }).click(),
  ]);
  const withoutPath = testInfo.outputPath('ohne.pdf');
  await without.saveAs(withoutPath);
  expect(await pdfText(withoutPath)).not.toContain('MT-03');

  await header(page).getByRole('button', { name: 'Testbericht herunterladen' }).click();
  const [again] = await Promise.all([
    page.waitForEvent('download'),
    question(page).getByRole('button', { name: 'Ja, alle mitnehmen' }).click(),
  ]);
  const againPath = testInfo.outputPath('wieder.pdf');
  await again.saveAs(againPath);
  expect(await pdfText(againPath)).toContain('Dunkel gut lesbar.');
  await expectQuiet(page, found);
});
