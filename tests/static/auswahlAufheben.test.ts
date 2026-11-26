import { describe, expect, it } from 'vitest';
import { hasChoice } from '../../src/ui/fieldKinds';

describe('hasChoice (Stammdaten-Link: „Auswahl aufheben“)', () => {
  it('counts a single choice as chosen', () => {
    expect(hasChoice(false, 'ja')).toBe(true);
  });
  it('counts nothing and an emptied multiple choice as not chosen', () => {
    expect(hasChoice(false, null)).toBe(false);
    expect(hasChoice(false, [])).toBe(false);
  });
  it('counts a multiple choice with entries as chosen', () => {
    expect(hasChoice(false, ['a'])).toBe(true);
  });
  it('never offers it for text-like fields', () => {
    expect(hasChoice(true, 'x')).toBe(false);
  });
});
