// The whole path with the built single file from file:// (step 10): the employer fills in and seals
// the Sofortmeldung, the person signs with the mouse, the PDF is created and opened again, and the
// Kanzlei reads it in and writes the PDF for the personnel file. Guards: no request leaves the
// device, no CSP violation, no console error, nothing left in the browser's storage.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { expectClean, guard } from './guards';

const APP = fileURLToPath(new URL('../../dist/index.html', import.meta.url));
const FORM = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../forms/sofortmeldung/0.2.0.json', import.meta.url)),
    'utf8',
  ),
) as {
  sections: {
    fields: {
      id: string;
      type: string;
      label: string;
      question?: string;
      options?: { id: string; label: string }[];
    }[];
  }[];
};

// Fictitious data only.
const ANSWERS: Readonly<Record<string, string>> = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agPersonalnummer: '',
  agBeschaeftigungsbeginn: '02.11.2026',
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

// The heading as the app shows it: `{id}` placeholders filled with the earlier answer („…“).
const FIELDS = new Map(
  FORM.sections
    .flatMap((section) => section.fields)
    .map((field) => [
      (field.question ?? field.label).replace(
        / ?\{([a-zA-Z0-9]+)\}/g,
        (match, id: string) => `${match.startsWith(' ') ? ' ' : ''}„${ANSWERS[id] ?? ''}“`,
      ),
      field,
    ]),
);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function press(page: Page, text: string): Promise<void> {
  await page
    .locator('button:not([disabled]), label')
    .filter({ hasText: new RegExp(`^\\s*${escape(text)}`) })
    .first()
    .click();
}

async function heading(page: Page): Promise<string> {
  return page
    .locator('.card h2')
    .first()
    .evaluate((element) => element.childNodes[0]?.textContent?.trim() ?? '');
}

/** Answers every step of the interview with ANSWERS until the summary (or the question stopAt). */
async function answerUntilSummary(page: Page, stopAt?: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const current = await heading(page);
    if (current === 'Zusammenfassung') return;
    if (stopAt !== undefined && FIELDS.get(current)?.id === stopAt) return;
    if (current.startsWith('Datenschutz') || current.startsWith('Hinweis')) {
      await press(
        page,
        current.startsWith('Datenschutz')
          ? 'Ich habe den Hinweis gelesen.'
          : 'Ich habe diesen Hinweis auf Papier erhalten.',
      );
      await press(page, 'Weiter');
      await expect.poll(() => heading(page)).not.toBe(current);
      continue;
    }
    const field = FIELDS.get(current);
    if (!field) throw new Error(`unknown question "${current}"`);
    const value = ANSWERS[field.id] ?? '';
    if (field.type === 'choice') {
      await press(page, field.options?.find((option) => option.id === value)?.label ?? value);
    } else if (field.type === 'boolean') {
      await press(page, value);
    } else {
      await page.locator('.question input, .question textarea').first().fill(value);
      await press(page, 'Weiter');
    }
    await expect.poll(() => heading(page)).not.toBe(current);
  }
  throw new Error('the summary was not reached');
}

async function sign(page: Page): Promise<void> {
  const pad = page.locator('canvas.signature-pad');
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error('no signature pad');
  const path: [number, number][] = [
    [0.1, 0.6],
    [0.2, 0.3],
    [0.3, 0.7],
    [0.4, 0.35],
    [0.5, 0.65],
    [0.6, 0.4],
    [0.7, 0.6],
  ];
  for (const [i, [fx, fy]] of path.entries()) {
    const x = box.x + box.width * fx;
    const y = box.y + box.height * fy;
    if (i === 0) {
      await page.mouse.move(x, y);
      await page.mouse.down();
    } else {
      await page.mouse.move(x, y, { steps: 4 });
    }
  }
  await page.mouse.up();
}

async function download(page: Page, button: string, path: string): Promise<string> {
  const [file] = await Promise.all([page.waitForEvent('download'), press(page, button)]);
  await file.saveAs(path);
  return path;
}

test('employer, person with a drawn signature, PDF, reopen, Kanzlei — all on this device', async ({
  page,
}, testInfo) => {
  const found = await guard(page);
  await page.goto(pathToFileURL(APP).href);
  await expect(page.locator('main')).toContainText('Neuer Fragebogen');

  await press(page, 'Personalfragebogen: Angaben für die Sofortmeldung');
  await press(page, 'Ich bin: Arbeitgeber');
  await answerUntilSummary(page);
  await press(page, 'Weiter zum Abschluss');
  await press(page, 'Ich bestätige die Angaben des Arbeitgebers.');
  await press(page, 'Ohne Unterschrift abschließen');
  await press(page, 'Abschließen');
  await press(page, 'Gerät weitergeben');

  await press(page, 'Ich bin: Beschäftigte Person');
  await answerUntilSummary(page);
  await press(page, 'Weiter zum Abschluss');
  await press(page, 'Ich versichere, dass meine Angaben richtig und vollständig sind.');
  await sign(page);
  await press(page, 'Unterschreiben und abschließen');
  await press(page, 'Gerät weitergeben');
  await expect(page.locator('main')).toContainText('Vollständig');

  const pdf = await download(page, 'PDF erstellen', testInfo.outputPath('sofortmeldung.pdf'));
  expect(statSync(pdf).size).toBeGreaterThan(10_000);

  await press(page, 'Fragebogen schließen');
  await page.locator('input[type=file]').first().setInputFiles(pdf);
  await expect(page.locator('main')).toContainText(
    'Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.',
  );

  await press(page, 'Fragebogen schließen');
  await press(page, 'Eingänge zusammenführen');
  await page.locator('input[type=file]').first().setInputFiles(pdf);
  await expect(page.locator('main')).toContainText('Vollständig und ohne Widersprüche.');
  const personnelFile = await download(
    page,
    'PDF für die Personalakte',
    testInfo.outputPath('personalakte.pdf'),
  );
  expect(statSync(personnelFile).size).toBeGreaterThan(10_000);

  await expectClean(page, found);
});

test('a master-data link made on the start page fills the next questionnaire', async ({ page }) => {
  const found = await guard(page);
  await page.goto(pathToFileURL(APP).href);
  await press(page, 'Stammdaten-Link erstellen oder ändern');
  const form = page.locator('.master-link-form');
  await form.locator('#master-firma').fill('Beispiel Bau GmbH');
  await form.locator('#master-betriebsnummer').fill('1234 567X');
  await expect(form).toContainText('Bitte erst die markierten Angaben berichtigen.');
  await form.locator('#master-betriebsnummer').fill('1234 5671');
  const link = form.getByLabel('Stammdaten-Link');
  await expect(link).toHaveValue(
    /#stammdaten=1&betriebsnummer=12345671&firma=Beispiel\+Bau\+GmbH$/,
  );

  // Opened like a bookmark: a fresh load with the fragment. Only the fragment is used — a build
  // with an app address points the link to the hosted app, which this test must never load.
  const url = await link.inputValue();
  await page.goto(pathToFileURL(APP).href + url.slice(url.indexOf('#')));
  await page.reload();
  await press(page, 'Personalfragebogen: Angaben für die Sofortmeldung');
  await press(page, 'Ich bin: Arbeitgeber');
  await expect(page.locator('main')).toContainText('Stammdaten aus Ihrem Lesezeichen übernommen.');
  await answerUntilSummary(page, 'agFirma');
  await expect(page.locator('.question input').first()).toHaveValue('Beispiel Bau GmbH');
  await expect(page.locator('main')).toContainText('Vorbelegt aus Ihrem Stammdaten-Link');

  await expectClean(page, found);
});

test('the Content-Security-Policy refuses a request to the internet', async ({ page }) => {
  await guard(page);
  await page.goto(pathToFileURL(APP).href);
  await expect(page.locator('main')).toContainText('Neuer Fragebogen');
  const outcome = await page.evaluate(() =>
    fetch('https://example.org/').then(
      () => 'sent',
      () => 'refused',
    ),
  );
  expect(outcome).toBe('refused');
  await expect
    .poll(() => page.evaluate(() => window.__cspViolations ?? []))
    .toEqual(expect.arrayContaining([expect.stringContaining('connect-src')]));
});

test('the built file carries the policy and loads nothing from outside', () => {
  const html = readFileSync(APP, 'utf8');
  expect(html).toMatch(/<meta http-equiv="Content-Security-Policy" content="default-src 'none';/);
  expect(html).not.toMatch(/<script[^>]+src=|<link[^>]+rel="stylesheet"/);
});

test('the hosted build carries no test page (test folder build only)', () => {
  const html = readFileSync(APP, 'utf8');
  // "Testbereich" may appear: the start page links to the test folder when configured.
  for (const marker of ['Testbericht', 'Test beginnen', 'fragebogen-testlauf']) {
    expect(html.includes(marker), marker).toBe(false);
  }
});

test('the hosted build carries no mapping to a payroll program (Kanzlei build only)', () => {
  // A mapping names the program's fields (config/export.local.json, gitignored); only `--mode
  // kanzlei` and the review preview bundle it. The markers come from the local file itself, so this
  // public test names none of them; without the file there is nothing that could leak.
  const html = readFileSync(APP, 'utf8');
  const local = fileURLToPath(new URL('../../config/export.local.json', import.meta.url));
  const markers = existsSync(local)
    ? (JSON.parse(readFileSync(local, 'utf8')) as { records: { mask: string }[] }[]).flatMap(
        (mapping) => mapping.records.map((record) => record.mask),
      )
    : [];
  for (const marker of new Set(markers)) expect(html.includes(marker), marker).toBe(false);
});
