// Start points of the test area (Tobias 2026-11-03): every prepared questionnaire builds with the
// newest version of its form, every start link of manual_tests/ names one, and none is left unused.
// A form change that breaks a start point fails here, not in front of a tester. Kanzlei start
// points give the inbox their test expects (one complete questionnaire, a version conflict, two
// questionnaires without a common id).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compareVersions, registryOf, type RegisteredForm } from '../../src/logic/formRegistry';
import { mergeInbox } from '../../src/logic/kanzlei';
import { inlineMarkdown, parseManualTests, startLinksOf } from '../../src/logic/manualTests';
import { parseMasterDataFragment } from '../../src/logic/masterDataLink';
import { currentPart, latestSealed } from '../../src/logic/questionnaire';
import { roleStates } from '../../src/logic/session';
import {
  buildKanzleiStart,
  buildStartPoint,
  isFormStart,
  isKanzleiStart,
  isLinkStart,
  parseStartPoint,
  type AnyStartPoint,
  type StartEnvironment,
  type StartPoint,
} from '../../src/logic/startPoints';
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

const all: AnyStartPoint[] = readdirSync(START_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    const parsed = parseStartPoint(readJson(join(START_DIR, name)));
    if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.issues)}`);
    expect(`${parsed.point.id}.json`).toBe(name);
    return parsed.point;
  });
const points = all.filter(isFormStart);
const kanzlei = all.filter(isKanzleiStart);
const byId = new Map(all.map((point) => [point.id, point]));

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

/** Like the test page: one label, one questionnaire id and one row of nonces. */
function envOf(): (label: string | undefined) => StartEnvironment {
  const ids = new Map<string, string>();
  let fresh = 0;
  return (label) => {
    const id =
      label === undefined
        ? `00000000-0000-4000-8000-${String(++fresh).padStart(12, '0')}`
        : (ids.get(label) ?? `11111111-1111-4111-8111-${String(ids.size + 1).padStart(12, '0')}`);
    if (label !== undefined) ids.set(label, id);
    let n = 0;
    return { ...ENV, questionnaireId: id, nonce: () => String(++n).padStart(32, '0') };
  };
}
const RECEIVED = { ...ENV.now, timeZone: 'Europe/Berlin' };
const registry = registryOf(forms);
const inboxOf = (id: string) => {
  const point = kanzlei.find((p) => p.id === id);
  if (!point) throw new Error(id);
  const built = buildKanzleiStart(point, byId, newest, envOf(), RECEIVED);
  if (!built.ok) throw new Error(built.problems.join('\n'));
  return built.inbox;
};

const links = readdirSync(DIR)
  .filter((name) => /^\d\d_.+\.md$/.test(name))
  .flatMap((name) => startLinksOf(parseManualTests(readFileSync(join(DIR, name), 'utf8'), name)));

// The end-to-end tests that took over manual tests open start points by id (`openTestApp(page,
// 'id')`, i.e. `?startpunkt=id`; Tobias 2026-11-08).
const E2E_DIR = join(__dirname, '..', 'e2e');
const specs = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? specs(join(dir, entry.name))
      : entry.name.endsWith('.ts')
        ? [readFileSync(join(dir, entry.name), 'utf8')]
        : [],
  );
const automated = specs(E2E_DIR).flatMap((text) =>
  [...text.matchAll(/openTestApp\(\s*page\s*,\s*'([a-z0-9-]+)'/g)].map((match) => match[1] ?? ''),
);

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
      ['vertretung2', 'missing'],
      ['arbeitgeber', 'sealed'],
    ]);
  });

  it('every start link names a start point, and every start point is used', () => {
    const ids = new Set(all.map((point) => point.id));
    const used = new Set([
      ...links,
      ...automated,
      ...kanzlei.flatMap((p) => p.inbox.map((e) => e.from)),
    ]);
    expect([...links, ...automated].filter((id) => !ids.has(id))).toEqual([]);
    expect([...ids].filter((id) => !used.has(id))).toEqual([]);
  });

  it.each(kanzlei.map((point) => [point.id, point] as const))(
    '%s builds its inbox',
    (_id, point) => {
      const built = buildKanzleiStart(point, byId, newest, envOf(), RECEIVED);
      expect(built.ok ? [] : built.problems).toEqual([]);
      if (built.ok)
        expect(built.inbox.files.map((f) => f.name)).toEqual(point.inbox.map((e) => e.name));
    },
  );

  it('one complete Sofortmeldung is complete at the Kanzlei', () => {
    const merged = mergeInbox(inboxOf('kanzlei-sofortmeldung-vollstaendig'), registry);
    expect(merged.groups).toHaveLength(1);
    expect(merged.groups[0]?.conflicts ?? []).toEqual([]);
  });

  it('two versions of one person are a conflict for a human to decide (MT-42)', () => {
    const inbox = inboxOf('kanzlei-zwei-fassungen');
    expect(new Set(inbox.files.map((f) => f.questionnaire.questionnaireId)).size).toBe(1);
    const merged = mergeInbox(inbox, registry);
    expect(merged.groups).toHaveLength(1);
    expect(merged.groups[0]?.conflicts.map((c) => c.role)).toEqual(['person']);
  });

  it('two questionnaires without a common id are proposed for linking (MT-43)', () => {
    const inbox = inboxOf('kanzlei-ohne-gemeinsame-id');
    expect(new Set(inbox.files.map((f) => f.questionnaire.questionnaireId)).size).toBe(2);
    const merged = mergeInbox(inbox, registry);
    expect(merged.groups).toHaveLength(2);
    expect(merged.proposals).toHaveLength(1);
  });

  // Form start points sharing a label were dropped (Tobias 2026-11-08); MT-40 makes both files in
  // one run. Only Kanzlei inputs share a questionnaire (MT-42).
  it('a form start point takes no questionnaire label', () => {
    const point = points.find((p) => p.id === 'sofortmeldung-vollstaendig');
    if (!point) throw new Error('missing');
    expect(parseStartPoint({ ...point, questionnaire: 'gemeinsam' }).ok).toBe(false);
  });

  it('a link start point opens the app like the Kanzlei bookmark (MT-100, MT-101)', () => {
    const link = all.find(isLinkStart);
    expect(link?.id).toBe('personalfragebogen-stammdaten-link');
    const parsed = parseMasterDataFragment(`#${link?.link ?? ''}`);
    expect(parsed.ok && parsed.form).toBe('personalfragebogen');
    expect(parsed.ok && parsed.data).toMatchObject({
      firma: 'Beispiel Gastro GmbH',
      lohnsteuerMinijob: 'pauschal2',
      lohnsteuerAushilfe: 'pauschal25',
    });
    const point = { id: 'a', title: 't', open: 'link' };
    expect(parseStartPoint({ ...point, link: 'stammdaten=1&formular=sepa-mandat' }).ok).toBe(true);
    expect(parseStartPoint({ ...point, link: 'stammdaten=9&formular=sepa-mandat' }).ok).toBe(false);
    expect(parseStartPoint({ ...point, link: 'stammdaten=1&firma=X' }).ok).toBe(false);
    expect(parseStartPoint({ ...point, link: 'stammdaten=1&formular=x', extra: 1 }).ok).toBe(false);
  });

  it('a Kanzlei input never comes from a link start point', () => {
    const point = kanzlei.find((p) => p.id === 'kanzlei-sofortmeldung-vollstaendig');
    if (!point) throw new Error('missing');
    const built = buildKanzleiStart(
      { ...point, inbox: [{ name: 'link.pdf', from: 'personalfragebogen-stammdaten-link' }] },
      byId,
      newest,
      envOf(),
      RECEIVED,
    );
    expect(built.ok ? [] : built.problems).toEqual([
      'link.pdf: den Startpunkt „personalfragebogen-stammdaten-link“ gibt es nicht.',
    ]);
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

  // 2026-11-05: the form was checked like a field id, so a start point of "sepa-mandat" was refused.
  it('names a form whose id has a hyphen', () => {
    const point = {
      id: 'a',
      title: 't',
      parts: [{ role: 'kanzlei', answers: {} }],
      open: { role: 'kanzlei', at: 'summary' },
    };
    expect(parseStartPoint({ ...point, form: 'sepa-mandat' }).ok).toBe(true);
    expect(parseStartPoint({ ...point, form: 'Sepa-Mandat' }).ok).toBe(false);
  });
});
