// One case of an SV assessment through the engine: the answers of person and employer → the
// proposals Personengruppe, Beitragsgruppen and Übergangsbereich of the Personalfragebogen draft.
import { join } from 'node:path';
import { derive, type DerivationResult } from '../../src/logic/derivations';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import type { Questionnaire } from '../../src/logic/model';
import { FORMS_DIR, readJson, registeredFrom } from './formFiles';
import { QUESTIONNAIRE_ID } from './sample';

export const svForm = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));

export type Answers = Record<string, unknown>;

export interface Assessment {
  pgr: DerivationResult | undefined;
  bgr: DerivationResult | undefined;
  uebergang: DerivationResult | undefined;
  /** Answers the form does not ask in this case (their precondition never holds). */
  skipped: string[];
}

/**
 * Sets the answers in passes until nothing more can be set, so a follow-up may come before the
 * answer that opens it; what stays unavailable is noted, not forced. Any other refusal throws.
 */
function filled(q: Questionnaire, role: string, values: Answers, skipped: string[]) {
  const started = startPart(q, svForm, role);
  if (!started.ok) throw new Error(started.code);
  let current = started.questionnaire;
  let pending = Object.entries(values);
  for (;;) {
    const waiting: [string, unknown][] = [];
    for (const [id, raw] of pending) {
      const result = setValue(current, svForm, role, id, raw);
      if (result.ok) current = result.questionnaire;
      else if (result.code === 'fieldNotAvailable') waiting.push([id, raw]);
      else throw new Error(`${role}.${id}: ${result.code} ${result.detail.join(' ')}`);
    }
    if (waiting.length === 0 || waiting.length === pending.length) {
      skipped.push(...waiting.map(([id]) => `${role}.${id}`));
      return current;
    }
    pending = waiting;
  }
}

export function assess(person: Answers, employer: Answers): Assessment {
  const skipped: string[] = [];
  let q = createQuestionnaire(QUESTIONNAIRE_ID, svForm);
  q = filled(q, 'person', person, skipped);
  q = filled(q, 'arbeitgeber', employer, skipped);
  const results = new Map(derive(q, svForm.definition).map((d) => [d.id, d] as const));
  return {
    pgr: results.get('personengruppe'),
    bgr: results.get('beitragsgruppen'),
    uebergang: results.get('uebergangsbereich'),
    skipped,
  };
}

/** "109 (p)" style, "–" without a proposal. */
export const shownValue = (result: DerivationResult | undefined) =>
  result?.status === 'proposed' ? `${result.value ?? ''}${result.check ? ' (p)' : ''}` : '–';

export const DIGITS = ['kv', 'rv', 'av', 'pv'] as const;

/** The expectation of a case file (tests/fixtures/sv-vorgaben*). */
export interface Expected {
  pgr: string;
  bgr: string;
  uebergangsbereich?: string;
  /**
   * What a test must not check hard: a digit (kv, rv, av, pv — e.g. KV 1 against 3 where the sources
   * differ) or the Übergangsbereich.
   */
  unsicher?: string[];
  spaeter?: { ab: string; pgr: string; bgr: string }[];
  zusatzmeldung?: { an: string; pgr: string; bgr: string };
}

export type Aspect = 'pgr' | 'bgr' | 'uebergang';

/** The expected Beitragsgruppen with "?" where the case leaves a digit open. */
export const expectedBgr = (e: Expected) =>
  [...e.bgr].map((digit, i) => (e.unsicher?.includes(DIGITS[i] ?? '') ? '?' : digit)).join('');

export const masked = (value: string | undefined, pattern: string) =>
  [...(value ?? '')].map((digit, i) => (pattern[i] === '?' ? '?' : digit)).join('');

export function actual(r: Assessment): Record<Aspect, string> {
  return {
    pgr: r.pgr?.status === 'proposed' ? (r.pgr.value ?? '–') : '–',
    bgr: r.bgr?.status === 'proposed' ? (r.bgr.value ?? '–') : '–',
    uebergang: r.uebergang?.status === 'proposed' ? (r.uebergang.value ?? '–') : '–',
  };
}

export function wanted(e: Expected): Partial<Record<Aspect, string>> {
  return {
    pgr: e.pgr,
    bgr: expectedBgr(e),
    ...(e.uebergangsbereich === undefined || e.unsicher?.includes('uebergangsbereich')
      ? {}
      : { uebergang: e.uebergangsbereich }),
  };
}
