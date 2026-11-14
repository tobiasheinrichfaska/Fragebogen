// The header reader against files a real encoder wrote (@napi-rs/canvas, the canvas pdf.js uses in
// Node): PNG, JPEG, WebP, AVIF.
import { createCanvas } from '@napi-rs/canvas';
import { imageSize } from '../../src/logic/imageSize';

describe('imageSize with real files', () => {
  it.each(['png', 'jpeg', 'webp', 'avif'] as const)('reads a %s of 123 × 45 pixels', (format) => {
    const canvas = createCanvas(123, 45);
    const context = canvas.getContext('2d');
    context.fillStyle = '#336699';
    context.fillRect(0, 0, 123, 45);
    const file =
      format === 'png'
        ? canvas.encodeSync('png')
        : format === 'avif'
          ? canvas.encodeSync('avif')
          : canvas.encodeSync(format);
    expect(imageSize(new Uint8Array(file))).toEqual({ width: 123, height: 45 });
  });
});

// Review of 7ed45b2: a real AVIF with "ispe" in trailing metadata text was refused as too large.
describe('a real AVIF with metadata text', () => {
  it('keeps its own size', () => {
    const canvas = createCanvas(640, 480);
    const file = new Uint8Array(canvas.encodeSync('avif'));
    const text = new TextEncoder().encode('<dc:title>Whispering pines at dusk</dc:title>');
    const free = new Uint8Array(8 + text.length);
    new DataView(free.buffer).setUint32(0, free.length);
    free.set(new TextEncoder().encode('free'), 4);
    free.set(text, 8);
    const withText = new Uint8Array(file.length + free.length);
    withText.set(file);
    withText.set(free, file.length);
    expect(imageSize(withText)).toEqual({ width: 640, height: 480 });
  });
});
