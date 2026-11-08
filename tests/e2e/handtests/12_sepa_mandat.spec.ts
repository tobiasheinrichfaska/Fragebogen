// Former manual tests of manual_tests/12_sepa_mandat.md (SEPA-Mandat 1.1.0), played in the test build;
// the links passed on to another device are opened at an https address in a fresh browser context,
// as in flow.spec.ts (Tobias 2026-11-08: only what a virtual browser cannot check stays manual).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import {
  APP,
  download,
  expectQuiet,
  heading,
  openApp,
  openTestApp,
  pdfPages,
  press,
  TEST_APP,
} from '../app';
import { expectClean, guard } from '../guards';

const KANZLEI = 'Kanzlei (Zahlungsempfänger)';
const KANZLEI_PART = `Angaben: ${KANZLEI} (abgeschlossen, nur lesen)`;
const OWNER_ART =
  'Ist die Kontoinhaberin oder der Kontoinhaber identisch mit „Erika Musterfrau“ oder abweichend?';
const IBAN = 'DE89 3704 0044 0532 0130 00';

/** Waits until the step is `text`; `seen` collects the steps for later checks. */
async function at(app: Locator, text: string, seen: string[] = []): Promise<string[]> {
  await expect.poll(() => heading(app)).toBe(text);
  seen.push(text);
  return seen;
}

/** Types `value` into the question (empty leaves it empty) and goes on with "Weiter". */
async function type(app: Locator, value: string): Promise<void> {
  const before = await heading(app);
  await input(app).fill(value);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** A button that moves on (a choice, "Weiter", a quick answer). */
async function next(app: Locator, label = 'Weiter'): Promise<void> {
  const before = await heading(app);
  await press(app, label);
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** Back until the step is `text`. */
async function backTo(app: Locator, text: string): Promise<void> {
  for (let i = 0; i < 10 && (await heading(app)) !== text; i++) {
    const before = await heading(app);
    await press(app, 'Zurück');
    await expect.poll(() => heading(app)).not.toBe(before);
  }
  await at(app, text);
}

const input = (app: Locator) => app.locator('.question input, .question textarea').first();
const note = (app: Locator) => app.locator('.question .link-note');
const chosen = (app: Locator) => app.locator('.question .choices [aria-checked=true]');
const summaryRow = (app: Locator, label: string) =>
  app.locator('.summary-row').filter({ has: app.page().getByText(label, { exact: true }) });
/** A row of the own part in the summary (the closed parts of others below have the same labels). */
const ownRow = (app: Locator, label: string) =>
  summaryRow(app.locator('.summary-section:not(.other-role)'), label);
const sectionRow = (app: Locator, section: string, label: string) =>
  summaryRow(
    app
      .locator('.summary-section:not(.other-role)')
      .filter({ has: app.page().getByRole('heading', { name: section, exact: true }) }),
    label,
  );
const role = (app: Locator, label: string) =>
  app.locator('li.role').filter({ has: app.page().getByText(label, { exact: true }) });

/** Chooses the account holder and confirms the mandate text and the privacy notice. */
async function asAccountHolder(app: Locator, seen: string[] = []): Promise<string[]> {
  await press(app, 'Ich bin: Kontoinhaberin oder Kontoinhaber');
  await at(app, 'SEPA-Basislastschriftmandat', seen);
  await app.locator('label.confirm input').check();
  await next(app);
  await at(app, 'Datenschutz', seen);
  await app.locator('label.confirm input').check();
  await next(app);
  return seen;
}

/** Address in Germany, bank and IBAN, from "Liegt die Anschrift im Ausland?" on. */
async function germanAddressAndAccount(app: Locator, seen: string[]): Promise<void> {
  await at(app, 'Liegt die Anschrift im Ausland?', seen);
  await next(app, 'Nein');
  await at(app, 'Straße und Hausnummer', seen);
  await type(app, 'Musterstraße 5');
  await at(app, 'Postleitzahl', seen);
  await type(app, '12345');
  await at(app, 'Ort', seen);
  await type(app, 'Musterstadt');
  await at(app, 'Bei welcher Bank ist das Konto?', seen);
  await type(app, 'Beispielbank');
  await at(app, 'Von welchem Konto soll abgebucht werden?', seen);
  await type(app, IBAN);
}

/** Confirms, types the name and signs; ends on the done screen. */
async function signTyped(app: Locator, name: string): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill(name);
  await press(app, 'Unterschreiben und abschließen');
}

/** Writes the PDF from the overview, closes and reads it in at the Kanzlei station. */
async function readInAtKanzlei(page: Page, app: Locator, path: string): Promise<void> {
  const pdf = await download(page, app, 'PDF erstellen', path);
  await press(app, 'Fragebogen schließen');
  await expect(app).toContainText('Neuer Fragebogen');
  await press(app, 'Eingänge zusammenführen');
  await app.locator('input[type=file]').first().setInputFiles(pdf.path);
  await expect(app).toContainText('Prüfhinweise:');
}

/** "Kopieren" says "Link kopiert." — checked in Chromium, the only engine that grants the clipboard. */
async function copy(
  context: BrowserContext,
  scope: Locator,
  browserName: string,
): Promise<string | undefined> {
  if (browserName !== 'chromium') return undefined;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await scope.getByRole('button', { name: 'Kopieren' }).click();
  await expect(scope).toContainText('Link kopiert.');
  return scope.page().evaluate(() => navigator.clipboard.readText());
}

const ORIGIN = 'https://fragebogen.test';

/**
 * A build at an https address, served by Playwright itself (anything else is refused), with the
 * guards of console and CSP: a link to pass on needs an address another device can open. `to` is
 * a path or a whole link; a link must be the first address, as a hash change alone does not load it.
 */
async function openHosted(
  page: Page,
  build: string,
  to = '/',
): Promise<{ app: Locator; quiet: () => Promise<void> }> {
  const html = readFileSync(build);
  const found = await guard(page);
  const foreign: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url().split('#')[0]?.split('?')[0] ?? '';
    if (url === `${ORIGIN}/`) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (!/^(data|blob):/.test(url)) foreign.push(url);
    return route.abort();
  });
  await page.goto(to.startsWith(ORIGIN) ? to : `${ORIGIN}${to}`);
  const app = page.locator(build === TEST_APP ? '.test-app' : '#root');
  await expect(app.locator('main')).toBeVisible();
  return {
    app,
    quiet: async () => {
      expect(foreign).toEqual([]);
      expect(found.external.filter((url) => !url.startsWith(`${ORIGIN}/`))).toEqual([]);
      expect(found.errors).toEqual([]);
      expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
    },
  };
}

test('MT-119: the Kanzlei makes a master-data link for the mandate', async ({
  page,
  context,
  browserName,
}) => {
  const { found } = await openApp(page);
  await press(page.locator('main'), 'Stammdaten-Link erstellen oder ändern');
  const form = page.locator('.master-link-form');
  await expect(form.locator('.summary-section h3')).toHaveText(['Ihr Link']);
  await form.locator('#master-opens').selectOption('sepa-mandat');
  // Only the mandate's data; the client number and the reference belong to one client only.
  await expect(form.locator('.summary-section h3')).toHaveText([
    'Zahlungsempfänger',
    'Vertrag und Mandatsreferenz',
    'Ihr Link',
  ]);
  await expect(form.locator('#master-firma')).toHaveCount(0);
  await expect(form.locator('#master-betriebsnummer')).toHaveCount(0);
  const questions = await form.locator('.master-question').allTextContents();
  expect(questions.filter((q) => /Mandantennummer|Mandatsreferenz/.test(q))).toEqual([]);
  expect(questions).toContain(
    'Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige?',
  );

  await form.locator('#master-glaeubigerName').fill('Musterkanzlei Beispiel');
  await form.locator('#master-glaeubigerStrasse').fill('Beispielweg 1');
  await form.locator('#master-glaeubigerPlzOrt').fill('12345 Musterstadt');
  await form.locator('#master-glaeubigerLand').fill('Deutschland');
  const link = form.getByLabel('Stammdaten-Link');
  await expect(link).toHaveValue(/#stammdaten=1&formular=sepa-mandat&/);

  await form.locator('#master-glaeubigerId').fill('DE97ZZZ09999999999');
  await expect(
    form
      .locator('.master-entry')
      .filter({ has: page.locator('#master-glaeubigerId') })
      .getByRole('alert'),
  ).toBeVisible();
  await expect(form).toContainText('Bitte erst die markierten Angaben berichtigen.');
  await expect(link).toHaveCount(0);
  // Small letters and spaces are fine; the link keeps the number as written in the register.
  await form.locator('#master-glaeubigerId').fill('de98 zzz 0999 9999 999');
  await expect(form).not.toContainText('Bitte erst die markierten Angaben berichtigen.');
  await expect(link).toHaveValue(/glaeubigerId=DE98ZZZ09999999999/);
  const url = await link.inputValue();
  expect(url).toContain('formular=sepa-mandat');
  expect(url).not.toMatch(/mandantennummer|mandatsreferenz/i);
  const copied = await copy(context, form.locator('.summary-section').last(), browserName);
  if (copied !== undefined) expect(copied).toBe(url);

  // Opened like a bookmark; only the fragment, never the configured app address.
  await page.goto(pathToFileURL(APP).href + url.slice(url.indexOf('#')));
  await page.reload();
  const main = page.locator('main');
  await expect(main).toContainText(
    'Neuer Fragebogen „SEPA-Basislastschriftmandat“ aus Ihrem Lesezeichen',
  );
  await expect(main).not.toContainText('Der Link enthält eine unbekannte oder ungültige Angabe.');
  await expect(role(main, KANZLEI)).toContainText('nichts vorbelegt (freiwillig)');
  await expect(role(main, KANZLEI)).not.toContainText('noch offen');

  await press(main, `Ich bin: ${KANZLEI}`);
  await at(main, 'Name des Zahlungsempfängers');
  await expect(input(main)).toHaveValue('Musterkanzlei Beispiel');
  await expect(note(main)).toHaveText('Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.');
  for (const [question, value] of [
    ['Straße und Hausnummer des Zahlungsempfängers', 'Beispielweg 1'],
    ['Postleitzahl und Ort des Zahlungsempfängers', '12345 Musterstadt'],
    ['Land des Zahlungsempfängers', 'Deutschland'],
    ['Gläubiger-Identifikationsnummer', 'DE98ZZZ09999999999'],
  ] as const) {
    await next(main);
    await at(main, question);
    await expect(input(main)).toHaveValue(value);
    await expect(note(main)).toHaveText('Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.');
  }
  await next(main);
  await at(main, 'Mandantennummer');
  await expect(input(main)).toHaveValue('');
  await expectClean(page, found);
});

test('MT-120: the Kanzlei prepares the mandate and closes without a signature', async ({
  page,
}) => {
  const { app, quiet } = await openHosted(
    page,
    TEST_APP,
    '/?startpunkt=sepa-kanzlei-vertrag-offen',
  );
  await at(app, 'Mandantennummer');
  await type(app, '10001');
  await at(app, 'Wer hat zu zahlen?');
  await type(app, 'Erika Musterfrau');
  await at(app, OWNER_ART);
  await expect(chosen(app)).toHaveText([
    'identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber',
  ]);
  await next(app);
  await at(app, 'Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige?');
  await expect(chosen(app)).toHaveText(['wiederkehrende Zahlungen']);
  await next(app);
  await at(app, 'Mandatsreferenz');
  await expect(input(app)).toHaveValue('100010000001');
  await expect(note(app)).toHaveText('Vorschlag aus Ihren Angaben – Sie können ihn ändern.');
  await next(app, 'Wird separat mitgeteilt');
  await at(app, 'Welche Angaben zum Konto tragen Sie schon ein?');
  await expect(app.locator('.question input[type=checkbox]:checked')).toHaveCount(0);
  await next(app);
  await at(app, 'Zusammenfassung');
  for (const label of ['Name des Kreditinstituts', 'IBAN', 'Straße und Hausnummer']) {
    await expect(summaryRow(app, label)).toHaveCount(0);
  }
  await expect(summaryRow(app, 'Mandatsreferenz').locator('dd').first()).toHaveText('–');

  // An answer left empty on purpose is not proposed again.
  await press(app, 'Zurück');
  await at(app, 'Welche Angaben zum Konto tragen Sie schon ein?');
  await press(app, 'Zurück');
  await at(app, 'Mandatsreferenz');
  await expect(input(app)).toHaveValue('');
  await next(app);
  await next(app);
  await at(app, 'Zusammenfassung');
  const masterData = app
    .locator('.summary-section')
    .filter({ has: page.getByRole('heading', { name: 'Stammdaten für das nächste Mal' }) });
  await expect(masterData.locator('p').first()).toHaveText(
    /Der Link enthält nur Angaben aus dem Teil „Kanzlei \(Zahlungsempfänger\)“\.$/,
  );
  await expect(masterData.locator('p').first()).not.toContainText('Mandantennummer');
  await expect(masterData.locator('p').first()).not.toContainText('Mandatsreferenz');
  const nextTime = await masterData.getByLabel('Stammdaten-Link').inputValue();
  expect(nextTime).not.toMatch(/mandantennummer|mandatsreferenz|10001/i);

  await press(app, 'Weiter zum Abschluss');
  await expect(app.getByRole('group', { name: 'Was Sie abschließen' })).toContainText(
    'Das schließen Sie ab:',
  );
  // The payee does not sign a mandate.
  await expect(app.locator('canvas.signature-pad')).toHaveCount(0);
  await expect(app.getByRole('radiogroup', { name: 'Art des Abschlusses' })).toHaveCount(0);
  await expect(app.getByRole('button', { name: 'Unterschreiben und abschließen' })).toHaveCount(0);
  await app.locator('label.confirm input').check();
  await press(app, 'Abschließen');
  await expect(app.getByRole('heading', { name: 'Als Link weitergeben' })).toBeVisible();
  await expect(app.getByLabel('Link zur Weitergabe')).toHaveValue(/#weitergabe=1&/);
  await expect(app.getByRole('button', { name: 'Kopieren' })).toBeVisible();
  await quiet();
});

test('MT-121: the account holder gives the mandate', async ({ page }, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  // Hosted: the overview offers the link to pass on only at an address another device can open.
  const { app, quiet } = await openHosted(
    page,
    TEST_APP,
    '/?startpunkt=sepa-kanzlei-abgeschlossen',
  );
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  const kanzlei = role(app, KANZLEI);
  await expect(kanzlei.locator('.state')).toHaveText('vorbelegt (Fassung 1)');
  await expect(kanzlei.getByRole('button', { name: 'Abschluss zurücknehmen' })).toBeVisible();
  await expect(kanzlei.getByRole('button', { name: 'Unterschrift zurücknehmen' })).toHaveCount(0);
  const stand = app.locator('.card').filter({ has: page.getByRole('heading', { name: 'Stand' }) });
  await expect(stand).toContainText(
    'Kann an die nächste Station weitergegeben werden. Bis der Fragebogen vollständig ist, fehlt noch:',
  );
  await expect(stand).not.toContainText('Für die Lohnabrechnung');
  await expect(stand.getByRole('button', { name: 'PDF erstellen' })).toBeEnabled();
  await expect(stand.getByRole('button', { name: 'Fragebogen schließen' })).toBeVisible();
  await expect(stand.getByRole('heading', { name: 'Als Link weitergeben' })).toBeVisible();
  const top = async (locator: Locator) => (await locator.boundingBox())?.y ?? 0;
  expect(await top(stand)).toBeGreaterThan(await top(app.locator('ul.roles')));

  const seen = await asAccountHolder(app);
  await at(app, OWNER_ART, seen);
  await expect(note(app)).toHaveText(`Vorbelegt von ${KANZLEI} – bitte prüfen.`);
  await expect(chosen(app)).toHaveText([
    'identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber',
  ]);
  await next(app);
  await at(app, 'Gehört das Konto noch einer weiteren Person?', seen);
  await expect(chosen(app)).toHaveText(['Nein']);
  await next(app, 'Nein');
  await at(app, 'Liegt die Anschrift im Ausland?', seen);
  await next(app, 'Nein');
  await at(app, 'Straße und Hausnummer', seen);
  await type(app, 'Musterstraße 5');
  await at(app, 'Postleitzahl', seen);
  await input(app).fill('1234');
  await press(app, 'Weiter');
  await expect(app.locator('.question .field-error')).toContainText('5');
  await at(app, 'Postleitzahl');
  await type(app, '12345');
  await at(app, 'Ort', seen);
  await type(app, 'Musterstadt');
  await at(app, 'Bei welcher Bank ist das Konto?', seen);
  await type(app, 'Beispielbank');
  await at(app, 'Von welchem Konto soll abgebucht werden?', seen);
  await type(app, IBAN);
  await at(app, 'Wer unterschreibt das Mandat?', seen);
  await expect(input(app)).toHaveValue('Erika Musterfrau');
  await expect(note(app)).toHaveText('Vorschlag aus Ihren Angaben – Sie können ihn ändern.');
  await next(app);
  await at(app, 'Wo unterschreiben Sie?', seen);
  await expect(input(app)).toHaveValue('Musterstadt');
  await expect(note(app)).toHaveText('Vorschlag aus Ihren Angaben – Sie können ihn ändern.');
  await next(app);
  await at(app, 'Datum der Unterschrift', seen);
  await expect(input(app)).toHaveValue('07.11.2026');
  await expect(note(app)).toHaveText('Vorschlag aus Ihren Angaben – Sie können ihn ändern.');
  await next(app);
  await at(app, 'Zusammenfassung', seen);
  // What the Kanzlei set is neither asked nor changeable here; no BIC for a German IBAN.
  for (const question of [
    'An wen erteilen Sie das Mandat?',
    'Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers?',
    'Wer hat zu zahlen?',
    'Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige?',
    'Wie lautet die BIC der Bank?',
  ]) {
    expect(seen).not.toContain(question);
  }
  const mandat = app
    .locator('.summary-section')
    .filter({ has: page.getByRole('heading', { name: 'Mandat', exact: true }) });
  for (const [label, value] of [
    ['Zahlungsempfänger', 'Musterkanzlei Beispiel'],
    ['Gläubiger-Identifikationsnummer', 'DE98ZZZ09999999999'],
    ['Zahlungspflichtig (Vertrag mit)', 'Erika Musterfrau'],
    ['Zahlungsart', 'wiederkehrende Zahlungen'],
  ] as const) {
    const row = summaryRow(mandat, label);
    await expect(row.locator('dd').first()).toHaveText(value);
    await expect(row).toContainText(`festgelegt von: ${KANZLEI}`);
    await expect(row.getByRole('button', { name: 'ändern' })).toHaveCount(0);
  }
  const owner = summaryRow(mandat, 'Kontoinhaber');
  await expect(owner.locator('dd').first()).toContainText('identisch');
  await expect(owner.getByRole('button', { name: 'ändern' })).toBeVisible();
  await expect(owner).toContainText(`(vorbelegt von: ${KANZLEI})`);
  const kanzleiPart = app.locator('.summary-section.other-role');
  await expect(kanzleiPart.locator('h3')).toHaveText(KANZLEI_PART);
  await expect(summaryRow(kanzleiPart, 'Mandatsreferenz')).toContainText('100010000001');

  await press(app, 'Weiter zum Abschluss');
  const overview = app.getByRole('group', { name: 'Was Sie abschließen' });
  await expect(overview).toContainText('Das schließen Sie ab:');
  await expect(overview).toContainText('Musterstraße 5');
  await expect(overview).toContainText(KANZLEI_PART);
  const confirmation = app.locator('label.confirm');
  await expect(confirmation).toHaveText(
    'Ich erteile das SEPA-Basislastschriftmandat mit den Angaben oben.',
  );
  expect(await top(overview)).toBeLessThan(await top(confirmation));
  await confirmation.locator('input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText('Kontoinhaberin oder Kontoinhaber: abgeschlossen');
  await expect(app).toContainText('Unterschrieben am');

  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('mandat.pdf'));
  const text = (await pdfPages(pdf.path)).join('\n');
  // Both parts, and the account holder's name at her signature.
  expect(text).toMatch(/Mandatsreferenz\s+100010000001/);
  expect(text).toMatch(/IBAN\s+DE89 3704 0044 0532 0130 00/);
  expect(text).toMatch(/\[1\] Kanzlei \(Zahlungsempfänger\) – Fassung 1 – abgeschlossen am/);
  expect(text).toMatch(
    /\[2\] Kontoinhaberin oder Kontoinhaber – Fassung 1 – unterschrieben am [^–]+– Erika Musterfrau/,
  );
  await quiet();
});

test('MT-122: joint account — the second holder signs too', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sepa-gemeinschaftskonto');
  const second = 'Zweite Kontoinhaberin oder zweiter Kontoinhaber';
  await expect(role(app, second)).toContainText('Erforderlich, weil');
  await expect(role(app, second)).not.toHaveClass(/muted/);
  await press(app, `Ich bin: ${second}`);
  const seen = await at(app, 'SEPA-Basislastschriftmandat');
  await app.locator('label.confirm input').check();
  await next(app);
  await at(app, 'Datenschutz', seen);
  await app.locator('label.confirm input').check();
  await next(app);
  await at(app, 'Wie heißen Sie?', seen);
  await expect(input(app)).toHaveValue('Max Mustermann');
  await expect(note(app)).toHaveText(
    'Vorbelegt von Kontoinhaberin oder Kontoinhaber – bitte prüfen.',
  );
  await next(app);
  await at(app, 'Zusammenfassung', seen);
  expect(seen).toHaveLength(4);

  await press(app, 'Weiter zum Abschluss');
  // Everything "die Angaben oben" refers to stands above the confirmation (2026-11-06).
  const overview = app.getByRole('group', { name: 'Was Sie abschließen' });
  await expect(overview).toContainText('Max Mustermann');
  await expect(overview).toContainText(KANZLEI_PART);
  await expect(overview).toContainText(
    'Angaben: Kontoinhaberin oder Kontoinhaber (abgeschlossen, nur lesen)',
  );
  await expect(overview).toContainText('Beispielbank');
  await expect(overview).toContainText(IBAN);
  const confirmation = app.locator('label.confirm');
  expect((await overview.boundingBox())?.y ?? 1).toBeLessThan(
    (await confirmation.boundingBox())?.y ?? 0,
  );
  await confirmation.locator('input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Max Mustermann');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText(`${second}: abgeschlossen`);
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await expect(app).toContainText(
    'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.',
  );
  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('gemeinsam.pdf'));
  expect((await pdfPages(pdf.path)).join('\n')).toMatch(
    /\[3\] Zweite Kontoinhaberin oder zweiter Kontoinhaber – Fassung 1 – unterschrieben am [^–]+– Max Mustermann/,
  );
  await expectQuiet(page, found);
});

test('MT-123: without the Kanzlei part', async ({ page }) => {
  const { found } = await openApp(page);
  const main = page.locator('main');
  await press(main, 'SEPA-Basislastschriftmandat');
  await expect(role(main, KANZLEI)).toContainText('nichts vorbelegt (freiwillig)');
  const stand = main.locator('.card').filter({ has: page.getByRole('heading', { name: 'Stand' }) });
  await expect(stand).not.toContainText(KANZLEI);

  // Without the Kanzlei part the mandate asks for payee, creditor id, contract and payment itself.
  await asAccountHolder(main);
  await at(main, 'An wen erteilen Sie das Mandat?');
  await next(main, 'Vorerst überspringen');
  await at(main, 'Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers?');
  await input(main).fill('DE97ZZZ09999999999');
  await press(main, 'Weiter');
  await expect(main.locator('.question .field-error')).toContainText('Prüfziffer');
  await at(main, 'Wie lautet die Gläubiger-Identifikationsnummer des Zahlungsempfängers?');
  await press(main, 'Zur Zusammenfassung – alle Angaben ansehen und ändern');
  await at(main, 'Zusammenfassung');
  const missing = main.getByRole('group', { name: 'Fehlende Pflichtangaben' });
  await expect(missing).toContainText('Das fehlt noch, bevor Sie abschließen können:');
  const payee = missing.locator('li').filter({ hasText: /^Zahlungsempfänger/ });
  await expect(payee.getByRole('button', { name: 'beantworten' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Weiter zum Abschluss' })).toBeDisabled();
  await expectClean(page, found);
});

test('MT-124: the Kanzlei part passes on as a link instead of a PDF', async ({
  page,
  context,
  browser,
  browserName,
}) => {
  const { app, quiet } = await openHosted(
    page,
    TEST_APP,
    '/?startpunkt=sepa-kanzlei-abgeschlossen',
  );
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  const field = app.getByLabel('Link zur Weitergabe');
  await expect(field).toHaveValue(/^https:\/\/fragebogen\.test\/#weitergabe=1&/);
  const link = await field.inputValue();
  expect(link.length).toBeGreaterThan(1000);
  const copied = await copy(
    context,
    app.locator('.summary-section').filter({ has: page.getByLabel('Link zur Weitergabe') }),
    browserName,
  );
  if (copied !== undefined) expect(copied).toBe(link);

  // Another device: a fresh browser with the public app at the same address.
  const other = await browser.newContext();
  const device = await other.newPage();
  const there = await openHosted(device, APP, link);
  const main = device.locator('main');
  await expect(main).toContainText(
    'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.',
  );
  await expect(main).toContainText('Aus einem Link zur Weitergabe geöffnet.');
  // Straight into the account holder's part, at the mandate text; the answers leave the address.
  await at(main, 'SEPA-Basislastschriftmandat');
  await expect(device.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toHaveCount(0);
  expect(device.url()).toBe(`${ORIGIN}/`);
  await main.locator('label.confirm input').check();
  await next(main);
  await at(main, 'Datenschutz');
  await main.locator('label.confirm input').check();
  await next(main);
  await at(main, OWNER_ART);
  await expect(chosen(main)).toHaveText([
    'identisch – wer zu zahlen hat, ist selbst Kontoinhaberin oder Kontoinhaber',
  ]);
  await next(main);
  await at(main, 'Gehört das Konto noch einer weiteren Person?');
  await next(main, 'Nein');
  await germanAddressAndAccount(main, []);
  await at(main, 'Wer unterschreibt das Mandat?');
  await expect(input(main)).toHaveValue('Erika Musterfrau');
  await next(main);
  await next(main);
  await next(main);
  await at(main, 'Zusammenfassung');
  await expect(main.locator('.summary-section.other-role h3')).toHaveText(KANZLEI_PART);
  await expect(main).toContainText(IBAN);

  // Cut off when copied: nothing is taken over halfway (a hash change alone would not reload).
  await device.goto('about:blank');
  await device.goto(link.slice(0, -20));
  await expect(device.locator('main')).toContainText(
    'Link zur Weitergabe: Der Link ist unvollständig oder beschädigt – vielleicht wurde er beim Kopieren abgeschnitten.',
  );
  await expect(device.getByRole('heading', { name: 'Zusammenfassung' })).toHaveCount(0);
  await expect(device.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toHaveCount(0);
  await there.quiet();
  await other.close();

  // A questionnaire with many answers offers no link.
  await page.goto(`${ORIGIN}/?startpunkt=sofortmeldung-vollstaendig`);
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  await expect(app).toContainText(
    'Für einen Link sind es zu viele Angaben. Bitte die PDF weitergeben.',
  );
  await expect(app.getByLabel('Link zur Weitergabe')).toHaveCount(0);
  await quiet();
});

test('MT-125: the Kanzlei enters the account details', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sepa-kanzlei-vertrag-offen');
  await at(app, 'Mandantennummer');
  await type(app, '10001');
  await at(app, 'Wer hat zu zahlen?');
  await type(app, 'Erika Musterfrau');
  await at(app, OWNER_ART);
  await next(app);
  await next(app);
  await at(app, 'Mandatsreferenz');
  await next(app);
  const kontoVorab = 'Welche Angaben zum Konto tragen Sie schon ein?';
  await at(app, kontoVorab);
  await expect(app.locator('.question input[type=checkbox]:checked')).toHaveCount(0);
  await next(app);
  // Without a cross the app asks nothing about the account.
  await at(app, 'Zusammenfassung');
  for (const label of ['Name des Kreditinstituts', 'IBAN', 'Straße und Hausnummer']) {
    await expect(summaryRow(app, label)).toHaveCount(0);
  }

  await press(app, 'Zurück');
  await at(app, kontoVorab);
  await app.getByLabel('Bankverbindung (Bank, IBAN, BIC)').check();
  await next(app);
  const seen = await at(app, 'Name des Kreditinstituts');
  await type(app, 'Beispielbank');
  await at(app, 'IBAN', seen);
  await type(app, IBAN);
  await at(app, 'Zusammenfassung', seen);
  await expect(summaryRow(app, 'Name des Kreditinstituts').locator('dd').first()).toHaveText(
    'Beispielbank',
  );
  await expect(summaryRow(app, 'IBAN').locator('dd').first()).toHaveText(IBAN);

  await summaryRow(app, 'Von der Kanzlei eingetragen')
    .getByRole('button', { name: 'ändern' })
    .click();
  await at(app, kontoVorab);
  await app.getByLabel(/^Anschrift der Kontoinhaberin oder des Kontoinhabers/).check();
  await next(app);
  // With "identisch" the name is the one at "Wer hat zu zahlen?": not asked.
  await at(app, 'Liegt die Anschrift der Kontoinhaberin oder des Kontoinhabers im Ausland?', seen);
  await next(app, 'Nein');
  await at(app, 'Straße und Hausnummer', seen);
  await type(app, 'Musterstraße 5');
  await at(app, 'Postleitzahl', seen);
  await type(app, '12345');
  await at(app, 'Ort', seen);
  await input(app).fill('Musterstadt');
  await next(app, 'Zurück zur Zusammenfassung');
  await at(app, 'Zusammenfassung', seen);
  expect(seen).not.toContain('Name der Kontoinhaberin oder des Kontoinhabers');
  for (const [label, value] of [
    ['Straße und Hausnummer', 'Musterstraße 5'],
    ['Postleitzahl', '12345'],
    ['Ort', 'Musterstadt'],
    ['Name des Kreditinstituts', 'Beispielbank'],
    ['IBAN', IBAN],
  ] as const) {
    await expect(summaryRow(app, label).locator('dd').first()).toHaveText(value);
  }
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Abschließen');
  await expect(app).toContainText(`${KANZLEI}: abgeschlossen`);
  await expectQuiet(page, found);
});

test('MT-126: an address abroad', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sepa-kanzlei-abgeschlossen');
  await asAccountHolder(app);
  await at(app, OWNER_ART);
  await next(app);
  await next(app, 'Nein');
  await at(app, 'Liegt die Anschrift im Ausland?');
  await next(app, 'Nein');
  await at(app, 'Straße und Hausnummer');
  await type(app, 'Musterstraße 5');
  await at(app, 'Postleitzahl');
  await type(app, '12345');
  await at(app, 'Ort');

  await backTo(app, 'Liegt die Anschrift im Ausland?');
  await next(app, 'Ja');
  const state = 'In welchem Staat liegt die Anschrift?';
  await at(app, state);
  const pickState = async (typed: string, name: string) => {
    await app.getByRole('combobox').fill(typed);
    await app
      .getByRole('option')
      .filter({ hasText: new RegExp(`^${name}`) })
      .first()
      .click();
    if ((await heading(app)) === state) await next(app);
  };
  await pickState('Öster', 'Österreich');
  await at(app, 'Straße und Hausnummer');
  await next(app);
  // Austria has postcodes: required, no "Keine Postleitzahl" (2026-11-06).
  await at(app, 'Postleitzahl (Ausland)');
  await expect(app.locator('.question h2')).not.toContainText('(freiwillig)');
  await expect(app.getByRole('button', { name: 'Keine Postleitzahl' })).toHaveCount(0);
  await expect(input(app)).toHaveValue('');
  await expect(app.getByRole('button', { name: 'Weiter', exact: true })).toBeDisabled();
  // A postcode of an unusual format is taken with a hint only.
  await type(app, '123');
  await at(app, 'Ort');
  await expect(
    app.locator('.banner').filter({
      hasText: 'Die Postleitzahl hat nicht das übliche Format dieses Staats. Bitte prüfen.',
    }),
  ).toBeVisible();

  await backTo(app, state);
  await pickState('Hongkong', 'Hongkong');
  await at(app, 'Straße und Hausnummer');
  await next(app);
  await at(app, 'Postleitzahl (Ausland)');
  await expect(app.locator('.question h2')).toContainText('(freiwillig)');
  await input(app).fill('');
  await next(app, 'Keine Postleitzahl');
  await at(app, 'Ort');
  await type(app, 'Hongkong');
  await at(app, 'Bei welcher Bank ist das Konto?');
  await type(app, 'Beispielbank');
  await at(app, 'Von welchem Konto soll abgebucht werden?');
  await type(app, IBAN);
  await at(app, 'Wer unterschreibt das Mandat?');
  await next(app);
  await at(app, 'Wo unterschreiben Sie?');
  await expect(input(app)).toHaveValue('Hongkong');
  await next(app);
  await next(app);
  await at(app, 'Zusammenfassung');
  const discarded = app.locator('.banner').filter({ hasText: 'Verworfene Angaben' });
  await expect(discarded).toContainText(
    'Verworfene Angaben: Ihre Voraussetzung gilt nicht mehr, deshalb fallen sie beim Unterschreiben weg. Ändern Sie die Antwort zurück, sind sie wieder da:',
  );
  await expect(discarded.locator('li')).toContainText([/^Postleitzahl \(/]);
  await expectQuiet(page, found);
});

test('MT-127: an account holder other than the payer', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sepa-kanzlei-vertrag-offen');
  await at(app, 'Mandantennummer');
  await type(app, '10001');
  await at(app, 'Wer hat zu zahlen?');
  await type(app, 'Beispiel GmbH');
  const art =
    'Ist die Kontoinhaberin oder der Kontoinhaber identisch mit „Beispiel GmbH“ oder abweichend?';
  const seen = await at(app, art);
  await next(app, 'abweichend – das Konto gehört einer anderen Person');
  await at(app, 'Gilt das Mandat für wiederkehrende Zahlungen oder für eine einmalige?', seen);
  await next(app);
  await at(app, 'Mandatsreferenz', seen);
  await next(app);
  await at(app, 'Welche Angaben zum Konto tragen Sie schon ein?', seen);
  await next(app);
  // The holder enters the name themself (like the form "vom Kontoinhaber abweichender Schuldner").
  await at(app, 'Zusammenfassung', seen);
  expect(seen).not.toContain('Name der Kontoinhaberin oder des Kontoinhabers');
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Abschließen');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();

  await asAccountHolder(app);
  await at(app, art);
  await expect(chosen(app)).toHaveText(['abweichend – das Konto gehört einer anderen Person']);
  await next(app);
  await at(app, 'Wie heißt die Kontoinhaberin oder der Kontoinhaber?');
  await type(app, 'Erika Musterfrau');
  await at(app, 'An welche E-Mail-Adresse soll die Kanzlei die Abbuchungen vorher ankündigen?');
  await expect(app.getByRole('button', { name: 'Lieber per Post' })).toBeVisible();
  await type(app, 'erika@example.org');
  await at(app, 'Gehört das Konto noch einer weiteren Person?');
  await next(app, 'Nein');
  await germanAddressAndAccount(app, []);
  await at(app, 'Wer unterschreibt das Mandat?');
  await expect(input(app)).toHaveValue('Erika Musterfrau');
  await next(app);
  await next(app);
  await next(app);
  await at(app, 'Zusammenfassung');
  await signTyped(app, 'Erika Musterfrau');
  await expect(app).toContainText('Kontoinhaberin oder Kontoinhaber: abgeschlossen');
  await expect(app).toContainText('Unterschrieben am');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await readInAtKanzlei(page, app, testInfo.outputPath('abweichend.pdf'));
  await expect(app).toContainText(
    'Abweichender Kontoinhaber: Die Vorabankündigung jeder Lastschrift geht an den Kontoinhaber',
  );
  await expect(app).toContainText('Vollständig und ohne Widersprüche.');
  await expectQuiet(page, found);
});

test('MT-128: two account holders, each alone — one signature with a name', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sepa-kanzlei-abgeschlossen');
  await asAccountHolder(app);
  await at(app, OWNER_ART);
  await next(app);
  await at(app, 'Gehört das Konto noch einer weiteren Person?');
  await next(app, 'Ja');
  await at(app, 'Wie heißt die weitere Person, der das Konto gehört?');
  await type(app, 'Max Mustermann');
  await at(app, 'Darf jede Person allein über das Konto verfügen oder nur beide gemeinsam?');
  await next(app, 'jede Person allein – eine Unterschrift genügt');
  await germanAddressAndAccount(app, []);
  await at(app, 'Wer unterschreibt das Mandat?');
  await expect(input(app)).toHaveValue('Erika Musterfrau');
  await expect(note(app)).toHaveText('Vorschlag aus Ihren Angaben – Sie können ihn ändern.');
  await type(app, 'Max Mustermann');
  await at(app, 'Wo unterschreiben Sie?');
  await next(app);
  await next(app);
  await at(app, 'Zusammenfassung');
  await expect(ownRow(app, 'Name der unterschreibenden Person').locator('dd').first()).toHaveText(
    'Max Mustermann',
  );
  await signTyped(app, 'Max Mustermann');
  await expect(app).toContainText('Kontoinhaberin oder Kontoinhaber: abgeschlossen');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  const holder = role(app, 'Kontoinhaberin oder Kontoinhaber');
  await expect(holder.locator('.state')).toHaveText('unterschrieben (Fassung 1)');
  const second = role(app, 'Zweite Kontoinhaberin oder zweiter Kontoinhaber');
  await expect(second).toHaveClass(/muted/);
  await expect(second).toContainText('Nicht erforderlich nach den Angaben im Fragebogen.');
  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('allein.pdf'));
  expect((await pdfPages(pdf.path)).join('\n')).toMatch(
    /\[2\] Kontoinhaberin oder Kontoinhaber – Fassung 1 – unterschrieben am [^–]+– Max Mustermann/,
  );

  // Signed again with the other holder's name: valid, but the names no longer match.
  await holder.getByRole('button', { name: 'Unterschrift zurücknehmen' }).click();
  for (let i = 0; i < 20 && (await heading(app)) !== 'Zusammenfassung'; i++) await next(app);
  await signTyped(app, 'Erika Musterfrau');
  await expect(app).toContainText('Kontoinhaberin oder Kontoinhaber: abgeschlossen');
  await expect(app).toContainText(
    'Der getippte Name weicht vom angegebenen Namen ab. Bitte prüfen.',
  );
  await expectQuiet(page, found);
});

test('MT-129: the account holder changes the IBAN the Kanzlei prefilled', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sepa-kanzlei-konto-vorbelegt');
  const prefilled = `Vorbelegt von ${KANZLEI} – bitte prüfen.`;
  await asAccountHolder(app);
  await at(app, OWNER_ART);
  await next(app);
  await next(app, 'Nein');
  await at(app, 'Liegt die Anschrift im Ausland?');
  await expect(chosen(app)).toHaveText(['Nein']);
  await expect(note(app)).toHaveText(prefilled);
  await next(app, 'Nein');
  // Every prefilled account detail is asked, so the holder can change it.
  await at(app, 'Straße und Hausnummer');
  await expect(input(app)).toHaveValue('Musterstraße 5');
  await expect(note(app)).toHaveText(prefilled);
  for (const question of ['Postleitzahl', 'Ort', 'Bei welcher Bank ist das Konto?']) {
    await next(app);
    await at(app, question);
  }
  await next(app);
  await at(app, 'Von welchem Konto soll abgebucht werden?');
  await expect(input(app)).toHaveValue('DE89370400440532013000');
  await expect(note(app)).toHaveText(prefilled);
  await type(app, 'DE02 1203 0000 0000 2020 51');
  await at(app, 'Wer unterschreibt das Mandat?');
  await next(app);
  await next(app);
  await next(app);
  await at(app, 'Zusammenfassung');
  for (const [section, label] of [
    ['Anschrift', 'Liegt die Anschrift im Ausland?'],
    ['Anschrift', 'Straße und Hausnummer'],
    ['Anschrift', 'Postleitzahl'],
    ['Anschrift', 'Ort'],
    ['Bankverbindung', 'Name des Kreditinstituts'],
  ] as const) {
    await expect(sectionRow(app, section, label)).toContainText(
      `ändern (vorbelegt von: ${KANZLEI})`,
    );
  }
  const iban = sectionRow(app, 'Bankverbindung', 'IBAN');
  await expect(iban.locator('dd').first()).toHaveText('DE02 1203 0000 0000 2020 51');
  await expect(iban.getByRole('button', { name: 'ändern' })).toBeVisible();
  await expect(iban).not.toContainText('vorbelegt von');

  await signTyped(app, 'Erika Musterfrau');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await expect(app.getByRole('button', { name: 'PDF erstellen' })).toBeEnabled();
  await readInAtKanzlei(page, app, testInfo.outputPath('iban.pdf'));
  await expect(app).toContainText(
    '„IBAN“ geändert: Kanzlei (Zahlungsempfänger) hatte „DE89 3704 0044 0532 0130 00“ vorbelegt, im Teil „Kontoinhaberin oder Kontoinhaber“ steht jetzt „DE02 1203 0000 0000 2020 51“.',
  );
  await expect(app).toContainText('Vollständig und ohne Widersprüche.');
  await expectQuiet(page, found);
});

test('MT-131: the Kanzlei part passes on as a link with a password', async ({
  page,
  context,
  browser,
  browserName,
}) => {
  const { app, quiet } = await openHosted(
    page,
    TEST_APP,
    '/?startpunkt=sepa-kanzlei-abgeschlossen',
  );
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  await app.getByLabel('Mit Kennwort schützen (PDF und Link)').check();
  const password = app.getByLabel('Kennwort', { exact: true });
  await expect(password).toHaveValue(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  const protection = app.locator('.password-option');
  await expect(protection.getByRole('button', { name: 'Kopieren' })).toBeVisible();
  await expect(protection).toContainText('auf einem anderen Weg');
  const field = app.getByLabel('Link zur Weitergabe');
  await expect(field).toHaveValue(/#weitergabe=2&pruef=[0-9a-f]{16}&daten=[A-Za-z0-9_-]+$/);
  const first = { password: await password.inputValue(), link: await field.inputValue() };

  await press(app, 'Neues Kennwort');
  await expect(password).not.toHaveValue(first.password);
  await expect(field).not.toHaveValue(first.link);
  await expect(field).toHaveValue(/#weitergabe=2&/);
  const written = await password.inputValue();
  const link = await field.inputValue();
  const copied = await copy(
    context,
    app.locator('.summary-section').filter({ has: page.getByLabel('Link zur Weitergabe') }),
    browserName,
  );
  if (copied !== undefined) expect(copied).toBe(link);

  const other = await browser.newContext();
  const device = await other.newPage();
  const there = await openHosted(device, APP, link);
  await expect(device.getByRole('heading', { name: 'Geschützter Link' })).toBeVisible();
  const typed = device.getByLabel('Kennwort', { exact: true });
  await expect(typed).toBeVisible();
  await expect(device.getByRole('button', { name: 'Öffnen' })).toBeVisible();
  await expect(device.getByRole('button', { name: 'Ohne diesen Link weiter' })).toBeVisible();
  await expect(device.locator('main')).not.toContainText('Musterkanzlei Beispiel');
  await typed.pressSequentially('falsch-falsch');
  await press(device.locator('main'), 'Öffnen');
  await expect(device.getByRole('alert')).toHaveText(
    'Das Kennwort passt nicht zu diesem Link. Bitte prüfen Sie es und geben Sie es noch einmal ein.',
  );
  // Capitals, spaces and hyphens do not matter.
  await typed.fill('');
  await typed.pressSequentially(written.replace(/-/g, '').toUpperCase());
  await press(device.locator('main'), 'Öffnen');
  const main = device.locator('main');
  await expect(main).toContainText(
    'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.',
  );
  await expect(main).toContainText('Aus einem geschützten Link zur Weitergabe geöffnet.');
  await at(main, 'SEPA-Basislastschriftmandat');
  expect(device.url()).toBe(`${ORIGIN}/`);

  await device.goto('about:blank');
  await device.goto(link);
  await press(device.locator('main'), 'Ohne diesen Link weiter');
  await expect(device.locator('main')).toContainText('Neuer Fragebogen');
  await expect(device.getByRole('heading', { name: 'Geschützter Link' })).toHaveCount(0);
  expect(device.url()).toBe(`${ORIGIN}/`);
  await there.quiet();
  await other.close();

  // The app does not keep the password: back in the overview the box is off again, and a new
  // protected link gets a new password. (Left by closing the Kanzlei part once more: starting the
  // account holder's part would leave a draft, and a draft cannot be passed on at all.)
  await role(app, KANZLEI).getByRole('button', { name: 'Abschluss zurücknehmen' }).click();
  for (let i = 0; i < 20 && (await heading(app)) !== 'Zusammenfassung'; i++) await next(app);
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Abschließen');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  const box = app.getByLabel('Mit Kennwort schützen (PDF und Link)');
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(password).toHaveValue(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  expect([first.password, written]).not.toContain(await password.inputValue());
  await quiet();
});
