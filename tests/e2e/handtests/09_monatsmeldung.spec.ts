// Former manual tests of manual_tests/09_monatsmeldung.md (draft form "lohnmeldung"), played in
// the test build (Tobias 2026-11-08: only what a virtual browser cannot check stays a manual test).
import { expect, test, type Locator } from '@playwright/test';
import {
  answerUntil,
  download,
  expectQuiet,
  formFields,
  heading,
  openTestApp,
  press,
} from '../app';

const FORM = 'Monatsmeldung: Lohn- und Gehaltsdaten';
const FIELDS = formFields('lohnmeldung', true);

const row = (app: Locator, n: number) => app.locator('fieldset.table-row').nth(n);
const cell = (scope: Locator, label: string) =>
  scope
    .locator('.table-cell')
    .filter({ has: scope.page().locator('.cell-label', { hasText: label }) });

async function next(app: Locator): Promise<void> {
  const current = await heading(app);
  // Exact: "Weitere Zeile: …" adds a row.
  await app.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect.poll(() => heading(app)).not.toBe(current);
}

/** The background of a day button as [r, g, b]. */
async function colour(day: Locator): Promise<number[]> {
  const rgb = await day.evaluate((element) => getComputedStyle(element).backgroundColor);
  return (rgb.match(/\d+/g) ?? []).slice(0, 3).map(Number);
}

test('MT-94: a calendar per person, hours only with an hourly wage, suggested wage types', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page);
  await press(app, FORM);
  if ((await heading(app)) === 'Wer füllt jetzt aus?') await press(app, 'Ich bin: Arbeitgeber');
  await answerUntil(
    app,
    FIELDS,
    {
      abrechnungsmonat: '11.2026',
      agFirma: 'Beispiel Bau GmbH',
      agBetriebsnummer: '12345671',
      mandantennummer: '99999',
      ansprechpartner: 'Jürgen Beispiel',
      ansprechpartnerEmail: 'lohn@example.org',
      lohnarten: '1000 Stundenlohn\n2000 Nachtzuschlag 25 %',
    },
    'mitarbeitende',
  );
  await expect.poll(() => heading(app)).toBe('Wer war im Abrechnungsmonat beschäftigt?');

  await press(app, 'Mitarbeiter/in hinzufügen');
  const erika = row(app, 0);
  await cell(erika, 'Familienname, Vorname').locator('input').fill('Musterfrau, Erika');
  await cell(erika, 'Art der Vergütung').getByRole('radio', { name: 'Stundenlohn' }).click();
  await cell(erika, 'Stundenlohn bzw. Monatsentgelt').locator('input').fill('14,50');
  await expect(erika.locator('legend')).toHaveText('Mitarbeiter/in 1: Musterfrau, Erika');
  // Last month's pay is shown, never typed: it fills from last month's report only.
  await expect(erika.locator('p.table-cell')).toHaveText('Im Vormonat: –');
  await expect(cell(erika, 'Im Vormonat')).toHaveCount(0);

  await press(app, 'Weitere Zeile: Mitarbeiter/in 2');
  const max = row(app, 1);
  await cell(max, 'Familienname, Vorname').locator('input').fill('Beispiel, Max');
  await cell(max, 'Art der Vergütung').getByRole('radio', { name: 'festes Monatsentgelt' }).click();
  await cell(max, 'Stundenlohn bzw. Monatsentgelt').locator('input').fill('2.400');
  await expect(max.locator('legend')).toHaveText('Mitarbeiter/in 2: Beispiel, Max');

  await next(app);
  expect(await heading(app)).toBe('Urlaub und Krankheit in diesem Monat');
  for (const n of [0, 1]) {
    const calendar = row(app, n).locator('.calendar table');
    await expect(calendar.locator('caption')).toHaveText('November 2026');
    await expect(calendar.locator('thead th')).toHaveText([
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
      'So',
    ]);
    // 1 November 2026 is a Sunday, the 30th a Monday: six weeks.
    await expect(calendar.locator('tbody tr')).toHaveCount(6);
    await expect(calendar.locator('tbody tr').first().locator('button')).toHaveText(['1']);
  }
  const hours = ['Ausgefallene Stunden Urlaub', 'Ausgefallene Stunden Krankheit'];
  for (const label of hours) {
    await expect(cell(row(app, 0), label)).toHaveCount(1);
    await expect(cell(row(app, 1), label)).toHaveCount(0);
  }

  const day = (scope: Locator, date: string) =>
    scope.getByRole('button', { name: new RegExp(`^${date.replace(/\./g, '\\.')}: `) });
  const tap = async (scope: Locator, date: string, times: number) => {
    for (let i = 0; i < times; i++) await day(scope, date).click();
  };
  await tap(row(app, 0), '03.11.2026', 1);
  await tap(row(app, 0), '04.11.2026', 2);
  await tap(row(app, 0), '17.11.2026', 3);
  const marks = [
    ['03.11.2026', 'Urlaub', 'U'],
    ['04.11.2026', 'halber Urlaubstag', 'H'],
    ['17.11.2026', 'krank', 'K'],
  ] as const;
  for (const [date, label, letter] of marks) {
    await expect(day(row(app, 0), date)).toHaveAccessibleName(`${date}: ${label}`);
    await expect(day(row(app, 0), date).locator('.day-mark')).toHaveText(letter);
  }
  // Green, light blue, red.
  const [g1, g2, g3] = [
    await colour(day(row(app, 0), '03.11.2026')),
    await colour(day(row(app, 0), '04.11.2026')),
    await colour(day(row(app, 0), '17.11.2026')),
  ];
  expect((g1[1] ?? 0) > (g1[0] ?? 0) && (g1[1] ?? 0) > (g1[2] ?? 0), `green ${g1}`).toBe(true);
  expect((g2[2] ?? 0) > (g2[0] ?? 0), `light blue ${g2}`).toBe(true);
  expect((g3[0] ?? 0) > (g3[1] ?? 0) && (g3[0] ?? 0) > (g3[2] ?? 0), `red ${g3}`).toBe(true);
  // A fourth tap empties the day again.
  await tap(row(app, 0), '17.11.2026', 1);
  await expect(day(row(app, 0), '17.11.2026')).toHaveAccessibleName('17.11.2026: leer');
  await tap(row(app, 0), '17.11.2026', 3);
  await expect(row(app, 0).locator('.calendar-summary')).toHaveText(
    'Urlaub (1 Tag): 03.11.2026; halber Urlaubstag (1 Tag): 04.11.2026; krank (1 Tag): 17.11.2026',
  );

  await tap(row(app, 1), '10.11.2026', 1);
  await expect(day(row(app, 1), '10.11.2026')).toHaveAccessibleName('10.11.2026: Urlaub');
  await expect(day(row(app, 1), '10.11.2026').locator('.day-mark')).toHaveText('U');

  await next(app);
  await press(app, 'Zeile hinzufügen');
  const values = row(app, 0);
  const person = cell(values, 'Person').getByRole('combobox');
  await person.fill('Mus');
  await expect(cell(values, 'Person').getByRole('option')).toHaveText(['Musterfrau, Erika']);
  const wageType = cell(values, 'Lohnart').getByRole('combobox');
  await wageType.fill('10');
  await expect(cell(values, 'Lohnart').getByRole('option')).toHaveText(['1000 Stundenlohn']);
  // Any other text stays possible: the box keeps what was typed until a suggestion is taken.
  await expect(wageType).toHaveValue('10');
  await cell(values, 'Lohnart').getByRole('option', { name: '1000 Stundenlohn' }).click();
  await expect(wageType).toHaveValue('1000 Stundenlohn');
  await person.fill('Mus');
  await cell(values, 'Person').getByRole('option', { name: 'Musterfrau, Erika' }).click();
  await expect(person).toHaveValue('Musterfrau, Erika');
  await cell(values, 'Wert').locator('input').fill('100');

  await next(app);
  await answerUntil(app, FIELDS, { fragVormonat: 'Nein' });
  const summary = app
    .locator('.card')
    .filter({ has: page.locator('h2', { hasText: 'Zusammenfassung' }) });
  await expect(summary).toContainText(
    'Urlaub und Krankheit: Urlaub (1 Tag): 03.11.2026; halber Urlaubstag (1 Tag): 04.11.2026; krank (1 Tag): 17.11.2026',
  );
  await expect(summary).toContainText('Urlaub und Krankheit: Urlaub (1 Tag): 10.11.2026');
  await expect(summary).toContainText(
    'Person: Musterfrau, Erika; Lohnart: 1000 Stundenlohn; Wert: 100',
  );
  await expectQuiet(page, found);
});

test("MT-95: last month's report fills the next one", async ({ page }, testInfo) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-08T10:00:00+01:00'));
  const { found, app } = await openTestApp(page, 'monatsmeldung-november-unterschrieben');
  const stand = app
    .locator('section.card')
    .filter({ has: page.locator('h2', { hasText: 'Stand' }) });
  const november = await download(
    page,
    stand,
    'PDF erstellen',
    testInfo.outputPath('november.pdf'),
  );
  expect(november.name).toMatch(/\.pdf$/);
  await press(app, 'Fragebogen schließen');

  await press(app, FORM);
  await expect.poll(() => heading(app)).toBe('Wer füllt jetzt aus?');
  await app.locator('.take-over input[type=file]').setInputFiles(november.path);
  await expect(app).toContainText(
    /Arbeitgeber: \d+ Angaben übernommen, 2 Hinweise schon bestätigt\./,
  );
  await press(app, 'Weitermachen');

  // Notices confirmed last month are not asked again.
  await expect.poll(() => heading(app)).not.toMatch(/^(Hinweis|Bis wann|Arbeitszeit)/);
  for (let i = 0; i < 20 && (await heading(app)) !== 'Abrechnungsmonat'; i++) {
    await press(app, 'Zurück');
  }
  expect(await heading(app)).toBe('Abrechnungsmonat');
  await expect(app.locator('.question input').first()).toHaveValue('12.2026');

  const filled: Record<string, string> = {
    'Firma des Arbeitgebers': 'Beispiel Bau GmbH',
    Mandantennummer: '99999',
    'Wer gibt die Meldung ab und ist Ansprechperson für Rückfragen?': 'Jürgen Beispiel',
    'Lohnarten Ihres Betriebs': '1000 Stundenlohn\n2000 Nachtzuschlag 25 %',
  };
  const seen = new Set<string>();
  while ((await heading(app)) !== 'Wer war im Abrechnungsmonat beschäftigt?') {
    const current = await heading(app);
    const expected = filled[current];
    if (expected !== undefined) {
      await expect(app.locator('.question input, .question textarea').first()).toHaveValue(
        expected,
      );
      seen.add(current);
    }
    await next(app);
  }
  expect([...seen].sort()).toEqual(Object.keys(filled).sort());

  await expect(app.locator('fieldset.table-row')).toHaveCount(1);
  const erika = row(app, 0);
  await expect(erika.locator('legend')).toHaveText('Mitarbeiter/in 1: Musterfrau, Erika');
  await expect(erika.locator('p.table-cell')).toHaveText('Im Vormonat: 14,50 €');
  await cell(erika, 'Stundenlohn bzw. Monatsentgelt').locator('input').fill('15,00');
  await cell(erika, 'Neue Vergütung gilt ab').locator('input').first().fill('01.12.2026');

  await next(app);
  expect(await heading(app)).toBe('Urlaub und Krankheit in diesem Monat');
  await expect(erika.locator('.calendar-summary')).toHaveText('Keine Tage markiert.');
  await expect(erika.locator('.calendar button[aria-pressed=true]')).toHaveCount(0);

  await next(app);
  await answerUntil(app, FIELDS, {});
  const summary = app
    .locator('.card')
    .filter({ has: page.locator('h2', { hasText: 'Zusammenfassung' }) });
  await expect(summary).toContainText('Im Vormonat: 14,50 € (geändert)');
  await expectQuiet(page, found);
});
