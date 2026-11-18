import { describe, expect, it } from 'vitest';
import { linkNeedsStart } from './linkArrival';

describe('linkNeedsStart', () => {
  it('asks for a fresh start for a master-data link, with or without a form', () => {
    expect(linkNeedsStart('#stammdaten=1&formular=personalfragebogen&firma=Beispiel+GmbH')).toBe(
      true,
    );
    expect(linkNeedsStart('#stammdaten=1&firma=Beispiel+GmbH')).toBe(true);
    expect(linkNeedsStart('stammdaten=1&formular=sofortmeldung')).toBe(true);
  });

  it('also for a malformed master-data link, so the start can say what is wrong', () => {
    expect(linkNeedsStart('#stammdaten=2&firma=Beispiel+GmbH')).toBe(true);
    expect(linkNeedsStart('#stammdaten=1&firma=')).toBe(true);
  });

  it('for a link that passes a questionnaire on, open or protected', () => {
    expect(linkNeedsStart('#weitergabe=1&pruef=abc&daten=xyz')).toBe(true);
    expect(linkNeedsStart('#weitergabe=2&daten=xyz')).toBe(true);
  });

  it('not for an empty or another fragment', () => {
    expect(linkNeedsStart('')).toBe(false);
    expect(linkNeedsStart('#')).toBe(false);
    expect(linkNeedsStart('#oben')).toBe(false);
  });
});
