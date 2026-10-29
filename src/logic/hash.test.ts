import { canonicalHash, isSha256Hex, sha256Hex } from './hash';

describe('sha256Hex — FIPS 180-2 vectors', () => {
  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    ],
  ])('%j', (input, expected) => {
    expect(sha256Hex(input)).toBe(expected);
  });

  it('hashes strings as UTF-8, identical to their bytes', () => {
    expect(sha256Hex('€')).toBe(sha256Hex(new Uint8Array([0xe2, 0x82, 0xac])));
  });

  it('refuses strings with unpaired surrogates instead of replacing them', () => {
    expect(() => sha256Hex('a\ud800')).toThrow(RangeError);
  });
});

describe('canonicalHash', () => {
  it('is independent of key insertion order', () => {
    expect(canonicalHash({ b: [1, 2], a: 'x' })).toBe(canonicalHash({ a: 'x', b: [1, 2] }));
  });

  it('equals SHA-256 over the JCS text', () => {
    expect(canonicalHash({ b: 1, a: 2 })).toBe(sha256Hex('{"a":2,"b":1}'));
  });

  it('distinguishes values that JSON.stringify would conflate', () => {
    expect(canonicalHash(['1'])).not.toBe(canonicalHash([1]));
    expect(() => canonicalHash({ a: undefined })).toThrow();
  });
});

describe('isSha256Hex', () => {
  it.each([
    ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', true],
    ['E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', false],
    ['e3b0', false],
    ['', false],
  ])('%s → %s', (value, expected) => {
    expect(isSha256Hex(value)).toBe(expected);
  });
});
