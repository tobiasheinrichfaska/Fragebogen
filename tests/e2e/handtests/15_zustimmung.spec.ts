// The Zustimmung zur elektronischen Übermittlung der Steuererklärungen 1.0.0 (production since
// 2026-11-14) in the public build: the Kanzlei prefills without a signature, the client confirms the
// page of its recipient, signs, and the PDF carries only the pages that apply (Known Limitations:
// "No e2e hand test yet").
import { expect, test, type Locator } from '@playwright/test';
import { download, expectQuiet, heading, openApp, pdfPages, press, toOverview } from '../app';

const FORM = 'Zustimmung zur elektronischen Übermittlung der Steuererklärungen';
const CLIENT = 'Mandant / Steuerpflichtiger';

async function at(app: Locator, text: string): Promise<void> {
  await expect.poll(() => heading(app)).toBe(text);
}

/** Types `value` (empty leaves a voluntary question empty) and goes on with "Weiter". */
async function type(app: Locator, value: string): Promise<void> {
  const before = await heading(app);
  await app.locator('.question input, .question textarea').first().fill(value);
  await press(app, 'Weiter');
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** A button that moves on (a choice, "Weiter"). */
async function next(app: Locator, label = 'Weiter'): Promise<void> {
  const before = await heading(app);
  await press(app, label);
  await expect.poll(() => heading(app)).not.toBe(before);
}

/** Confirms the notice on the screen and goes on. */
async function confirm(app: Locator): Promise<void> {
  await app.locator('label.confirm input').check();
  await next(app);
}

test('Zustimmung: the Kanzlei prefills, the client consents and signs, the PDF shows its pages only', async ({
  page,
}, testInfo) => {
  const { found, app } = await openApp(page);
  await press(app, FORM);
  await press(app, 'Ich bin: Kanzlei');

  await at(app, 'Für wen legen Sie die Erklärungen vor?');
  await type(app, 'Erika Musterfrau');
  await at(app, 'Von wann ist das Schreiben, mit dem Sie die Erklärungen übersandt haben?');
  await type(app, '28.10.2026');
  await at(app, 'Welche Erklärungen haben Sie übersandt?');
  await app.locator('.question label.choice', { hasText: /^Einkommensteuererklärung$/ }).click();
  await next(app);
  await at(app, 'Einzel- oder Zusammenveranlagung?');
  await next(app, 'Einzelveranlagung');
  await at(app, 'Gibt es Einschränkungen zu den übersandten Erklärungen?');
  await type(app, '');
  await at(app, 'Zusammenfassung');
  await press(app, 'Weiter zum Abschluss');
  // The Kanzlei only prefills: it completes without a signature.
  await expect(app.getByRole('button', { name: 'Unterschreiben', exact: true })).toHaveCount(0);
  await app
    .getByRole('checkbox', {
      name: 'Wir legen die Erklärungen mit diesen Angaben zur Zustimmung vor; unsere Allgemeinen Geschäftsbedingungen haben wir mit den Erklärungen übersandt.',
    })
    .check();
  await press(app, 'Abschließen');
  await expect(app).toContainText('Kanzlei: abgeschlossen');
  await toOverview(app);

  await press(app, `Ich bin: ${CLIENT}`);
  // What the Kanzlei named is taken over and not asked; the page of the Finanzverwaltung comes,
  // those of the banks and the Unternehmensregister do not.
  await at(app, 'Steuererklärungen');
  await expect(app).toContainText('auf Vollständigkeit und Richtigkeit geprüft (§ 87d Abs. 3 AO)');
  await confirm(app);
  await at(app, 'Allgemeine Geschäftsbedingungen und Datenschutz');
  await confirm(app);
  await at(app, 'Möchten Sie Einschränkungen zu Ihrer Zustimmung angeben?');
  await type(app, '');
  await at(app, 'Wer unterschreibt?');
  await expect(app.locator('.question input').first()).toHaveValue('Erika Musterfrau');
  await next(app);
  await at(app, 'Zusammenfassung');
  await expect(app).not.toContainText('Digitaler Finanzbericht');

  await press(app, 'Weiter zum Abschluss');
  await app.locator('label.confirm input').check();
  await press(app, 'Namen tippen');
  await app.locator('.typed-name input').fill('Erika Musterfrau');
  await press(app, 'Unterschreiben und abschließen');
  await expect(app).toContainText(`${CLIENT}: abgeschlossen`);

  // Einzelveranlagung: no spouse is needed, so the PDF comes first.
  const pdf = await download(page, app, 'PDF erstellen', testInfo.outputPath('zustimmung.pdf'));
  const text = (await pdfPages(pdf.path)).join(' ').replace(/\s+/g, ' ');
  expect(text).toContain('Erika Musterfrau');
  expect(text).toContain('auf Vollständigkeit und Richtigkeit geprüft (§ 87d Abs. 3 AO)');
  expect(text).toContain('Allgemeinen Geschäftsbedingungen');
  expect(text).not.toContain('Den Digitalen Finanzbericht übermittelt die Kanzlei nicht');
  expect(text).not.toContain('Eine Kleinstkapitalgesellschaft kann stattdessen nur die Bilanz');
  expect(text).not.toContain('Sie haben die gemeinsame Einkommensteuererklärung');
  await expectQuiet(page, found);
});
