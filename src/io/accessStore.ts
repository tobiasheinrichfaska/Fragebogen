// The remembered access confirmation (logic/accessGate.ts), under the key of the app's folder.
// Every access is guarded: a private window or blocked storage simply asks again next time.
import { APP_STORAGE, storageKey } from '../logic/storageKeys';

const key = () => storageKey(APP_STORAGE.access, location.pathname);

// Confirmed in this page load without „merken“: not asked again when the app is mounted afresh
// (the test page does that for every start point, audit 2026-11-16). Memory only; a reload asks.
let confirmedThisVisit = false;

/** The notice was confirmed in this page load. */
export function confirmAccessForVisit(): void {
  confirmedThisVisit = true;
}

export function accessConfirmedThisVisit(): boolean {
  return confirmedThisVisit;
}

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
  confirmedThisVisit = false;
  try {
    localStorage.removeItem(key());
  } catch {
    // nothing stored, nothing to remove
  }
}
