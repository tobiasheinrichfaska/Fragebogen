import { QUESTIONNAIRE_ID, fill, linkedForm, ok } from '../../tests/support/sample';
import { applyMasterData, masterDataOf } from './masterData';
import type { Questionnaire } from './model';
import { createQuestionnaire, currentPart, startPart } from './questionnaire';

const form = linkedForm();
const { definition } = form;

function employerDraft(values: Readonly<Record<string, unknown>> = {}): Questionnaire {
  const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
  return fill(q, 'arbeitgeber', values, form);
}

const dataOf = (q: Questionnaire) => currentPart(q, 'arbeitgeber')?.data ?? {};

describe('masterDataOf', () => {
  it("collects the role's answered master data by key", () => {
    const q = employerDraft({ agFirma: ' Beispiel   GmbH ', agNachname: 'Musterfrau' });
    expect(masterDataOf(definition, 'arbeitgeber', dataOf(q))).toEqual({ firma: 'Beispiel GmbH' });
  });

  it('leaves out unanswered fields and fields without a key', () => {
    expect(masterDataOf(definition, 'arbeitgeber', dataOf(employerDraft()))).toEqual({});
    expect(masterDataOf(definition, 'person', { nachname: 'Musterfrau' })).toEqual({});
  });
});

describe('applyMasterData', () => {
  it('fills empty fields and ignores keys of other forms', () => {
    const result = applyMasterData(employerDraft(), form, 'arbeitgeber', {
      firma: 'Beispiel GmbH',
      kostenstelle: '4711',
    });
    if (!result.ok) throw new Error(result.code);
    expect([result.applied, result.kept, result.skipped]).toEqual([['agFirma'], [], []]);
    expect(dataOf(result.questionnaire).agFirma).toBe('Beispiel GmbH');
  });

  it('keeps an answer already given', () => {
    const result = applyMasterData(employerDraft({ agFirma: 'Andere GmbH' }), form, 'arbeitgeber', {
      firma: 'Beispiel GmbH',
    });
    if (!result.ok) throw new Error(result.code);
    expect([result.applied, result.kept]).toEqual([[], ['agFirma']]);
    expect(dataOf(result.questionnaire).agFirma).toBe('Andere GmbH');
  });

  it('reports a remembered value the form refuses, with its reason', () => {
    const result = applyMasterData(employerDraft(), form, 'arbeitgeber', { firma: 42 });
    if (!result.ok) throw new Error(result.code);
    expect(result.skipped).toEqual([
      { fieldId: 'agFirma', key: 'firma', code: 'invalidValue', detail: ['agFirma', 'value.type'] },
    ]);
    expect(dataOf(result.questionnaire).agFirma).toBeUndefined();
  });

  it('normalises remembered text exactly like typed input', () => {
    const result = applyMasterData(employerDraft(), form, 'arbeitgeber', {
      firma: ' Beispiel\tGmbH ',
    });
    if (!result.ok) throw new Error(result.code);
    expect(dataOf(result.questionnaire).agFirma).toBe('Beispiel GmbH');
  });

  it('round-trips what masterDataOf returned', () => {
    const remembered = masterDataOf(
      definition,
      'arbeitgeber',
      dataOf(employerDraft({ agFirma: 'Beispiel GmbH' })),
    );
    const result = applyMasterData(employerDraft(), form, 'arbeitgeber', remembered);
    if (!result.ok) throw new Error(result.code);
    expect(masterDataOf(definition, 'arbeitgeber', dataOf(result.questionnaire))).toEqual(
      remembered,
    );
  });

  it.each<[string, unknown]>([
    ['an array', []],
    ['null', null],
    ['a string', 'firma'],
  ])('refuses %s as record', (_label, stored) => {
    expect(applyMasterData(employerDraft(), form, 'arbeitgeber', stored)).toEqual({
      ok: false,
      code: 'invalidRecord',
    });
  });

  it('needs an open draft of the role', () => {
    const q = createQuestionnaire(QUESTIONNAIRE_ID, form);
    expect(applyMasterData(q, form, 'arbeitgeber', { firma: 'Beispiel GmbH' })).toEqual({
      ok: false,
      code: 'noDraft',
    });
  });
});
