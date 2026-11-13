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

  // Besides the date rules, 1.1.0 carries the wording of the Chrome evaluation (B3, B4, B14–B16,
  // B27; tests/forms/chromeEvaluierung.test.ts) — help texts only.
  // And (2026-11-13) the employer's proposed names, the second representative under joint custody,
  // the documents offered only where they fit (option conditions, tests/forms/unterlagen.test.ts).
  it('1.1.0 differs from 1.0.0 only in its version, its stamp, the date rules and help texts', () => {
    const SECOND = ['vertretung2', 'vertretungAlleinSorge'];
    const strip = (form: RegisteredForm) =>
      JSON.stringify(form.definition, function (this: unknown, key, value: unknown) {
        if (['version', 'revised', 'notBefore', 'notAfter', 'help', 'fromRole'].includes(key)) {
          return undefined;
        }
        // The condition of an answer (an option has a label but no role), not of a field.
        const parent = this as { label?: unknown; role?: unknown };
        if (key === 'showIf' && parent.label !== undefined && parent.role === undefined) {
          return undefined;
        }
        if (key === 'because' && typeof value === 'string' && value.includes('vorbelegt')) {
          return undefined;
        }
        if (Array.isArray(value)) {
          return value.filter(
            (item: unknown) =>
              !(
                typeof item === 'object' &&
                item !== null &&
                SECOND.includes((item as { id?: string }).id ?? '')
              ),
          );
        }
        return value;
      });
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
