import { accessGateNeeded, accessToken } from './accessGate';
import { parseAppConfig } from './appConfig';
import { APP_STORAGE, appKeysOfFolder, storageKey } from './storageKeys';

const NOTICE = 'Ich bestätige, dass ich Mandant der Musterkanzlei bin.';

describe('the access notice (Tobias 2026-11-13: clients only)', () => {
  it('asks in the hosted app when a notice is configured and nothing is remembered', () => {
    expect(accessGateNeeded({ notice: NOTICE, protocol: 'https:', remembered: null })).toBe(true);
  });

  it('asks nothing without a configured notice (the public repo) and never in a downloaded copy', () => {
    expect(accessGateNeeded({ notice: undefined, protocol: 'https:', remembered: null })).toBe(
      false,
    );
    expect(accessGateNeeded({ notice: NOTICE, protocol: 'file:', remembered: null })).toBe(false);
  });

  it('asks no more once this very notice was remembered, but again when the notice changes', () => {
    const token = accessToken(NOTICE);
    expect(accessGateNeeded({ notice: NOTICE, protocol: 'https:', remembered: token })).toBe(false);
    expect(
      accessGateNeeded({ notice: `${NOTICE} Neu.`, protocol: 'https:', remembered: token }),
    ).toBe(true);
    expect(accessGateNeeded({ notice: NOTICE, protocol: 'https:', remembered: 'ja' })).toBe(true);
  });

  it('keeps the remembered answer per folder, and a full reset of the test folder removes it', () => {
    expect(storageKey(APP_STORAGE.access, '/')).toBe('fragebogen-zugang');
    expect(storageKey(APP_STORAGE.access, '/test/index.html')).toBe('fragebogen-zugang@/test/');
    expect(
      appKeysOfFolder(['fragebogen-zugang', 'fragebogen-zugang@/test/'], '/test/index.html'),
    ).toEqual(['fragebogen-zugang@/test/']);
  });

  it('reads the notice from the configuration, refusing an empty one', () => {
    expect(parseAppConfig({ accessNotice: NOTICE })).toEqual({
      ok: true,
      config: { accessNotice: NOTICE },
    });
    expect(parseAppConfig({ accessNotice: '  ' }).ok).toBe(false);
    expect(parseAppConfig({ accessNotice: 3 }).ok).toBe(false);
    expect(parseAppConfig({})).toEqual({ ok: true, config: {} });
  });
});
