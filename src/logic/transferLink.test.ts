import { beispielForm, beispielRegistry, personSigned } from '../../tests/support/sample';
import {
  completeSofortmeldung,
  employerOnly,
  sofortmeldung,
} from '../../tests/support/sofortmeldungSession';
import { decodePackage } from './dataPackage';
import { canonicalize } from './jcs';
import { parseMasterDataFragment } from './masterDataLink';
import type { Questionnaire } from './model';
import { enterRole } from './session';
import {
  lockedTransferFragment,
  passwordKeyText,
  TRANSFER_LINK_MAX_LENGTH,
  TRANSFER_LINK_MESSAGES,
  TRANSFER_LOCK,
  TRANSFER_PASSWORD_ALPHABET,
  parseTransferFragment,
  transferFragment,
  transferOffer,
  transferPackageText,
  transferPassword,
  transferPlaintext,
  unlockedText,
} from './transferLink';
import { verifyQuestionnaire } from './verify';

const form = beispielForm();
const carried = (hash: string) => (hash === form.definitionHash ? form.definition : undefined);

function fragmentOf(questionnaire: Questionnaire): string {
  const made = transferFragment(questionnaire);
  if (!made.ok) throw new Error(`${made.issue} ${made.length}`);
  return made.fragment;
}

const params = (fragment: string) => new URLSearchParams(fragment.slice(1));

describe('transferFragment / parseTransferFragment', () => {
  it('carries a sealed questionnaire and gives it back unchanged', () => {
    const signed = personSigned();
    const fragment = fragmentOf(signed);
    expect(fragment).toMatch(/^#weitergabe=1&pruef=[0-9a-f]{16}&daten=[A-Za-z0-9_-]+$/);
    expect(parseTransferFragment(fragment)).toEqual({
      ok: true,
      kind: 'open',
      questionnaireText: canonicalize(signed),
    });
  });

  it('opens to a package that decodes and verifies like a file', () => {
    const signed = personSigned();
    const parsed = parseTransferFragment(fragmentOf(signed));
    if (parsed?.ok !== true || parsed.kind !== 'open') throw new Error('not parsed');
    const opened = transferPackageText(parsed.questionnaireText, carried);
    if (!opened.ok) throw new Error(opened.issue);
    const decoded = decodePackage(JSON.parse(opened.text), beispielRegistry());
    if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
    expect(decoded.questionnaire).toEqual(signed);
    expect(verifyQuestionnaire(decoded.questionnaire, { registry: beispielRegistry() }).level).toBe(
      'ok',
    );
  });

  it('refuses a questionnaire too large for a link', () => {
    // Text that hardly compresses, as many different answers would.
    let seed = 1;
    const noise = Array.from({ length: 6000 }, () => {
      seed = (seed * 16807) % 2147483647;
      return String.fromCharCode(97 + (seed % 26));
    }).join('');
    const big = { ...personSigned(), id: noise } as unknown as Questionnaire;
    const made = transferFragment(big);
    expect(made).toMatchObject({ ok: false, issue: 'tooLong' });
    expect(!made.ok && made.length).toBeGreaterThan(TRANSFER_LINK_MAX_LENGTH);
  });

  it('is no transfer link without its marker, also not a master-data link', () => {
    expect(parseTransferFragment('#stammdaten=1&firma=X')).toBeUndefined();
    expect(parseTransferFragment('')).toBeUndefined();
    // And the other way round: a transfer link is no master-data link.
    expect(parseMasterDataFragment(fragmentOf(personSigned()))).toEqual({
      ok: true,
      data: undefined,
    });
  });

  it('names a cut-off or altered link damaged, never half reads it', () => {
    const fragment = fragmentOf(personSigned());
    const data = params(fragment).get('daten') ?? '';
    const digest = params(fragment).get('pruef') ?? '';
    const cut = fragment.slice(0, fragment.length - 20);
    const otherDigest = fragment.replace(
      digest,
      digest.replace(/^./, (c) => (c === '0' ? '1' : '0')),
    );
    for (const hash of [
      cut,
      otherDigest,
      fragment.replace(data, `${data.slice(0, 40)}!${data.slice(41)}`),
      '#weitergabe=1&daten=abc',
      `#weitergabe=1&pruef=${digest}`,
      `${fragment}&daten=AAAA`,
    ]) {
      expect(parseTransferFragment(hash)).toEqual({ ok: false, issue: 'damaged' });
    }
  });

  it('refuses a link of another link version', () => {
    expect(parseTransferFragment('#weitergabe=3&pruef=0&daten=x')).toEqual({
      ok: false,
      issue: 'unknownVersion',
    });
    expect(parseTransferFragment('#weitergabe=1&weitergabe=1')).toEqual({
      ok: false,
      issue: 'unknownVersion',
    });
    expect(parseTransferFragment('#weitergabe=1&weitergabe=2')).toEqual({
      ok: false,
      issue: 'unknownVersion',
    });
  });
});

describe('a link protected by a password (Tobias 2026-11-06)', () => {
  const bytes = (length: number, start: number) =>
    Uint8Array.from({ length }, (_, i) => (start + i) % 256);
  const locked = {
    salt: bytes(TRANSFER_LOCK.saltBytes, 1),
    iv: bytes(TRANSFER_LOCK.ivBytes, 50),
    ciphertext: bytes(300, 100),
  };

  it('carries salt, nonce and ciphertext and gives them back apart', () => {
    const made = lockedTransferFragment(locked);
    if (!made.ok) throw new Error(made.issue);
    expect(made.fragment).toMatch(/^#weitergabe=2&pruef=[0-9a-f]{16}&daten=[A-Za-z0-9_-]+$/);
    expect(parseTransferFragment(made.fragment)).toEqual({ ok: true, kind: 'locked', locked });
  });

  it('names a cut-off or altered protected link damaged before any password is asked', () => {
    const made = lockedTransferFragment(locked);
    if (!made.ok) throw new Error(made.issue);
    const data = params(made.fragment).get('daten') ?? '';
    const tiny = lockedTransferFragment({
      ...locked,
      ciphertext: bytes(TRANSFER_LOCK.tagBytes, 7),
    });
    if (!tiny.ok) throw new Error(tiny.issue);
    for (const hash of [
      made.fragment.slice(0, -8),
      made.fragment.replace(
        data,
        `${data.slice(0, 40)}${data[40] === 'A' ? 'B' : 'A'}${data.slice(41)}`,
      ),
      // Nothing but salt, nonce and tag: no ciphertext at all.
      tiny.fragment,
    ]) {
      expect(parseTransferFragment(hash)).toEqual({ ok: false, issue: 'damaged' });
    }
  });

  it('is refused when it would be too long, like an open link', () => {
    const made = lockedTransferFragment({ ...locked, ciphertext: bytes(2000, 3) });
    expect(made).toMatchObject({ ok: false, issue: 'tooLong' });
  });

  it('encrypts the deflated questionnaire, which unlockedText reads back', () => {
    const signed = personSigned();
    expect(unlockedText(transferPlaintext(signed))).toEqual({
      ok: true,
      questionnaireText: canonicalize(signed),
    });
    expect(unlockedText(bytes(40, 9))).toEqual({ ok: false, issue: 'damaged' });
  });

  it('proposes passwords of three groups of four unmistakable characters', () => {
    expect(transferPassword(bytes(12, 0))).toBe('abcd-efgh-ijkm');
    expect(transferPassword(bytes(12, 24))).toBe('2345-6789-abcd');
    // One character per byte by its low five bits: every byte value is equally likely.
    expect(transferPassword(Uint8Array.from({ length: 12 }, () => 255))).toBe('9999-9999-9999');
    expect(TRANSFER_PASSWORD_ALPHABET).toHaveLength(32);
    expect(new Set(TRANSFER_PASSWORD_ALPHABET).size).toBe(32);
    expect(TRANSFER_PASSWORD_ALPHABET).not.toMatch(/[lo01]/);
    expect(() => transferPassword(bytes(11, 0))).toThrow();
  });

  it('ignores case, spaces and hyphens of a typed password', () => {
    for (const typed of ['k7qm-2xrp-9fha', 'K7qm-2xrp-9fha', ' k7qm 2xrp 9fha ', 'k7qm2xrp9fha']) {
      expect(passwordKeyText(typed)).toBe('k7qm2xrp9fha');
    }
    expect(passwordKeyText(' - ')).toBe('');
  });

  it('has a German message for the password and the browser', () => {
    expect(TRANSFER_LINK_MESSAGES.wrongPassword).toContain('Kennwort');
    expect(TRANSFER_LINK_MESSAGES.unlockUnavailable).toContain('PDF');
  });
});

describe('transferPackageText', () => {
  it('needs the form under the hash the questionnaire names', () => {
    const text = canonicalize(personSigned());
    expect(transferPackageText(text, () => undefined)).toEqual({ ok: false, issue: 'unknownForm' });
    expect(transferPackageText('{"form":{}}', carried)).toEqual({
      ok: false,
      issue: 'unknownForm',
    });
    expect(transferPackageText('null', carried)).toEqual({ ok: false, issue: 'unknownForm' });
    expect(transferPackageText('{nicht json', carried)).toEqual({ ok: false, issue: 'damaged' });
  });

  it('has a German message for every issue', () => {
    for (const message of Object.values(TRANSFER_LINK_MESSAGES)) expect(message).toMatch(/\.$/);
  });
});

describe('transferOffer', () => {
  const HOSTED = 'https://fragebogen.example.org/';

  it('offers a link for the employer part of a Sofortmeldung, which holds few values', () => {
    const offer = transferOffer(employerOnly().questionnaire, sofortmeldung, HOSTED);
    expect(offer.kind).toBe('link');
    if (offer.kind !== 'link') return;
    expect(offer.url.startsWith(`${HOSTED}#weitergabe=1&`)).toBe(true);
    expect(offer.url.length - HOSTED.length).toBeLessThanOrEqual(TRANSFER_LINK_MAX_LENGTH);
  });

  it('leaves the complete Sofortmeldung with its drawn signature to the PDF', () => {
    expect(transferOffer(completeSofortmeldung().questionnaire, sofortmeldung, HOSTED)).toEqual({
      kind: 'tooLong',
    });
  });

  it('offers nothing while something blocks passing on, as for the PDF', () => {
    const entered = enterRole(employerOnly(), 'person');
    if (!entered.ok) throw new Error(entered.message);
    expect(transferOffer(entered.session.questionnaire, sofortmeldung, HOSTED)).toEqual({
      kind: 'blocked',
    });
  });

  it('needs an address another device can open, not a file on this computer', () => {
    expect(
      transferOffer(
        employerOnly().questionnaire,
        sofortmeldung,
        'file:///C:/Fragebogen/index.html',
      ),
    ).toEqual({ kind: 'noAddress' });
  });
});
