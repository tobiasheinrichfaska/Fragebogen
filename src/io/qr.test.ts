import { beispielForm, beispielRegistry, twoRoles } from '../../tests/support/sample';
import { buildPackage, decodePackage, packageText } from '../logic/dataPackage';
import { encodeDataLines } from '../logic/dataPages';
import { canonicalize } from '../logic/jcs';
import { assembleQrPayloads, qrPayloads } from '../logic/qrParts';
import { QR_GAP_MODULES, qrMatrix, rasterize, readQrCodes, type RgbaImage } from './qr';

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

// MT-35 on the Kanzlei PC (2026-11-14): of twelve photographed codes one full-size code was not
// read. A photo has about four pixels per module, and where the module edges fall between pixels
// jsQR sometimes found nothing, in every way a cell was tried. Drawn here with exact area coverage
// (the same on every computer), so the cases are fixed: each was missed before a cell was also
// tried enlarged by half.
describe('a photographed code with about four pixels per module', () => {
  /** Bytes from a fixed seed (xorshift32). */
  function seeded(seed: number, length: number): Uint8Array {
    let x = (seed * 2654435761) >>> 0 || 1;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      bytes[i] = x & 0xff;
    }
    return bytes;
  }

  /** One code with `size` px per module, shifted by (dx, dy) px; grey where a pixel is cut. */
  function photographed(matrix: boolean[][], size: number, dx: number, dy: number): RgbaImage {
    const gap = QR_GAP_MODULES * size;
    const side = Math.ceil(matrix.length * size + 2 * gap + 2);
    const cover = new Float64Array(side * side);
    matrix.forEach((row, r) =>
      row.forEach((isDark, c) => {
        if (!isDark) return;
        const [x0, y0] = [gap + dx + c * size, gap + dy + r * size];
        const [x1, y1] = [x0 + size, y0 + size];
        for (let py = Math.floor(y0); py < Math.ceil(y1); py++) {
          const h = Math.min(py + 1, y1) - Math.max(py, y0);
          for (let px = Math.floor(x0); px < Math.ceil(x1); px++) {
            const w = Math.min(px + 1, x1) - Math.max(px, x0);
            cover[py * side + px] = (cover[py * side + px] ?? 0) + w * h;
          }
        }
      }),
    );
    const data = new Uint8ClampedArray(side * side * 4);
    cover.forEach((part, i) => {
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = Math.round(255 * (1 - Math.min(1, part)));
      data[i * 4 + 3] = 255;
    });
    return { data, width: side, height: side };
  }

  const payload = (seed: number) =>
    qrPayloads(seeded(seed, 1400), 'a'.repeat(32), 'b'.repeat(64))[0] ?? new Uint8Array();

  it.each([
    [1, 3.9, 0.5, 0.5],
    [1, 4.06, 0, 0],
    [1, 3.5, 0.25, 0.25],
    [2, 3.5, 0, 0],
    [2, 3.62, 0.25, 0],
    [2, 3.62, 0.75, 0],
  ])('reads seed %i at %f px per module, shifted by (%f, %f)', (seed, size, dx, dy) => {
    const code = payload(seed);
    expect(readQrCodes(photographed(qrMatrix(code), size, dx, dy))).toEqual([code]);
  });

  it('reads the same code at every phase from 3.5 to 4.5 px per module', () => {
    const code = payload(1);
    const matrix = qrMatrix(code);
    const missed: string[] = [];
    for (let step = 0; step <= 25; step++) {
      const size = 3.5 + step * 0.04;
      for (const shift of [0, 0.5]) {
        if (readQrCodes(photographed(matrix, size, shift, shift)).length === 0) {
          missed.push(`${size.toFixed(2)}/${shift}`);
        }
      }
    }
    expect(missed).toEqual([]);
  }, 60_000);
});
