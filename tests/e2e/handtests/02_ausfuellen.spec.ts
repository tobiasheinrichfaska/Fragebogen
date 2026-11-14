// Former manual tests of manual_tests/02_ausfuellen.md (Tobias 2026-11-08: only what a virtual
// browser cannot check stays a manual test): choosing the role, the interviews of employer and
// person, invalid input, notices and skipped questions, answers kept while hidden, interim files,
// closing, discarding and clearing, taking answers over from another file, list fields and the
// interrupted questionnaire of the hosted app. The device's own keyboard and date picker stay manual.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import {
  answerUntil,
  download,
  expectQuiet,
  formFields,
  heading,
  openApp,
  openTestApp,
  press,
  protect,
  toOverview,
} from '../app';
import { expectClean, rememberAccess } from '../guards';

const SOFORT = 'Personalfragebogen: Angaben für die Sofortmeldung';
const SUMMARY_LINK = 'Zur Zusammenfassung – alle Angaben ansehen und ändern';

// Fictitious data only.
const EMPLOYER: Readonly<Record<string, string>> = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agBranche: 'bau',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agPersonalnummer: '',
  agBeschaeftigungsbeginn: '02.11.2026',
};

/** Runs `action` and waits until the step changed; returns the new heading. */
async function step(app: Locator, action: () => Promise<void>): Promise<string> {
  const before = await heading(app);
  await action();
  await expect.poll(() => heading(app)).not.toBe(before);
  return heading(app);
}
const tap = (app: Locator, label: string) => step(app, () => press(app, label));
/** Types the answer and takes the main button: "Weiter", or "Zurück zur Zusammenfassung" there. */
const type = (app: Locator, value: string) =>
  step(app, async () => {
    await app.locator('.question input, .question textarea').first().fill(value);
    await app.locator('.card .nav button.primary').click();
  });

// Exactly this role: „Gesetzliche Vertretung“ is also part of „Zweite gesetzliche Vertretung“.
const roleRow = (app: Locator, label: string) =>
  app.locator('li.role').filter({ has: app.page().getByText(label, { exact: true }) });
const summaryRow = (app: Locator, label: string) =>
  app
    .locator('.summary-row')
    .filter({ has: app.page().locator('dt', { hasText: new RegExp(`^${escape(label)}$`) }) });
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const change = (app: Locator, label: string) =>
  step(app, () => summaryRow(app, label).getByRole('button', { name: 'ändern' }).click());
const toSummary = async (app: Locator) => {
  if ((await heading(app)) !== 'Zusammenfassung') await tap(app, SUMMARY_LINK);
};
const card = (app: Locator, title: string) =>
  app
    .locator('section.card')
    .filter({ has: app.page().getByRole('heading', { name: title, exact: true }) });

test('MT-10: a new questionnaire asks who fills in, with its own number', async ({ page }) => {
  const { found, app } = await openTestApp(page);
  await press(app, SOFORT);
  await expect.poll(() => heading(app)).toBe('Wer füllt jetzt aus?');
  for (const label of [
    'Beschäftigte Person',
    'Gesetzliche Vertretung',
    'Zweite gesetzliche Vertretung',
    'Arbeitgeber',
  ]) {
    await expect(roleRow(app, label).locator('.state')).toHaveText('noch offen');
  }
  await expect(app.getByRole('button', { name: 'Ich bin: Beschäftigte Person' })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Ich bin: Arbeitgeber' })).toBeVisible();
  // Whether the representative is needed is decided only by the person's signature.
  const representative = roleRow(app, 'Gesetzliche Vertretung');
  await expect(representative).toContainText(
    'Nur nötig, wenn die Person am Tag ihrer Unterschrift minderjährig ist.',
  );
  await expect(representative.getByRole('button')).toHaveCount(0);

  const roles = card(app, 'Wer füllt jetzt aus?');
  const status = card(app, 'Stand');
  await expect(status).toContainText('Noch nicht weitergeben');
  await expect(status.getByRole('button', { name: 'PDF erstellen' })).toBeDisabled();
  const top = async (locator: Locator) => (await locator.boundingBox())?.y ?? Number.NaN;
  expect(await top(roles)).toBeLessThan(await top(status));
  expect(await top(status)).toBeLessThan(await top(card(app, 'Gültigkeit und Grenzen')));

  const number = app.locator('.app-header p');
  await expect(number).toHaveText(/^Fragebogen [0-9a-f]{8} · /);
  const first = (await number.textContent())?.slice(0, 19);
  await press(app, 'Fragebogen schließen');
  await press(app, SOFORT);
  await expect(number).toHaveText(/^Fragebogen [0-9a-f]{8} · /);
  expect((await number.textContent())?.slice(0, 19)).not.toBe(first);
  await expectQuiet(page, found);
});

test('MT-11: the employer answers one question per screen, the summary normalises', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await press(app, SOFORT);
  expect(await tap(app, 'Ich bin: Arbeitgeber')).toBe('Wie lautet die Firma des Arbeitgebers?');
  await expect(app.locator('.question h2')).toHaveCount(1);
  await expect(app.locator('.question .help')).toBeVisible();
  await expect(app.locator('.interview-head')).toContainText(/\d+ von etwa \d+ Fragen beantwortet/);
  await expect(app.locator('.interview-head progress')).toBeVisible();
  const next = app.getByRole('button', { name: 'Weiter', exact: true });
  await expect(next).toBeDisabled();
  expect(await type(app, 'Beispiel Bau GmbH')).toBe('Wie lautet die Betriebsnummer?');
  await expect(next).toBeDisabled();
  // The space is the point: the app takes it out.
  expect(await type(app, '1234 5671')).toBe('In welchem Wirtschaftsbereich arbeitet die Person?');
  const options = app.locator('.question [role=radio]');
  await expect(options).toHaveCount(12);
  await expect(options.last()).toHaveText('keiner dieser Bereiche');

  const warning = app.locator('.banner-warning', {
    hasText: 'Für diesen Sonderfall ist der Fragebogen nicht gedacht',
  });
  expect(await tap(app, 'keiner dieser Bereiche')).toBe(
    'Wie lautet der Familienname der beschäftigten Person?',
  );
  await expect(warning).toContainText(
    'Eine Sofortmeldung ist nur in den genannten Wirtschaftsbereichen vorgeschrieben.',
  );
  await tap(app, 'Zurück');
  await tap(app, 'Baugewerbe');
  await expect(warning).toHaveCount(0);

  await type(app, 'Musterfrau');
  expect(await type(app, 'Erika')).toBe('Welche Personalnummer hat die Person?');
  await expect(next).toBeEnabled();
  expect(await tap(app, 'Weiter')).toBe('An welchem Tag beginnt die Beschäftigung?');
  expect(await type(app, '02.11.2026')).toBe('Zusammenfassung');
  const rows = app.locator('.summary-row');
  await expect(rows.getByRole('button', { name: 'ändern' })).toHaveCount(await rows.count());
  await expect(summaryRow(app, 'Betriebsnummer des Arbeitgebers').locator('dd').first()).toHaveText(
    '12345671',
  );
  await expect(app).not.toContainText('1234 5671');
  await expect(summaryRow(app, 'Tag der Beschäftigungsaufnahme').locator('dd').first()).toHaveText(
    '02.11.2026',
  );
  await expectQuiet(page, found);
});

test('MT-11: the published version asks the Wirtschaftsbereich only once it has it', async ({
  page,
}) => {
  const { found, app } = await openApp(page);
  const asked = formFields('sofortmeldung', false).some((field) => field.id === 'agBranche');
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  expect(await type(app, '1234 5671')).toBe(
    asked
      ? 'In welchem Wirtschaftsbereich arbeitet die Person?'
      : 'Wie lautet der Familienname der beschäftigten Person?',
  );
  await expectClean(page, found);
});

test('MT-12: invalid input is named at the field, the date mask helps typing', async ({ page }) => {
  const { found, app } = await openTestApp(page);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  const input = app.locator('.question input').first();
  const error = app.locator('.question .field-error');
  await input.fill('1234567');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Die Betriebsnummer hat genau 8 Ziffern.');
  expect(await heading(app)).toBe('Wie lautet die Betriebsnummer?');
  expect(await type(app, '12345671')).toBe('In welchem Wirtschaftsbereich arbeitet die Person?');
  await expect(error).toHaveCount(0);

  await tap(app, 'Baugewerbe');
  await type(app, 'Musterfrau');
  await type(app, 'Erika');
  expect(await tap(app, 'Weiter')).toBe('An welchem Tag beginnt die Beschäftigung?');
  await input.fill('31.02.2026');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Dieses Datum gibt es nicht.');

  const mask = app.locator('.question .mask');
  await input.fill('');
  await expect(error).toHaveCount(0);
  await expect(mask).toHaveText('TT.MM.JJJJ');
  // A keypad with digits and a separator on phones (the iPhone offers no dot on its number pad).
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await input.pressSequentially('0211');
  await expect(input).toHaveValue('02.11');
  await expect(mask).toHaveText('02.11.JJJJ');
  // The typed part of the mask is hidden: the digits show black in the field, the rest grey.
  await expect(mask.locator('.mask-typed')).toHaveCSS('visibility', 'hidden');
  const grey = await mask.evaluate((element) => getComputedStyle(element).color);
  expect(grey).not.toBe(await input.evaluate((element) => getComputedStyle(element).color));
  await input.pressSequentially('2026');
  await expect(input).toHaveValue('02.11.2026');
  await expect(mask).toHaveCount(0);
  await input.fill('');
  await input.pressSequentially('2,11,2026');
  await expect(input).toHaveValue('2.11.2026');
  await expect(mask).toHaveCount(0);
  expect(await step(app, () => press(app, 'Weiter'))).toBe('Zusammenfassung');
  await expectQuiet(page, found);
});

const BRANCHES = [
  'Baugewerbe',
  'Gaststätten',
  'Personenbeförderung',
  'Logistik',
  'Schausteller',
  'Gebäudereinigung',
  'Messen',
  'Fleischwirtschaft',
  'Prostitution',
  'Sicherheitsgewerbe',
  'Friseur',
];

test('MT-13: notices first, the paper notice may wait, a skipped question waits in the summary', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await press(app, SOFORT);
  expect(await tap(app, 'Ich bin: Beschäftigte Person')).toBe('Datenschutzhinweis');
  await expect(app.locator('.card').first()).toContainText('höchstens 7 Tage');
  await app.getByLabel('Ich habe den Hinweis gelesen.').check();
  const paper = await tap(app, 'Weiter');
  expect(paper).toMatch(/^Hinweis: Ausweispapiere mitführen/);
  const notice = app.locator('.card').first();
  // The employer chose the branch; the notice lists none.
  for (const branch of BRANCHES)
    await expect(notice.locator('.notice-text')).not.toContainText(branch);
  await expect(notice).toContainText('Bestätigen Sie erst, wenn Sie ihn erhalten haben');
  expect(await tap(app, 'Weiter')).toBe('Wie lautet Ihr Familienname?');

  await type(app, 'Musterfrau');
  await type(app, 'Erika');
  await tap(app, 'Nein');
  await tap(app, 'Ja');
  expect(await type(app, '17.05.1990')).toBe('Sind Sie in Deutschland geboren?');
  // Preselected counts as an answer: nothing to skip.
  await expect(app.getByRole('radio', { name: 'Ja' })).toHaveAttribute('aria-checked', 'true');
  await expect(app.getByRole('button', { name: 'Vorerst überspringen' })).toHaveCount(0);
  await tap(app, 'Weiter');
  await type(app, 'Musterstadt');
  await tap(app, 'weiblich');
  const number = 'Wie lautet Ihre Versicherungsnummer der Rentenversicherung?';
  expect(await tap(app, 'Weiter')).toBe(number);
  await expect(app.locator('.question input').first()).toHaveValue('');
  expect(await tap(app, 'Vorerst überspringen')).toBe('Liegt die Anschrift im Ausland?');
  await tap(app, 'Nein');
  await type(app, 'Musterweg');
  await type(app, '1');
  await tap(app, 'Kein Zusatz');
  await type(app, '12345');
  expect(await type(app, 'Musterstadt')).toBe('Zusammenfassung');

  const missing = app.getByRole('group', { name: 'Fehlende Pflichtangaben' });
  await expect(missing).toContainText('Das fehlt noch, bevor Sie abschließen können:');
  await expect(missing).toContainText('Bestätigung: Hinweis: Ausweispapiere mitführen');
  await expect(missing.getByRole('button', { name: 'ansehen und bestätigen' })).toBeVisible();
  await expect(app).not.toContainText('Bitte bestätigen Sie noch diese Hinweise:');
  const skipped = app.getByRole('group', { name: 'Übersprungene Fragen' });
  await expect(skipped).toContainText('Übersprungen:');
  await expect(skipped).toContainText('Versicherungsnummer der Rentenversicherung');
  await expect(skipped.getByRole('button', { name: 'leer lassen' })).toBeVisible();
  const toClose = app.getByRole('button', { name: 'Weiter zum Abschluss' });
  await expect(toClose).toBeDisabled();

  // Catching up with the notice still unconfirmed leads on to it (since 2026-11-06).
  expect(await step(app, () => skipped.getByRole('button', { name: 'beantworten' }).click())).toBe(
    number,
  );
  await expect(app.getByRole('button', { name: 'Zurück zur Zusammenfassung' })).toBeVisible();
  // Voluntary questions left empty count as missing too; the notice comes in its turn.
  let at = number;
  for (let i = 0; i < 5 && at !== paper; i++) at = await tap(app, 'Zur nächsten fehlenden Angabe');
  expect(at).toBe(paper);
  expect(await tap(app, 'Zurück zur Zusammenfassung')).toBe('Zusammenfassung');

  await skipped.getByRole('button', { name: 'leer lassen' }).click();
  await expect(skipped).toHaveCount(0);
  await expect(toClose).toBeDisabled();
  expect(
    await step(app, () => missing.getByRole('button', { name: 'ansehen und bestätigen' }).click()),
  ).toBe(paper);
  await app.getByLabel('Ich habe diesen Hinweis auf Papier erhalten.').check();
  expect(await tap(app, 'Zurück zur Zusammenfassung')).toBe('Zusammenfassung');
  await expect(missing).toHaveCount(0);
  // The skipped number is voluntary: it does not keep the part from being closed.
  await expect(toClose).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-14: a follow-up question comes right after its question, a hidden answer is kept', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsname');
  const question = 'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Musterfrau“?';
  await expect.poll(() => heading(app)).toBe(question);
  await expect(app.getByRole('radio', { name: 'Ja' })).toHaveAttribute('aria-checked', 'true');
  expect(await tap(app, 'Nein')).toBe('Wie lautet Ihr Geburtsname?');
  const followUp = app.locator('.question');
  await expect(followUp).toHaveClass(/\blevel-1\b/);
  expect(
    await followUp.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft)),
  ).toBeGreaterThan(0);
  expect(await type(app, 'Mustermann')).toBe('Wann sind Sie geboren?');

  await tap(app, SUMMARY_LINK);
  const asked = 'Ist Ihr Geburtsname gleich Ihrem Familiennamen?';
  expect(await change(app, asked)).toBe(question);
  await tap(app, 'Ja');
  await toSummary(app);
  const dropped = app.locator('.banner-info', { hasText: 'Verworfene Angaben' });
  await expect(dropped).toContainText('Ihre Voraussetzung gilt nicht mehr');
  await expect(dropped.locator('li')).toHaveText([/^Geburtsname \(erst wenn .+\)$/]);

  await change(app, asked);
  // The follow-up has its answer again, so nothing is missing: straight back to the summary.
  expect(await tap(app, 'Nein')).toBe('Zusammenfassung');
  await expect(dropped).toHaveCount(0);
  await expect(summaryRow(app, 'Geburtsname').locator('dd').first()).toHaveText('Mustermann');
  expect(await change(app, 'Geburtsname')).toBe('Wie lautet Ihr Geburtsname?');
  await expect(app.locator('.question input').first()).toHaveValue('Mustermann');

  expect(await tap(app, 'Zurück zur Zusammenfassung')).toBe('Zusammenfassung');
  expect(await change(app, 'Liegt die Anschrift im Ausland?')).toBe(
    'Liegt die Anschrift im Ausland?',
  );
  await expect(app.getByRole('radio', { name: 'Nein' })).toHaveAttribute('aria-checked', 'true');
  await expectQuiet(page, found);
});

test('MT-15: an interim file names no person and opens again at the first open question', async ({
  page,
}, testInfo) => {
  const { found, app } = await openApp(page);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  await tap(app, 'Vorerst überspringen');
  if ((await heading(app)) === 'In welchem Wirtschaftsbereich arbeitet die Person?') {
    await tap(app, 'Baugewerbe');
  }
  const open = 'Wie lauten die Vornamen der beschäftigten Person?';
  expect(await type(app, 'Musterfrau')).toBe(open);
  await tap(app, SUMMARY_LINK);
  const number = (await app.locator('.app-header p').textContent())?.slice(11, 19) ?? '';
  const saved = await download(
    page,
    app,
    'Zwischenstand speichern',
    testInfo.outputPath('zwischenstand.json'),
  );
  expect(saved.name).toBe(`Sofortmeldung_${number}_Zwischenstand.json`);
  expect(saved.name).not.toMatch(/Musterfrau|Erika|Beispiel/);

  await page.reload();
  await expect(app).toContainText('Neuer Fragebogen');
  await app.locator('input[type=file]').first().setInputFiles(saved.path);
  await expect(roleRow(app, 'Arbeitgeber').locator('.state')).toHaveText(
    'begonnen, nicht abgeschlossen',
  );
  expect(await tap(app, 'Weitermachen')).toBe(open);
  await expect(app.locator('.interview-head')).toContainText('1 übersprungen');
  await expectClean(page, found);
});

test('MT-15: confirmed notices stay confirmed in the interim file', async ({ page }, testInfo) => {
  const { found, app } = await openApp(page);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Beschäftigte Person');
  await app.getByLabel('Ich habe den Hinweis gelesen.').check();
  await tap(app, 'Weiter');
  await app.getByLabel('Ich habe diesen Hinweis auf Papier erhalten.').check();
  await tap(app, 'Weiter');
  expect(await type(app, 'Musterfrau')).toBe('Wie lauten Ihre Vornamen?');
  await tap(app, SUMMARY_LINK);
  await expect(app.getByRole('group', { name: 'Fehlende Pflichtangaben' })).not.toContainText(
    'Bestätigung:',
  );
  const saved = await download(
    page,
    app,
    'Zwischenstand speichern',
    testInfo.outputPath('zwischenstand.json'),
  );
  await page.reload();
  await app.locator('input[type=file]').first().setInputFiles(saved.path);
  expect(await tap(app, 'Weitermachen')).toBe('Wie lauten Ihre Vornamen?');
  await tap(app, SUMMARY_LINK);
  await expect(app.getByRole('group', { name: 'Fehlende Pflichtangaben' })).not.toContainText(
    'Bestätigung:',
  );
  await expectClean(page, found);
});

/** Replaces the guard's auto-accept: dialogs are recorded and answered by `agree()`. */
function answerDialogs(page: Page, agree: () => boolean): { type: string; message: string }[] {
  page.removeAllListeners('dialog');
  const asked: { type: string; message: string }[] = [];
  page.on('dialog', (dialog) => {
    asked.push({ type: dialog.type(), message: dialog.message() });
    void (agree() ? dialog.accept() : dialog.dismiss());
  });
  return asked;
}

test('MT-16: closing with unsaved changes asks first, right after saving it does not', async ({
  page,
}, testInfo) => {
  const { found, app } = await openApp(page);
  const asked = answerDialogs(page, () => false);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => asked.map((dialog) => dialog.type)).toEqual(['beforeunload']);
  expect(page.isClosed()).toBe(false);

  await tap(app, SUMMARY_LINK);
  await download(page, app, 'Zwischenstand speichern', testInfo.outputPath('eins.json'));
  // Changed again after saving: it asks again.
  await change(app, 'Firma des Arbeitgebers');
  await type(app, 'Beispiel Bau AG');
  await toSummary(app);
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => asked.length).toBe(2);
  expect(page.isClosed()).toBe(false);

  await download(page, app, 'Zwischenstand speichern', testInfo.outputPath('zwei.json'));
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => page.isClosed()).toBe(true);
  expect(asked).toHaveLength(2);
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
});

test('MT-17: "Alle Daten auf diesem Gerät löschen" asks every time, only "OK" clears', async ({
  page,
}) => {
  const { found, app } = await openApp(page);
  let agree = true;
  const asked = answerDialogs(page, () => agree);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  await press(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)');
  await press(app, 'Fragebogen schließen');
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]?.message).toContain('Fragebogen schließen?');
  const clear = app.getByRole('button', { name: 'Alle Daten auf diesem Gerät löschen' });
  await expect(clear).toBeVisible();

  // Nothing is open now, and it still asks.
  await page.evaluate(() => Object.assign(window, { unchanged: true }));
  agree = false;
  await clear.click();
  await expect.poll(() => asked.length).toBe(2);
  expect(asked[1]?.message).toMatch(/^Alle Daten auf diesem Gerät löschen\?/);
  expect(asked[1]?.message).toContain('nicht rückgängig');
  await expect(clear).toBeVisible();
  expect(await page.evaluate(() => 'unchanged' in window)).toBe(true);

  agree = true;
  await Promise.all([page.waitForEvent('load'), clear.click()]);
  expect(asked).toHaveLength(3);
  expect(await page.evaluate(() => 'unchanged' in window)).toBe(false);
  await expect(app).toContainText('Neuer Fragebogen');
  await expect(app.locator('.banner')).toHaveCount(0);
  await expectClean(page, found);
});

test('MT-17: clearing all data drops a master-data link from the address too', async ({ page }) => {
  const { found, app } = await openApp(
    page,
    '#stammdaten=1&formular=sofortmeldung&betriebsnummer=12345671&firma=Beispiel+Bau+GmbH',
  );
  await expect(app).toContainText('aus Ihrem Lesezeichen');
  await press(app, 'Fragebogen schließen');
  await Promise.all([page.waitForEvent('load'), press(app, 'Alle Daten auf diesem Gerät löschen')]);
  expect(await page.evaluate(() => location.hash)).toBe('');
  await expect(app).toContainText('Neuer Fragebogen');
  await expect(app).not.toContainText('aus Ihrem Lesezeichen');
  await expectClean(page, found);
});

test('MT-18: answers of another file fill the open parts, never overwrite and never sign', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('vollstaendig.pdf'));
  await press(app, 'Fragebogen schließen');
  await press(app, SOFORT);
  const takeOver = app.locator('.take-over input[type=file]');
  await takeOver.setInputFiles(pdf.path);
  const taken = app.locator('.banner-info', { hasText: /^Angaben aus „.+“ übernommen\./ });
  await expect(taken).toContainText('unterschrieben ist damit noch nichts');
  await expect(taken).toContainText(/Beschäftigte Person: \d+ Angaben übernommen/);
  await expect(taken).toContainText(/Arbeitgeber: \d+ Angaben übernommen/);
  for (const role of ['Beschäftigte Person', 'Arbeitgeber']) {
    await expect(roleRow(app, role).locator('.state')).toHaveText('begonnen, nicht abgeschlossen');
  }
  await expect(app.locator('.state-signed, .state-sealed')).toHaveCount(0);

  await step(app, () =>
    roleRow(app, 'Beschäftigte Person').getByRole('button', { name: 'Weitermachen' }).click(),
  );
  // It goes on after the last answer; back to the first step, then leaf through with "Weiter".
  const back = app.locator('.card .nav button.back');
  for (let i = 0; i < 40 && (await back.isEnabled()); i++) await tap(app, 'Zurück');
  const seen = new Map<string, string>();
  for (let i = 0; i < 40 && (await heading(app)) !== 'Zusammenfassung'; i++) {
    const field = app.locator('.question input[type=text]').first();
    if ((await field.count()) > 0) seen.set(await heading(app), await field.inputValue());
    await tap(app, 'Weiter');
  }
  expect(await heading(app)).toBe('Zusammenfassung');
  expect(seen.get('Wie lautet Ihr Familienname?')).toBe('Musterfrau');
  expect(seen.get('In welcher Stadt oder Gemeinde sind Sie geboren?')).toBe('Musterstadt');
  expect(seen.get('In welchem Ort wohnen Sie?')).toBe('Musterstadt');

  await press(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)');
  await takeOver.setInputFiles(pdf.path);
  const nothing = app.locator('.banner-warning', {
    hasText: /^Aus „.+“ ließ sich nichts übernehmen\./,
  });
  await expect(nothing).toContainText(
    /Beschäftigte Person: 0 Angaben übernommen, [^.]*\d+ vorhandene behalten \(Familienname/,
  );

  // The same questionnaire is opened, not taken over — here its own interim file, while its parts
  // are open (a complete one offers no takeover at all, Tobias 2026-11-08).
  const interim = await download(
    page,
    app,
    'Zwischenstand speichern',
    testInfo.outputPath('zwischenstand.json'),
  );
  await takeOver.setInputFiles(interim.path);
  await expect(app.locator('.banner-error')).toContainText('Das ist derselbe Fragebogen');
  await expectQuiet(page, found);
});

test('MT-18: an answer of the old file replaces a differing preselection', async ({
  page,
}, testInfo) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsname');
  await expect.poll(() => heading(app)).toMatch(/^Ist Ihr Geburtsname gleich/);
  await tap(app, 'Nein');
  await type(app, 'Mustermann');
  await press(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)');
  const saved = await download(
    page,
    app,
    'Zwischenstand speichern',
    testInfo.outputPath('zwischenstand.json'),
  );
  await press(app, 'Fragebogen schließen');
  await press(app, SOFORT);
  await app.locator('.take-over input[type=file]').setInputFiles(saved.path);
  await expect(app.locator('.banner-info')).toContainText(
    /Beschäftigte Person: \d+ Angaben übernommen/,
  );
  // The notices the old file's draft had not confirmed come first (audit 2026-11-14: they were
  // passed over), then the interview goes on after the answers taken over; back from there they
  // are in place.
  expect(
    await step(app, () =>
      roleRow(app, 'Beschäftigte Person').getByRole('button', { name: 'Weitermachen' }).click(),
    ),
  ).toBe('Datenschutzhinweis');
  await app.getByLabel('Ich habe den Hinweis gelesen.').check();
  expect(await tap(app, 'Weiter')).toMatch(/^Hinweis: Ausweispapiere mitführen/);
  await app.getByLabel('Ich habe diesen Hinweis auf Papier erhalten.').check();
  expect(await tap(app, 'Zur nächsten fehlenden Angabe')).toBe('Wann sind Sie geboren?');
  expect(await tap(app, 'Zurück')).toBe('Wie lautet Ihr Geburtsname?');
  await expect(app.locator('.question input').first()).toHaveValue('Mustermann');
  expect(await tap(app, 'Zurück')).toBe(
    'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Musterfrau“?',
  );
  await expect(app.getByRole('radio', { name: 'Nein' })).toHaveAttribute('aria-checked', 'true');
  await expectQuiet(page, found);
});

async function expectNoTakeOver(app: Locator) {
  await expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();
  await expect(
    app.getByRole('button', { name: 'Angaben aus einer anderen Datei übernehmen …' }),
  ).toHaveCount(0);
}

test('MT-18: no takeover once every part is closed', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'eigenbeleg-bewirtung-unterschrieben');
  await expectNoTakeOver(app);
  await expectQuiet(page, found);
});

// Its guardian part is not needed, so nothing is open (Tobias 2026-11-08).
test('MT-18: no takeover in a complete Sofortmeldung', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  await expectNoTakeOver(app);
  await expectQuiet(page, found);
});

test('MT-19: quick answers move on at once, the postcode is checked in Germany only', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Beschäftigte Person');
  await app.getByLabel('Ich habe den Hinweis gelesen.').check();
  await tap(app, 'Weiter');
  await app.getByLabel('Ich habe diesen Hinweis auf Papier erhalten.').check();
  await tap(app, 'Weiter');
  await type(app, 'Musterfrau');
  await type(app, 'Erika');
  const birthName = 'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Musterfrau“?';
  expect(await tap(app, 'Nein')).toBe(birthName);
  // A tap answers and moves on; "Zurück" changes it.
  expect(await tap(app, 'Ja')).toBe('Wann sind Sie geboren?');
  expect(await tap(app, 'Zurück')).toBe(birthName);
  await tap(app, 'Ja');
  expect(await type(app, '17.05.1990')).toBe('Sind Sie in Deutschland geboren?');
  await expect(app.getByRole('radio', { name: 'Ja' })).toHaveAttribute('aria-checked', 'true');
  expect(await tap(app, 'Weiter')).toBe('In welcher Stadt oder Gemeinde sind Sie geboren?');
  await type(app, 'Musterstadt');
  await tap(app, 'weiblich');
  await expect(app.getByRole('radio', { name: 'Ja' })).toHaveAttribute('aria-checked', 'true');
  expect(await tap(app, 'Weiter')).toBe(
    'Wie lautet Ihre Versicherungsnummer der Rentenversicherung?',
  );
  expect(await tap(app, 'Kenne ich nicht')).toBe('Liegt die Anschrift im Ausland?');
  await tap(app, 'Nein');
  await type(app, 'Musterweg');
  await type(app, '1');
  expect(await tap(app, 'Kein Zusatz')).toBe('Wie lautet Ihre Postleitzahl?');
  const input = app.locator('.question input').first();
  await input.fill('1234');
  await press(app, 'Weiter');
  await expect(app.locator('.question .field-error')).toHaveText(
    'Bitte eine deutsche Postleitzahl mit 5 Ziffern eingeben.',
  );
  expect(await type(app, '76131')).toBe('In welchem Ort wohnen Sie?');

  // Abroad the postcode is asked without that check.
  for (let i = 0; i < 8 && (await heading(app)) !== 'Liegt die Anschrift im Ausland?'; i++) {
    await tap(app, 'Zurück');
  }
  expect(await tap(app, 'Ja')).toBe('In welchem Staat liegt Ihre Anschrift?');
  await app.getByRole('combobox').fill('Österreich');
  await app.getByRole('option', { name: 'Österreich', exact: true }).click();
  await tap(app, 'Weiter');
  await tap(app, 'Weiter');
  await tap(app, 'Weiter');
  expect(await tap(app, 'Kein Zusatz')).toBe('Wie lautet die Postleitzahl?');
  expect(await type(app, '1234')).toBe('In welchem Ort wohnen Sie?');
  expect(await type(app, 'Musterstadt')).toBe('Zusammenfassung');
  await expect(
    summaryRow(app, 'Versicherungsnummer der Rentenversicherung (falls bekannt)'),
  ).toBeVisible();

  await tap(app, 'Weiter zum Abschluss');
  const why = app.locator('details.signature-basis');
  await why.locator('summary', { hasText: 'Warum genügt das?' }).click();
  await expect(why).toContainText('getippter Name');
  await expect(why).toContainText(/§ \d+/);
  await expect(why).toContainText('eIDAS');
  await expectQuiet(page, found);
});

test('MT-26: birth country and nationality from the list, a free entry only with a hint', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'personalfragebogen-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe('Wann sind Sie geboren?');
  expect(await type(app, '17.05.1990')).toBe('Sind Sie in Deutschland geboren?');
  const country = 'In welchem Staat sind Sie geboren?';
  expect(await tap(app, 'Nein')).toBe(country);
  const box = app.getByRole('combobox');
  const hint = app.locator('.question .warning-text');
  await box.pressSequentially('deu');
  await expect(app.getByRole('listbox')).toBeVisible();
  // Germany is the yes/no question before, never an entry here.
  await expect(app.getByRole('option', { name: 'Deutschland', exact: true })).toHaveCount(0);
  await box.fill('');
  await box.pressSequentially('tür');
  await app.getByRole('option', { name: 'Türkei', exact: true }).click();
  await expect(box).toHaveValue('Türkei');
  await expect(hint).toHaveCount(0);
  expect(await tap(app, 'Weiter')).toBe('In welcher Stadt oder Gemeinde sind Sie geboren?');
  await tap(app, SUMMARY_LINK);
  await expect(summaryRow(app, 'Geburtsland').locator('dd').first()).toHaveText('Türkei');

  expect(await change(app, 'Geburtsland')).toBe(country);
  await box.fill('');
  await box.pressSequentially('Sowjetunion');
  // Shown while typing, before any button.
  await expect(hint).toContainText('Rückfragen und Zusatzaufwand');
  await step(app, () => app.locator('.card .nav button.primary').click());
  await toSummary(app);
  await expect(summaryRow(app, 'Geburtsland').locator('dd').first()).toHaveText('Sowjetunion');

  await change(app, 'Deutsche Staatsangehörigkeit?');
  expect(await tap(app, 'Nein')).toBe('Welche Staatsangehörigkeit haben Sie?');
  await box.pressSequentially('deu');
  await expect(app.getByRole('listbox')).toBeVisible();
  await expect(app.getByRole('option', { name: 'deutsch', exact: true })).toHaveCount(0);
  await box.fill('');
  await box.pressSequentially('tür');
  await app.getByRole('option', { name: 'türkisch', exact: true }).click();
  await expect(box).toHaveValue('türkisch');
  await expect(hint).toHaveCount(0);
  await expectQuiet(page, found);
});

const EXPORT_LOCAL = fileURLToPath(new URL('../../../config/export.local.json', import.meta.url));

test('MT-26: the payroll hand-over names a birth country outside the list, no key guessed', async ({
  page,
}, testInfo) => {
  // The mapping to the payroll program is the Kanzlei's (gitignored); without it no hand-over.
  test.skip(!existsSync(EXPORT_LOCAL), 'only with the local mapping config/export.local.json');
  test.slow();
  const { found, app } = await openTestApp(page, 'personalfragebogen-vollstaendig');
  await step(app, () =>
    roleRow(app, 'Beschäftigte Person')
      .getByRole('button', { name: 'Neue Fassung beginnen' })
      .click(),
  );
  await toSummary(app);
  await change(app, 'In Deutschland geboren?');
  expect(await tap(app, 'Nein')).toBe('In welchem Staat sind Sie geboren?');
  await app.getByRole('combobox').fill('Sowjetunion');
  await step(app, () => app.locator('.card .nav button.primary').click());
  await toSummary(app);
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Ich versichere, dass meine Angaben richtig und vollständig sind.');
  await press(app, 'Namen tippen');
  await app.getByLabel('Ihr vollständiger Name').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await toOverview(app);
  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('geburtsland.pdf'));
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await app.locator('input[type=file]').first().setInputFiles(pdf.path);
  await expect(app).toContainText(/„Sowjetunion“[^.]*bitte von Hand eintragen/);
  await expectQuiet(page, found);
});

test('MT-27: discarding asks every time, also right after an interim file', async ({
  page,
}, testInfo) => {
  const { found, app } = await openApp(page);
  let agree = false;
  const asked = answerDialogs(page, () => agree);
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  const now = await type(app, 'Beispiel Bau GmbH');
  await press(app, 'Fragebogen verwerfen');
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0]?.message).toContain(
    'Alle Angaben dieses Fragebogens werden aus der App gelöscht',
  );
  expect(asked[0]?.message).toContain('nicht rückgängig');
  expect(await heading(app)).toBe(now);

  agree = true;
  await press(app, 'Fragebogen verwerfen');
  await expect(app.locator('.banner-success')).toHaveText(/Der Fragebogen wurde verworfen\./);
  await expect(app).toContainText('Neuer Fragebogen');

  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  await tap(app, SUMMARY_LINK);
  const saved = await download(page, app, 'Zwischenstand speichern', testInfo.outputPath('z.json'));
  await press(app, 'Fragebogen verwerfen');
  await expect.poll(() => asked.length).toBe(3);
  await expect(app.locator('.banner-success')).toHaveText(/Der Fragebogen wurde verworfen\./);
  // Files already saved stay where they are.
  expect(existsSync(saved.path)).toBe(true);
  await expectClean(page, found);
});

// The hosted app (https) is the only one that keeps an interrupted questionnaire; Playwright serves
// the public build at that address itself, nothing goes on the network.
const APP = fileURLToPath(new URL('../../../dist/index.html', import.meta.url));
const ORIGIN = 'https://fragebogen.test';
const STORED = 'fragebogen-angefangen';

async function serve(context: BrowserContext): Promise<{ foreign: string[]; errors: string[] }> {
  await rememberAccess(context);
  const html = readFileSync(APP);
  const seen = { foreign: [] as string[], errors: [] as string[] };
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url === `${ORIGIN}/` || url === `${ORIGIN}/index.html`) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    }
    if (!/^(data|blob):/.test(url)) seen.foreign.push(url);
    return route.abort();
  });
  const watch = (page: Page) => {
    page.on('dialog', (dialog) => void dialog.accept());
    page.on('pageerror', (error) => seen.errors.push(error.message));
  };
  context.pages().forEach(watch);
  context.on('page', watch);
  return seen;
}

const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), STORED);

async function startEmployer(page: Page): Promise<Locator> {
  await page.goto(`${ORIGIN}/`);
  const app = page.locator('#root');
  await press(app, SOFORT);
  await tap(app, 'Ich bin: Arbeitgeber');
  await type(app, 'Beispiel Bau GmbH');
  await expect.poll(() => stored(page)).not.toBeNull();
  return app;
}

test.describe('the hosted app', () => {
  test.use({ timezoneId: 'Europe/Berlin' });

  test('MT-116: a tab closed by mistake offers its questionnaire again, discarded it is gone', async ({
    context,
  }) => {
    const seen = await serve(context);
    await context.clock.setFixedTime(new Date('2026-11-08T10:15:00+01:00'));
    const first = await context.newPage();
    await startEmployer(first);
    await first.close();

    const again = await context.newPage();
    await again.goto(`${ORIGIN}/`);
    const app = again.locator('#root');
    const offer = card(app, 'Angefangener Fragebogen gefunden');
    await expect(offer).toContainText(`„${SOFORT}“`);
    await expect(offer).toContainText('08.11.2026, 10:15');
    await expect(offer.getByRole('button', { name: 'Löschen', exact: true })).toBeVisible();
    await offer.getByRole('button', { name: 'Fortsetzen' }).click();
    await expect(app).toContainText('Angefangener Fragebogen aus diesem Browser fortgesetzt.');
    await expect(roleRow(app, 'Arbeitgeber').locator('.state')).toHaveText(
      'begonnen, nicht abgeschlossen',
    );
    await tap(app, 'Weitermachen');
    await tap(app, SUMMARY_LINK);
    await expect(summaryRow(app, 'Firma des Arbeitgebers')).toContainText('Beispiel Bau GmbH');

    await press(app, 'Fragebogen verwerfen');
    await expect(app).toContainText('Der Fragebogen wurde verworfen.');
    await again.close();
    const third = await context.newPage();
    await third.goto(`${ORIGIN}/`);
    await expect(third.locator('#root')).toContainText('Neuer Fragebogen');
    await expect(card(third.locator('#root'), 'Angefangener Fragebogen gefunden')).toHaveCount(0);
    expect(seen.foreign).toEqual([]);
    expect(seen.errors).toEqual([]);
  });

  test('MT-116: the questionnaire is offered again after the whole browser was closed', async ({
    playwright,
    browserName,
  }, testInfo) => {
    const profile = testInfo.outputPath('profil');
    const launch = () =>
      playwright[browserName].launchPersistentContext(profile, { timezoneId: 'Europe/Berlin' });
    const before = await launch();
    const seenBefore = await serve(before);
    await startEmployer(before.pages()[0] ?? (await before.newPage()));
    await before.close();

    const after = await launch();
    const seenAfter = await serve(after);
    const page = after.pages()[0] ?? (await after.newPage());
    await page.goto(`${ORIGIN}/`);
    const app = page.locator('#root');
    await card(app, 'Angefangener Fragebogen gefunden')
      .getByRole('button', { name: 'Fortsetzen' })
      .click();
    await tap(app, 'Weitermachen');
    await tap(app, SUMMARY_LINK);
    await expect(summaryRow(app, 'Firma des Arbeitgebers')).toContainText('Beispiel Bau GmbH');
    await after.close();
    expect([...seenBefore.foreign, ...seenAfter.foreign]).toEqual([]);
    expect([...seenBefore.errors, ...seenAfter.errors]).toEqual([]);
  });

  test('MT-116: after an interim file or the PDF the browser keeps nothing until the next change', async ({
    context,
  }) => {
    const seen = await serve(context);
    const page = await context.newPage();
    const app = await startEmployer(page);
    await answerUntil(app, formFields('sofortmeldung', false), EMPLOYER);
    expect(await stored(page)).not.toBeNull();
    await Promise.all([page.waitForEvent('download'), press(app, 'Zwischenstand speichern')]);
    await expect.poll(() => stored(page)).toBeNull();

    await change(app, 'Firma des Arbeitgebers');
    await type(app, 'Beispiel Bau AG');
    await expect.poll(() => stored(page)).not.toBeNull();
    await toSummary(app);
    await press(app, 'Weiter zum Abschluss');
    await press(app, 'Ich bestätige die Angaben des Arbeitgebers.');
    await press(app, 'Ohne Unterschrift abschließen');
    await press(app, 'Abschließen');
    await expect.poll(() => stored(page)).not.toBeNull();
    await Promise.all([
      page.waitForEvent('download'),
      (async () => {
        await press(app, 'PDF erstellen');
        await protect(page, 'Ohne Kennwort');
      })(),
    ]);
    await expect.poll(() => stored(page)).toBeNull();
    expect(seen.foreign).toEqual([]);
    expect(seen.errors).toEqual([]);
  });

  test('MT-116: a browser that cannot keep anything says so at the first try', async ({
    context,
  }) => {
    const seen = await serve(context);
    await context.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
    });
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/`);
    const app = page.locator('#root');
    await press(app, SOFORT);
    await tap(app, 'Ich bin: Arbeitgeber');
    await type(app, 'Beispiel Bau GmbH');
    await expect(app.locator('.banner-warning')).toHaveText(
      /^Dieser Browser kann den Fragebogen nicht für später merken \(zum Beispiel bei gesperrtem Speicher\)\. Bitte bei einer Unterbrechung „Zwischenstand speichern“\./,
    );
    expect(seen.foreign).toEqual([]);
    expect(seen.errors).toEqual([]);
  });
});

test('MT-118: the date picker follows the field and keeps the font size that stops zooming', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-zusammenfassung');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  expect(await change(app, 'Tag der Beschäftigungsaufnahme')).toBe(
    'An welchem Tag beginnt die Beschäftigung?',
  );
  const input = app.locator('.question .masked input');
  const picker = app.getByLabel('Datum im Kalender wählen');
  await expect(input).toHaveValue('02.11.2026');
  await input.fill('');
  await input.pressSequentially('2,11,2026');
  await expect(input).toHaveValue('2.11.2026');
  // A valid date in the field, single-digit day too, opens the calendar on that day.
  await expect(picker).toHaveValue('2026-11-02');
  await picker.fill('2026-11-09');
  await expect(input).toHaveValue('09.11.2026');
  // Below 16 px the iPhone zooms into the page when a field or the picker gets the focus.
  for (const field of [input, picker]) {
    expect(
      await field.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  expect(await tap(app, 'Zurück zur Zusammenfassung')).toBe('Zusammenfassung');
  await expect(summaryRow(app, 'Tag der Beschäftigungsaufnahme').locator('dd').first()).toHaveText(
    '09.11.2026',
  );
  await expectQuiet(page, found);
});

test('MT-118: the birth date picker offers no day after today', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe('Wann sind Sie geboren?');
  const picker = app.getByLabel('Datum im Kalender wählen');
  await expect(picker).toHaveAttribute('max', '2026-11-08');
  await picker.fill('1965-05-17');
  await expect(app.locator('.question .masked input')).toHaveValue('17.05.1965');
  await expectQuiet(page, found);
});
