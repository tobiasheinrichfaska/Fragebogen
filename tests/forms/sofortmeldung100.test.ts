// Sofortmeldung 1.0.0 — the first production version (Tobias 2026-11-03: "Sofortmeldung soll jetzt
// produktiv gehen"): the content of the tested 0.4.0, now without the "Testfassung" mark. From here
// on a change is tried as a draft in form-drafts/ (test folder only) and published as the next
// production version; a draft is always newer than what is published.
import { join } from 'node:path';
import { compareVersions, isTestVersion } from '../../src/logic/formRegistry';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  newestPublished,
  readJson,
  registeredFrom,
} from '../support/formFiles';

const read = (dir: string, id: string, version: string) =>
  registeredFrom(readJson(join(dir, id, `${version}.json`))).definition;

describe('Sofortmeldung 1.0.0 (production)', () => {
  it('is the newest version, no test version, and the content of 0.4.0', () => {
    const newest = newestPublished('sofortmeldung').definition;
    expect(newest.version).toBe('1.0.0');
    expect(isTestVersion(newest.version)).toBe(false);
    expect({ ...newest, version: '0.4.0' }).toEqual(read(FORMS_DIR, 'sofortmeldung', '0.4.0'));
  });
});

describe('test and production versions', () => {
  const published = definitionFiles(FORMS_DIR)
    .filter((file) => file.file.endsWith('.json'))
    .map((file) => registeredFrom(readJson(file.path)).definition);
  const drafts = definitionFiles(DRAFTS_DIR)
    .filter((file) => file.file.endsWith('.json'))
    .map((file) => registeredFrom(readJson(file.path)).definition);

  it('a draft is always newer than every published version of its form', () => {
    const behind = drafts.filter((draft) =>
      published.some((p) => p.id === draft.id && compareVersions(p.version, draft.version) >= 0),
    );
    expect(behind.map((d) => `${d.id} ${d.version}`)).toEqual([]);
  });

  it('a form with a production version gets no new test version', () => {
    const late = drafts.filter(
      (draft) =>
        isTestVersion(draft.version) &&
        published.some((p) => p.id === draft.id && !isTestVersion(p.version)),
    );
    expect(late.map((d) => `${d.id} ${d.version}`)).toEqual([]);
  });
});
