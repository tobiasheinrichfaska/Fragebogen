import { deliveryFor } from './delivery';

describe('deliveryFor', () => {
  it('on a phone or tablet that can share: no download at once, "Teilen" and "Speichern"', () => {
    expect(deliveryFor({ canShare: true, touchFirst: true })).toEqual({
      download: false,
      share: true,
      save: true,
    });
  });

  it('on a computer that can share: downloads as before and adds "Teilen"', () => {
    expect(deliveryFor({ canShare: true, touchFirst: false })).toEqual({
      download: true,
      share: true,
      save: false,
    });
  });

  it.each([true, false])('without sharing it always downloads (touch first: %s)', (touchFirst) => {
    expect(deliveryFor({ canShare: false, touchFirst })).toEqual({
      download: true,
      share: false,
      save: false,
    });
  });

  it('every delivery gets the file to the person somehow', () => {
    for (const canShare of [true, false]) {
      for (const touchFirst of [true, false]) {
        const d = deliveryFor({ canShare, touchFirst });
        expect(d.download || d.save, `${canShare} ${touchFirst}`).toBe(true);
      }
    }
  });
});
