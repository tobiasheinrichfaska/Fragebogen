// Former manual tests of manual_tests/11_eigenbeleg.md, played in the test build (Tobias
// 2026-11-08: only what a virtual browser cannot check stays a manual test).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { download, expectQuiet, heading, openTestApp, pdfPages, press } from '../app';

/** Waits until the step is `text` and returns the headings seen so far for later checks. */
async function at(app: Locator, text: string, seen: string[] = []): Promise<string[]> {
  await expect.poll(() => heading(app)).toBe(text);
  seen.push(text);
  return seen;
}

/** Types `value` into the question (empty leaves it empty) and goes on with "Weiter". */
async function type(app: Locator, value: string): Promise<void> {
  const before = await heading(app);
  await app.locator('.question input, .question textarea').first().fill(value);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** A choice moves on at once. */
async function choose(app: Locator, label: string): Promise<void> {
  const before = await heading(app);
  await press(app, label);
  await expect.poll(() => heading(app)).not.toBe(before);
}

const summaryRow = (app: Locator, label: string) =>
  app.locator('.summary-row').filter({ has: app.page().getByText(label, { exact: true }) });

const choices = (app: Locator) => app.locator('.question .choices button');

// The warning of a special case the form is not made for (not the preview banner of the drafts).
const outOfScope = (app: Locator) =>
  app
    .locator('.banner')
    .filter({ hasText: 'Für diesen Sonderfall ist der Fragebogen nicht gedacht' });

/** Signs with the typed name, writes the PDF and reads it in at the Kanzlei station. */
async function signAndReadInAtKanzlei(page: Page, app: Locator, path: string): Promise<string> {
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText('Ausstellende Person: abgeschlossen');
  const pdf = await download(page, app, 'PDF erstellen', path);
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await app.locator('input[type=file]').first().setInputFiles(pdf.path);
  await expect(app).toContainText('Prüfhinweise:');
  return pdf.path;
}

test('MT-110: a donation is blocked, a business meal only warned', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'eigenbeleg-ausgabe-art-offen');
  const banner = outOfScope(app);
  await at(app, 'Wofür wurde bezahlt?');
  await choose(app, 'eine Spende');
  await expect(banner).toContainText(
    'Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers; ein Eigenbeleg genügt nicht.',
  );
  await expect(banner.locator('p').first()).toHaveText(
    /bei der Stelle nach, die den Fragebogen bekommt \(hier: Buchhaltung oder Kanzlei\)\.$/,
  );

  await press(app, 'Zurück');
  await at(app, 'Wofür wurde bezahlt?');
  await choose(app, 'ein Essen oder Getränke mit Gästen (Bewirtung)');
  await expect(banner).toHaveCount(0);
  await at(
    app,
    'Wichtig bei einer Bewirtung: Ohne die Rechnung der Gaststätte ist die Ausgabe nicht abziehbar.',
  );
  const help = app.locator('.question .help');
  await expect(help).toContainText(
    'verlangt das Gesetz deren Rechnung (§ 4 Abs. 5 Satz 1 Nr. 2 EStG)',
  );
  await expect(help).toContainText('um eine Zweitschrift der Rechnung');
  await expect(help).toContainText('Bewirtung in Ihrer eigenen Wohnung ist in der Regel privat');
  await expect(choices(app)).toHaveText(['Verstanden']);

  // Not blocked: the interview goes on.
  await choose(app, 'Verstanden');
  await at(app, 'Wo fand die Bewirtung statt?');
  await expect(banner).toHaveCount(0);
  await expectQuiet(page, found);
});

test('MT-111: a business meal is signed and written as a PDF', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'eigenbeleg-bewirtung-zusammenfassung');
  await at(app, 'Zusammenfassung');
  await expect(summaryRow(app, 'Anlass der Bewirtung').locator('dd').first()).toHaveText(
    'Besprechung Auftrag Musterstraße',
  );
  await expect(summaryRow(app, 'Teilnehmende der Bewirtung').locator('dd').first()).toHaveText(
    'Erika Musterfrau\nMax Mustermann, Beispiel GmbH',
  );
  await expect(summaryRow(app, 'Betrieblicher Anlass')).toHaveCount(0);
  await expect(app.locator('.summary-section h3')).not.toContainText([
    'Entnahme, Einlage oder Geldtransit',
  ]);
  await expect(summaryRow(app, 'Belegnummer').locator('dd').first()).toHaveText('–');

  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText('Ausstellende Person: abgeschlossen');
  await expect(app.locator('[role=alert]')).toHaveCount(0);

  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('bewirtung.pdf'));
  const text = (await pdfPages(pdf.path)).join('\n');
  expect(text).toMatch(/Hinweis zur Bewirtung\s+Verstanden/);
  expect(text).toMatch(/Belegnummer\s+–/);
  // The check hints for the Kanzlei only appear when it merges the inputs (MT-112).
  for (const hint of ['Prüfhinweise', 'Ohne Vorsteuer buchen', 'Keine Belegnummer angegeben']) {
    expect(text).not.toContain(hint);
  }
  await expectQuiet(page, found);
});

test('MT-112: the Kanzlei sees the check hints of the Eigenbeleg', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'kanzlei-eigenbeleg-bewirtung');
  await expect(app).toContainText('Prüfhinweise:');
  for (const hint of [
    'Ohne Vorsteuer buchen',
    'Bewirtung per Eigenbeleg',
    'Bewirtung in einer Gaststätte ohne deren Rechnung',
    'Eigenbeleg über eine Ausgabe ab 250 €',
    'Keine Belegnummer angegeben',
  ]) {
    await expect(app).toContainText(hint);
  }
  // The hints block nothing.
  await expect(app).toContainText('Vollständig und ohne Widersprüche.');
  await expect(app.getByRole('button', { name: 'PDF für die Personalakte' })).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-113: a Privatentnahme at a GmbH is warned, not blocked', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'eigenbeleg-vorgangsart-offen');
  const seen = await at(app, 'Was möchten Sie mit diesem Eigenbeleg belegen?');
  await choose(app, 'eine Privatentnahme');
  await at(app, 'Welche Rechtsform hat das Unternehmen?', seen);
  await choose(app, 'Kapitalgesellschaft (GmbH, UG oder AG)');
  await at(
    app,
    'Bitte beachten Sie: In einer GmbH, UG oder AG gehört das Geld der Gesellschaft.',
    seen,
  );
  const help = app.locator('.question .help');
  for (const word of ['Verrechnungskonto', 'Darlehen', 'verdeckte Gewinnausschüttung']) {
    await expect(help).toContainText(word);
  }
  await expect(choices(app)).toHaveText(['Verstanden']);
  await choose(app, 'Verstanden');
  await at(app, 'An welchem Tag wurde bezahlt oder das Geld bewegt?', seen);
  await type(app, '15.10.2026');
  await at(app, 'Woher wurde das Geld entnommen?', seen);
  await choose(app, 'bar aus der Kasse des Betriebs');
  await at(app, 'Welche Kasse war es?', seen);
  await type(app, '');
  await at(app, 'Wer hat das Geld für private Zwecke entnommen?', seen);
  await type(app, 'Erika Musterfrau');
  await at(app, 'Wie viel Geld war es, in Euro?', seen);
  await type(app, '200,00');
  await at(app, 'Wofür wurde das Geld entnommen?', seen);
  await expect(app.locator('.question h2')).toContainText('(freiwillig)');
  await type(app, '');
  await at(app, 'Ist der Betrag am selben Tag im Kassenbuch eingetragen?', seen);
  await choose(app, 'Ja');
  await at(app, 'Welche Nummer bekommt dieser Eigenbeleg?', seen);
  await type(app, '');
  await at(app, 'Welches Datum hat dieser Eigenbeleg?', seen);
  await type(app, '16.10.2026');
  await at(app, 'Zusammenfassung', seen);
  // Nothing about the payee, place, currency or way of payment of an expense.
  for (const question of [
    'An wen wurde bezahlt?',
    'Wo war das?',
    'Wurde in Euro bezahlt?',
    'Wie wurde bezahlt?',
  ]) {
    expect(seen).not.toContain(question);
  }
  await expect(outOfScope(app)).toHaveCount(0);
  await expect(app.getByRole('button', { name: 'Weiter zum Abschluss' })).toBeEnabled();

  await signAndReadInAtKanzlei(page, app, testInfo.outputPath('privatentnahme.pdf'));
  await expect(app).toContainText('Kapitalgesellschaft: keine Privatentnahme.');
  await expectQuiet(page, found);
});

test('MT-114: from a Privatentnahme to a Geldtransit', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'eigenbeleg-privatentnahme-gmbh-zusammenfassung');
  await at(app, 'Zusammenfassung');
  await summaryRow(app, 'Art des Vorgangs').getByRole('button', { name: 'ändern' }).click();
  const seen = await at(app, 'Was möchten Sie mit diesem Eigenbeleg belegen?');
  await choose(app, 'einen Geldtransit');
  await at(app, 'Von wo nach wo wurde das Geld gebracht?', seen);
  await choose(app, 'aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)');
  await at(app, 'Welche Kasse war es?', seen);
  await type(app, '');
  await at(app, 'Wer hat das Geld gebracht oder abgeholt?', seen);
  await type(app, 'Max Mustermann');
  await at(app, 'Warum wurde das Geld gebracht?', seen);
  await type(app, 'Tageseinnahmen zur Bank gebracht');
  await at(app, 'Geben Sie den Beleg der Bank oder den Kontoauszug mit ab?', seen);
  await choose(app, 'Nein');
  await at(app, 'Zusammenfassung', seen);
  // Legal form, the GmbH notice and what was answered already are not asked again.
  for (const question of [
    'Welche Rechtsform hat das Unternehmen?',
    'Bitte beachten Sie: In einer GmbH, UG oder AG gehört das Geld der Gesellschaft.',
    'Wer hat das Geld für private Zwecke entnommen?',
    'Wofür wurde das Geld entnommen?',
    'Wie viel Geld war es, in Euro?',
    'Ist der Betrag am selben Tag im Kassenbuch eingetragen?',
  ]) {
    expect(seen).not.toContain(question);
  }
  const discarded = app.locator('.banner').filter({ hasText: 'Verworfene Angaben' });
  await expect(discarded).toContainText('Verworfene Angaben: Ihre Voraussetzung gilt nicht mehr');
  await expect(discarded).toContainText('Rechtsform des Unternehmens');
  await expect(discarded).toContainText('Entnommen von');
  await expect(summaryRow(app, 'Betrag im Kassenbuch').locator('dd').first()).toHaveText('Ja');

  // Privatentnahme and Geldtransit share the amount.
  await summaryRow(app, 'Betrag in Euro').getByRole('button', { name: 'ändern' }).click();
  await at(app, 'Wie viel Geld war es, in Euro?');
  const amount = app.locator('.question input').first();
  await expect(amount).toHaveValue('200,00');
  await amount.fill('1.250,00');
  await press(app, 'Zurück zur Zusammenfassung');
  await at(app, 'Zusammenfassung');
  await expect(summaryRow(app, 'Betrag in Euro').locator('dd').first()).toHaveText('1.250,00 €');
  await expectQuiet(page, found);
});

test('MT-115: an Einlage in an Einzelunternehmen', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'eigenbeleg-vorgangsart-offen');
  const seen = await at(app, 'Was möchten Sie mit diesem Eigenbeleg belegen?');
  await choose(app, 'eine Einlage');
  await at(app, 'Welche Rechtsform hat das Unternehmen?', seen);
  await choose(app, 'Einzelunternehmen');
  // No GmbH notice for an Einzelunternehmen.
  await at(app, 'An welchem Tag wurde bezahlt oder das Geld bewegt?', seen);
  await type(app, '15.10.2026');
  await at(app, 'Wohin wurde das Geld eingelegt?', seen);
  await choose(app, 'bar in die Kasse des Betriebs');
  await at(app, 'Welche Kasse war es?', seen);
  await type(app, '');
  await at(app, 'Wer hat das Geld eingelegt?', seen);
  await type(app, 'Erika Musterfrau');
  await at(app, 'Wie viel Geld war es, in Euro?', seen);
  await type(app, '500,00');
  await at(app, 'Woher stammt das eingelegte Geld?', seen);
  await expect(app.locator('.question input, .question textarea').first()).toHaveValue('');
  await expect(app.getByRole('button', { name: 'Weiter', exact: true })).toBeDisabled();
  await type(app, 'vom privaten Girokonto abgehoben');
  await at(app, 'Ist der Betrag am selben Tag im Kassenbuch eingetragen?', seen);
  await choose(app, 'Nein');
  await at(app, 'Welche Nummer bekommt dieser Eigenbeleg?', seen);
  await type(app, '');
  await at(app, 'Welches Datum hat dieser Eigenbeleg?', seen);
  await type(app, '16.10.2026');
  await at(app, 'Zusammenfassung', seen);
  expect(seen).not.toContain(
    'Bitte beachten Sie: In einer GmbH, UG oder AG gehört das Geld der Gesellschaft.',
  );
  // "Kassenbuch: Nein" blocks nothing; the Kanzlei only gets a check hint.
  await expect(app.getByRole('button', { name: 'Weiter zum Abschluss' })).toBeEnabled();
  await signAndReadInAtKanzlei(page, app, testInfo.outputPath('einlage.pdf'));
  await expect(app).toContainText('Bargeld nicht am selben Tag im Kassenbuch: Kassenbuch prüfen.');
  await expectQuiet(page, found);
});
