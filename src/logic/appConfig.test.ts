import { explainerUrl, parseAppConfig } from './appConfig';

describe('parseAppConfig', () => {
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
