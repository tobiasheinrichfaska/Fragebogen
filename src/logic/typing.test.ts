import type { FieldDefinition, FieldType } from './model';
import { normalizeDate } from './normalize';
import { fromPicker, maskRest, pickerBounds, pickerValue, typedText } from './typing';

// iPhone test report 2026-11-04: the keypad has digits and a comma only, and people typed no
// separator because nothing showed that the dots appear by themselves.
const typing = (type: FieldType, keys: string) =>
  [...keys].reduce<string[]>((shown, key) => {
    shown.push(typedText(type, (shown.at(-1) ?? '') + key));
    return shown;
  }, []);

describe('typedText', () => {
  it('sets the dots of a date while digits are typed', () => {
    expect(typing('date', '02112026')).toEqual([
      '0',
      '02',
      '02.1',
      '02.11',
      '02.11.2',
      '02.11.20',
      '02.11.202',
      '02.11.2026',
    ]);
    expect(typedText('date', '02112026')).toBe('02.11.2026');
  });

  it('shows the comma of the German keypad as a dot', () => {
    expect(typedText('date', '02,11,2026')).toBe('02.11.2026');
    expect(typing('date', '1,2,2026').at(-1)).toBe('1.2.2026');
    expect(typedText('month', '11,2026')).toBe('11.2026');
  });

  it('keeps the dots the person types, also after one-digit days', () => {
    expect(typedText('date', '1.2.2026')).toBe('1.2.2026');
    expect(typedText('date', '02.')).toBe('02.');
    expect(typedText('date', '02.11.')).toBe('02.11.');
    expect(typedText('date', '')).toBe('');
  });

  it('lets backspace remove a dot instead of putting it back', () => {
    expect(typedText('date', '02.1'.slice(0, -1))).toBe('02.');
    expect(typedText('date', '02')).toBe('02');
  });

  it('sets the dot of a month after its two digits', () => {
    expect(typing('month', '112026').at(-1)).toBe('11.2026');
    expect(typedText('month', '1.2026')).toBe('1.2026');
  });

  it('changes nothing it shows again', () => {
    for (const shown of ['02.11.2026', '1.2.2026', '02.1', '29/10/2026', '2026-10-29']) {
      expect(typedText('date', shown)).toBe(shown);
    }
    for (const shown of ['11.2026', '1.2026', '11/2026']) {
      expect(typedText('month', shown)).toBe(shown);
    }
  });

  it('leaves pasted ISO dates and every other field type as typed', () => {
    expect(typedText('date', '2026-10-29')).toBe('2026-10-29');
    expect(typedText('month', '2026-10')).toBe('2026-10');
    expect(typedText('money', '12,50')).toBe('12,50');
    expect(typedText('number', '7,5')).toBe('7,5');
    expect(typedText('text', 'Müller, Anna 123')).toBe('Müller, Anna 123');
  });

  it('turns every typed date into one the check accepts', () => {
    for (const keys of ['02112026', '1,2,2026', '17,05,1990', '29022028']) {
      expect(normalizeDate(typedText('date', keys)).ok).toBe(true);
    }
  });
});

describe('maskRest', () => {
  it('shows the whole mask before anything is typed', () => {
    expect(maskRest('date', '')).toBe('TT.MM.JJJJ');
    expect(maskRest('month', '')).toBe('MM.JJJJ');
  });

  it('shows what is still to type, the dots included', () => {
    expect(typing('date', '0211').map((shown) => maskRest('date', shown))).toEqual([
      'T.MM.JJJJ',
      '.MM.JJJJ',
      'M.JJJJ',
      '.JJJJ',
    ]);
    expect(maskRest('date', '02.11.2026')).toBe('');
    expect(maskRest('month', '11.2')).toBe('JJJ');
  });

  it('shows no mask where the text does not follow it', () => {
    for (const text of ['1.', '1.2.2026', '2026-10-29', '02.11.20261', 'morgen']) {
      expect(maskRest('date', text)).toBeUndefined();
    }
  });

  it('has no mask for other field types', () => {
    expect(maskRest('text', '')).toBeUndefined();
    expect(maskRest('money', '')).toBeUndefined();
  });
});

describe('the date picker', () => {
  it('opens at the typed date when it is a real one', () => {
    expect(pickerValue('17.05.1990')).toBe('1990-05-17');
    expect(pickerValue('1.2.2026')).toBe('2026-02-01');
    expect(pickerValue('17.05.')).toBe('');
    expect(pickerValue('31.02.2026')).toBe('');
    expect(pickerValue('')).toBe('');
  });

  it('writes the picked date as typed text', () => {
    expect(fromPicker('1990-05-17')).toBe('17.05.1990');
    expect(fromPicker('')).toBe('');
    expect(fromPicker('2026-02-30')).toBe('');
  });

  it('offers the days within the field bounds, today included', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 4, 12));
    try {
      const birth = { id: 'geburtsdatum', type: 'date', maxDate: 'today' } as FieldDefinition;
      expect(pickerBounds(birth)).toEqual({ max: '2026-11-04' });
      const start = { id: 'beginn', type: 'date', minDate: '2025-01-01' } as FieldDefinition;
      expect(pickerBounds(start)).toEqual({ min: '2025-01-01' });
      expect(pickerBounds({ id: 'x', type: 'date' } as FieldDefinition)).toEqual({});
    } finally {
      vi.useRealTimers();
    }
  });
});
