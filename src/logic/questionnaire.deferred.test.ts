import {
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  chainForm,
  ok,
  personSealInput,
} from '../../tests/support/sample';
import { canonicalize } from './jcs';
import type { Questionnaire } from './model';
import {
  createQuestionnaire,
  currentPart,
  deferQuestion,
  sealPart,
  setValue,
  startPart,
} from './questionnaire';
import { decodeQuestionnaire } from './questionnaireFile';

const form = chainForm();
const start = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
const defer = (q: Questionnaire, id: string) => ok(deferQuestion(q, form, 'person', id));
const deferredOf = (q: Questionnaire) => currentPart(q, 'person')?.deferred;

describe('deferQuestion — "Weiß ich gerade nicht"', () => {
  it('marks questions in form order, whatever the order of deferring', () => {
    const q = defer(defer(start(), 'steuerId'), 'nachname');
    expect(deferredOf(q)).toEqual(['nachname', 'steuerId']);
    expect(deferredOf(defer(q, 'nachname'))).toEqual(['nachname', 'steuerId']);
  });

  it('ends the mark with an answer; clearing an answer keeps it', () => {
    let q = defer(defer(start(), 'nachname'), 'steuerId');
    q = ok(setValue(q, form, 'person', 'nachname', 'Musterfrau'));
    expect(deferredOf(q)).toEqual(['steuerId']);
    q = ok(setValue(q, form, 'person', 'steuerId', null));
    expect(deferredOf(q)).toEqual(['steuerId']);
    q = ok(setValue(q, form, 'person', 'steuerId', '86 095 742 719'));
    expect(currentPart(q, 'person')).not.toHaveProperty('deferred');
  });

  it.each<[string, (q: Questionnaire) => Questionnaire, string, string]>([
    [
      'an answered question',
      (q) => ok(setValue(q, form, 'person', 'nachname', 'M')),
      'nachname',
      'alreadyAnswered',
    ],
    ['a question not yet available', (q) => q, 'weitereArt', 'fieldNotAvailable'],
    ["another role's question", (q) => q, 'eintritt', 'notOwnField'],
    ['an unknown question', (q) => q, 'gibtEsNicht', 'unknownField'],
  ])('refuses %s', (_label, prepare, id, code) => {
    const result = deferQuestion(prepare(start()), form, 'person', id);
    expect(result.ok ? 'accepted' : result.code).toBe(code);
  });

  it('needs an open draft', () => {
    const result = deferQuestion(
      createQuestionnaire(QUESTIONNAIRE_ID, form),
      form,
      'person',
      'nachname',
    );
    expect(result.ok ? 'accepted' : result.code).toBe('noDraft');
  });

  it('still requires a deferred required answer before signing', () => {
    const values = Object.fromEntries(
      Object.entries(PERSON_VALUES).filter(([id]) => id !== 'steuerId'),
    );
    let q = defer(start(), 'steuerId');
    q = Object.entries(values).reduce(
      (acc, [id, raw]) => ok(setValue(acc, form, 'person', id, raw)),
      q,
    );
    const refused = sealPart(q, form, 'person', personSealInput());
    expect(refused.ok ? 'accepted' : [refused.code, ...refused.detail]).toEqual([
      'missingRequired',
      'steuerId',
    ]);
  });

  it('never seals the mark and drops answers that no longer apply', () => {
    let q = defer(start(), 'bemerkungen');
    q = Object.entries({ ...PERSON_VALUES, bemerkungen: null }).reduce(
      (acc, [id, raw]) => ok(setValue(acc, form, 'person', id, raw)),
      q,
    );
    q = ok(setValue(q, form, 'person', 'weitereBeschaeftigung', false));
    expect(currentPart(q, 'person')?.data.weitereArt).toBe('minijob');
    const sealed = currentPart(ok(sealPart(q, form, 'person', personSealInput())), 'person');
    expect(sealed).not.toHaveProperty('deferred');
    expect(sealed?.data).not.toHaveProperty('weitereArt');
  });
});

describe('deferred questions in the interim file', () => {
  it('survive saving and loading the interim state unchanged', () => {
    const q = defer(defer(start(), 'steuerId'), 'nachname');
    const raw: unknown = JSON.parse(JSON.stringify(q));
    const result = decodeQuestionnaire(raw);
    expect(result.ok ? [] : result.issues).toEqual([]);
    if (result.ok) expect(canonicalize(result.questionnaire)).toBe(canonicalize(raw));
  });

  it.each<[string, (part: Record<string, unknown>) => void, string]>([
    [
      'on a sealed part',
      (part) => {
        part.status = 'sealed';
      },
      'only drafts',
    ],
    [
      'listing a question twice',
      (part) => {
        part.deferred = ['nachname', 'nachname'];
      },
      'twice',
    ],
    [
      'as an empty list',
      (part) => {
        part.deferred = [];
      },
      'needs at least 1',
    ],
  ])('are refused %s', (_label, mutate, message) => {
    const raw = JSON.parse(JSON.stringify(defer(start(), 'nachname'))) as {
      parts: { person: Record<string, unknown>[] };
    };
    const part = raw.parts.person[0];
    if (!part) throw new Error('no part');
    mutate(part);
    const result = decodeQuestionnaire(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.message).join(' ')).toContain(message);
  });
});
