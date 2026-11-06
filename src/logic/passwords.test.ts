import {
  PASSWORD_ALPHABET,
  passwordKeyText,
  pdfPasswordCandidates,
  proposedPassword,
} from './passwords';

const bytes = (length: number, start: number) =>
  Uint8Array.from({ length }, (_, i) => (start + i) % 256);

describe('proposedPassword', () => {
  it('gives three groups of four unmistakable characters', () => {
    expect(proposedPassword(bytes(12, 0))).toBe('abcd-efgh-ijkm');
    expect(proposedPassword(bytes(12, 24))).toBe('2345-6789-abcd');
    // One character per byte by its low five bits: every byte value is equally likely.
    expect(proposedPassword(Uint8Array.from({ length: 12 }, () => 255))).toBe('9999-9999-9999');
    expect(() => proposedPassword(bytes(11, 0))).toThrow();
  });

  it('draws from 32 characters without l, o, 0 and 1', () => {
    expect(PASSWORD_ALPHABET).toHaveLength(32);
    expect(new Set(PASSWORD_ALPHABET).size).toBe(32);
    expect(PASSWORD_ALPHABET).not.toMatch(/[lo01A-Z]/);
  });
});

describe('passwordKeyText', () => {
  it('ignores case, spaces and hyphens of a typed password', () => {
    for (const typed of ['k7qm-2xrp-9fha', 'K7qm-2xrp-9fha', ' k7qm 2xrp 9fha ', 'k7qm2xrp9fha']) {
      expect(passwordKeyText(typed)).toBe('k7qm2xrp9fha');
    }
    expect(passwordKeyText(' - ')).toBe('');
  });
});

describe('pdfPasswordCandidates', () => {
  it('finds the exact form of a proposed password however it was typed', () => {
    for (const typed of ['K7QM2XRP9FHA', ' k7qm 2xrp 9fha ', 'k7qm-2xrp-9fha']) {
      expect(pdfPasswordCandidates(typed)).toContain('k7qm-2xrp-9fha');
    }
  });

  it('tries a password the app did not propose as typed and trimmed only', () => {
    expect(pdfPasswordCandidates(' Sommer2026! ')).toEqual([' Sommer2026! ', 'Sommer2026!']);
    // Twelve characters, but with an l: not one the app proposes.
    expect(pdfPasswordCandidates('k7ql2xrp9fha')).toEqual(['k7ql2xrp9fha']);
  });

  it('tries nothing for an empty input', () => {
    expect(pdfPasswordCandidates('')).toEqual([]);
    expect(pdfPasswordCandidates('   ')).toEqual(['   ']);
  });
});
