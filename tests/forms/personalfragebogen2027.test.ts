// Personalfragebogen 1.1.0 for a Beschäftigungsbeginn in 2026 and in 2027 (Tobias 2026-11-14: „also
// mit einer Fassung, die 2026 und 2027 kann? ja“). The rules read the values of the start year
// (RECHENGROESSEN), so one version covers both years: its validity names both, the question about
// the Regelaltersgrenze covers the wider range of birth dates, and a start in 2028 is refused. The
// published 1.0.0 stays frozen for 2026. Fictitious people.
import { join } from 'node:path';
import { RECHENGROESSEN } from '../../src/logic/data/rechengroessen';
import { visibleFields } from '../../src/logic/form';
import { checkHints, HINT_TESTS } from '../../src/logic/hints';
import { interviewSummary } from '../../src/logic/interview';
import type { FormDefinition, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { regelaltersgrenze } from '../../src/logic/regelaltersgrenze';
import { describeValidity } from '../../src/logic/validity';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const draft = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json')));
const published = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));

const allDefinitions = (): FormDefinition[] =>
  [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
    .filter((file) => file.file.endsWith('.json') && file.file !== 'published.json')
    .map((file) => readJson(file.path) as FormDefinition);

/** Names of the named tests a definition uses (`fn` anywhere in its rules). */
function testNames(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) testNames(item, found);
  else if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.fn === 'string') found.add(record.fn);
    for (const item of Object.values(record)) testNames(item, found);
  }
  return found;
}

const yearsOf = (from: string, until: string) => {
  const years: string[] = [];
  for (let year = Number(from.slice(0, 4)); year <= Number(until.slice(0, 4)); year += 1) {
    years.push(String(year));
  }
  return years;
};

describe('Personalfragebogen 1.1.0 for a start in 2026 and 2027', () => {
  it('covers a start from 01.01.2026 to 31.12.2027; the published 1.0.0 keeps 2026', () => {
    expect(draft.definition.validity).toEqual({
      field: 'agBeschaeftigungsbeginn',
      from: '2026-01-01',
      until: '2027-12-31',
    });
    expect(describeValidity(draft.definition)).toBe(
      'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2027',
    );
    expect(published.definition.validity).toMatchObject({ until: '2026-12-31' });
  });

  // A pay test of a year without data is uncertain at best; some parts of the rules then count the
  // Minijob limit as 0 €. The validity keeps the start inside the years the app knows.
  it('knows the Rechengrößen of every year a form with pay tests is valid for', () => {
    for (const definition of allDefinitions()) {
      const payTests = [...testNames(definition)].filter((name) =>
        HINT_TESTS[name]?.args.includes('money'),
      );
      if (payTests.length === 0) continue;
      const label = `${definition.id} ${definition.version}`;
      const { validity } = definition;
      expect(validity?.until, `${label}: a version with pay tests needs an end`).toBeDefined();
      for (const year of yearsOf(validity?.from ?? '', validity?.until ?? '')) {
        expect(RECHENGROESSEN[year], `${label}: Rechengrößen ${year}`).toBeDefined();
      }
    }
  });

  it('takes a start in 2027 without a warning and refuses one in 2028', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'arbeitgeber'));
    const inside = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '04.01.2027');
    expect(inside.ok && inside.warnings).toEqual([]);
    const late = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '31.12.2027');
    expect(late.ok && late.warnings).toEqual([]);
    const outside = setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '03.01.2028');
    expect(outside.ok && outside.warnings).toContain('validity.outside');
    const part = ok(outside).parts.arbeitgeber?.[0];
    const summary = interviewSummary(draft.definition, 'arbeitgeber', part ?? { data: {} }, []);
    expect(summary.outsideValidity?.value).toBe('03.01.2028');
    expect(summary.readyToSign).toBe(false);
  });
});

describe('the Regelaltersgrenze over a start in 2026 or 2027', () => {
  const shownFor = (geburtsdatum: string) =>
    visibleFields(draft.definition, 'person', { geburtsdatum }).map((field) => field.id);

  it('asks only where the start in 2026 or 2027 decides it', () => {
    expect(shownFor('1959-11-02')).not.toContain('ragErreicht');
    expect(shownFor('1959-11-03')).toContain('ragErreicht');
    // Born in 1960: reached in 2026 or in 2027 — the start decides.
    expect(shownFor('1960-09-02')).toContain('ragErreicht');
    expect(shownFor('1961-07-01')).toContain('ragErreicht');
    expect(shownFor('1961-07-02')).not.toContain('ragErreicht');
  });

  it('draws the limits of that range from the Regelaltersgrenze and the validity', () => {
    const { validity } = draft.definition;
    const ask = draft.definition.sections
      .flatMap((section) => section.fields)
      .find((field) => field.id === 'ragErreicht')?.showIf;
    const [sure = '', open = ''] = JSON.stringify(ask).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const dayAfter = (date: string) => {
      const next = new Date(`${date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      return next.toISOString().slice(0, 10);
    };
    const from = validity?.from ?? '';
    const until = validity?.until ?? '';
    const reached = (birth: string) => regelaltersgrenze(birth) ?? '';
    expect(reached(sure) <= from).toBe(true);
    expect(reached(dayAfter(sure)) > from).toBe(true);
    expect(reached(open) <= until).toBe(true);
    expect(reached(dayAfter(open)) > until).toBe(true);
  });

  it('names the Regelaltersgrenze of the birth year 1961 for a start in 2027', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, draft), draft, 'person'));
    for (const [id, value] of Object.entries({ geburtsdatum: '15.03.1961', ragErreicht: 'nein' })) {
      q = ok(setValue(q, draft, 'person', id, value));
    }
    q = ok(startPart(q, draft, 'arbeitgeber'));
    q = ok(setValue(q, draft, 'arbeitgeber', 'agBeschaeftigungsbeginn', '01.10.2027'));
    const hint = checkHints(q as Questionnaire, draft.definition).find(
      (h) => h.id === 'regelaltersgrenzeNichtAngegeben',
    );
    expect(hint?.detail).toEqual([
      'Regelaltersgrenze laut Geburtsdatum: 14.09.2027; Folgemonat: Oktober 2027.',
    ]);
  });
});
