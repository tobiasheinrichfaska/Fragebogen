// Decimal numbers as written in e-invoices ("1234.50", "-0.5"), held exactly: BigInt digits plus a
// scale. No floating point anywhere — 0.1 + 0.2 must be 0.3. Step 3 adds the arithmetic.

export interface Decimal {
  /** value = units / 10^scale */
  units: bigint;
  scale: number;
}

const DECIMAL = /^([+-]?)(\d+)(?:\.(\d*))?$|^([+-]?)\.(\d+)$/;

/** Parses the xs:decimal lexical form (no exponent, no thousands separator); undefined otherwise. */
export function parseDecimal(text: string | undefined): Decimal | undefined {
  const match = DECIMAL.exec((text ?? '').trim());
  if (!match) return undefined;
  const sign = match[1] ?? match[4] ?? '';
  const whole = match[2] ?? '0';
  const fraction = match[3] ?? match[5] ?? '';
  const units = BigInt(`${whole}${fraction}`);
  return { units: sign === '-' ? -units : units, scale: fraction.length };
}

/** Same value, smallest scale ("100.00" → 100, scale 0). */
export function normalize(value: Decimal): Decimal {
  let { units, scale } = value;
  while (scale > 0 && units % 10n === 0n) {
    units /= 10n;
    scale -= 1;
  }
  return { units, scale };
}

export function decimalEquals(a: Decimal, b: Decimal): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x.units === y.units && x.scale === y.scale;
}

/** Same value written with `scale` decimals (only ever adds zeros). */
function rescale(value: Decimal, scale: number): bigint {
  return value.units * 10n ** BigInt(scale - value.scale);
}

/** -1, 0 or 1 like a comparator. */
export function compareDecimal(a: Decimal, b: Decimal): number {
  const scale = Math.max(a.scale, b.scale);
  const x = rescale(a, scale);
  const y = rescale(b, scale);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Plain text with a dot ("1234.5" → "1234.5", scale kept). */
export function decimalText(value: Decimal): string {
  const negative = value.units < 0n;
  const digits = (negative ? -value.units : value.units).toString().padStart(value.scale + 1, '0');
  const whole = digits.slice(0, digits.length - value.scale);
  const fraction = digits.slice(digits.length - value.scale);
  return `${negative ? '-' : ''}${whole}${value.scale > 0 ? `.${fraction}` : ''}`;
}

/** German display with at least two decimals and thousands dots: "1.234,50". */
export function formatAmount(value: Decimal): string {
  const scaled =
    value.scale < 2 ? { units: value.units * 10n ** BigInt(2 - value.scale), scale: 2 } : value;
  const [whole = '0', fraction = ''] = decimalText(scaled).split('.');
  const negative = whole.startsWith('-');
  const digits = negative ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${fraction}`;
}
