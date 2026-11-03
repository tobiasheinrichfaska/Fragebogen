// Start points of the test area (Tobias 2026-11-03: "Startlinks, die einen z. B. vom Arbeitgeber
// vorbereiteten Fragebogen starten"; "nicht jeder Fragebogenbereich muss immer und immer wieder
// befüllt werden"): a questionnaire prepared from data — answers per role, parts sealed or left
// open — and the question it opens at, so a manual test only goes through the part it is about.
// Built with the newest version of the form through the same session functions as the UI, so every
// answer is checked like typed input and a form change breaks a start point loudly, not silently.
// A Kanzlei start point opens the Kanzlei station with prepared inputs instead: each one is the
// questionnaire of another start point (all parts sealed), optionally with changed answers; inputs
// with the same label share the questionnaire id and nonces, so equal parts give equal seals (two
// versions of one person for the conflict test). Fictitious data only; bundled into the test folder
// build alone.
import { buildPackage, packageText } from './dataPackage';
import { Decoder, type DecodeIssue } from './decode';
import { fieldsOfRole } from './form';
import { ID } from './formDefinition';
import type { RegisteredForm } from './formRegistry';
import { sha256Hex } from './hash';
import { addToInbox, EMPTY_INBOX, type Inbox } from './kanzlei';
import type { FieldId, RoleId, SystemNote } from './model';
import {
  acknowledge,
  answer,
  enterRole,
  goTo,
  leaveRole,
  seal,
  startSession,
  stepsFor,
  type Session,
} from './session';

export interface StartPart {
  role: RoleId;
  /** Answers as a tester types them ("17.05.1990"), applied in form order. */
  answers: Readonly<Record<FieldId, unknown>>;
  /** Close the part without a signature or with a typed name; left out, it stays a draft. */
  seal?: 'unsigned' | { typed: string };
}

export interface StartPoint {
  id: string;
  /** German, shown in the app when the start point opens. */
  title: string;
  /** Form id; the newest version the app carries is used. */
  form: string;
  parts: StartPart[];
  /** The role whose draft opens, at a question (field id) or its summary; or the overview. */
  open: { role: RoleId; at: FieldId | 'summary' } | 'overview';
}

/** One prepared input of the Kanzlei station: the questionnaire of another start point. */
export interface InboxEntry {
  /** File name shown in the inbox, as if the file had been read in. */
  name: string;
  /** The start point whose parts the input carries; all of them must be sealed. */
  from: string;
  /** Inputs with the same label are one questionnaire (same id, same nonces). */
  questionnaire?: string;
  /** Answers that differ from that start point, per role. */
  change?: Readonly<Record<RoleId, Readonly<Record<FieldId, unknown>>>>;
}

export interface KanzleiStartPoint {
  id: string;
  title: string;
  inbox: InboxEntry[];
  open: 'kanzlei';
}

export type AnyStartPoint = StartPoint | KanzleiStartPoint;

export const isKanzleiStart = (point: AnyStartPoint): point is KanzleiStartPoint =>
  point.open === 'kanzlei';

const START_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

export type StartPointParse =
  { ok: true; point: AnyStartPoint } | { ok: false; issues: readonly DecodeIssue[] };

/** Strict decoding of one start point file. */
export function parseStartPoint(raw: unknown): StartPointParse {
  if (typeof raw === 'object' && raw !== null && 'inbox' in raw) return parseKanzleiStart(raw);
  const d = new Decoder();
  const o = d.object(raw, '$', ['id', 'title', 'form', 'parts', 'open']);
  const id = o && d.string(o.id, '$.id', START_ID);
  const title = o && d.string(o.title, '$.title');
  const form = o && d.string(o.form, '$.form', ID);
  const parts =
    o &&
    d.array(
      o.parts,
      '$.parts',
      (value, path) => {
        const p = d.object(value, path, ['role', 'answers', 'seal']);
        if (!p) return undefined;
        const role = d.string(p.role, `${path}.role`, ID);
        const answers = d.record(p.answers, `${path}.answers`, ID, (v) => v);
        const sealed =
          p.seal === undefined
            ? undefined
            : typeof p.seal === 'string'
              ? d.literal(p.seal, `${path}.seal`, ['unsigned'] as const)
              : decodeTyped(d, p.seal, `${path}.seal`);
        if (role === undefined || answers === undefined) return undefined;
        if (p.seal !== undefined && sealed === undefined) return undefined;
        return { role, answers, ...(sealed === undefined ? {} : { seal: sealed }) };
      },
      1,
    );
  const open = o && (o.open === 'overview' ? 'overview' : decodeOpen(d, o.open));
  if (d.issues.length > 0 || !id || !title || !form || !parts || !open) {
    return { ok: false, issues: d.issues };
  }
  return { ok: true, point: { id, title, form, parts, open } };
}

function parseKanzleiStart(raw: unknown): StartPointParse {
  const d = new Decoder();
  const o = d.object(raw, '$', ['id', 'title', 'inbox', 'open']);
  const id = o && d.string(o.id, '$.id', START_ID);
  const title = o && d.string(o.title, '$.title');
  const open = o && d.literal(o.open, '$.open', ['kanzlei'] as const);
  const inbox =
    o &&
    d.array(
      o.inbox,
      '$.inbox',
      (value, path): InboxEntry | undefined => {
        const e = d.object(value, path, ['name', 'from', 'questionnaire', 'change']);
        if (!e) return undefined;
        const name = d.string(e.name, `${path}.name`, FILE_NAME);
        const from = d.string(e.from, `${path}.from`, START_ID);
        const label =
          e.questionnaire === undefined
            ? undefined
            : d.string(e.questionnaire, `${path}.questionnaire`, ID);
        const change =
          e.change === undefined
            ? undefined
            : d.record(e.change, `${path}.change`, ID, (answers, at) =>
                d.record(answers, at, ID, (v) => v),
              );
        if (name === undefined || from === undefined) return undefined;
        if ((e.questionnaire !== undefined && !label) || (e.change !== undefined && !change)) {
          return undefined;
        }
        return {
          name,
          from,
          ...(label === undefined ? {} : { questionnaire: label }),
          ...(change === undefined ? {} : { change }),
        };
      },
      1,
    );
  if (d.issues.length > 0 || !id || !title || !inbox || !open) {
    return { ok: false, issues: d.issues };
  }
  return { ok: true, point: { id, title, inbox, open } };
}

function decodeOpen(d: Decoder, raw: unknown): { role: RoleId; at: string } | undefined {
  const o = d.object(raw, '$.open', ['role', 'at']);
  const role = o && d.string(o.role, '$.open.role', ID);
  const at = o && d.string(o.at, '$.open.at', ID);
  return role === undefined || at === undefined ? undefined : { role, at };
}

function decodeTyped(d: Decoder, raw: unknown, path: string): { typed: string } | undefined {
  const o = d.object(raw, path, ['typed']);
  const typed = o && d.string(o.typed, `${path}.typed`);
  return typed === undefined ? undefined : { typed };
}

/** What the device contributes, as when a person seals in the app. */
export interface StartEnvironment {
  questionnaireId: string;
  nonce: () => string;
  now: { local: string; utc: string };
  systemNote: SystemNote;
}

export type StartResult =
  | { ok: true; session: Session; screen: 'interview' | 'overview' }
  | { ok: false; problems: string[] };

/**
 * The questionnaire of a start point: each part entered, its notices acknowledged, its answers
 * given in form order and, if asked for, sealed; then the open role's draft at the named step.
 * Every refusal is a problem — a start point that no longer fits its form is never half-built.
 */
export function buildStartPoint(
  point: StartPoint,
  form: RegisteredForm,
  env: StartEnvironment,
): StartResult {
  if (form.definition.id !== point.form) {
    return { ok: false, problems: [`Formular „${form.definition.id}“ statt „${point.form}“.`] };
  }
  const problems: string[] = [];
  let session = startSession(form, env.questionnaireId);
  for (const part of point.parts) {
    const entered = enterRole(session, part.role);
    if (!entered.ok) return { ok: false, problems: [`${part.role}: ${entered.message}`] };
    session = entered.session;
    for (const step of stepsFor(session)) {
      if (step.kind === 'notice') session = acknowledge(session, step.infoBlockId, true);
    }
    const own = fieldsOfRole(form.definition, part.role).map((field) => field.id);
    for (const id of Object.keys(part.answers)) {
      if (!own.includes(id)) problems.push(`${part.role}.${id}: keine Frage dieser Rolle.`);
    }
    for (const id of own.filter((fieldId) => Object.hasOwn(part.answers, fieldId))) {
      const result = answer(session, id, part.answers[id]);
      if (result.ok) session = result.session;
      else problems.push(`${part.role}.${id}: ${[result.message, ...result.detail].join(' – ')}`);
    }
    if (part.seal === undefined) continue;
    const sealed = seal(session, {
      nonce: env.nonce(),
      systemNote: env.systemNote,
      now: env.now,
      ...(part.seal === 'unsigned'
        ? {}
        : { signature: { method: 'typed' as const, name: part.seal.typed } }),
    });
    if (sealed.ok) session = sealed.session;
    else
      problems.push(`${part.role} abschließen: ${[sealed.message, ...sealed.detail].join(' – ')}`);
  }
  if (point.open === 'overview') {
    return problems.length > 0
      ? { ok: false, problems }
      : { ok: true, session: leaveRole(session), screen: 'overview' };
  }
  const { role, at } = point.open;
  const opened = enterRole(session, role);
  if (!opened.ok) problems.push(`${role} öffnen: ${opened.message}`);
  else session = opened.session;
  const key = at === 'summary' ? 'summary' : `question:${at}`;
  if (opened.ok && !stepsFor(session).some((step) => step.key === key)) {
    problems.push(`${role}: die Frage „${at}“ ist dort nicht zu sehen.`);
  }
  return problems.length > 0
    ? { ok: false, problems }
    : { ok: true, session: goTo(session, key), screen: 'interview' };
}

export type KanzleiStartResult = { ok: true; inbox: Inbox } | { ok: false; problems: string[] };

/**
 * The inbox of a Kanzlei start point: every input built from its start point (with the changed
 * answers) by `envOf` its label, as a data package with its SHA-256 like a file read in at
 * `received`. A start point that is missing, leaves a part open or does not fit its form is a
 * problem; so is the same input twice.
 */
export function buildKanzleiStart(
  point: KanzleiStartPoint,
  points: ReadonlyMap<string, AnyStartPoint>,
  formOf: (id: string) => RegisteredForm | undefined,
  envOf: (label: string | undefined) => StartEnvironment,
  received: { local: string; utc: string; timeZone: string },
): KanzleiStartResult {
  const problems: string[] = [];
  let inbox = EMPTY_INBOX;
  for (const entry of point.inbox) {
    const base = points.get(entry.from);
    if (!base || isKanzleiStart(base)) {
      problems.push(`${entry.name}: den Startpunkt „${entry.from}“ gibt es nicht.`);
      continue;
    }
    const open = base.parts.filter((part) => part.seal === undefined).map((part) => part.role);
    if (open.length > 0) {
      problems.push(`${entry.name}: „${entry.from}“ lässt ${open.join(', ')} offen.`);
      continue;
    }
    const unknownRoles = Object.keys(entry.change ?? {}).filter(
      (role) => !base.parts.some((part) => part.role === role),
    );
    if (unknownRoles.length > 0) {
      problems.push(`${entry.name}: keine Teile für ${unknownRoles.join(', ')}.`);
      continue;
    }
    const form = formOf(base.form);
    if (!form) {
      problems.push(`${entry.name}: das Formular „${base.form}“ fehlt.`);
      continue;
    }
    const parts = base.parts.map((part) => ({
      ...part,
      answers: { ...part.answers, ...entry.change?.[part.role] },
    }));
    const built = buildStartPoint(
      { ...base, parts, open: 'overview' },
      form,
      envOf(entry.questionnaire),
    );
    if (!built.ok) {
      problems.push(...built.problems.map((problem) => `${entry.name}: ${problem}`));
      continue;
    }
    const questionnaire = built.session.questionnaire;
    const fileSha256 = sha256Hex(packageText(buildPackage(questionnaire, form)));
    const taken = addToInbox(inbox, {
      name: entry.name,
      fileSha256,
      questionnaire,
      form,
      origin: 'published',
      received,
    });
    if (taken.duplicate) problems.push(`${entry.name}: derselbe Eingang ist schon vorbereitet.`);
    inbox = taken.inbox;
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, inbox };
}
