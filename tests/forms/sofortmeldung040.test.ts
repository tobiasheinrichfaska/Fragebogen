// Sofortmeldung 0.4.0 (Tobias 2026-11-03): the birth date has a floating upper bound — never later
// than today — instead of the fixed end of 2026; the earliest day stays 01.01.1876. Everything else
// is 0.3.0. Fictitious data; the day is fixed with fake timers.
import { join } from 'node:path';
import { fieldsById } from '../../src/logic/form';
import {
  answer,
  enterRole,
  startSession,
  type Session,
  type SessionResult,
} from '../../src/logic/session';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.4.0.json')));
const older = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '0.3.0.json')));

function must(result: SessionResult): Session {
  if (!result.ok) throw new Error(`${result.message} ${result.detail.join(', ')}`);
  return result.session;
}

const person = () => must(enterRole(startSession(form, QUESTIONNAIRE_ID), 'person'));

describe('Sofortmeldung 0.4.0', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('differs from 0.3.0 only by the bound of the birth date', () => {
    expect(fieldsById(form.definition).get('geburtsdatum')).toMatchObject({
      minDate: '1876-01-01',
      maxDate: 'today',
    });
    const without = (definition: typeof form.definition) =>
      JSON.parse(
        JSON.stringify(definition, (key, value: unknown) =>
          key === 'version' || key === 'maxDate' ? undefined : value,
        ),
      ) as unknown;
    expect(without(form.definition)).toEqual(without(older.definition));
  });

  it('takes a birth date up to today and refuses tomorrow', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 2, 15, 9, 30));
    expect(answer(person(), 'geburtsdatum', '15.03.2027').ok).toBe(true);
    expect(answer(person(), 'geburtsdatum', '16.03.2027')).toEqual({
      ok: false,
      message: 'Das Datum liegt zu spät – spätestens heute.',
      detail: ['Geburtsdatum'],
    });
    // The fixed bound of 0.3.0 no longer applies: 2027 is fine once it has come.
    expect(answer(person(), 'geburtsdatum', '01.01.2027').ok).toBe(true);
  });

  it('moves with the day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 3, 23, 59));
    expect(answer(person(), 'geburtsdatum', '04.11.2026').ok).toBe(false);
    vi.setSystemTime(new Date(2026, 10, 4, 0, 1));
    expect(answer(person(), 'geburtsdatum', '04.11.2026').ok).toBe(true);
  });

  it('keeps the earliest day', () => {
    expect(answer(person(), 'geburtsdatum', '31.12.1875')).toMatchObject({
      ok: false,
      message: 'Das Datum liegt zu weit zurück – frühestens 01.01.1876.',
    });
  });
});
