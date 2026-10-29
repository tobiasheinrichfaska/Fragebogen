// SHA-256 via @noble/hashes: synchronous (crypto.subtle is async-only) and byte-identical in the
// browser and in Node tests.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { canonicalize, isWellFormed } from './jcs';
import type { Sha256Hex } from './model';

const SHA256_HEX = /^[0-9a-f]{64}$/;

/** Strings are hashed as UTF-8; an unpaired surrogate would be replaced silently, so it throws. */
export function sha256Hex(data: Uint8Array | string): Sha256Hex {
  if (typeof data === 'string' && !isWellFormed(data)) {
    throw new RangeError('String contains an unpaired surrogate');
  }
  return bytesToHex(sha256(typeof data === 'string' ? utf8ToBytes(data) : data));
}

/** SHA-256 over the UTF-8 bytes of JCS(value) — the one way this app hashes structured data. */
export function canonicalHash(value: unknown): Sha256Hex {
  return sha256Hex(canonicalize(value));
}

export function isSha256Hex(value: string): value is Sha256Hex {
  return SHA256_HEX.test(value);
}
