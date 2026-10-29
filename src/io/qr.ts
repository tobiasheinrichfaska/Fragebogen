// QR codes: module matrix for drawing (qrcode-generator, MIT) and reading codes from an image
// (jsQR, Apache-2.0). jsQR decodes ONE code per image and finds none at all when several are
// visible (probed 2026-10-30). The page layout therefore keeps wide white gaps between codes, and
// reading first cuts the image along white rows and columns into cells, each decoded on its own;
// the whole image is tried last (a photo of a single code).
import jsQR from 'jsqr';
import qrcode from 'qrcode-generator';

/** Error correction M: about 15 % of a code may be damaged (fold, stain) and it still reads. */
export const QR_ERROR_CORRECTION = 'M';
/** Light modules around a code that scanners need (ISO/IEC 18004). */
export const QR_QUIET_ZONE = 4;
/** White gap between printed codes, in modules: wide enough to cut the image apart. */
export const QR_GAP_MODULES = 12;
const MAX_CELLS = 60;

/** true = dark module; rows of the square matrix without quiet zone. */
export function qrMatrix(payload: Uint8Array): boolean[][] {
  const code = qrcode(0, QR_ERROR_CORRECTION);
  // Byte mode maps every char code to one byte (char & 0xff), so a binary string keeps the bytes.
  code.addData(String.fromCharCode(...payload), 'Byte');
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => code.isDark(row, col)),
  );
}

export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** All distinct QR payloads in an image (RGBA). */
export function readQrCodes(image: RgbaImage): Uint8Array[] {
  const dark = darkMask(image);
  const found: Uint8Array[] = [];
  const add = (payload: Uint8Array) => {
    if (!found.some((known) => sameBytes(known, payload))) found.push(payload);
  };
  for (const cell of cells(dark, image.width, image.height).slice(0, MAX_CELLS)) {
    const code = decode(image, cell);
    if (code) add(code);
  }
  if (found.length === 0) {
    const code = decode(image, { left: 0, top: 0, width: image.width, height: image.height });
    if (code) add(code);
  }
  return found;
}

function decode(image: RgbaImage, box: Box): Uint8Array | undefined {
  const crop = new Uint8ClampedArray(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) {
    const from = ((box.top + y) * image.width + box.left) * 4;
    crop.set(image.data.subarray(from, from + box.width * 4), y * box.width * 4);
  }
  const code = jsQR(crop, box.width, box.height, { inversionAttempts: 'dontInvert' });
  return code ? Uint8Array.from(code.binaryData) : undefined;
}

/** 1 for a dark pixel (luminance below the image's mid-grey), 0 otherwise. */
function darkMask(image: RgbaImage): Uint8Array {
  const { data, width, height } = image;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) {
    const luminance =
      0.299 * (data[i * 4] ?? 255) +
      0.587 * (data[i * 4 + 1] ?? 255) +
      0.114 * (data[i * 4 + 2] ?? 255);
    mask[i] = luminance < 128 ? 1 : 0;
  }
  return mask;
}

/** Content bands separated by white runs at least `minGap` long (projection profile). */
function bands(profile: readonly number[], minGap: number): [number, number][] {
  const result: [number, number][] = [];
  let start = -1;
  let white = 0;
  profile.forEach((count, i) => {
    if (count > 0) {
      if (start < 0) start = i;
      white = 0;
    } else if (start >= 0) {
      white++;
      if (white >= minGap) {
        result.push([start, i - white]);
        start = -1;
        white = 0;
      }
    }
  });
  if (start >= 0) result.push([start, profile.length - 1 - white]);
  return result;
}

/** Cuts the image into cells along white rows, then white columns within each row band. */
function cells(dark: Uint8Array, width: number, height: number): Box[] {
  const minGap = Math.max(4, Math.round(Math.min(width, height) * 0.012));
  const rows = Array.from({ length: height }, (_, y) => {
    let count = 0;
    for (let x = 0; x < width; x++) count += dark[y * width + x] ?? 0;
    return count;
  });
  const boxes: Box[] = [];
  for (const [top, bottom] of bands(rows, minGap)) {
    const columns = Array.from({ length: width }, (_, x) => {
      let count = 0;
      for (let y = top; y <= bottom; y++) count += dark[y * width + x] ?? 0;
      return count;
    });
    for (const [left, right] of bands(columns, minGap)) {
      const w = right - left + 1;
      const h = bottom - top + 1;
      // Codes are roughly square and not tiny; text lines and specks are skipped.
      if (w < 21 || h < 21 || w > h * 1.6 || h > w * 1.6) continue;
      const margin = Math.round(Math.max(w, h) * 0.1);
      const x0 = Math.max(0, left - margin);
      const y0 = Math.max(0, top - margin);
      boxes.push({
        left: x0,
        top: y0,
        width: Math.min(width, right + margin + 1) - x0,
        height: Math.min(height, bottom + margin + 1) - y0,
      });
    }
  }
  return boxes;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

/** Renders matrices onto one white RGBA image (tests, previews) with the printed gaps. */
export function rasterize(
  matrices: readonly boolean[][][],
  scale: number,
  columns = matrices.length,
): RgbaImage {
  const size = Math.max(...matrices.map((m) => m.length));
  const cell = size + QR_GAP_MODULES;
  const rows = Math.ceil(matrices.length / columns);
  const width = (columns * cell + QR_GAP_MODULES) * scale;
  const height = (rows * cell + QR_GAP_MODULES) * scale;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  matrices.forEach((matrix, i) => {
    const originX = ((i % columns) * cell + QR_GAP_MODULES) * scale;
    const originY = (Math.floor(i / columns) * cell + QR_GAP_MODULES) * scale;
    matrix.forEach((row, r) =>
      row.forEach((isDark, c) => {
        if (!isDark) return;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const at = ((originY + r * scale + dy) * width + originX + c * scale + dx) * 4;
            data[at] = 0;
            data[at + 1] = 0;
            data[at + 2] = 0;
          }
        }
      }),
    );
  });
  return { data, width, height };
}
