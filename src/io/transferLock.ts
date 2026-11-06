// Protecting a link passed on by a password (Tobias 2026-11-06): Web Crypto derives the key and
// encrypts, so the cipher is the browser's own; parameters and the fragment format live in
// logic/transferLink.ts. The password is never stored — neither in the questionnaire nor in the
// browser memory.
import type { Questionnaire } from '../logic/model';
import {
  lockedTransferFragment,
  passwordKeyText,
  TRANSFER_LOCK,
  TRANSFER_PASSWORD_LENGTH,
  transferPassword,
  transferPlaintext,
  unlockedText,
  type LockedTransfer,
  type TransferLinkResult,
} from '../logic/transferLink';

const encoder = new TextEncoder();

/** Web Crypto is there only in a secure context (https, localhost, a file on this computer). */
export function lockAvailable(): boolean {
  return (
    typeof globalThis.crypto?.subtle?.deriveKey === 'function' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  );
}

export function newTransferPassword(): string {
  return transferPassword(crypto.getRandomValues(new Uint8Array(TRANSFER_PASSWORD_LENGTH)));
}

async function keyFor(password: string, salt: Uint8Array<ArrayBuffer>, usage: KeyUsage) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passwordKeyText(password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: TRANSFER_LOCK.iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

const cipherOf = (iv: Uint8Array<ArrayBuffer>) => ({
  name: 'AES-GCM',
  iv,
  additionalData: encoder.encode(TRANSFER_LOCK.additionalData),
  tagLength: TRANSFER_LOCK.tagBytes * 8,
});

/** The fragment of a link that opens only with the password; a fresh salt and nonce each time. */
export async function lockTransfer(
  questionnaire: Questionnaire,
  password: string,
): Promise<TransferLinkResult> {
  const salt = crypto.getRandomValues(new Uint8Array(TRANSFER_LOCK.saltBytes));
  const iv = crypto.getRandomValues(new Uint8Array(TRANSFER_LOCK.ivBytes));
  const key = await keyFor(password, salt, 'encrypt');
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(cipherOf(iv), key, transferPlaintext(questionnaire)),
  );
  return lockedTransferFragment({ salt, iv, ciphertext });
}

/**
 * The questionnaire text of a protected link. A wrong password and changed bytes look the same to
 * AES-GCM; a cut-off link is caught before by its digest (`parseTransferFragment`).
 */
export async function unlockTransfer(
  locked: LockedTransfer,
  password: string,
): Promise<
  { ok: true; questionnaireText: string } | { ok: false; issue: 'wrongPassword' | 'damaged' }
> {
  const key = await keyFor(password, locked.salt, 'decrypt');
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(cipherOf(locked.iv), key, locked.ciphertext);
  } catch {
    return { ok: false, issue: 'wrongPassword' };
  }
  return unlockedText(new Uint8Array(plaintext));
}
