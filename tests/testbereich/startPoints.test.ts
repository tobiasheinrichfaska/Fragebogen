// Start points of the test area (Tobias 2026-11-03): every prepared questionnaire builds with the
// newest version of its form, every start link of manual_tests/ names one, and none is left unused.
// A form change that breaks a start point fails here, not in front of a tester.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compareVersions, type RegisteredForm } from '../../src/logic/formRegistry';
import { inlineMarkdown, parseManualTests, startLinksOf } from '../../src/logic/manualTests';
import { currentPart, latestSealed } from '../../src/logic/questionnaire';
import { roleStates } from '../../src/logic/session';
import { buildStartPoint, parseStartPoint, type StartPoint } from '../../src/logic/startPoints';
import {
  definitionFiles,
  DRAFTS_DIR,
  FORMS_DIR,
  readJson,
  registeredFrom,
} from '../support/formFiles';
import { note, QUESTIONNAIRE_ID } from '../support/sample';

const DIR = join(__dirname, '..', '..', 'manual_tests');
const START_DIR = join(DIR, 'startpunkte');

const points: StartPoint[] = readdirSync(START_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    const parsed = parseStartPoint(readJson(join(START_DIR, name)));
    if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.issues)}`);
    expect(`${parsed.point.id}.json`).toBe(name);
    return parsed.point;
  });

// The test folder carries the published forms and the drafts; the newest version of each counts.
const forms = [...definitionFiles(FORMS_DIR), ...definitionFiles(DRAFTS_DIR)]
  .filter((file) => file.file.endsWith('.json'))
  .map((file) => registeredFrom(readJson(file.path)));
const newest = (id: string): RegisteredForm | undefined =>
  forms
    .filter((form) => form.definition.id === id)
    .sort((a, b) => compareVersions(a.definition.version, b.definition.version))
    .at(-1);

const ENV = {
  questionnaireId: QUESTIONNAIRE_ID,
  nonce: () => '0123456789abcdef0123456789abcdef',
  now: { local: '2026-11-03T10:00:00.000+01:00', utc: '2026-11-03T09:00:00.000Z' },
  systemNote: note('2026-11-03T10:00:00.000+01:00', '2026-11-03T09:00:00.000Z', ['keyboard']),
};

const links = readdirSync(DIR)
  .filter((name) => /^\d\d_.+\.md$/.test(name))
  .flatMap((name) => startLinksOf(parseManualTests(readFileSync(join(DIR, name), 'utf8'), name)));

describe('start points (manual_tests/startpunkte/)', () => {
  it.each(points.map((point) => [point.id, point] as const))('%s builds', (_id, point) => {
    const form = newest(point.form);
    expect(form, point.form).toBeDefined();
    if (!form) return;
    const built = buildStartPoint(point, form, ENV);
    expect(built.ok ? [] : built.problems).toEqual([]);
    if (!built.ok) return;
    for (const part of point.parts) {
      const state = part.seal === undefined ? 'draft' : 'sealed';
      const found =
        state === 'draft'
          ? currentPart(built.session.questionnaire, part.role)?.status
          : latestSealed(built.session.questionnaire, part.role)?.status;
      expect(found === 'draft' ? 'draft' : found === undefined ? 'missing' : 'sealed').toBe(state);
    }
    if (point.open === 'overview') {
      expect(built.screen).toBe('overview');
      expect(built.session.role).toBeUndefined();
    } else {
      expect(built.session.role).toBe(point.open.role);
      expect(built.session.stepKey).toBe(
        point.open.at === 'summary' ? 'summary' : `question:${point.open.at}`,
      );
    }
  });

  it('the complete Sofortmeldung is complete', () => {
    const point = points.find((p) => p.id === 'sofortmeldung-vollstaendig');
    const form = newest('sofortmeldung');
    if (!point || !form) throw new Error('missing');
    const built = buildStartPoint(point, form, ENV);
    if (!built.ok) throw new Error(built.problems.join('\n'));
    expect(roleStates(built.session).map((r) => [r.role.id, r.state])).toEqual([
      ['person', 'signed'],
      ['vertretung', 'missing'],
      ['arbeitgeber', 'sealed'],
    ]);
  });

  it('every start link names a start point, and every start point is used', () => {
    const ids = new Set(points.map((point) => point.id));
    expect(links.filter((id) => !ids.has(id))).toEqual([]);
    expect([...ids].filter((id) => !links.includes(id))).toEqual([]);
  });

  it('reports what no longer fits instead of building half a questionnaire', () => {
    const form = newest('sofortmeldung');
    if (!form) throw new Error('missing');
    const broken: StartPoint = {
      id: 'kaputt',
      title: 'kaputt',
      form: 'sofortmeldung',
      parts: [
        {
          role: 'arbeitgeber',
          answers: { agBetriebsnummer: '12345678', gibtsNicht: 'x' },
          seal: 'unsigned',
        },
      ],
      open: { role: 'person', at: 'familienname' },
    };
    const built = buildStartPoint(broken, form, ENV);
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.problems.join('\n')).toContain(
      'arbeitgeber.gibtsNicht: keine Frage dieser Rolle.',
    );
    expect(built.problems.join('\n')).toContain('arbeitgeber.agBetriebsnummer');
    expect(built.problems.join('\n')).toContain('arbeitgeber abschließen');
  });
});

describe('start links in the test texts', () => {
  it('become start tokens; other non-https links stay text', () => {
    expect(inlineMarkdown('[Vorbereitet öffnen](start:sofortmeldung-vollstaendig) dann')).toEqual([
      { kind: 'start', text: 'Vorbereitet öffnen', id: 'sofortmeldung-vollstaendig' },
      { kind: 'text', text: ' dann' },
    ]);
    expect(inlineMarkdown('[x](start:Falsch_Name)')).toEqual([{ kind: 'text', text: 'x' }]);
  });

  it('parses start point files strictly', () => {
    expect(
      parseStartPoint({ id: 'a', title: 't', form: 'f', parts: [], open: 'overview' }).ok,
    ).toBe(false);
    expect(
      parseStartPoint({
        id: 'a',
        title: 't',
        form: 'f',
        parts: [{ role: 'person', answers: {}, seal: 'signed' }],
        open: 'overview',
      }).ok,
    ).toBe(false);
    expect(
      parseStartPoint({
        id: 'a',
        title: 't',
        form: 'f',
        parts: [{ role: 'person', answers: { name: 'x' }, seal: { typed: 'Erika' } }],
        open: { role: 'person', at: 'summary' },
        extra: 1,
      }).ok,
    ).toBe(false);
  });
});
