// The browser storage for an interrupted questionnaire (rules in logic/resume.ts). Every access is
// guarded: a private window or blocked storage simply keeps nothing.
import { readResume, resumeRecord, type ResumeRead } from '../logic/resume';

const KEY = 'fragebogen-angefangen';

export function loadResume(nowUtc: string): ResumeRead {
  try {
    return readResume(localStorage.getItem(KEY), nowUtc);
  } catch {
    return { kind: 'none' };
  }
}

/** false when the browser refuses (full, private window, blocked). */
export function saveResume(title: string, packageText: string, nowUtc: string): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(resumeRecord(title, packageText, nowUtc)));
    return true;
  } catch {
    return false;
  }
}

export function clearResume(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing stored, nothing to remove
  }
}
