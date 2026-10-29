import { compressPackage, encodeDataLines } from './dataPages';
import { QR_CHUNK_BYTES, QR_MESSAGES, assembleQrPayloads, qrPayloads } from './qrParts';

const ID = '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c';
// Incompressible enough to need several parts.
const TEXT = Array.from({ length: 400 }, (_, i) => `${i}:${(i * 7919) % 10007}`).join(',');

function payloads(text = TEXT): Uint8Array[] {
  const block = encodeDataLines(text, ID);
  return qrPayloads(block.compressed, ID, block.sha256);
}

describe('qrPayloads / assembleQrPayloads', () => {
  it('splits into numbered parts of at most the chunk size', () => {
    const parts = payloads();
    expect(parts.length).toBe(Math.ceil(compressPackage(TEXT).length / QR_CHUNK_BYTES));
    expect(parts.length).toBeGreaterThan(1);
    const header = new TextDecoder().decode(parts[0]?.subarray(0, 80)).split('\n')[0];
    expect(header).toMatch(new RegExp(`^FBQ1 ${ID} 1/${parts.length} [0-9a-f]{16}$`));
  });

  it('reassembles in any order, with duplicates and foreign codes', () => {
    const parts = payloads();
    const scanned = [...parts].reverse();
    scanned.push(parts[0] ?? new Uint8Array(), new TextEncoder().encode('https://example.org'));
    expect(assembleQrPayloads(scanned)).toEqual({
      ok: true,
      text: TEXT,
      questionnaireId: ID,
      total: parts.length,
      ignored: 1,
    });
  });

  it('names the missing parts', () => {
    const parts = payloads();
    expect(assembleQrPayloads(parts.slice(1))).toEqual({
      ok: false,
      issue: 'missing',
      detail: [`Teil 1 von ${parts.length}`],
      found: parts.length - 1,
      total: parts.length,
    });
  });

  it('refuses codes of two different questionnaires or versions', () => {
    const other = payloads(`${TEXT},anders`);
    expect(assembleQrPayloads([...payloads(), ...other])).toMatchObject({
      ok: false,
      issue: 'mixed',
    });
  });

  it('refuses two different codes with the same number', () => {
    const [first, ...rest] = payloads();
    if (!first) throw new Error('no part');
    const forged = first.slice();
    forged[forged.length - 1] = (forged[forged.length - 1] ?? 0) ^ 0xff;
    expect(assembleQrPayloads([first, forged, ...rest])).toMatchObject({
      ok: false,
      issue: 'conflict',
      detail: ['Teil 1'],
    });
  });

  it('detects a changed chunk through the digest or the compression', () => {
    const parts = payloads();
    const changed = parts.map((part, i) => {
      if (i !== 0) return part;
      const copy = part.slice();
      copy[copy.length - 5] = (copy[copy.length - 5] ?? 0) ^ 0x01;
      return copy;
    });
    const result = assembleQrPayloads(changed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['corrupt', 'digestMismatch']).toContain(result.issue);
  });

  it('reports no codes when none is ours', () => {
    expect(assembleQrPayloads([new TextEncoder().encode('hallo')])).toMatchObject({
      ok: false,
      issue: 'noCodes',
    });
  });

  it('has a German message for every issue', () => {
    for (const message of Object.values(QR_MESSAGES)) expect(message).toMatch(/\.$/);
  });
});
