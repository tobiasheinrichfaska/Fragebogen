// The flow plans (docs/ablaufplan.html) of every published form and draft, generated from the
// definitions; every condition in a draft is explained (`because`). `npm run catalogue` rewrites
// the page.
import { join } from 'node:path';
import { flowPlanPage } from '../../src/build/flowPlanPage';
import { flowPlan, unexplainedConditions, type FlowStep } from '../../src/logic/flowPlan';
import {
  DRAFTS_DIR,
  FORMS_DIR,
  definitionFiles,
  readJson,
  registeredFrom,
} from '../support/formFiles';

const entries = [
  ...definitionFiles(FORMS_DIR).map((file) => ({ file, status: 'Veröffentlicht (Testfassung)' })),
  ...definitionFiles(DRAFTS_DIR).map((file) => ({
    file,
    status: 'Entwurf zur fachlichen Freigabe',
  })),
]
  .filter(({ file }) => file.file.endsWith('.json') && file.file !== 'published.json')
  .map(({ file, status }) => ({ form: registeredFrom(readJson(file.path)), status }));

const personal = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));

function stepsOf(role: string): FlowStep[] {
  const station = flowPlan(personal).stations.find((s) => s.role.id === role);
  return station?.sections.flatMap((section) => section.steps) ?? [];
}

describe('docs/ablaufplan.html', () => {
  it('matches the definitions', async () => {
    const page = flowPlanPage(
      entries.map(({ form, status }) => ({ plan: flowPlan(form), status })),
    );
    await expect(page).toMatchFileSnapshot('../../docs/ablaufplan.html');
  });

  it('loads nothing from outside and runs no script', () => {
    const page = flowPlanPage(
      entries.map(({ form, status }) => ({ plan: flowPlan(form), status })),
    );
    expect(page).not.toMatch(/<script|<link|src=|https?:\/\//);
  });
});

describe('every draft explains its conditions', () => {
  it.each(
    entries
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
