// "Zuletzt überarbeitet am … um …" (Tobias 2026-11-04): `npm run catalogue` stamps `revised` into
// every draft that differs from the last commit; every draft carries one, and the app shows it.
import { join } from 'node:path';
import { localStamp, needsStamp, stamped } from '../../deploy/stampRevised';
import { parseFormDefinition } from '../../src/logic/formDefinition';
import { describeRevised } from '../../src/logic/validity';
import { definitionFiles, DRAFTS_DIR, readJson } from '../support/formFiles';

const DRAFT = '{\n  "id": "beispiel",\n  "version": "0.1.0",\n  "title": "Beispiel"\n}\n';

describe('stamping the revision of a draft', () => {
  it('adds the stamp right after the version line, keeping the formatting', () => {
    expect(stamped(DRAFT, '2026-11-04T17:20')).toBe(
      '{\n  "id": "beispiel",\n  "version": "0.1.0",\n  "revised": "2026-11-04T17:20",\n  "title": "Beispiel"\n}\n',
    );
  });

  it('replaces an earlier stamp', () => {
    const once = stamped(DRAFT, '2026-11-01T08:00');
    expect(stamped(once, '2026-11-04T17:20')).toBe(stamped(DRAFT, '2026-11-04T17:20'));
  });

  it('stamps a draft without a stamp, or one whose content changed since the commit', () => {
    const committed = stamped(DRAFT, '2026-11-01T08:00');
    expect(needsStamp(DRAFT, undefined)).toBe(true);
    expect(needsStamp(committed, committed)).toBe(false);
    expect(needsStamp(committed.replace('Beispiel"\n', 'Neu"\n'), committed)).toBe(true);
  });

  it('ignores a change of the stamp alone and of the key order', () => {
    const committed = stamped(DRAFT, '2026-11-01T08:00');
    expect(needsStamp(stamped(DRAFT, '2026-11-04T17:20'), committed)).toBe(false);
    const reordered =
      '{\n  "version": "0.1.0",\n  "revised": "2026-11-01T08:00",\n  "id": "beispiel",\n  "title": "Beispiel"\n}\n';
    expect(needsStamp(reordered, committed)).toBe(false);
  });

  it('writes local wall time to the minute', () => {
    expect(localStamp(new Date(2026, 10, 4, 7, 5, 59))).toBe('2026-11-04T07:05');
  });
});

describe('revised in the definitions', () => {
  it('every draft carries a valid stamp', () => {
    const missing = definitionFiles(DRAFTS_DIR)
      .filter((file) => file.file.endsWith('.json'))
      .filter((file) => typeof (readJson(file.path) as { revised?: unknown }).revised !== 'string')
      .map((file) => file.file);
    expect(missing).toEqual([]);
  });

  it('reads as "zuletzt überarbeitet am … um …"', () => {
    expect(describeRevised({ revised: '2026-11-04T17:20' })).toBe(
      'zuletzt überarbeitet am 04.11.2026 um 17:20',
    );
    expect(describeRevised({})).toBeUndefined();
  });

  it.each(['2026-11-04', '2026-11-04T24:00', '2026-02-30T10:00', '04.11.2026 17:20'])(
    'refuses "%s"',
    (revised) => {
      const draft = readJson(join(DRAFTS_DIR, 'sofortmeldung', '1.1.0.json')) as object;
      expect(parseFormDefinition({ ...draft, revised }).ok).toBe(false);
    },
  );
});
