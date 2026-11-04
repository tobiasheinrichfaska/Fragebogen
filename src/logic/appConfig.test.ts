import { colorVariables, contrastRatio, explainerUrl, parseAppConfig } from './appConfig';

describe('parseAppConfig', () => {
  it('takes the help pages as a relative folder, so each hosted folder links to its own', () => {
    expect(parseAppConfig({ explainerBase: 'hilfe' })).toEqual({
      ok: true,
      config: { explainerBase: 'hilfe' },
    });
    expect(explainerUrl({ explainerBase: 'hilfe' }, 'steuer-id')).toBe('hilfe/steuer-id');
    expect(parseAppConfig({ explainerBase: '../hilfe' }).ok).toBe(false);
  });

  it('takes the test folder as a plain relative path or an https address', () => {
    expect(parseAppConfig({ testAddress: 'test/' })).toEqual({
      ok: true,
      config: { testAddress: 'test/' },
    });
    expect(parseAppConfig({ testAddress: 'https://fragebogen.example.org/test/' })).toEqual({
      ok: true,
      config: { testAddress: 'https://fragebogen.example.org/test/' },
    });
  });

  it('accepts the neutral and a full configuration', () => {
    expect(parseAppConfig({})).toEqual({ ok: true, config: {} });
    expect(
      parseAppConfig({
        kanzleiName: 'Musterkanzlei',
        appAddress: 'https://fragebogen.example.org/',
        explainerBase: 'https://www.example.org/videos',
      }),
    ).toEqual({
      ok: true,
      config: {
        kanzleiName: 'Musterkanzlei',
        appAddress: 'https://fragebogen.example.org/',
        explainerBase: 'https://www.example.org/videos',
      },
    });
  });

  it.each<[string, unknown, string]>([
    ['http', { appAddress: 'http://example.org' }, 'https'],
    ['javascript', { explainerBase: 'javascript:alert(1)' }, 'https'],
    ['a local file', { appAddress: 'file:///c:/fragebogen.html' }, 'https'],
    ['credentials', { appAddress: 'https://user:pw@example.org' }, 'credentials'],
    ['a query', { explainerBase: 'https://example.org/v?x=1' }, 'query'],
    ['no address', { appAddress: 'fragebogen' }, 'not an address'],
    ['an unknown key', { logo: 'x.png' }, 'unknown property'],
    ['a test path leaving the folder', { testAddress: '../geheim/' }, 'not an address'],
    ['a test link with a script', { testAddress: 'javascript:alert(1)' }, 'https'],
  ])('refuses %s', (_label, raw, message) => {
    const result = parseAppConfig(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((i) => i.message).join(' ')).toContain(message);
  });
});

describe('explainerUrl', () => {
  it('joins the configured base and the frozen path', () => {
    expect(
      explainerUrl(
        { explainerBase: 'https://www.example.org/videos/' },
        'sofortmeldung/versicherungsnummer',
      ),
    ).toBe('https://www.example.org/videos/sofortmeldung/versicherungsnummer');
  });

  it('gives nothing without a base or a path', () => {
    expect(explainerUrl({}, 'a')).toBeUndefined();
    expect(explainerUrl({ explainerBase: 'https://example.org' }, undefined)).toBeUndefined();
  });
});

describe('Kanzlei colours (Tobias 2026-11-04: like the homepage)', () => {
  it('measures contrast as WCAG 2 does', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
    expect(contrastRatio('#ffffff', '#000000')).toBe(contrastRatio('#000000', '#ffffff'));
  });

  it('takes readable colours and turns them into the stylesheet variables', () => {
    const parsed = parseAppConfig({
      colors: { accent: '#A6192E', chosenBg: '#f8e6e9', infoBg: '#f0f2fb', accentDark: '#e8838f' },
    });
    expect(parsed.ok).toBe(true);
    expect(colorVariables(parsed.ok ? parsed.config.colors : undefined)).toEqual({
      '--kanzlei-accent': '#a6192e',
      '--kanzlei-chosen-bg': '#f8e6e9',
      '--kanzlei-info-bg': '#f0f2fb',
      '--kanzlei-accent-dark': '#e8838f',
    });
    expect(colorVariables(undefined)).toEqual({});
  });

  it.each([
    ['a light accent white text cannot be read on', { accent: '#f4a6b0' }, 'contrast'],
    ['a dark answer background', { accent: '#a6192e', chosenBg: '#5c5a5a' }, 'contrast'],
    [
      'a dark-mode accent too dark for the dark page',
      { accent: '#a6192e', accentDark: '#8c1121' },
      'contrast',
    ],
    ['a colour that is no #rrggbb', { accent: 'red' }, ''],
    ['colours without the accent', { infoBg: '#f0f2fb' }, 'required'],
    ['an unknown colour', { accent: '#a6192e', logo: '#000000' }, ''],
  ])('refuses %s', (_name, colors, message) => {
    const parsed = parseAppConfig({ colors });
    expect(parsed.ok).toBe(false);
    expect(JSON.stringify(parsed)).toContain(message);
  });
});
