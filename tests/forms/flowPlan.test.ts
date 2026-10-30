// The flow plans (docs/ablaufplan.html) of every published form and draft, generated from the
// definitions; every condition in a draft is explained (`because`). `npm run catalogue` rewrites
// the page.
import { join } from 'node:path';
import { flowPlanPage } from '../../src/build/flowPlanPage';
import { flowPlan, unexplainedConditions, type FlowStep } from '../../src/logic/flowPlan';
import { compareVersions } from '../../src/logic/formRegistry';
import {
  DRAFTS_DIR,
  FORMS_DIR,
  definitionFiles,
  readJson,
  registeredFrom,
} from '../support/formFiles';

// One plan per form: the newest version (a draft before the published one); older versions are named.
const allVersions = [
  ...definitionFiles(FORMS_DIR).map((file) => ({ file, status: 'Veröffentlicht (Testfassung)' })),
  ...definitionFiles(DRAFTS_DIR).map((file) => ({
    file,
    status: 'Entwurf zur fachlichen Freigabe',
  })),
]
  .filter(({ file }) => file.file.endsWith('.json') && file.file !== 'published.json')
  .map(({ file, status }) => ({ form: registeredFrom(readJson(file.path)), status }));
const entries = allVersions
  .filter(
    ({ form }) =>
      !allVersions.some(
        (other) =>
          other.form.definition.id === form.definition.id &&
          compareVersions(other.form.definition.version, form.definition.version) > 0,
      ),
  )
  .map((entry) => ({
    ...entry,
    older: allVersions
      .filter(
        (other) =>
          other.form.definition.id === entry.form.definition.id &&
          other.form.definition.version !== entry.form.definition.version,
      )
      .map((other) => `${other.form.definition.version} (eingefroren)`),
  }));

const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));

function stepsOf(role: string): FlowStep[] {
  const station = flowPlan(personal).stations.find((s) => s.role.id === role);
  return station?.sections.flatMap((section) => section.steps) ?? [];
}

describe('docs/ablaufplan.html', () => {
  it('matches the definitions', async () => {
    const page = flowPlanPage(
      entries.map(({ form, status, older }) => ({ plan: flowPlan(form), status, older })),
    );
    await expect(page).toMatchFileSnapshot('../../docs/ablaufplan.html');
  });

  it('loads nothing from outside and runs no script', () => {
    const page = flowPlanPage(
      entries.map(({ form, status, older }) => ({ plan: flowPlan(form), status, older })),
    );
    expect(page).not.toMatch(/<script|<link|src=|https?:\/\//);
  });
});

describe('every draft explains its conditions', () => {
  it.each(
    allVersions
      .filter((entry) => entry.status.startsWith('Entwurf'))
      .map((entry) => [`${entry.form.definition.id} ${entry.form.definition.version}`, entry.form]),
  )('%s', (_name, form) => {
    expect(unexplainedConditions(form.definition)).toEqual([]);
  });
});

describe('flow plan of the Personalfragebogen', () => {
  it('numbers the questions of a station in interview order', () => {
    const steps = stepsOf('person');
    expect(steps.map((step) => step.number)).toEqual(steps.map((_, i) => i + 1));
  });

  it('marks the decision and why the person is asked about the kind of wage tax', () => {
    const steps = stepsOf('person');
    const art = steps.find((step) => step.fieldId === 'steuerart');
    const dienst = steps.find((step) => step.fieldId === 'dienstverhaeltnis');
    expect(art?.fromRole).toBe('Arbeitgeber: „Art der Lohnsteuer“');
    expect(art?.because).toContain('§ 40a EStG');
    expect(art?.opens).toContain(dienst?.number);
    expect(dienst?.dependsOn).toEqual([art?.number]);
    expect(dienst?.when).toContain('Art der Lohnsteuer');
  });

  it('recommends the employer first because the person then gets fewer questions', () => {
    const order = flowPlan(personal).order.join('\n');
    expect(order).toContain('Empfohlen: Arbeitgeber zuerst');
    expect(order).toContain('„Art der Lohnsteuer“');
  });

  it('explains when the legal guardian is needed', () => {
    const guardian = flowPlan(personal).stations.find((s) => s.role.id === 'vertretung');
    expect(guardian?.needed).toContain('unter 18');
    expect(guardian?.because).toContain('§ 106 BGB');
  });

  it('shows only the newest version of each form and names the older one', () => {
    const sofort = entries.filter((entry) => entry.form.definition.id === 'sofortmeldung');
    expect(sofort.map((entry) => entry.form.definition.version)).toEqual(['0.2.0']);
    expect(sofort[0]?.older).toEqual(['0.1.0 (eingefroren)']);
  });

  it('every draft states its validity and what it does not cover', () => {
    for (const { form, status } of allVersions) {
      if (!status.startsWith('Entwurf')) continue;
      expect(form.definition.validity, form.definition.id).toBeDefined();
      expect(form.definition.limits?.length ?? 0, form.definition.id).toBeGreaterThan(0);
    }
  });

  it('names a field without an explanation', () => {
    const definition = structuredClone(personal.definition);
    const field = definition.sections
      .flatMap((section) => section.fields)
      .find((f) => f.id === 'geburtsname');
    if (!field) throw new Error('fixture changed');
    Reflect.deleteProperty(field, 'because');
    expect(unexplainedConditions(definition)).toEqual(['geburtsname']);
  });
});
