import {
  MASTER_DATA_LINK_MAX_KEYS,
  MASTER_DATA_LINK_MAX_LENGTH,
  MASTER_DATA_LINK_MESSAGES,
  masterDataFragment,
  parseMasterDataFragment,
} from './masterDataLink';

function fragmentOf(data: Record<string, string>): string {
  const result = masterDataFragment(data);
  if (!result.ok) throw new Error(result.issue);
  return result.fragment;
}

describe('masterDataFragment', () => {
  it('writes a marked, sorted fragment', () => {
    expect(fragmentOf({ firma: 'Beispiel Bau GmbH', betriebsnummer: '12345678' })).toBe(
      '#stammdaten=1&betriebsnummer=12345678&firma=Beispiel+Bau+GmbH',
    );
  });

  it('gives equal links for equal data in any key order', () => {
    expect(fragmentOf({ b: '2', a: '1' })).toBe(fragmentOf({ a: '1', b: '2' }));
  });

  it.each<[string, Record<string, string>, string]>([
    ['a key that is no id', { 'Firma Name': 'x' }, 'invalidKey'],
    ['an empty value', { firma: '' }, 'emptyValue'],
    [
      'a value that makes the link too long',
      { firma: 'x'.repeat(MASTER_DATA_LINK_MAX_LENGTH) },
      'tooLong',
    ],
    [
      'too many keys',
      Object.fromEntries(
        Array.from({ length: MASTER_DATA_LINK_MAX_KEYS + 1 }, (_, i) => [`k${i}`, 'x']),
      ),
      'tooManyKeys',
    ],
  ])('refuses %s', (_label, data, issue) => {
    expect(masterDataFragment(data)).toMatchObject({ ok: false, issue });
  });

  it('refuses a value that is not text (definitions allow only text master data)', () => {
    expect(() => masterDataFragment({ frage: true })).toThrow(RangeError);
  });
});

describe('parseMasterDataFragment', () => {
  it.each(['Beispiel Bau GmbH', 'Müller & Söhne GmbH, „Bau“ #1 = 100 %', 'a+b?c/d'])(
    'round-trips %j',
    (firma) => {
      const parsed = parseMasterDataFragment(fragmentOf({ firma, betriebsnummer: '12345678' }));
      expect(parsed).toEqual({ ok: true, data: { betriebsnummer: '12345678', firma } });
    },
  );

  it('accepts the hash with or without "#"', () => {
    expect(parseMasterDataFragment('stammdaten=1&firma=X')).toEqual({
      ok: true,
      data: { firma: 'X' },
    });
  });

  it.each(['', '#', '#abschnitt-2', '#firma=Beispiel'])(
    'reads %j as no master-data link',
    (hash) => {
      expect(parseMasterDataFragment(hash)).toEqual({ ok: true, data: undefined });
    },
  );

  it.each<[string, string, string]>([
    ['another version', '#stammdaten=2&firma=X', 'unknownVersion'],
    ['two markers', '#stammdaten=1&stammdaten=1&firma=X', 'unknownVersion'],
    ['a key that is no id', '#stammdaten=1&Firma%20Name=X', 'invalidKey'],
    ['a key starting with a digit', '#stammdaten=1&1firma=X', 'invalidKey'],
    ['a key given twice', '#stammdaten=1&firma=A&firma=B', 'duplicateKey'],
    ['an empty value', '#stammdaten=1&firma=', 'emptyValue'],
    ['a key without value', '#stammdaten=1&firma', 'emptyValue'],
    ['a broken percent-encoding', '#stammdaten=1&firma=%E0%A4%A', 'unreadableValue'],
    [
      'an overlong link',
      `#stammdaten=1&firma=${'x'.repeat(MASTER_DATA_LINK_MAX_LENGTH)}`,
      'tooLong',
    ],
  ])('refuses %s as a whole', (_label, hash, issue) => {
    expect(parseMasterDataFragment(hash)).toMatchObject({ ok: false, issue });
  });

  it('refuses more keys than allowed', () => {
    const keys = Array.from({ length: MASTER_DATA_LINK_MAX_KEYS + 1 }, (_, i) => `k${i}=x`);
    expect(parseMasterDataFragment(`#stammdaten=1&${keys.join('&')}`)).toMatchObject({
      ok: false,
      issue: 'tooManyKeys',
    });
  });

  it('has a German message for every issue', () => {
    for (const message of Object.values(MASTER_DATA_LINK_MESSAGES)) expect(message).toMatch(/\.$/);
  });
});
