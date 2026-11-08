// Former manual tests of manual_tests/06_aendern_und_ablauf.md, played in the test build, the public
// build and on docs/ablaufplan.html (Tobias 2026-11-08: only what a virtual browser cannot check stays
// a manual test).
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  download,
  expectQuiet,
  formFields,
  heading,
  openApp,
  openTestApp,
  pdfPages,
  TEST_APP,
} from '../app';
import { expectClean, guard } from '../guards';

// Each test starts its own questionnaire; nothing is shared between them.
test.describe.configure({ mode: 'parallel' });

const PLAN = fileURLToPath(new URL('../../../docs/ablaufplan.html', import.meta.url));
const FORM = 'Personalfragebogen: Angaben für die Lohnabrechnung';
const FIELDS = formFields('personalfragebogen', true) as (ReturnType<typeof formFields>[number] & {
  role: string;
  masterData?: string;
  masterDataCases?: { key: string }[];
})[];
type Field = (typeof FIELDS)[number];

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fieldById = (id: string): Field => {
  const field = FIELDS.find((f) => f.id === id);
  if (!field) throw new Error(`no field ${id}`);
  return field;
};
const question = (id: string) => fieldById(id).question ?? fieldById(id).label;
const option = (id: string, optionId: string) =>
  fieldById(id).options?.find((o) => o.id === optionId)?.label ?? optionId;
// A question as shown: its placeholders hold earlier answers („…“).
const PATTERNS = FIELDS.map((field) => ({
  field,
  re: new RegExp(
    `^${(field.question ?? field.label)
      .split(/\{[a-zA-Z0-9]+\}/)
      .map(escapeRe)
      .join('„[^“]*“')}$`,
  ),
}));
const fieldOf = (text: string) => PATTERNS.find((p) => p.re.test(text))?.field;

const POLL = { intervals: [20, 50, 100, 250] };
const primary = (app: Locator) => app.locator('.card .nav button.primary');
const back = (app: Locator) => app.locator('.card .nav button.back');
const radio = (scope: Locator, name: string) => scope.getByRole('radio', { name, exact: true });
const button = (scope: Locator, name: string) => scope.getByRole('button', { name, exact: true });
const atHeading = (app: Locator, text: string) => expect.poll(() => heading(app), POLL).toBe(text);

/** Clicks and waits until another step shows; returns its heading. */
async function step(app: Locator, target: Locator): Promise<string> {
  const before = await heading(app);
  await target.click();
  await expect.poll(() => heading(app), POLL).not.toBe(before);
  return heading(app);
}

/**
 * Answers step by step (by field id: option id, "Ja"/"Nein" or the typed text) until the summary
 * or the question `stopAt`; unanswered questions are put back or passed with the primary button.
 * Returns the headings it passed; `onStep` sees each before it is answered.
 */
async function walk(
  app: Locator,
  answers: Readonly<Record<string, string>>,
  options: {
    stopAt?: string;
    onStep?: (current: string, field: Field | undefined) => Promise<void>;
  } = {},
): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i < 150; i++) {
    const current = await heading(app);
    if (current === 'Zusammenfassung') return seen;
    const field = fieldOf(current);
    if (options.stopAt !== undefined && field?.id === options.stopAt) return seen;
    seen.push(current);
    await options.onStep?.(current, field);
    if (!field) {
      await app.locator('.card input[type=checkbox]').first().check();
      await primary(app).click();
    } else {
      const value = answers[field.id];
      if (value === undefined || value === '') {
        const skip = button(app, 'Vorerst überspringen');
        if (await skip.isVisible()) await skip.click();
        else await primary(app).click();
      } else if (field.type === 'choice') {
        await radio(app, option(field.id, value)).click();
      } else if (field.type === 'boolean') {
        await radio(app, value).click();
      } else {
        const input = app.locator('.question input, .question textarea').first();
        await input.fill(value);
        // An open search list lies over the buttons.
        if (await app.locator('.search-list').isVisible()) await input.press('Escape');
        await primary(app).click();
      }
    }
    await expect.poll(() => heading(app), POLL).not.toBe(current);
  }
  throw new Error('the summary was not reached');
}

async function backTo(app: Locator, text: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if ((await heading(app)) === text) return;
    await step(app, back(app));
  }
  throw new Error(`"${text}" not reached`);
}

async function startForm(app: Locator, role?: string): Promise<void> {
  await button(app, FORM).click();
  if (role !== undefined) await button(app, `Ich bin: ${role}`).click();
}

async function toSummary(app: Locator): Promise<void> {
  await button(app, 'Zur Zusammenfassung – alle Angaben ansehen und ändern').click();
  await atHeading(app, 'Zusammenfassung');
}

/** A row of the own part in the summary (other roles' parts are shown below, read only). */
const row = (app: Locator, label: string) =>
  app.locator('.summary-section:not(.other-role) .summary-row').filter({
    has: app.page().locator('dt', { hasText: new RegExp(`^${escapeRe(label)}$`) }),
  });

async function change(app: Locator, label: string): Promise<void> {
  await step(app, button(row(app, label), 'ändern'));
}

const roleRow = (app: Locator, label: string) =>
  app.locator('li.role').filter({
    has: app.page().locator('strong', { hasText: new RegExp(`^${escapeRe(label)}$`) }),
  });

/** A message of the app (the test build always shows its preview note too). */
const note = (app: Locator, text: string) => app.locator('.banner').filter({ hasText: text });
const missing = (app: Locator) => app.getByRole('group', { name: 'Fehlende Pflichtangaben' });
const toClose = (app: Locator) => button(app, 'Weiter zum Abschluss');
const overview = (app: Locator) =>
  expect(app.getByRole('heading', { name: 'Wer füllt jetzt aus?' })).toBeVisible();

/** AG-ABSCHLUSS: closed without a signature, then the overview. */
async function closeEmployer(app: Locator): Promise<void> {
  await toClose(app).click();
  await app.locator('label.confirm input[type=checkbox]').check();
  await radio(app, 'Ohne Unterschrift abschließen').click();
  await button(app, 'Abschließen').click();
  await button(app, 'Gerät weitergeben – zur Übersicht').click();
  await overview(app);
}

/** P-ABSCHLUSS with a typed name, then the overview. */
async function signAsPerson(app: Locator): Promise<void> {
  await toClose(app).click();
  await app.locator('label.confirm input[type=checkbox]').check();
  await radio(app, 'Namen tippen').click();
  await app.getByLabel('Ihr vollständiger Name').fill('Erika Musterfrau');
  await button(app, 'Unterschreiben und abschließen').click();
  await button(app, 'Gerät weitergeben – zur Übersicht').click();
  await overview(app);
}

/** From the overview: the PDF, then the Kanzlei station with it read in. */
async function pdfToKanzlei(page: Page, app: Locator, path: string): Promise<string> {
  await download(page, app, 'PDF erstellen', path);
  await button(app, 'Fragebogen schließen').click();
  await button(app, 'Eingänge zusammenführen …').click();
  await app.locator('input[type=file]').first().setInputFiles(path);
  await expect(app).toContainText('1 Datei(en)');
  return path;
}

const fragmentOf = (link: string) => link.slice(link.indexOf('#'));

/** A link opened like a bookmark in a new tab: only its fragment, on the build at hand. */
async function openInNewTab(page: Page, link: string) {
  const tab = await page.context().newPage();
  const found = await guard(tab);
  await tab.goto(pathToFileURL(TEST_APP).href + fragmentOf(link));
  const app = tab.locator('.test-app');
  await expect(app.locator('main')).toBeVisible();
  return { tab, found, app };
}

// Fictitious data only.
const EMPLOYER: Readonly<Record<string, string>> = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
  agVertragsbeginnAbweichend: 'Nein',
  agFrueherBeschaeftigt: 'Nein',
  agArbeitsortBundesland: 'BW',
  agTaetigkeit: 'Verkauf',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2.500,00',
  agBeschaeftigungsart: 'svpflichtig',
  agBeziehung: 'keine',
  agBefristet: 'Nein',
  agArbeitszeitform: 'teilzeit',
  agArbeitszeitmodell: 'wechselnd',
  agWochenstunden: '10',
  agArbeitstageProWoche: '3',
  agUrlaubstage: '20',
  agUrlaubBezug: 'tage5',
  agBav: 'keine',
  agSchwerbehinderung: 'nein',
};
const EMPLOYER_MINIJOB: Readonly<Record<string, string>> = {
  ...EMPLOYER,
  agSteuernummer: '93815/08152',
  agMonatsentgelt: '500,00',
  agBeschaeftigungsart: 'minijob',
  agBesteuerung: 'pauschal2',
  agPauschalsteuerAbgewaelzt: 'Nein',
};
const PERSON: Readonly<Record<string, string>> = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  namensbestandteile: 'Nein',
  geburtsnameWieFamilienname: 'Ja',
  geburtsdatum: '17.05.1990',
  geburtsort: 'Musterstadt',
  geschlecht: 'weiblich',
  versicherungsnummer: '65 170590 M 520',
  strassenname: 'Musterweg',
  hausnummer: '1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
  iban: 'DE89 3704 0044 0532 0130 00',
  kontoinhaberSelbst: 'Ja',
  status: 'arbeitnehmer',
  grundsicherung: 'Nein',
  elternzeitAnderswo: 'Nein',
  artLautVereinbarung: 'festeStelle',
  weitereBeschaeftigung: 'Nein',
  krankenversicherung: 'gesetzlich',
  krankenkasse: 'Techniker Krankenkasse',
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
const PERSON_MINIJOB: Readonly<Record<string, string>> = {
  ...PERSON,
  artLautVereinbarung: 'minijob',
  rvBefreiungWunsch: 'nein',
};

test('MT-50: an answer changed from the summary leads back to it, through the newly opened questions only', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Beschäftigte Person');
  await atHeading(app, 'Datenschutzhinweis');
  // Passed without confirming, so the summary names a notice too.
  await step(app, primary(app));
  await walk(
    app,
    { familienname: 'Musterfrau', vorname: 'Erika' },
    { stopAt: 'namensbestandteile' },
  );
  await toSummary(app);
  await expect(missing(app)).toContainText('Das fehlt noch, bevor Sie abschließen können:');
  const item = (text: string) => missing(app).getByRole('listitem').filter({ hasText: text });
  await expect(button(item('Geburtsdatum'), 'beantworten')).toBeVisible();
  const notice = button(item('Bestätigung: Datenschutzhinweis'), 'ansehen und bestätigen');
  expect(await step(app, notice)).toBe('Datenschutzhinweis');
  await app.locator('label.confirm input[type=checkbox]').check();
  await expect(primary(app)).toHaveText('Zurück zur Zusammenfassung');
  expect(await step(app, primary(app))).toBe('Zusammenfassung');
  await expect(missing(app)).not.toContainText('Bestätigung');

  await change(app, 'Vornamen');
  expect(await heading(app)).toBe(question('vorname'));
  await expect(primary(app)).toHaveText('Zurück zur Zusammenfassung');
  await expect(button(app, 'Weiter')).toHaveCount(0);
  await app.locator('.question input').first().fill('Erika Maria');
  expect(await step(app, primary(app))).toBe('Zusammenfassung');
  await expect(row(app, 'Vornamen')).toContainText('Erika Maria');

  await change(app, 'Rente');
  expect(await step(app, radio(app, 'Ja'))).toBe(question('rentenart'));
  await expect(primary(app)).toHaveText('Weiter');
  expect(await step(app, radio(app, option('rentenart', 'altersvoll')))).toBe(
    question('renteSeit'),
  );
  await expect(primary(app)).toHaveText('Zurück zur Zusammenfassung');
  await app.locator('.question input').first().fill('01.07.2020');
  expect(await step(app, primary(app))).toBe('Zusammenfassung');
  await expect(row(app, 'Art der Rente')).toContainText('Altersrente als Vollrente');
  await expect(row(app, 'Rente seit')).toContainText('01.07.2020');
  // Follow-ups answered before are not asked again: "Ja" leads straight back to the summary.
  await change(app, 'Rente');
  expect(await step(app, radio(app, 'Nein'))).toBe('Zusammenfassung');
  await change(app, 'Rente');
  expect(await step(app, radio(app, 'Ja'))).toBe('Zusammenfassung');

  await change(app, 'Krankenversicherung');
  await walk(
    app,
    {
      krankenversicherung: 'privat',
      versicherungsunternehmen: 'Beispiel Versicherung AG',
      pkvBescheinigung: 'liegtBei',
      pkvAusland: 'Nein',
    },
    { stopAt: 'pkvAngehoerigeEigene' },
  );
  const relatives = question('pkvAngehoerigeEigene');
  await step(app, radio(app, 'Ja'));
  expect(await step(app, back(app))).toBe(relatives);
  await expect(radio(app, 'Ja')).toHaveAttribute('aria-checked', 'true');
  await button(app, 'Auswahl aufheben').click();
  await expect(radio(app, 'Ja')).toHaveAttribute('aria-checked', 'false');
  await expect(radio(app, 'Nein')).toHaveAttribute('aria-checked', 'false');
  expect(await heading(app)).toBe(relatives);
  await expect(button(app, 'Auswahl aufheben')).toHaveCount(0);
  // A required answer can only be replaced, never taken back.
  expect(await step(app, back(app))).toBe(question('pkvAusland'));
  await expect(radio(app, 'Nein')).toHaveAttribute('aria-checked', 'true');
  await expect(button(app, 'Auswahl aufheben')).toHaveCount(0);
  await expectQuiet(page, found);
});

test('MT-50: after the signature: taken back while no other part holds it, else a new version', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'personalfragebogen-vollstaendig');
  const person = roleRow(app, 'Beschäftigte Person');
  const employer = roleRow(app, 'Arbeitgeber');
  // The employer closed after her and confirmed her version: only a new version is left.
  await expect(person).toContainText('unterschrieben');
  await expect(button(person, 'Unterschrift zurücknehmen')).toHaveCount(0);
  await button(person, 'Neue Fassung beginnen').click();
  await atHeading(app, 'Zusammenfassung');
  await signAsPerson(app);
  await expect(person).toContainText('unterschrieben (Fassung 2)');
  await expect(button(employer, 'Abschluss zurücknehmen')).toHaveCount(0);
  // Taken back, the part opens again as a draft.
  await button(person, 'Unterschrift zurücknehmen').click();
  await button(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)').click();
  await expect(person).toContainText('begonnen, nicht abgeschlossen');
  await expectQuiet(page, found);
});

test('MT-53: revising offers "Weiter" and "Zur nächsten fehlenden Angabe"', async ({ page }) => {
  const { found, app } = await openTestApp(page, 'personalfragebogen-person-ab-geburtsdatum');
  const birth = question('geburtsdatum');
  await atHeading(app, birth);
  const skip = button(app, 'Zur nächsten fehlenden Angabe');
  await backTo(app, question('familienname'));
  await expect(button(app, 'Weiter')).toBeVisible();
  await expect(skip).toBeVisible();
  expect(await step(app, button(app, 'Weiter'))).toBe(question('vorname'));
  expect(await step(app, skip)).toBe(birth);

  // Voluntary empty questions and questions put back count as missing too.
  await walk(
    app,
    { geburtsdatum: '17.05.1990', geschlecht: 'weiblich' },
    { stopAt: 'versicherungsnummer' },
  );
  await backTo(app, question('familienname'));
  expect(await step(app, skip)).toBe(question('geburtsort'));
  expect(await step(app, skip)).toBe(question('versicherungsnummer'));
  await step(app, button(app, 'Weiter'));
  expect(await step(app, button(app, 'Weiter'))).toBe(question('strassenname'));
  // When the next question is still open there is only "Weiter".
  await expect(skip).toHaveCount(0);
  await expect(button(app, 'Weiter')).toBeVisible();
  await expectQuiet(page, found);
});

test('MT-53: catching up from the summary also leads to an unconfirmed notice; at the end the button says "Zur Zusammenfassung"', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'personalfragebogen-vollstaendig');
  await button(roleRow(app, 'Beschäftigte Person'), 'Neue Fassung beginnen').click();
  await atHeading(app, 'Zusammenfassung');
  // A new question left open near the end, and the notice unconfirmed: both are missing now.
  await change(app, 'Kirchensteuer (vorläufig)');
  expect(await step(app, radio(app, option('kirchensteuer', 'andere')))).toBe(
    question('kirchensteuerAndere'),
  );
  await toSummary(app);
  await change(app, 'Familienname');
  expect(await step(app, back(app))).toBe('Datenschutzhinweis');
  await app.locator('label.confirm input[type=checkbox]').uncheck();
  await toSummary(app);
  const item = (text: string) => missing(app).getByRole('listitem').filter({ hasText: text });
  await expect(item('Bestätigung: Datenschutzhinweis')).toBeVisible();
  await step(app, button(item('Religionsgemeinschaft'), 'beantworten'));
  expect(await heading(app)).toBe(question('kirchensteuerAndere'));
  await app.locator('.question input').first().fill('Beispielgemeinde');
  expect(await step(app, button(app, 'Zur nächsten fehlenden Angabe'))).toBe('Datenschutzhinweis');
  await app.locator('label.confirm input[type=checkbox]').check();
  expect(await step(app, primary(app))).toBe('Zusammenfassung');
  await expect(missing(app)).toHaveCount(0);

  // Nothing missing after this question: the second button leads to the summary.
  await step(app, back(app));
  await step(app, back(app));
  await expect(button(app, 'Weiter')).toBeVisible();
  expect(await step(app, button(app, 'Zur Zusammenfassung'))).toBe('Zusammenfassung');
  await expectQuiet(page, found);
});

test('MT-51: the employer fixes the wage tax of a Minijob; a later change of it is a hint for the Kanzlei', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Arbeitgeber');
  await walk(app, EMPLOYER_MINIJOB);
  await closeEmployer(app);
  await button(app, 'Ich bin: Beschäftigte Person').click();
  const seen = await walk(app, PERSON_MINIJOB);
  expect(seen).toContain(question('artLautVereinbarung'));
  expect(seen).not.toContain(question('steuerart'));
  expect(seen).not.toContain(question('dienstverhaeltnis'));
  const tax = row(app, 'Art der Lohnsteuer');
  await expect(tax).toContainText('pauschal 2 % (Minijob)');
  await expect(tax).toContainText('festgelegt von: Arbeitgeber');
  await expect(button(tax, 'ändern')).toHaveCount(0);

  // The employer changes the tax in a new version: the person's signature stays.
  await signAsPerson(app);
  await button(roleRow(app, 'Arbeitgeber'), 'Neue Fassung beginnen').click();
  await atHeading(app, 'Zusammenfassung');
  await change(app, 'Art der Lohnsteuer');
  await walk(app, { agBesteuerung: 'elstam' });
  await closeEmployer(app);
  await expect(roleRow(app, 'Beschäftigte Person')).toContainText('unterschrieben');
  await expect(roleRow(app, 'Arbeitgeber')).toContainText('abgeschlossen (Fassung 2)');
  await expect(app).toContainText(
    'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.',
  );
  await pdfToKanzlei(page, app, testInfo.outputPath('minijob.pdf'));
  await expect(app).toContainText(
    '„Art der Lohnsteuer“ weicht ab: Arbeitgeber gibt „nach den Lohnsteuermerkmalen (ELStAM)“ an, im Teil „Beschäftigte Person“ steht „pauschal 2 % (Minijob)“.',
  );
  await expectQuiet(page, found);
});

test('MT-51: without the employer part the person is asked; the employer part closed later replaces her answer', async ({
  page,
}) => {
  test.slow();
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Beschäftigte Person');
  const seen = await walk(app, PERSON_MINIJOB, { stopAt: 'steuerart' });
  expect(seen.at(-1)).toBe(question('steuerId'));
  expect(await step(app, radio(app, option('steuerart', 'pauschal2')))).not.toBe(
    question('dienstverhaeltnis'),
  );
  await backTo(app, question('steuerart'));
  expect(await step(app, radio(app, option('steuerart', 'unbekannt')))).toBe(
    question('dienstverhaeltnis'),
  );

  await backTo(app, question('steuerart'));
  await step(app, radio(app, option('steuerart', 'pauschal20')));
  await button(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)').click();
  await button(app, 'Ich bin: Arbeitgeber').click();
  await walk(app, EMPLOYER_MINIJOB);
  await closeEmployer(app);
  await button(roleRow(app, 'Beschäftigte Person'), 'Weitermachen').click();
  await expect(
    note(
      app,
      'Aus dem abgeschlossenen Teil der anderen Station übernommen: „Art der Lohnsteuer“ ist jetzt „pauschal 2 % (Minijob)“.',
    ),
  ).toBeVisible();
  await expectQuiet(page, found);
});

const PLAN_COLOURS = {
  decision: 'rgb(255, 244, 214)',
  why: 'rgb(238, 245, 236)',
  taken: 'rgb(239, 233, 251)',
};

const versionKey = (version: string) =>
  version
    .split('.')
    .map((part) => part.padStart(6, '0'))
    .join('.');

/** The newest version of every form and draft. */
function newestVersions(): Map<string, string> {
  const newest = new Map<string, string>();
  for (const dir of ['../../../forms/', '../../../form-drafts/']) {
    const root = fileURLToPath(new URL(dir, import.meta.url));
    for (const entry of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      for (const file of readdirSync(`${root}${entry.name}`).filter((f) => f.endsWith('.json'))) {
        const version = file.slice(0, -'.json'.length);
        const known = newest.get(entry.name);
        if (known === undefined || versionKey(known) < versionKey(version)) {
          newest.set(entry.name, version);
        }
      }
    }
  }
  return newest;
}

test('MT-52: the flow plan lists each station’s questions in interview order, with conditions and reasons', async ({
  page,
}) => {
  expect(existsSync(PLAN), 'docs/ablaufplan.html (npm run catalogue)').toBe(true);
  const found = await guard(page);
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(PLAN).href);
  await expect(page.locator('script, link[rel=stylesheet], img, iframe')).toHaveCount(0);

  // Only the newest version of each form; an older one is named as replaced.
  const hrefs = await page
    .locator('main > ol a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  const listed = hrefs.map((href) => /^#(.+)-(\d+\.\d+\.\d+)$/.exec(href)?.slice(1) ?? []);
  expect(
    new Map(listed.map(([id, version]): [string, string] => [id ?? '', version ?? ''])),
  ).toEqual(newestVersions());
  await expect(page.locator('h2[id^="sofortmeldung-"]')).toHaveCount(1);
  await expect(
    page.locator('h2[id^="sofortmeldung-"] ~ p.meta', { hasText: /^Ersetzt / }).first(),
  ).toContainText('Ersetzt die ältere Fassung 0.2.0 (eingefroren)');

  const link = page.locator('main > ol a', { hasText: FORM });
  const id = (await link.getAttribute('href'))?.slice(1) ?? '';
  await link.click();
  await expect(page).toHaveURL(new RegExp(`#${escapeRe(id)}$`));
  await expect(page.locator(`h2[id="${id}"]`)).toBeInViewport();
  const below = (selector: string) => page.locator(`h2[id="${id}"] ~ ${selector}`).first();
  await expect(below('p:has(strong)')).toHaveText(
    'Diese Fassung gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026.',
  );
  await expect(below('.limits h3')).toHaveText('Was dieser Fragebogen nicht abdeckt');
  const order = below('.order');
  await expect(order.locator('h3')).toHaveText('Reihenfolge der Stationen');
  await expect(order).toContainText(
    'Empfohlen: Arbeitgeber zuerst. Dann übernimmt der Fragebogen „Art der Lohnsteuer“, „Sozialkassenverfahren“ in den Teil „Beschäftigte Person“ und fragt dort nur, was dazu passt.',
  );

  const station = page.locator(`section[id="${id}-person"]`);
  await expect(station.locator('h3')).toHaveText('Station: Beschäftigte Person');
  const steps = station.locator('li.step');
  const numbers = (await steps.locator('.num').allTextContents()).map(Number);
  expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  const asked = (await steps.locator('.q').allTextContents()).map((text) => fieldOf(text)?.id);
  expect(asked).toEqual(FIELDS.filter((field) => field.role === 'person').map((f) => f.id));

  const stepOf = (id: string) =>
    steps.filter({
      has: page.locator('.q', { hasText: new RegExp(`^${escapeRe(question(id))}$`) }),
    });
  const tax = stepOf('steuerart');
  const kind = stepOf('artLautVereinbarung');
  const indent = (locator: Locator) =>
    locator.evaluate((element) => parseFloat(getComputedStyle(element).marginLeft));
  expect(await indent(tax)).toBeGreaterThan(await indent(kind));
  const kindNumber = (await kind.locator('.num').textContent()) ?? '';
  await expect(tax.locator('.when')).toHaveText(
    new RegExp(`^Gefragt erst wenn .*\\(hängt ab von Nr\\. ${kindNumber}\\)\\.$`),
  );
  await expect(tax.locator('.why')).toHaveText(/^Warum: /);
  await expect(tax.locator('.why')).toHaveCSS('background-color', PLAN_COLOURS.why);
  await expect(tax).toHaveClass(/\bdecision\b/);
  await expect(tax).toHaveCSS('background-color', PLAN_COLOURS.decision);
  await expect(tax.locator('.opens')).toHaveText(
    /^Weiche: davon hängen Nr\. \d+(, Nr\. \d+)* ab\.$/,
  );
  await expect(tax.locator('.taken')).toContainText('Legt die andere Station fest (Arbeitgeber:');
  await expect(tax.locator('.taken')).toHaveCSS('background-color', PLAN_COLOURS.taken);

  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
});

test('MT-54: a start of employment outside the validity is kept, but blocks closing', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page);
  const entry = app
    .locator('.form-list li')
    .filter({ has: page.getByRole('button', { name: FORM, exact: true }) });
  await expect(entry).toContainText(
    'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026',
  );
  await startForm(app, 'Arbeitgeber');
  await walk(app, EMPLOYER, { stopAt: 'agBeschaeftigungsbeginn' });
  await app.locator('.question input').first().fill('04.01.2027');
  await step(app, primary(app));
  await expect(
    note(app, 'Dieses Datum liegt außerhalb der Gültigkeit dieser Formularfassung.'),
  ).toHaveClass(/banner-warning/);
  await walk(app, EMPLOYER);
  await expect(
    note(
      app,
      'Der Stichtag 04.01.2027 liegt außerhalb der Gültigkeit dieser Formularfassung (sie gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026).',
    ),
  ).toHaveClass(/banner-warning/);
  // The date is kept; only closing is blocked.
  await expect(row(app, 'Tag der Beschäftigungsaufnahme')).toContainText('04.01.2027');
  await expect(missing(app)).toHaveCount(0);
  await expect(toClose(app)).toBeDisabled();

  await change(app, 'Tag der Beschäftigungsaufnahme');
  await app.locator('.question input').first().fill('01.10.2026');
  expect(await step(app, primary(app))).toBe('Zusammenfassung');
  await expect(app.getByText(/liegt außerhalb der Gültigkeit/)).toHaveCount(0);
  await expect(toClose(app)).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-55: the overview, the PDF and the Kanzlei name what the questionnaire does not cover', async ({
  page,
}, testInfo) => {
  test.slow();
  const limits = [
    'Der Fragebogen entscheidet nicht über Versicherungspflicht, Personengruppe und Beitragsgruppen.',
    'Erklärungen, die eigenhändig unterschrieben werden (Befreiung von der Rentenversicherung im Minijob',
  ];
  const { found, app } = await openTestApp(page);
  await startForm(app);
  await overview(app);
  const card = (title: string) =>
    app.locator('.card', { has: page.getByRole('heading', { name: title, exact: true }) });
  const scope = card('Gültigkeit und Grenzen');
  expect((await scope.boundingBox())?.y ?? 0).toBeGreaterThan(
    (await card('Stand').boundingBox())?.y ?? 0,
  );
  await expect(scope).toContainText(
    'Diese Fassung gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026.',
  );
  await expect(scope.locator('details')).toHaveAttribute('open', '');
  await expect(scope.locator('details summary')).toHaveText('Was dieser Fragebogen nicht abdeckt');
  for (const limit of limits) await expect(scope.locator('details')).toContainText(limit);
  await expectQuiet(page, found);

  const prepared = await openTestApp(page, 'personalfragebogen-vollstaendig');
  const pdf = await pdfToKanzlei(page, prepared.app, testInfo.outputPath('vollstaendig.pdf'));
  const pages = (await pdfPages(pdf)).map((text) => text.replace(/\s+/g, ' '));
  const sheet = pages.findIndex((text) => text.trimStart().startsWith('Prüfblatt'));
  expect(sheet).toBeGreaterThan(0);
  // The list can begin a page earlier; it ends above the legal notes, before the Prüfblatt.
  const front = pages.slice(0, sheet).join(' ');
  const validity =
    'Diese Formularfassung gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026.';
  expect(front.indexOf(validity)).toBeGreaterThan(0);
  const covered = front.indexOf('Was dieser Fragebogen nicht abdeckt:');
  expect(covered).toBeGreaterThan(front.indexOf(validity));
  for (const limit of limits) expect(front.indexOf(limit)).toBeGreaterThan(covered);
  const legal = 'Die Unterschrift in dieser App ist eine einfache elektronische Signatur';
  expect(front.indexOf(legal)).toBeGreaterThan(front.indexOf(limits[1] ?? ''));
  expect(pages[sheet - 1]).toContain(legal);
  await button(prepared.app, 'Formular ansehen').click();
  const view = prepared.app.locator('.form-view');
  await expect(view.locator('details summary')).toHaveText('Was dieser Fragebogen nicht abdeckt');
  for (const limit of limits) await expect(view.locator('details')).toContainText(limit);
  await expectQuiet(page, prepared.found);
});

test('MT-56: several jobs together above the contribution ceiling are a hint for the Kanzlei', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'personalfragebogen-vollstaendig');
  await button(roleRow(app, 'Beschäftigte Person'), 'Neue Fassung beginnen').click();
  await atHeading(app, 'Zusammenfassung');
  await change(app, 'Haben Sie zurzeit noch eine andere Beschäftigung?');
  expect(await step(app, radio(app, 'Ja'))).toBe(question('weitereJobs'));
  await button(app, 'Beschäftigung hinzufügen').click();
  const cells = app.locator('fieldset.table-row').first();
  await cells.getByRole('textbox', { name: 'Arbeitgeber', exact: true }).fill('Muster Handel GmbH');
  await radio(
    cells.getByRole('radiogroup', { name: 'Art', exact: true }),
    'sozialversicherungspflichtig',
  ).click();
  await cells.getByRole('textbox', { name: 'seit', exact: true }).fill('01.01.2024');
  await cells.getByRole('textbox', { name: 'Verdienst im Monat (brutto)' }).fill('1.500,00');
  await walk(app, {});
  await expect(row(app, 'Andere Beschäftigungen')).toContainText('Muster Handel GmbH');
  await signAsPerson(app);

  await button(roleRow(app, 'Arbeitgeber'), 'Neue Fassung beginnen').click();
  await atHeading(app, 'Zusammenfassung');
  await expect(row(app, 'Tag der Beschäftigungsaufnahme')).toContainText('2026');
  await change(app, 'Monatsentgelt (brutto)');
  await app.locator('.question input').first().fill('5.000,00');
  await step(app, primary(app));
  await walk(app, {});
  await closeEmployer(app);
  await pdfToKanzlei(page, app, testInfo.outputPath('mehrfach.pdf'));
  await expect(app).toContainText(
    'Mehrere Beschäftigungen zusammen über der Beitragsbemessungsgrenze',
  );
  await expect(app).toContainText(
    'Zusammen 6.500,00 € im Monat (davon diese Beschäftigung 5.000,00 €)',
  );
  await expect(app).toContainText('5.812,50 €');
  await expect(app).toContainText('über der maßgeblichen Jahresarbeitsentgeltgrenze');
  await expectQuiet(page, found);
});

const SPECIAL_CASE = 'Für diesen Sonderfall ist der Fragebogen nicht gedacht';

test('MT-57: a special case blocks closing and passing on, and says so on every step', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Arbeitgeber');
  const warning = app.locator('.interview .banner-warning');
  let after = false;
  await walk(
    app,
    { ...EMPLOYER, agHeimarbeit: 'Ja' },
    {
      onStep: async (_, field) => {
        if (after) {
          await expect(warning).toContainText(SPECIAL_CASE);
          await expect(warning).toContainText(
            'Heimarbeit oder Hausgewerbe (Personengruppen 104, 124).',
          );
        } else await expect(warning).toHaveCount(0);
        if (field?.id === 'agHeimarbeit') after = true;
      },
    },
  );
  expect(after).toBe(true);
  await expect(warning).toContainText(SPECIAL_CASE);
  await expect(missing(app)).toHaveCount(0);
  await expect(toClose(app)).toBeDisabled();
  await button(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)').click();
  const state = app.locator('.card', {
    has: page.getByRole('heading', { name: 'Stand', exact: true }),
  });
  await expect(state.locator('.banner-warning')).toContainText('Noch nicht weitergeben:');
  await expect(state.locator('.banner-warning')).toContainText(
    'Für diesen Sonderfall ist der Fragebogen nicht gedacht; er kann so nicht weitergegeben werden.',
  );

  await button(roleRow(app, 'Arbeitgeber'), 'Weitermachen').click();
  if ((await heading(app)) !== 'Zusammenfassung') await toSummary(app);
  await change(app, 'Heimarbeit oder Hausgewerbe');
  expect(await step(app, radio(app, 'Nein'))).toBe('Zusammenfassung');
  await expect(warning).toHaveCount(0);
  await expect(toClose(app)).toBeEnabled();

  // A fixed term under a week blocks as well, without a question of its own.
  await change(app, 'Ist das Arbeitsverhältnis befristet?');
  const asked = await walk(app, {
    agBefristet: 'Ja',
    agBefristungsart: 'kalender',
    agBefristetBis: '06.11.2026',
    agBefristungsgrund: 'projekt',
    agBefristungSchriftlich: 'ja',
    agBefristungSchriftlichAm: '01.10.2026',
    agBefristungAussicht: 'Nein',
    agSaisonarbeit: 'Nein',
  });
  expect(asked.filter((text) => !(fieldOf(text)?.id ?? '').match(/^ag(Befrist|Saison)/))).toEqual(
    [],
  );
  await expect(warning).toContainText(SPECIAL_CASE);
  await expect(warning).toContainText(
    'Auf weniger als eine Woche befristete versicherungspflichtige Beschäftigung',
  );
  await expect(toClose(app)).toBeDisabled();
  await expectQuiet(page, found);
});

test('MT-58: firm attributes travel in the master-data link and open their per-person questions', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Arbeitgeber');
  await walk(
    app,
    { ...EMPLOYER, agLandwirtschaft: 'Ja', agBetriebsart: 'werkstatt' },
    { stopAt: 'agHeimarbeit' },
  );
  await toSummary(app);
  const link = await app.getByLabel('Stammdaten-Link').inputValue();
  expect(link).toContain('landwirtschaft=ja');
  expect(link).toContain('betriebsart=werkstatt');

  const opened = await openInNewTab(page, link);
  await expect(opened.app).toContainText(`Neuer Fragebogen „${FORM}“ aus Ihrem Lesezeichen.`);
  await button(opened.app, 'Ich bin: Arbeitgeber').click();
  await walk(opened.app, {}, { stopAt: 'agLandwirtschaft' });
  // The link replaces the preset "Nein".
  await expect(radio(opened.app, 'Ja')).toHaveAttribute('aria-checked', 'true');
  await expect(opened.app).toContainText('Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.');
  await walk(opened.app, {}, { stopAt: 'agBetriebsart' });
  await expect(radio(opened.app, option('agBetriebsart', 'werkstatt'))).toHaveAttribute(
    'aria-checked',
    'true',
  );
  const seen = await walk(opened.app, {}, { stopAt: 'agEntgeltArt' });
  expect(seen).toContain(question('agEinrichtungTeilnehmer'));
  expect(seen).toContain(question('agFamilieLandwirtschaft'));
  await expectQuiet(opened.tab, opened.found);
  await expectQuiet(page, found);
});

/** A master datum on the link page, by its question. */
const masterEntry = (form: Locator, text: string) =>
  form.locator('.master-entry').filter({
    has: form.page().locator('.master-question', { hasText: new RegExp(`^${escapeRe(text)}$`) }),
  });
const linkOf = (form: Locator) => form.getByLabel('Stammdaten-Link');

test('MT-99: the master-data link page shows one form’s data and names what it leaves out', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await button(app, 'Stammdaten-Link erstellen oder ändern …').click();
  const form = app.locator('.master-link-form');
  const opens = form.locator('#master-opens');
  await expect(opens.locator('option:checked')).toHaveText('Bitte wählen …');
  await expect(form).toContainText('Wählen Sie zuerst, was der Link öffnen soll.');
  // Only the pasted link and the question what it opens.
  await expect(form.locator('.master-entry')).toHaveCount(2);

  await opens.selectOption('personalfragebogen');
  const groups = await form.locator('h3').allTextContents();
  expect(groups).toContain('Angaben des Arbeitgebers');
  expect(groups.filter((group) => group.includes('('))).toEqual([]);
  await form.locator('#master-firma').fill('Beispiel Gastro GmbH');
  await form.locator('#master-betriebsnummer').fill('1234 567X');
  await expect(
    masterEntry(form, question('agBetriebsnummer')).locator('.field-error'),
  ).toBeVisible();
  await expect(form).toContainText('Bitte erst die markierten Angaben berichtigen.');
  await expect(linkOf(form)).toHaveCount(0);
  await form.locator('#master-betriebsnummer').fill('1234 5671');
  await expect(linkOf(form)).toBeVisible();
  await expect(form).toContainText(/\d+ von 2\.000 Zeichen/);

  const choices = (entry: Locator) => entry.getByRole('radio').allTextContents();
  const labels = (...ids: string[]) => ids.map((id) => option('agBesteuerung', id));
  const minijob = masterEntry(form, 'Lohnsteuer bei Minijobs');
  expect(await choices(minijob)).toEqual(labels('elstam', 'pauschal2', 'pauschal20', 'pruefen'));
  await radio(minijob, option('agBesteuerung', 'pauschal2')).click();
  await radio(masterEntry(form, 'Abwälzung der Pauschalsteuer bei Minijobs'), 'Ja').click();
  const aushilfe = masterEntry(form, 'Lohnsteuer bei kurzfristigen Aushilfen');
  expect(await choices(aushilfe)).toEqual(labels('elstam', 'pauschal25', 'pauschal5', 'pruefen'));
  await radio(aushilfe, option('agBesteuerung', 'pauschal25')).click();
  const passedOn = masterEntry(form, 'Abwälzung der Pauschalsteuer bei kurzfristigen Aushilfen');
  await radio(passedOn, 'Nein').click();

  const effects = form.locator('.banner', { hasText: 'Was diese Angaben bewirken:' });
  const household = masterEntry(form, question('agPrivathaushalt'));
  const kind = masterEntry(form, question('agBetriebsart'));
  const sea = masterEntry(form, question('agSeeschifffahrt'));
  await radio(household, 'Ja').click();
  await expect(effects).toContainText(
    'Je nach den Angaben zur Person macht die App keine Vorschläge – Minijob oder kurzfristige Beschäftigung im Privathaushalt',
  );
  await radio(kind, option('agBetriebsart', 'knappschaft')).click();
  await expect(effects).toContainText(
    'Die App macht für diesen Betrieb keine Vorschläge – Beschäftigung in einem knappschaftlichen Betrieb',
  );
  await radio(sea, 'Ja').click();
  await expect(effects).toContainText('Beschäftigung an Bord eines Seeschiffs');
  await radio(household, 'Nein').click();
  await radio(kind, option('agBetriebsart', 'keine')).click();
  await radio(sea, 'Nein').click();
  await expect(effects).toHaveCount(0);

  await opens.selectOption('sepa-mandat');
  await expect(form.locator('#master-firma')).toHaveCount(0);
  await expect(minijob).toHaveCount(0);
  const left = form.getByText(/^Nicht in diesem Link, weil sie zu anderen Formularen gehören:/);
  await expect(left).toContainText('Lohnsteuer bei Minijobs');
  await expect(linkOf(form)).toHaveValue(/#stammdaten=1&formular=sepa-mandat$/);
  await opens.selectOption('personalfragebogen');
  await expect(form.locator('#master-firma')).toHaveValue('Beispiel Gastro GmbH');
  await expect(form.locator('#master-betriebsnummer')).toHaveValue('1234 5671');
  await expect(radio(minijob, option('agBesteuerung', 'pauschal2'))).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(radio(passedOn, 'Nein')).toHaveAttribute('aria-checked', 'true');
  const link = await linkOf(form).inputValue();
  expect(fragmentOf(link)).toMatch(/^#stammdaten=1&formular=personalfragebogen&/);

  // Read in again in the Kanzlei: every answer back, the inbox untouched.
  await button(app, 'Zur Startseite').click();
  await button(app, 'Eingänge zusammenführen …').click();
  await app.locator('details.master-link-form > summary').click();
  const kanzlei = app.locator('div.master-link-form');
  await kanzlei.locator('#master-paste').fill(link);
  await button(kanzlei, 'Einlesen').click();
  await expect(kanzlei).toContainText(/Link eingelesen: \d+ Angaben\./);
  await expect(kanzlei.locator('#master-opens')).toHaveValue('personalfragebogen');
  await expect(kanzlei.locator('#master-firma')).toHaveValue('Beispiel Gastro GmbH');
  await expect(
    radio(masterEntry(kanzlei, 'Lohnsteuer bei Minijobs'), option('agBesteuerung', 'pauschal2')),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(
    radio(masterEntry(kanzlei, 'Abwälzung der Pauschalsteuer bei kurzfristigen Aushilfen'), 'Nein'),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(app.locator('ul.inbox')).toHaveCount(0);
  await expectQuiet(page, found);
});

test('MT-99: the public build has no Personalfragebogen on the link page', async ({ page }) => {
  const { found, app } = await openApp(page);
  await button(app, 'Stammdaten-Link erstellen oder ändern …').click();
  const values = await app
    .locator('#master-opens option')
    .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
  expect(values).toContain('sofortmeldung');
  expect(values).not.toContain('personalfragebogen');
  await expectClean(page, found);
});

test('MT-99: "Kopieren" puts the link on the clipboard', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are a Chromium feature');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const { found, app } = await openTestApp(page);
  await button(app, 'Stammdaten-Link erstellen oder ändern …').click();
  const form = app.locator('.master-link-form');
  await form.locator('#master-opens').selectOption('personalfragebogen');
  await form.locator('#master-firma').fill('Beispiel Gastro GmbH');
  await button(form, 'Kopieren').click();
  await expect(form).toContainText('Link kopiert.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await linkOf(form).inputValue(),
  );
  await expectQuiet(page, found);
});

test('MT-100: the wage tax rules of the link are preset with the question, until changed', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  const { found, app } = await openTestApp(page, 'personalfragebogen-stammdaten-link');
  await button(app, 'Ich bin: Arbeitgeber').click();
  await expect(
    note(app, 'Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.'),
  ).toBeVisible();
  const values = new Map<string, string>();
  await walk(
    app,
    {},
    {
      stopAt: 'agBeschaeftigungsart',
      onStep: async (_, field) => {
        if (field?.id === 'agFirma' || field?.id === 'agBetriebsnummer') {
          values.set(field.id, await app.locator('.question input').first().inputValue());
        }
      },
    },
  );
  expect(values.get('agFirma')).toBe('Beispiel Gastro GmbH');
  expect(values.get('agBetriebsnummer')?.replace(/\s/g, '')).toBe('12345671');

  const kind = question('agBeschaeftigungsart');
  const tax = question('agBesteuerung');
  const preset = app.getByText('Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.');
  await step(app, radio(app, option('agBeschaeftigungsart', 'minijob')));
  await walk(app, {}, { stopAt: 'agBesteuerung' });
  await expect(radio(app, option('agBesteuerung', 'pauschal2'))).toHaveAttribute(
    'aria-checked',
    'true',
  );
  // Preset, never answered unseen: the question is shown.
  await expect(preset).toBeVisible();
  expect(await step(app, primary(app))).toBe(question('agPauschalsteuerAbgewaelzt'));
  await expect(radio(app, 'Ja')).toHaveAttribute('aria-checked', 'true');
  await step(app, primary(app));

  await backTo(app, kind);
  await step(app, radio(app, option('agBeschaeftigungsart', 'kurzfristig')));
  await walk(app, {}, { stopAt: 'agBesteuerung' });
  await expect(radio(app, option('agBesteuerung', 'pauschal25'))).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await step(app, primary(app));
  await expect(radio(app, 'Nein')).toHaveAttribute('aria-checked', 'true');

  await backTo(app, tax);
  await step(app, radio(app, option('agBesteuerung', 'elstam')));
  await backTo(app, kind);
  await step(app, radio(app, option('agBeschaeftigungsart', 'minijob')));
  await walk(app, {}, { stopAt: 'agBesteuerung' });
  await expect(radio(app, option('agBesteuerung', 'elstam'))).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(preset).toHaveCount(0);
  await expectQuiet(page, found);
});

test('MT-101: the link for next time keeps the other forms’ data; a link of another version is refused', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'personalfragebogen-stammdaten-link');
  await button(app, 'Ich bin: Arbeitgeber').click();
  await expect(
    note(app, 'Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.'),
  ).toBeVisible();
  await toSummary(app);
  const next = app.locator('.summary-section', {
    has: page.getByRole('heading', { name: 'Stammdaten für das nächste Mal' }),
  });
  const text = (await next.locator('p.muted').first().textContent()) ?? '';
  const named = /diese Angaben sind dann schon eingetragen: (.*?)\./.exec(text)?.[1]?.split(', ');
  expect(named).toEqual(
    expect.arrayContaining([
      'Firma des Arbeitgebers',
      'Betriebsnummer des Arbeitgebers',
      'Privathaushalt',
    ]),
  );
  expect(text).toContain('Weitere 4 Angaben aus Ihrem bisherigen Link bleiben erhalten.');
  const link = await next.getByLabel('Stammdaten-Link').inputValue();
  const params = new URLSearchParams(fragmentOf(link).slice(1));
  expect(params.get('lohnsteuerMinijob')).toBe('pauschal2');
  expect(params.get('lohnsteuerAushilfe')).toBe('pauschal25');
  // Master data only: nothing about the person.
  const masterKeys = new Set([
    'stammdaten',
    'formular',
    ...FIELDS.flatMap((field) => [
      ...(field.masterData === undefined ? [] : [field.masterData]),
      ...(field.masterDataCases ?? []).map((c) => c.key),
    ]),
  ]);
  expect([...params.keys()].filter((key) => !masterKeys.has(key))).toEqual([]);

  // The link of another version, typed into the address bar and loaded again.
  const address = page.url();
  expect(address).toContain('#stammdaten=1&');
  await page.goto(address.replace('#stammdaten=1&', '#stammdaten=2&'));
  await page.reload();
  await expect(
    note(
      app,
      'Stammdaten-Link: Dieser Stammdaten-Link stammt aus einer anderen Version der App und kann nicht gelesen werden.',
    ),
  ).toBeVisible();
  await expect(app.getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
  await startForm(app, 'Arbeitgeber');
  expect(await heading(app)).toBe(question('agFirma'));
  await expect(app.locator('.question input').first()).toHaveValue('');
  await expectQuiet(page, found);
});

test('MT-109: a bookmark with a form begins a new questionnaire at once; without one it opens the start page', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page);
  await button(app, 'Stammdaten-Link erstellen oder ändern …').click();
  const form = app.locator('.master-link-form');
  const opens = form.locator('#master-opens');
  await expect(opens.locator('option:checked')).toHaveText('Bitte wählen …');
  await expect(form).toContainText(
    'Danach zeigt die Seite nur die Angaben, die dieses Formular nutzt; für die Startseite die aller Formulare. Der Link nennt nur das Formular, keine Fassung',
  );
  const sofort = 'Personalfragebogen: Angaben für die Sofortmeldung';
  await opens.selectOption({ label: `einen neuen Fragebogen „${sofort}“` });
  await form.locator('#master-firma').fill('Beispiel Bau GmbH');
  await form.locator('#master-betriebsnummer').fill('1234 5671');
  const first = await openInNewTab(page, await linkOf(form).inputValue());
  await overview(first.app);
  await expect(
    note(
      first.app,
      `Neuer Fragebogen „${sofort}“ aus Ihrem Lesezeichen. Die Angaben aus dem Link stehen schon im Teil „Arbeitgeber“.`,
    ),
  ).toBeVisible();
  await expect(roleRow(first.app, 'Arbeitgeber')).toContainText('noch offen');
  await expect(roleRow(first.app, 'Beschäftigte Person')).toContainText('noch offen');
  await expectQuiet(first.tab, first.found);
  await first.tab.close();

  await opens.selectOption('');
  const questions = await form.locator('.master-entry .master-question').allTextContents();
  expect(new Set(questions).size).toBe(questions.length);
  await expect(form.getByText(/^Genutzt in: .+, /).first()).toBeVisible();
  expect(await form.locator('h3').allTextContents()).toContain(
    `Angaben des Arbeitgebers (${FORM})`,
  );
  const second = await openInNewTab(page, await linkOf(form).inputValue());
  await expect(second.app.getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
  await button(second.app, sofort).click();
  await button(second.app, 'Ich bin: Arbeitgeber').click();
  await expect(note(second.app, 'Stammdaten aus Ihrem Lesezeichen übernommen.')).toBeVisible();
  await expect(second.app.locator('.question input').first()).toHaveValue('Beispiel Bau GmbH');
  await step(second.app, primary(second.app));
  await expect(second.app.locator('.question input').first()).toHaveValue(/^1234 ?5671$/);
  await expectQuiet(second.tab, second.found);
  await expectQuiet(page, found);
});

test('MT-109: the public build names a form it lacks and shows the start page', async ({
  page,
}) => {
  const { found, app } = await openApp(page, '#stammdaten=1&formular=personalfragebogen');
  await page.reload();
  await expect(
    note(
      app,
      'Ihr Lesezeichen soll einen neuen Fragebogen „personalfragebogen“ öffnen; diese Fassung der App enthält ihn nicht. Bitte wählen Sie unten selbst.',
    ),
  ).toHaveClass(/banner-warning/);
  await expect(app.getByRole('heading', { name: 'Neuer Fragebogen' })).toBeVisible();
  await expectClean(page, found);
});

test('MT-86: phone and e-mail are checked, a Minijob with private insurance asks little, A1 is the employer’s', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Beschäftigte Person');
  const seen = await walk(app, PERSON, { stopAt: 'telefon' });
  const input = app.locator('.question input').first();
  const error = app.locator('.field-error');
  await input.fill('12345');
  await primary(app).click();
  await expect(error).toContainText('Bitte eine Telefonnummer mit Vorwahl eingeben');
  expect(await heading(app)).toBe(question('telefon'));
  await input.fill('0721 123456');
  expect(await step(app, primary(app))).toBe(question('email'));
  await input.fill('erika.beispiel.de');
  await primary(app).click();
  await expect(error).toContainText('Bitte eine E-Mail-Adresse wie name@beispiel.de eingeben.');
  await input.fill('Erika@Beispiel.DE');
  await step(app, primary(app));
  seen.push(question('telefon'), question('email'));

  const minijob = { ...PERSON_MINIJOB, versicherungsunternehmen: 'Beispiel Versicherung AG' };
  seen.push(...(await walk(app, minijob, { stopAt: 'krankenversicherung' })));
  expect(await step(app, radio(app, option('krankenversicherung', 'privat')))).toBe(
    question('versicherungsunternehmen'),
  );
  // No employer's contribution and no compulsory insurance in a Minijob: nothing else is asked.
  const insured = await walk(app, minijob, { stopAt: 'versorgungswerk' });
  expect(insured).toEqual([question('versicherungsunternehmen')]);
  seen.push(...insured, ...(await walk(app, { ...minijob, steuerart: 'elstam' })));
  await expect(row(app, 'E-Mail-Adresse')).toContainText('Erika@beispiel.de');
  await expect(row(app, 'Telefonnummer')).toContainText('0721 123456');
  expect(seen.filter((text) => text.includes('A1'))).toEqual([]);

  // The employer is asked once for the firm; only "Ja" brings the questions per person.
  await button(app, 'Unterbrechen – zur Übersicht (Angaben bleiben erhalten)').click();
  await button(app, 'Ich bin: Arbeitgeber').click();
  await walk(app, EMPLOYER, { stopAt: 'agAuslandSvBetrieb' });
  await expect(radio(app, 'Nein')).toHaveAttribute('aria-checked', 'true');
  const rest = await walk(app, EMPLOYER);
  expect(rest.filter((text) => text === question('agAuslandSvBetrieb'))).toHaveLength(1);
  expect(rest).not.toContain(question('agSvAusland'));
  expect(await app.getByLabel('Stammdaten-Link').inputValue()).toContain('auslandSv=nein');
  await change(app, 'Beschäftigte mit Sozialversicherung in einem anderen Staat');
  const abroad = await walk(app, {
    agAuslandSvBetrieb: 'Ja',
    agSvAusland: 'Ja',
    agSvAuslandStaat: 'Österreich',
    agSvAuslandA1: 'Ja',
  });
  expect(abroad).toEqual([
    question('agAuslandSvBetrieb'),
    question('agSvAusland'),
    question('agSvAuslandStaat'),
    question('agSvAuslandA1'),
  ]);
  await expectQuiet(page, found);
});

test('MT-87: one main status brings its own questions; the birth date decides about the Regelaltersgrenze', async ({
  page,
}) => {
  // Walks through most of a part's questions.
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-07T10:00:00+01:00'));
  const { found, app } = await openTestApp(page);
  await startForm(app, 'Beschäftigte Person');
  await walk(app, { ...PERSON, geburtsdatum: '17.05.2005' }, { stopAt: 'status' });
  // One status only: a single choice, no check boxes.
  await expect(app.locator('.question [role=radiogroup] [role=radio]')).toHaveCount(
    fieldById('status').options?.length ?? 0,
  );
  await expect(app.locator('.question input[type=checkbox]')).toHaveCount(0);
  expect(await step(app, radio(app, option('status', 'schueler')))).toBe(question('bezugRente'));
  await expect(radio(app, 'Nein')).toHaveAttribute('aria-checked', 'true');
  const school = await walk(app, { schulart: 'allgemein' }, { stopAt: 'artLautVereinbarung' });
  expect(school).toEqual([question('bezugRente'), question('schulart')]);

  const neverAsked = [question('grundsicherung'), question('elternzeitAnderswo')];
  await toSummary(app);
  await change(app, 'Status zu Beginn der Beschäftigung');
  const retired = await walk(app, {
    status: 'ruhestand',
    bezugPension: 'Nein',
    felegBezug: 'Nein',
  });
  expect(retired).toContain(question('bezugPension'));
  for (const text of neverAsked) expect(retired).not.toContain(text);

  const answers = {
    aktivrenteMonat: 'nein',
    rvNieVersichert: 'nein',
    ragErreicht: 'nein',
    rvVerzicht: 'nein',
  };
  const rag = question('ragErreicht');
  const withBirth = async (date: string) => {
    await change(app, 'Geburtsdatum');
    await app.locator('.question input').first().fill(date);
    await step(app, primary(app));
    const shown = await heading(app);
    return shown === 'Zusammenfassung' ? [] : [shown, ...(await walk(app, answers)).slice(1)];
  };
  // Born 1958: reached without asking; the Aktivrente questions come instead.
  const old = await withBirth('01.06.1958');
  expect(old).not.toContain(rag);
  expect(old).toContain(question('aktivrenteMonat'));
  await change(app, 'Geburtsdatum');
  await app.locator('.question input').first().fill('15.03.1960');
  expect(await step(app, primary(app))).toBe(rag);
  expect(await app.locator('.question [role=radio]').allTextContents()).toEqual([
    'Ja',
    'Nein',
    'Weiß ich nicht.',
  ]);
  await walk(app, answers);
  // Born 1965: not reached, without asking either.
  expect(await withBirth('01.01.1965')).not.toContain(rag);

  await change(app, 'Status zu Beginn der Beschäftigung');
  const employee = await walk(app, {
    status: 'arbeitnehmer',
    grundsicherung: 'Nein',
    elternzeitAnderswo: 'Nein',
  });
  for (const text of neverAsked) expect(employee).toContain(text);
  await expectQuiet(page, found);
});
