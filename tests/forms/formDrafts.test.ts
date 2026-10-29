// Guards form-drafts/: drafts are valid definitions filed as form-drafts/<id>/<version>.json, never
// a version that is already published, newer than every published version of the same form, and
// they keep the field ids of published versions. Publishing = moving the file to forms/ and adding
// its hash to forms/published.json.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FORM_ID, SEMVER, parseFormDefinition } from '../../src/logic/formDefinition';
import { checkFieldIdStability, compareVersions } from '../../src/logic/formRegistry';
import type { FormDefinition } from '../../src/logic/model';
import {
  DRAFTS_DIR,
  FORMS_DIR,
  definitionFiles,
  looseFiles,
  readJson,
  registeredFrom,
} from '../support/formFiles';

const drafts = definitionFiles(DRAFTS_DIR);
const published = (): FormDefinition[] =>
  definitionFiles(FORMS_DIR).map(({ path }) => registeredFrom(readJson(path)).definition);

describe('form-drafts/', () => {
  it.each(drafts.map((d) => [`${d.folder}/${d.file}`, d] as const))(
    '%s is a valid definition filed under its id and version',
    (_name, { folder, file, path }) => {
      expect(folder).toMatch(FORM_ID);
      expect(file).toMatch(/\.json$/);
      const version = file.slice(0, -'.json'.length);
      expect(version).toMatch(SEMVER);
      const parsed = parseFormDefinition(readJson(path));
      expect(parsed.ok ? [] : parsed.issues).toEqual([]);
      expect(readJson(path)).toMatchObject({ id: folder, version });
    },
  );

  it('never drafts a version that is published already, and only newer ones', () => {
    for (const { folder, file } of drafts) {
      expect(existsSync(join(FORMS_DIR, folder, file))).toBe(false);
      const version = file.slice(0, -'.json'.length);
      for (const form of published().filter((definition) => definition.id === folder)) {
        expect(compareVersions(version, form.version)).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every field id of the published versions', () => {
    const all = [
      ...published(),
      ...drafts.map(({ path }) => registeredFrom(readJson(path)).definition),
    ];
    expect(checkFieldIdStability(all)).toEqual([]);
  });

  it('contains nothing but definition folders and README.md', () => {
    expect(looseFiles(DRAFTS_DIR)).toEqual(['README.md']);
  });
});
