import {
  PERSON_VALUES,
  QUESTIONNAIRE_ID,
  fill,
  linkedForm,
  ok,
  personSealInput,
} from '../../tests/support/sample';
import { initialData, missingRequired } from './form';
import { createQuestionnaire, currentPart, sealPart, setValue, startPart } from './questionnaire';

describe('preselected answers (initial)', () => {
  const form = linkedForm();
  const started = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));

  it('start the first version of the role', () => {
    expect(currentPart(started(), 'person')?.data).toEqual({ weitereBeschaeftigung: false });
    expect(initialData(form.definition, 'arbeitgeber')).toEqual({});
  });

  it('count as an answer and can be changed like any other', () => {
    const q = started();
    const data = currentPart(q, 'person')?.data ?? {};
    expect(missingRequired(form.definition, 'person', data)).not.toContain('weitereBeschaeftigung');
    const changed = ok(setValue(q, form, 'person', 'weitereBeschaeftigung', true));
    expect(
      missingRequired(form.definition, 'person', currentPart(changed, 'person')?.data ?? {}),
    ).toContain('weitereArt');
  });

  it('never override the data of an earlier version', () => {
    let q = fill(started(), 'person', PERSON_VALUES, form);
    q = ok(sealPart(q, form, 'person', personSealInput()));
    q = ok(startPart(q, form, 'person'));
    expect(currentPart(q, 'person')?.data).toMatchObject({
      weitereBeschaeftigung: true,
      weitereArt: 'minijob',
    });
  });
});
