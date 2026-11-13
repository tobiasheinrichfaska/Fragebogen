import { PROFILES, profileOf } from './profiles';

describe('profileOf', () => {
  it.each([
    ['urn:cen.eu:en16931:2017', 'eRechnung', 'EN 16931'],
    ['urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic', 'eRechnung', 'BASIC'],
    ['urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended', 'eRechnung', 'EXTENDED'],
    ['urn:factur-x.eu:1p0:minimum', 'keineERechnung', 'MINIMUM'],
    ['urn:factur-x.eu:1p0:basicwl', 'keineERechnung', 'BASIC WL'],
    ['urn:ferd:CrossIndustryDocument:invoice:1p0:comfort', 'keineERechnung', 'ZUGFeRD 1.0'],
  ])('%s → %s (%s)', (id, einordnung, profile) => {
    const match = profileOf(id);
    expect(match.einordnung).toBe(einordnung);
    expect(match.entry?.profile).toBe(profile);
  });

  it('prefers the exact XRechnung 3.0 entry and the most specific prefix', () => {
    const base = 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0';
    expect(profileOf(base).entry?.label).toBe('XRechnung 3.0');
    expect(
      profileOf(`${base}#compliant#urn:xeinkauf.de:kosit:xrechnung:cvd_1.0`).entry?.label,
    ).toBe('XRechnung 3.0 (CVD)');
    expect(
      profileOf('urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.1').entry
        ?.label,
    ).toBe('XRechnung');
  });

  it('trims surrounding white space but judges nothing unknown', () => {
    expect(profileOf('  urn:cen.eu:en16931:2017 \n').einordnung).toBe('eRechnung');
    expect(profileOf('urn:cen.eu:en16931:2017#compliant#urn:example:neu')).toEqual({
      id: 'urn:cen.eu:en16931:2017#compliant#urn:example:neu',
      einordnung: 'nichtBeurteilt',
    });
    expect(profileOf(undefined)).toEqual({ einordnung: 'nichtBeurteilt' });
    expect(profileOf('   ')).toEqual({ einordnung: 'nichtBeurteilt' });
  });

  it('never matches a longer identifier against an exact entry', () => {
    expect(profileOf('urn:factur-x.eu:1p0:minimumX').einordnung).toBe('nichtBeurteilt');
  });

  it('keeps one entry per identifier and a source for each', () => {
    const ids = PROFILES.map((p) => `${p.match}:${p.id}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PROFILES.every((p) => p.source.length > 0)).toBe(true);
  });
});
