// Personalfragebogen 1.2.0, published 2026-11-26 (Tobias 2026-11-26: „Praktikumsart beim AN übernehmen, wenn AG
// angegeben“): the employer names the kind of internship (five kinds), the person is asked only
// whether it is prescribed (pflicht / freiwillig / weiß nicht). With the employer's part sealed the
// person's answer is taken over through a translation (`fromRole.map`) and not asked; without it
// the person is asked as before. A later difference is a check hint naming the employer's kind.
import { join } from 'node:path';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { checkHints } from '../../src/logic/hints';
import type { FieldDefinition, FormDefinition, Questionnaire } from '../../src/logic/model';
import {
  adoptFromOtherRoles,
  createQuestionnaire,
  currentPart,
  fixedByOtherRoles,
  presetOf,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.2.0.json')));
const { definition } = form;
const at = { local: '2026-11-26T10:00:00.000+01:00', utc: '2026-11-26T09:00:00.000Z' };

const EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Muster-Beispiel',
  agVorname: 'Erika Maria',
  agBeschaeftigungsbeginn: '02.11.2026',
  agArbeitsortBundesland: 'BW',
  agBeschaeftigungsart: 'praktikum',
  agTaetigkeit: 'Praktikum im Verkauf',
  agBefristet: false,
  agArbeitszeitform: 'teilzeit',
  agArbeitszeitmodell: 'monatsstunden',
  agMonatsstunden: '40',
  agArbeitstageProWoche: '2',
  agUrlaubstage: '8',
  agUrlaubBezug: 'individuell',
  agEntgeltArt: 'stundenlohn',
  agStundenlohn: '14,50',
  agErwartetMonat: '520,00',
  agSteuernummer: '21/815/08150',
  agBav: 'keine',
  agSchwerbehinderung: 'nein',
  agBeziehung: 'keine',
  agFrueherBeschaeftigt: false,
};

/** The employer's part with this kind of internship; sealed, unless `before` comes first. */
function employerSealed(
  kind: string,
  before: (q: Questionnaire) => Questionnaire = (q) => q,
): Questionnaire {
  let q = before(createQuestionnaire(QUESTIONNAIRE_ID, form));
  q = ok(startPart(q, form, 'arbeitgeber'));
  for (const [field, raw] of Object.entries(EMPLOYER)) {
    q = ok(setValue(q, form, 'arbeitgeber', field, raw));
  }
  q = ok(setValue(q, form, 'arbeitgeber', 'agPraktikumArt', kind));
  q = ok(setValue(q, form, 'arbeitgeber', 'agPraktikumBis', '31.01.2027'));
  // a voluntary internship asks the hours in the lecture period (Werkstudent rules)
  const hours = setValue(q, form, 'arbeitgeber', 'agVorlesungszeitStunden', '10');
  if (hours.ok) q = hours.questionnaire;
  return ok(
    sealPart(q, form, 'arbeitgeber', {
      nonce: 'e6'.repeat(16),
      systemNote: note(at.local, at.utc),
      acknowledged: [],
    }),
  );
}

const personDraft = (q: Questionnaire) =>
  adoptFromOtherRoles(ok(startPart(q, form, 'person')), form, 'person').questionnaire;

describe('Personalfragebogen 1.2.0: the kind of internship comes from the employer', () => {
  it.each([
    ['pflichtStudium', 'pflicht'],
    ['pflichtVorNach', 'pflicht'],
    ['orientierung', 'freiwillig'],
    ['begleitend', 'freiwillig'],
    ['freiwillig', 'freiwillig'],
  ])('employer „%s“ → the person „%s“, taken over and not asked', (kind, prescribed) => {
    const q = personDraft(employerSealed(kind));
    const part = currentPart(q, 'person');
    expect(part?.data['praktikumArt']).toBe(prescribed);
    expect(presetOf(part, 'praktikumArt')).toBe('otherRole');
    expect(fixedByOtherRoles(q, definition, 'person').get('praktikumArt')).toEqual({
      value: prescribed,
      from: 'arbeitgeber',
    });
    // fixed: the person cannot give another answer
    expect(setValue(q, form, 'person', 'praktikumArt', 'unbekannt').ok).toBe(false);
  });

  it('person first: asked as before, „Weiß ich nicht.“ included', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    expect(adoptFromOtherRoles(q, form, 'person').adopted).not.toContain('praktikumArt');
    expect(fixedByOtherRoles(q, definition, 'person').has('praktikumArt')).toBe(false);
  });

  it('names a difference with the employer’s own kind, never one with „Weiß ich nicht.“', () => {
    // The person answered while the employer's part was still open; then the employer sealed.
    const withPerson = (answerOf: string): Questionnaire =>
      employerSealed('pflichtStudium', (q) => {
        let p = ok(startPart(q, form, 'person'));
        p = ok(setValue(p, form, 'person', 'artLautVereinbarung', 'praktikum'));
        return ok(setValue(p, form, 'person', 'praktikumArt', answerOf));
      });
    const hint = checkHints(withPerson('freiwillig'), definition).find(
      (h) => h.id === 'fromRole:praktikumArt',
    );
    expect(hint?.message).toContain('Pflichtpraktikum während des Studiums');
    expect(hint?.message).toContain('Nein, es ist freiwillig.');
    expect(checkHints(withPerson('pflicht'), definition).map((h) => h.id)).not.toContain(
      'fromRole:praktikumArt',
    );
    expect(checkHints(withPerson('unbekannt'), definition).map((h) => h.id)).not.toContain(
      'fromRole:praktikumArt',
    );
  });
});

describe('definition rules for a translation (fromRole.map)', () => {
  const withMap = (map: Record<string, string> | undefined, type?: string): FormDefinition => {
    const copy = structuredClone(definition) as FormDefinition;
    const field = copy.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'praktikumArt') as FieldDefinition & { type: string };
    const from = field.fromRole as NonNullable<FieldDefinition['fromRole']> & {
      map?: Record<string, string>;
    };
    if (map === undefined) delete from.map;
    else from.map = map;
    if (type !== undefined) field.type = type as FieldDefinition['type'];
    return copy;
  };
  const issues = (d: FormDefinition) =>
    checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`);
  const FULL = {
    pflichtStudium: 'pflicht',
    pflichtVorNach: 'pflicht',
    orientierung: 'freiwillig',
    begleitend: 'freiwillig',
    freiwillig: 'freiwillig',
  };

  it('accepts the draft', () => {
    expect(issues(definition)).toEqual([]);
  });

  it('refuses an answer of the other field left untranslated', () => {
    const rest = Object.fromEntries(Object.entries(FULL).filter(([key]) => key !== 'begleitend'));
    expect(issues(withMap(rest)).join('\n')).toContain('answer "begleitend" of the other field');
  });

  it('refuses a translation into no own option, or from no answer of the other field', () => {
    expect(issues(withMap({ ...FULL, freiwillig: 'nein' })).join('\n')).toContain(
      '"nein" is no option of this field',
    );
    expect(issues(withMap({ ...FULL, gibtEsNicht: 'pflicht' })).join('\n')).toContain(
      '"gibtEsNicht" is no answer of the other field',
    );
  });

  it('without a translation the options must match again', () => {
    expect(issues(withMap(undefined)).join('\n')).toContain(
      'option "pflichtStudium" of the other field is missing',
    );
  });
});
