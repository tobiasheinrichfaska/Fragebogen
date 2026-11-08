// Shared steps of the end-to-end tests that took over the manual tests (Tobias 2026-11-08: "reduziere
// die Handtests auf die Dinge, die wir nicht mit virtuellen Browsern abbilden können"): the two
// builds, the test build opened at a start point of manual_tests/startpunkte/ (`?startpunkt=<id>`),
// answering questions by their heading, signing, downloads, the text of a PDF and the guards.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { guard, type Guard } from './guards';

/** The public build: published forms only. */
export const APP = fileURLToPath(new URL('../../dist/index.html', import.meta.url));
/** The test folder build: the test page next to the app, with every draft. */
export const TEST_APP = fileURLToPath(new URL('../../dist-test/index.html', import.meta.url));

const FORMS_DIR = fileURLToPath(new URL('../../forms/', import.meta.url));
const DRAFTS_DIR = fileURLToPath(new URL('../../form-drafts/', import.meta.url));

export interface Opened {
  found: Guard;
  /** The app's part of the page (in the test build the app sits next to the test page). */
  app: Locator;
}

/** The public build from file://, guarded. */
export async function openApp(page: Page, hash = ''): Promise<Opened> {
  expect(existsSync(APP), 'dist/index.html (npm run build)').toBe(true);
  const found = await guard(page);
  await page.goto(pathToFileURL(APP).href + hash);
  const app = page.locator('#root');
  await expect(app.locator('main')).toBeVisible();
  return { found, app };
}

/**
 * The test build from file://, guarded; with `startpunkt` the prepared questionnaire of that start
 * point is open at once, without it the app shows its start page.
 */
export async function openTestApp(page: Page, startpunkt?: string): Promise<Opened> {
  expect(existsSync(TEST_APP), 'dist-test/index.html (npm run build:test)').toBe(true);
  const found = await guard(page);
  const query = startpunkt === undefined ? '' : `?startpunkt=${encodeURIComponent(startpunkt)}`;
  await page.goto(pathToFileURL(TEST_APP).href + query);
  const app = page.locator('.test-app');
  await expect(app.locator('main')).toBeVisible();
  return { found, app };
}

/** Network, console and CSP only: the test page keeps its results in the browser on purpose. */
export async function expectQuiet(page: Page, found: Guard): Promise<void> {
  expect(found.external).toEqual([]);
  expect(found.errors).toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations ?? [])).toEqual([]);
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Clicks the first enabled button or label whose text starts with the word(s) `text`: "Weiter"
 * never presses "Weitere Zeile: …" (a table step), "Ja" never "Jahr".
 */
export async function press(scope: Locator, text: string): Promise<void> {
  await scope
    .locator('button:not([disabled]), label')
    .filter({ hasText: new RegExp(`^\\s*${escape(text)}(?![\\p{L}\\p{N}])`, 'u') })
    .first()
    .click();
}

/** The heading of the current step (its own text, without the badge or help next to it). */
export async function heading(scope: Locator): Promise<string> {
  return scope
    .locator('.card h2')
    .first()
    .evaluate((element) => element.childNodes[0]?.textContent?.trim() ?? '');
}

interface FieldInfo {
  id: string;
  type: string;
  label: string;
  question?: string;
  options?: { id: string; label: string }[];
}

const versionKey = (file: string) =>
  file
    .slice(0, -'.json'.length)
    .split('.')
    .map((part) => part.padStart(6, '0'))
    .join('.');

/**
 * The fields of the newest version of a form as the build has it: `drafts` for the test build
 * (a draft is always newer than every published version), else the newest published one.
 */
export function formFields(formId: string, drafts: boolean): FieldInfo[] {
  const files = [FORMS_DIR, ...(drafts ? [DRAFTS_DIR] : [])].flatMap((dir) => {
    const folder = join(dir, formId);
    return existsSync(folder)
      ? readdirSync(folder)
          .filter((file) => file.endsWith('.json'))
          .map((file) => join(folder, file))
      : [];
  });
  const newest = files.sort((a, b) =>
    versionKey(a.split(/[\\/]/).pop() ?? '') < versionKey(b.split(/[\\/]/).pop() ?? '') ? -1 : 1,
  )[files.length - 1];
  if (newest === undefined) throw new Error(`no definition of ${formId}`);
  const form = JSON.parse(readFileSync(newest, 'utf8')) as { sections: { fields: FieldInfo[] }[] };
  return form.sections.flatMap((section) => section.fields);
}

/**
 * Answers every step with `answers` (by field id) until the summary or the question of `stopAt`.
 * Notices are confirmed with their check box. A choice is answered by its option id, a yes/no
 * question with "Ja"/"Nein", every other field by typing the text and "Weiter"; a field without an
 * answer is skipped ("Vorerst überspringen") or passed with "Weiter". Throws at an unknown step.
 */
export async function answerUntil(
  app: Locator,
  fields: readonly FieldInfo[],
  answers: Readonly<Record<string, string>>,
  stopAt?: string,
): Promise<void> {
  const byHeading = (current: string) =>
    fields.find((field) => {
      const text = (field.question ?? field.label).replace(
        / ?\{([a-zA-Z0-9]+)\}/g,
        (match, id: string) => `${match.startsWith(' ') ? ' ' : ''}„${answers[id] ?? ''}“`,
      );
      return text === current;
    });
  for (let i = 0; i < 120; i++) {
    const current = await heading(app);
    if (current === 'Zusammenfassung') return;
    const field = byHeading(current);
    if (stopAt !== undefined && field?.id === stopAt) return;
    if (!field) {
      const box = app.locator('.card input[type=checkbox]');
      if ((await box.count()) === 0) throw new Error(`unknown step "${current}"`);
      await box.first().check();
      await press(app, 'Weiter');
    } else {
      const value = answers[field.id];
      if (value === undefined || value === '') {
        const skip = app.getByRole('button', { name: 'Vorerst überspringen' });
        if (await skip.isVisible()) await skip.click();
        else await press(app, 'Weiter');
      } else if (field.type === 'choice') {
        await press(app, field.options?.find((option) => option.id === value)?.label ?? value);
      } else if (field.type === 'boolean') {
        await press(app, value);
      } else {
        await app.locator('.question input, .question textarea').first().fill(value);
        await press(app, 'Weiter');
      }
    }
    await expect.poll(() => heading(app)).not.toBe(current);
  }
  throw new Error('the summary was not reached');
}

/** Draws a signature with the mouse into the signature pad. */
export async function sign(page: Page): Promise<void> {
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

/** Clicks `button` in `scope` and saves the download to `path`; returns its suggested name too. */
export async function download(
  page: Page,
  scope: Locator,
  button: string,
  path: string,
): Promise<{ path: string; name: string }> {
  const [file] = await Promise.all([page.waitForEvent('download'), press(scope, button)]);
  await file.saveAs(path);
  return { path, name: file.suggestedFilename() };
}

/** The text of every page of a PDF, one string per page. */
export async function pdfPages(path: string, password?: string): Promise<string[]> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(path)),
    ...(password === undefined ? {} : { password }),
  }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages;
}
