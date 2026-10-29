import { beispielForm } from '../../tests/support/sample';
import {
  fieldsOfRole,
  infoBlocksOfRole,
  missingRequired,
  noticeHash,
  roleOf,
  sealableData,
  visibleFields,
} from './form';
import type { FormDefinition } from './model';

const ids = (fields: readonly { id: string }[]) => fields.map((field) => field.id);

/** Fixture plus a field that depends on a dependent field (two-level condition chain). */
function chained(): FormDefinition {
  const definition = structuredClone(beispielForm().definition);
  definition.sections[0]?.fields.push({
    id: 'svDetail',
    role: 'person',
    type: 'text',
    label: 'Arbeitgeber der weiteren Beschäftigung',
    required: true,
    purpose: 'Test',
    showIf: { field: 'weitereArt', equals: 'sv' },
  });
  return definition;
}

describe('roles and fields', () => {
  const { definition } = beispielForm();

  it('finds roles and their own fields in form order', () => {
    expect(roleOf(definition, 'arbeitgeber')?.signature).toBe('optional');
    expect(roleOf(definition, 'kanzlei')).toBeUndefined();
    expect(ids(fieldsOfRole(definition, 'arbeitgeber'))).toEqual([
      'agNachname',
      'eintritt',
      'bruttoMonat',
    ]);
    expect(fieldsOfRole(definition, 'vertretung')).toEqual([]);
    expect(ids(infoBlocksOfRole(definition, 'person'))).toEqual(['datenschutz']);
  });
});

describe('visibility', () => {
  const { definition } = beispielForm();

  it('shows a dependent field only when its condition holds', () => {
    expect(ids(visibleFields(definition, 'person', { weitereBeschaeftigung: true }))).toContain(
      'weitereArt',
    );
    expect(
      ids(visibleFields(definition, 'person', { weitereBeschaeftigung: false })),
    ).not.toContain('weitereArt');
    expect(ids(visibleFields(definition, 'person', {}))).not.toContain('weitereArt');
  });

  it('hides the whole chain when an upstream field is hidden, even with a stale value', () => {
    const definition = chained();
    const data = { weitereBeschaeftigung: false, weitereArt: 'sv' };
    expect(ids(visibleFields(definition, 'person', data))).not.toContain('svDetail');
    expect(
      ids(visibleFields(definition, 'person', { ...data, weitereBeschaeftigung: true })),
    ).toContain('svDetail');
  });

  it('evaluates all/any conditions', () => {
    const definition = chained();
    const field = definition.sections[0]?.fields.find((f) => f.id === 'svDetail');
    if (!field) throw new Error('missing field');
    field.showIf = {
      any: [
        {
          all: [
            { field: 'weitereBeschaeftigung', equals: true },
            { field: 'weitereArt', equals: 'sv' },
          ],
        },
        { field: 'weitereArt', equals: 'minijob' },
      ],
    };
    const visible = (data: Record<string, string | boolean>) =>
      ids(visibleFields(definition, 'person', data)).includes('svDetail');
    expect(visible({ weitereBeschaeftigung: true, weitereArt: 'sv' })).toBe(true);
    expect(visible({ weitereBeschaeftigung: true, weitereArt: 'minijob' })).toBe(true);
    expect(visible({ weitereBeschaeftigung: false, weitereArt: 'minijob' })).toBe(false);
  });
});

describe('sealableData / missingRequired', () => {
  const { definition } = beispielForm();

  it('drops hidden values and fills unanswered visible fields with null', () => {
    expect(
      sealableData(definition, 'person', {
        nachname: 'Musterfrau',
        weitereBeschaeftigung: false,
        weitereArt: 'sv',
      }),
    ).toEqual({
      nachname: 'Musterfrau',
      geburtsdatum: null,
      steuerId: null,
      weitereBeschaeftigung: false,
      bemerkungen: null,
    });
  });

  it('ignores fields of other roles', () => {
    expect(sealableData(definition, 'person', { agNachname: 'X' })).not.toHaveProperty(
      'agNachname',
    );
  });

  it('lists required visible fields without an answer', () => {
    expect(missingRequired(definition, 'person', {})).toEqual([
      'nachname',
      'geburtsdatum',
      'steuerId',
      'weitereBeschaeftigung',
    ]);
    expect(missingRequired(definition, 'person', { weitereBeschaeftigung: true })).toContain(
      'weitereArt',
    );
    expect(missingRequired(definition, 'person', { weitereBeschaeftigung: false })).not.toContain(
      'weitereArt',
    );
  });
});

describe('noticeHash', () => {
  it('covers title, text and date of the notice', () => {
    const [block] = beispielForm().definition.infoBlocks;
    if (!block) throw new Error('no notice');
    const hash = noticeHash(block);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(noticeHash({ ...block })).toBe(hash);
    expect(noticeHash({ ...block, text: `${block.text} ` })).not.toBe(hash);
    expect(noticeHash({ ...block, title: 'Anderer Titel' })).not.toBe(hash);
    expect(noticeHash({ ...block, asOf: '2027-01-01' })).not.toBe(hash);
    expect(noticeHash({ ...block, acknowledgement: 'paperHandout' })).toBe(hash);
  });
});
