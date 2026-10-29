import { displayValue, editValue, EMPTY_VALUE } from './display';
import type { FieldDefinition, FieldType } from './model';
import { normalizeFieldValue } from './normalize';

const field = (type: FieldType, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
  id: 'f',
  role: 'person',
  type,
  label: 'Feld',
  required: false,
  purpose: 'Test',
  ...extra,
});

const OPTIONS = [
  { id: 'a', label: 'Erste' },
  { id: 'b', label: 'Zweite' },
];

describe('displayValue', () => {
  it.each<[FieldType, unknown, string]>([
    ['text', 'Erika Musterfrau', 'Erika Musterfrau'],
    ['date', '2026-11-02', '02.11.2026'],
    ['money', '1234567.50', '1.234.567,50 €'],
    ['money', '0.05', '0,05 €'],
    ['boolean', true, 'Ja'],
    ['boolean', false, 'Nein'],
    ['iban', 'DE89370400440532013000', 'DE89 3704 0044 0532 0130 00'],
    ['taxId', '86095742719', '86 095 742 719'],
    ['svNumber', '65170590M520', '65 170590 M 520'],
    ['betriebsnummer', '12345678', '12345678'],
  ])('%s %j → %j', (type, value, shown) => {
    expect(displayValue(field(type), value as never)).toBe(shown);
  });

  it('shows option labels, not ids', () => {
    expect(displayValue(field('choice', { options: OPTIONS }), 'b')).toBe('Zweite');
    expect(displayValue(field('multiChoice', { options: OPTIONS }), ['a', 'b'])).toBe(
      'Erste, Zweite',
    );
  });

  it('shows unanswered fields as a dash', () => {
    expect(displayValue(field('text'), null)).toBe(EMPTY_VALUE);
    expect(displayValue(field('text'), undefined)).toBe(EMPTY_VALUE);
  });
});

describe('editValue', () => {
  it.each<[FieldType, string]>([
    ['date', '02.11.2026'],
    ['money', '1.234,50'],
    ['text', 'Musterweg 1'],
    ['svNumber', '65170590M520'],
  ])('%s gives text that normalises back to the stored value', (type, typed) => {
    const stored = normalizeFieldValue(field(type), typed);
    if (!stored.ok) throw new Error(stored.issue);
    const again = normalizeFieldValue(field(type), editValue(field(type), stored.value));
    expect(again).toEqual(stored);
  });

  it('is empty for unanswered and non-text values', () => {
    expect(editValue(field('text'), null)).toBe('');
    expect(editValue(field('boolean'), true)).toBe('');
  });
});
