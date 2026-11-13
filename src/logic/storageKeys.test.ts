import { APP_STORAGE, appKeysOfFolder, folderOf, storageKey } from './storageKeys';

describe('browser storage per folder of the site (2026-11-13)', () => {
  it.each([
    ['/', '/'],
    ['/index.html', '/'],
    ['/test/', '/test/'],
    ['/test/index.html', '/test/'],
    ['/mehrfachbearbeitung/index.html', '/mehrfachbearbeitung/'],
    ['/a/b/', '/a/b/'],
    // A folder address without its slash is a file of the root; the web server adds the slash.
    ['/test', '/'],
    ['', '/'],
  ])('the folder of %j is %j', (pathname, folder) => {
    expect(folderOf(pathname)).toBe(folder);
  });

  it('keeps the public app’s key as it was, so a questionnaire begun before is still found', () => {
    expect(storageKey(APP_STORAGE.resume, '/')).toBe('fragebogen-angefangen');
    expect(storageKey(APP_STORAGE.resume, '/index.html')).toBe('fragebogen-angefangen');
  });

  it('gives the test folder a key of its own, never the public one', () => {
    const test = storageKey(APP_STORAGE.resume, '/test/index.html');
    expect(test).toBe('fragebogen-angefangen@/test/');
    expect(test).toBe(storageKey(APP_STORAGE.resume, '/test/'));
    expect(test).not.toBe(storageKey(APP_STORAGE.resume, '/'));
    expect(test).not.toBe(storageKey(APP_STORAGE.resume, '/mehrfachbearbeitung/'));
  });

  it('a reset of the test folder takes only its own keys: the public app and the run stay', () => {
    const keys = [
      'fragebogen-angefangen',
      'fragebogen-angefangen@/test/',
      'fragebogen-angefangen@/mehrfachbearbeitung/',
      'fragebogen-testlauf',
      'something-else',
    ];
    expect(appKeysOfFolder(keys, '/test/index.html')).toEqual(['fragebogen-angefangen@/test/']);
    expect(appKeysOfFolder(keys, '/')).toEqual(['fragebogen-angefangen']);
    expect(appKeysOfFolder(['fragebogen-testlauf'], '/test/')).toEqual([]);
  });
});
