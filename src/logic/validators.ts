// Check-digit validators for identifiers. Input is already compact (no spaces) and upper-case;
// normalize.ts takes care of that.
import { IBAN_LENGTHS } from './data/ibanLengths';
import { accept, reject, type Checked } from './issues';

const IBAN_SHAPE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const TAX_ID_SHAPE = /^\d{11}$/;
const SV_NUMBER_SHAPE = /^\d{8}[A-Z]\d{3}$/;
const SV_NUMBER_WEIGHTS = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1] as const;

/** IBAN (ISO 13616): shape, length for known countries, ISO 7064 MOD 97-10. */
export function checkIban(iban: string): Checked<string> {
  if (!IBAN_SHAPE.test(iban)) return reject('iban.format');
  const expectedLength = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expectedLength !== undefined && iban.length !== expectedLength) return reject('iban.length');
  if (mod97(iban.slice(4) + iban.slice(0, 4)) !== 1) return reject('iban.checksum');
  return accept(iban, expectedLength === undefined ? ['iban.unknownCountry'] : []);
}

// Letters count as two digits (A = 10 … Z = 35); the remainder is folded in piece by piece.
function mod97(chars: string): number {
  let remainder = 0;
  for (const char of chars) {
    const code = char.charCodeAt(0);
    remainder = code <= 57 ? (remainder * 10 + code - 48) % 97 : (remainder * 100 + code - 55) % 97;
  }
  return remainder;
}

/** Steuerliche Identifikationsnummer (§ 139b AO): 11 digits, digit pattern, ISO 7064 MOD 11,10. */
export function checkTaxId(id: string): Checked<string> {
  if (!TAX_ID_SHAPE.test(id)) return reject('taxId.format');
  if (id.startsWith('0')) return reject('taxId.leadingZero');
  const body = id.slice(0, 10);
  if (!hasValidTaxIdDigitPattern(body)) return reject('taxId.digitPattern');
  if (taxIdCheckDigit(body) !== Number(id.slice(10))) return reject('taxId.checksum');
  return accept(id);
}

// Among the first ten digits exactly one digit repeats — twice, or three times but never three in a row.
function hasValidTaxIdDigitPattern(body: string): boolean {
  const counts = new Map<string, number>();
  for (const digit of body) counts.set(digit, (counts.get(digit) ?? 0) + 1);
  const repeats = [...counts.values()].filter((count) => count > 1);
  if (repeats.length !== 1) return false;
  if (repeats[0] === 2) return true;
  return repeats[0] === 3 && !/(\d)\1\1/.test(body);
}

function taxIdCheckDigit(body: string): number {
  let product = 10;
  for (const digit of body) {
    const sum = (Number(digit) + product) % 10 || 10;
    product = (sum * 2) % 11;
  }
  const check = 11 - product;
  return check === 10 ? 0 : check;
}

/**
 * Versicherungsnummer der Rentenversicherung (§ 147 SGB VI, VKVV): 2-digit area, birth date
 * TTMMJJ, initial of the birth name, 2-digit serial, check digit. The letter counts as its
 * two-digit position in the alphabet; the check digit is the sum of the weighted products'
 * digit sums, modulo 10. The birth-date part is not checked here (form-level rule).
 */
export function checkSvNumber(number: string): Checked<string> {
  if (!SV_NUMBER_SHAPE.test(number)) return reject('svNumber.format');
  const letter = String(number.charCodeAt(8) - 64).padStart(2, '0');
  const digits = number.slice(0, 8) + letter + number.slice(9, 11);
  let sum = 0;
  SV_NUMBER_WEIGHTS.forEach((weight, i) => {
    const product = Number(digits[i]) * weight;
    sum += Math.floor(product / 10) + (product % 10);
  });
  return sum % 10 === Number(number.slice(11)) ? accept(number) : reject('svNumber.checksum');
}
