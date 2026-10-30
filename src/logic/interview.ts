// The interview: one step at a time, generated from the form definition (no AI, no network).
// Notices come first (inform before asking), then the role's available questions in form order —
// a follow-up appears right after the answer that opens it — and finally the summary before
// signing. The steps are recomputed after every answer; the UI only keeps the current step's key.
// Answers that no longer apply stay in the draft (they come back if the condition holds again)
// and are only dropped at signing; the summary lists them so this never happens unseen.
import { fieldDependencies } from './dependencies';
import { describeFieldRules, fieldStates, infoBlocksOfRole, type PartData } from './form';
import type { FieldId, FormDefinition, Part, RoleId } from './model';
import { describeValidity, outsideValidity } from './validity';

export type QuestionState = 'answered' | 'deferred' | 'open';

export type InterviewStep =
  | { kind: 'notice'; key: string; infoBlockId: string }
  | {
      kind: 'question';
      key: string;
      fieldId: FieldId;
      sectionId: string;
      /** 0 = independent; n = rests on an answer of level n-1 (indentation). */
      level: number;
      required: boolean;
      state: QuestionState;
    }
  | { kind: 'summary'; key: 'summary' };

/** What the interview reads of a draft. */
export interface DraftView {
  data: PartData;
  deferred?: Part['deferred'];
}

/**
 * `fixed`: fields another role decided (fromRole) — they are not asked; the summary shows them.
 */
export function interviewSteps(
  definition: FormDefinition,
  role: RoleId,
  draft: DraftView,
  fixed: ReadonlySet<FieldId> = new Set(),
): InterviewStep[] {
  const states = fieldStates(definition, role, draft.data);
  const dependencies = fieldDependencies(definition);
  const deferred = new Set(draft.deferred ?? []);
  const notices: InterviewStep[] = infoBlocksOfRole(definition, role).map((block) => ({
    kind: 'notice',
    key: `notice:${block.id}`,
    infoBlockId: block.id,
  }));
  const questions: InterviewStep[] = definition.sections.flatMap((section) =>
    section.fields
      .filter(
        (field) =>
          field.role === role && states.get(field.id)?.visible === true && !fixed.has(field.id),
      )
      .map((field) => ({
        kind: 'question' as const,
        key: `question:${field.id}`,
        fieldId: field.id,
        sectionId: section.id,
        level: dependencies.get(field.id)?.level ?? 0,
        required: states.get(field.id)?.required === true,
        state: questionState(draft, deferred, field.id),
      })),
  );
  return [...notices, ...questions, { kind: 'summary', key: 'summary' }];
}

function questionState(
  draft: DraftView,
  deferred: ReadonlySet<FieldId>,
  id: FieldId,
): QuestionState {
  if ((draft.data[id] ?? null) !== null) return 'answered';
  return deferred.has(id) ? 'deferred' : 'open';
}

/**
 * The step after `key` in the freshly computed steps. If `key` vanished (its condition no longer
 * holds), the interview continues with the first step that follows it in form order.
 */
export function stepAfter(
  steps: readonly InterviewStep[],
  key: string,
  previousSteps: readonly InterviewStep[] = steps,
): InterviewStep | undefined {
  const index = steps.findIndex((step) => step.key === key);
  if (index >= 0) return steps[index + 1];
  const previous = previousSteps.findIndex((step) => step.key === key);
  for (let i = previous - 1; i >= 0; i--) {
    const at = steps.findIndex((step) => step.key === previousSteps[i]?.key);
    if (at >= 0) return steps[at + 1];
  }
  return steps[0];
}

export function stepBefore(
  steps: readonly InterviewStep[],
  key: string,
): InterviewStep | undefined {
  const index = steps.findIndex((step) => step.key === key);
  return index > 0 ? steps[index - 1] : undefined;
}

/**
 * "Zur nächsten fehlenden Angabe" while revising: the next question after `key` without an answer
 * — voluntary ones and those put back with "Weiß ich gerade nicht" included (Tobias 2026-10-30) —
 * else the summary.
 */
export function nextMissingStep(steps: readonly InterviewStep[], key: string): InterviewStep {
  const from = steps.findIndex((step) => step.key === key);
  const missing = steps
    .slice(from + 1)
    .find((step) => step.kind === 'question' && step.state !== 'answered');
  return missing ?? steps[steps.length - 1] ?? { kind: 'summary', key: 'summary' };
}

/**
 * The step after `key` while changing an answer from the summary: the open follow-ups that the
 * changed answer (`edited`) opened, directly or through other follow-ups — then back to the
 * summary instead of walking through every later question again.
 */
export function stepAfterEdit(
  definition: FormDefinition,
  steps: readonly InterviewStep[],
  key: string,
  edited: FieldId,
): InterviewStep {
  const dependencies = fieldDependencies(definition);
  const opened = new Set<FieldId>();
  const collect = (id: FieldId) => {
    for (const child of dependencies.get(id)?.enables ?? []) {
      if (opened.has(child)) continue;
      opened.add(child);
      collect(child);
    }
  };
  collect(edited);
  const from = steps.findIndex((step) => step.key === key);
  const next = steps
    .slice(from + 1)
    .find((step) => step.kind === 'question' && step.state === 'open' && opened.has(step.fieldId));
  return next ?? steps[steps.length - 1] ?? { kind: 'summary', key: 'summary' };
}

/** Where to continue, e.g. after loading an interim state: the first open question, else the summary. */
export function resumeStep(steps: readonly InterviewStep[]): InterviewStep {
  const open = steps.find((step) => step.kind === 'question' && step.state === 'open');
  return open ?? steps[steps.length - 1] ?? { kind: 'summary', key: 'summary' };
}

export interface InterviewProgress {
  answered: number;
  deferred: number;
  open: number;
  /** Questions available right now; follow-ups can still be added. */
  total: number;
}

export function interviewProgress(steps: readonly InterviewStep[]): InterviewProgress {
  const progress = { answered: 0, deferred: 0, open: 0, total: 0 };
  for (const step of steps) {
    if (step.kind !== 'question') continue;
    progress[step.state] += 1;
    progress.total += 1;
  }
  return progress;
}

export interface InterviewSummary {
  /** Required, available and unanswered — deferred or not; signing is refused until answered. */
  missingRequired: FieldId[];
  /** Available questions put back with "Weiß ich gerade nicht" (optional ones included). */
  deferred: FieldId[];
  /** Answers kept in the draft whose condition no longer holds — they are not signed. */
  inactive: { fieldId: FieldId; reason: string }[];
  /** Notices of the role not yet confirmed. */
  missingNotices: string[];
  /**
   * The reference date this role states lies outside the form version's validity, as people read
   * it, with the validity — signing is refused until it fits.
   */
  outsideValidity?: { value: string; validity: string };
  readyToSign: boolean;
}

export function interviewSummary(
  definition: FormDefinition,
  role: RoleId,
  draft: DraftView,
  acknowledged: readonly string[],
  fixed: ReadonlySet<FieldId> = new Set(),
): InterviewSummary {
  const states = fieldStates(definition, role, draft.data);
  const fields = definition.sections.flatMap((section) => section.fields);
  const missingRequired = [...states].filter(([, state]) => state.missing).map(([id]) => id);
  const deferred = (draft.deferred ?? []).filter((id) => states.get(id)?.visible === true);
  const inactive = fields
    .filter(
      (field) =>
        field.role === role &&
        !fixed.has(field.id) &&
        states.get(field.id)?.visible === false &&
        (draft.data[field.id] ?? null) !== null,
    )
    .map((field) => ({ fieldId: field.id, reason: describeFieldRules(definition, field).input }));
  const outside = outsideValidity(definition, role, draft.data);
  const missingNotices = infoBlocksOfRole(definition, role)
    .map((block) => block.id)
    .filter((id) => !acknowledged.includes(id));
  return {
    missingRequired,
    deferred,
    inactive,
    missingNotices,
    ...(outside === undefined
      ? {}
      : { outsideValidity: { value: outside, validity: describeValidity(definition) ?? '' } }),
    readyToSign:
      missingRequired.length === 0 && missingNotices.length === 0 && outside === undefined,
  };
}
