// The working session of one device: the questionnaire being filled, which role is at the device
// (device mode), where its interview stands, which notices it confirmed and when each sealed part
// arrived here — the receipt notes of the next seal come from that. Pure functions over an
// immutable Session; time, nonce and device data come from the io layer. Nothing is persisted:
// the user saves files.
import type { FormOrigin } from './dataPackage';
import { fieldsById } from './form';
import type { RegisteredForm } from './formRegistry';
import {
  interviewSteps,
  interviewSummary,
  resumeStep,
  stepAfter,
  stepBefore,
  type InterviewStep,
  type InterviewSummary,
} from './interview';
import { ISSUE_MESSAGES, type IssueCode } from './issues';
import { applyMasterData, type MasterDataSkip } from './masterData';
import type { Questionnaire, RoleDefinition, RoleId, Sha256Hex, SystemNote } from './model';
import { describePrefill, prefillFrom } from './prefill';
import {
  TRANSITION_MESSAGES,
  createQuestionnaire,
  currentPart,
  deferQuestion,
  latestSealed,
  receivedPartFor,
  reopenPart,
  sealPart,
  setValue,
  startPart,
  type SignatureInput,
  type Transition,
} from './questionnaire';
import { roleRequirement, type RoleRequirement } from './requirements';

export interface Arrival {
  local: string;
  utc: string;
  source: 'file' | 'same-device';
  fileSha256?: Sha256Hex;
}

export interface Session {
  questionnaire: Questionnaire;
  form: RegisteredForm;
  origin: FormOrigin;
  /** Role at the device; undefined while choosing who fills in. */
  role?: RoleId;
  /** Current interview step of that role. */
  stepKey?: string;
  /** Notices confirmed per role in this session (the seal needs them). */
  acknowledged: Readonly<Record<RoleId, readonly string[]>>;
  /** When this device got each sealed part, by contentHash. */
  arrivals: Readonly<Record<Sha256Hex, Arrival>>;
  /** Changes since the last saved file. */
  dirty: boolean;
}

export type SessionResult =
  | { ok: true; session: Session; warnings: readonly string[] }
  | { ok: false; message: string; detail: readonly string[] };

const ok = (session: Session, warnings: readonly string[] = []): SessionResult => ({
  ok: true,
  session,
  warnings,
});

/** German message for a refused transition, with field labels instead of ids. */
export function transitionMessage(
  form: RegisteredForm,
  result: Extract<Transition, { ok: false }>,
): { message: string; detail: string[] } {
  const fields = fieldsById(form.definition);
  const label = (id: string) => fields.get(id)?.label ?? id;
  if (result.code === 'invalidValue') {
    const [fieldId = '', issue = ''] = result.detail;
    const text = ISSUE_MESSAGES[issue as IssueCode] ?? TRANSITION_MESSAGES.invalidValue;
    return { message: text, detail: [label(fieldId)] };
  }
  const detail =
    result.code === 'missingRequired' || result.code === 'fieldNotAvailable'
      ? result.detail.map((item, i) =>
          i === 0 || result.code === 'missingRequired' ? label(item) : item,
        )
      : [...result.detail];
  return { message: TRANSITION_MESSAGES[result.code], detail };
}

function fromTransition(
  session: Session,
  result: Transition,
  change: (q: Questionnaire) => Partial<Session> = () => ({}),
): SessionResult {
  if (!result.ok) return { ok: false, ...transitionMessage(session.form, result) };
  return ok(
    {
      ...session,
      questionnaire: result.questionnaire,
      dirty: true,
      ...change(result.questionnaire),
    },
    result.warnings.map((code) => ISSUE_MESSAGES[code]),
  );
}

export function startSession(form: RegisteredForm, questionnaireId: string): Session {
  return {
    questionnaire: createQuestionnaire(questionnaireId, form),
    form,
    origin: 'published',
    acknowledged: {},
    arrivals: {},
    dirty: false,
  };
}

/**
 * Takes answers over from another questionnaire (e.g. the Sofortmeldung, last month's report)
 * into the roles still open here. The same questionnaire is refused — that is "open", not "take
 * over"; so is a file whose seals do not hold.
 */
export function takeOver(
  session: Session,
  source: { questionnaire: Questionnaire; form: RegisteredForm; altered: boolean },
):
  | { ok: true; session: Session; applied: number; lines: string[] }
  | { ok: false; message: string } {
  if (source.altered) {
    return {
      ok: false,
      message: 'Aus einer Datei, die nach dem Abschluss verändert wurde, wird nichts übernommen.',
    };
  }
  if (source.questionnaire.questionnaireId === session.questionnaire.questionnaireId) {
    return {
      ok: false,
      message:
        'Das ist derselbe Fragebogen. Bitte auf der Startseite über „Datei öffnen …“ laden statt übernehmen.',
    };
  }
  const { questionnaire, reports } = prefillFrom(
    session.questionnaire,
    session.form,
    source.questionnaire,
    source.form,
  );
  const { applied, lines } = describePrefill(reports, session.form.definition);
  return {
    ok: true,
    session: { ...session, questionnaire, dirty: session.dirty || applied > 0 },
    applied,
    lines,
  };
}

/** A questionnaire read from a file: every sealed version arrived with that file. */
export function sessionFromFile(
  loaded: { questionnaire: Questionnaire; form: RegisteredForm; origin: FormOrigin },
  arrival: Arrival,
): Session {
  const arrivals: Record<Sha256Hex, Arrival> = {};
  for (const versions of Object.values(loaded.questionnaire.parts)) {
    for (const part of versions) if (part.seal) arrivals[part.seal.contentHash] = arrival;
  }
  return { ...loaded, acknowledged: {}, arrivals, dirty: false };
}

export type PartState = 'missing' | 'draft' | 'sealed' | 'signed';

export interface RoleState {
  role: RoleDefinition;
  requirement: RoleRequirement;
  state: PartState;
  /** Version number of the latest sealed part. */
  version?: number;
  /** The latest seal can still be withdrawn (not passed on or confirmed yet). */
  canReopen: boolean;
}

export function roleStates(session: Session): RoleState[] {
  const { questionnaire, form } = session;
  return form.definition.roles.map((role) => {
    const part = currentPart(questionnaire, role.id);
    const sealed = latestSealed(questionnaire, role.id);
    const version = sealed?.seal?.payload.version;
    return {
      role,
      requirement: roleRequirement(form.definition, questionnaire, role),
      state: part ? part.status : 'missing',
      ...(version === undefined ? {} : { version }),
      canReopen: part?.seal !== undefined && reopenPart(questionnaire, form, role.id).ok,
    };
  });
}

/** Continues an existing draft at its first open question (or the summary). */
function atResume(session: Session, role: RoleId): Partial<Session> {
  return { role, stepKey: resumeStep(stepsFor({ ...session, role })).key };
}

/** Changing a completed part: the summary lists every answer with "ändern". */
function atSummary(_session: Session, role: RoleId): Partial<Session> {
  return { role, stepKey: 'summary' };
}

/** A fresh first version starts at the very first step: the notices come before any question. */
function atStart(session: Session, role: RoleId): Partial<Session> {
  return { role, stepKey: stepsFor({ ...session, role })[0]?.key ?? 'summary' };
}

/** Takes the role to the device: continues its draft or opens its first version. */
export function enterRole(session: Session, role: RoleId): SessionResult {
  const part = currentPart(session.questionnaire, role);
  if (part?.status === 'draft') return ok({ ...session, ...atResume(session, role) });
  if (part) {
    return {
      ok: false,
      message:
        'Dieser Teil ist schon abgeschlossen. Sie können ihn ansehen, eine neue Fassung beginnen oder – solange er nicht weitergegeben wurde – die Unterschrift zurücknehmen.',
      detail: [],
    };
  }
  return fromTransition(session, startPart(session.questionnaire, session.form, role), (q) =>
    atStart({ ...session, questionnaire: q }, role),
  );
}

/** A change after sealing: the next version starts from the sealed data, at the summary. */
export function startNewVersion(session: Session, role: RoleId): SessionResult {
  return fromTransition(session, startPart(session.questionnaire, session.form, role), (q) =>
    atSummary({ ...session, questionnaire: q }, role),
  );
}

/** "Unterschrift zurücknehmen" before passing on: the sealed version becomes a draft again. */
export function reopen(session: Session, role: RoleId): SessionResult {
  return fromTransition(session, reopenPart(session.questionnaire, session.form, role), (q) =>
    atSummary({ ...session, questionnaire: q }, role),
  );
}

export function leaveRole(session: Session): Session {
  const rest: Session = { ...session };
  Reflect.deleteProperty(rest, 'role');
  Reflect.deleteProperty(rest, 'stepKey');
  return rest;
}

export function stepsFor(session: Session): InterviewStep[] {
  const part =
    session.role === undefined ? undefined : currentPart(session.questionnaire, session.role);
  if (!part || part.status !== 'draft' || session.role === undefined) return [];
  return interviewSteps(session.form.definition, session.role, part);
}

export function currentStep(session: Session): InterviewStep | undefined {
  const steps = stepsFor(session);
  return steps.find((step) => step.key === session.stepKey) ?? steps[0];
}

export function goTo(session: Session, key: string): Session {
  return { ...session, stepKey: key };
}

export function nextStep(session: Session): Session {
  const steps = stepsFor(session);
  const next = stepAfter(steps, session.stepKey ?? '');
  return next ? { ...session, stepKey: next.key } : session;
}

export function previousStep(session: Session): Session {
  const previous = stepBefore(stepsFor(session), session.stepKey ?? '');
  return previous ? { ...session, stepKey: previous.key } : session;
}

function activeRole(session: Session): RoleId | SessionResult {
  return session.role ?? { ok: false, message: 'Es ist keine Rolle ausgewählt.', detail: [] };
}

export function answer(session: Session, fieldId: string, raw: unknown): SessionResult {
  const role = activeRole(session);
  if (typeof role !== 'string') return role;
  return fromTransition(session, setValue(session.questionnaire, session.form, role, fieldId, raw));
}

export function defer(session: Session, fieldId: string): SessionResult {
  const role = activeRole(session);
  if (typeof role !== 'string') return role;
  return fromTransition(session, deferQuestion(session.questionnaire, session.form, role, fieldId));
}

export function acknowledge(session: Session, infoBlockId: string, confirmed: boolean): Session {
  const role = session.role;
  if (role === undefined) return session;
  const current = new Set(session.acknowledged[role] ?? []);
  if (confirmed) current.add(infoBlockId);
  else current.delete(infoBlockId);
  return { ...session, acknowledged: { ...session.acknowledged, [role]: [...current].sort() } };
}

export function summaryOf(session: Session): InterviewSummary | undefined {
  const role = session.role;
  const part = role === undefined ? undefined : currentPart(session.questionnaire, role);
  if (role === undefined || part?.status !== 'draft') return undefined;
  return interviewSummary(session.form.definition, role, part, session.acknowledged[role] ?? []);
}

export interface SealRequest {
  nonce: string;
  systemNote: SystemNote;
  signature?: SignatureInput;
  /** Device time of sealing; parts sealed here arrive "same-device" at this time. */
  now: { local: string; utc: string };
}

/**
 * Seals the active role's draft. The receipt notes name the current version of every other role
 * present, with the time it reached this device — that links the parts (partLinks) and binds the
 * guardian to the person.
 */
export function seal(session: Session, request: SealRequest): SessionResult {
  const role = activeRole(session);
  if (typeof role !== 'string') return role;
  const receivedParts = session.form.definition.roles
    .filter((other) => other.id !== role)
    .flatMap((other) => {
      const part = latestSealed(session.questionnaire, other.id);
      if (!part?.seal) return [];
      const arrival = session.arrivals[part.seal.contentHash] ?? {
        ...request.now,
        source: 'same-device' as const,
      };
      return [
        receivedPartFor(
          part,
          { local: arrival.local, utc: arrival.utc },
          arrival.source,
          arrival.fileSha256,
        ),
      ];
    });
  const result = sealPart(session.questionnaire, session.form, role, {
    nonce: request.nonce,
    systemNote: request.systemNote,
    acknowledged: session.acknowledged[role] ?? [],
    ...(request.signature ? { signature: request.signature } : {}),
    receivedParts,
  });
  if (!result.ok) return { ok: false, ...transitionMessage(session.form, result) };
  const sealed = latestSealed(result.questionnaire, role)?.seal;
  const arrivals = sealed
    ? {
        ...session.arrivals,
        [sealed.contentHash]: { ...request.now, source: 'same-device' as const },
      }
    : session.arrivals;
  return ok(
    { ...leaveRole(session), questionnaire: result.questionnaire, arrivals, dirty: true },
    result.warnings.map((code) => ISSUE_MESSAGES[code]),
  );
}

export function markSaved(session: Session): Session {
  return { ...session, dirty: false };
}

/** Fills remembered master data (bookmark link) into the active role's draft. */
export function fillMasterData(
  session: Session,
  stored: unknown,
): { ok: true; session: Session; applied: string[]; skipped: MasterDataSkip[] } | { ok: false } {
  if (session.role === undefined) return { ok: false };
  const result = applyMasterData(session.questionnaire, session.form, session.role, stored);
  if (!result.ok) return { ok: false };
  return {
    ok: true,
    session: {
      ...session,
      questionnaire: result.questionnaire,
      dirty: result.applied.length > 0 || session.dirty,
    },
    applied: result.applied,
    skipped: result.skipped,
  };
}
