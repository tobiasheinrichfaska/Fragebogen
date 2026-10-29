import { newVersion, twoRoles } from '../../tests/support/sample';
import { canonicalize } from './jcs';
import { decodeQuestionnaire } from './questionnaireFile';

const REMOVE = Symbol('remove');

function rawWith(path: readonly (string | number)[], change: unknown): unknown {
  const raw: unknown = JSON.parse(JSON.stringify(twoRoles()));
  let node = raw as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
  const last = path.at(-1) ?? '';
  if (change === REMOVE) Reflect.deleteProperty(node, last);
  else node[last] = change;
  return raw;
}

const PAYLOAD = ['parts', 'person', 0, 'seal', 'payload'] as const;

describe('decodeQuestionnaire', () => {
  it.each([
    ['two roles', twoRoles],
    ['a new version', newVersion],
  ])('accepts the scenario "%s" and decodes it without any change', (_label, build) => {
    const raw: unknown = JSON.parse(JSON.stringify(build()));
    const result = decodeQuestionnaire(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(canonicalize(result.questionnaire)).toBe(canonicalize(raw));
  });

  it.each<[string, readonly (string | number)[], unknown, string, string]>([
    ['unknown root key', ['extra'], 1, '$.extra', 'unknown property'],
    ['other format', ['format'], 'formular', '$.format', 'expected one of'],
    ['format version 2', ['formatVersion'], 2, '$.formatVersion', 'unsupported format version'],
    [
      'upper-case id',
      ['questionnaireId'],
      '3F2B8C1E-5D4A-4B6F-9A1C-2E7D8F9A0B1C',
      '$.questionnaireId',
      'must match',
    ],
    [
      'UUID v1',
      ['questionnaireId'],
      '3f2b8c1e-5d4a-1b6f-9a1c-2e7d8f9a0b1c',
      '$.questionnaireId',
      'must match',
    ],
    ['empty versions', ['parts', 'person'], [], '$.parts.person', 'needs at least 1'],
    [
      'number as value',
      ['parts', 'person', 0, 'data', 'nachname'],
      42,
      '$.parts.person[0].data.nachname',
      'no numbers',
    ],
    [
      'lone surrogate in value',
      ['parts', 'person', 0, 'data', 'nachname'],
      'a\u{D800}',
      '$.parts.person[0].data.nachname',
      'unpaired surrogate',
    ],
    [
      'bad status',
      ['parts', 'person', 0, 'status'],
      'final',
      '$.parts.person[0].status',
      'expected one of',
    ],
    [
      'unknown payload key',
      [...PAYLOAD, 'extra'],
      true,
      '$.parts.person[0].seal.payload.extra',
      'unknown property',
    ],
    [
      'canon 2',
      [...PAYLOAD, 'canon'],
      2,
      '$.parts.person[0].seal.payload.canon',
      'unsupported canon',
    ],
    ['version 0', [...PAYLOAD, 'version'], 0, '$.parts.person[0].seal.payload.version', 'integer'],
    [
      'fractional version',
      [...PAYLOAD, 'version'],
      1.5,
      '$.parts.person[0].seal.payload.version',
      'integer',
    ],
    [
      'short nonce',
      [...PAYLOAD, 'nonce'],
      'abc',
      '$.parts.person[0].seal.payload.nonce',
      'must match',
    ],
    [
      '128-bit field hash',
      [...PAYLOAD, 'fieldHashes', 'nachname'],
      'a'.repeat(32),
      '$.parts.person[0].seal.payload.fieldHashes.nachname',
      'must match',
    ],
    [
      'unknown signature method',
      [...PAYLOAD, 'signature'],
      { method: 'qes' },
      '$.parts.person[0].seal.payload.signature',
      'drawn',
    ],
    [
      'drawn signature with a name',
      [...PAYLOAD, 'signature', 'typedName'],
      'X',
      '$.parts.person[0].seal.payload.signature.typedName',
      'unknown property',
    ],
    [
      'local time without offset',
      [...PAYLOAD, 'systemNote', 'signedAtLocal'],
      '2026-10-29T10:15:00',
      '$.parts.person[0].seal.payload.systemNote.signedAtLocal',
      'local time',
    ],
    [
      'UTC time with offset',
      [...PAYLOAD, 'systemNote', 'signedAtUtc'],
      '2026-10-29T09:15:00+00:00',
      '$.parts.person[0].seal.payload.systemNote.signedAtUtc',
      'UTC time',
    ],
    [
      'no input type',
      [...PAYLOAD, 'systemNote', 'inputTypes'],
      [],
      '$.parts.person[0].seal.payload.systemNote.inputTypes',
      'needs at least 1',
    ],
    [
      'unknown input type',
      [...PAYLOAD, 'systemNote', 'inputTypes'],
      ['voice'],
      '$.parts.person[0].seal.payload.systemNote.inputTypes[0]',
      'expected one of',
    ],
    [
      'missing content hash',
      ['parts', 'person', 0, 'seal', 'contentHash'],
      REMOVE,
      '$.parts.person[0].seal.contentHash',
      'missing required property',
    ],
    [
      'receipt without parts',
      ['receipts', 0, 'parts'],
      [],
      '$.receipts[0].parts',
      'needs at least 1',
    ],
    [
      'receipt from elsewhere',
      ['receipts', 0, 'source'],
      'mail',
      '$.receipts[0].source',
      'expected one of',
    ],
    [
      'received part source',
      ['parts', 'arbeitgeber', 0, 'seal', 'payload', 'receivedParts', 0, 'source'],
      'mail',
      '$.parts.arbeitgeber[0].seal.payload.receivedParts[0].source',
      'expected one of',
    ],
  ])('rejects %s', (_label, path, change, issuePath, message) => {
    const result = decodeQuestionnaire(rawWith(path, change));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      path: issuePath,
      message: expect.stringContaining(message),
    });
  });

  it('accepts nested values (rows) but no deeper than the limit', () => {
    const rows = [{ zeile: 'r1', art: 'minijob' }];
    expect(decodeQuestionnaire(rawWith(['parts', 'person', 0, 'data', 'nachname'], rows)).ok).toBe(
      true,
    );
    let deep: unknown = 'x';
    for (let i = 0; i < 9; i++) deep = [deep];
    const result = decodeQuestionnaire(rawWith(['parts', 'person', 0, 'data', 'nachname'], deep));
    expect(result.ok).toBe(false);
  });

  it.each<[string, unknown]>([
    ['an array', []],
    ['null', null],
  ])('rejects %s as root', (_label, raw) => {
    expect(decodeQuestionnaire(raw).ok).toBe(false);
  });
});
