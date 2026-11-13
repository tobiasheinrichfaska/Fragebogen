// The remembered access confirmation (logic/accessGate.ts), under the key of the app's folder.
// Every access is guarded: a private window or blocked storage simply asks again next time.
import { APP_STORAGE, storageKey } from '../logic/storageKeys';

const key = () => storageKey(APP_STORAGE.access, location.pathname);

export function loadAccess(): string | null {
  try {
    return localStorage.getItem(key());
  } catch {
    return null;
  }
}

export function saveAccess(token: string): void {
  try {
    localStorage.setItem(key(), token);
  } catch {
    // not kept: the notice is asked again next time
  }
}

export function clearAccess(): void {
  try {
    localStorage.removeItem(key());
  } catch {
    // nothing stored, nothing to remove
  }
}
