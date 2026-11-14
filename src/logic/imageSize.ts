// The pixel size of a photo or scan, read from the file's header before anything decodes it (audit
// 2026-11-14, X5): the browser decodes an image at full size before it is scaled down, so a small
// file that claims 30,000 × 30,000 pixels needs about 3.6 GB and can take the tab down. Pure: bytes
// in, size out; formats the header does not tell are left to the browser (undefined).

/** Above this the app does not decode an image (photo, scan, image inside a scanned PDF). */
export const MAX_IMAGE_PIXELS = 100_000_000;

export interface ImageSize {
  width: number;
  height: number;
}

/** What the person reads when an image is refused for its size (German). */
export function imageTooLargeMessage(size: ImageSize): string {
  return `Das Bild ist mit ${size.width.toLocaleString('de-DE')} × ${size.height.toLocaleString('de-DE')} Pixeln zu groß zum Lesen (höchstens ${MAX_IMAGE_PIXELS / 1_000_000} Megapixel). Bitte ein Foto in normaler Auflösung oder einen Scan mit höchstens 600 dpi verwenden.`;
}

/** Whether the header names a size above the limit; an unknown format is not refused here. */
export function imageTooLarge(bytes: Uint8Array): ImageSize | undefined {
  const size = imageSize(bytes);
  return size !== undefined && size.width * size.height > MAX_IMAGE_PIXELS ? size : undefined;
}

/** Width and height as the file's header states them: PNG, JPEG, GIF, BMP, WebP, HEIC/AVIF. */
export function imageSize(bytes: Uint8Array): ImageSize | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = (offset: number, text: string) =>
    offset + text.length <= bytes.length &&
    [...text].every((char, i) => bytes[offset + i] === char.charCodeAt(0));
  const fits = (offset: number, length: number) => offset >= 0 && offset + length <= bytes.length;
  const sized = (width: number, height: number) =>
    width > 0 && height > 0 ? { width, height } : undefined;

  if (at(0, '\x89PNG\r\n\x1a\n') && at(12, 'IHDR') && fits(16, 8)) {
    return sized(view.getUint32(16), view.getUint32(20));
  }
  if ((at(0, 'GIF87a') || at(0, 'GIF89a')) && fits(6, 4)) {
    return sized(view.getUint16(6, true), view.getUint16(8, true));
  }
  if (at(0, 'BM') && fits(14, 4)) {
    const header = view.getUint32(14, true);
    if (header === 12 && fits(18, 4)) {
      return sized(view.getUint16(18, true), view.getUint16(20, true));
    }
    if (header >= 40 && fits(18, 8)) {
      return sized(Math.abs(view.getInt32(18, true)), Math.abs(view.getInt32(22, true)));
    }
    return undefined;
  }
  if (at(0, 'RIFF') && at(8, 'WEBP')) return webpSize(bytes, view, at, fits, sized);
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegSize(bytes, view, fits, sized);
  if (at(4, 'ftyp')) return isobmffSize(bytes, view, fits);
  return undefined;
}

type At = (offset: number, text: string) => boolean;
type Fits = (offset: number, length: number) => boolean;
type Sized = (width: number, height: number) => ImageSize | undefined;

function webpSize(
  bytes: Uint8Array,
  view: DataView,
  at: At,
  fits: Fits,
  sized: Sized,
): ImageSize | undefined {
  if (at(12, 'VP8X') && fits(24, 6)) {
    const u24 = (offset: number) =>
      (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
    return sized(u24(24) + 1, u24(27) + 1);
  }
  if (at(12, 'VP8L') && fits(21, 4) && bytes[20] === 0x2f) {
    const bits = view.getUint32(21, true);
    return sized((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
  }
  if (at(12, 'VP8 ') && fits(26, 4)) {
    return sized(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
  }
  return undefined;
}

/** The frame header (SOFn) after the segments before it; undefined once the scan data begins. */
function jpegSize(
  bytes: Uint8Array,
  view: DataView,
  fits: Fits,
  sized: Sized,
): ImageSize | undefined {
  let offset = 2;
  while (fits(offset, 4)) {
    // Bytes between segments are skipped, as decoders do (review of 7ed45b2: one stray byte hid
    // the frame header from this check while Chromium decoded the picture).
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return undefined;
    const length = view.getUint16(offset + 2);
    const frame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (frame) {
      return fits(offset + 5, 4)
        ? sized(view.getUint16(offset + 7), view.getUint16(offset + 5))
        : undefined;
    }
    if (length < 2) return undefined;
    offset += 2 + length;
  }
  return undefined;
}

/**
 * HEIC and AVIF state each picture's size in an `ispe` property (meta → iprp → ipco); a large
 * picture is stored as tiles with one property for the whole, so the largest one counts. The boxes
 * are walked, not searched: the four letters may occur anywhere in picture data or metadata text
 * (review of 7ed45b2: a title in XMP made a 640 × 480 photo "too large").
 */
function isobmffSize(bytes: Uint8Array, view: DataView, fits: Fits): ImageSize | undefined {
  const meta = childBox(bytes, view, fits, 0, bytes.length, 'meta');
  // `meta` is a full box: version and flags come before its children.
  const iprp = meta && childBox(bytes, view, fits, meta.start + 4, meta.end, 'iprp');
  const ipco = iprp && childBox(bytes, view, fits, iprp.start, iprp.end, 'ipco');
  if (!ipco) return undefined;
  let best: ImageSize | undefined;
  for (const box of boxes(bytes, view, fits, ipco.start, ipco.end)) {
    if (box.type !== 'ispe' || !fits(box.start + 4, 8) || box.start + 12 > box.end) continue;
    const width = view.getUint32(box.start + 4);
    const height = view.getUint32(box.start + 8);
    if (width > 0 && height > 0 && width * height > (best ? best.width * best.height : 0)) {
      best = { width, height };
    }
  }
  return best;
}

interface Box {
  type: string;
  /** First byte of the content, after the header. */
  start: number;
  end: number;
}

function childBox(
  bytes: Uint8Array,
  view: DataView,
  fits: Fits,
  start: number,
  end: number,
  type: string,
): Box | undefined {
  for (const box of boxes(bytes, view, fits, start, end)) if (box.type === type) return box;
  return undefined;
}

/** The boxes between start and end; stops at the first one whose size does not fit. */
function* boxes(
  bytes: Uint8Array,
  view: DataView,
  fits: Fits,
  start: number,
  end: number,
): Generator<Box> {
  let offset = start;
  while (offset + 8 <= end && fits(offset, 8)) {
    let size = view.getUint32(offset);
    let header = 8;
    if (size === 1) {
      if (!fits(offset + 8, 8) || view.getUint32(offset + 8) !== 0) return;
      size = view.getUint32(offset + 12);
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) return;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    yield { type, start: offset + header, end: offset + size };
    offset += size;
  }
}
