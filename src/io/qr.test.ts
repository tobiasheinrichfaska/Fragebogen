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
