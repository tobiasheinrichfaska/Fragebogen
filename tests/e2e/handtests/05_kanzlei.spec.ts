// Former manual tests of manual_tests/05_kanzlei.md, played in the test build (Tobias 2026-11-08:
// only what a virtual browser cannot check stays a manual test). The hand-over to the payroll
// program needs the local mapping (config/export.local.json, gitignored): those tests run only
// where it exists, read its values at run time and never print them; importing the file into the
// payroll program stays a manual test.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  answerUntil,
  download,
  expectQuiet,
  formFields,
  heading,
  openTestApp,
  pdfPages,
  press,
  toOverview,
} from '../app';

const MAPPING = fileURLToPath(new URL('../../../config/export.local.json', import.meta.url));

// The person's part of the Sofortmeldung, fictitious.
const SOFORT_PERSON: Readonly<Record<string, string>> = {
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
  anschriftZusatz: '',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
};

// The person's part of the Personalfragebogen up to the end, fictitious.
const PFB_PERSON: Readonly<Record<string, string>> = {
  ...SOFORT_PERSON,
  telefon: '',
  email: '',
  zahlungsweg: 'ueberweisung',
  iban: 'DE89 3704 0044 0532 0130 00',
  kontoinhaberSelbst: 'Ja',
  status: 'arbeitnehmer',
  bezugRente: 'Nein',
  grundsicherung: 'Nein',
  elternzeitAnderswo: 'Nein',
  artLautVereinbarung: 'festeStelle',
  weitereBeschaeftigung: 'Nein',
  vorbeschJahr: 'Nein',
  krankenversicherung: 'gesetzlich',
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
const PFB = 'Personalfragebogen: Angaben für die Lohnabrechnung';
const PFB_FIELDS = formFields('personalfragebogen', true);

interface Mapping {
  title: string;
  target: string;
  form: string;
  inputs?: { label: string; digits?: [number, number]; options?: { label: string }[] }[];
  records: { mask: string }[];
  howTo?: string[];
}

/** The local mapping of the Personalfragebogen, read at run time; never printed. */
function pfbMapping(): Mapping {
  const all = JSON.parse(readFileSync(MAPPING, 'utf8')) as Mapping[];
  const found = all.find((mapping) => mapping.form === 'personalfragebogen');
  if (!found) throw new Error('no mapping for the Personalfragebogen');
  return found;
}

const card = (app: Locator, title: string | RegExp) =>
  app.locator('section.card').filter({ has: app.page().locator('h2', { hasText: title }) });
// The card's own banners; the hand-over section below has banners of its own.
const warning = (scope: Locator, text: string) =>
  scope.locator(':scope > .banner-warning').filter({ hasText: text });
const inboxCard = (app: Locator) => card(app, 'Kanzlei: Eingänge zusammenführen');
const fileInput = (app: Locator) => inboxCard(app).locator('input[type=file]');
const normalized = (text: string) => text.replace(/\s+/g, ' ').trim();

async function sealWithoutSignature(app: Locator): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Ohne Unterschrift abschließen');
  await press(app, 'Abschließen');
}

async function signTyped(app: Locator, name: string): Promise<void> {
  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('label.typed-name input').fill(name);
  await press(app, 'Unterschreiben und abschließen');
}

/** The employer closes without a signature, writes the PDF and reads it in at the Kanzlei. */
async function employerToKanzlei(page: Page, app: Locator, path: string): Promise<Locator> {
  await sealWithoutSignature(app);
  const pdf = await download(page, app, 'PDF erstellen', path);
  await toOverview(app);
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await fileInput(app).setInputFiles(pdf.path);
  const group = card(app, new RegExp(`^${PFB} · `));
  await expect(group).toHaveCount(1);
  return group;
}

const info = (scope: Locator, text: string) =>
  scope.locator(':scope > .banner-info').filter({ hasText: text });

/** A new Personalfragebogen from the start page, the person at the question `stopAt`. */
async function personUntil(app: Locator, stopAt: string): Promise<void> {
  await press(app, PFB);
  await press(app, 'Ich bin: Beschäftigte Person');
  await answerUntil(app, PFB_FIELDS, PFB_PERSON, stopAt);
}

/** The first 8 characters of the questionnaire id the app shows. */
async function questionnaireNumber(app: Locator): Promise<string> {
  return ((await app.getByText(/^Fragebogen [0-9a-f]{8} · /).textContent()) ?? '').slice(11, 19);
}

/** The person answers the rest, signs with her typed name and writes the PDF in the overview. */
async function personToPdf(
  page: Page,
  app: Locator,
  path: string,
): Promise<{ path: string; id: string }> {
  await answerUntil(app, PFB_FIELDS, PFB_PERSON);
  await signTyped(app, 'Erika Musterfrau');
  await toOverview(app);
  const id = await questionnaireNumber(app);
  const pdf = await download(page, card(app, 'Stand'), 'PDF erstellen', path);
  await press(app, 'Fragebogen schließen');
  return { path: pdf.path, id };
}

/** Clicks the import download and answers the safety question; returns the question too. */
async function importFile(
  page: Page,
  exp: Locator,
  path: string,
): Promise<{ question: string; name: string; text: string }> {
  let early = 0;
  const count = () => early++;
  page.on('download', count);
  const button = exp.getByRole('button', { name: 'Importdatei herunterladen' });
  await expect(button).toBeEnabled();
  await button.click();
  const ask = exp.getByRole('alertdialog', { name: 'Sicherheitsfrage' });
  await expect(ask).toBeVisible();
  // The file waits for the answer.
  page.off('download', count);
  expect(early, 'downloads before the answer').toBe(0);
  const question = normalized((await ask.locator('p').textContent()) ?? '');
  const file = await download(page, ask, 'Ja, geprüft – Datei herunterladen', path);
  return { question, name: file.name, text: readFileSync(file.path, 'latin1') };
}

const numberInput = (exp: Locator, label: string) =>
  exp.locator('.export-numbers label').filter({ hasText: label }).locator('input');

/** Reads files in at the Kanzlei station; true when the button said "Wird gelesen …" meanwhile. */
async function readIn(page: Page, app: Locator, files: string[]): Promise<boolean> {
  await page.evaluate(() => {
    const w = window as unknown as { __reading?: boolean };
    w.__reading = false;
    new MutationObserver(() => {
      if (document.body.textContent?.includes('Wird gelesen …')) w.__reading = true;
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await fileInput(app).setInputFiles(files);
  await expect(inboxCard(app).getByRole('button', { name: 'Dateien hinzufügen …' })).toBeEnabled();
  return page.evaluate(() => (window as unknown as { __reading?: boolean }).__reading === true);
}

test('MT-40: several files of one questionnaire read in at once count once', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-arbeitgeber-abgeschlossen');
  const id = await questionnaireNumber(app);
  const handover = await download(
    page,
    card(app, 'Stand'),
    'PDF erstellen',
    testInfo.outputPath('weitergabe.pdf'),
  );
  expect(handover.name).toMatch(/_Weitergabe\.pdf$/);

  // The person fills in her part on the same device and signs.
  await press(app, 'Ich bin: Beschäftigte Person');
  await answerUntil(app, formFields('sofortmeldung', true), SOFORT_PERSON);
  await signTyped(app, 'Erika Musterfrau');
  await toOverview(app);
  expect(await questionnaireNumber(app)).toBe(id);
  const complete = await download(
    page,
    card(app, 'Stand'),
    'PDF erstellen',
    testInfo.outputPath('vollstaendig.pdf'),
  );
  expect(complete.name).toMatch(/_vollstaendig\.pdf$/);
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');

  expect(await readIn(page, app, [handover.path, complete.path])).toBe(true);
  const list = inboxCard(app).locator('ul.inbox > li');
  await expect(list).toHaveCount(2);
  for (const file of ['weitergabe.pdf', 'vollstaendig.pdf']) {
    await expect(list.filter({ hasText: file })).toContainText(
      `Personalfragebogen: Angaben für die Sofortmeldung 1.1.0 · Fragebogen ${id}`,
    );
  }
  const group = card(app, new RegExp(`· ${id}$`));
  await expect(group).toHaveCount(1);
  await expect(group).toContainText('2 Datei(en)');
  await expect(group).toContainText(
    'Dieselbe Fassung ist mehrfach eingegangen und wurde einmal übernommen. (Arbeitgeber',
  );
  await expect(group).toContainText('Vollständig und ohne Widersprüche.');
  await expectQuiet(page, found);
});

test('MT-40: the same file chosen again counts once', async ({ page }, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'sofortmeldung-vollstaendig');
  const complete = await download(
    page,
    card(app, 'Stand'),
    'PDF erstellen',
    testInfo.outputPath('vollstaendig.pdf'),
  );
  await press(app, 'Fragebogen schließen');
  await press(app, 'Eingänge zusammenführen');
  await readIn(page, app, [complete.path]);
  const list = inboxCard(app).locator('ul.inbox > li');
  await expect(list).toHaveCount(1);
  await readIn(page, app, [complete.path]);
  await expect(list).toHaveCount(1);
  const reports = inboxCard(app).locator('details.file-reports');
  await reports.locator('summary').click();
  await expect(reports.locator('.banner').last()).toHaveText(
    'vollstaendig.pdf: Diese Datei ist schon eingelesen; sie zählt einmal.',
  );
  await expectQuiet(page, found);
});

test('MT-41: the form view, the PDF for the personnel file and the JSON of the Kanzlei', async ({
  page,
}, testInfo) => {
  test.slow();
  const { found, app } = await openTestApp(page, 'kanzlei-sofortmeldung-vollstaendig');
  await press(app, 'Formular ansehen');
  const view = app.locator('.form-view');
  await expect(view.locator('section h3').first()).toBeVisible();
  // Who gave each answer stands next to it.
  await expect(view.locator('.summary-row.owner-person dd.muted').first()).toHaveText(
    'Beschäftigte Person',
  );
  await expect(view.locator('.summary-row.owner-arbeitgeber dd.muted').first()).toHaveText(
    'Arbeitgeber',
  );
  await expect(view.getByRole('heading', { name: 'Unterschriften und Abschlüsse' })).toBeVisible();
  const lines = view.locator('ol.signature-lines > li');
  await expect(lines).toHaveCount(2);
  expect(await lines.evaluateAll((items) => items.map((li) => li.getAttribute('value')))).toEqual([
    '1',
    '2',
  ]);
  await expect(
    lines.filter({ hasText: 'Beschäftigte Person, Fassung 1: unterschrieben am' }),
  ).toContainText('von Erika Musterfrau (getippter Name)');
  await expect(lines.filter({ hasText: 'Arbeitgeber, Fassung 1: abgeschlossen am' })).toHaveCount(
    1,
  );

  const group = card(app, /^Personalfragebogen: Angaben für die Sofortmeldung · /);
  const filed = await download(
    page,
    group,
    'PDF für die Personalakte',
    testInfo.outputPath('personalakte.pdf'),
  );
  expect(filed.name).toMatch(/^Sofortmeldung_[0-9a-f]{8}_vollstaendig\.pdf$/);
  const sheet = normalized((await pdfPages(filed.path)).join(' '));
  const receiptsInPdf = [
    ...sheet.matchAll(
      /Eingang (Kanzlei \(App\): \d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr, Datei [\w.]+\.pdf)/g,
    ),
  ].map((match) => match[1]);
  expect(receiptsInPdf).toEqual([expect.stringMatching(/Datei Sofortmeldung_vollstaendig\.pdf$/)]);

  const json = await download(
    page,
    group,
    'Daten speichern (JSON)',
    testInfo.outputPath('kanzlei.json'),
  );
  expect(json.name).toMatch(/^Sofortmeldung_[0-9a-f]{8}_Kanzlei\.json$/);

  // The PDF for the personnel file comes in again: its receipt is not doubled.
  await press(app, 'Zur Startseite');
  await press(app, 'Eingänge zusammenführen');
  await fileInput(app).setInputFiles(filed.path);
  await press(app, 'Formular ansehen');
  await expect(view.getByRole('heading', { name: 'Eingangsvermerke' })).toBeVisible();
  const receipts = (
    await view.locator('h3:text-is("Eingangsvermerke") + ul > li').allTextContents()
  )
    .map(normalized)
    .map((text) => text.replace(/ – .*$/, ''));
  expect(receipts).toEqual(receiptsInPdf);
  await expectQuiet(page, found);
});

test('MT-42: two versions that do not build on each other wait for the Kanzlei to choose', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'kanzlei-zwei-fassungen');
  const group = card(app, /^Personalfragebogen: Angaben für die Sofortmeldung · /);
  const conflict = group.locator('.conflict');
  await expect(conflict.getByRole('alert')).toContainText(
    'Für dieselbe Rolle liegen verschiedene Fassungen vor',
  );
  // Only the differing answer, one column per version with its date and file.
  const rows = conflict
    .locator('table.compare tbody tr')
    .filter({ has: page.locator('th:not(:empty)') });
  await expect(rows).toHaveCount(1);
  await expect(rows.locator('th')).toHaveText('Vornamen');
  await expect(rows.locator('td')).toHaveText(['Erika', 'Erika Maria']);
  const heads = conflict.locator('table.compare thead th');
  await expect(heads.nth(1)).toContainText('aus Sofortmeldung_Fassung_1.pdf');
  await expect(heads.nth(2)).toContainText('aus Sofortmeldung_Fassung_2.pdf');
  // Prepared at once, both versions carry the same time.
  const when = async (n: number) =>
    ((await heads.nth(n).textContent()) ?? '').replace(/^.* am (.*) aus .*$/, '$1');
  expect(await when(1)).toMatch(/\d\d\.\d\d\.\d{4}/);
  expect(await when(1)).toBe(await when(2));
  await expect(group.getByRole('button', { name: 'PDF für die Personalakte' })).toHaveCount(0);

  await conflict.getByRole('button', { name: 'Diese Fassung gilt' }).nth(1).click();
  await expect(conflict).toHaveCount(0);
  await expect(group).toContainText(
    'Von mehreren Fassungen gilt die ausgewählte; die anderen wurden verworfen.',
  );
  const decisions = group.locator('.decisions');
  await expect(decisions).toContainText(
    /Beschäftigte Person: Es gilt die Fassung vom .* \(aus Sofortmeldung_Fassung_2\.pdf\)\./,
  );
  // A contradiction is a hint for the Kanzlei; it does not block the output.
  await expect(warning(group, 'Widersprüche:')).toContainText(/Die Vornamen weichen .* ab\./);
  await expect(group.getByRole('button', { name: 'PDF für die Personalakte' })).toBeEnabled();

  await decisions.getByRole('button', { name: 'zurücknehmen' }).click();
  await expect(conflict.getByRole('alert')).toContainText(
    'Für dieselbe Rolle liegen verschiedene Fassungen vor',
  );

  const reports = inboxCard(app).locator('details.file-reports');
  await reports.locator('summary').click();
  await expect(reports.locator('.banner')).toHaveText([
    'Sofortmeldung_Fassung_1.pdf: Vorbereiteter Eingang aus dem Testbereich – nicht aus einer Datei gelesen.',
    'Sofortmeldung_Fassung_2.pdf: Vorbereiteter Eingang aus dem Testbereich – nicht aus einer Datei gelesen.',
  ]);
  await expectQuiet(page, found);
});

test('MT-43: questionnaires without a shared id are merged only on the Kanzlei decision', async ({
  page,
}) => {
  const { found, app } = await openTestApp(page, 'kanzlei-ohne-gemeinsame-id');
  const groups = card(app, /^Personalfragebogen: Angaben für die Sofortmeldung · /);
  await expect(groups).toHaveCount(2);
  for (const n of [0, 1]) {
    await expect(warning(groups.nth(n), 'Es fehlt noch:').locator('li')).toContainText([
      'Ein erforderlicher Teil fehlt noch. (',
    ]);
  }
  const ids = (await groups.locator('h2').allTextContents()).map((title) => title.slice(-8));
  const proposal = card(app, 'Gehören diese Fragebögen zusammen?');
  await expect(proposal).toContainText('Übereinstimmend: Familienname, Vornamen');

  await proposal.getByRole('button', { name: 'Zusammenführen' }).click();
  await expect(groups).toHaveCount(1);
  for (const id of ids) await expect(groups).toContainText(id);
  await expect(groups).toContainText(/zusammengeführt aus [0-9a-f]{8}, [0-9a-f]{8}/);
  const decisions = groups.locator('.decisions');
  await expect(decisions).toContainText(
    /Zusammengeführt: Fragebogen [0-9a-f]{8} und [0-9a-f]{8}\./,
  );
  await expect(decisions.getByRole('button', { name: 'zurücknehmen' })).toBeVisible();
  // The decision does not replace one side confirming the other.
  await expect(warning(groups, 'Es fehlt noch:')).toContainText(
    'Zwei Teile verweisen nicht aufeinander',
  );
  await expectQuiet(page, found);
});

test('MT-44: check hints when merging (job seeker as an Aushilfe, Regelaltersgrenze)', async ({
  page,
}, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'personalfragebogen-rag-arbeitslos-art-offen');
  await expect.poll(() => heading(app)).toBe('Wie ist die Beschäftigung vorgesehen?');
  await answerUntil(app, PFB_FIELDS, {
    agBeschaeftigungsart: 'kurzfristig',
    agKurzfristigBis: '31.12.2026',
    agKurzfristigArbeitstage: '30',
    agRahmenvereinbarung: 'Nein',
    agBesteuerung: 'elstam',
  });
  const group = await employerToKanzlei(page, app, testInfo.outputPath('aushilfe.pdf'));
  const hints = info(group, 'Prüfhinweise:').locator('li');
  // Each hint names where it comes from.
  await expect(
    hints.filter({ hasText: 'Arbeitsuchend gemeldet und als kurzfristige Aushilfe vorgesehen' }),
  ).toHaveText(/\(.+\)$/);
  await expect(
    hints.filter({
      hasText: 'Laut Geburtsdatum ist die Regelaltersgrenze bei Beschäftigungsbeginn erreicht',
    }),
  ).toContainText('Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.');
  // Hints block nothing.
  await expect(group.getByRole('button', { name: 'PDF für die Personalakte' })).toBeEnabled();
  await expectQuiet(page, found);
});

test('MT-45: the proposed Personengruppe, on screen and on the check sheet', async ({
  page,
}, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'personalfragebogen-minijob-entgelt-offen');
  await expect.poll(() => heading(app)).toBe('Wie wird die Person bezahlt?');
  await answerUntil(app, PFB_FIELDS, {
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '520,00',
    agBeschaeftigungsart: 'minijob',
    agBesteuerung: 'elstam',
  });
  const group = await employerToKanzlei(page, app, testInfo.outputPath('minijob.pdf'));
  // The limit is checked over the year (twelve months plus one-off payments).
  const proposal =
    'Personengruppe: 109 – Minijob: festes Monatsentgelt bis zur Geringfügigkeitsgrenze. 12 × 520,00 € = 6.240,00 € im Jahr; Geringfügigkeitsgrenze 2026: 12 × 603,00 € = 7.236,00 €.';
  const proposals = info(group, 'Vorschläge (die App entscheidet nicht – bitte prüfen):');
  await expect(proposals.locator('li').filter({ hasText: /^Personengruppe:/ })).toHaveText(
    proposal,
  );

  const filed = await download(
    page,
    group,
    'PDF für die Personalakte',
    testInfo.outputPath('personalakte.pdf'),
  );
  const squeezed = (await pdfPages(filed.path)).join('').replace(/\s+/g, '');
  expect(squeezed).toContain(proposal.replace(/\s+/g, ''));
  expect(squeezed).toContain('(DieAppentscheidetdasnicht.)');
  await expectQuiet(page, found);
});

test('MT-45: another job makes the proposal one to check', async ({ page }, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  // The other Minijob (300 €) and this one stay together below the limit.
  const { found, app } = await openTestApp(
    page,
    'personalfragebogen-zweiter-minijob-entgelt-offen',
  );
  await answerUntil(app, PFB_FIELDS, {
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '200,00',
    agBeschaeftigungsart: 'minijob',
    agBesteuerung: 'elstam',
  });
  const group = await employerToKanzlei(page, app, testInfo.outputPath('zwei-minijobs.pdf'));
  await expect(
    info(group, 'Vorschläge')
      .locator('li')
      .filter({ hasText: /^Personengruppe:/ }),
  ).toHaveText(/^Personengruppe: 109 – .* Bitte prüfen\.$/);
  await expectQuiet(page, found);
});

test('MT-88: proposals draw the right conclusion (two Minijobs, a job seeker as an Aushilfe)', async ({
  page,
  context,
}, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const proposed = (group: Locator, label: string) =>
    info(group, 'Vorschläge')
      .locator('li')
      .filter({ hasText: new RegExp(`^${label}:`) });

  const two = await openTestApp(page, 'personalfragebogen-zweiter-minijob-entgelt-offen');
  await answerUntil(two.app, PFB_FIELDS, {
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '450,00',
    agBeschaeftigungsart: 'minijob',
    agBesteuerung: 'elstam',
  });
  let group = await employerToKanzlei(page, two.app, testInfo.outputPath('minijobs.pdf'));
  // 450 € and the other 300 € lie above 603 € together: no Minijob (not 109).
  await expect(proposed(group, 'Personengruppe')).toHaveText(
    /^Personengruppe: 101 – .*Minijob.* Bitte prüfen\.$/,
  );
  await expect(proposed(group, 'Beitragsgruppen \\(KV RV AV PV\\)')).toHaveText(/: 1111 – /);
  await expect(proposed(group, 'Kennzeichen Übergangsbereich')).toHaveText(
    /: 1 – .* Bitte prüfen\.$/,
  );
  await expectQuiet(page, two.found);

  // Each run on a page of its own: one set of guards per page.
  const aushilfe = async (pay: string, file: string) => {
    const page = await context.newPage();
    const opened = await openTestApp(page, 'personalfragebogen-arbeitslos-entgelt-offen');
    await expect.poll(() => heading(opened.app)).toBe('Wie hoch ist das Monatsentgelt brutto?');
    await answerUntil(opened.app, PFB_FIELDS, {
      agMonatsentgelt: pay,
      agBeschaeftigungsart: 'kurzfristig',
      agKurzfristigBis: '31.12.2026',
      agKurzfristigArbeitstage: '30',
      agRahmenvereinbarung: 'Nein',
      agBesteuerung: 'elstam',
    });
    return {
      page,
      group: await employerToKanzlei(page, opened.app, testInfo.outputPath(file)),
      found: opened.found,
    };
  };
  // A job seeker is employed berufsmäßig: above the limit the Aushilfe is not kurzfristig.
  const above = await aushilfe('1.500,00', 'aushilfe-1500.pdf');
  group = above.group;
  await expect(proposed(group, 'Personengruppe')).toHaveText(
    /^Personengruppe: 101 – .*berufsmäßig.* Bitte prüfen\.$/i,
  );
  await expectQuiet(above.page, above.found);
  // Up to the limit the Berufsmäßigkeit does not matter.
  const below = await aushilfe('500,00', 'aushilfe-500.pdf');
  group = below.group;
  await expect(proposed(group, 'Personengruppe')).toHaveText(/^Personengruppe: 110 – /);
  await expect(proposed(group, 'Beitragsgruppen \\(KV RV AV PV\\)')).toHaveText(/: 0000 – /);
  await expectQuiet(below.page, below.found);
});

test('MT-68: hand-over to the payroll program, up to the import file', async ({
  page,
}, testInfo) => {
  test.skip(!existsSync(MAPPING), 'needs the local mapping config/export.local.json');
  test.slow();
  const mapping = pfbMapping();
  const { found, app } = await openTestApp(page, 'kanzlei-personalfragebogen-vollstaendig');
  const exp = app.locator('.export');
  await expect(exp.locator('h3')).toHaveText(`Übergabe an ${mapping.title}`);
  const blocking = exp.locator('.banner-warning').filter({ hasText: 'Noch keine Importdatei:' });
  await expect(blocking.locator('li')).toHaveText([
    'Mandantennummer (1 bis 5 Ziffern) fehlt.',
    'Bitte wählen: Mitarbeiter neu anlegen oder vorhandenen Mitarbeiter ergänzen.',
  ]);
  await expect(exp.getByRole('button', { name: 'Importdatei herunterladen' })).toBeDisabled();
  // The health insurer the person named stands with the inputs.
  await expect(
    exp.locator('.export-input .muted').filter({ hasText: 'Techniker Krankenkasse' }),
  ).not.toHaveCount(0);

  await numberInput(exp, 'Mandantennummer').fill('10001');
  await numberInput(exp, 'Mitarbeiternummer').fill('43');
  await exp.getByRole('radio', { name: 'neu anlegen' }).check();
  const notTransferred = exp
    .locator('.banner-warning')
    .filter({ hasText: `Nicht übertragen – bitte in ${mapping.title} selbst erfassen:` })
    .locator('li');
  // Counted, not printed: the lines name the program's masks.
  const withReason = async () => {
    const lines = await notTransferred.allTextContents();
    return { count: lines.length, reasons: lines.every((line) => /: \S/.test(line)) };
  };
  const before = await withReason();
  expect(before.count > 0 && before.reasons, 'without the inputs, records stay out, with why').toBe(
    true,
  );
  const blocks = exp.locator('.export-input');
  for (let i = 0; i < (await blocks.count()); i++) {
    const block = blocks.nth(i);
    const label = (await block.locator(':scope > span').first().textContent()) ?? '';
    const input = mapping.inputs?.find((candidate) => candidate.label === label);
    expect(input !== undefined, `input ${i + 1} belongs to the mapping`).toBe(true);
    const box = block.locator('input').first();
    if ((await box.inputValue()) !== '') continue;
    if (input?.digits) {
      await box.fill('1'.repeat(input.digits[0]));
    } else {
      await box.fill(input?.options?.[0]?.label ?? '');
      await block.getByRole('option').first().click();
    }
    await expect(block.locator('.error-text')).toHaveCount(0);
  }
  await expect(blocking).toHaveCount(0);

  await exp.getByRole('button', { name: 'Erfassungsblatt ansehen' }).click();
  // The sheet follows the masks of the program, in the mapping's order (checked without printing).
  const headings = await exp.locator('table.sheet tr.sheet-mask th').allTextContents();
  const order = mapping.records.map((record) => record.mask.split('|').join(' › '));
  let at = 0;
  const inOrder = headings.every((text) => {
    const next = order.indexOf(text, at);
    at = next;
    return next >= 0;
  });
  expect(headings.length > 1 && inOrder, 'the sheet follows the masks of the mapping').toBe(true);
  const after = await withReason();
  expect(after.count < before.count && after.reasons, 'the inputs bring their records in').toBe(
    true,
  );

  const imported = await importFile(page, exp, testInfo.outputPath('import.txt'));
  expect(imported.question).toBe(
    `Sicherheitsfrage: Mitarbeiternummer 43 (eingetragen): Ist sie in ${mapping.title} beim Mandanten 10001 noch frei? Die Datei legt Musterfrau, Erika unter dieser Nummer neu an.`,
  );
  expect(imported.name).toBe(`${mapping.target}_Stammdaten_10001_43.txt`);
  expect(imported.text.startsWith('[Allgemein]\r\n'), 'import file header').toBe(true);
  expect(imported.text.split('[Mitarbeiter]').length - 1, 'a new employee is created').toBe(2);
  await expectQuiet(page, found);
});

test('MT-69: the Erfassungsblatt as a PDF of its own for the personnel file', async ({
  page,
}, testInfo) => {
  test.skip(!existsSync(MAPPING), 'needs the local mapping config/export.local.json');
  test.slow();
  const mapping = pfbMapping();
  const { found, app } = await openTestApp(page, 'kanzlei-personalfragebogen-vollstaendig');
  const exp = app.locator('.export');
  const text = async (path: string) => normalized((await pdfPages(path)).join(' '));

  // Without an import file yet the sheet says why.
  const early = await download(
    page,
    exp,
    'Erfassungsblatt als PDF',
    testInfo.outputPath('frueh.pdf'),
  );
  expect((await text(early.path)).includes('Noch keine Importdatei: '), 'reason on the sheet').toBe(
    true,
  );

  await numberInput(exp, 'Mandantennummer').fill('10001');
  await numberInput(exp, 'Mitarbeiternummer').fill('42');
  await exp.getByRole('radio', { name: 'neu anlegen' }).check();
  const sheet = await download(
    page,
    exp,
    'Erfassungsblatt als PDF',
    testInfo.outputPath('blatt.pdf'),
  );
  // Numbers only, no name.
  expect(sheet.name).toMatch(
    new RegExp(`^Erfassungsblatt_${mapping.target}_M10001_MA42_[0-9a-f]{8}\\.pdf$`),
  );
  const content = await text(sheet.path);
  const has = (part: string | RegExp) =>
    typeof part === 'string' ? content.includes(part) : part.test(content);
  expect(
    has('Mandant 10001 · Mitarbeiter 42 (neu anlegen) · Musterfrau, Erika · Eintritt 02.11.2026'),
    'head of the sheet',
  ).toBe(true);
  expect(has(/Grundlage .*SHA-256 [0-9a-f]{64}/), 'the parts with SHA-256').toBe(true);
  expect(has('Von der Kanzlei eingetragen'), 'inputs of the Kanzlei').toBe(true);
  const masks = mapping.records.map((record) => record.mask.split('|').join(' › '));
  let at = 0;
  const inOrder = [...new Set(masks)].every((mask) => {
    const next = content.indexOf(mask, at);
    if (next < 0) return true;
    at = next;
    return true;
  });
  expect(inOrder && masks.some((mask) => content.includes(mask)), 'values by mask').toBe(true);
  const banners = async (title: string) =>
    (await exp.locator('.banner').filter({ hasText: title }).count()) > 0;
  expect(
    has(`Nicht übertragen – in ${mapping.title} selbst erfassen`),
    'not transferred, as on screen',
  ).toBe(await banners('Nicht übertragen – bitte in'));
  expect(has('Übertragen, bitte im Importprotokoll prüfen'), 'to check, as on screen').toBe(
    await banners('Übertragen, bitte im Importprotokoll prüfen:'),
  );
  expect(has('Einspielen'), 'how to read it in').toBe((mapping.howTo ?? []).length > 0);

  // One document per file: the PDF for the personnel file carries no Erfassungsblatt.
  const group = card(app, new RegExp(`^${PFB} · `));
  const filed = await download(
    page,
    group,
    'PDF für die Personalakte',
    testInfo.outputPath('akte.pdf'),
  );
  expect((await text(filed.path)).includes('Erfassungsblatt'), 'no sheet in the PDF').toBe(false);
  await expectQuiet(page, found);
});

test('MT-70: the Sofortmeldung creates the employee, the Personalfragebogen completes it', async ({
  page,
  context,
}, testInfo) => {
  test.skip(!existsSync(MAPPING), 'needs the local mapping config/export.local.json');
  test.slow();
  const title = pfbMapping().title;
  const first = await openTestApp(page, 'kanzlei-sofortmeldung-personalnummer');
  const exp = first.app.locator('.export');
  await expect(numberInput(exp, 'Mitarbeiternummer')).toHaveAttribute(
    'placeholder',
    'laut Fragebogen: 42',
  );
  await numberInput(exp, 'Mandantennummer').fill('10001');
  await exp.getByRole('radio', { name: 'neu anlegen' }).check();
  const created = await importFile(page, exp, testInfo.outputPath('sofortmeldung.txt'));
  expect(created.question).toContain(
    `Mitarbeiternummer 42 (aus dem Fragebogen): Ist sie in ${title} beim Mandanten 10001 noch frei?`,
  );
  expect(created.text.split('[Mitarbeiter]').length - 1, 'created').toBe(2);
  await expectQuiet(page, first.found);

  // Later, on a page of its own: the Personalfragebogen of the same person.
  const second = await context.newPage();
  await completeLater(second, title, testInfo.outputPath('personalfragebogen.txt'));
});

async function completeLater(page: Page, title: string, path: string): Promise<void> {
  const later = await openTestApp(page, 'kanzlei-personalfragebogen-vollstaendig');
  const exp = later.app.locator('.export');
  await numberInput(exp, 'Mandantennummer').fill('10001');
  await exp.getByRole('radio', { name: 'vorhandenen Mitarbeiter ergänzen' }).check();
  await expect(exp.locator('.export-mode')).toContainText(
    `Bitte in ${title} vergleichen: Mitarbeiter 42 ist Musterfrau, Erika, Eintritt 02.11.2026.`,
  );
  const completed = await importFile(page, exp, path);
  expect(completed.question).toBe(
    `Sicherheitsfrage: Gehört die Mitarbeiternummer 42 (aus dem Fragebogen) in ${title} beim Mandanten 10001 zu Musterfrau, Erika, Eintritt 02.11.2026? Die Datei überschreibt die Stammdaten dieses Mitarbeiters mit den Angaben des Fragebogens.`,
  );
  // Selected, not created a second time.
  expect(completed.text.split('[Mitarbeiter]').length - 1, 'selected only').toBe(1);
  await expectQuiet(page, later.found);
}

test('MT-71: the health insurer from the list or typed freely, and the safety question', async ({
  page,
}, testInfo) => {
  test.skip(!existsSync(MAPPING), 'needs the local mapping config/export.local.json');
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const mapping = pfbMapping();
  const insurerInput = mapping.inputs?.find((input) => input.options && input.digits);
  if (!insurerInput?.digits) throw new Error('the mapping has no insurer input');
  const { found, app } = await openTestApp(page);

  await personUntil(app, 'krankenkasse');
  const box = app.locator('.question').getByRole('combobox');
  await box.pressSequentially('tk');
  // The list filters while typing; the short name finds the insurer.
  await expect(app.locator('.question [role=option]').first()).toHaveText('Techniker Krankenkasse');
  await box.press('ArrowDown');
  await box.press('ArrowUp');
  await box.press('Enter');
  await expect(box).toHaveValue('Techniker Krankenkasse');
  await press(app, 'Weiter');
  const listed = await personToPdf(page, app, testInfo.outputPath('liste.pdf'));

  await personUntil(app, 'krankenkasse');
  await box.fill('Meine Betriebskasse');
  await expect(app.locator('.question .warning-text')).toHaveText(
    /^Nicht in der Liste\. Die freie Eingabe ist möglich, kann aber Rückfragen und Zusatzaufwand verursachen/,
  );
  const asked = await heading(app);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(asked);
  const typed = await personToPdf(page, app, testInfo.outputPath('frei.pdf'));

  await press(app, 'Eingänge zusammenführen');
  await fileInput(app).setInputFiles([listed.path, typed.path]);
  const first = card(app, new RegExp(`^${PFB} · ${listed.id}$`));
  const second = card(app, new RegExp(`^${PFB} · ${typed.id}$`));
  const insurer = (group: Locator) =>
    group.locator('.export-input').filter({ hasText: insurerInput.label });
  await expect(insurer(first).getByRole('combobox')).toHaveValue(/^15027365( – |$)/);
  const search = insurer(second).getByRole('combobox');
  await expect(search).toHaveValue('');
  // The list finds insurers by name or number; a missing one goes in with its digits.
  await search.fill('Techniker');
  await expect(
    insurer(second)
      .getByRole('option')
      .filter({ hasText: /^15027365 – / }),
  ).toHaveCount(1);
  await search.fill('1502736');
  await expect(
    insurer(second)
      .getByRole('option')
      .filter({ hasText: /^15027365 – / }),
  ).toHaveCount(1);
  await search.fill(
    '98765432'.padEnd(insurerInput.digits[0], '1').slice(0, insurerInput.digits[0]),
  );
  await expect(insurer(second).locator('.error-text')).toHaveCount(0);

  const exp = first.locator('.export');
  await expect(
    exp
      .locator('.export-numbers label')
      .filter({ hasText: 'Mitarbeiternummer' })
      .locator('.error-text'),
  ).toHaveText('Im Fragebogen nicht angegeben – bitte eintragen.');
  await numberInput(exp, 'Mandantennummer').fill('10001');
  await numberInput(exp, 'Mitarbeiternummer').fill('7');
  // Only the person's part: a new employee needs the employer's entry date.
  await exp.getByRole('radio', { name: 'neu anlegen' }).check();
  await expect(
    exp.locator('.banner-warning').filter({ hasText: 'Noch keine Importdatei:' }).locator('li'),
  ).toHaveText([
    'Für die Neuanlage fehlt: Eintrittsdatum.',
    'Für die Neuanlage fehlt: erster abzurechnender Monat.',
  ]);
  await expect(exp.getByRole('button', { name: 'Importdatei herunterladen' })).toBeDisabled();
  await exp.getByRole('radio', { name: 'vorhandenen Mitarbeiter ergänzen' }).check();
  const imported = await importFile(page, exp, testInfo.outputPath('import.txt'));
  expect(imported.question).toBe(
    `Sicherheitsfrage: Gehört die Mitarbeiternummer 7 (eingetragen) in ${mapping.title} beim Mandanten 10001 zu Musterfrau, Erika? Die Datei überschreibt die Stammdaten dieses Mitarbeiters mit den Angaben des Fragebogens.`,
  );
  expect(imported.name).toBe(`${mapping.target}_Stammdaten_10001_7.txt`);
  await expectQuiet(page, found);
});

test('MT-72: Kinderfreibeträge in half steps with − and +', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page);
  await personUntil(app, 'kinderfreibetraege');
  const asked = await heading(app);
  const input = app.locator('.question .stepper input');
  const plus = app.getByRole('button', { name: '0,5 mehr' });
  const minus = app.getByRole('button', { name: '0,5 weniger' });
  await expect(plus).toHaveText('+');
  await expect(minus).toHaveText('−');
  // Not below 0.
  await input.fill('0');
  await minus.click();
  await expect(input).toHaveValue('0');
  for (const [button, value] of [
    [plus, '0,5'],
    [plus, '1'],
    [plus, '1,5'],
    [minus, '1'],
  ] as const) {
    await button.click();
    await expect(input).toHaveValue(value);
  }
  await input.fill('4,3');
  await press(app, 'Weiter');
  await expect(app.locator('.question .field-error')).toHaveText(
    /^Bitte eine Zahl in halben Schritten eingeben/,
  );
  expect(await heading(app)).toBe(asked);
  await input.fill('4,5');
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(asked);
  await expectQuiet(page, found);
});
