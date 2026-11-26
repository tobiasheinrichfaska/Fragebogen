// How the legal guardians of a minor sign (Tobias 2026-11-15: „prüfe mit agent was rechtlich geht“,
// then „ja“): alone (sole custody, guardian), alone with the other parent's consent (§ 1629 Abs. 1
// Satz 2 BGB; BGH XII ZB 112/19), or together. Only „gemeinsam“ needs the second signature. The
// Sofortmeldung plays this to the PDF (sofortmeldung110Wege.test.ts); the audit of 2026-11-15 found
// the Personalfragebogen draft without a test of it, so both drafts are checked here alike.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { evaluateCondition } from '../../src/logic/conditions';
import { visibility } from '../../src/logic/form';
import type { RoleDefinition } from '../../src/logic/model';
import { FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';

const DRAFTS: readonly [string, RegisteredForm][] = [
  [
    'personalfragebogen',
    registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.1.0.json'))),
  ],
  ['sofortmeldung', registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '1.1.0.json')))],
];

const CONFIRMATION =
  'Als gesetzliche Vertretung der minderjährigen Person schließe ich mich ihrer Erklärung an. Ich versichere, dass ich so unterschreiben darf, wie ich es angegeben habe; unterschreibe ich mit Einverständnis des anderen Elternteils, liegt dieses Einverständnis vor.';

describe.each(DRAFTS)('%s 1.1.0: who signs for a minor', (_id, form) => {
  const role = (id: string): RoleDefinition => {
    const found = form.definition.roles.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`no role ${id}`);
    return found;
  };

  /**
   * Whether the second representative must sign after the first said `how` — read as
   * `roleRequirement` reads it from the first one's sealed part (requirements.ts; that the app
   * applies it on sealing is played through in sofortmeldung110Wege.test.ts).
   */
  const second = (how: string): boolean => {
    const condition = role('vertretung2').requiredIf;
    if (condition?.kind !== 'answer') throw new Error('vertretung2 hangs on an answer');
    const data = { vertretungName: 'Max Mustermann', vertretungUnterschrift: how };
    const visible = visibility(form.definition, 'vertretung', data);
    return evaluateCondition(condition.when, (id) =>
      visible.get(id) === true ? (data[id as keyof typeof data] ?? null) : null,
    );
  };

  it('offers the three ways', () => {
    const field = form.definition.sections
      .flatMap((section) => section.fields)
      .find((candidate) => candidate.id === 'vertretungUnterschrift');
    expect(field?.options?.map((option) => option.id)).toEqual([
      'allein',
      'einverstanden',
      'gemeinsam',
    ]);
  });

  it('needs the second signature only when both sign together', () => {
    expect(second('allein')).toBe(false);
    expect(second('einverstanden')).toBe(false);
    expect(second('gemeinsam')).toBe(true);
  });

  it('has the representative confirm the consent in its own words', () => {
    expect(role('vertretung').confirmationText).toBe(CONFIRMATION);
  });
});
