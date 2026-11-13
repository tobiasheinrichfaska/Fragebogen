import { decimalEquals, decimalText, formatAmount, normalize, parseDecimal } from './decimal';

describe('parseDecimal', () => {
  it.each([
    ['100', 100n, 0],
    ['100.00', 10000n, 2],
    ['-0.5', -5n, 1],
    ['.5', 5n, 1],
    ['+3.', 3n, 0],
    [' 12.30 ', 1230n, 2],
  ])('%s', (text, units, scale) => {
    expect(parseDecimal(text)).toEqual({ units, scale });
  });

  it.each(['', '1e3', '1,5', '1.000,00', 'abc', '--1', '1.2.3', undefined])(
    'refuses %s',
    (text) => {
      expect(parseDecimal(text)).toBeUndefined();
    },
  );

  it('holds values exactly far beyond floating point', () => {
    const value = parseDecimal('12345678901234567890.123456789');
    expect(value && decimalText(value)).toBe('12345678901234567890.123456789');
  });
});

describe('equality and display', () => {
  it('compares by value, not by notation', () => {
    const a = parseDecimal('100.00');
    const b = parseDecimal('100');
    expect(a && b && decimalEquals(a, b)).toBe(true);
    const c = parseDecimal('100.01');
    expect(a && c && decimalEquals(a, c)).toBe(false);
    expect(normalize({ units: 0n, scale: 3 })).toEqual({ units: 0n, scale: 0 });
  });

  it.each([
    ['1234.5', '1.234,50'],
    ['0', '0,00'],
    ['-1234567.891', '-1.234.567,891'],
    ['0.05', '0,05'],
  ])('formats %s as %s', (text, shown) => {
    const value = parseDecimal(text);
    expect(value && formatAmount(value)).toBe(shown);
  });
});
