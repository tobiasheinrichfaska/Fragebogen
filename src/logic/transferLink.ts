// Passing a questionnaire on as a link instead of a PDF when it holds only a few values (Tobias
// 2026-11-05, e.g. the Kanzlei's part of the SEPA-Mandat). The fragment carries the questionnaire
// alone — deflated, base64url, with the start of its SHA-256 — and the receiving app takes the form
// by its hash from the forms it carries, as the browser memory does (resume.ts); a link to a form it
// lacks is refused with a pointer to the PDF. The opened package goes through decodePackage and the
// seal check like any file. A fragment never reaches the web server, but the link holds every
// answer, so — like the PDF — it goes to the next station only.
import { strToU8 } from 'fflate';
import { PACKAGE_FORMAT, PACKAGE_FORMAT_VERSION } from './dataPackage';
import { compressPackage, fromBase64Url, inflatePackage, toBase64Url } from './dataPages';
import type { RegisteredForm } from './formRegistry';
import { sha256Hex } from './hash';
import { canonicalize } from './jcs';
import type { FormDefinition, Questionnaire } from './model';
import { transmissionBlockers } from './requirements';

const MARKER = 'weitergabe';
export const TRANSFER_LINK_VERSION = '1';
/**
 * Longest fragment offered, as for master-data links: mail programs and messengers pass it on in
 * one piece. The Kanzlei part of the SEPA-Mandat needs about 1,200 characters.
 */
export const TRANSFER_LINK_MAX_LENGTH = 2000;
const DIGEST_LENGTH = 16;
const DIGEST = /^[0-9a-f]{16}$/;

export type TransferLinkIssue = 'tooLong' | 'unknownVersion' | 'damaged' | 'unknownForm';

export const TRANSFER_LINK_MESSAGES: Readonly<Record<TransferLinkIssue, string>> = {
  tooLong: 'Für einen Link sind es zu viele Angaben. Bitte die PDF weitergeben.',
  unknownVersion:
    'Dieser Link stammt aus einer anderen Version der App und kann nicht gelesen werden. Bitte um die PDF bitten.',
  damaged:
    'Der Link ist unvollständig oder beschädigt – vielleicht wurde er beim Kopieren abgeschnitten. Bitte den ganzen Link noch einmal öffnen oder um die PDF bitten.',
  unknownForm:
    'Der Link gehört zu einer Formularfassung, die diese App nicht enthält. Bitte um die PDF bitten.',
};

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

export type ParsedTransferLink =
  | { ok: true; questionnaireText: string }
  | { ok: false; issue: Exclude<TransferLinkIssue, 'tooLong' | 'unknownForm'> };

/**
 * Reads a location hash (with or without "#"); undefined when it is no transfer link. The text is
 * untrusted: it only passes the length and digest check here.
 */
export function parseTransferFragment(hash: string): ParsedTransferLink | undefined {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const versions = params.getAll(MARKER);
  if (versions.length === 0) return undefined;
  if (versions.length > 1 || versions[0] !== TRANSFER_LINK_VERSION) {
    return { ok: false, issue: 'unknownVersion' };
  }
  const digest = params.getAll('pruef');
  const data = params.getAll('daten');
  if (digest.length !== 1 || data.length !== 1 || !DIGEST.test(digest[0] ?? '')) {
    return { ok: false, issue: 'damaged' };
  }
  const bytes = fromBase64Url(data[0] ?? '');
  if (!bytes) return { ok: false, issue: 'damaged' };
  const inflated = inflatePackage(bytes, { sha256Prefix: digest[0] ?? '' });
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
  return {
    ok: true,
    text: canonicalize({
      format: PACKAGE_FORMAT,
      formatVersion: PACKAGE_FORMAT_VERSION,
      questionnaire,
      definition,
    }),
  };
}

export type TransferOffer =
  { kind: 'link'; url: string } | { kind: 'tooLong' } | { kind: 'noAddress' } | { kind: 'blocked' };

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
  return made.ok ? { kind: 'link', url: `${base}${made.fragment}` } : { kind: 'tooLong' };
}
