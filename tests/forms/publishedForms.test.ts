// Guards the real forms/ folder: every definition is valid, published with an unchanged hash,
// filed under forms/<id>/<version>.json, and no field id changes meaning between versions.
import { join } from 'node:path';
import { FORM_ID, SEMVER } from '../../src/logic/formDefinition';
import { buildFormRegistry, type FormSource } from '../../src/logic/formRegistry';
import { FORMS_DIR, definitionFiles, looseFiles, readJson } from '../support/formFiles';

describe('forms/', () => {
  it('builds a registry from all definitions and forms/published.json', () => {
    const sources: FormSource[] = definitionFiles(FORMS_DIR).map(({ folder, file, path }) => ({
      name: `forms/${folder}/${file}`,
      raw: readJson(path),
    }));
    const result = buildFormRegistry(sources, readJson(join(FORMS_DIR, 'published.json')));
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it('files every definition as forms/<id>/<version>.json', () => {
    for (const { folder, file, path } of definitionFiles(FORMS_DIR)) {
      expect(folder).toMatch(FORM_ID);
      expect(file).toMatch(/\.json$/);
      const version = file.slice(0, -'.json'.length);
      expect(version).toMatch(SEMVER);
      expect(readJson(path)).toMatchObject({ id: folder, version });
    }
  });

  it('contains nothing but definition folders, published.json and README.md', () => {
    expect(looseFiles(FORMS_DIR)).toEqual(['README.md', 'published.json']);
  });
});
