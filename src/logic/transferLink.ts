// Passing a questionnaire on as a link instead of a PDF when it holds only a few values (Tobias
// 2026-11-05, e.g. the Kanzlei's part of the SEPA-Mandat). The fragment carries the questionnaire
// alone — deflated, base64url, with the start of its SHA-256 — and the receiving app takes the form
// by its hash from the forms it carries, as the browser memory does (resume.ts); a link to a form it
// lacks is refused with a pointer to the PDF. The opened package goes through decodePackage and the
// seal check like any file. A fragment never reaches the web server, but the link holds every
// answer, so — like the PDF — it goes to the next station only. With a password (Tobias
// 2026-11-06: "das sollte beim Weitergeben als Link eine Option sein") the same deflated text is
// encrypted (version 2); the cipher itself runs in src/io/transferLock.ts.
import { strToU8 } from 'fflate';
import { PACKAGE_FORMAT, PACKAGE_FORMAT_VERSION } from './dataPackage';
import {
  compressPackage,
  fromBase64Url,
  inflatePackage,
  MAX_PACKAGE_BYTES,
  toBase64Url,
} from './dataPages';
import type { RegisteredForm } from './formRegistry';
import { sha256Hex } from './hash';
import { canonicalize } from './jcs';
import type { FormDefinition, Questionnaire } from './model';
import { transmissionBlockers } from './requirements';

const MARKER = 'weitergabe';
export const TRANSFER_LINK_VERSION = '1';
/** A link protected by a password; an app without it calls the link one of another version. */
export const TRANSFER_LINK_LOCKED_VERSION = '2';
/**
 * Longest fragment offered, as for master-data links: mail programs and messengers pass it on in
 * one piece. The Kanzlei part of the SEPA-Mandat needs about 1,200 characters.
 */
export const TRANSFER_LINK_MAX_LENGTH = 2000;
const DIGEST_LENGTH = 16;
const DIGEST = /^[0-9a-f]{16}$/;

export type TransferLinkIssue =
  | 'tooLong'
  | 'unknownVersion'
  | 'damaged'
  | 'unknownForm'
  | 'wrongPassword'
  | 'noPassword'
  | 'lockUnavailable'
  | 'unlockUnavailable';

export const TRANSFER_LINK_MESSAGES: Readonly<Record<TransferLinkIssue, string>> = {
  tooLong: 'Für einen Link sind es zu viele Angaben. Bitte die PDF weitergeben.',
  unknownVersion:
    'Dieser Link stammt aus einer anderen Version der App und kann nicht gelesen werden. Bitte um die PDF bitten.',
  damaged:
    'Der Link ist unvollständig oder beschädigt – vielleicht wurde er beim Kopieren abgeschnitten. Bitte den ganzen Link noch einmal öffnen oder um die PDF bitten.',
  unknownForm:
    'Der Link gehört zu einer Formularfassung, die diese App nicht enthält. Bitte um die PDF bitten.',
  wrongPassword:
    'Das Kennwort passt nicht zu diesem Link. Bitte prüfen Sie es und geben Sie es noch einmal ein.',
  noPassword: 'Bitte geben Sie das Kennwort ein.',
  lockUnavailable:
    'Dieser Browser kann hier nicht verschlüsseln. Bitte einen aktuellen Browser verwenden oder die PDF weitergeben.',
  unlockUnavailable:
    'Dieser Browser kann den geschützten Link nicht öffnen. Bitte einen aktuellen Browser verwenden oder um die PDF bitten.',
};

/**
 * Key derivation and cipher of a protected link, fixed by its version so a link can never ask for
 * weaker ones: PBKDF2-HMAC-SHA-256 with 600,000 iterations (OWASP Password Storage Cheat Sheet),
 * AES-256-GCM with a random salt and nonce per link; the tag proves the password and the data.
 */
export const TRANSFER_LOCK = {
  iterations: 600_000,
  saltBytes: 16,
  ivBytes: 12,
  tagBytes: 16,
  additionalData: 'Fragebogen Weitergabe 2',
} as const;

export interface LockedTransfer {
  salt: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  /** AES-GCM output: the encrypted deflated questionnaire followed by the tag. */
  ciphertext: Uint8Array<ArrayBuffer>;
}

/** What a protected link encrypts: the deflated questionnaire, as `daten` of an open link. */
export function transferPlaintext(questionnaire: Questionnaire): Uint8Array<ArrayBuffer> {
  return compressPackage(canonicalize(questionnaire)).slice();
}

export type TransferLinkResult =
  { ok: true; fragment: string } | { ok: false; issue: 'tooLong'; length: number };

/** The fragment (with "#") that carries the questionnaire; refused when it would be too long. */
export function transferFragment(questionnaire: Questionnaire): TransferLinkResult {
  const text = canonicalize(questionnaire);
  const params = new URLSearchParams([
    [MARKER, TRANSFER_LINK_VERSION],
    ['pruef', sha256Hex(strToU8(text)).slice(0, DIGEST_LENGTH)],
    ['daten', toBase64Url(compressPackage(text))],
  ]);
  const fragment = `#${params.toString()}`;
  return fragment.length > TRANSFER_LINK_MAX_LENGTH
    ? { ok: false, issue: 'tooLong', length: fragment.length }
    : { ok: true, fragment };
}

/**
 * The fragment of a protected link: salt, nonce and ciphertext in `daten`, the start of their
 * SHA-256 in `pruef` — so a cut-off link is told apart from a wrong password, and nothing about
 * the answers can be read or guessed from it.
 */
export function lockedTransferFragment(locked: LockedTransfer): TransferLinkResult {
  const bytes = new Uint8Array([...locked.salt, ...locked.iv, ...locked.ciphertext]);
  const params = new URLSearchParams([
    [MARKER, TRANSFER_LINK_LOCKED_VERSION],
    ['pruef', sha256Hex(bytes).slice(0, DIGEST_LENGTH)],
    ['daten', toBase64Url(bytes)],
  ]);
  const fragment = `#${params.toString()}`;
  return fragment.length > TRANSFER_LINK_MAX_LENGTH
    ? { ok: false, issue: 'tooLong', length: fragment.length }
    : { ok: true, fragment };
}

export type ParsedTransferLink =
  | { ok: true; kind: 'open'; questionnaireText: string }
  | { ok: true; kind: 'locked'; locked: LockedTransfer }
  | { ok: false; issue: 'unknownVersion' | 'damaged' };

/**
 * Reads a location hash (with or without "#"); undefined when it is no transfer link. The text is
 * untrusted: it only passes the length and digest check here.
 */
export function parseTransferFragment(hash: string): ParsedTransferLink | undefined {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const versions = params.getAll(MARKER);
  if (versions.length === 0) return undefined;
  const version = versions[0];
  if (
    versions.length > 1 ||
    (version !== TRANSFER_LINK_VERSION && version !== TRANSFER_LINK_LOCKED_VERSION)
  ) {
    return { ok: false, issue: 'unknownVersion' };
  }
  // The app never writes a longer one (audit 2026-11-14: a long link was inflated before any check).
  if (`#${hash.startsWith('#') ? hash.slice(1) : hash}`.length > TRANSFER_LINK_MAX_LENGTH) {
    return { ok: false, issue: 'damaged' };
  }
  const digest = params.getAll('pruef');
  const data = params.getAll('daten');
  if (digest.length !== 1 || data.length !== 1 || !DIGEST.test(digest[0] ?? '')) {
    return { ok: false, issue: 'damaged' };
  }
  const bytes = fromBase64Url(data[0] ?? '');
  if (!bytes) return { ok: false, issue: 'damaged' };
  if (version === TRANSFER_LINK_LOCKED_VERSION) {
    const { saltBytes, ivBytes, tagBytes } = TRANSFER_LOCK;
    if (
      bytes.length <= saltBytes + ivBytes + tagBytes ||
      bytes.length > MAX_PACKAGE_BYTES ||
      sha256Hex(bytes).slice(0, DIGEST_LENGTH) !== digest[0]
    ) {
      return { ok: false, issue: 'damaged' };
    }
    const salt = bytes.slice(0, saltBytes);
    const iv = bytes.slice(saltBytes, saltBytes + ivBytes);
    const ciphertext = bytes.slice(saltBytes + ivBytes);
    return { ok: true, kind: 'locked', locked: { salt, iv, ciphertext } };
  }
  const inflated = inflatePackage(bytes, { sha256Prefix: digest[0] ?? '' });
  return inflated.ok
    ? { ok: true, kind: 'open', questionnaireText: inflated.text }
    : { ok: false, issue: 'damaged' };
}

/** The questionnaire text of a decrypted link; the tag has already proved the bytes. */
export function unlockedText(
  plaintext: Uint8Array,
): { ok: true; questionnaireText: string } | { ok: false; issue: 'damaged' } {
  const inflated = inflatePackage(plaintext, { sha256Prefix: '' });
  return inflated.ok
    ? { ok: true, questionnaireText: inflated.text }
    : { ok: false, issue: 'damaged' };
}

/**
 * The data package text the app opens like a file: the questionnaire with the form the app carries
 * under the hash it names. `unknownForm` when the app lacks it, `damaged` for text that is no JSON.
 */
export function transferPackageText(
  questionnaireText: string,
  carried: (hash: string) => FormDefinition | undefined,
): { ok: true; text: string } | { ok: false; issue: 'damaged' | 'unknownForm' } {
  let questionnaire: unknown;
  try {
    questionnaire = JSON.parse(questionnaireText);
  } catch {
    return { ok: false, issue: 'damaged' };
  }
  const form = (questionnaire as { form?: { definitionHash?: unknown } } | null)?.form;
  const hash = typeof form?.definitionHash === 'string' ? form.definitionHash : undefined;
  const definition = hash === undefined ? undefined : carried(hash);
  if (definition === undefined) return { ok: false, issue: 'unknownForm' };
  // Anyone can compute a link's digest, so the text is untrusted: a value the canonical form
  // refuses (a number out of range, a lone surrogate, deep nesting) makes the link damaged instead
  // of an exception while the app renders (audit 2026-11-14: a blank page on every reload).
  try {
    return {
      ok: true,
      text: canonicalize({
        format: PACKAGE_FORMAT,
        formatVersion: PACKAGE_FORMAT_VERSION,
        questionnaire,
        definition,
      }),
    };
  } catch {
    return { ok: false, issue: 'damaged' };
  }
}

export type TransferOffer =
  | { kind: 'link'; url: string; base: string; questionnaire: Questionnaire }
  | { kind: 'tooLong' }
  | { kind: 'noAddress' }
  | { kind: 'blocked' };

/**
 * What the done screen offers besides the PDF: a link when the questionnaire may be passed on
 * (nothing blocks it, as for the PDF), fits, and `base` is an address another device can open —
 * a page opened from a file on this computer has none unless the app address is configured.
 */
export function transferOffer(
  questionnaire: Questionnaire,
  form: RegisteredForm,
  base: string,
): TransferOffer {
  if (transmissionBlockers(questionnaire, form).length > 0) return { kind: 'blocked' };
  if (!/^https?:/.test(base)) return { kind: 'noAddress' };
  const made = transferFragment(questionnaire);
  return made.ok
    ? { kind: 'link', url: `${base}${made.fragment}`, base, questionnaire }
    : { kind: 'tooLong' };
}
