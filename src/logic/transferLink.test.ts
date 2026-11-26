import { beispielForm, beispielRegistry, personSigned } from '../../tests/support/sample';
import {
  completeSofortmeldung,
  employerOnly,
  sofortmeldung,
} from '../../tests/support/sofortmeldungSession';
import { strToU8 } from 'fflate';
import { decodePackage } from './dataPackage';
import { compressPackage, toBase64Url } from './dataPages';
import { sha256Hex } from './hash';
import { canonicalize } from './jcs';
import { parseMasterDataFragment } from './masterDataLink';
import type { Questionnaire } from './model';
import { enterRole } from './session';
import {
  lockedTransferFragment,
  TRANSFER_LINK_INTERIM_TOO_LONG,
  TRANSFER_LINK_MAX_LENGTH,
  TRANSFER_LINK_MESSAGES,
  TRANSFER_LOCK,
  compactText,
  expandText,
  parseTransferFragment,
  transferFragment,
  transferOffer,
  transferPackageText,
  transferPlaintext,
  unlockedText,
} from './transferLink';
import { registryOf } from './formRegistry';
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
    expect(fragment).toMatch(/^#weitergabe=3&pruef=[0-9a-f]{16}&daten=[A-Za-z0-9_-]+$/);
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

  it('reads no link longer than the app ever writes (audit 2026-11-14)', () => {
    // Hex digests do not compress much, so this one link is well over the limit.
    const extra = Array.from({ length: 200 }, (_, i) => sha256Hex(strToU8(String(i)))).join('');
    const text = canonicalize({ ...personSigned(), extra });
    const long = new URLSearchParams([
      ['weitergabe', '1'],
      ['pruef', sha256Hex(strToU8(text)).slice(0, 16)],
      ['daten', toBase64Url(compressPackage(text))],
    ]);
    const fragment = `#${long.toString()}`;
    expect(fragment.length).toBeGreaterThan(TRANSFER_LINK_MAX_LENGTH);
    expect(parseTransferFragment(fragment)).toEqual({ ok: false, issue: 'damaged' });
  });

  it('refuses a link of another link version', () => {
    expect(parseTransferFragment('#weitergabe=5&pruef=0&daten=x')).toEqual({
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

describe('compact links, version 3 (2026-11-24)', () => {
  const legacyFragment = (questionnaire: Questionnaire) => {
    const text = canonicalize(questionnaire);
    return `#${new URLSearchParams([
      ['weitergabe', '1'],
      ['pruef', sha256Hex(strToU8(text)).slice(0, 16)],
      ['daten', toBase64Url(compressPackage(text))],
    ]).toString()}`;
  };

  it('leaves out the field hashes and the reader puts them back exactly', () => {
    const signed = personSigned();
    expect(compactText(signed)).not.toContain('fieldHashes');
    expect(canonicalize(signed)).toContain('fieldHashes');
    expect(parseTransferFragment(fragmentOf(signed))).toEqual({
      ok: true,
      kind: 'open',
      questionnaireText: canonicalize(signed),
    });
    expect(fragmentOf(signed).length).toBeLessThan(legacyFragment(signed).length);
  });

  it('keeps the hashes of a part whose hashes the reader could not rebuild', () => {
    const signed = personSigned();
    const copy = structuredClone(signed);
    const part = Object.values(copy.parts)[0]?.[0];
    const hashes = part?.seal?.payload.fieldHashes;
    if (!hashes) throw new Error('no hashes');
    const first = Object.keys(hashes)[0] ?? '';
    hashes[first] = '0123456789abcdef';
    expect(compactText(copy)).toContain('0123456789abcdef');
    expect(expandText(compactText(copy))).toBe(canonicalize(copy));
  });

  it('refuses a changed answer: the rebuilt hashes no longer fit the content hash', () => {
    const signed = personSigned();
    const parsed = parseTransferFragment(fragmentOf(signed));
    if (parsed?.ok !== true || parsed.kind !== 'open') throw new Error('not parsed');
    const forged = JSON.parse(parsed.questionnaireText) as Questionnaire;
    const part = Object.values(forged.parts)[0]?.[0];
    if (!part) throw new Error('no part');
    const id = Object.keys(part.data)[0] ?? '';
    part.data[id] = 'anders';
    const opened = transferPackageText(JSON.stringify(forged), carried);
    if (!opened.ok) throw new Error(opened.issue);
    const decoded = decodePackage(JSON.parse(opened.text), beispielRegistry());
    if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
    expect(
      verifyQuestionnaire(decoded.questionnaire, { registry: beispielRegistry() }).level,
    ).not.toBe('ok');
  });

  it('still reads links of versions 1 and 2, unchanged', () => {
    const signed = personSigned();
    expect(parseTransferFragment(legacyFragment(signed))).toEqual({
      ok: true,
      kind: 'open',
      questionnaireText: canonicalize(signed),
    });
    const locked = lockedTransferFragment({
      salt: new Uint8Array(16).fill(1),
      iv: new Uint8Array(12).fill(2),
      ciphertext: new Uint8Array(40).fill(3),
    });
    if (!locked.ok) throw new Error(locked.issue);
    const v2 = locked.fragment.replace('weitergabe=4', 'weitergabe=2');
    const asV2 = parseTransferFragment(v2);
    expect(asV2).toMatchObject({ ok: true, kind: 'locked' });
  });

  it('names a text that is no JSON damaged', () => {
    expect(expandText('{nicht json')).toBeUndefined();
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
    expect(made.fragment).toMatch(/^#weitergabe=4&pruef=[0-9a-f]{16}&daten=[A-Za-z0-9_-]+$/);
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

  // Audit 2026-11-14: anyone can compute the digest of a link, so the text is untrusted. A value the
  // canonical form refuses made the app throw while it rendered — a blank page on every reload.
  it.each([
    ['a number out of range', '1e400'],
    ['a lone surrogate', '"\\ud800"'],
    ['nesting deeper than any questionnaire', `${'['.repeat(100)}${']'.repeat(100)}`],
  ])('names a link damaged that carries %s, never throws', (_label, value) => {
    const text = `{"form":{"definitionHash":"${form.definitionHash}"},"x":${value}}`;
    expect(transferPackageText(text, carried)).toEqual({ ok: false, issue: 'damaged' });
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
    expect(offer.url.startsWith(`${HOSTED}#weitergabe=3&`)).toBe(true);
    expect(offer.url.length - HOSTED.length).toBeLessThanOrEqual(TRANSFER_LINK_MAX_LENGTH);
  });

  it('offers a link for the complete Sofortmeldung with its drawn signature (compact link, 2026-11-24)', () => {
    const offer = transferOffer(completeSofortmeldung().questionnaire, sofortmeldung, HOSTED);
    expect(offer.kind).toBe('link');
    if (offer.kind !== 'link') return;
    expect(offer.url.length - HOSTED.length).toBeLessThanOrEqual(TRANSFER_LINK_MAX_LENGTH);
  });

  it('offers a sealed questionnaire as a link to pass on, not as a Zwischenstand', () => {
    const offer = transferOffer(employerOnly().questionnaire, sofortmeldung, HOSTED);
    expect(offer).toMatchObject({ kind: 'link', interim: false });
  });

  // Tobias 2026-11-26: „Weitergabe soll auch unversiegelt möglich sein, um z.B. einen Zwischenstand
  // zu speichern“ — before, an open draft offered no link at all.
  it('offers a Zwischenstand while a draft is open, as the interim file does', () => {
    const entered = enterRole(employerOnly(), 'person');
    if (!entered.ok) throw new Error(entered.message);
    const draft = entered.session.questionnaire;
    expect(draft.parts.person?.at(-1)?.status).toBe('draft');
    const offer = transferOffer(draft, sofortmeldung, HOSTED);
    expect(offer).toMatchObject({ kind: 'link', interim: true });
    if (offer.kind !== 'link') return;
    expect(offer.url.length - HOSTED.length).toBeLessThanOrEqual(TRANSFER_LINK_MAX_LENGTH);

    const parsed = parseTransferFragment(offer.url.slice(HOSTED.length));
    if (parsed?.ok !== true || parsed.kind !== 'open') throw new Error('not parsed');
    expect(parsed.questionnaireText).toBe(canonicalize(draft));
    const carriedForm = (hash: string) =>
      hash === sofortmeldung.definitionHash ? sofortmeldung.definition : undefined;
    const opened = transferPackageText(parsed.questionnaireText, carriedForm);
    if (!opened.ok) throw new Error(opened.issue);
    const decoded = decodePackage(JSON.parse(opened.text), registryOf([sofortmeldung]));
    if (!decoded.ok) throw new Error(JSON.stringify(decoded.issues));
    expect(decoded.questionnaire).toEqual(draft);
  });

  it('keeps a protected Zwischenstand the same text as an open one', () => {
    const entered = enterRole(employerOnly(), 'person');
    if (!entered.ok) throw new Error(entered.message);
    const draft = entered.session.questionnaire;
    const unlocked = unlockedText(transferPlaintext(draft));
    expect(unlocked).toEqual({ ok: true, questionnaireText: canonicalize(draft) });
  });

  it('says a Zwischenstand too long for a link goes into the interim file', () => {
    expect(TRANSFER_LINK_INTERIM_TOO_LONG).toContain('Zwischenstand speichern');
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
