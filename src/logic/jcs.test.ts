import { CanonicalizationError, MAX_DEPTH, canonicalize, isWellFormed } from './jcs';

function doubleFromHex(hex: string): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(`0x${hex}`));
  return view.getFloat64(0);
}

// JSON texts are written with "~" for every backslash, so the RFC escapes survive editors and
// formatters byte for byte.
const json = (text: string): string => text.replaceAll('~', '\\');

describe('canonicalize — RFC 8785 test vectors', () => {
  it('serialises the example of § 3.2.2 (numbers, string escapes, literals, key order)', () => {
    const input = json(
      '{"numbers": [333333333.33333329, 1E30, 4.50, 2e-3, 0.000000000000000000000000001], ' +
        '"string": "~u20ac$~u000F~u000aA\'~u0042~u0022~u005c~~~"~/", "literals": [null, true, false]}',
    );
    const expected = json(
      '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],' +
        '"string":"\u{20AC}$~u000f~nA\'B~"~~~~~"/"}',
    );
    expect(canonicalize(JSON.parse(input))).toBe(expected);
  });

  it('sorts keys by UTF-16 code units (§ 3.2.3)', () => {
    const input = json(
      '{"~u20ac": "Euro Sign", "~r": "Carriage Return", "~ufb33": "Hebrew Letter Dalet With Dagesh", ' +
        '"1": "One", "~ud83d~ude00": "Emoji: Grinning Face", "~u0080": "Control", ' +
        '"~u00f6": "Latin Small Letter O With Diaeresis"}',
    );
    const expected =
      '{"\\r":"Carriage Return","1":"One","\u{80}":"Control","\u{F6}":"Latin Small Letter O With Diaeresis",' +
      '"\u{20AC}":"Euro Sign","\u{1F600}":"Emoji: Grinning Face","\u{FB33}":"Hebrew Letter Dalet With Dagesh"}';
    expect(canonicalize(JSON.parse(input))).toBe(expected);
  });

  it.each([
    ['0000000000000000', '0'],
    ['8000000000000000', '0'],
    ['0000000000000001', '5e-324'],
    ['8000000000000001', '-5e-324'],
    ['7fefffffffffffff', '1.7976931348623157e+308'],
    ['ffefffffffffffff', '-1.7976931348623157e+308'],
    ['4340000000000000', '9007199254740992'],
    ['c340000000000000', '-9007199254740992'],
    ['4430000000000000', '295147905179352830000'],
    ['44b52d02c7e14af5', '9.999999999999997e+22'],
    ['44b52d02c7e14af6', '1e+23'],
    ['44b52d02c7e14af7', '1.0000000000000001e+23'],
    ['444b1ae4d6e2ef4e', '999999999999999700000'],
    ['444b1ae4d6e2ef4f', '999999999999999900000'],
    ['444b1ae4d6e2ef50', '1e+21'],
    ['3eb0c6f7a0b5ed8c', '9.999999999999997e-7'],
    ['3eb0c6f7a0b5ed8d', '0.000001'],
    ['41b3de4355555553', '333333333.3333332'],
    ['41b3de4355555554', '333333333.33333325'],
    ['41b3de4355555555', '333333333.3333333'],
    ['41b3de4355555556', '333333333.3333334'],
    ['41b3de4355555557', '333333333.33333343'],
    ['becbf647612f3696', '-0.0000033333333333333333'],
    ['43143ff3c1cb0959', '1424953923781206.2'],
  ])('number 0x%s → %s (Appendix B)', (hex, expected) => {
    expect(canonicalize(doubleFromHex(hex))).toBe(expected);
  });

  it.each([
    ['7fffffffffffffff', 'NaN'],
    ['7ff0000000000000', 'Infinity'],
    ['fff0000000000000', '-Infinity'],
  ])('rejects 0x%s (%s)', (hex) => {
    expect(() => canonicalize(doubleFromHex(hex))).toThrow(CanonicalizationError);
  });
});

describe('canonicalize — behaviour', () => {
  it('ignores insertion order of keys', () => {
    expect(canonicalize({ b: 1, a: { d: [3], c: null } })).toBe(
      canonicalize({ a: { c: null, d: [3] }, b: 1 }),
    );
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('keeps array order and emits no whitespace', () => {
    expect(canonicalize([3, 'x', [true, false], {}])).toBe('[3,"x",[true,false],{}]');
  });

  it('sorts integer-like keys as strings, not numerically', () => {
    expect(canonicalize({ '10': 'a', '9': 'b', '1': 'c' })).toBe('{"1":"c","10":"a","9":"b"}');
  });

  it('accepts objects without prototype', () => {
    const bare = Object.assign(Object.create(null) as Record<string, unknown>, { z: 1, a: 2 });
    expect(canonicalize(bare)).toBe('{"a":2,"z":1}');
  });

  it('accepts plain objects from another realm (structuredClone, JSON modules)', () => {
    expect(canonicalize(structuredClone({ b: [1], a: { c: true } }))).toBe(
      '{"a":{"c":true},"b":[1]}',
    );
  });

  it('round-trips through JSON.parse unchanged', () => {
    const value = {
      name: 'Zo\u{EB} \u{DC}nal',
      list: ['\u{20AC}', '\n', '\u{1}'],
      nested: { x: -0.5, y: 1e21 },
    };
    const canonical = canonicalize(value);
    expect(canonicalize(JSON.parse(canonical))).toBe(canonical);
  });

  it.each<[string, unknown, string]>([
    ['undefined', undefined, '$'],
    ['an undefined member', { a: 1, b: undefined }, '$.b'],
    ['an undefined array item', [1, undefined], '$[1]'],
    ['a sparse array', [1, , 3], '$[1]'], // eslint-disable-line no-sparse-arrays
    ['a function', { f: () => 1 }, '$.f'],
    ['a bigint', { n: 1n }, '$.n'],
    ['a symbol', [Symbol('s')], '$[0]'],
    ['a Date', { d: new Date(0) }, '$.d'],
    ['a Map', new Map(), '$'],
    [
      'a class instance',
      {
        c: new (class Thing {
          readonly kind = 'thing';
        })(),
      },
      '$.c',
    ],
    ['an unpaired high surrogate', { s: 'a\u{D800}b' }, '$.s'],
    ['an unpaired low surrogate in a key', { 'x\u{DC00}': 1 }, json('$["x~udc00"]')],
  ])('rejects %s with its path', (_label, value, path) => {
    let error: unknown;
    try {
      canonicalize(value);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(CanonicalizationError);
    expect((error as CanonicalizationError).path).toBe(path);
  });

  it(`accepts ${MAX_DEPTH} nested containers and rejects one more`, () => {
    const nest = (levels: number): unknown => {
      let value: unknown = 'leaf';
      for (let i = 0; i < levels; i++) value = [value];
      return value;
    };
    expect(() => canonicalize(nest(MAX_DEPTH))).not.toThrow();
    expect(() => canonicalize(nest(MAX_DEPTH + 1))).toThrow('Nesting too deep');
  });
});

describe('isWellFormed', () => {
  it.each([
    ['', true],
    ['abc \u{E4}\u{F6}\u{FC} \u{20AC}', true],
    ['\u{1F600}', true],
    ['\u{D83D}', false],
    ['\u{DE00}', false],
    ['\u{DE00}\u{D83D}', false],
    ['a\u{D83D}z', false],
  ])('%j → %s', (value, expected) => {
    expect(isWellFormed(value)).toBe(expected);
  });
});
