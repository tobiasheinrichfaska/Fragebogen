// A link passed on with a password (Tobias 2026-11-06), with the real Web Crypto of Node: the
// questionnaire comes back only with the right password, each link is encrypted afresh, and
// nothing of the answers can be read from it. Fictitious data.
import { inflateSync, strFromU8 } from 'fflate';
import { decodePackage } from '../../src/logic/dataPackage';
import { compressPackage, fromBase64Url } from '../../src/logic/dataPages';
import { canonicalize } from '../../src/logic/jcs';
import { passwordKeyText } from '../../src/logic/passwords';
import {
  parseTransferFragment,
  TRANSFER_LINK_MAX_LENGTH,
  TRANSFER_LOCK,
  transferFragment,
  transferPackageText,
  type LockedTransfer,
} from '../../src/logic/transferLink';
import { lockAvailable, lockTransfer, unlockTransfer } from '../../src/io/transferLock';
import { newPassword } from '../../src/io/environment';
import { employerOnly, sofortmeldung } from '../support/sofortmeldungSession';
import { registryOf } from '../../src/logic/formRegistry';

const PASSWORD = 'k7qm-2xrp-9fha';
const questionnaire = employerOnly().questionnaire;

async function lockedLink(
  password = PASSWORD,
): Promise<{ fragment: string; locked: LockedTransfer }> {
  const made = await lockTransfer(questionnaire, password);
  if (!made.ok) throw new Error(`${made.issue} ${made.length}`);
  const parsed = parseTransferFragment(made.fragment);
  if (parsed?.ok !== true || parsed.kind !== 'locked') throw new Error('not locked');
  return { fragment: made.fragment, locked: parsed.locked };
}

// PBKDF2 with 600,000 rounds, several times per test: seconds each under load (2026-11-07 timed out).
describe('lockTransfer / unlockTransfer', { timeout: 60_000 }, () => {
  it('is available where Web Crypto is', () => {
    expect(lockAvailable()).toBe(true);
  });

  it('gives the questionnaire back with the password, verified like a file', async () => {
    const { locked } = await lockedLink();
    const unlocked = await unlockTransfer(locked, PASSWORD);
    expect(unlocked).toEqual({ ok: true, questionnaireText: canonicalize(questionnaire) });
    if (!unlocked.ok) return;
    const opened = transferPackageText(unlocked.questionnaireText, (hash) =>
      hash === sofortmeldung.definitionHash ? sofortmeldung.definition : undefined,
    );
    if (!opened.ok) throw new Error(opened.issue);
    const decoded = decodePackage(JSON.parse(opened.text), registryOf([sofortmeldung]));
    expect(decoded.ok).toBe(true);
  });

  it('opens a protected link of the earlier, full version 2 (same cipher)', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(TRANSFER_LOCK.saltBytes));
    const iv = crypto.getRandomValues(new Uint8Array(TRANSFER_LOCK.ivBytes));
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passwordKeyText(PASSWORD)),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: TRANSFER_LOCK.iterations },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );
    const full = compressPackage(canonicalize(questionnaire)).slice();
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          additionalData: new TextEncoder().encode(TRANSFER_LOCK.additionalData),
          tagLength: TRANSFER_LOCK.tagBytes * 8,
        },
        key,
        full,
      ),
    );
    expect(await unlockTransfer({ salt, iv, ciphertext }, PASSWORD)).toEqual({
      ok: true,
      questionnaireText: canonicalize(questionnaire),
    });
  });

  it('refuses a wrong password, also one that differs in a single character', async () => {
    const { locked } = await lockedLink();
    for (const wrong of ['k7qm-2xrp-9fhb', 'falsch', '']) {
      expect(await unlockTransfer(locked, wrong)).toEqual({ ok: false, issue: 'wrongPassword' });
    }
  });

  it('opens with the password typed in capitals, with spaces or without hyphens', async () => {
    const { locked } = await lockedLink();
    for (const typed of ['K7QM-2XRP-9FHA', 'k7qm 2xrp 9fha', 'k7qm2xrp9fha']) {
      expect((await unlockTransfer(locked, typed)).ok).toBe(true);
    }
  });

  it('refuses ciphertext changed after the digest was made new', async () => {
    const { locked } = await lockedLink();
    const changed = locked.ciphertext.slice();
    changed[5] = (changed[5] ?? 0) ^ 1;
    expect(await unlockTransfer({ ...locked, ciphertext: changed }, PASSWORD)).toEqual({
      ok: false,
      issue: 'wrongPassword',
    });
  });

  it('encrypts each link afresh: other salt, other nonce, other text', async () => {
    const first = await lockedLink();
    const second = await lockedLink();
    expect(second.fragment).not.toBe(first.fragment);
    expect(second.locked.salt).not.toEqual(first.locked.salt);
    expect(second.locked.iv).not.toEqual(first.locked.iv);
  });

  it('shows nothing of the answers, unlike the open link, which only deflates them', async () => {
    const { fragment } = await lockedLink();
    const data = new URLSearchParams(fragment.slice(1)).get('daten') ?? '';
    const bytes = fromBase64Url(data);
    if (!bytes) throw new Error('no bytes');
    const asText = new TextDecoder('latin1').decode(bytes);
    for (const answer of [questionnaire.questionnaireId, 'Beispiel']) {
      expect(asText).not.toContain(answer);
    }
    expect(fragment).toContain('weitergabe=4');
    // The open link: anyone who has it can read the answers back.
    const open = transferFragment(questionnaire);
    if (!open.ok) throw new Error(open.issue);
    const openData = fromBase64Url(new URLSearchParams(open.fragment.slice(1)).get('daten') ?? '');
    if (!openData) throw new Error('no open bytes');
    const readable = strFromU8(inflateSync(openData));
    expect(readable).toContain(questionnaire.questionnaireId);
    expect(readable).toContain('Beispiel');
  });

  it('still fits in a link: about 60 characters more than the open one', async () => {
    const open = transferFragment(questionnaire);
    if (!open.ok) throw new Error(open.issue);
    const { fragment } = await lockedLink();
    expect(fragment.length).toBeLessThanOrEqual(TRANSFER_LINK_MAX_LENGTH);
    expect(fragment.length - open.fragment.length).toBeLessThan(80);
  });

  it('proposes a fresh password each time', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => newPassword()));
    expect(passwords.size).toBe(20);
    for (const password of passwords)
      expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  });
});
