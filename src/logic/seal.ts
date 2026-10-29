// Building blocks of a seal: salted per-field digests, the content hash of a payload and the
// comparison of stored data against the digests in a payload.
import { canonicalHash, sha256Hex } from './hash';
import type { FieldId, FieldValue, SealPayload, Sha256Hex } from './model';

export const SEAL_SCHEMA = 'fragebogen.siegel/1';
/** Hex characters kept of a field digest: 16 = 64 bit. */
export const FIELD_HASH_LENGTH = 16;
export const FIELD_HASH_PATTERN = /^[0-9a-f]{16}$/;
export const NONCE_PATTERN = /^[0-9a-f]{32}$/;

export function fieldHash(nonce: string, fieldId: FieldId, value: FieldValue): string {
  return canonicalHash({ f: fieldId, n: nonce, v: value }).slice(0, FIELD_HASH_LENGTH);
}

export function fieldHashesOf(
  nonce: string,
  data: Readonly<Record<FieldId, FieldValue>>,
): Record<FieldId, string> {
  return Object.fromEntries(
    Object.entries(data).map(([fieldId, value]) => [fieldId, fieldHash(nonce, fieldId, value)]),
  );
}

/** SHA-256 over JCS(payload). It is stored next to the payload, never inside it. */
export function contentHashOf(payload: SealPayload): Sha256Hex {
  return canonicalHash(payload);
}

export function strokesHashOf(encodedStrokes: string): Sha256Hex {
  return sha256Hex(encodedStrokes);
}

export interface FieldDiff {
  /** Present in both, but the value no longer matches its digest. */
  changed: FieldId[];
  /** Sealed, but no longer in the data. */
  missing: FieldId[];
  /** In the data, but not sealed. */
  extra: FieldId[];
}

export function diffFieldHashes(
  payload: SealPayload,
  data: Readonly<Record<FieldId, FieldValue>>,
): FieldDiff {
  const sealed = payload.fieldHashes;
  const diff: FieldDiff = { changed: [], missing: [], extra: [] };
  for (const [fieldId, digest] of Object.entries(sealed)) {
    if (!Object.hasOwn(data, fieldId)) diff.missing.push(fieldId);
    else if (fieldHash(payload.nonce, fieldId, data[fieldId] ?? null) !== digest) {
      diff.changed.push(fieldId);
    }
  }
  for (const fieldId of Object.keys(data)) {
    if (!Object.hasOwn(sealed, fieldId)) diff.extra.push(fieldId);
  }
  return diff;
}

export function isEmptyDiff(diff: FieldDiff): boolean {
  return diff.changed.length + diff.missing.length + diff.extra.length === 0;
}
