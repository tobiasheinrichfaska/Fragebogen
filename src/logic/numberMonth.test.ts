// Field types `number` (hours, km, days …; German input, stored as a string with fixed decimals)
// and `month` (MM.JJJJ ⇄ YYYY-MM, can move on by one month when taken over).
import { addMonths, isIsoMonth } from './dates';
import { displayValue, editValue } from './display';
import type { FieldDefinition, FieldType } from './model';
import {
  MAX_NUMBER_DECIMALS,
  normalizeFieldValue,
  normalizeMonth,
  normalizeNumber,
  NUMBER_MAX_INTEGER_DIGITS,
} from './normalize';

const field = (type: FieldType, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
  id: 'f',
  role: 'person',
  type,
  label: 'Feld',
  required: false,
  purpose: 'Test',
  ...extra,
});

const hours = field('number', { decimals: 2, unit: 'Std.' });
const account = field('number', { decimals: 2, unit: 'Std.', signed: true });
const km = field('number', { unit: 'km' });

describe('normalizeNumber', () => {
  it.each<[FieldDefinition, string, string]>([
    [hours, '37,5', '37.50'],
    [hours, '37,50', '37.50'],
    [hours, '8', '8.00'],
    [hours, '1.234,5', '1234.50'],
    [hours, '12.5', '12.50'],
    [hours, '12,5 Std.', '12.50'],
    [hours, '0,25', '0.25'],
    [hours, '007,5', '7.50'],
    [hours, '-0', '0.00'],
    [account, '-12,5', '-12.50'],
    [account, '−12,5', '-12.50'],
    [account, '-0,00', '0.00'],
    [km, '42', '42'],
    [km, '1.234', '1234'],
    [km, '42,0', '42'],
    [km, '42 km', '42'],
  ])('%#: %j → %s', (definition, raw, expected) => {
    expect(normalizeNumber(raw, definition)).toEqual({ ok: true, value: expected, warnings: [] });
  });

  it.each<[FieldDefinition, string, string]>([
    [hours, '1,234', 'number.decimals'],
    [km, '42,5', 'number.decimals'],
    [hours, '-1', 'number.negative'],
    [km, '-3', 'number.negative'],
    [hours, 'acht', 'number.format'],
    [hours, '1,234.5', 'number.format'],
    [hours, '1.23.4', 'number.format'],
    [hours, '--1', 'number.format'],
    [km, '1'.repeat(NUMBER_MAX_INTEGER_DIGITS + 1), 'number.tooLarge'],
  ])('%#: %j → %s', (definition, raw, issue) => {
    expect(normalizeNumber(raw, definition)).toEqual({ ok: false, issue });
  });

  it('maps every stored value to itself', () => {
    for (const [definition, stored] of [
      [hours, '0.00'],
      [hours, '37.50'],
      [hours, '999999999.99'],
      [account, '-12.25'],
      [km, '0'],
      [km, '123456789'],
    ] as const) {
      expect(normalizeNumber(stored, definition)).toEqual({
        ok: true,
        value: stored,
        warnings: [],
      });
    }
  });

  it('allows at most two decimal places, so a three-digit group is always thousands', () => {
    expect(MAX_NUMBER_DECIMALS).toBe(2);
    expect(normalizeNumber('1.500', hours)).toEqual({ ok: true, value: '1500.00', warnings: [] });
  });
});

describe('normalizeMonth', () => {
  it.each([
    ['03.2026', '2026-03'],
    ['3.2026', '2026-03'],
    ['3/2026', '2026-03'],
    ['12.2026', '2026-12'],
    ['2026-03', '2026-03'],
    [' 03 . 2026 ', '2026-03'],
  ])('%j → %s', (raw, expected) => {
    expect(normalizeMonth(raw)).toEqual({ ok: true, value: expected, warnings: [] });
  });

  it.each([
    ['13.2026', 'month.invalid'],
    ['00.2026', 'month.invalid'],
    ['2026-13', 'month.invalid'],
    ['03.26', 'month.format'],
    ['März 2026', 'month.format'],
    ['01.03.2026', 'month.format'],
  ])('%j → %s', (raw, issue) => {
    expect(normalizeMonth(raw)).toEqual({ ok: false, issue });
  });
});

describe('addMonths', () => {
  it.each([
    ['2026-03', 1, '2026-04'],
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
    ['2026-05', 24, '2028-05'],
  ])('%s + %i → %s', (month, count, expected) => {
    expect(addMonths(month, count)).toBe(expected);
    expect(isIsoMonth(expected)).toBe(true);
  });

  it('refuses a malformed month', () => {
    expect(() => addMonths('2026-13', 1)).toThrow(RangeError);
  });
});

describe('display and edit', () => {
  it.each<[FieldDefinition, string, string]>([
    [hours, '1234.50', '1.234,50 Std.'],
    [account, '-12.50', '−12,50 Std.'],
    [km, '42', '42 km'],
    [field('number'), '7', '7'],
    [field('month'), '2026-03', 'März 2026'],
  ])('%#: %s → %j', (definition, stored, shown) => {
    expect(displayValue(definition, stored)).toBe(shown);
  });

  it.each<[FieldDefinition, string]>([
    [hours, '1.234,5'],
    [account, '-12,5'],
    [km, '42'],
    [field('month'), '03.2026'],
  ])('%#: %j gives edit text that normalises back to the stored value', (definition, typed) => {
    const stored = normalizeFieldValue(definition, typed);
    if (!stored.ok) throw new Error(stored.issue);
    expect(normalizeFieldValue(definition, editValue(definition, stored.value))).toEqual(stored);
  });

  it('normalises its own output again to itself (canon stability)', () => {
    for (const [definition, raw] of [
      [hours, ' 37,5 '],
      [account, '-1.000,25'],
      [field('month'), '3/2027'],
    ] as const) {
      const once = normalizeFieldValue(definition, raw);
      if (!once.ok) throw new Error(once.issue);
      expect(normalizeFieldValue(definition, once.value)).toEqual(once);
    }
  });
});
