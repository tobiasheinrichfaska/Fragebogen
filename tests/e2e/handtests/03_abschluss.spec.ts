// Former manual tests of manual_tests/03_abschluss.md, played in the test build (Tobias
// 2026-11-08: only what a virtual browser cannot check stays a manual test).
import { pathToFileURL } from 'node:url';
import { expect, test, type Locator } from '@playwright/test';
import {
  answerUntil,
  expectQuiet,
  formFields,
  heading,
  openTestApp,
  press,
  sign,
  TEST_APP,
  toOverview,
} from '../app';

const SOFORT = formFields('sofortmeldung', true);
const CONFIRM_PERSON = 'Ich versichere, dass meine Angaben richtig und vollständig sind.';
const COMPLETE = 'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.';

const EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agBranche: 'bau',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agPersonalnummer: '',
  agBeschaeftigungsbeginn: '02.11.2026',
};

const person = (geburtsdatum: string) => ({
  geburtsdatum,
  geborenInDeutschland: 'Ja',
  geburtsort: 'Musterstadt',
  geschlecht: 'weiblich',
  deutscheStaatsangehoerigkeit: 'Ja',
  // Left out: the sample number carries another birth date.
  versicherungsnummer: '',
  anschriftAusland: 'Nein',
  strassenname: 'Musterweg',
  hausnummer: '1',
  anschriftZusatz: '',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
});

/** A role of the overview, by its label. */
const roleRow = (app: Locator, label: string) =>
  app.locator('.roles li').filter({ has: app.page().getByText(label, { exact: true }) });

const card = (app: Locator, title: string) =>
  app
    .locator('.card')
    .filter({ has: app.page().locator('h2', { hasText: new RegExp(`^${title}$`) }) });

/** From the summary: confirm and sign with a typed name. */
async function signTyped(app: Locator, confirmation: string, name: string): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await press(app, confirmation);
  await press(app, 'Namen tippen');
  await app.getByLabel('Ihr vollständiger Name').fill(name);
  await press(app, 'Unterschreiben und abschließen');
}

test('MT-20: the employer completes without a signature', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-zusammenfassung');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  await press(app, 'Weiter zum Abschluss');
  const overview = app.getByRole('group', { name: 'Was Sie abschließen' });
  await expect(overview).toContainText('Das schließen Sie ab:');
  await expect(overview.locator('h3').first()).toBeVisible();
  await expect(overview).toContainText('Beispiel Bau GmbH');
  // Read only: changing goes back to the summary.
  await expect(overview.getByRole('button')).toHaveCount(0);
  await expect(app.getByRole('button', { name: 'Zurück zur Zusammenfassung' })).toBeVisible();
  const withoutSignature = app.getByRole('radio', { name: 'Ohne Unterschrift abschließen' });
  await expect(withoutSignature).toBeVisible();

  await press(app, 'Ich bestätige die Angaben des Arbeitgebers.');
  await withoutSignature.click();
  const complete = app.getByRole('button', { name: 'Abschließen', exact: true });
  await expect(complete).toBeEnabled();
  await expect(app.getByRole('button', { name: 'Unterschreiben und abschließen' })).toHaveCount(0);
  await complete.click();
  await expect.poll(() => heading(app)).toBe('Arbeitgeber: abgeschlossen');
  await expect(app).toContainText(
    /Abgeschlossen am \d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr laut diesem Gerät \(Fassung 1\)/,
  );
  await expect(app).toContainText(
    /Systemvermerk: [^·]+ · [^·]+ · Eingabe: [^·]+ · App \d+\.\d+\.\d+/,
  );
  await expect(app).toContainText(/Prüfwert \(SHA-256\): [0-9a-f]{64}/);
  // The person is still missing: handing the device on comes first (Tobias 2026-11-12).
  await expect(app.locator('.nav button.primary')).toHaveText('Gerät weitergeben – zur Übersicht');
  await expectQuiet(page, found);
});

test('MT-21: the person must sign; a single dot is refused, a full signature completes', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-zum-unterschreiben');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  const employer = app.locator('.summary-section.other-role');
  await expect(employer.locator('h3')).toHaveText(
    'Angaben: Arbeitgeber (abgeschlossen, nur lesen)',
  );
  for (const value of ['Beispiel Bau GmbH', '12345671', '02.11.2026']) {
    await expect(employer).toContainText(value);
  }
  await expect(employer.getByRole('button')).toHaveCount(0);

  await press(app, 'Weiter zum Abschluss');
  const done = app.getByRole('button', { name: 'Unterschreiben und abschließen' });
  await expect(done).toBeDisabled();
  await expect(app.getByRole('radio', { name: 'Ohne Unterschrift abschließen' })).toHaveCount(0);
  await press(app, CONFIRM_PERSON);
  await expect(done).toBeDisabled();
  await sign(page);
  await expect(done).toBeEnabled();
  await press(app, 'Unterschrift löschen');
  await expect(done).toBeDisabled();

  // A single tap is a stroke of one point: allowed to press, refused by the seal.
  await app.locator('canvas.signature-pad').click();
  await expect(done).toBeEnabled();
  await done.click();
  const refused = app.getByRole('alert');
  await expect(refused).toContainText('Die Unterschrift ist leer oder ungültig.');
  await expect(refused).toContainText(
    'Die gezeichnete Unterschrift ist zu kurz. Bitte vollständig unterschreiben.',
  );
  expect(await heading(app)).toBe('Abschließen: Beschäftigte Person');

  await press(app, 'Unterschrift löschen');
  await sign(page);
  await expect(done).toBeEnabled();
  await done.click();
  await expect.poll(() => heading(app)).toBe('Beschäftigte Person: abgeschlossen');
  await expect(app).toContainText(/Unterschrieben am \d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr/);
  // Every part done: the PDF comes first, handing on steps back (Tobias 2026-11-12).
  await expect(app).toContainText(
    'Alle nötigen Teile sind abgeschlossen. Erstellen Sie jetzt die PDF.',
  );
  await expect(app.locator('.nav button.primary')).toHaveText('PDF erstellen');
  await expect(app.getByRole('button', { name: 'Gerät weitergeben – zur Übersicht' })).toHaveCount(
    0,
  );

  await press(app, 'Zur Übersicht');
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');
  await expect(roleRow(app, 'Arbeitgeber')).toContainText('abgeschlossen');
  await expect(card(app, 'Stand').locator('.banner-success')).toContainText(COMPLETE);
  await expectQuiet(page, found);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true });

  test('MT-21: a finger draws the signature and the page does not scroll with it', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'touch strokes go through the Chrome DevTools Protocol');
    const { found, app } = await openTestApp(page, 'sofortmeldung-zum-unterschreiben');
    await press(app, 'Weiter zum Abschluss');
    await press(app, CONFIRM_PERSON);
    const pad = app.locator('canvas.signature-pad');
    await expect(pad).toHaveCSS('touch-action', 'none');
    await pad.scrollIntoViewIfNeeded();
    const scroll = () =>
      page.evaluate(() => ({
        y: scrollY,
        max: document.documentElement.scrollHeight - innerHeight,
      }));
    const before = await scroll();
    // Without room to scroll the check below would prove nothing.
    expect(before.max).toBeGreaterThan(0);
    const box = await pad.boundingBox();
    if (!box) throw new Error('no signature pad');

    // Mostly vertical: exactly the movement that would pan the page without touch-action: none.
    const cdp = await page.context().newCDPSession(page);
    const at = (fx: number, fy: number) => ({
      x: box.x + box.width * fx,
      y: box.y + box.height * fy,
    });
    const path = [
      [0.2, 0.1],
      [0.25, 0.5],
      [0.3, 0.9],
      [0.4, 0.5],
      [0.5, 0.1],
      [0.6, 0.5],
      [0.7, 0.9],
    ] as const;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at(0.2, 0.1)] });
    for (const [fx, fy] of path.slice(1)) {
      for (let step = 1; step <= 4; step++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [at(fx, fy)],
        });
      }
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    expect((await scroll()).y).toBe(before.y);
    const done = app.getByRole('button', { name: 'Unterschreiben und abschließen' });
    await expect(done).toBeEnabled();
    await done.click();
    await expect.poll(() => heading(app)).toBe('Beschäftigte Person: abgeschlossen');
    await expect(app).toContainText(/Eingabe: [^·]*touch/);
    await expectQuiet(page, found);
  });
});

test('MT-22: a typed name must be the full name', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-zum-unterschreiben');
  await press(app, 'Weiter zum Abschluss');
  await press(app, CONFIRM_PERSON);
  await press(app, 'Namen tippen');
  const name = app.getByLabel('Ihr vollständiger Name');
  await name.fill('E');
  await press(app, 'Unterschreiben und abschließen');
  const refused = app.getByRole('alert');
  await expect(refused).toContainText('Die Unterschrift ist leer oder ungültig.');
  await expect(refused).toContainText('Bitte den vollständigen Namen eintippen.');
  expect(await heading(app)).toBe('Abschließen: Beschäftigte Person');

  await name.fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect.poll(() => heading(app)).toBe('Beschäftigte Person: abgeschlossen');
  await expectQuiet(page, found);
});

// The day before the 18th birthday (this device's date): still a minor.
test('MT-23: a minor needs the signature of the legal representative', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe('Wann sind Sie geboren?');
  await answerUntil(app, SOFORT, person('08.11.2008'));
  await signTyped(app, CONFIRM_PERSON, 'Erika Musterfrau');
  await toOverview(app);

  const guardian = roleRow(app, 'Gesetzliche Vertretung');
  await expect(guardian).toContainText(
    'Erforderlich: Die Person ist am Tag ihrer Unterschrift minderjährig.',
  );
  const stand = card(app, 'Stand');
  await expect(stand).toContainText(
    'Die Person ist am Tag ihrer Unterschrift minderjährig. Die gesetzliche Vertretung muss mit Namen unterschreiben.',
  );
  const pdf = app.getByRole('button', { name: 'PDF erstellen' });
  await expect(pdf).toBeDisabled();

  await press(guardian, 'Ich bin: Gesetzliche Vertretung');
  await answerUntil(app, SOFORT, { vertretungName: 'Max Musterfrau' });
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Als gesetzliche Vertretung der minderjährigen Person');
  await sign(page);
  await press(app, 'Unterschreiben und abschließen');
  await expect.poll(() => heading(app)).toBe('Gesetzliche Vertretung: abgeschlossen');
  await toOverview(app);
  await expect(roleRow(app, 'Gesetzliche Vertretung')).toContainText('unterschrieben');
  await expect(stand.locator('.banner-success')).toContainText(COMPLETE);
  await expect(pdf).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-23: on the 18th birthday the person signs alone', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe('Wann sind Sie geboren?');
  await answerUntil(app, SOFORT, person('07.11.2008'));
  await signTyped(app, CONFIRM_PERSON, 'Erika Musterfrau');
  await toOverview(app);
  await expect(roleRow(app, 'Gesetzliche Vertretung')).toContainText(
    'Nicht erforderlich: Die Person ist volljährig.',
  );
  await expect(card(app, 'Stand').locator('.banner-success')).toContainText(COMPLETE);
  await expect(app.getByRole('button', { name: 'PDF erstellen' })).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-24: a signature taken back, then a new version once the employer confirmed it', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-unterschrieben');
  const personRow = roleRow(app, 'Beschäftigte Person');
  await press(personRow, 'Unterschrift zurücknehmen');
  // The app goes straight on to the person's summary; the overview shows the reopened part.
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  await press(app, 'Unterbrechen – zur Übersicht');
  await expect(personRow).toContainText('begonnen, nicht abgeschlossen');

  // "Weitermachen" opens the first question left open (the optional address addition).
  await press(personRow, 'Weitermachen');
  await answerUntil(app, SOFORT, {
    familienname: 'Musterfrau',
    vorname: 'Erika',
    namensbestandteile: 'Nein',
    geburtsnameWieFamilienname: 'Ja',
    ...person('17.05.1990'),
    versicherungsnummer: '65 170590 M 520',
  });
  await signTyped(app, CONFIRM_PERSON, 'Erika Musterfrau');
  await expect.poll(() => heading(app)).toBe('Beschäftigte Person: abgeschlossen');

  await toOverview(app);
  await press(roleRow(app, 'Arbeitgeber'), 'Ich bin: Arbeitgeber');
  await answerUntil(app, SOFORT, EMPLOYER);
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Ich bestätige die Angaben des Arbeitgebers.');
  await press(app, 'Ohne Unterschrift abschließen');
  await press(app, 'Abschließen');
  await expect.poll(() => heading(app)).toBe('Arbeitgeber: abgeschlossen');
  await toOverview(app);

  // The employer has confirmed this version of the person's part: only a new version is left.
  await expect(personRow.getByRole('button', { name: 'Unterschrift zurücknehmen' })).toHaveCount(0);
  await expect(personRow.getByRole('button', { name: 'Neue Fassung beginnen' })).toBeVisible();
  await expect(
    roleRow(app, 'Arbeitgeber').getByRole('button', { name: 'Abschluss zurücknehmen' }),
  ).toBeVisible();

  await press(personRow, 'Neue Fassung beginnen');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  await expect(app).toContainText('Musterweg');
  await expect(app).toContainText('17.05.1990');
  const residence = app.locator('.summary-row').filter({ hasText: 'Musterstadt' }).last();
  await press(residence, 'ändern');
  await expect.poll(() => heading(app)).toBe('In welchem Ort wohnen Sie?');
  await app.locator('.question input').first().fill('Neustadt');
  await press(app, 'Zurück zur Zusammenfassung');
  await expect.poll(() => heading(app)).toBe('Zusammenfassung');
  await expect(app).toContainText('Neustadt');
  await signTyped(app, CONFIRM_PERSON, 'Erika Musterfrau');
  await toOverview(app);
  await expect(personRow).toContainText('unterschrieben (Fassung 2)');
  await expect(card(app, 'Stand').locator('.banner-success')).toContainText(COMPLETE);
  await expectQuiet(page, found);
});

test("MT-25: the employer's master-data link starts the next questionnaire with its data", async ({
  page,
  browserName,
}) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-zusammenfassung');
  const section = app
    .locator('.summary-section')
    .filter({ has: page.locator('h3', { hasText: 'Stammdaten für das nächste Mal' }) });
  if (browserName === 'chromium') {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await press(section, 'Kopieren');
    await expect(section).toContainText('Link kopiert.');
  }
  const link = await section.getByLabel('Stammdaten-Link').inputValue();
  const fragment = link.slice(link.indexOf('#'));
  expect(fragment).toMatch(/^#stammdaten=1&/);
  for (const part of ['formular=sofortmeldung', 'betriebsnummer=12345671', 'branche=bau']) {
    expect(fragment.split('&')).toContain(part);
  }
  expect(fragment).toMatch(/&firma=Beispiel(\+|%20)Bau(\+|%20)GmbH(&|$)/);
  // Only master data: nothing about the person.
  for (const personal of ['Musterfrau', 'Erika', '02.11.2026'])
    expect(fragment).not.toContain(personal);

  // Opened like a bookmark: the plain build with only the fragment (a hash change alone would not
  // reload the page).
  await page.goto(pathToFileURL(TEST_APP).href + fragment);
  await page.reload();
  await expect(app).toContainText(
    'Neuer Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ aus Ihrem Lesezeichen.',
  );
  await expect.poll(() => heading(app)).toBe('Wer füllt jetzt aus?');
  await press(app, 'Ich bin: Arbeitgeber');
  await expect(app).toContainText('Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.');
  await expect.poll(() => heading(app)).toBe('Wie lautet die Firma des Arbeitgebers?');
  await expect(app.locator('.question input').first()).toHaveValue('Beispiel Bau GmbH');
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).toBe('Wie lautet die Betriebsnummer?');
  await expect(app.locator('.question input').first()).toHaveValue(/^1234 ?5671$/);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).toBe('In welchem Wirtschaftsbereich arbeitet die Person?');
  await expect(app.getByRole('radio', { name: 'Baugewerbe' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  // A letter in the Betriebsnummer: that datum is refused with its reason.
  await page.goto(
    pathToFileURL(TEST_APP).href +
      fragment.replace('betriebsnummer=12345671', 'betriebsnummer=1234567X'),
  );
  await page.reload();
  await press(app, 'Ich bin: Arbeitgeber');
  await expect(
    app.locator('.banner-warning').filter({ hasText: 'Stammdaten aus Ihrem Lesezeichen' }),
  ).toContainText('Die Betriebsnummer hat genau 8 Ziffern.');
  await expect(app.locator('.question input').first()).toHaveValue('Beispiel Bau GmbH');
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).toBe('Wie lautet die Betriebsnummer?');
  await expect(app.locator('.question input').first()).toHaveValue('');
  await expectQuiet(page, found);
});
