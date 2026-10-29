import { IBAN_LENGTHS } from './data/ibanLengths';
import { checkBetriebsnummer, checkIban, checkSvNumber, checkTaxId } from './validators';

// Deterministic PRNG (mulberry32) for property tests: same cases on every run.
function prng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Independent reference for IBAN check digits (BigInt instead of the piecewise remainder).
function ibanWithCheckDigits(country: string, bban: string): string {
  const numeric = [...`${bban}${country}00`]
    .map((char) => (/\d/.test(char) ? char : String(char.charCodeAt(0) - 55)))
    .join('');
  const check = 98n - (BigInt(numeric) % 97n);
  return `${country}${String(check).padStart(2, '0')}${bban}`;
}

describe('checkIban', () => {
  it.each([
    'DE89370400440532013000',
    'AT611904300234573201',
    'CH9300762011623852957',
    'GB82WEST12345698765432',
    'FR1420041010050500013M02606',
    'NL91ABNA0417164300',
    'BE68539007547034',
    'PL61109010140000071219812874',
    'IT60X0542811101000000123456',
    'ES9121000418450200051332',
    'NO9386011117947',
    'MT84MALT011000012345MTLCAST001S',
  ])('accepts the registry example %s', (iban) => {
    expect(checkIban(iban)).toEqual({ ok: true, value: iban, warnings: [] });
  });

  it('rejects a wrong check digit', () => {
    expect(checkIban('DE88370400440532013000')).toEqual({ ok: false, issue: 'iban.checksum' });
  });

  it('rejects a wrong length for a known country before looking at the checksum', () => {
    expect(checkIban('DE8937040044053201300')).toEqual({ ok: false, issue: 'iban.length' });
  });

  it.each([
    '',
    'DE89',
    'de89370400440532013000',
    'D189370400440532013000',
    'DE8937040044053201300!',
  ])('rejects the malformed %j', (iban) => {
    expect(checkIban(iban)).toEqual({ ok: false, issue: 'iban.format' });
  });

  it('accepts an unknown country with a valid checksum, with a warning', () => {
    const iban = ibanWithCheckDigits('QQ', '1234567890123');
    expect(checkIban(iban)).toEqual({ ok: true, value: iban, warnings: ['iban.unknownCountry'] });
  });

  it('accepts every generated IBAN and detects every single-character substitution', () => {
    const random = prng(13616);
    for (let run = 0; run < 200; run++) {
      const bban = Array.from({ length: 18 }, () => String(Math.floor(random() * 10))).join('');
      const iban = ibanWithCheckDigits('DE', bban);
      expect(checkIban(iban).ok).toBe(true);
      const position = 2 + Math.floor(random() * 20);
      const original = Number(iban[position]);
      const replacement = (original + 1 + Math.floor(random() * 9)) % 10;
      const broken = iban.slice(0, position) + String(replacement) + iban.slice(position + 1);
      expect(checkIban(broken)).toEqual({ ok: false, issue: 'iban.checksum' });
    }
  });

  it('has plausible table entries (ISO 3166 code, 15–34 characters)', () => {
    for (const [country, length] of Object.entries(IBAN_LENGTHS)) {
      expect(country).toMatch(/^[A-Z]{2}$/);
      expect(length).toBeGreaterThanOrEqual(15);
      expect(length).toBeLessThanOrEqual(34);
    }
    expect(IBAN_LENGTHS.DE).toBe(22);
  });
});

describe('checkTaxId', () => {
  it.each([
    ['86095742719', 'one digit twice'],
    ['65929970489', 'one digit three times, two adjacent'],
    ['11213456783', 'one digit three times, not adjacent'],
  ])('accepts %s (%s)', (id) => {
    expect(checkTaxId(id)).toEqual({ ok: true, value: id, warnings: [] });
  });

  it.each([
    ['8609574271', 'taxId.format'],
    ['860957427190', 'taxId.format'],
    ['8609574271a', 'taxId.format'],
    ['06095742719', 'taxId.leadingZero'],
    ['12345678903', 'taxId.digitPattern'], // all ten digits different
    ['11223456789', 'taxId.digitPattern'], // two digits repeat
    ['11123456786', 'taxId.digitPattern'], // three in a row
    ['11112345678', 'taxId.digitPattern'], // four times
    ['86095742718', 'taxId.checksum'],
  ])('rejects %s with %s', (id, issue) => {
    expect(checkTaxId(id)).toEqual({ ok: false, issue });
  });

  it('detects every wrong check digit', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const id = `8609574271${digit}`;
      expect(checkTaxId(id).ok).toBe(digit === 9);
    }
  });
});

describe('checkSvNumber', () => {
  it.each(['65170839J003', '15070649C103'])('accepts %s', (number) => {
    expect(checkSvNumber(number)).toEqual({ ok: true, value: number, warnings: [] });
  });

  it('detects every wrong check digit', () => {
    for (let digit = 0; digit <= 9; digit++) {
      expect(checkSvNumber(`65170839J00${digit}`).ok).toBe(digit === 3);
    }
  });

  it('includes the letter in the check digit', () => {
    expect(checkSvNumber('65170839K003')).toEqual({ ok: false, issue: 'svNumber.checksum' });
  });

  it.each(['', '65170839J00', '65170839J0033', '6517083JJ003', '65170839j003', '65170839J0O3'])(
    'rejects the malformed %j',
    (number) => {
      expect(checkSvNumber(number)).toEqual({ ok: false, issue: 'svNumber.format' });
    },
  );
});

describe('checkBetriebsnummer', () => {
  it.each(['12345678', '00000001'])('accepts %s', (number) => {
    expect(checkBetriebsnummer(number)).toEqual({ ok: true, value: number, warnings: [] });
  });

  it.each(['', '1234567', '123456789', '1234567a', '1234 5678', '１２３４５６７８'])(
    'rejects the malformed %j',
    (number) => {
      expect(checkBetriebsnummer(number)).toEqual({ ok: false, issue: 'betriebsnummer.format' });
    },
  );
});
