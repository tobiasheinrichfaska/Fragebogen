// Every form and draft played through as a person does (2026-11-13, after the bug of 2026-11-12:
// a confirmation page lay before the start of a role and only turned up as missing in the
// summary). Each role in turn is entered fresh and walked with "Weiter" only, answering with
// invented values (tests/support/sampleAnswers.ts), in two variants of the choices. Whatever the
// summary then reports as missing must have been shown on the way, and the chain must reach every
// role the questionnaire needs — so a new form is covered the day it is added.
import { fieldsById } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import type { FieldDefinition, RoleDefinition } from '../../src/logic/model';
import {
  acknowledge,
  answer,
  currentStep,
  defer,
  enterRole,
  nextStep,
  roleStates,
  seal,
  startSession,
  stepsFor,
  summaryOf,
  type Session,
} from '../../src/logic/session';
import { candidates, STRATEGIES, type Strategy } from '../support/sampleAnswers';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const AT = { local: '2026-11-13T10:00:00.000+01:00', utc: '2026-11-13T09:00:00.000Z' };
const MAX_STEPS = 600;

const FORMS: [string, RegisteredForm][] = [FORMS_DIR, DRAFTS_DIR]
  .flatMap((dir) => definitionFiles(dir).filter((f) => f.file.endsWith('.json')))
  .map((f) => [`${f.folder} ${f.file.replace(/\.json$/, '')}`, registeredFrom(readJson(f.path))]);

interface RoleWalk {
  role: string;
  startKey: string | undefined;
  firstKey: string | undefined;
  visited: string[];
  /** Questions no invented answer satisfied and that could not be put back either. */
  unanswerable: string[];
  /** Missing at the summary although never shown on the way. */
  notShown: string[];
  /** A special case the form is not made for (exclusion): signing is refused, as it should be. */
  specialCase?: string[];
  sealProblem?: string;
}

interface Walk {
  roles: RoleWalk[];
  /** Roles still to fill when the walk ended (none when the chain is complete). */
  open: string[];
}

function must(result: ReturnType<typeof enterRole>): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}

/** The first invented answer the app takes, else "Vorerst überspringen". */
function answerQuestion(
  s: Session,
  field: FieldDefinition,
  strategy: Strategy,
): { session: Session; answered: boolean } {
  for (const raw of candidates(s.form.definition, field, strategy)) {
    const result = answer(s, field.id, raw);
    if (result.ok) return { session: result.session, answered: true };
  }
  const deferred = defer(s, field.id);
  return { session: deferred.ok ? deferred.session : s, answered: false };
}

function walkRole(base: Session, role: RoleDefinition, strategy: Strategy, nonce: string) {
  let s = must(enterRole(base, role.id));
  const fields = fieldsById(s.form.definition);
  const walk: RoleWalk = {
    role: role.id,
    startKey: currentStep(s)?.key,
    firstKey: stepsFor(s)[0]?.key,
    visited: [],
    unanswerable: [],
    notShown: [],
  };
  for (let i = 0; i < MAX_STEPS; i++) {
    const step = currentStep(s);
    if (!step || step.kind === 'summary') break;
    walk.visited.push(step.key);
    if (step.kind === 'notice') {
      s = acknowledge(s, step.infoBlockId, true);
    } else {
      const field = fields.get(step.fieldId);
      if (!field) throw new Error(`no field ${step.fieldId}`);
      // "first" keeps a preset answer as most people do; the others change it, or the branch
      // behind it (e.g. a second account holder) is never reached.
      const preset = field.initial !== undefined && strategy !== 'first';
      if (step.state !== 'answered' || preset) {
        const done = answerQuestion(s, field, strategy);
        s = done.session;
        if (!done.answered && step.required) walk.unanswerable.push(step.fieldId);
      }
    }
    const moved = nextStep(s);
    if (moved.stepKey === s.stepKey) throw new Error(`stuck at ${step.key} (${role.id})`);
    s = moved;
    if (i === MAX_STEPS - 1) throw new Error(`more than ${MAX_STEPS} steps (${role.id})`);
  }
  const summary = summaryOf(s);
  const shown = new Set(walk.visited);
  walk.notShown = [
    ...(summary?.missingNotices ?? []).map((id) => `notice:${id}`),
    ...(summary?.missingRequired ?? []).map((id) => `question:${id}`),
  ].filter((key) => !shown.has(key));
  if (summary?.outOfScope?.length) {
    walk.specialCase = summary.outOfScope;
    return { session: s, walk, sealed: false };
  }
  const sealed = seal(s, {
    nonce,
    systemNote: note(AT.local, AT.utc),
    ...(role.signature === 'none'
      ? {}
      : { signature: { method: 'typed' as const, name: 'Erika Musterfrau' } }),
    now: AT,
  });
  if (!sealed.ok) walk.sealProblem = [sealed.message, ...sealed.detail].join(' ');
  return { session: sealed.ok ? sealed.session : s, walk, sealed: sealed.ok };
}

function walkForm(form: RegisteredForm, strategy: Strategy): Walk {
  let s = startSession(form, QUESTIONNAIRE_ID);
  const roles: RoleWalk[] = [];
  const toFill = (session: Session) =>
    roleStates(session).filter(
      (state) =>
        state.state === 'missing' && !state.notNeeded && state.requirement.reason !== 'pending',
    );
  for (let round = 0; round < form.definition.roles.length; round++) {
    const next = toFill(s)[0];
    if (!next) break;
    const nonce = (round + 1).toString(16).padStart(2, '0').repeat(16);
    const done = walkRole(s, next.role, strategy, nonce);
    roles.push(done.walk);
    s = done.session;
    if (!done.sealed) break;
  }
  return { roles, open: toFill(s).map((state) => state.role.id) };
}

const WALKS_BY_FORM = FORMS.map(
  ([name, form]) => [name, STRATEGIES.map((strategy) => walkForm(form, strategy))] as const,
);
const WALKS = WALKS_BY_FORM.flatMap(([name, walks]) =>
  walks.map((walk, i) => [`${name}, ${STRATEGIES[i] ?? ''}`, walk] as const),
);
const complete = (walk: Walk) =>
  walk.open.length === 0 && walk.roles.every((r) => !r.sealProblem && !r.specialCase);

describe.each(WALKS)('walking %s with „Weiter“', (_name, walk) => {
  it('enters every role at its first step', () => {
    expect(walk.roles.map((r) => [r.role, r.startKey])).toEqual(
      walk.roles.map((r) => [r.role, r.firstKey]),
    );
  });

  it('shows on the way everything the summary reports as missing', () => {
    expect(walk.roles.flatMap((r) => r.notShown.map((key) => `${r.role}: ${key}`))).toEqual([]);
  });

  it('answers every question it is asked with an invented value', () => {
    expect(walk.roles.flatMap((r) => r.unanswerable.map((id) => `${r.role}: ${id}`))).toEqual([]);
  });

  it('completes every role the questionnaire needs, unless a special case stops it', () => {
    expect(
      walk.roles.flatMap((r) => (r.sealProblem ? [`${r.role}: ${r.sealProblem}`] : [])),
    ).toEqual([]);
    if (walk.roles.some((r) => r.specialCase)) return;
    expect(walk.open).toEqual([]);
  });
});

describe.each(WALKS_BY_FORM)('%s', (_name, walks) => {
  it('is walked to its end in at least one variant, not only up to a special case', () => {
    expect(walks.some(complete)).toBe(true);
  });
});

it('walks the published forms and the drafts', () => {
  expect(FORMS.map(([name]) => name)).toEqual(
    expect.arrayContaining(['personalfragebogen 1.0.0', 'steuerfreigabe 0.1.0']),
  );
});
