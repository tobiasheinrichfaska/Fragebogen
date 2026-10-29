import beispiel from '../../tests/fixtures/forms/beispiel/1.0.0.json';
import {
  buildFormRegistry,
  checkFieldIdStability,
  compareVersions,
  definitionHash,
  parsePublishedList,
  type FormSource,
} from './formRegistry';
import { parseFormDefinition } from './formDefinition';
import { canonicalHash } from './hash';
import type { FormDefinition } from './model';

type Raw = typeof beispiel;

function variant(version: string, change: (raw: Raw) => void = () => undefined): Raw {
  const raw = structuredClone(beispiel);
  raw.version = version;
  change(raw);
  return raw;
}

function source(raw: Raw): FormSource {
  return { name: `forms/${raw.id}/${raw.version}.json`, raw };
}

function lockFor(...raws: Raw[]): { id: string; version: string; definitionHash: string }[] {
  return raws.map((raw) => ({
    id: raw.id,
    version: raw.version,
    definitionHash: canonicalHash(raw),
  }));
}

function decoded(raw: Raw): FormDefinition {
  const result = parseFormDefinition(raw);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.definition;
}

function issuesOf(result: ReturnType<typeof buildFormRegistry>): string[] {
  return result.ok ? [] : result.issues.map((issue) => `${issue.path}: ${issue.message}`);
}

describe('buildFormRegistry', () => {
  const v100 = variant('1.0.0');
  const v110 = variant('1.1.0', (raw) => {
    raw.title = 'Beispielformular, Fassung 1.1';
  });
  const v1100 = variant('1.10.0');

  it('registers published forms and finds them by version, hash and latest version', () => {
    const result = buildFormRegistry(
      [source(v110), source(v100), source(v1100)],
      lockFor(v100, v110, v1100),
    );
    expect(issuesOf(result)).toEqual([]);
    if (!result.ok) return;
    const { registry } = result;
    expect(registry.forms).toHaveLength(3);
    expect(registry.get('beispiel', '1.1.0')?.definition.title).toBe(
      'Beispielformular, Fassung 1.1',
    );
    expect(registry.get('beispiel', '2.0.0')).toBeUndefined();
    expect(registry.byHash(canonicalHash(v100))?.definition.version).toBe('1.0.0');
    expect(registry.byHash('0'.repeat(64))).toBeUndefined();
    expect(registry.latest('beispiel')?.definition.version).toBe('1.10.0');
    expect(registry.latest('unbekannt')).toBeUndefined();
  });

  it('accepts an empty catalogue', () => {
    expect(issuesOf(buildFormRegistry([], []))).toEqual([]);
  });

  it('names the hash to publish for a form that is not listed yet', () => {
    expect(issuesOf(buildFormRegistry([source(v100)], []))).toEqual([
      `beispiel 1.0.0: not in forms/published.json — add it with definitionHash ${canonicalHash(v100)}`,
    ]);
  });

  it('refuses a published form whose content changed', () => {
    const edited = variant('1.0.0', (raw) => {
      raw.title = 'Nachträglich geändert';
    });
    const [message] = issuesOf(buildFormRegistry([source(edited)], lockFor(v100)));
    expect(message).toContain('beispiel 1.0.0: changed after publication');
    expect(message).toContain(canonicalHash(v100));
    expect(message).toContain(canonicalHash(edited));
  });

  it('refuses a published form that was removed', () => {
    expect(issuesOf(buildFormRegistry([source(v100)], lockFor(v100, v110)))).toEqual([
      'beispiel 1.1.0: published but missing — published forms are never removed',
    ]);
  });

  it('refuses duplicates in sources and in the published list', () => {
    expect(issuesOf(buildFormRegistry([source(v100), source(v100)], lockFor(v100)))).toEqual([
      'beispiel 1.0.0: defined more than once',
    ]);
    expect(issuesOf(buildFormRegistry([source(v100)], lockFor(v100, v100)))).toEqual([
      'forms/published.json: beispiel 1.0.0 listed twice',
    ]);
  });

  it('prefixes definition issues with the file name', () => {
    const broken = variant('1.0.0', (raw) => {
      raw.title = '';
    });
    expect(issuesOf(buildFormRegistry([source(broken)], []))).toEqual([
      'forms/beispiel/1.0.0.json: $.title: must not be empty',
    ]);
  });

  it('refuses a field whose type changes between versions', () => {
    const retyped = variant('1.1.0', (raw) => {
      const field = raw.sections[0]?.fields[2];
      if (field) field.type = 'text';
    });
    expect(
      issuesOf(buildFormRegistry([source(v100), source(retyped)], lockFor(v100, retyped))),
    ).toEqual([
      'beispiel 1.1.0: field "steuerId": was taxId/person in 1.0.0, now text/person — field ids never change meaning; use a new id',
    ]);
  });
});

describe('checkFieldIdStability', () => {
  it('allows new labels, new fields and removed fields', () => {
    const relabelled = variant('1.1.0', (raw) => {
      const field = raw.sections[0]?.fields[0];
      if (field) field.label = 'Familienname';
      raw.sections[0]?.fields.splice(5, 1);
    });
    expect(checkFieldIdStability([decoded(beispiel), decoded(relabelled)])).toEqual([]);
  });

  it('remembers removed fields: re-adding an id with another role is refused', () => {
    const removed = variant('1.1.0', (raw) => {
      raw.sections[0]?.fields.splice(5, 1);
    });
    const readded = variant('1.2.0', (raw) => {
      const field = raw.sections[0]?.fields[5];
      if (field) field.role = 'arbeitgeber';
    });
    const issues = checkFieldIdStability([decoded(readded), decoded(removed), decoded(beispiel)]);
    expect(issues).toEqual([
      {
        path: 'beispiel 1.2.0: field "bemerkungen"',
        message: expect.stringContaining('was text/person in 1.0.0, now text/arbeitgeber'),
      },
    ]);
  });

  it('keeps different forms apart', () => {
    const other = structuredClone(beispiel);
    other.id = 'anderes';
    const field = other.sections[0]?.fields[2];
    if (field) field.type = 'text';
    expect(checkFieldIdStability([decoded(beispiel), decoded(other)])).toEqual([]);
  });
});

describe('parsePublishedList', () => {
  it.each<[string, unknown, string]>([
    ['not an array', {}, 'expected an array'],
    [
      'an unknown key',
      [{ id: 'a', version: '1.0.0', definitionHash: 'a'.repeat(64), x: 1 }],
      'unknown property',
    ],
    [
      'an upper-case hash',
      [{ id: 'a', version: '1.0.0', definitionHash: 'A'.repeat(64) }],
      'must match',
    ],
    ['a short hash', [{ id: 'a', version: '1.0.0', definitionHash: 'abc' }], 'must match'],
    ['a bad version', [{ id: 'a', version: 'v1', definitionHash: 'a'.repeat(64) }], 'must match'],
  ])('rejects %s', (_label, raw, message) => {
    const result = parsePublishedList(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain(message);
  });

  it('surfaces list errors through buildFormRegistry', () => {
    expect(buildFormRegistry([], {}).ok).toBe(false);
  });
});

describe('compareVersions / definitionHash', () => {
  it.each([
    ['1.10.0', '1.9.0', 1],
    ['2.0.0', '1.99.99', 1],
    ['1.0.0', '1.0.0', 0],
    ['1.0.1', '1.0.2', -1],
  ])('%s vs %s', (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });

  it('hashes the decoded definition exactly like its source JSON', () => {
    expect(definitionHash(decoded(beispiel))).toBe(canonicalHash(beispiel));
  });
});
