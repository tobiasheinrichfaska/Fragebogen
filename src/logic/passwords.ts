// Passwords for a link or a PDF passed on (Tobias 2026-11-06). The app always proposes the
// password — one thought up is often weak — and never stores it. In the app, case, spaces and
// hyphens do not matter (read out on the phone, typed on a phone that capitalises); a PDF program
// takes the password only exactly as shown.

/** Letters and digits that cannot be mistaken for one another when read out (no l/1, no o/0). */
export const PASSWORD_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
/** Characters of a password: 12 of 32 = 60 bits, three groups of four. */
export const PASSWORD_LENGTH = 12;
const GROUP = 4;

const grouped = (chars: string) =>
  Array.from({ length: Math.ceil(chars.length / GROUP) }, (_, i) =>
    chars.slice(i * GROUP, (i + 1) * GROUP),
  ).join('-');

/** The password the app proposes, from random bytes (one character per byte, unbiased: 32 | 256). */
export function proposedPassword(random: Uint8Array): string {
  if (random.length < PASSWORD_LENGTH) throw new Error('not enough random bytes');
  return grouped(
    Array.from(random.slice(0, PASSWORD_LENGTH), (byte) =>
      PASSWORD_ALPHABET.charAt(byte & 31),
    ).join(''),
  );
}

/** The password without case, spaces and hyphens: what a link's key is derived from. */
export function passwordKeyText(typed: string): string {
  return typed
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s-]+/g, '');
}

/**
 * The passwords to try for a protected PDF: as typed, trimmed, and — when it reads as one the app
 * proposes — in the exact form the PDF was encrypted with ("k7qm-2xrp-9fha").
 */
export function pdfPasswordCandidates(typed: string): string[] {
  const key = passwordKeyText(typed);
  const proposed =
    key.length === PASSWORD_LENGTH && [...key].every((char) => PASSWORD_ALPHABET.includes(char))
      ? [grouped(key)]
      : [];
  return [...new Set([typed, typed.trim(), ...proposed])].filter((password) => password !== '');
}
