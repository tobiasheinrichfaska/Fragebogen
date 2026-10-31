// The real help pages (hilfe/seiten, hilfe/muster) decode, fit together, link only to https sources,
// and docs/hilfe/ holds exactly their rendering (`npm run catalogue` rewrites it). Every `explainer`
// path of a draft or form that points into the help leads to an existing page.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHelpIndex, renderHelpPage } from '../../src/build/helpPage';
import { checkHelpPages, parseHelpPage, parseMuster } from '../../src/logic/helpPages';
import { DRAFTS_DIR, FORMS_DIR, definitionFiles, readJson } from '../support/formFiles';

const ROOT = join(__dirname, '..', '..', 'hilfe');
const jsonIn = (dir: string) =>
  readdirSync(join(ROOT, dir))
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      name,
      raw: JSON.parse(readFileSync(join(ROOT, dir, name), 'utf8')) as unknown,
    }));

const musters = jsonIn('muster').map(({ name, raw }) => {
  const parsed = parseMuster(raw);
  if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.issues)}`);
  expect(`${parsed.value.id}.json`).toBe(name);
  return parsed.value;
});
const pages = jsonIn('seiten').map(({ name, raw }) => {
  const parsed = parseHelpPage(raw);
  if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.issues)}`);
  expect(`${parsed.value.path.replace(/\//g, '-')}.json`).toBe(name);
  return parsed.value;
});

describe('help pages of the forms (hilfe/)', () => {
  it('fit together: every tile finds its Muster and field, nothing leaves the page', () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(checkHelpPages(pages, musters)).toEqual([]);
  });

  it('give a source for every document a tile names', () => {
    for (const page of pages) {
      for (const choice of page.choices) {
        if (choice.muster !== undefined)
          expect(choice.source, `${page.path}/${choice.id}`).toBeDefined();
      }
      expect(page.choices.at(-1)?.id, `${page.path}: last tile "Nichts davon"`).toBe('nichts');
    }
  });

  it('use only invented numbers that cannot be real ones (all 9s, as in the official samples)', () => {
    for (const muster of musters) {
      for (const item of muster.items) {
        if (item.kind !== 'field') continue;
        // Any longer run of digits (spaces ignored) must be 9s only: never a real Steuer-ID or IBAN.
        for (const run of (item.value ?? '').replace(/ /g, '').match(/\d{5,}/g) ?? []) {
          expect(run, `${muster.id}/${item.id}`).toMatch(/^9+$/);
        }
      }
    }
  });

  it('are rendered into docs/hilfe/', async () => {
    for (const page of pages) {
      await expect(renderHelpPage(page, musters)).toMatchFileSnapshot(
        `../../docs/hilfe/${page.path}/index.html`,
      );
    }
    await expect(renderHelpIndex(pages)).toMatchFileSnapshot('../../docs/hilfe/index.html');
  });

  it('exist for every explainer path a form or draft uses', () => {
    const paths = new Set(pages.map((page) => page.path));
    for (const dir of [FORMS_DIR, DRAFTS_DIR]) {
      for (const file of definitionFiles(dir).filter((f) => f.file.endsWith('.json'))) {
        const definition = readJson(file.path) as {
          sections: { fields: { id: string; explainer?: string }[] }[];
        };
        for (const field of definition.sections.flatMap((s) => s.fields)) {
          if (field.explainer !== undefined) {
            expect(
              paths.has(field.explainer),
              `${file.path}: ${field.id} → ${field.explainer}`,
            ).toBe(true);
          }
        }
      }
    }
  });
});
