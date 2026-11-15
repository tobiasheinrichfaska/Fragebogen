// "App vollständig zurücksetzen" of the test page (Tobias 2026-11-07): everything the app keeps in
// this browser goes, the test page's results stay. Only this folder's own keys of the app: the public
// app and other folders on the same address keep theirs (2026-11-13), unlike the test page's default,
// which would empty the whole storage of the address (Testumgebung, docs/testrahmen.md).
import { appKeysOfFolder } from '../../logic/storageKeys';

/** Why it failed, if the browser refused; undefined when everything of the app is gone. */
export function resetAppStorage(): string | undefined {
  try {
    const own = () => appKeysOfFolder(Object.keys(localStorage), location.pathname);
    for (const key of own()) localStorage.removeItem(key);
    sessionStorage.clear();
    const left = own();
    return left.length === 0 ? undefined : `Nicht gelöscht: ${left.join(', ')}`;
  } catch (error) {
    return String(error);
  }
}
