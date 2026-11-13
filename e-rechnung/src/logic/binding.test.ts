import { INVOICE, allDefinitions, pathFor, termLabel } from './binding';

describe('binding as data', () => {
  const { terms, groups } = allDefinitions();

  it('defines every term and every group once', () => {
    const bts = terms.map((t) => t.bt);
    expect(new Set(bts).size).toBe(bts.length);
    const bgs = groups.map((g) => g.bg);
    expect(new Set(bgs).size).toBe(bgs.length);
  });

  it('has a CII path for every term and group, and a UBL path except the note subject', () => {
    expect(terms.filter((t) => !t.cii).map((t) => t.bt)).toEqual([]);
    expect(terms.filter((t) => !t.ubl).map((t) => t.bt)).toEqual(['BT-21']);
    expect(groups.filter((g) => g !== INVOICE && (!g.cii || !g.ubl)).map((g) => g.bg)).toEqual([]);
  });

  it('labels everything in German', () => {
    expect(terms.every((t) => t.label.length > 1)).toBe(true);
    expect(groups.every((g) => g.label.length > 1)).toBe(true);
    expect(termLabel('BT-1')).toBe('Rechnungsnummer');
    expect(termLabel('BT-27')).toBe('Name des Verkäufers');
    expect(termLabel('BT-9999')).toBe('BT-9999');
  });

  it('covers every term the KoSIT/FeRD recommendation names for § 14 Abs. 4 UStG', () => {
    // Stand 25.07.2025, pages 2–10 (BT lists of the "Mapping EN 16931-1:2019" column)
    const named = [
      1, 2, 3, 7, 8, 20, 22, 27, 28, 31, 32, 35, 36, 37, 38, 39, 40, 44, 45, 48, 50, 51, 52, 53, 54,
      55, 62, 63, 72, 92, 96, 97, 99, 106, 107, 109, 110, 112, 113, 115, 116, 117, 118, 119, 120,
      121, 129, 131, 136, 139, 141, 146, 152, 162, 163,
    ].map((n) => `BT-${n}`);
    const bts = new Set(terms.map((t) => t.bt));
    expect(named.filter((bt) => !bts.has(bt as never))).toEqual([]);
    const namedGroups = [
      'BG-1',
      'BG-4',
      'BG-5',
      'BG-7',
      'BG-8',
      'BG-11',
      'BG-12',
      'BG-13',
      'BG-14',
      'BG-20',
      'BG-21',
      'BG-22',
      'BG-23',
      'BG-24',
      'BG-25',
      'BG-26',
      'BG-27',
      'BG-28',
      'BG-29',
      'BG-30',
      'BG-31',
      'BG-32',
    ];
    const bgs = new Set(groups.map((g) => g.bg));
    expect(namedGroups.filter((bg) => !bgs.has(bg as never))).toEqual([]);
  });

  it('falls back to the Invoice path for a CreditNote', () => {
    const lines = groups.find((g) => g.bg === 'BG-25');
    expect(lines && pathFor(lines, 'ublCreditNote')).toBe('/*/cac:CreditNoteLine');
    const seller = groups.find((g) => g.bg === 'BG-4');
    expect(seller && pathFor(seller, 'ublCreditNote')).toBe(seller && pathFor(seller, 'ubl'));
  });
});
