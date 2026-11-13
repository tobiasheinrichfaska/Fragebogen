// Browser storage per folder of the site (found 2026-11-13): the test folder at /test/ shares its
// origin, and so its localStorage, with the public app at /. Each folder keeps its own entries, so
// neither app offers or deletes the other's interrupted questionnaire. At the root the keys stay as
// they were: a questionnaire begun in the public app before keeps being found.

/** Everything the questionnaire app keeps in the browser, by name (the tester's run is not the app's). */
export const APP_STORAGE = { resume: 'fragebogen-angefangen' } as const;

/** The folder of a page address: "/" for "/" and "/index.html", "/test/" for "/test/index.html". */
export function folderOf(pathname: string): string {
  const cut = pathname.lastIndexOf('/');
  return cut < 0 ? '/' : pathname.slice(0, cut + 1);
}

/** The key of `name` for the app in this folder: unchanged at the root, else "name@/folder/". */
export function storageKey(name: string, pathname: string): string {
  const folder = folderOf(pathname);
  return folder === '/' ? name : `${name}@${folder}`;
}

/** The keys among `keys` the app in this folder keeps — what its full reset removes, nothing else. */
export function appKeysOfFolder(keys: readonly string[], pathname: string): string[] {
  const own = new Set(Object.values(APP_STORAGE).map((name) => storageKey(name, pathname)));
  return keys.filter((key) => own.has(key));
}
