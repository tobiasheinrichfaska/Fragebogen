// Date order in the forms (Tobias 2026-11-13, choice "1": a bound to another field, in new form
// versions). Found by the walk over every form: the Personalfragebogen 1.0.0 took an end of a fixed
// term before the start without a word and then called it a term of under a week. Version 1.1.0
// (draft) refuses it as it is typed; 1.0.0 stays frozen as it was published.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { answer, enterRole, startSession, type Session } from '../../src/logic/session';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const pfb100 = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
const pfb110 = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json')));
const austritt = registeredFrom(readJson(join(DRAFTS_DIR, 'austritt', '0.1.0.json')));

function employer(form: RegisteredForm, values: Record<string, unknown>): Session {
  const entered = enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber');
  if (!entered.ok) throw new Error(entered.message);
  return Object.entries(values).reduce((s, [id, raw]) => {
    const result = answer(s, id, raw);
    if (!result.ok) throw new Error(`${id}: ${result.message}`);
    return result.session;
  }, entered.session);
}

const FIXED_TERM = {
  agBeschaeftigungsbeginn: '01.11.2026',
  agBeschaeftigungsart: 'svpflichtig',
  agBefristet: true,
};

describe('Personalfragebogen: the end of a fixed term', () => {
  it('1.1.0 refuses an end before the start of employment, naming the start', () => {
    const result = answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '17.05.2026');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt vor „Tag der Beschäftigungsaufnahme“ (01.11.2026).',
    );
  });

  it('1.1.0 takes an end on or after the start', () => {
    expect(answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '01.11.2026').ok).toBe(true);
    expect(answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '30.04.2027').ok).toBe(true);
  });

  it('1.0.0 stays as it was published: frozen, without the rule', () => {
    expect(answer(employer(pfb100, FIXED_TERM), 'agBefristetBis', '17.05.2026').ok).toBe(true);
  });

  it('1.1.0 differs from 1.0.0 only in its version, its stamp and the date rules', () => {
    const strip = (form: RegisteredForm) =>
      JSON.stringify(form.definition, (key, value: unknown) =>
        ['version', 'revised', 'notBefore', 'notAfter'].includes(key) ? undefined : value,
      );
    expect(strip(pfb110)).toBe(strip(pfb100));
  });
});

describe('Austritt: the notice', () => {
  const NOTICE = {
    agBeendigungsart: 'kuendigungArbeitgeber',
    agEndeArbeitsverhaeltnis: '31.12.2026',
    agKuendigungDatum: '20.11.2026',
  };

  it('refuses a notice received after the end (it used to read as a notice period under a week)', () => {
    const result = answer(employer(austritt, NOTICE), 'agKuendigungZugang', '02.01.2027');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt nach „Ende des Arbeitsverhältnisses“ (31.12.2026).',
    );
  });

  it('refuses a notice received before the letter was written', () => {
    const result = answer(employer(austritt, NOTICE), 'agKuendigungZugang', '19.11.2026');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt vor „Datum des Kündigungsschreibens“ (20.11.2026).',
    );
  });

  it('takes a notice between the letter and the end', () => {
    expect(answer(employer(austritt, NOTICE), 'agKuendigungZugang', '21.11.2026').ok).toBe(true);
  });
});
