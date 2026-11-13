// The browser storage for an interrupted questionnaire (rules in logic/resume.ts). Every access is
// guarded: a private window or blocked storage simply keeps nothing. The key belongs to the folder
// the app is served from (logic/storageKeys.ts): the test folder never sees the public app's entry.
import { readResume, type ResumeRead, type ResumeRecord } from '../logic/resume';
import { APP_STORAGE, storageKey } from '../logic/storageKeys';

const key = () => storageKey(APP_STORAGE.resume, location.pathname);

export function loadResume(nowUtc: string): ResumeRead {
  try {
    return readResume(localStorage.getItem(key()), nowUtc);
  } catch {
    return { kind: 'none' };
  }
}

/** false when the browser refuses (full, private window, blocked). */
export function saveResume(record: ResumeRecord): boolean {
  try {
    localStorage.setItem(key(), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function clearResume(): void {
  try {
    localStorage.removeItem(key());
  } catch {
    // nothing stored, nothing to remove
  }
}
