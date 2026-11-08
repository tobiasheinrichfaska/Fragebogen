// Former manual tests of manual_tests/07_sv_beurteilung.md, played in the test build (Tobias
// 2026-11-08: only what a virtual browser cannot check stays a manual test). Most cases end where
// the tester ends: the PDF read in at the Kanzlei, with its proposals and check hints.
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import {
  download,
  expectQuiet,
  formFields,
  heading,
  openTestApp,
  pdfPages,
  press,
  sign,
} from '../app';

const FIELDS = formFields('personalfragebogen', true) as (ReturnType<typeof formFields>[number] & {
  optionsFrom?: string;
})[];

// Every case builds its own questionnaire; many write and read PDFs, so they spread over workers.
test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
});

// Fictitious data only; values as a tester types them, choices by option id.
const EMPLOYER: Readonly<Record<string, string>> = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  // Voluntary when asked, required once the job is a Minijob.
  agSteuernummer: '93815/08152',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '01.09.2026',
  agVertragsbeginnAbweichend: 'Nein',
  agFrueherBeschaeftigt: 'Nein',
  agArbeitsortBundesland: 'BW',
  agPrivathaushalt: 'Nein',
  agLandwirtschaft: 'Nein',
  agSozialkasse: 'nein',
  agSeeschifffahrt: 'Nein',
  agAuslandSvBetrieb: 'Nein',
  agBetriebsart: 'keine',
  agHeimarbeit: 'Nein',
  agSonderstatus: 'keiner',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2.500,00',
  agBeschaeftigungsart: 'svpflichtig',
  agTaetigkeit: 'Verkauf',
  agBeziehung: 'keine',
  agArbeitnehmerueberlassung: 'Nein',
  agBefristet: 'Nein',
  agArbeitszeitform: 'teilzeit',
  agBesteuerung: 'elstam',
  agArbeitszeitmodell: 'wechselnd',
  agWochenstunden: '10',
  agArbeitstageProWoche: '3',
  agWertguthaben: 'Nein',
  agUrlaubstage: '20',
  agUrlaubBezug: 'tage5',
  agVwl: 'Nein',
  agBav: 'keine',
  agSchwerbehinderung: 'nein',
};

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
  zahlungsweg: 'ueberweisung',
  iban: 'DE89 3704 0044 0532 0130 00',
  kontoinhaberSelbst: 'Ja',
  status: 'arbeitnehmer',
  bezugRente: 'Nein',
  grundsicherung: 'Nein',
  elternzeitAnderswo: 'Nein',
  artLautVereinbarung: 'festeStelle',
  weitereBeschaeftigung: 'Nein',
  krankenversicherung: 'gesetzlich',
  krankenkasse: 'Techniker Krankenkasse',
  versorgungswerk: 'nein',
  steuerId: '86095742719',
  dienstverhaeltnis: 'erstes',
  steuerklasse: '1',
  kinderfreibetraege: '0',
  kirchensteuer: 'keine',
  kinder: 'Nein',
  schulabschluss: 'abitur',
  berufsabschluss: 'bachelor',
  sozialkasseBetrieb: 'nein',
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A heading as the app shows it: `{id}` placeholders hold an earlier answer („…“).
const headingOf = (field: (typeof FIELDS)[number]) =>
  new RegExp(
    `^${(field.question ?? field.label)
      .split(/ ?\{[a-zA-Z0-9]+\}/)
      .map(escape)
      .join(' „[^“]*“')}$`,
  );
const fieldAt = (current: string) => FIELDS.find((field) => headingOf(field).test(current));

async function expectHeading(app: Locator, text: string): Promise<void> {
  await expect.poll(() => heading(app)).toBe(text);
}

/** "Weiter" itself — in a table step "Weitere Zeile: …" starts with the same word. */
const next = (app: Locator) => app.getByRole('button', { name: 'Weiter', exact: true }).click();

/** One option of a yes/no or single choice; it moves on at once. */
const choose = (app: Locator, label: string) =>
  app.locator('.question').getByRole('radio', { name: label, exact: true }).click();

async function type(app: Locator, value: string): Promise<void> {
  const input = app.locator('.question input, .question textarea').first();
  await input.fill(value);
  // An open pick list would cover "Weiter".
  if ((await input.getAttribute('role')) === 'combobox') await input.press('Escape');
}

/** "Zurück" until the question `text` shows again. */
async function backTo(app: Locator, text: string): Promise<void> {
  for (let i = 0; i < 60 && (await heading(app)) !== text; i++) {
    const current = await heading(app);
    await app.getByRole('button', { name: 'Zurück', exact: true }).click();
    await expect.poll(() => heading(app)).not.toBe(current);
  }
  await expectHeading(app, text);
}

interface Walk {
  /** Stops at this question (field id) instead of the summary. */
  stopAt?: string;
  /** Collects the field id of every question passed. */
  seen?: string[];
  /** Runs on every step before it is answered. */
  each?: () => Promise<void>;
}

/**
 * Like the tester: answers the questions named in `answers` (by field id) and goes on with
 * "Weiter" past every other one (prefilled or voluntary) until the summary or `stopAt`. A notice
 * is confirmed with its check box; a required question without an answer stops the walk loudly.
 */
async function forward(
  app: Locator,
  answers: Readonly<Record<string, string>> = {},
  walk: Walk = {},
): Promise<void> {
  for (let i = 0; i < 150; i++) {
    const current = await heading(app);
    if (current === 'Zusammenfassung') return;
    const field = fieldAt(current);
    if (walk.stopAt !== undefined && field?.id === walk.stopAt) return;
    await walk.each?.();
    if (field) walk.seen?.push(field.id);
    const value = field ? answers[field.id] : undefined;
    if (!field) {
      const box = app.locator('.card input[type=checkbox]');
      if ((await box.count()) === 0) throw new Error(`unknown step "${current}"`);
      await box.first().check();
      await next(app);
    } else if (value === undefined) {
      const go = app.getByRole('button', { name: 'Weiter', exact: true });
      if (await go.isDisabled()) throw new Error(`"${current}" needs an answer`);
      await go.click();
    } else if (field.type === 'choice' && field.optionsFrom === undefined) {
      await choose(app, field.options?.find((option) => option.id === value)?.label ?? value);
    } else if (field.type === 'boolean') {
      await choose(app, value);
    } else {
      await type(app, value);
      await next(app);
    }
    await expect.poll(() => heading(app)).not.toBe(current);
  }
  throw new Error('the summary was not reached');
}

/** Adds one row to a table step: its cells by their question, typed or chosen. */
async function addRow(app: Locator, row: Readonly<Record<string, string>>): Promise<void> {
  await app
    .locator('.question')
    .getByRole('button', { name: /hinzufügen$|^Weitere Zeile/ })
    .click();
  const fieldset = app.locator('fieldset.table-row').last();
  for (const [cell, value] of Object.entries(row)) {
    const box = fieldset.locator('.table-cell').filter({ hasText: new RegExp(`^${escape(cell)}`) });
    const input = box.locator('input, textarea');
    if ((await input.count()) > 0) await input.first().fill(value);
    else await box.getByRole('radio', { name: value, exact: true }).click();
  }
}

async function startNew(app: Locator, role: 'Arbeitgeber' | 'Beschäftigte Person'): Promise<void> {
  await press(app, 'Personalfragebogen: Angaben für die Lohnabrechnung');
  await press(app, `Ich bin: ${role}`);
}

async function closeEmployer(app: Locator): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Ich bestätige die Angaben des Arbeitgebers.');
  await press(app, 'Ohne Unterschrift abschließen');
  await press(app, 'Abschließen');
}

async function closePerson(page: Page, app: Locator): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await press(app, 'Ich versichere, dass meine Angaben richtig und vollständig sind.');
  await sign(page);
  await press(app, 'Unterschreiben und abschließen');
}

/**
 * A new questionnaire from the start page: the person fills in and signs, then the employer takes
 * the device — without the person's part the Kanzlei proposes nothing ("Es fehlt noch der Teil").
 */
async function personThenEmployer(
  page: Page,
  app: Locator,
  person: Readonly<Record<string, string>>,
): Promise<void> {
  await startNew(app, 'Beschäftigte Person');
  await forward(app, person);
  await closePerson(page, app);
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await press(app, 'Ich bin: Arbeitgeber');
}

/** "PDF erstellen" on the screen after closing a part; returns the saved file. */
async function pdf(page: Page, app: Locator, testInfo: TestInfo, name: string): Promise<string> {
  return (await download(page, app, 'PDF erstellen', testInfo.outputPath(name))).path;
}

/** From the screen after closing to the Kanzlei, with that PDF read in. */
async function readInAtKanzlei(app: Locator, file: string): Promise<void> {
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await app.locator('input[type=file]').first().setInputFiles(file);
  await expect(app).toContainText('1 Datei(en)');
}

const banner = (app: Locator, title: string) =>
  app.locator('.banner').filter({ has: app.page().getByText(title, { exact: true }) });

const PROPOSALS = 'Vorschläge (die App entscheidet nicht – bitte prüfen):';

/** One proposal of the Kanzlei card by its label: "Personengruppe: 102 – <reason>". */
const proposal = (app: Locator, label: string) =>
  banner(app, PROPOSALS)
    .locator('li')
    .filter({ hasText: new RegExp(`^${escape(label)}: `) });

const hints = (app: Locator) => banner(app, 'Prüfhinweise:');

/** The proposal's value with a reason after it; `check`: ends with "Bitte prüfen." or not. */
async function expectProposal(
  app: Locator,
  label: string,
  value: string,
  check: boolean,
): Promise<Locator> {
  const line = proposal(app, label);
  await expect(line).toHaveText(new RegExp(`^${escape(label)}: ${escape(value)} – \\S`));
  if (check) await expect(line).toHaveText(/ Bitte prüfen\.$/);
  else await expect(line).not.toHaveText(/ Bitte prüfen\.$/);
  return line;
}

const PERSONENGRUPPE = 'Personengruppe';
const BEITRAGSGRUPPEN = 'Beitragsgruppen (KV RV AV PV)';
const UEBERGANG = 'Kennzeichen Übergangsbereich';
const TAETIGKEIT = 'Tätigkeitsschlüssel';

test('MT-60: the pay comes before the kind of employment', async ({ page }) => {
  const { found, app } = await openTestApp(page);
  await startNew(app, 'Arbeitgeber');
  const seen: string[] = [];
  await forward(app, EMPLOYER, { stopAt: 'agEntgeltArt', seen });
  // Right after the last of the preliminary questions.
  expect(seen.at(-1)).toBe('agSonderstatus');
  expect(seen).toContain('agHeimarbeit');
  await expectHeading(app, 'Wie wird die Person bezahlt?');
  await expect(
    app.getByRole('radio', { name: 'kein Arbeitsentgelt (nur Vorruhestandsgeld)', exact: true }),
  ).toBeVisible();

  // An hourly wage asks for the expected monthly pay after the amount.
  await choose(app, 'Stundenlohn');
  await expectHeading(app, 'Wie hoch ist der Stundenlohn brutto?');
  await type(app, '15,00');
  await next(app);
  await expectHeading(app, 'Mit welchem Verdienst im Monat rechnen Sie im Durchschnitt?');
  await backTo(app, 'Wie wird die Person bezahlt?');

  await choose(app, 'festes Monatsentgelt');
  await expectHeading(app, 'Wie hoch ist das Monatsentgelt brutto?');
  await type(app, '1.500,00');
  await next(app);
  await expectHeading(app, 'Welche Einmalzahlungen sind vereinbart?');
  await next(app);
  const after: string[] = [];
  await forward(app, {}, { stopAt: 'agBeschaeftigungsart', seen: after });
  expect(after).not.toContain('agEntgeltArt');
  await expectHeading(app, 'Wie ist die Beschäftigung vorgesehen?');
  const help = app.locator('.question .help');
  await expect(help).toContainText('603 € im Monat');
  await expect(help).toContainText('7.236 € einschließlich zugesagter Einmalzahlungen');
  await expectQuiet(page, found);
});

for (const [betrag, gruppe] of [
  ['550,00', '102'],
  ['300,00', '121'],
] as const) {
  test(`MT-61: an Azubi with ${betrag} € gets Personengruppe ${gruppe}, no Minijob hint`, async ({
    page,
  }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(page, 'personalfragebogen-azubi-entgelt-offen');
    await expectHeading(app, 'Wie wird die Person bezahlt?');
    await choose(app, 'Ausbildungsvergütung');
    await addRow(app, {
      Ausbildungsjahr: '1',
      Vergütung: betrag,
      'gültig ab': '01.09.2026',
    });
    await next(app);
    await forward(app, {}, { stopAt: 'agBeschaeftigungsart' });
    await choose(app, 'Ausbildung');
    await forward(app, {
      agAusbildungsberuf: 'Verkäuferin',
      agAusbildungEnde: '31.08.2029',
      agAusserbetrieblich: 'Nein',
    });
    await closeEmployer(app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'azubi.pdf'));
    const line = await expectProposal(app, PERSONENGRUPPE, gruppe, false);
    if (gruppe === '121') await expect(line).toContainText('Geringverdienergrenze: 325,00 €');
    await expect(app.locator('.banner li').filter({ hasText: 'Minijob' })).toHaveCount(0);
    await expectQuiet(page, found);
  });
}

for (const anspruch of ['Ja', 'Nein'] as const) {
  test(`MT-62: a Minijob with Weihnachtsgeld, Rechtsanspruch ${anspruch}`, async ({
    page,
  }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(page);
    await personThenEmployer(page, app, {
      ...PERSON,
      artLautVereinbarung: 'minijob',
      rvBefreiungWunsch: 'nein',
      steuerart: 'elstam',
    });
    await forward(app, { ...EMPLOYER, agMonatsentgelt: '600,00' }, { stopAt: 'agEinmalzahlungen' });
    await addRow(app, {
      Art: 'Weihnachtsgeld',
      Betrag: '300,00',
      'Monat der Zahlung': 'November',
      'Rechtsanspruch?': anspruch,
    });
    await next(app);
    await forward(app, { ...EMPLOYER, agBeschaeftigungsart: 'minijob' });
    await closeEmployer(app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'minijob.pdf'));
    const minijobHint = app.getByText(
      /^Als Minijob vorgesehen, aber der Verdienst übersteigt die Geringfügigkeitsgrenze im Jahr/,
    );
    if (anspruch === 'Ja') {
      await expect(minijobHint).toBeVisible();
      await expect(hints(app)).toContainText(
        '12 × 600,00 € + Einmalzahlungen mit Anspruch 300,00 € = 7.500,00 € im Jahr; Geringfügigkeitsgrenze 2026: 12 × 603,00 € = 7.236,00 €.',
      );
      await expectProposal(app, PERSONENGRUPPE, '101', true);
    } else {
      await expect(minijobHint).toHaveCount(0);
      await expectProposal(app, PERSONENGRUPPE, '109', false);
    }
    await expectQuiet(page, found);
  });
}

const SPECIAL_CASES = [
  {
    name: 'Vorstand einer Aktiengesellschaft',
    field: 'agSonderstatus',
    option: 'Mitglied des Vorstands einer Aktiengesellschaft',
    message: 'Mitglied des Vorstands einer Aktiengesellschaft:',
  },
  {
    name: 'Geistliche',
    field: 'agSonderstatus',
    option: 'Geistliche(r), Mitglied einer geistlichen Genossenschaft, Diakonisse oder ähnlich',
    message: 'Geistliche, Mitglieder geistlicher Genossenschaften',
  },
  {
    name: 'beamtenrechtliche Absicherung',
    field: 'agSonderstatus',
    option:
      'Anspruch auf Fortzahlung der Bezüge und Beihilfe bei Krankheit nach beamtenrechtlichen Grundsätzen (z. B. Lehrkraft an einer privaten Ersatzschule)',
    message: 'nach beamtenrechtlichen Grundsätzen',
  },
  {
    name: 'knappschaftlicher Betrieb',
    field: 'agBetriebsart',
    option: 'knappschaftlicher Betrieb (Bergbau)',
    message: 'Beschäftigung in einem knappschaftlichen Betrieb',
  },
] as const;

for (const special of SPECIAL_CASES) {
  test(`MT-63: a special case blocks closing and passing on (${special.name})`, async ({
    page,
  }) => {
    const { found, app } = await openTestApp(page);
    await startNew(app, 'Arbeitgeber');
    await forward(app, EMPLOYER, { stopAt: special.field });
    const warning = app.locator('.banner-warning').filter({
      hasText: /^Für diesen Sonderfall ist der Fragebogen nicht gedacht/,
    });
    await expect(warning).toHaveCount(0);
    await choose(app, special.option);
    const shown = async () => {
      await expect(warning).toBeVisible();
      await expect(warning).toContainText(special.message);
    };
    await forward(app, EMPLOYER, { each: shown });
    await expectHeading(app, 'Zusammenfassung');
    await shown();
    await expect(app.getByRole('button', { name: 'Weiter zum Abschluss' })).toBeDisabled();
    await press(app, 'Unterbrechen – zur Übersicht');
    await expect(app.locator('.card').filter({ hasText: /^Stand/ })).toContainText(
      'Für diesen Sonderfall ist der Fragebogen nicht gedacht; er kann so nicht weitergegeben werden.',
    );
    await expect(app.getByRole('button', { name: 'PDF erstellen' })).toBeDisabled();
    await expectQuiet(page, found);
  });
}

const PRIVATE = {
  versicherungsunternehmen: 'Muster Krankenversicherung AG',
  pkvBescheinigung: 'liegtBei',
  pkvAusland: 'Nein',
  pkvBestand2002: 'nein',
  gkvLetzte5Jahre: 'nein',
};
const EXEMPTION = ['kvBefreiung', 'kvBefreiungGrund', 'kvBefreiungAb', 'pkvBestand2002'];

test('MT-64: a private insurance asks for the exemption and the 31.12.2002', async ({ page }) => {
  const { found, app } = await openTestApp(page);
  await startNew(app, 'Beschäftigte Person');
  await forward(app, PERSON, { stopAt: 'krankenversicherung' });
  await choose(app, 'privat');
  await forward(app, PRIVATE, { stopAt: 'pkvBestand2002' });
  await expect(app.locator('.question .help')).toContainText('69.750 € statt 77.400 €');
  await forward(app, PRIVATE, { stopAt: 'kvBefreiung' });
  await choose(app, 'Ja');
  await expectHeading(app, 'Weshalb wurden Sie befreit?');
  await choose(app, 'Erhöhung der Jahresarbeitsentgeltgrenze');
  await expectHeading(app, 'Ab wann gilt die Befreiung?');

  await backTo(app, 'Wie sind Sie krankenversichert?');
  await choose(app, 'gesetzlich (auch familien-, studenten- oder rentnerversichert)');
  const seen: string[] = [];
  await forward(app, PERSON, { seen });
  expect(seen.filter((id) => EXEMPTION.includes(id))).toEqual([]);
  await expectQuiet(page, found);
});

for (const [art, extra] of [
  ['minijob', { steuerart: 'pauschal2', rvBefreiungWunsch: 'nein' }],
  ['aushilfe', { steuerart: 'pauschal25', vorbeschJahr: 'Nein' }],
] as const) {
  test(`MT-64: with ${art} as the agreement nothing asks for the exemption or 31.12.2002`, async ({
    page,
  }) => {
    const { found, app } = await openTestApp(page);
    await startNew(app, 'Beschäftigte Person');
    const seen: string[] = [];
    await forward(
      app,
      { ...PERSON, ...PRIVATE, ...extra, artLautVereinbarung: art, krankenversicherung: 'privat' },
      { seen },
    );
    expect(seen).toContain('versicherungsunternehmen');
    expect(seen.filter((id) => EXEMPTION.includes(id))).toEqual([]);
    await expectQuiet(page, found);
  });
}

test('MT-64: without the exemption notice ticked the Kanzlei asks to request it', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page);
  await personThenEmployer(page, app, {
    ...PERSON,
    ...PRIVATE,
    krankenversicherung: 'privat',
    kvBefreiung: 'ja',
    kvBefreiungGrund: 'jaeg',
  });
  await forward(app, EMPLOYER);
  await closeEmployer(app);
  await readInAtKanzlei(app, await pdf(page, app, testInfo, 'befreiung.pdf'));
  await expect(hints(app)).toContainText(
    'Befreiung von der Krankenversicherungspflicht angegeben: Bescheid der Krankenkasse anfordern.',
  );
  await expectQuiet(page, found);
});

test('MT-65: name parts, nationality and address come from the official lists', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await startNew(app, 'Beschäftigte Person');
  await forward(app, { ...PERSON, namensbestandteile: 'Ja' }, { stopAt: 'titel' });
  await next(app);
  await expectHeading(app, 'Wie lautet das Vorsatzwort Ihres Namens?');
  await expect(app.locator('.question .help')).toContainText(
    'Steht Ihr Vorsatzwort nicht darin, gehört es zum Familiennamen',
  );
  await type(app, 'zum Kuckuck');
  await next(app);
  await expect(app.locator('.question .field-error')).toHaveText(
    'Diese Angabe steht nicht in der amtlichen Liste. Bitte einen Eintrag aus den Vorschlägen wählen.',
  );
  await expectHeading(app, 'Wie lautet das Vorsatzwort Ihres Namens?');
  await type(app, 'van der');
  await next(app);
  await expect.poll(() => heading(app)).not.toBe('Wie lautet das Vorsatzwort Ihres Namens?');

  await forward(app, PERSON, { stopAt: 'deutscheStaatsangehoerigkeit' });
  await choose(app, 'Nein');
  await expectHeading(app, 'Welche Staatsangehörigkeit haben Sie?');
  const box = app.locator('.question input').first();
  await box.pressSequentially('pol');
  await expect(app.getByRole('listbox')).toBeVisible();
  await app.getByRole('option', { name: 'polnisch', exact: true }).click();
  await expect(box).toHaveValue('polnisch');
  await next(app);

  await forward(app, PERSON, { stopAt: 'strassenname' });
  await type(app, 'Musterweg');
  await next(app);
  await expectHeading(app, 'Welche Hausnummer hat die Anschrift?');
  await expect(app.getByRole('button', { name: 'Keine Hausnummer', exact: true })).toBeVisible();
  await forward(app, PERSON);
  const nationality = app.locator('.summary-row').filter({ hasText: /^Staatsangehörigkeit/ });
  await expect(nationality.locator('dd').first()).toHaveText('polnisch');

  // A value typed freely is kept, with a yellow note at once.
  await nationality.getByRole('button', { name: 'ändern' }).click();
  await expectHeading(app, 'Welche Staatsangehörigkeit haben Sie?');
  await type(app, 'atlantisch');
  await expect(app.locator('.question .warning-text')).toHaveText(
    /^Nicht in der Liste\. Die freie Eingabe ist möglich/,
  );
  await press(app, 'Zurück zur Zusammenfassung');
  await expectHeading(app, 'Zusammenfassung');
  await expect(nationality.locator('dd').first()).toHaveText('atlantisch');
  await expectQuiet(page, found);
});

for (const kldb of ['71402', ''] as const) {
  test(`MT-66: Beitragsgruppen, Übergangsbereich and Tätigkeitsschlüssel ${
    kldb === '' ? 'without' : 'with'
  } the Berufskennziffer`, async ({ page }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(
      page,
      'personalfragebogen-teilzeit-berufskennziffer-offen',
    );
    await expectHeading(app, 'Kennen Sie die fünfstellige Berufskennziffer?');
    await forward(app, kldb === '' ? {} : { agKldb: kldb });
    await closeEmployer(app);
    const station = await pdf(page, app, testInfo, 'teilzeit.pdf');
    await readInAtKanzlei(app, station);
    if (kldb === '') {
      await expectProposal(app, TAETIGKEIT, '?????4412', true);
      await expectQuiet(page, found);
      return;
    }
    await expectProposal(app, PERSONENGRUPPE, '101', false);
    const groups = await expectProposal(app, BEITRAGSGRUPPEN, '1111', false);
    for (const branch of ['KV 1:', 'RV 1:', 'AV 1:', 'PV 1:']) {
      await expect(groups).toContainText(branch);
    }
    await expectProposal(app, UEBERGANG, '1', false);
    await expectProposal(app, TAETIGKEIT, '714024412', false);

    // In the PDF the proposals stand only on the check sheet, apart from what was signed.
    const withKey = (await pdfPages(station)).filter((text) => text.includes('714024412'));
    expect(withKey).toHaveLength(1);
    expect(withKey[0]).toMatch(/^\s*Prüfblatt /);
    expect(withKey[0]).toContain('Vorschlag Tätigkeitsschlüssel: 714024412 – ');
    expect(withKey[0]).toContain('(Die App entscheidet das nicht.)');
    await expectQuiet(page, found);
  });
}

test('MT-67: Firmenzahler is asked only above the Jahresarbeitsentgeltgrenze', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page);
  await personThenEmployer(page, app, PERSON);
  await forward(app, { ...EMPLOYER, agMonatsentgelt: '7.000,00' }, { stopAt: 'agUeberJaeg' });
  await expect(app.getByRole('radio', { name: 'Nein', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await next(app);
  await expect
    .poll(() => heading(app))
    .not.toBe('Liegt der Verdienst voraussichtlich über der Jahresarbeitsentgeltgrenze?');
  expect(fieldAt(await heading(app))?.id).not.toBe('agFirmenzahler');
  await forward(app, EMPLOYER);
  await closeEmployer(app);
  const first = await pdf(page, app, testInfo, 'jaeg.pdf');
  await readInAtKanzlei(app, first);
  await expect(hints(app)).toContainText(
    'Laut den Verdienstangaben – mit weiteren Beschäftigungen und Einmalzahlungen mit Anspruch – liegt das regelmäßige Jahresarbeitsentgelt über der maßgeblichen Jahresarbeitsentgeltgrenze, der Arbeitgeber hat „nicht über der Grenze“ angegeben',
  );
  await expectProposal(app, BEITRAGSGRUPPEN, '9111', true);

  await press(app, 'Zur Startseite');
  await app.locator('input[type=file]').first().setInputFiles(first);
  await app
    .locator('li.role')
    .filter({ hasText: 'Arbeitgeber' })
    .getByRole('button', { name: 'Neue Fassung beginnen' })
    .click();
  await expectHeading(app, 'Zusammenfassung');
  await app
    .locator('.summary-row')
    .filter({ hasText: /^Verdienst über der Jahresarbeitsentgeltgrenze/ })
    .getByRole('button', { name: 'ändern' })
    .click();
  await choose(app, 'Ja');
  await expectHeading(
    app,
    'Ist die Person freiwillig gesetzlich krankenversichert – zahlen Sie dann die Beiträge zur Kranken- und Pflegeversicherung an die Krankenkasse?',
  );
  await choose(app, 'Nein, die Person zahlt selbst (Selbstzahler)');
  if ((await heading(app)) !== 'Zusammenfassung') await press(app, 'Zurück zur Zusammenfassung');
  await expectHeading(app, 'Zusammenfassung');
  await closeEmployer(app);
  await readInAtKanzlei(app, await pdf(page, app, testInfo, 'selbstzahler.pdf'));
  await expectProposal(app, BEITRAGSGRUPPEN, '0111', false);
  await expectQuiet(page, found);
});

const AUSHILFE = [
  { bis: '31.08.2026', tage: '78', entgelt: undefined, gruppe: '110', check: false, bgr: '0000' },
  { bis: '01.09.2026', tage: '79', entgelt: undefined, gruppe: '101', check: true, bgr: '1111' },
  { bis: '01.09.2026', tage: '79', entgelt: '500,00', gruppe: '109', check: true, bgr: '6100' },
  // Either limit is enough: over three months with at most 70 working days stays kurzfristig.
  { bis: '30.09.2026', tage: '70', entgelt: undefined, gruppe: '110', check: false, bgr: '0000' },
] as const;

for (const run of AUSHILFE) {
  test(`MT-96: an Aushilfe until ${run.bis} on ${run.tage} days${
    run.entgelt === undefined ? '' : ` with ${run.entgelt} €`
  } gets ${run.gruppe}`, async ({ page }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(page, 'personalfragebogen-aushilfe-art-offen');
    await expectHeading(app, 'Wie ist die Beschäftigung vorgesehen?');
    if (run.entgelt !== undefined) {
      await backTo(app, 'Wie hoch ist das Monatsentgelt brutto?');
      await type(app, run.entgelt);
      await next(app);
      await forward(app, {}, { stopAt: 'agBeschaeftigungsart' });
    }
    await forward(app, {
      agBeschaeftigungsart: 'kurzfristig',
      agKurzfristigBis: run.bis,
      agKurzfristigArbeitstage: run.tage,
      agRahmenvereinbarung: 'Nein',
      agBesteuerung: 'elstam',
    });
    await closeEmployer(app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'aushilfe.pdf'));
    const line = await expectProposal(app, PERSONENGRUPPE, run.gruppe, run.check);
    if (run.gruppe === '101') {
      await expect(line).toContainText(
        'Von vornherein länger als drei Monate (bis 31.08.2026) und mehr als 70 Arbeitstage',
      );
    }
    await expectProposal(app, BEITRAGSGRUPPEN, run.bgr, false);
    await expectQuiet(page, found);
  });
}

const WERKSTUDENT = [
  { hours: '20', entgelt: undefined, gruppe: '106', bgr: '0100', randzeiten: false },
  { hours: '25', entgelt: undefined, gruppe: '101', bgr: '1111', randzeiten: true },
  // A Minijob comes before the Werkstudent rule.
  { hours: '12', entgelt: '600,00', gruppe: '109', bgr: '6100', randzeiten: false },
] as const;

for (const run of WERKSTUDENT) {
  test(`MT-97: a Werkstudent with ${run.hours} hours${
    run.entgelt === undefined ? '' : ` and ${run.entgelt} €`
  } gets ${run.gruppe}`, async ({ page }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(page, 'personalfragebogen-werkstudent-stunden-offen');
    await expectHeading(
      app,
      'Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?',
    );
    await choose(app, 'Nein');
    await expectHeading(
      app,
      'Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?',
    );
    await type(app, run.hours);
    await next(app);
    const randzeiten = 'Liegen die Stunden über 20 hinaus am Wochenende, abends oder nachts?';
    if (run.randzeiten) {
      await expectHeading(app, randzeiten);
      await choose(app, 'Nein');
    } else {
      await expect
        .poll(() => heading(app))
        .not.toBe('Wie viele Stunden pro Woche arbeitet die Person in der Vorlesungszeit?');
      expect(await heading(app)).not.toBe(randzeiten);
    }
    if (run.entgelt !== undefined) {
      await backTo(app, 'Wie hoch ist das Monatsentgelt brutto?');
      await type(app, run.entgelt);
      await next(app);
    }
    await forward(app);
    await closeEmployer(app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'werkstudent.pdf'));
    const line = await expectProposal(app, PERSONENGRUPPE, run.gruppe, false);
    if (run.gruppe === '101') await expect(line).toContainText('mehr als 20 Wochenstunden');
    await expectProposal(app, BEITRAGSGRUPPEN, run.bgr, false);
    await expectQuiet(page, found);
  });
}

test('MT-97: only in the semester breaks no hours are asked and it stays 106', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'personalfragebogen-werkstudent-stunden-offen');
  await expectHeading(
    app,
    'Arbeitet die Person nur in der vorlesungsfreien Zeit (Semesterferien)?',
  );
  const seen: string[] = [];
  await forward(app, { agNurSemesterferien: 'Ja' }, { seen });
  expect(seen).not.toContain('agVorlesungszeitStunden');
  await closeEmployer(app);
  await readInAtKanzlei(app, await pdf(page, app, testInfo, 'semesterferien.pdf'));
  await expectProposal(app, PERSONENGRUPPE, '106', false);
  await expectQuiet(page, found);
});

const STUDIUM = [
  { semester: '4', versorgungswerk: false, gruppe: '106', check: false, bgr: '0100' },
  { semester: '27', versorgungswerk: false, gruppe: '101', check: true, bgr: '1111' },
  { semester: '4', versorgungswerk: true, gruppe: '190', check: false, bgr: '0000' },
] as const;

for (const run of STUDIUM) {
  test(`MT-98: a student in semester ${run.semester}${
    run.versorgungswerk ? ' in a Versorgungswerk' : ''
  } gets ${run.gruppe}`, async ({ page }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(
      page,
      'personalfragebogen-werkstudent-fachsemester-offen',
    );
    await expectHeading(app, 'Im wievielten Fachsemester studieren Sie?');
    await type(app, run.semester);
    await next(app);
    if (run.versorgungswerk) {
      await forward(app, {}, { stopAt: 'versorgungswerk' });
      await choose(app, 'Ja, die Befreiung für diese Beschäftigung ist beantragt oder erteilt');
      await expectHeading(app, 'Welchem Versorgungswerk gehören Sie an?');
      await type(app, 'Versorgungswerk der Musterkammer');
      await next(app);
    }
    await forward(app);
    await closePerson(page, app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'studentin.pdf'));
    const line = await expectProposal(app, PERSONENGRUPPE, run.gruppe, run.check);
    // Only a presumption: shown as such, to be checked.
    if (run.gruppe === '101') {
      await expect(line).toContainText('Mehr als 25 Fachsemester');
      await expect(line).toContainText('Vermutung kann widerlegt werden; dann gilt 106.');
    }
    await expectProposal(app, BEITRAGSGRUPPEN, run.bgr, false);
    if (run.versorgungswerk) await expectProposal(app, UEBERGANG, '0', false);
    await expectQuiet(page, found);
  });
}

const STUNDEN_WECHSELND = {
  agArbeitszeitmodell: 'wechselnd',
  agArbeitstageProWoche: '2',
};

for (const run of [
  { hours: '5', gruppe: '106', bgr: '0100', bgrCheck: true },
  { hours: '15', gruppe: '101', bgr: '1111', bgrCheck: false },
] as const) {
  test(`MT-102: two Minijobs of a student above the limit together, ${run.hours} + 7 hours`, async ({
    page,
  }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(
      page,
      'personalfragebogen-zwei-minijobs-arbeitszeit-offen',
    );
    await expectHeading(app, 'Wie ist die Arbeitszeit vereinbart?');
    await forward(app, { ...STUNDEN_WECHSELND, agWochenstunden: run.hours });
    await closeEmployer(app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'zwei-minijobs.pdf'));
    const line = await expectProposal(app, PERSONENGRUPPE, run.gruppe, true);
    await expectProposal(app, BEITRAGSGRUPPEN, run.bgr, run.bgrCheck);
    if (run.gruppe === '106') {
      await expect(line).toContainText('5 + 7 Stunden anderer Beschäftigungen = 12 Wochenstunden');
      await expectProposal(app, UEBERGANG, '1', true);
    }
    await expectQuiet(page, found);
  });
}

test('MT-102: a part-time study gets no Werkstudent proposal', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(
    page,
    'personalfragebogen-zwei-minijobs-arbeitszeit-offen',
  );
  await expectHeading(app, 'Wie ist die Arbeitszeit vereinbart?');
  await forward(app, { ...STUNDEN_WECHSELND, agWochenstunden: '5' });
  await closeEmployer(app);
  await pdf(page, app, testInfo, 'arbeitgeber.pdf');
  await press(app, 'Gerät weitergeben – zur Übersicht');
  await app
    .locator('li.role')
    .filter({ hasText: 'Beschäftigte Person' })
    .getByRole('button', { name: 'Neue Fassung beginnen' })
    .click();
  await expectHeading(app, 'Zusammenfassung');
  await app
    .locator('.summary-row')
    .filter({ hasText: /^Art des Studiums/ })
    .getByRole('button', { name: 'ändern' })
    .click();
  await expectHeading(app, 'Wie studieren Sie?');
  await choose(app, 'Teilzeitstudium');
  if ((await heading(app)) !== 'Zusammenfassung') await press(app, 'Zurück zur Zusammenfassung');
  await expectHeading(app, 'Zusammenfassung');
  await closePerson(page, app);
  await readInAtKanzlei(app, await pdf(page, app, testInfo, 'teilzeitstudium.pdf'));
  await expectProposal(app, PERSONENGRUPPE, '101', true);
  await expectQuiet(page, found);
});

test('MT-102: without weekly hours (shift work) the app does not guess', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(
    page,
    'personalfragebogen-zwei-minijobs-arbeitszeit-offen',
  );
  await expectHeading(app, 'Wie ist die Arbeitszeit vereinbart?');
  await forward(app, {
    agArbeitszeitmodell: 'schicht',
    agZyklusWochen: '4',
    agArbeitstageZyklus: '8',
    agStundenZyklus: '20',
  });
  await closeEmployer(app);
  await readInAtKanzlei(app, await pdf(page, app, testInfo, 'schicht.pdf'));
  await expectProposal(app, PERSONENGRUPPE, '101', true);
  await expectQuiet(page, found);
});

const VORBESCHAEFTIGUNG = {
  Arbeitgeber: 'Muster AG',
  von: '01.01.2026',
  bis: '31.03.2026',
  Art: 'mehr als geringfügig',
  Verdienst: '3.000,00',
};

for (const seit of ['', '01.04.2026'] as const) {
  test(`MT-103: a housewife's earlier full-time job ${
    seit === '' ? 'counts' : 'before leaving working life does not count'
  }`, async ({ page }, testInfo) => {
    test.slow();
    const { found, app } = await openTestApp(
      page,
      'personalfragebogen-hausfrau-vorbeschaeftigung-offen',
    );
    const earlier =
      'Haben Sie in diesem Kalenderjahr schon anderswo gearbeitet – auch kurz, auch im Ausland?';
    const left = 'Seit wann sind Sie nicht mehr berufstätig?';
    await expectHeading(app, earlier);
    // Not asked without earlier jobs this year.
    await choose(app, 'Nein');
    await expect.poll(() => heading(app)).not.toBe(earlier);
    expect(await heading(app)).not.toBe(left);
    await backTo(app, earlier);
    await choose(app, 'Ja');
    await expectHeading(app, 'Wo haben Sie in diesem Jahr schon gearbeitet?');
    await addRow(app, VORBESCHAEFTIGUNG);
    await next(app);
    await expectHeading(app, left);
    if (seit !== '') await type(app, seit);
    await next(app);
    await forward(app);
    await closePerson(page, app);
    await readInAtKanzlei(app, await pdf(page, app, testInfo, 'hausfrau.pdf'));
    if (seit === '') {
      await expectProposal(app, PERSONENGRUPPE, '101', true);
      await expectProposal(app, BEITRAGSGRUPPEN, '3111', true);
    } else {
      const line = await expectProposal(app, PERSONENGRUPPE, '110', false);
      await expect(line).toContainText(
        'Frühere Beschäftigungen vor dem Ausscheiden aus dem Berufsleben am 01.04.2026 zählen nicht für die Berufsmäßigkeit (Geringfügigkeits-Richtlinien B 2.3.3.3).',
      );
      await expectProposal(app, BEITRAGSGRUPPEN, '0000', false);
    }
    await expectQuiet(page, found);
  });
}
