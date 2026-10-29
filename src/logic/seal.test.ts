import { canonicalHash } from './hash';
import type { SealPayload } from './model';
import { FIELD_HASH_PATTERN, diffFieldHashes, fieldHash, fieldHashesOf, isEmptyDiff } from './seal';

const NONCE = '0123456789abcdef0123456789abcdef';

describe('fieldHash', () => {
  it('is the first 64 bit of SHA-256 over JCS({f, n, v})', () => {
    const digest = fieldHash(NONCE, 'nachname', 'Musterfrau');
    expect(digest).toMatch(FIELD_HASH_PATTERN);
    expect(digest).toBe(canonicalHash({ f: 'nachname', n: NONCE, v: 'Musterfrau' }).slice(0, 16));
  });

  it('depends on nonce, field id and value — so equal values in other parts are not linkable', () => {
    const base = fieldHash(NONCE, 'steuerId', '86095742719');
    expect(fieldHash('f'.repeat(32), 'steuerId', '86095742719')).not.toBe(base);
    expect(fieldHash(NONCE, 'agSteuerId', '86095742719')).not.toBe(base);
    expect(fieldHash(NONCE, 'steuerId', '86095742718')).not.toBe(base);
  });

  it('distinguishes null, false, empty text and empty list', () => {
    const digests = [null, false, '', []].map((value) => fieldHash(NONCE, 'f', value));
    expect(new Set(digests).size).toBe(4);
  });
});

describe('diffFieldHashes', () => {
  const data = { a: 'x', b: null, c: true };
  const payload = { nonce: NONCE, fieldHashes: fieldHashesOf(NONCE, data) } as SealPayload;

  it('is empty for the sealed data', () => {
    expect(isEmptyDiff(diffFieldHashes(payload, data))).toBe(true);
  });

  it('names changed, missing and extra fields', () => {
    expect(diffFieldHashes(payload, { a: 'y', c: true, d: 'neu' })).toEqual({
      changed: ['a'],
      missing: ['b'],
      extra: ['d'],
    });
  });

  it('treats an absent field differently from a field set to null', () => {
    expect(diffFieldHashes(payload, { a: 'x', c: true }).missing).toEqual(['b']);
  });
});
