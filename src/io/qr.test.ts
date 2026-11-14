import { beispielForm, beispielRegistry, twoRoles } from '../../tests/support/sample';
import { buildPackage, decodePackage, packageText } from '../logic/dataPackage';
import { encodeDataLines } from '../logic/dataPages';
import { canonicalize } from '../logic/jcs';
import { assembleQrPayloads, qrPayloads } from '../logic/qrParts';
import { qrMatrix, rasterize, readQrCodes } from './qr';

describe('QR round trip', () => {
  it('reads back a binary payload exactly', () => {
    const payload = Uint8Array.from({ length: 300 }, (_, i) => (i * 31) % 256);
    expect(readQrCodes(rasterize([qrMatrix(payload)], 3))).toEqual([payload]);
  });

  it('finds every code on one "page"', () => {
    const payloads = [1, 2, 3, 4].map((n) =>
      Uint8Array.from({ length: 120 + n }, (_, i) => (i + n) % 256),
    );
    const found = readQrCodes(rasterize(payloads.map(qrMatrix), 3, 2));
    expect(found.map((p) => p.length).sort()).toEqual([121, 122, 123, 124]);
  });

  it('carries a whole questionnaire with its form from "paper" back into the app', () => {
    const q = twoRoles();
    const text = packageText(buildPackage(q, beispielForm()));
    const block = encodeDataLines(text, q.questionnaireId);
    const page = rasterize(
      qrPayloads(block.compressed, q.questionnaireId, block.sha256).map(qrMatrix),
      3,
      3,
    );
    const assembled = assembleQrPayloads(readQrCodes(page));
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    const result = decodePackage(JSON.parse(assembled.text), beispielRegistry());
    expect(result.ok && canonicalize(result.questionnaire)).toBe(canonicalize(q));
  });
});

// Audit 2026-11-14: the last code of a PDF is usually smaller (its chunk holds the rest), and next
// to full-size codes its cell had the height of the whole row, so the aspect check dropped it —
// about one scan in five of a PDF with several codes could not be read back.
describe('a short last code next to full-size ones', () => {
  const bytes = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 0xff);
  const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

  it.each([100, 222, 400])('is read like the others (last chunk %i bytes)', (last) => {
    const payloads = qrPayloads(
      bytes(700 + last),
      '3f2b8c1e-5d4a-4b6f-9a1c-2e7d8f9a0b1c',
      'ab'.repeat(32),
    );
    expect(payloads).toHaveLength(2);
    // rasterize lays the codes out like the PDF: one row, top-aligned, grid sized by the largest.
    const found = readQrCodes(rasterize(payloads.map(qrMatrix), 6, 3))
      .map(hex)
      .sort();
    expect(found).toEqual(payloads.map(hex).sort());
  });
});
