import { QUESTIONNAIRE_ID, chainForm, ok } from '../../tests/support/sample';
import {
  interviewProgress,
  interviewSteps,
  interviewSummary,
  resumeStep,
  stepAfter,
  stepBefore,
  type InterviewStep,
} from './interview';
import type { Questionnaire } from './model';
import {
  createQuestionnaire,
  currentPart,
  deferQuestion,
  setValue,
  startPart,
} from './questionnaire';

const form = chainForm();
const { definition } = form;

const start = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
const set = (q: Questionnaire, values: Readonly<Record<string, unknown>>) =>
  Object.entries(values).reduce((acc, [id, raw]) => ok(setValue(acc, form, 'person', id, raw)), q);
const draftOf = (q: Questionnaire) => {
  const part = currentPart(q, 'person');
  if (!part) throw new Error('no draft');
  return part;
};
const steps = (q: Questionnaire) => interviewSteps(definition, 'person', draftOf(q));
const keys = (list: readonly InterviewStep[]) => list.map((step) => step.key);

describe('interviewSteps', () => {
  it('informs first, then asks the available questions in form order, then sums up', () => {
    expect(keys(steps(start()))).toEqual([
      'notice:datenschutz',
      'question:nachname',
      'question:geburtsdatum',
      'question:steuerId',
      'question:weitereBeschaeftigung',
      'question:bemerkungen',
      'summary',
    ]);
  });

  it('puts every follow-up right after the answer that opens it, one level deeper', () => {
    let q = set(start(), { weitereBeschaeftigung: true });
    expect(stepAfter(steps(q), 'question:weitereBeschaeftigung')).toMatchObject({
      key: 'question:weitereArt',
      level: 1,
      required: true,
    });
    q = set(q, { weitereArt: 'sv' });
    expect(stepAfter(steps(q), 'question:weitereArt')).toMatchObject({
      key: 'question:weitereFirma',
      level: 2,
    });
    q = set(q, { weitereFirma: 'Beispiel GmbH' });
    expect(stepAfter(steps(q), 'question:weitereFirma')).toMatchObject({
      key: 'question:weitereStunden',
      level: 3,
    });
  });

  it('continues after the vanished step when an answer removes the current question', () => {
    const before = steps(set(start(), { weitereBeschaeftigung: true }));
    const after = steps(set(start(), { weitereBeschaeftigung: false }));
    expect(stepAfter(after, 'question:weitereArt', before)?.key).toBe('question:bemerkungen');
    expect(stepAfter(after, 'question:gibtEsNicht')?.key).toBe('notice:datenschutz');
  });

  it('goes back step by step and stops at the first step', () => {
    const list = steps(start());
    expect(stepBefore(list, 'question:nachname')?.key).toBe('notice:datenschutz');
    expect(stepBefore(list, 'notice:datenschutz')).toBeUndefined();
  });

  it('marks answered, deferred and open questions and resumes at the first open one', () => {
    let q = set(start(), { nachname: 'Musterfrau' });
    q = ok(deferQuestion(q, form, 'person', 'geburtsdatum'));
    const list = steps(q);
    const state = (id: string) =>
      list.find((step) => step.kind === 'question' && step.fieldId === id);
    expect(state('nachname')).toMatchObject({ state: 'answered' });
    expect(state('geburtsdatum')).toMatchObject({ state: 'deferred' });
    expect(resumeStep(list).key).toBe('question:steuerId');
    expect(interviewProgress(list)).toEqual({ answered: 1, deferred: 1, open: 3, total: 5 });
  });

  it('resumes at the summary once nothing is open', () => {
    const q = set(start(), {
      nachname: 'Musterfrau',
      geburtsdatum: '17.05.1990',
      steuerId: '86 095 742 719',
      weitereBeschaeftigung: false,
      bemerkungen: 'keine',
    });
    expect(resumeStep(steps(q)).key).toBe('summary');
  });
});

describe('interviewSummary', () => {
  const complete = {
    nachname: 'Musterfrau',
    geburtsdatum: '17.05.1990',
    steuerId: '86 095 742 719',
    weitereBeschaeftigung: false,
  };

  it('lists open required answers, deferred ones included, and unconfirmed notices', () => {
    let q = set(start(), { nachname: 'Musterfrau' });
    q = ok(deferQuestion(q, form, 'person', 'steuerId'));
    q = ok(deferQuestion(q, form, 'person', 'bemerkungen'));
    expect(interviewSummary(definition, 'person', draftOf(q), [])).toEqual({
      missingRequired: ['geburtsdatum', 'steuerId', 'weitereBeschaeftigung'],
      deferred: ['steuerId', 'bemerkungen'],
      inactive: [],
      missingNotices: ['datenschutz'],
      readyToSign: false,
    });
  });

  it('is ready to sign when only optional questions are deferred', () => {
    const q = ok(deferQuestion(set(start(), complete), form, 'person', 'bemerkungen'));
    expect(interviewSummary(definition, 'person', draftOf(q), ['datenschutz'])).toMatchObject({
      missingRequired: [],
      deferred: ['bemerkungen'],
      readyToSign: true,
    });
  });

  it('keeps answers that no longer apply, names them with the reason, and restores them', () => {
    const answered = set(start(), {
      ...complete,
      weitereBeschaeftigung: true,
      weitereArt: 'sv',
      weitereFirma: 'Beispiel GmbH',
      weitereStunden: '20',
    });
    const switched = set(answered, { weitereBeschaeftigung: false });
    expect(interviewSummary(definition, 'person', draftOf(switched), []).inactive).toEqual([
      {
        fieldId: 'weitereArt',
        reason: 'erst wenn „Üben Sie eine weitere Beschäftigung aus?“ mit „Ja“ beantwortet ist',
      },
      {
        fieldId: 'weitereFirma',
        reason:
          'erst wenn bei „Art der weiteren Beschäftigung“ „Sozialversicherungspflichtig“ gewählt ist',
      },
      {
        fieldId: 'weitereStunden',
        reason:
          'erst wenn „Üben Sie eine weitere Beschäftigung aus?“ mit „Ja“ beantwortet ist und „Firma der weiteren Beschäftigung“ ausgefüllt ist',
      },
    ]);
    const restored = set(switched, { weitereBeschaeftigung: true });
    expect(draftOf(restored).data).toMatchObject({
      weitereArt: 'sv',
      weitereFirma: 'Beispiel GmbH',
      weitereStunden: '20',
    });
    expect(interviewSummary(definition, 'person', draftOf(restored), []).inactive).toEqual([]);
  });
});
