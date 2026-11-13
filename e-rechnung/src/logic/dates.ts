// Dates as written in the syntaxes: UBL uses xs:date (YYYY-MM-DD), CII the UNTDID 2379 format 102
// (YYYYMMDD). Both become ISO YYYY-MM-DD; anything else stays unknown (shown as written).

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMAT_102 = /^(\d{4})(\d{2})(\d{2})$/;

function valid(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= days;
}

/** ISO date or undefined when the text is no valid date in either form. */
export function isoDate(text: string | undefined): string | undefined {
  const t = (text ?? '').trim();
  const match = ISO.exec(t) ?? FORMAT_102.exec(t);
  if (!match) return undefined;
  const [, y, m, d] = match;
  if (!valid(Number(y), Number(m), Number(d))) return undefined;
  return `${y}-${m}-${d}`;
}

/** German display "31.12.2026" of an ISO date. */
export function germanDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
