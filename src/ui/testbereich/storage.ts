// The tester's run survives a reload or a closed tab: kept in this browser's storage, test folder
// only (no personal data — results, times, comments and the tester's name). The questionnaire app
// keeps only an interrupted questionnaire (logic/resume.ts).
import { decodeRun, emptyRun, type TestRun } from '../../logic/testRun';

const KEY = 'fragebogen-testlauf';

export function loadRun(): TestRun {
  try {
    const text = localStorage.getItem(KEY);
    return text ? decodeRun(JSON.parse(text)) : emptyRun();
  } catch {
    return emptyRun();
  }
}

/** false when the browser refuses (private window, blocked storage) — the page says so. */
export function saveRun(run: TestRun): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}

/**
 * "App vollständig zurücksetzen" (Tobias 2026-11-07): everything the app keeps in this browser goes,
 * the tester's run stays. Why it failed, if the browser refused.
 */
export function resetAppStorage(): string | undefined {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key !== KEY) localStorage.removeItem(key);
    }
    sessionStorage.clear();
    const left = Object.keys(localStorage).filter((key) => key !== KEY);
    return left.length === 0 ? undefined : `Nicht gelöscht: ${left.join(', ')}`;
  } catch (error) {
    return String(error);
  }
}
