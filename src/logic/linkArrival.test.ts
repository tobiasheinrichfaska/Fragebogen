import { describe, expect, it } from 'vitest';
import { linkLeavesAddress, linkNeedsStart } from './linkArrival';

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

describe('linkLeavesAddress', () => {
  it('lets a read link go once nothing covers the app', () => {
    expect(linkLeavesAddress({ link: true, accessOpen: false, offerOpen: false })).toBe(true);
  });

  it('keeps it while the access notice is open, so a reload there still reads it', () => {
    expect(linkLeavesAddress({ link: true, accessOpen: true, offerOpen: false })).toBe(false);
  });

  it('keeps it while an interrupted questionnaire is offered', () => {
    expect(linkLeavesAddress({ link: true, accessOpen: false, offerOpen: true })).toBe(false);
  });

  it('has nothing to do without a link', () => {
    expect(linkLeavesAddress({ link: false, accessOpen: false, offerOpen: false })).toBe(false);
  });
});
