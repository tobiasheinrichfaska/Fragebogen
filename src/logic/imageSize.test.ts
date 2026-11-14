// The size of an image from its header, before anything decodes it (audit 2026-11-14, X5). Headers
// are written by hand here; tests/io/imageSize.test.ts reads files of a real encoder.
import { imageSize, imageTooLarge, imageTooLargeMessage, MAX_IMAGE_PIXELS } from './imageSize';

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const u16be = (n: number) => [(n >>> 8) & 0xff, n & 0xff];
const u16le = (n: number) => [n & 0xff, (n >>> 8) & 0xff];
const u32be = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u32le = (n: number) => [...u32be(n)].reverse();
const u24le = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const bytes = (...parts: number[][]) => Uint8Array.from(parts.flat());

const png = (w: number, h: number) =>
  bytes(
    [0x89, ...ascii('PNG\r\n\x1a\n')],
    u32be(13),
    ascii('IHDR'),
    u32be(w),
    u32be(h),
    [8, 6, 0, 0, 0],
  );
const gif = (w: number, h: number) => bytes(ascii('GIF89a'), u16le(w), u16le(h), [0, 0, 0]);
const bmp = (w: number, h: number) =>
  bytes(ascii('BM'), u32le(0), u32le(0), u32le(54), u32le(40), u32le(w), u32le(h), u16le(1));
const bmpCore = (w: number, h: number) =>
  bytes(ascii('BM'), u32le(0), u32le(0), u32le(26), u32le(12), u16le(w), u16le(h), u16le(1));
const webpX = (w: number, h: number) =>
  bytes(
    ascii('RIFF'),
    u32le(30),
    ascii('WEBPVP8X'),
    u32le(10),
    [0, 0, 0, 0],
    u24le(w - 1),
    u24le(h - 1),
  );
const webpL = (w: number, h: number) => {
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14);
  return bytes(ascii('RIFF'), u32le(30), ascii('WEBPVP8L'), u32le(10), [0x2f], u32le(bits));
};
const webpLossy = (w: number, h: number) =>
  bytes(
    ascii('RIFF'),
    u32le(30),
    ascii('WEBPVP8 '),
    u32le(10),
    [0, 0, 0, 0x9d, 0x01, 0x2a],
    u16le(w),
    u16le(h),
  );
/** A JPEG with an APP1 segment (as a camera writes, thumbnail inside) before the frame header. */
const jpeg = (w: number, h: number, frame = 0xc0) =>
  bytes(
    [0xff, 0xd8],
    [0xff, 0xe1],
    u16be(2 + 12),
    ascii('Exif\0\0'),
    [0xff, 0xc0, 0, 0, 0, 0], // looks like a frame header but lies inside APP1
    [0xff, 0xff, 0xff, frame],
    u16be(17),
    [8],
    u16be(h),
    u16be(w),
    [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
  );
const heic = (...pictures: [number, number][]) =>
  bytes(
    u32be(24),
    ascii('ftypheic'),
    u32be(0),
    ascii('mif1heic'),
    ...pictures.map(([w, h]) => [
      ...u32be(20),
      ...ascii('ispe'),
      ...u32be(0),
      ...u32be(w),
      ...u32be(h),
    ]),
  );

describe('imageSize', () => {
  it.each<[string, Uint8Array, number, number]>([
    ['PNG', png(1234, 567), 1234, 567],
    ['GIF', gif(640, 480), 640, 480],
    ['BMP', bmp(800, -600), 800, 600],
    ['BMP (OS/2 header)', bmpCore(320, 200), 320, 200],
    ['WebP (extended)', webpX(4000, 3000), 4000, 3000],
    ['WebP (lossless)', webpL(1600, 900), 1600, 900],
    ['WebP (lossy)', webpLossy(1024, 768), 1024, 768],
    ['JPEG (baseline, after APP1)', jpeg(4032, 3024), 4032, 3024],
    ['JPEG (progressive)', jpeg(8064, 6048, 0xc2), 8064, 6048],
    ['HEIC (tiles and the whole picture)', heic([512, 512], [8064, 6048], [320, 240]), 8064, 6048],
  ])('reads %s', (_label, data, width, height) => {
    expect(imageSize(data)).toEqual({ width, height });
  });

  it.each<[string, Uint8Array]>([
    ['an unknown format', bytes(ascii('hello world, no image'))],
    ['a cut-off PNG', png(10, 10).subarray(0, 20)],
    ['a JPEG ending before its frame header', jpeg(10, 10).subarray(0, 26)],
    ['a JPEG without a frame header', bytes([0xff, 0xd8, 0xff, 0xda, 0, 2])],
    ['a PNG of zero width', png(0, 10)],
    ['nothing', new Uint8Array()],
  ])('gives no size for %s', (_label, data) => {
    expect(imageSize(data)).toBeUndefined();
  });

  it('reads a header inside a larger buffer', () => {
    const inner = png(300, 200);
    const outer = new Uint8Array(inner.length + 8);
    outer.set(inner, 8);
    expect(imageSize(outer.subarray(8))).toEqual({ width: 300, height: 200 });
  });
});

describe('imageTooLarge', () => {
  it('lets photos of today’s phones through (48 and 64 megapixels)', () => {
    expect(imageTooLarge(jpeg(8064, 6048))).toBeUndefined();
    expect(imageTooLarge(heic([9248, 6936]))).toBeUndefined();
  });

  it('refuses a small file that claims a huge picture, in every format', () => {
    for (const data of [
      png(30000, 30000),
      jpeg(20000, 20000),
      webpX(16383, 16383),
      gif(65535, 65535),
      bmp(40000, 40000),
      heic([12000, 9000]),
    ]) {
      expect(imageTooLarge(data), String(imageSize(data)?.width)).toBeDefined();
    }
    expect(png(30000, 30000).length).toBeLessThan(40);
  });

  it('refuses just above the limit, not at it', () => {
    expect(imageTooLarge(png(10000, MAX_IMAGE_PIXELS / 10000))).toBeUndefined();
    expect(imageTooLarge(png(10000, MAX_IMAGE_PIXELS / 10000 + 1))).toBeDefined();
  });

  it('leaves an unknown format to the browser', () => {
    expect(imageTooLarge(bytes(ascii('II*\0')))).toBeUndefined();
  });

  it('says the size and what to do instead', () => {
    expect(imageTooLargeMessage({ width: 30000, height: 30000 })).toBe(
      'Das Bild ist mit 30.000 × 30.000 Pixeln zu groß zum Lesen (höchstens 100 Megapixel). Bitte ein Foto in normaler Auflösung oder einen Scan mit höchstens 600 dpi verwenden.',
    );
  });
});
