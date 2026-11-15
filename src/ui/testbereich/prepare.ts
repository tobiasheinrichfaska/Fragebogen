// What a start point of the test area opens (Tobias 2026-11-03): a questionnaire prepared through the
// session functions with the newest form, the Kanzlei station with prepared inputs, or a bookmark
// link the app reads like the Kanzlei's (MT-100/101). Built with this device's clock and nonces.
import { BUNDLED_FORMS } from '../../io/bundledForms';
import { deviceNow, newNonce, newQuestionnaireId, systemNoteFor } from '../../io/environment';
import type { SystemNote } from '../../logic/model';
import {
  buildKanzleiStart,
  buildStartPoint,
  isKanzleiStart,
  isLinkStart,
  type StartEnvironment,
} from '../../logic/startPoints';
import type { PreparedStart } from '../App';
import { START_POINTS } from './catalogue';

/** Everything a seal takes from the device: one label, one row of it. */
interface Shared {
  id: string;
  nonces: string[];
  now: { local: string; utc: string };
  systemNote: SystemNote;
}

/** What a start point opens: a prepared questionnaire or a bookmark link. */
export interface Prepared {
  title: string;
  start?: PreparedStart;
  link?: string;
}

/** The start point `id` built, or why it cannot be (German, shown above the app). */
export function prepare(id: string): Prepared | string {
  const point = START_POINTS.get(id);
  if (!point) return `Den Startpunkt „${id}“ gibt es nicht.`;
  if (isLinkStart(point)) return { title: point.title, link: point.link };
  const registry = BUNDLED_FORMS.ok ? BUNDLED_FORMS.registry : undefined;
  const now = deviceNow();
  // Inputs with one label share the questionnaire id and the nonces (equal parts, equal seals).
  const shared = new Map<string, Shared>();
  const envFrom = (own: Shared): StartEnvironment => {
    let next = 0;
    return {
      questionnaireId: own.id,
      nonce: () => {
        if (next === own.nonces.length) own.nonces.push(newNonce());
        return own.nonces[next++] ?? newNonce();
      },
      now: own.now,
      systemNote: own.systemNote,
    };
  };
  const fresh = (): Shared => ({
    id: newQuestionnaireId(),
    nonces: [],
    now: { local: now.local, utc: now.utc },
    systemNote: systemNoteFor(now, ['keyboard']),
  });
  const envOf = (label: string | undefined): StartEnvironment => {
    const own = (label === undefined ? undefined : shared.get(label)) ?? fresh();
    if (label !== undefined) shared.set(label, own);
    return envFrom(own);
  };
  if (isKanzleiStart(point)) {
    const inbox = buildKanzleiStart(
      point,
      START_POINTS,
      (formId) => registry?.latest(formId),
      envOf,
      { local: now.local, utc: now.utc, timeZone: now.timeZone },
    );
    if (!inbox.ok) {
      return `Der Startpunkt „${point.title}“ passt nicht mehr zum Formular: ${inbox.problems.join(' ')}`;
    }
    return {
      title: point.title,
      start: { title: point.title, screen: 'kanzlei', inbox: inbox.inbox },
    };
  }
  const form = registry?.latest(point.form);
  if (!form) return `Das Formular „${point.form}“ ist in dieser Fassung der App nicht enthalten.`;
  const built = buildStartPoint(point, form, envOf(undefined));
  if (!built.ok) {
    return `Der Startpunkt „${point.title}“ passt nicht mehr zum Formular: ${built.problems.join(' ')}`;
  }
  return {
    title: point.title,
    start: { title: point.title, session: built.session, screen: built.screen },
  };
}
