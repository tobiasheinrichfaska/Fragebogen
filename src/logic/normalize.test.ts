import { ISSUE_MESSAGES } from './issues';
import type { FieldDefinition, FieldType } from './model';
import {
  MONEY_MAX_INTEGER_DIGITS,
  normalizeChoice,
  normalizeDate,
  normalizeFieldValue,
  normalizeIban,
  normalizeMoney,
  normalizeMultiChoice,
  normalizeSvNumber,
  normalizeTaxId,
  normalizeText,
} from './normalize';

const OPTIONS = [
  { id: 'b', label: 'B' },
  { id: 'a', label: 'A' },
  { id: '101', label: 'Code' },
];

function field(type: FieldType, extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    id: 'f',
    role: 'person',
    type,
    label: 'Feld',
    required: false,
    purpose: 'Test',
    ...extra,
  };
}

function value(result: ReturnType<typeof normalizeText>): string {
  if (!result.ok) throw new Error(`rejected: ${result.issue}`);
  return result.value;
}

describe('normalizeText', () => {
  it.each([
    ['  Max   Mustermann  ', 'Max Mustermann'],
    ['Max\tMustermann', 'Max Mustermann'],
    ['Max\u00a0Mustermann', 'Max Mustermann'],
    ['Max\r\nMustermann', 'Max Mustermann'],
    ['Zoe\u0308', 'Zoë'], // NFD → NFC
    ['Mus\u00adter\u200bmann\ufeff', 'Mustermann'],
    ['Abc\u0007\u0000def', 'Abcdef'],
    ['\u2003 \u3000', ''],
    ['van der Berg', 'van der Berg'],
    ['MÜLLER-lüdenscheidt', 'MÜLLER-lüdenscheidt'],
  ])('single line: %j → %j', (raw, expected) => {
    expect(value(normalizeText(raw))).toBe(expected);
  });

  it.each([
    ['Zeile 1\r\nZeile 2\rZeile 3', 'Zeile 1\nZeile 2\nZeile 3'],
    ['\n\n  erste  Zeile  \n\n\nzweite\n\n', 'erste Zeile\n\n\nzweite'],
    ['a\u2028b\u0085c', 'a\nb\nc'],
    ['  \n \t \n', ''],
  ])('multi-line: %j → %j', (raw, expected) => {
    expect(value(normalizeText(raw, true))).toBe(expected);
  });

  it('removes an invisible character between a letter and its combining mark before composing', () => {
    expect(value(normalizeText('e\u200b\u0301'))).toBe('é');
  });

  it('rejects unpaired surrogates', () => {
    expect(normalizeText('ab\ud800')).toEqual({ ok: false, issue: 'text.illFormed' });
  });

  it('is idempotent for random strings (canon stability)', () => {
    const alphabet = [
      'a',
      'Z',
      'ä',
      'e\u0301',
      '\u0301',
      ' ',
      '  ',
      '\t',
      '\n',
      '\r',
      '\r\n',
      '\u00a0',
      '\u2028',
      '\u0085',
      '\u200b',
      '\u200d',
      '\ufeff',
      '\u00ad',
      '\u0000',
      '\u001f',
      '\u007f',
      '\u0090',
      '\u{1F600}',
      'ß',
      'İ',
      '\u2003',
      '\u3000',
      '-',
      '.',
    ];
    let state = 20261029;
    const next = () => (state = (state * 1103515245 + 12345) % 2147483648);
    for (let run = 0; run < 2000; run++) {
      const length = next() % 12;
      const raw = Array.from({ length }, () => alphabet[next() % alphabet.length]).join('');
      for (const multiline of [false, true]) {
        const once = value(normalizeText(raw, multiline));
        expect(value(normalizeText(once, multiline))).toBe(once);
        expect(once).toBe(once.normalize('NFC'));
        expect(once).toBe(once.trim());
      }
    }
  });
});

describe('normalizeDate', () => {
  it.each([
    ['29.10.2026', '2026-10-29'],
    ['1.2.2026', '2026-02-01'],
    [' 01.02.2026 ', '2026-02-01'],
    ['2026-10-29', '2026-10-29'],
    ['29.02.2028', '2028-02-29'],
  ])('%j → %s', (raw, expected) => {
    expect(normalizeDate(raw)).toEqual({ ok: true, value: expected, warnings: [] });
  });

  it.each([
    ['29.02.2026', 'date.invalid'],
    ['31.04.2026', 'date.invalid'],
    ['2026-13-01', 'date.invalid'],
    ['29.10.26', 'date.format'],
    ['29/10/2026', 'date.format'],
    ['2026-1-5', 'date.format'],
    ['', 'date.format'],
    ['morgen', 'date.format'],
  ])('%j → %s', (raw, issue) => {
    expect(normalizeDate(raw)).toEqual({ ok: false, issue });
  });
});

describe('normalizeMoney', () => {
  it.each([
    ['1234', '1234.00'],
    ['1234,5', '1234.50'],
    ['1234,56', '1234.56'],
    ['1.234', '1234.00'],
    ['1.234,56', '1234.56'],
    ['1.234.567,89', '1234567.89'],
    ['1 234,56', '1234.56'],
    ['1234,56 €', '1234.56'],
    ['EUR 12', '12.00'],
    ['0,99', '0.99'],
    ['007', '7.00'],
    ['0', '0.00'],
    ['1234.56', '1234.56'],
    ['12.5', '12.50'],
  ])('%j → %s', (raw, expected) => {
    expect(normalizeMoney(raw)).toEqual({ ok: true, value: expected, warnings: [] });
  });

  it.each([
    ['12,345', 'money.decimals'],
    ['1.234,567', 'money.decimals'],
    ['-12', 'money.format'],
    ['1,234.56', 'money.format'],
    ['12.34.56', 'money.format'],
    ['1.23.456', 'money.format'],
    ['zwölf', 'money.format'],
    ['', 'money.format'],
    ['1'.repeat(MONEY_MAX_INTEGER_DIGITS + 1), 'money.tooLarge'],
  ])('%j → %s', (raw, issue) => {
    expect(normalizeMoney(raw)).toEqual({ ok: false, issue });
  });

  it('maps every stored value to itself', () => {
    for (const stored of ['0.00', '0.50', '12.34', '999999999999.99']) {
      expect(normalizeMoney(stored)).toEqual({ ok: true, value: stored, warnings: [] });
    }
  });
});

describe('identifiers', () => {
  it('compacts and upper-cases an IBAN', () => {
    expect(normalizeIban('de89 3704 0044 0532 0130 00')).toEqual({
      ok: true,
      value: 'DE89370400440532013000',
      warnings: [],
    });
  });

  it('removes spaces from a tax id', () => {
    expect(normalizeTaxId('86 095 742 719')).toEqual({
      ok: true,
      value: '86095742719',
      warnings: [],
    });
  });

  it('compacts and upper-cases an SV number', () => {
    expect(normalizeSvNumber('65 170839 j 003')).toEqual({
      ok: true,
      value: '65170839J003',
      warnings: [],
    });
  });
});

describe('choices', () => {
  it('accepts a known option id and rejects labels and unknown ids', () => {
    expect(normalizeChoice('101', OPTIONS).ok).toBe(true);
    expect(normalizeChoice('A', OPTIONS)).toEqual({ ok: false, issue: 'choice.unknown' });
  });

  it('de-duplicates and sorts multiple choices independent of option order', () => {
    expect(normalizeMultiChoice(['b', 'a', 'b', '101'], OPTIONS)).toEqual({
      ok: true,
      value: ['101', 'a', 'b'],
      warnings: [],
    });
    expect(normalizeMultiChoice(['a', 'x'], OPTIONS)).toEqual({
      ok: false,
      issue: 'choice.unknown',
    });
  });
});

describe('normalizeFieldValue', () => {
  it.each<[FieldType, unknown, unknown]>([
    ['text', '  Max  ', 'Max'],
    ['text', '   ', null],
    ['text', null, null],
    ['date', '1.2.2026', '2026-02-01'],
    ['date', '', null],
    ['money', '1.234,5', '1234.50'],
    ['iban', 'de89 3704 0044 0532 0130 00', 'DE89370400440532013000'],
    ['taxId', '86 095 742 719', '86095742719'],
    ['svNumber', '65 170839 J 003', '65170839J003'],
    ['betriebsnummer', '1234 5678', '12345678'],
    ['boolean', true, true],
    ['boolean', null, null],
    ['choice', 'a', 'a'],
    ['choice', '', null],
    ['multiChoice', ['b', 'a'], ['a', 'b']],
    ['multiChoice', [], null],
  ])('%s: %j → %j', (type, raw, expected) => {
    expect(normalizeFieldValue(field(type, { options: OPTIONS }), raw)).toEqual({
      ok: true,
      value: expected,
      warnings: [],
    });
  });

  it('keeps line breaks only in multi-line text fields', () => {
    expect(normalizeFieldValue(field('text'), 'a\nb')).toMatchObject({ value: 'a b' });
    expect(normalizeFieldValue(field('text', { multiline: true }), 'a\nb')).toMatchObject({
      value: 'a\nb',
    });
  });

  it.each<[FieldType, unknown]>([
    ['text', 12],
    ['date', ['2026-01-01']],
    ['boolean', 'ja'],
    ['choice', 1],
    ['multiChoice', 'a'],
    ['multiChoice', ['a', 1]],
  ])('%s rejects the wrong input type %j', (type, raw) => {
    expect(normalizeFieldValue(field(type, { options: OPTIONS }), raw)).toEqual({
      ok: false,
      issue: 'value.type',
    });
  });

  it('passes validation issues through', () => {
    expect(normalizeFieldValue(field('taxId'), '86095742718')).toEqual({
      ok: false,
      issue: 'taxId.checksum',
    });
  });

  it('reports file fields as not yet supported', () => {
    expect(normalizeFieldValue(field('file'), [])).toEqual({
      ok: false,
      issue: 'type.unsupported',
    });
  });

  it('is idempotent on its own output for every scalar type', () => {
    const inputs: [FieldType, unknown][] = [
      ['text', ' a  b '],
      ['date', '1.2.2026'],
      ['money', '1.234,5'],
      ['iban', 'de89 3704 0044 0532 0130 00'],
      ['taxId', '86 095 742 719'],
      ['svNumber', '65 170839 j 003'],
      ['betriebsnummer', ' 12 34 56 78 '],
      ['choice', 'a'],
      ['multiChoice', ['b', 'a', 'b']],
      ['boolean', false],
    ];
    for (const [type, raw] of inputs) {
      const definition = field(type, { options: OPTIONS });
      const once = normalizeFieldValue(definition, raw);
      if (!once.ok) throw new Error(`${type} rejected ${String(raw)}`);
      expect(normalizeFieldValue(definition, once.value)).toEqual(once);
    }
  });
});

describe('ISSUE_MESSAGES', () => {
  it('has a German sentence for every issue code', () => {
    for (const message of Object.values(ISSUE_MESSAGES)) {
      expect(message).toMatch(/^[A-ZÄÖÜ].*\.$/);
    }
  });
});
