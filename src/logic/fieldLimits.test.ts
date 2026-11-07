// Field limits of the validation package (Tobias 2026-11-03: "1 ok / 2 ok / rest ok"; lengths
// "über die Eingabefelder enforced … und zusätzlich kontrolliert"): maxLength, the new text formats,
// number bounds and date bounds are refused by the normalisation; DEÜV character rules and unusual
// numbers are only warnings. Fictitious values.
import { DEUEV_CHARACTER_RULES, deuevHints } from './deuevZeichen';
import { issueMessage, type IssueCode } from './issues';
import {
  DEUEV_RULES,
  type DeuevRule,
  type FieldDefinition,
  type FieldType,
  type TextFormat,
} from './model';
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

const accepted = (value: unknown, warnings: IssueCode[] = []) => ({ ok: true, value, warnings });
const refused = (issue: IssueCode) => ({ ok: false, issue });

describe('maxLength', () => {
  const name = field('text', { maxLength: 30 });

  it('takes exactly the limit and refuses one character more', () => {
    expect(normalizeFieldValue(name, 'a'.repeat(30))).toEqual(accepted('a'.repeat(30)));
    expect(normalizeFieldValue(name, 'a'.repeat(31))).toEqual(refused('text.tooLong'));
  });

  it('counts the stored text: spaces trimmed and collapsed first, umlauts as one character', () => {
    expect(normalizeFieldValue(name, `  ${'ä'.repeat(15)}   ${'ö'.repeat(14)}  `)).toEqual(
      accepted(`${'ä'.repeat(15)} ${'ö'.repeat(14)}`),
    );
    // A character outside the BMP is one character, not two code units.
    expect(normalizeFieldValue(field('text', { maxLength: 2 }), '𝔄b')).toEqual(accepted('𝔄b'));
  });

  it('checks the length before the format', () => {
    expect(
      normalizeFieldValue(field('text', { maxLength: 5, textFormat: 'ziffern' }), '123456'),
    ).toEqual(refused('text.tooLong'));
  });
});

describe('the new text formats', () => {
  it.each<[TextFormat, string, string]>([
    ['bic', 'byla dem1 001', 'BYLADEM1001'],
    ['bic', 'BYLADEM1', 'BYLADEM1'],
    ['steuernummer', '93815/08152', '93815/08152'],
    ['steuernummer', '181/815/08155', '181/815/08155'],
    ['steuernummer', '2181508150815', '2181508150815'],
    ['jahr', ' 2025 ', '2025'],
    ['ziffern', '12 345', '12345'],
    ['kfzKennzeichen', 'ka-ab 1234', 'KA-AB 1234'],
    ['kfzKennzeichen', 'KA AB1234E', 'KA-AB 1234E'],
    ['kfzKennzeichen', 'LÖ-X 7h', 'LÖ-X 7H'],
    ['kfzKennzeichen', 'B-Z 1', 'B-Z 1'],
  ])('%s: %j → %j', (textFormat, raw, stored) => {
    expect(normalizeFieldValue(field('text', { textFormat }), raw)).toEqual(accepted(stored));
  });

  it.each<[TextFormat, string, IssueCode]>([
    ['bic', 'BYLADEM', 'bic.format'],
    ['bic', 'BYLADEM1001X', 'bic.format'],
    ['bic', '1YLADEM1', 'bic.format'],
    ['steuernummer', '93815/0815', 'steuernummer.format'],
    ['steuernummer', '12345678901234', 'steuernummer.format'],
    ['steuernummer', '93815/O8152', 'steuernummer.format'],
    ['jahr', '25', 'jahr.format'],
    ['jahr', '1899', 'jahr.format'],
    ['ziffern', '12a', 'ziffern.format'],
    ['kfzKennzeichen', 'KA-ÄB 12', 'kennzeichen.format'],
    ['kfzKennzeichen', 'KA-AB 0123', 'kennzeichen.format'],
    ['kfzKennzeichen', 'KA-AB 12345', 'kennzeichen.format'],
    ['kfzKennzeichen', 'KARL-A 1', 'kennzeichen.format'],
    ['kfzKennzeichen', 'KA-ABC 1', 'kennzeichen.format'],
  ])('%s refuses %j', (textFormat, raw, issue) => {
    expect(normalizeFieldValue(field('text', { textFormat }), raw)).toEqual(refused(issue));
  });

  it('is idempotent on its own output', () => {
    const inputs: [TextFormat, string][] = [
      ['bic', 'byla dem1'],
      ['steuernummer', '181 / 815 / 08155'],
      ['jahr', '2025'],
      ['ziffern', ' 1 2 3 '],
      ['kfzKennzeichen', 'ka ab 12e'],
    ];
    for (const [textFormat, raw] of inputs) {
      const definition = field('text', { textFormat });
      const once = normalizeFieldValue(definition, raw);
      if (!once.ok) throw new Error(`${String(textFormat)} rejected ${raw}`);
      expect(normalizeFieldValue(definition, once.value)).toEqual(once);
    }
  });
});

describe('number bounds', () => {
  const day = field('number', { decimals: 2, max: 24, warnAbove: 10 });
  const gdb = field('number', { min: 20, max: 100, step: 10 });

  it('refuses what is impossible', () => {
    expect(normalizeFieldValue(day, '24')).toEqual(accepted('24.00', ['number.unusual']));
    expect(normalizeFieldValue(day, '24,01')).toEqual(refused('number.aboveMax'));
    expect(normalizeFieldValue(gdb, '10')).toEqual(refused('number.belowMin'));
    expect(normalizeFieldValue(gdb, '110')).toEqual(refused('number.aboveMax'));
  });

  it('allows only the steps, counted from min', () => {
    expect(normalizeFieldValue(gdb, '20')).toEqual(accepted('20'));
    expect(normalizeFieldValue(gdb, '50')).toEqual(accepted('50'));
    expect(normalizeFieldValue(gdb, '100')).toEqual(accepted('100'));
    expect(normalizeFieldValue(gdb, '25')).toEqual(refused('number.step'));
    const quarter = field('number', { decimals: 2, step: 0.25 });
    expect(normalizeFieldValue(quarter, '7,75')).toEqual(accepted('7.75'));
    expect(normalizeFieldValue(quarter, '7,7')).toEqual(refused('number.step'));
  });

  it('only warns about the unusual', () => {
    expect(normalizeFieldValue(day, '10')).toEqual(accepted('10.00'));
    expect(normalizeFieldValue(day, '10,5')).toEqual(accepted('10.50', ['number.unusual']));
  });

  it('keeps the older checks first', () => {
    expect(normalizeFieldValue(day, '-1')).toEqual(refused('number.negative'));
    expect(normalizeFieldValue(day, '1,234')).toEqual(refused('number.decimals'));
    const signed = field('number', { signed: true, min: -10, max: 10 });
    expect(normalizeFieldValue(signed, '-10')).toEqual(accepted('-10'));
    expect(normalizeFieldValue(signed, '-11')).toEqual(refused('number.belowMin'));
  });
});

describe('date bounds', () => {
  const birth = field('date', { minDate: '1876-01-01', maxDate: '2026-12-31' });

  it('refuses a day before minDate or after maxDate and keeps both ends', () => {
    expect(normalizeFieldValue(birth, '01.01.1876')).toEqual(accepted('1876-01-01'));
    expect(normalizeFieldValue(birth, '31.12.2026')).toEqual(accepted('2026-12-31'));
    expect(normalizeFieldValue(birth, '31.12.1875')).toEqual(refused('date.tooEarly'));
    expect(normalizeFieldValue(birth, '01.01.2027')).toEqual(refused('date.tooLate'));
  });

  it('reports a malformed date as before', () => {
    expect(normalizeFieldValue(birth, '31.02.2000')).toEqual(refused('date.invalid'));
  });
});

describe('issueMessage', () => {
  it('fills in the bounds of the field, German style', () => {
    expect(issueMessage('text.tooLong', { maxLength: 30 })).toBe('Höchstens 30 Zeichen.');
    expect(issueMessage('number.aboveMax', { max: 7.5 })).toBe('Höchstens 7,5.');
    expect(issueMessage('number.belowMin', { min: 20 })).toBe('Mindestens 20.');
    expect(issueMessage('number.step', { step: 10 })).toBe('Nur in Schritten von 10 möglich.');
    expect(issueMessage('date.tooEarly', { minDate: '1876-01-01' })).toBe(
      'Das Datum liegt zu weit zurück – frühestens 01.01.1876.',
    );
    expect(issueMessage('date.tooLate', { maxDate: '2026-12-31' })).toBe(
      'Das Datum liegt zu spät – spätestens 31.12.2026.',
    );
  });

  it('leaves messages without placeholders as they are', () => {
    expect(issueMessage('svNumber.checksum')).toBe(
      'Die Versicherungsnummer stimmt nicht (Prüfziffer).',
    );
  });
});

describe('DEÜV character rules (only hints)', () => {
  it.each<[DeuevRule, string, IssueCode[]]>([
    ['familienname', 'Müller-Lüdenscheidt', []],
    ['familienname', "O'Brien", []],
    ['familienname', "'t Hooft", []],
    ['familienname', 'Nguyễn', []],
    ['familienname', 'Smith Jr.', []],
    ['familienname', 'Heinrich (geb. Muster)', []],
    ['familienname', 'ßmith', ['deuev.anfang']],
    ['familienname', 'Müller-', ['deuev.ende']],
    ['familienname', 'Müller!', ['deuev.zeichen', 'deuev.ende']],
    ['familienname', 'Иванов', ['deuev.zeichen', 'deuev.anfang', 'deuev.ende']],
    ['vorname', 'Anna-Lena', []],
    ['vorname', 'Anna2', ['deuev.zeichen', 'deuev.ende']],
    ['titel', 'Prof. Dr.-Ing.', []],
    ['titel', 'Dr', []],
    ['titel', '1. Dr.', ['deuev.zeichen', 'deuev.anfang']],
    ['geburtsort', 'Frankfurt (Oder)', []],
    ['geburtsort', 'St. Ingbert', []],
    ['geburtsort', 'X', ['deuev.zeichen']],
    ['wohnort', 'Paris 16', []],
    ['wohnort', 'Köln!', ['deuev.zeichen', 'deuev.ende']],
    ['strasse', 'Straße des 17. Juni', []],
    ['strasse', 'Am „Kreuz“ & Co', []],
    ['strasse', 'Straße#1', ['deuev.zeichen']],
    ['hausnummer', '12a', []],
    ['hausnummer', '12-14', []],
    ['hausnummer', '-12', ['deuev.anfang']],
    ['hausnummer', '12a.', ['deuev.ende']],
    ['plzAusland', '1234 AB', []],
    ['plzAusland', '12--34', ['deuev.zeichen']],
    ['plzAusland', 'AB_1', ['deuev.zeichen']],
  ])('%s %j → %j', (rule, text, hints) => {
    expect(deuevHints(rule, text)).toEqual(hints);
  });

  it('has a rule for every name a definition may use', () => {
    expect(Object.keys(DEUEV_CHARACTER_RULES).sort()).toEqual([...DEUEV_RULES].sort());
  });

  it('keeps the value and adds the hints as warnings', () => {
    const name = field('text', { maxLength: 30, deuevRule: 'familienname' });
    expect(normalizeFieldValue(name, 'Müller!')).toEqual(
      accepted('Müller!', ['deuev.zeichen', 'deuev.ende']),
    );
    expect(normalizeFieldValue(name, 'Müller')).toEqual(accepted('Müller'));
  });
});

describe('a floating date bound (maxDate "today")', () => {
  const birth = field('date', { minDate: '1876-01-01', maxDate: 'today' });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('takes today and refuses tomorrow, whatever the year', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2031, 6, 1, 10));
    expect(normalizeFieldValue(birth, '01.07.2031')).toEqual(accepted('2031-07-01'));
    expect(normalizeFieldValue(birth, '02.07.2031')).toEqual(refused('date.tooLate'));
    expect(normalizeFieldValue(birth, '31.12.1875')).toEqual(refused('date.tooEarly'));
  });

  // Tobias 2026-11-07: "Geburtsdatum sollte auch ttmmjj eingegeben werden können … ergänzt für
  // Alter bis ca. 100 Jahre": the latest year with these two digits that is not after the bound.
  it.each([
    ['170590', '1990-05-17'],
    ['17.05.90', '1990-05-17'],
    ['1.5.90', '1990-05-01'],
    ['17,05,90', '1990-05-17'],
    ['010125', '2025-01-01'],
    ['01.07.31', '2031-07-01'], // today: age 0
    ['02.07.31', '1931-07-02'], // tomorrow is in the future: 100 years earlier, age 99
    ['290200', '2000-02-29'],
  ])('reads a two-digit year %j as %s, at most 100 years back', (raw, iso) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2031, 6, 1, 10));
    expect(normalizeFieldValue(birth, raw)).toEqual(accepted(iso));
  });

  it('still refuses a two-digit year where it cannot tell the century', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 7, 10));
    expect(normalizeFieldValue(birth, '290225')).toEqual(refused('date.invalid'));
    const start = field('date', { minDate: '2026-01-01' });
    expect(normalizeFieldValue(start, '02.11.26')).toEqual(refused('date.shortYear'));
    expect(normalizeFieldValue(start, '021126')).toEqual(refused('date.shortYear'));
    expect(issueMessage('date.shortYear', {})).toBe(
      'Bitte das Jahr vierstellig eingeben, z. B. 02.11.2026.',
    );
  });

  it('names "heute" in the message', () => {
    expect(issueMessage('date.tooLate', { maxDate: 'today' })).toBe(
      'Das Datum liegt zu spät – spätestens heute.',
    );
    expect(issueMessage('date.tooEarly', { minDate: 'today' })).toBe(
      'Das Datum liegt zu weit zurück – frühestens heute.',
    );
  });
});

describe('the SEPA formats (Tobias 2026-11-03: the simple e-signature suffices for a mandate)', () => {
  it.each<[TextFormat, string, string]>([
    // Creditor identifier: compact capitals; DE98ZZZ09999999999 is the Bundesbank's test number.
    ['glaeubigerId', 'de98 zzz 0999 9999 999', 'DE98ZZZ09999999999'],
    ['glaeubigerId', 'AT92ZZZ00000012345', 'AT92ZZZ00000012345'],
    // Mandate reference: stored as written (case carries meaning for some creditors).
    ['mandatsreferenz', 'M-2026/001.KASSE', 'M-2026/001.KASSE'],
    ['mandatsreferenz', "K'(1):2,3?+a", "K'(1):2,3?+a"],
    ['mandatsreferenz', 'A'.repeat(35), 'A'.repeat(35)],
  ])('%s: %j → %j', (textFormat, raw, stored) => {
    expect(normalizeFieldValue(field('text', { textFormat }), raw)).toEqual(accepted(stored));
  });

  it.each<[TextFormat, string, IssueCode]>([
    ['glaeubigerId', 'DE97ZZZ09999999999', 'glaeubigerId.checksum'],
    ['glaeubigerId', 'DE98ZZZ0999999999', 'glaeubigerId.format'],
    ['mandatsreferenz', 'A'.repeat(36), 'mandatsreferenz.format'],
    ['mandatsreferenz', 'MREF 001', 'mandatsreferenz.format'],
    ['mandatsreferenz', 'MÄNDAT1', 'mandatsreferenz.format'],
    ['mandatsreferenz', 'MREF_001', 'mandatsreferenz.format'],
    ['mandatsreferenz', 'M;1', 'mandatsreferenz.format'],
  ])('%s refuses %j', (textFormat, raw, issue) => {
    expect(normalizeFieldValue(field('text', { textFormat }), raw)).toEqual(refused(issue));
  });

  it('is idempotent on its own output', () => {
    for (const [textFormat, raw] of [
      ['glaeubigerId', 'de98zzz09999999999'],
      ['mandatsreferenz', 'M-2026/001'],
    ] as const) {
      const definition = field('text', { textFormat });
      const once = normalizeFieldValue(definition, raw);
      if (!once.ok) throw new Error(`${textFormat} rejected ${raw}`);
      expect(normalizeFieldValue(definition, once.value)).toEqual(once);
    }
  });
});
