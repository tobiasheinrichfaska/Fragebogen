// Keeps docs/formulare/ in sync with the definitions: every published form and every draft has its
// generated catalogue, and nothing else lives there. `npm run catalogue` rewrites the files.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { formCatalogue, type CatalogueStatus } from '../../src/logic/catalogue';
import {
  DRAFTS_DIR,
  FORMS_DIR,
  definitionFiles,
  readJson,
  registeredFrom,
} from '../support/formFiles';

const CATALOGUE_DIR = fileURLToPath(new URL('../../docs/formulare/', import.meta.url));

const entries = [
  ...definitionFiles(FORMS_DIR).map((file) => ({ file, status: 'published' as CatalogueStatus })),
  ...definitionFiles(DRAFTS_DIR).map((file) => ({ file, status: 'draft' as CatalogueStatus })),
].map(({ file, status }) => {
  const form = registeredFrom(readJson(file.path));
  return { name: `${form.definition.id}-${form.definition.version}.md`, form, status };
});

describe('docs/formulare/', () => {
  it.each(entries.map((entry) => [entry.name, entry] as const))(
    '%s matches its definition',
    async (name, { form, status }) => {
      await expect(formCatalogue(form, status)).toMatchFileSnapshot(`../../docs/formulare/${name}`);
    },
  );

  // Review of the drafts 2026-11-15 (X-4): a table column's condition named its sibling column as
  // „(unbekanntes Feld)“, so the text the expert approves was incomplete.
  it('names every field a condition reads, also a column of the same table', () => {
    const unknown = entries
      .filter(({ form, status }) => formCatalogue(form, status).includes('(unbekanntes Feld)'))
      .map((entry) => entry.name);
    expect(unknown).toEqual([]);
  });

  it('holds no catalogue of a removed form or draft', () => {
    const known = new Set(entries.map((entry) => entry.name));
    const stale = readdirSync(CATALOGUE_DIR).filter(
      (name) => name !== 'README.md' && !known.has(name),
    );
    expect(stale).toEqual([]);
  });
});
