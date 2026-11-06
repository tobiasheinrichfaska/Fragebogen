// The working session of one device: the questionnaire being filled, which role is at the device
// (device mode), where its interview stands, which notices it confirmed and when each sealed part
// arrived here — the receipt notes of the next seal come from that. Pure functions over an
// immutable Session; time, nonce and device data come from the io layer. Nothing is persisted:
// the user saves files.
import type { FormOrigin } from './dataPackage';
import { fieldsById, infoBlocksOfRole, sealableData } from './form';
import type { RegisteredForm } from './formRegistry';
import {
  interviewSteps,
  interviewSummary,
  resumeStep,
  missingStepAround,
  nextMissingStep,
  stepAfter,
  stepAfterEdit,
  stepBefore,
  type InterviewStep,
  type InterviewSummary,
} from './interview';
import { ISSUE_MESSAGES, issueMessage, type IssueCode } from './issues';
import { applyMasterData, type MasterData, type MasterDataFills } from './masterData';
import { displayValue } from './display';
import { activeExclusions, fillingHints } from './hints';
import type {
  FieldId,
  FieldValue,
  FormDefinition,
  Questionnaire,
  RoleDefinition,
  RoleId,
  Sha256Hex,
  SystemNote,
} from './model';
import { describePrefill, prefillFrom } from './prefill';
import {
  TRANSITION_MESSAGES,
  adoptFromOtherRoles,
  createQuestionnaire,
  currentPart,
  deferQuestion,
  fixedByOtherRoles,
  proposedByOtherRoles,
  withAcknowledged,
  leaveQuestionEmpty,
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
  /** Answer being changed from the summary: "Weiter" returns there after its follow-ups. */
  editing?: FieldId;
  /** Notices confirmed per role in this session (the seal needs them). */
  acknowledged: Readonly<Record<RoleId, readonly string[]>>;
  /** When this device got each sealed part, by contentHash. */
  arrivals: Readonly<Record<Sha256Hex, Arrival>>;
  /** Changes since the last saved file. */
  dirty: boolean;
  /** The master-data link of this visit and what it filled per role (never saved). */
  masterData?: {
    record: MasterData;
    fills: Readonly<Record<RoleId, MasterDataFills>>;
  };
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
    const text =
      issue in ISSUE_MESSAGES
        ? issueMessage(issue as IssueCode, fields.get(fieldId))
        : TRANSITION_MESSAGES.invalidValue;
    return { message: text, detail: [label(fieldId)] };
  }
  if (result.code === 'fixedByOtherRole') {
    const [fieldId = '', from = ''] = result.detail;
    const role = form.definition.roles.find((candidate) => candidate.id === from);
    return {
      message: TRANSITION_MESSAGES.fixedByOtherRole,
      detail: [label(fieldId), role?.label ?? from],
    };
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
  // Notices confirmed in last month's file count as confirmed in this session, too.
  const acknowledged: Record<RoleId, readonly string[]> = { ...session.acknowledged };
  for (const report of reports) {
    if (report.notices.length === 0) continue;
    acknowledged[report.role] = [
      ...new Set([...(acknowledged[report.role] ?? []), ...report.notices]),
    ].sort();
  }
  return {
    ok: true,
    session: {
      ...session,
      questionnaire,
      acknowledged,
      dirty: session.dirty || applied > 0,
    },
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
  // Confirmed notices of open drafts come back from the file (Part.acknowledged).
  const acknowledged: Record<RoleId, readonly string[]> = {};
  for (const role of Object.keys(loaded.questionnaire.parts)) {
    const part = currentPart(loaded.questionnaire, role);
    if (part?.status === 'draft' && part.acknowledged) acknowledged[role] = [...part.acknowledged];
  }
  return { ...loaded, acknowledged, arrivals, dirty: false };
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

/**
 * The role a questionnaire passed on opens in at once (Tobias 2026-11-05): when every part so far
 * only prefills (`prefills`, e.g. the Kanzlei in the SEPA-Mandat) and exactly one unconditional
 * role has no part yet; otherwise undefined and the overview asks who fills in.
 */
export function roleToFillNext(session: Session): RoleId | undefined {
  const { questionnaire, form } = session;
  const roles = form.definition.roles;
  const withPart = roles.filter((role) => currentPart(questionnaire, role.id));
  if (withPart.length === 0 || withPart.some((role) => role.prefills !== true)) return undefined;
  const open = roles.filter(
    (role) => role.prefills !== true && !role.requiredIf && !currentPart(questionnaire, role.id),
  );
  return open.length === 1 ? open[0]?.id : undefined;
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

/** Copies what other roles decided into the role's draft (fromRole); replaced answers are named. */
function withAdopted(result: SessionResult, role: RoleId): SessionResult {
  if (!result.ok) return result;
  const { session } = result;
  const adoption = adoptFromOtherRoles(session.questionnaire, session.form, role);
  if (adoption.adopted.length === 0) return result;
  const fields = fieldsById(session.form.definition);
  const after = currentPart(adoption.questionnaire, role)?.data ?? {};
  const notes = adoption.replaced.map((id) => {
    const field = fields.get(id);
    return field
      ? `Aus dem abgeschlossenen Teil der anderen Station übernommen: „${field.label}“ ist jetzt „${displayValue(field, after[id] ?? null)}“.`
      : id;
  });
  return ok({ ...session, questionnaire: adoption.questionnaire, dirty: true }, [
    ...result.warnings,
    ...notes,
  ]);
}

/** Takes the role to the device: continues its draft or opens its first version. */
export function enterRole(session: Session, role: RoleId): SessionResult {
  return withAdopted(enterRoleAsIs(leaveRole(session), role), role);
}

function enterRoleAsIs(session: Session, role: RoleId): SessionResult {
  const part = currentPart(session.questionnaire, role);
  if (part?.status === 'draft') {
    return ok({ ...session, ...atResume(adoptedView(session, role), role) });
  }
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
  const base = leaveRole(session);
  return withAdopted(
    fromTransition(base, startPart(base.questionnaire, base.form, role), (q) =>
      atSummary({ ...base, questionnaire: q }, role),
    ),
    role,
  );
}

/** "Unterschrift zurücknehmen" before passing on: the sealed version becomes a draft again. */
export function reopen(session: Session, role: RoleId): SessionResult {
  const base = leaveRole(session);
  return withAdopted(
    fromTransition(base, reopenPart(base.questionnaire, base.form, role), (q) =>
      atSummary({ ...base, questionnaire: q }, role),
    ),
    role,
  );
}

export function leaveRole(session: Session): Session {
  const rest: Session = { ...session };
  Reflect.deleteProperty(rest, 'role');
  Reflect.deleteProperty(rest, 'stepKey');
  Reflect.deleteProperty(rest, 'editing');
  return rest;
}

/** The session with the other roles' decisions already copied in (for computing steps). */
function adoptedView(session: Session, role: RoleId): Session {
  return {
    ...session,
    questionnaire: adoptFromOtherRoles(session.questionnaire, session.form, role).questionnaire,
  };
}

/** Fields of the active role that another role decided, with that role's label. */
export function fixedFields(session: Session): ReadonlyMap<FieldId, string> {
  if (session.role === undefined) return new Map();
  const { definition } = session.form;
  const labels = new Map<FieldId, string>();
  for (const [id, { from }] of fixedByOtherRoles(session.questionnaire, definition, session.role)) {
    labels.set(id, definition.roles.find((role) => role.id === from)?.label ?? from);
  }
  return labels;
}

export function stepsFor(session: Session): InterviewStep[] {
  const part =
    session.role === undefined ? undefined : currentPart(session.questionnaire, session.role);
  if (!part || part.status !== 'draft' || session.role === undefined) return [];
  return interviewSteps(
    session.form.definition,
    session.role,
    part,
    new Set(fixedFields(session).keys()),
  );
}

export function currentStep(session: Session): InterviewStep | undefined {
  const steps = stepsFor(session);
  return steps.find((step) => step.key === session.stepKey) ?? steps[0];
}

export function goTo(session: Session, key: string): Session {
  const rest: Session = { ...session, stepKey: key };
  Reflect.deleteProperty(rest, 'editing');
  return rest;
}

/** "ändern" in the summary: after this answer and the follow-ups it opens, back to the summary. */
export function editFromSummary(session: Session, fieldId: FieldId): Session {
  return { ...session, stepKey: `question:${fieldId}`, editing: fieldId };
}

/** Where "Weiter" leads from the current step (after a summary edit: its follow-ups, then back). */
function nextTarget(session: Session): InterviewStep | undefined {
  const steps = stepsFor(session);
  const key = session.stepKey ?? '';
  if (session.editing !== undefined && steps.some((step) => step.key === key)) {
    return stepAfterEdit(session.form.definition, steps, key, session.editing);
  }
  return stepAfter(steps, key);
}

export function nextStep(session: Session): Session {
  const next = nextTarget(session);
  if (!next) return session;
  if (session.editing !== undefined && next.kind !== 'summary') {
    return { ...session, stepKey: next.key };
  }
  return goTo(session, next.key);
}

export interface NextChoice {
  /** Where "Weiter" leads. */
  next?: InterviewStep;
  /** "Weiter" ends a change from the summary there ("Zurück zur Zusammenfassung"). */
  backToSummary: boolean;
  /**
   * Only while revising, i.e. when "Weiter" would show an already answered question: the next
   * question without an answer (voluntary and deferred ones included), else the summary
   * ("Zur nächsten fehlenden Angabe").
   */
  skip?: InterviewStep;
}

export function nextChoice(session: Session): NextChoice {
  const next = nextTarget(session);
  const backToSummary = session.editing !== undefined && next?.kind === 'summary';
  if (backToSummary) {
    // Catching up from the summary: on to the next missing answer or notice, wherever it is.
    const missing = missingStepAround(
      stepsFor(session),
      session.stepKey ?? '',
      unconfirmedNotices(session),
    );
    return {
      ...(next ? { next } : {}),
      backToSummary,
      ...(missing.kind === 'summary' ? {} : { skip: missing }),
    };
  }
  if (next?.kind !== 'question' || next.state !== 'answered') {
    return { ...(next ? { next } : {}), backToSummary };
  }
  return { next, backToSummary, skip: nextMissingStep(stepsFor(session), session.stepKey ?? '') };
}

/**
 * "Zur nächsten fehlenden Angabe": past every answered question. While catching up from the
 * summary it stays a summary edit, so that question offers the way back and the next one again.
 */
export function skipToMissing(session: Session): Session {
  const steps = stepsFor(session);
  const key = session.stepKey ?? '';
  if (session.editing !== undefined) {
    const target = missingStepAround(steps, key, unconfirmedNotices(session));
    if (target.kind === 'question') return editFromSummary(session, target.fieldId);
    if (target.kind === 'notice') return noticeFromSummary(session, target.infoBlockId);
    return goTo(session, target.key);
  }
  return goTo(session, nextMissingStep(steps, key).key);
}

/** Notices of the active role not confirmed yet. */
function unconfirmedNotices(session: Session): ReadonlySet<string> {
  const role = session.role;
  if (role === undefined) return new Set();
  const confirmed = new Set(session.acknowledged[role] ?? []);
  return new Set(
    infoBlocksOfRole(session.form.definition, role)
      .map((block) => block.id)
      .filter((id) => !confirmed.has(id)),
  );
}

/** "bestätigen" in the summary: to that notice, and from there back to the summary. */
export function noticeFromSummary(session: Session, infoBlockId: string): Session {
  return { ...session, stepKey: `notice:${infoBlockId}`, editing: infoBlockId };
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
  const result = fromTransition(
    session,
    setValue(session.questionnaire, session.form, role, fieldId, raw),
  );
  if (!result.ok) return result;
  // Hints for the one filling in that read this answer (e.g. an SV number that does not fit the
  // birth name): a warning, never a refusal.
  const checks = fillingHints(result.session.questionnaire, session.form.definition, role)
    .filter((hint) => hint.fields.includes(fieldId))
    .map((hint) => [hint.message, ...hint.detail].join(' '));
  const warnings = [...result.warnings, ...checks];
  if (!session.masterData) return ok(result.session, warnings);
  // An answer may open a question the link can fill (e.g. the wage tax of a Minijob).
  const filled = fillMasterData(result.session, session.masterData.record);
  if (!filled.ok) return ok(result.session, warnings);
  return ok(filled.session, [...warnings, ...filled.skipped]);
}

export function defer(session: Session, fieldId: string): SessionResult {
  const role = activeRole(session);
  if (typeof role !== 'string') return role;
  return fromTransition(session, deferQuestion(session.questionnaire, session.form, role, fieldId));
}

/** "Leer lassen" for a skipped voluntary question (see leaveQuestionEmpty). */
export function leaveEmpty(session: Session, fieldId: string): SessionResult {
  const role = activeRole(session);
  if (typeof role !== 'string') return role;
  return fromTransition(
    session,
    leaveQuestionEmpty(session.questionnaire, session.form, role, fieldId),
  );
}

export function acknowledge(session: Session, infoBlockId: string, confirmed: boolean): Session {
  const role = session.role;
  if (role === undefined) return session;
  const current = new Set(session.acknowledged[role] ?? []);
  if (confirmed) current.add(infoBlockId);
  else current.delete(infoBlockId);
  const ids = [...current].sort();
  // Also in the draft, so "Zwischenstand speichern" keeps the confirmations (Tobias 2026-11-01).
  const questionnaire = withAcknowledged(session.questionnaire, role, ids);
  return {
    ...session,
    questionnaire,
    acknowledged: { ...session.acknowledged, [role]: ids },
    dirty: session.dirty || questionnaire !== session.questionnaire,
  };
}

/** One section of what a signature covers: the answers as people read them. */
export interface OverviewSection {
  title: string;
  rows: { fieldId: FieldId; label: string; value: string }[];
}

export interface SigningOverview {
  /** The answers the seal covers (hidden ones are left out, as at sealing), by section. */
  own: OverviewSection[];
  /** The other roles' sealed parts whose receipt the seal confirms. */
  others: { role: string; label: string; sections: OverviewSection[] }[];
}

function sectionsOf(
  definition: FormDefinition,
  role: RoleId,
  data: Readonly<Record<FieldId, FieldValue>>,
): OverviewSection[] {
  return definition.sections.flatMap((section) => {
    const rows = section.fields
      .filter((field) => field.role === role && field.id in data)
      .map((field) => ({
        fieldId: field.id,
        label: field.label,
        value: displayValue(field, data[field.id] ?? null),
      }));
    return rows.length === 0 ? [] : [{ title: section.title, rows }];
  });
}

/**
 * Everything the signature covers, shown above the confirmation (Tobias 2026-11-06: "es soll alles
 * gesehen werden, beim Unterschreiben, damit 'oben' stimmt"): the active role's answers as they will
 * be sealed, then the other roles' sealed parts.
 */
export function signingOverview(session: Session): SigningOverview | undefined {
  const role = session.role;
  const part = role === undefined ? undefined : currentPart(session.questionnaire, role);
  if (role === undefined || part?.status !== 'draft') return undefined;
  const { definition } = session.form;
  return {
    own: sectionsOf(definition, role, sealableData(definition, role, part.data)),
    others: definition.roles.flatMap((other) => {
      const sealed = other.id === role ? undefined : latestSealed(session.questionnaire, other.id);
      if (!sealed) return [];
      const sections = sectionsOf(definition, other.id, sealed.data);
      return sections.length === 0 ? [] : [{ role: other.id, label: other.label, sections }];
    }),
  };
}

export function summaryOf(session: Session): InterviewSummary | undefined {
  const role = session.role;
  const part = role === undefined ? undefined : currentPart(session.questionnaire, role);
  if (role === undefined || part?.status !== 'draft') return undefined;
  const summary = interviewSummary(
    session.form.definition,
    role,
    part,
    session.acknowledged[role] ?? [],
    new Set(fixedFields(session).keys()),
  );
  const excluded = outOfScopeOf(session);
  return excluded.length === 0 ? summary : { ...summary, outOfScope: excluded, readyToSign: false };
}

/** Special cases that hold for the questionnaire on this device (messages). */
export function outOfScopeOf(session: Session): string[] {
  return activeExclusions(session.questionnaire, session.form.definition).map((e) => e.message);
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

/**
 * Fills remembered master data (bookmark link) into the active role's draft and keeps the record
 * in the session, so later answers fill the questions they open. Refused values come back as
 * German lines ("Feld: Grund").
 */
export function fillMasterData(
  session: Session,
  stored: MasterData,
): { ok: true; session: Session; applied: string[]; skipped: string[] } | { ok: false } {
  const role = session.role;
  if (role === undefined) return { ok: false };
  const fills = session.masterData?.fills ?? {};
  const result = applyMasterData(session.questionnaire, session.form, role, stored, fills[role]);
  if (!result.ok) return { ok: false };
  const skipped = result.skipped.map((skip) => {
    const { message, detail } = transitionMessage(session.form, {
      ok: false,
      code: skip.code,
      detail: skip.detail,
    });
    return `${detail[0] ?? skip.fieldId}: ${message}`;
  });
  const changed = result.applied.length > 0 || result.cleared.length > 0;
  return {
    ok: true,
    session: {
      ...session,
      questionnaire: result.questionnaire,
      dirty: changed || session.dirty,
      masterData: { record: stored, fills: { ...fills, [role]: result.fills } },
    },
    applied: result.applied,
    skipped,
  };
}

/** Whether the answer to this question is still the one the master-data link filled in. */
/**
 * The role whose proposal (`fromRole.changeable`) the field still holds unchanged, e.g. the IBAN
 * the Kanzlei prefilled; undefined once the answer was changed.
 */
export function proposedBy(session: Session, fieldId: FieldId): string | undefined {
  const role = session.role;
  if (role === undefined) return undefined;
  const { definition } = session.form;
  const proposal = proposedByOtherRoles(session.questionnaire, definition, role).get(fieldId);
  const value = currentPart(session.questionnaire, role)?.data[fieldId] ?? null;
  if (!proposal || JSON.stringify(proposal.value) !== JSON.stringify(value)) return undefined;
  return definition.roles.find((other) => other.id === proposal.from)?.label ?? proposal.from;
}

export function filledFromLink(session: Session, fieldId: FieldId): boolean {
  const role = session.role;
  if (role === undefined) return false;
  const fill = session.masterData?.fills[role]?.[fieldId];
  const value = currentPart(session.questionnaire, role)?.data[fieldId] ?? null;
  return fill?.state === 'filled' && JSON.stringify(fill.value) === JSON.stringify(value);
}
