// Tobias 2026-11-24: „Warum wird der Arbeitnehmer neu nach seinem Namen gefragt? Wenn dann geht das
// nur mit Vorbelegung.“ The employer names the person (agFamilienname / agVorname); when the employer
// seals first, the person's familienname / vorname are preselected from it (fromRole, changeable) and
// marked „von Arbeitgeber“; the person checks and may correct. The reverse direction (person first)
// is unchanged: the employer's fields are preselected from the person.
import { join } from 'node:path';
import { checkHints } from '../../src/logic/hints';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { FieldDefinition, Questionnaire } from '../../src/logic/model';
import {
  adoptFromOtherRoles,
  createQuestionnaire,
  currentPart,
  presetOf,
  sealPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID } from '../support/sample';

const PFB_EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Muster-Beispiel',
  agVorname: 'Erika Maria',
  agBeschaeftigungsbeginn: '02.11.2026',
  agArbeitsortBundesland: 'BW',
  agBeschaeftigungsart: 'minijob',
  agTaetigkeit: 'Aushilfe im Verkauf',
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
  agBesteuerung: 'pauschal2',
  agPauschalsteuerAbgewaelzt: false,
};
const SOFORT_EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agBranche: 'bau',
  agFamilienname: 'Muster-Beispiel',
  agVorname: 'Erika Maria',
  agBeschaeftigungsbeginn: '02.11.2026',
};

const CASES = [
  ['personalfragebogen', PFB_EMPLOYER],
  ['sofortmeldung', SOFORT_EMPLOYER],
] as const;

describe.each(CASES)(
  "%s 1.1.0: the person's name is preselected from the employer",
  (id, values) => {
    const form = registeredFrom(readJson(join(FORMS_DIR, id, '1.1.0.json')));
    const { definition } = form;
    const at = { local: '2026-11-24T10:00:00.000+01:00', utc: '2026-11-24T09:00:00.000Z' };

    const employerSealed = (): Questionnaire => {
      let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
      for (const [field, raw] of Object.entries(values)) {
        q = ok(setValue(q, form, 'arbeitgeber', field, raw));
      }
      return ok(
        sealPart(q, form, 'arbeitgeber', {
          nonce: 'e5'.repeat(16),
          systemNote: note(at.local, at.utc),
          acknowledged: [],
        }),
      );
    };
    const personDraft = (q: Questionnaire) => {
      const started = ok(startPart(q, form, 'person'));
      return adoptFromOtherRoles(started, form, 'person').questionnaire;
    };

    it('declares both directions as proposals', () => {
      const field = (fid: string) =>
        definition.sections.flatMap((s) => s.fields).find((f) => f.id === fid);
      for (const [own, other] of [
        ['familienname', 'agFamilienname'],
        ['vorname', 'agVorname'],
      ] as const) {
        expect(field(own)?.fromRole).toEqual({
          role: 'arbeitgeber',
          field: other,
          changeable: true,
        });
        expect(field(own)?.because).toBeTruthy();
        expect(field(other)?.fromRole).toMatchObject({
          role: 'person',
          field: own,
          changeable: true,
        });
      }
    });

    it('employer first: the person starts with the names, marked as taken from the employer', () => {
      const part = currentPart(personDraft(employerSealed()), 'person');
      expect(part?.data['familienname']).toBe('Muster-Beispiel');
      expect(part?.data['vorname']).toBe('Erika Maria');
      expect(presetOf(part, 'familienname')).toBe('otherRole');
      expect(presetOf(part, 'vorname')).toBe('otherRole');
    });

    it("a corrected name stays the person's answer and is named as a difference", () => {
      let q = personDraft(employerSealed());
      q = ok(setValue(q, form, 'person', 'familienname', 'Muster'));
      q = adoptFromOtherRoles(q, form, 'person').questionnaire;
      const part = currentPart(q, 'person');
      expect(part?.data['familienname']).toBe('Muster');
      expect(presetOf(part, 'familienname')).toBeUndefined();
      expect(checkHints(q, definition).map((h) => h.id)).toContain('fromRole:familienname');
      // named once, at the person who changed it — not again at the employer
      expect(checkHints(q, definition).map((h) => h.id)).not.toContain('fromRole:agFamilienname');
      // the other name is untouched
      expect(presetOf(part, 'vorname')).toBe('otherRole');
    });

    it('keeps the contradiction rules that compare the two names', () => {
      expect(definition.consistencyRules.map((r) => r.fields)).toEqual(
        expect.arrayContaining([
          ['familienname', 'agFamilienname'],
          ['vorname', 'agVorname'],
        ]),
      );
    });

    it('person first: nothing is preselected for the person, the employer gets the names', () => {
      let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
      expect(adoptFromOtherRoles(q, form, 'person').adopted).toEqual([]);
      expect(currentPart(q, 'person')?.data['familienname']).toBeUndefined();
      q = ok(setValue(q, form, 'person', 'familienname', 'Muster'));
      expect(currentPart(q, 'person')?.data['familienname']).toBe('Muster');
    });
  },
);

describe('definition rule: two fields may propose each other, nothing else may chain', () => {
  const draft = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '1.1.0.json'))).definition;
  const problems = (change: (fields: Map<string, FieldDefinition>) => void) => {
    const definition = structuredClone(draft);
    change(new Map(definition.sections.flatMap((s) => s.fields).map((f) => [f.id, f])));
    return checkFormDefinition(definition).map((issue) => `${issue.path} ${issue.message}`);
  };
  const get = (fields: Map<string, FieldDefinition>, id: string) => {
    const field = fields.get(id);
    if (!field) throw new Error(`no field ${id}`);
    return field;
  };

  it('accepts the mutual proposal of the draft', () => {
    expect(problems(() => undefined)).toEqual([]);
  });

  it('refuses the pair when one side decides (not changeable)', () => {
    const found = problems((fields) => {
      const from = get(fields, 'familienname').fromRole;
      if (from) delete from.changeable;
    });
    expect(found.join('\n')).toContain('the other field is taken over itself');
  });

  it('refuses a field taken from a field that is taken from a different one', () => {
    const found = problems((fields) => {
      get(fields, 'vorname').fromRole = {
        role: 'arbeitgeber',
        field: 'agFamilienname',
        changeable: true,
      };
    });
    expect(found.join('\n')).toContain('the other field is taken over itself');
  });
});
