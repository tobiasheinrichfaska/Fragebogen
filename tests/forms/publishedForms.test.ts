// Guards the real forms/ folder: every definition is valid, published with an unchanged hash,
// filed under forms/<id>/<version>.json, and no field id changes meaning between versions.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORM_ID, SEMVER } from '../../src/logic/formDefinition';
import { buildFormRegistry, type FormSource } from '../../src/logic/formRegistry';

const FORMS_DIR = fileURLToPath(new URL('../../forms/', import.meta.url));

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function definitionFiles(): { folder: string; file: string }[] {
  return readdirSync(FORMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(FORMS_DIR, dir.name)).map((file) => ({ folder: dir.name, file })),
    );
}

describe('forms/', () => {
  it('builds a registry from all definitions and forms/published.json', () => {
    const sources: FormSource[] = definitionFiles().map(({ folder, file }) => ({
      name: `forms/${folder}/${file}`,
      raw: readJson(join(FORMS_DIR, folder, file)),
    }));
    const result = buildFormRegistry(sources, readJson(join(FORMS_DIR, 'published.json')));
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it('files every definition as forms/<id>/<version>.json', () => {
    for (const { folder, file } of definitionFiles()) {
      expect(folder).toMatch(FORM_ID);
      expect(file).toMatch(/\.json$/);
      const version = file.slice(0, -'.json'.length);
      expect(version).toMatch(SEMVER);
      expect(readJson(join(FORMS_DIR, folder, file))).toMatchObject({ id: folder, version });
    }
  });

  it('contains nothing but definition folders, published.json and README.md', () => {
    const loose = readdirSync(FORMS_DIR, { withFileTypes: true })
      .filter((entry) => !entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(loose).toEqual(['README.md', 'published.json']);
  });
});
