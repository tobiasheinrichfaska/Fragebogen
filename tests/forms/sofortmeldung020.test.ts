// Sofortmeldung 0.2.0 draft (review of 2026-10-30): "abroad?" before the postcode, a German
// postcode is checked, a foreign one is free text; quick answers and the birth-name placeholder.
import { join } from 'node:path';
import { fillPlaceholders } from '../../src/logic/display';
import { fieldsById, visibleFields } from '../../src/logic/form';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '0.2.0.json')));
const fields = fieldsById(form.definition);
const person = () => ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));

describe('Sofortmeldung 0.2.0 draft', () => {
  it('asks "abroad?" before the postcode', () => {
    const order = visibleFields(form.definition, 'person', { anschriftAusland: false }).map(
      (f) => f.id,
    );
    expect(order.indexOf('anschriftAusland')).toBeLessThan(order.indexOf('postleitzahl'));
    expect(order).not.toContain('postleitzahlAusland');
  });

  it('checks a German postcode and takes a foreign one as text', () => {
    const refused = setValue(person(), form, 'person', 'postleitzahl', '1234');
    expect(refused).toMatchObject({ ok: false, code: 'invalidValue' });
    expect(
      ok(setValue(person(), form, 'person', 'postleitzahl', '76131')).parts.person?.[0]?.data
        .postleitzahl,
    ).toBe('76131');

    let abroad = ok(setValue(person(), form, 'person', 'anschriftAusland', true));
    abroad = ok(setValue(abroad, form, 'person', 'postleitzahlAusland', 'SW1A 1AA'));
    expect(abroad.parts.person?.[0]?.data.postleitzahlAusland).toBe('SW1A 1AA');
    expect(setValue(abroad, form, 'person', 'postleitzahl', '76131')).toMatchObject({
      ok: false,
      code: 'fieldNotAvailable',
    });
  });

  it('offers quick answers where most people give the same answer', () => {
    expect(fields.get('geburtsland')?.quickAnswers).toEqual([
      { label: 'Deutschland', value: 'Deutschland' },
    ]);
    expect(fields.get('versicherungsnummer')?.quickAnswers).toEqual([
      { label: 'Kenne ich nicht', value: null },
    ]);
    expect(fields.get('anschriftZusatz')?.quickAnswers).toEqual([
      { label: 'Kein Zusatz', value: null },
    ]);
  });

  it('names the family name just given in the birth-name question', () => {
    const question = fields.get('geburtsnameWieFamilienname')?.question ?? '';
    expect(
      fillPlaceholders(
        question,
        (id) => fields.get(id),
        () => 'Müller-Lüdenscheidt',
      ),
    ).toBe(
      'Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „Müller-Lüdenscheidt“?',
    );
  });

  it('explains why the signature in the app suffices', () => {
    expect(form.definition.signatureBasis).toContain('Art. 3 Nr. 10');
  });
});
