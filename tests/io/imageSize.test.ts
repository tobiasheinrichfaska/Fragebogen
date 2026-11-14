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
