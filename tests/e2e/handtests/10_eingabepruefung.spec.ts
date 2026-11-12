// Former manual tests of manual_tests/10_eingabepruefung.md, played in the test build (Tobias
// 2026-11-08: only what a virtual browser cannot check stays a manual test).
import { pathToFileURL } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  answerUntil,
  download,
  expectQuiet,
  formFields,
  heading,
  openTestApp,
  press,
  TEST_APP,
  toOverview,
} from '../app';

const SOFORT = formFields('sofortmeldung', true);
const BIRTH = 'Wann sind Sie geboren?';
const SV_NUMBER = 'Wie lautet Ihre Versicherungsnummer der Rentenversicherung?';

// Fictitious data only.
const PERSON: Readonly<Record<string, string>> = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  namensbestandteile: 'Nein',
  geburtsnameWieFamilienname: 'Ja',
  geburtsdatum: '17.05.1990',
  geborenInDeutschland: 'Ja',
  geburtsort: 'Musterstadt',
  geschlecht: 'weiblich',
  deutscheStaatsangehoerigkeit: 'Ja',
  versicherungsnummer: '65 170590 M 520',
  anschriftAusland: 'Nein',
  strassenname: 'Musterweg',
  hausnummer: '1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

const input = (app: Locator) => app.locator('.question input, .question textarea').first();
const warning = (app: Locator, text: string) => app.locator('.banner').filter({ hasText: text });
const summaryRow = (app: Locator, label: string) =>
  app.locator('.summary-row').filter({ has: app.page().getByText(label, { exact: true }) });

/** Types `value` and goes on with "Weiter"; waits until the next step shows. */
async function type(app: Locator, value: string): Promise<void> {
  const before = await heading(app);
  await input(app).fill(value);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** A button that moves on. */
async function next(app: Locator, label = 'Weiter'): Promise<void> {
  const before = await heading(app);
  await press(app, label);
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** Picks an entry of a list with search (a state). */
async function pick(app: Locator, typed: string, name: string): Promise<void> {
  const before = await heading(app);
  await app.getByRole('combobox').fill(typed);
  await app
    .getByRole('option')
    .filter({ hasText: new RegExp(`^${name}`) })
    .first()
    .click();
  if ((await heading(app)) === before) await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** A new Sofortmeldung from the start page, as the person, at the first question of the person. */
async function newPerson(page: Page): Promise<Locator> {
  const { app } = await openTestApp(page);
  await press(app, 'Personalfragebogen: Angaben für die Sofortmeldung');
  await press(app, 'Ich bin: Beschäftigte Person');
  await answerUntil(app, SOFORT, {}, 'familienname');
  return app;
}

/** Signs with the typed name, writes the PDF and reads it in at the Kanzlei station. */
async function signAndReadInAtKanzlei(page: Page, app: Locator, path: string): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText('Beschäftigte Person: abgeschlossen');
  const pdf = await download(page, app, 'PDF erstellen', path);
  await toOverview(app);
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await app.locator('input[type=file]').first().setInputFiles(pdf.path);
  await expect(app).toContainText('Vollständig');
}

test('MT-104: the input field takes no more characters than the report allows', async ({
  page,
}) => {
  const app = await newPerson(page);
  const name = input(app);
  await expect(name).toHaveAttribute('maxlength', '30');
  await name.pressSequentially('AbcdefghijAbcdefghijAbcdefghij');
  await expect(name).toHaveValue('AbcdefghijAbcdefghijAbcdefghij');
  await name.pressSequentially('Klmno');
  await expect(name).toHaveValue('AbcdefghijAbcdefghijAbcdefghij');
  // Inserted text (as pasted) is cut after 30 characters by the browser, without a message.
  await name.fill('');
  await name.focus();
  await page.keyboard.insertText('AbcdefghijAbcdefghijAbcdefghijKlmno');
  await expect(name).toHaveValue('AbcdefghijAbcdefghijAbcdefghij');
  await next(app);

  // The limits of the other fields, on a way that asks each of them.
  const answers = {
    ...PERSON,
    familienname: 'AbcdefghijAbcdefghijAbcdefghij',
    namensbestandteile: 'Ja',
    titel: 'Dr.',
    geburtsnameWieFamilienname: 'Nein',
    geburtsname: 'Schmidt',
    versicherungsnummer: '',
    anschriftAusland: 'Ja',
    strassenname: 'Musterstraat',
    postleitzahlAusland: '1234 AB',
    wohnort: 'Amsterdam',
  };
  for (const [id, limit] of [
    ['vorname', 30],
    ['titel', 20],
    ['geburtsname', 30],
    ['geburtsort', 34],
    ['anschriftStaat', 0],
    ['strassenname', 33],
    ['hausnummer', 9],
    ['anschriftZusatz', 40],
    ['postleitzahlAusland', 10],
    ['wohnort', 34],
  ] as const) {
    await answerUntil(app, SOFORT, answers, id);
    const field = SOFORT.find((f) => f.id === id);
    await expect.poll(() => heading(app)).toBe(field?.question ?? field?.label);
    if (id === 'anschriftStaat') {
      await pick(app, 'Niederl', 'Niederlande');
      continue;
    }
    await expect(input(app)).toHaveAttribute('maxlength', String(limit));
    const value = (answers as Record<string, string>)[id] ?? '';
    if (value === '') await next(app);
    else await type(app, value);
  }
  await answerUntil(app, SOFORT, answers);
  await expect(summaryRow(app, 'Familienname').locator('dd').first()).toHaveText(
    'AbcdefghijAbcdefghijAbcdefghij',
  );
});

test('MT-105: unusual characters in a name are only a hint', async ({ page }) => {
  const app = await newPerson(page);
  const characters = warning(
    app,
    'Hinweis: Die Meldung zur Sozialversicherung nimmt hier nur bestimmte Zeichen an',
  );
  const name = 'Wie lautet Ihr Familienname?';
  await type(app, 'Müller!');
  await expect(characters).toBeVisible();
  await expect(characters).toContainText(
    'So darf die Angabe für die Meldung zur Sozialversicherung nicht enden',
  );
  // A name as it stands in the passport is never refused, nor marked.
  for (const fine of ['Müller', "O'Brien", 'Nguyễn', 'Müller-Lüdenscheidt']) {
    await press(app, 'Zurück');
    await expect.poll(() => heading(app)).toBe(name);
    await type(app, fine);
    await expect(
      app.locator('.banner').filter({ hasText: 'Meldung zur Sozialversicherung' }),
    ).toHaveCount(0);
  }
  await answerUntil(app, SOFORT, { ...PERSON, familienname: 'Müller-Lüdenscheidt' }, 'hausnummer');
  await type(app, '-12');
  await expect(
    warning(
      app,
      'Für die Meldung zur Sozialversicherung muss die Angabe mit einem Buchstaben beginnen',
    ),
  ).toBeVisible();
  await press(app, 'Zurück');
  await expect.poll(() => heading(app)).toBe('Welche Hausnummer hat die Anschrift?');
  await expect(input(app)).toHaveValue('-12');
});

test('MT-106: a birth date outside the bounds', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  const error = app.locator('.question .field-error');
  await input(app).fill('31.12.1875');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Das Datum liegt zu weit zurück – frühestens 01.01.1876.');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  await input(app).fill('08.11.2026');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Das Datum liegt zu spät – spätestens heute.');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  // The bound moves with the calendar (from Sofortmeldung 0.4.0 on).
  await type(app, '07.11.2026');
  await press(app, 'Zurück');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  await type(app, '17.05.1990');
  await expectQuiet(page, found);
});

test('MT-134: a birth date typed with a two-digit year gets its century', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  const birth = 'Wann sind Sie geboren?';
  await expect.poll(() => heading(app)).toBe(birth);
  const input = app.locator('.question input').first();
  const enter = async (typed: string, kept: string) => {
    await input.fill('');
    await input.pressSequentially(typed);
    await press(app, 'Weiter');
    await expect.poll(() => heading(app)).not.toBe(birth);
    await press(app, 'Zurück');
    await expect.poll(() => heading(app)).toBe(birth);
    await expect(input).toHaveValue(kept);
  };

  // The dots come by themselves; the app adds the century once the answer is taken.
  await input.pressSequentially('170590');
  await expect(input).toHaveValue('17.05.90');
  await enter('170590', '17.05.1990');
  await enter('17.05.90', '17.05.1990');
  // Tomorrow cannot be a birth date: 100 years earlier.
  await enter('081126', '08.11.1926');
  await enter('17.05.1990', '17.05.1990');
  await expectQuiet(page, found);
});

/** From the birth date of the start point to the summary, with an address in the Netherlands. */
async function personAbroad(app: Locator, birth: string): Promise<void> {
  await expect.poll(() => heading(app)).toBe(BIRTH);
  await type(app, birth);
  await answerUntil(app, SOFORT, { ...PERSON, geschlecht: 'weiblich' }, 'versicherungsnummer');
  await input(app).fill('65 170590 M 520');
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).toBe('Liegt die Anschrift im Ausland?');
  await expect(app.locator('.question .field-error')).toHaveCount(0);
}

test('MT-107: check hints on the insurance number and a postcode abroad', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  const svHint =
    'Die Versicherungsnummer passt nicht ganz zu Geburtsdatum, Geburtsname oder Geschlecht.';
  const svDetail = 'Geburtsdatum in der Versicherungsnummer: 17.05.90; angegeben: 18.05.1990.';
  const plzHint =
    'Die Postleitzahl hat nicht das Format, das die Meldungen zur Sozialversicherung für diesen Staat verlangen.';
  const plzDetail =
    'Format in Niederlande: NNNN AA (N = Ziffer, A = Buchstabe), zum Beispiel 1234 FG.';
  const abroad = {
    ...PERSON,
    anschriftAusland: 'Ja',
    strassenname: 'Musterstraat',
    anschriftZusatz: '',
    wohnort: 'Amsterdam',
  };
  const toPostcode = async () => {
    await next(app, 'Ja');
    await pick(app, 'Niederl', 'Niederlande');
    await answerUntil(app, SOFORT, abroad, 'postleitzahlAusland');
  };

  // A valid check digit is no error even when the number does not quite fit the birth date.
  await personAbroad(app, '18.05.1990');
  await expect(warning(app, svHint)).toContainText(svDetail);
  await toPostcode();
  await type(app, '1234AB');
  await expect(warning(app, plzHint)).toBeVisible();
  await answerUntil(app, SOFORT, abroad);
  const checks = app.getByRole('group', { name: 'Bitte prüfen' });
  await expect(checks.locator('li').filter({ hasText: svHint })).toContainText('ändern');
  await expect(checks.locator('li').filter({ hasText: plzHint })).toBeVisible();
  // Hints block nothing.
  await signAndReadInAtKanzlei(page, app, testInfo.outputPath('hinweise.pdf'));
  await expect(app).toContainText('Prüfhinweise:');
  await expect(app).toContainText(svHint);
  await expect(app).toContainText(svDetail);
  await expect(app).toContainText('§ 2 VKVV; Gemeinsames Rundschreiben Meldeverfahren Tz. 3.1.1');
  await expect(app).toContainText(plzHint);
  await expect(app).toContainText(plzDetail);

  // Counter-check: fitting birth date and the postcode with its space — both hints are gone.
  await page.goto(
    `${pathToFileURL(TEST_APP).href}?startpunkt=sofortmeldung-person-ab-geburtsdatum`,
  );
  await personAbroad(app, '17.05.1990');
  await expect(warning(app, 'Die Versicherungsnummer passt nicht ganz')).toHaveCount(0);
  await toPostcode();
  await type(app, '1234 AB');
  await expect(warning(app, 'Die Postleitzahl hat nicht das Format')).toHaveCount(0);
  await answerUntil(app, SOFORT, abroad);
  await signAndReadInAtKanzlei(page, app, testInfo.outputPath('ohne-hinweise.pdf'));
  await expect(app).not.toContainText('Die Versicherungsnummer passt nicht ganz');
  await expect(app).not.toContainText('Die Postleitzahl hat nicht das Format');
  await expectQuiet(page, found);
});

test('MT-108: hours, degree of disability and number plate (drafts)', async ({ page }) => {
  // The employer of a part-time job is past the working time already; it is changed here.
  const { found, app } = await openTestApp(
    page,
    'personalfragebogen-teilzeit-berufskennziffer-offen',
  );
  const pfb = formFields('personalfragebogen', true);
  const seen: string[] = [];
  const at = async (text: string) => {
    await expect.poll(() => heading(app)).toBe(text);
    seen.push(text);
  };
  await answerUntil(app, pfb, {}, 'agArbeitszeitmodell');
  await at('Wie ist die Arbeitszeit vereinbart?');
  await next(app, 'feste Stunden an festen Wochentagen');
  await at('An welchen Wochentagen arbeitet die Person?');
  await app.getByLabel('Montag').check();
  await app.getByLabel('Freitag').check();
  await next(app);
  await at('Wie viele Stunden arbeitet die Person am Montag?');
  const error = app.locator('.question .field-error');
  await input(app).fill('25');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Höchstens 24.');
  await type(app, '11');
  await expect(warning(app, 'Ungewöhnlich hoher Wert – bitte prüfen.')).toBeVisible();
  // Required because it is ticked.
  await at('Wie viele Stunden arbeitet die Person am Freitag?');
  await expect(input(app)).toHaveValue('');
  await expect(app.getByRole('button', { name: 'Weiter', exact: true })).toBeDisabled();
  await type(app, '4');
  for (const day of ['Dienstag', 'Mittwoch', 'Donnerstag', 'Samstag', 'Sonntag']) {
    expect(seen).not.toContain(`Wie viele Stunden arbeitet die Person am ${day}?`);
  }

  await answerUntil(app, pfb, {}, 'agSchwerbehinderung');
  await next(app, 'einem schwerbehinderten Menschen gleichgestellt');
  await at('Welcher Grad der Behinderung ist festgestellt?');
  await input(app).fill('25');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Nur in Schritten von 10 möglich.');
  await input(app).fill('10');
  await press(app, 'Weiter');
  await expect(error).toHaveText('Mindestens 20.');
  await type(app, '30');

  // The number plate is written as on the plate.
  await page.goto(pathToFileURL(TEST_APP).href);
  await press(app, 'Dienstwagen: Überlassung');
  await press(app, 'Ich bin: Arbeitgeber');
  const car = formFields('dienstwagen', true);
  const answers = {
    agFirma: 'Beispiel Bau GmbH',
    agFamilienname: 'Musterfrau',
    agVorname: 'Erika',
    agKennzeichen: 'ka ab 1234e',
    agFahrzeug: 'Beispielmarke Kombi',
    agErstzulassung: '01.03.2024',
    agAnschaffung: '01.04.2024',
    agListenpreis: '45.000,00',
    agSonderausstattung: '0,00',
    agAntrieb: 'verbrenner',
    agUeberlassenAb: '01.11.2026',
    agPrivatnutzung: 'Ja',
    agFahrtenWohnung: 'Nein',
  };
  await answerUntil(app, car, answers, 'agSonderfaelle');
  await app.getByLabel(/^keine/).check();
  await next(app);
  await answerUntil(app, car, answers);
  await expect(summaryRow(app, 'Amtliches Kennzeichen').locator('dd').first()).toHaveText(
    'KA-AB 1234E',
  );
  await expectQuiet(page, found);
});

test('MT-117: the letter of the insurance number does not fit the birth name', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'sofortmeldung-person-ab-geburtsdatum');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  await press(app, 'Zurück');
  await expect
    .poll(() => heading(app))
    .toBe('Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Musterfrau“?');
  await next(app, 'Nein');
  await expect.poll(() => heading(app)).toBe('Wie lautet Ihr Geburtsname?');
  await type(app, 'Schmidt');
  await expect.poll(() => heading(app)).toBe(BIRTH);
  await type(app, '17.05.1990');
  await answerUntil(app, SOFORT, PERSON, 'versicherungsnummer');
  await type(app, '65 170590 M 520');
  const hint = warning(
    app,
    'Die Versicherungsnummer passt nicht ganz zu Geburtsdatum, Geburtsname oder Geschlecht.',
  );
  await expect(hint).toContainText(
    'Buchstabe in der Versicherungsnummer: M; Anfangsbuchstabe des Geburtsnamens: S.',
  );
  // It can be right (the number stays after a change of name): nothing is blocked.
  await expect.poll(() => heading(app)).toBe('Liegt die Anschrift im Ausland?');
  await answerUntil(app, SOFORT, PERSON);
  const checks = app.getByRole('group', { name: 'Bitte prüfen' });
  await expect(checks).toBeInViewport();
  // Hints for the Kanzlei only are not shown to the person.
  await expect(checks.locator('li')).toHaveCount(1);
  await checks.getByRole('button', { name: 'ändern' }).click();
  await expect.poll(() => heading(app)).toBe(SV_NUMBER);
  await expectQuiet(page, found);
});
