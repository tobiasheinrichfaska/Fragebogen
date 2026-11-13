// What a step has typed but not yet answered (Chrome evaluation 2026-11-13, B1): the links that
// leave a step — "Zur Zusammenfassung …", "Unterbrechen …" — first take it over, as "Weiter" does,
// instead of dropping it without a word. A refused input keeps the person on the step with its
// message.
import { useEffect, useRef, type RefObject } from 'react';
import type { Session } from '../logic/session';

/** Takes the step's input over; undefined when it was refused (the step shows why). */
export type CommitPending = () => Session | undefined;
export type PendingRef = RefObject<CommitPending | undefined>;

export function usePendingRef(): PendingRef {
  return useRef<CommitPending | undefined>(undefined);
}

/** The active step offers its commit to the screen that holds the links. */
export function usePendingCommit(pending: PendingRef | undefined, commit: CommitPending): void {
  useEffect(() => {
    if (!pending) return;
    pending.current = commit;
    return () => {
      if (pending.current === commit) pending.current = undefined;
    };
  });
}
