import { coreValues, first, firstValue, groupsOf, normalize, valuesOf } from './model';
import type { RawGroup } from './model';

const raw = (over: Partial<RawGroup> = {}): RawGroup => ({
  bg: 'INVOICE',
  terms: {},
  groups: {},
  ...over,
});

describe('normalize', () => {
  it('trims values, turns dates into ISO and keeps the raw text', () => {
    const model = normalize(
      raw({ terms: { 'BT-1': ['  R-1 \n'], 'BT-2': ['20261113'], 'BT-9': ['13.11.2026'] } }),
    );
    expect(model.terms['BT-1']).toEqual([{ value: 'R-1', raw: 'R-1' }]);
    expect(model.terms['BT-2']).toEqual([{ value: '2026-11-13', raw: '20261113' }]);
    // an unreadable date stays as written
    expect(model.terms['BT-9']).toEqual([{ value: '13.11.2026', raw: '13.11.2026' }]);
  });

  it('drops empty values and groups that carry nothing', () => {
    const model = normalize(
      raw({
        terms: { 'BT-1': ['', '  '] },
        groups: {
          'BG-13': [{ bg: 'BG-13', terms: { 'BT-72': [] }, groups: { 'BG-15': [] } }],
          'BG-25': [
            {
              bg: 'BG-25',
              terms: {},
              groups: { 'BG-29': [{ bg: 'BG-29', terms: {}, groups: {} }] },
            },
            { bg: 'BG-25', terms: { 'BT-126': ['1'] }, groups: {} },
          ],
        },
      }),
    );
    expect(model.terms).toEqual({});
    expect(model.groups['BG-13']).toBeUndefined();
    expect(groupsOf(model, 'BG-25')).toHaveLength(1);
  });

  it('ignores terms the binding does not know', () => {
    const model = normalize(raw({ terms: { 'BT-9999': ['x'] } }));
    expect(model.terms).toEqual({});
  });

  it('keeps an empty root for an empty invoice', () => {
    expect(normalize(raw())).toEqual({ bg: 'INVOICE', terms: {}, groups: {} });
  });

  it('splits the UBL note subject prefix (#ADU#…) but only for UBL', () => {
    const notes = raw({
      groups: {
        'BG-1': [{ bg: 'BG-1', terms: { 'BT-22': ['#ADU#Es gelten unsere AGB.'] }, groups: {} }],
      },
    });
    expect(valuesOf(normalize(notes, { ubl: true }), 'BG-1/BT-21')[0]?.value).toBe('ADU');
    expect(valuesOf(normalize(notes, { ubl: true }), 'BG-1/BT-22')[0]?.value).toBe(
      'Es gelten unsere AGB.',
    );
    expect(valuesOf(normalize(notes), 'BG-1/BT-22')[0]?.value).toBe('#ADU#Es gelten unsere AGB.');
    const plain = raw({
      groups: { 'BG-1': [{ bg: 'BG-1', terms: { 'BT-22': ['#ohne Code'] }, groups: {} }] },
    });
    expect(valuesOf(normalize(plain, { ubl: true }), 'BG-1/BT-21')).toEqual([]);
  });
});

describe('access', () => {
  const model = normalize(
    raw({
      terms: { 'BT-1': ['R-1'], 'BT-24': ['urn:cen.eu:en16931:2017'] },
      groups: {
        'BG-4': [{ bg: 'BG-4', terms: { 'BT-27': ['Muster GmbH'] }, groups: {} }],
        'BG-22': [{ bg: 'BG-22', terms: { 'BT-112': ['119.00'] }, groups: {} }],
        'BG-25': [
          {
            bg: 'BG-25',
            terms: { 'BT-126': ['1'] },
            groups: { 'BG-31': [{ bg: 'BG-31', terms: { 'BT-153': ['Stuhl'] }, groups: {} }] },
          },
          {
            bg: 'BG-25',
            terms: { 'BT-126': ['2'] },
            groups: { 'BG-31': [{ bg: 'BG-31', terms: { 'BT-153': ['Tisch'] }, groups: {} }] },
          },
        ],
      },
    }),
  );

  it('collects values over every occurrence of a repeated group', () => {
    expect(valuesOf(model, 'BG-25/BG-31/BT-153').map((v) => v.value)).toEqual(['Stuhl', 'Tisch']);
    expect(groupsOf(model, 'BG-25/BG-31')).toHaveLength(2);
    expect(firstValue(model, 'BG-4/BT-27')).toBe('Muster GmbH');
    expect(firstValue(model, 'BG-7/BT-44')).toBeUndefined();
    expect(valuesOf(model, '')).toEqual([]);
  });

  it('gives the core values for recognition', () => {
    const core = coreValues(model);
    expect(first(core, 'BT-27')).toBe('Muster GmbH');
    expect(first(core, 'BT-112')).toBe('119.00');
    expect(first(core, 'BT-2')).toBeUndefined();
  });
});
