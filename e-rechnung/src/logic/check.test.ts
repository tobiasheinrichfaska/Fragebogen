import { INVOICE } from './binding';
import type { GroupDef } from './binding';
import { checkPflichtangaben, displayValue, holds, modeOf, sentence } from './check';
import type { RowResult } from './check';
import type { InvoiceModel, ModelGroup } from './model';
import { MODES, PFLICHTANGABEN } from './pflichtangaben';
import type { Condition, Presence } from './pflichtangaben';
import { TEXTS } from './texts';

type Spec = { [key: string]: string | string[] | Spec[] };

/** { 'BT-1': 'R-1', 'BG-4': [{ 'BT-27': 'X' }] } → model group */
function group(bg: string, spec: Spec): ModelGroup {
  const result: ModelGroup = { bg: bg as ModelGroup['bg'], terms: {}, groups: {} };
  for (const [key, value] of Object.entries(spec)) {
    if (key.startsWith('BT-')) {
      const values = Array.isArray(value) ? (value as string[]) : [value as string];
      result.terms[key as `BT-${number}`] = values.map((v) => ({ value: v, raw: v }));
    } else {
      result.groups[key as ModelGroup['bg']] = (value as Spec[]).map((child) => group(key, child));
    }
  }
  return result;
}

const address = (prefix: [string, string, string, string]) => ({
  [prefix[0]]: 'Musterstraße 1',
  [prefix[1]]: '76131',
  [prefix[2]]: 'Karlsruhe',
  [prefix[3]]: 'DE',
});

/** A complete regular invoice: 2 positions, 19 % VAT, delivery date. */
const BASE: Spec = {
  'BT-1': 'R-2026-1',
  'BT-2': '2026-11-13',
  'BT-3': '380',
  'BT-5': 'EUR',
  'BG-4': [
    {
      'BT-27': 'Verkäufer GmbH',
      'BT-31': 'DE123456789',
      'BG-5': [address(['BT-35', 'BT-38', 'BT-37', 'BT-40'])],
    },
  ],
  'BG-7': [{ 'BT-44': 'Käufer AG', 'BG-8': [address(['BT-50', 'BT-53', 'BT-52', 'BT-55'])] }],
  'BG-13': [{ 'BT-72': '2026-11-10' }],
  'BG-22': [
    {
      'BT-106': '1000.00',
      'BT-109': '1000.00',
      'BT-110': '190.00',
      'BT-112': '1190.00',
      'BT-115': '1190.00',
    },
  ],
  'BG-23': [{ 'BT-116': '1000.00', 'BT-117': '190.00', 'BT-118': 'S', 'BT-119': '19' }],
  'BG-25': [
    {
      'BT-126': '1',
      'BT-129': '2',
      'BT-130': 'C62',
      'BT-131': '800.00',
      'BG-31': [{ 'BT-153': 'Bürostuhl' }],
    },
    {
      'BT-126': '2',
      'BT-129': '4',
      'BT-130': 'HUR',
      'BT-131': '200.00',
      'BG-31': [{ 'BT-153': 'Montage' }],
    },
  ],
};

const model = (over: Spec = {}): InvoiceModel => group('INVOICE', { ...BASE, ...over });
const row = (result: ReturnType<typeof checkPflichtangaben>, id: string): RowResult => {
  const found = result.rows.find((r) => r.row.id === id);
  if (!found) throw new Error(`no row ${id}`);
  return found;
};

describe('the Pflichtangaben table as data', () => {
  it('has unique ids, a norm, a source and a need for every mode', () => {
    const ids = PFLICHTANGABEN.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PFLICHTANGABEN) {
      expect(p.norm.length).toBeGreaterThan(5);
      expect(p.source.length).toBeGreaterThan(3);
      expect(Object.keys(p.needs).sort()).toEqual(['kleinbetrag', 'kleinunternehmer', 'regel']);
    }
  });

  it('only uses paths that exist in the binding', () => {
    const known = (path: string): boolean => {
      let def: GroupDef | undefined = INVOICE;
      const segments = path.split('/');
      for (const [i, segment] of segments.entries()) {
        if (!def) return false;
        if (i === segments.length - 1 && segment.startsWith('BT-')) {
          return def.terms.some((t) => t.bt === segment);
        }
        def = def.groups.find((g): boolean => g.bg === segment);
      }
      return def !== undefined;
    };
    const paths: string[] = [];
    const fromPresence = (p: Presence): void => {
      if (p.kind === 'any' || p.kind === 'text') paths.push(...p.paths);
      if (p.kind === 'address') paths.push(p.group);
      if (p.kind === 'equals') paths.push(p.path);
      if (p.kind === 'each') {
        paths.push(p.group, ...p.paths.map((x) => `${p.group}/${x}`));
        if (p.unless) paths.push(`${p.group}/${p.unless.path}`);
      }
      if (p.kind === 'anyOf' || p.kind === 'allOf') p.of.forEach(fromPresence);
    };
    const fromCondition = (c: Condition): void => {
      if (c.kind === 'equals' || c.kind === 'present' || c.kind === 'atMost') paths.push(c.path);
      if (c.kind === 'differ') paths.push(c.a, c.b);
      if (c.kind === 'text') paths.push(...c.paths);
      if (c.kind === 'all' || c.kind === 'any') c.of.forEach(fromCondition);
      if (c.kind === 'not') fromCondition(c.of);
    };
    for (const p of PFLICHTANGABEN) {
      paths.push(...p.show);
      for (const each of p.each ?? []) paths.push(...each.paths.map((x) => `${each.group}/${x}`));
      fromPresence(p.presence);
      for (const need of Object.values(p.needs))
        if (need.kind === 'bedingt') fromCondition(need.when);
    }
    MODES.forEach((m) => fromCondition(m.when));
    expect(paths.filter((path) => !known(path))).toEqual([]);
  });
});

describe('checkPflichtangaben – regular invoice', () => {
  it('finds every required statement in a complete invoice', () => {
    const result = checkPflichtangaben(model());
    expect(result.mode).toBe('regel');
    expect(result.missingLabels).toEqual([]);
    expect(result.summary).toBe(TEXTS.allPresent);
    expect(result.summary).not.toMatch(/ordnungsgem/i);
  });

  it('lists what is missing in the summary', () => {
    const result = checkPflichtangaben(model({ 'BT-1': [] as string[] }));
    expect(row(result, 'rechnungsnummer').status).toBe('fehlt');
    expect(result.summary).toBe('Es fehlt: Rechnungsnummer.');
  });

  it('names the missing parts of an address', () => {
    const result = checkPflichtangaben(
      model({
        'BG-7': [{ 'BT-44': 'Käufer AG', 'BG-8': [{ 'BT-52': 'Karlsruhe', 'BT-55': 'DE' }] }],
      }),
    );
    expect(row(result, 'anschrift-empfaenger')).toMatchObject({
      status: 'fehlt',
      missing: ['Straße oder Postfach', 'Postleitzahl'],
    });
  });

  it('accepts a trading name for the supplier and a tax number instead of a VAT id', () => {
    const result = checkPflichtangaben(
      model({
        'BG-4': [
          {
            'BT-28': 'Handelsname',
            'BT-32': '35/123/45678',
            'BG-5': [address(['BT-35', 'BT-38', 'BT-37', 'BT-40'])],
          },
        ],
      }),
    );
    expect(row(result, 'name-leistender').status).toBe('vorhanden');
    expect(row(result, 'steuernummer').status).toBe('vorhanden');
  });

  it('names the positions without quantity or description', () => {
    const result = checkPflichtangaben(
      model({
        'BG-25': [
          { 'BT-126': '1', 'BT-129': '1' },
          { 'BT-126': '2', 'BG-31': [{ 'BT-153': 'X' }] },
        ],
      }),
    );
    expect(row(result, 'menge-art').missing).toEqual([
      'Position 1: Bezeichnung',
      'Position 2: Menge',
    ]);
  });
});

describe('time of supply (§ 14 Abs. 4 Nr. 6 UStG, § 31 Abs. 4 UStDV)', () => {
  const withoutDate = { 'BG-13': [] as Spec[] };

  it('is missing without delivery date, period or note', () => {
    expect(row(checkPflichtangaben(model(withoutDate)), 'leistungszeitpunkt').status).toBe('fehlt');
  });

  it('accepts an invoicing period such as a calendar month', () => {
    const result = checkPflichtangaben(
      model({ ...withoutDate, 'BG-14': [{ 'BT-73': '2026-10-01', 'BT-74': '2026-10-31' }] }),
    );
    expect(row(result, 'leistungszeitpunkt').status).toBe('vorhanden');
  });

  it('accepts periods on every position and names the positions without one', () => {
    const lines = (both: boolean) => [
      {
        'BT-126': '1',
        'BT-129': '1',
        'BG-31': [{ 'BT-153': 'A' }],
        'BG-26': [{ 'BT-134': '2026-10-01' }],
      },
      {
        'BT-126': '2',
        'BT-129': '1',
        'BG-31': [{ 'BT-153': 'B' }],
        ...(both ? { 'BG-26': [{ 'BT-134': '2026-10-02' }] } : {}),
      },
    ];
    expect(
      row(
        checkPflichtangaben(model({ ...withoutDate, 'BG-25': lines(true) })),
        'leistungszeitpunkt',
      ).status,
    ).toBe('vorhanden');
    expect(
      row(
        checkPflichtangaben(model({ ...withoutDate, 'BG-25': lines(false) })),
        'leistungszeitpunkt',
      ),
    ).toMatchObject({
      status: 'fehlt',
      missing: ['Position 2: Beginn'],
    });
  });

  it.each([
    'Leistungsdatum entspricht Rechnungsdatum',
    'Das Lieferdatum entspricht dem Rechnungsdatum.',
    'Leistungszeitpunkt = Rechnungsdatum',
    'Rechnungsdatum entspricht dem Leistungsdatum',
    'Liefertag gleich Rechnungsdatum',
  ])('counts the note "%s" (F3)', (note) => {
    const result = checkPflichtangaben(model({ ...withoutDate, 'BG-1': [{ 'BT-22': note }] }));
    expect(row(result, 'leistungszeitpunkt').status).toBe('vorhanden');
  });

  it('does not count an unrelated note', () => {
    const result = checkPflichtangaben(
      model({
        ...withoutDate,
        'BG-1': [{ 'BT-22': 'Zahlbar bis zum Rechnungsdatum plus 14 Tage' }],
      }),
    );
    expect(row(result, 'leistungszeitpunkt').status).toBe('fehlt');
  });
});

describe('tax rate, tax amount and exemption (§ 14 Abs. 4 Nr. 7, 8 UStG)', () => {
  it('asks for rate and amount of taxable supplies', () => {
    const result = checkPflichtangaben(
      model({
        'BG-23': [{ 'BT-116': '1000.00', 'BT-118': 'S' }],
        'BG-22': [{ 'BT-112': '1190.00' }],
      }),
    );
    expect(row(result, 'steuersatz').missing).toEqual([
      'Aufschlüsselung der Umsatzsteuer 1: Umsatzsteuersatz',
    ]);
    expect(row(result, 'steuerbetrag').status).toBe('fehlt');
  });

  it('does not ask for rate and amount of a supply that is not taxable, but for the hint', () => {
    const notTaxable = model({
      'BG-23': [{ 'BT-116': '1000.00', 'BT-118': 'O' }],
      'BG-22': [{ 'BT-109': '1000.00', 'BT-112': '1000.00' }],
    });
    const result = checkPflichtangaben(notTaxable);
    expect(row(result, 'steuerbetrag').status).toBe('einzelfall');
    expect(row(result, 'steuersatz').status).toBe('vorhanden');
    expect(row(result, 'befreiung').status).toBe('fehlt');
  });

  it('accepts the exemption hint as reason, code or note', () => {
    const exempt = (extra: Spec) =>
      checkPflichtangaben(
        model({
          'BG-23': [{ 'BT-116': '100', 'BT-117': '0', 'BT-118': 'E', 'BT-119': '0', ...extra }],
        }),
      );
    expect(row(exempt({ 'BT-120': 'Steuerfrei nach § 4 Nr. 14 UStG' }), 'befreiung').status).toBe(
      'vorhanden',
    );
    expect(row(exempt({ 'BT-121': 'VATEX-EU-132' }), 'befreiung').status).toBe('vorhanden');
    const note = checkPflichtangaben(
      model({
        'BG-23': [{ 'BT-116': '100', 'BT-117': '0', 'BT-118': 'E', 'BT-119': '0' }],
        'BG-1': [{ 'BT-22': 'Die Leistung ist steuerfrei.' }],
      }),
    );
    expect(row(note, 'befreiung').status).toBe('vorhanden');
  });

  it('needs no exemption hint for taxable supplies only', () => {
    expect(row(checkPflichtangaben(model()), 'befreiung')).toMatchObject({
      status: 'einzelfall',
      reason: expect.stringContaining('steuerfreien') as unknown,
    });
  });

  it('asks for at least one VAT breakdown', () => {
    const result = checkPflichtangaben(model({ 'BG-23': [] as Spec[] }));
    expect(row(result, 'entgelt-aufgeschluesselt')).toMatchObject({
      status: 'fehlt',
      missing: ['keine Angabe „Aufschlüsselung der Umsatzsteuer“'],
    });
  });
});

describe('special cases (§ 14a, § 22c UStG)', () => {
  it('asks for "Steuerschuldnerschaft des Leistungsempfängers" with category AE', () => {
    const ae = (extra: Spec) =>
      checkPflichtangaben(
        model({
          'BG-23': [{ 'BT-116': '100', 'BT-117': '0', 'BT-118': 'AE', 'BT-119': '0', ...extra }],
        }),
      );
    expect(row(ae({}), 'reverse-charge').status).toBe('fehlt');
    expect(row(ae({ 'BT-121': 'VATEX-EU-AE' }), 'reverse-charge').status).toBe('vorhanden');
    // both parties in Germany: § 13b at home, no VAT ids needed
    expect(row(ae({}), 'ust-id-beide').status).toBe('einzelfall');
  });

  it('asks for both VAT ids for an intra-Community supply', () => {
    const result = checkPflichtangaben(
      model({
        'BG-23': [
          {
            'BT-116': '100',
            'BT-117': '0',
            'BT-118': 'K',
            'BT-119': '0',
            'BT-120': 'Steuerfreie innergemeinschaftliche Lieferung',
          },
        ],
      }),
    );
    expect(row(result, 'ust-id-beide').status).toBe('fehlt');
    expect(row(result, 'befreiung').status).toBe('vorhanden');
  });

  it('asks for the VAT ids when the recipient of a reverse-charge service is in another country', () => {
    const result = checkPflichtangaben(
      model({
        'BG-7': [
          {
            'BT-44': 'Acheteur SA',
            'BT-48': 'FR12345678901',
            'BG-8': [{ 'BT-50': 'Rue 1', 'BT-53': '75001', 'BT-52': 'Paris', 'BT-55': 'FR' }],
          },
        ],
        'BG-23': [
          {
            'BT-116': '100',
            'BT-117': '0',
            'BT-118': 'AE',
            'BT-119': '0',
            'BT-120': 'Steuerschuldnerschaft des Leistungsempfängers',
          },
        ],
      }),
    );
    expect(row(result, 'ust-id-beide').status).toBe('vorhanden');
  });

  it('asks for the tax representative completely once one is named', () => {
    const result = checkPflichtangaben(model({ 'BG-11': [{ 'BT-62': 'Vertreter GmbH' }] }));
    expect(row(result, 'fiskalvertreter').status).toBe('fehlt');
    expect(row(checkPflichtangaben(model()), 'fiskalvertreter').status).toBe('einzelfall');
  });

  it('shows "Gutschrift" as present for type code 389 and as individual case otherwise (F2)', () => {
    expect(row(checkPflichtangaben(model({ 'BT-3': '389' })), 'gutschrift').status).toBe(
      'vorhanden',
    );
    expect(row(checkPflichtangaben(model({ 'BT-3': '381' })), 'gutschrift').status).toBe(
      'einzelfall',
    );
  });
});

describe('reduced lists of minimum content (F1)', () => {
  const small: Spec = {
    'BG-22': [{ 'BT-109': '100.00', 'BT-110': '19.00', 'BT-112': '119.00' }],
    'BG-23': [{ 'BT-116': '100.00', 'BT-117': '19.00', 'BT-118': 'S', 'BT-119': '19' }],
  };

  it('treats a total up to 250 EUR as Kleinbetragsrechnung (§ 33 UStDV)', () => {
    const result = checkPflichtangaben(
      model({ ...small, 'BT-1': [] as string[], 'BG-7': [] as Spec[], 'BG-13': [] as Spec[] }),
    );
    expect(result.mode).toBe('kleinbetrag');
    expect(result.modeText).toContain('§ 33 UStDV');
    expect(result.missingLabels).toEqual([]);
    expect(row(result, 'rechnungsnummer')).toMatchObject({
      status: 'einzelfall',
      reason: expect.stringContaining('§ 33 UStDV') as unknown,
    });
    expect(row(result, 'summe').status).toBe('vorhanden');
  });

  it('counts exactly 250 EUR as small amount and 250.01 EUR not', () => {
    const at = (amount: string) => modeOf(model({ 'BG-22': [{ 'BT-112': amount }] })).mode;
    expect(at('250.00')).toBe('kleinbetrag');
    expect(at('250')).toBe('kleinbetrag');
    expect(at('250.01')).toBe('regel');
  });

  it('does not apply § 33 UStDV to other currencies or to §§ 6a, 13b cases', () => {
    expect(modeOf(model({ ...small, 'BT-5': 'CHF' })).mode).toBe('regel');
    expect(modeOf(model({ ...small, 'BG-23': [{ 'BT-116': '100', 'BT-118': 'K' }] })).mode).toBe(
      'regel',
    );
    expect(modeOf(model({ ...small, 'BG-23': [{ 'BT-116': '100', 'BT-118': 'AE' }] })).mode).toBe(
      'regel',
    );
  });

  it('recognises a Kleinunternehmer by the hint on § 19 UStG (§ 34a UStDV)', () => {
    const ku = model({
      'BT-1': [] as string[],
      'BG-13': [] as Spec[],
      'BG-22': [{ 'BT-109': '500.00', 'BT-112': '500.00' }],
      'BG-23': [
        {
          'BT-116': '500.00',
          'BT-117': '0',
          'BT-118': 'E',
          'BT-119': '0',
          'BT-120': 'Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG',
        },
      ],
    });
    const result = checkPflichtangaben(ku);
    expect(result.mode).toBe('kleinunternehmer');
    expect(row(result, 'kleinunternehmer').status).toBe('vorhanden');
    expect(row(result, 'rechnungsnummer').status).toBe('einzelfall');
    expect(row(result, 'leistungszeitpunkt').status).toBe('einzelfall');
    expect(result.rows.some((r) => r.row.id === 'befreiung')).toBe(false);
    expect(result.missingLabels).toEqual([]);
  });

  it('hides the rows of the reduced lists in a regular invoice', () => {
    const ids = checkPflichtangaben(model()).rows.map((r) => r.row.id);
    expect(ids).not.toContain('summe');
    expect(ids).not.toContain('kleinunternehmer');
  });
});

describe('display', () => {
  it('formats dates, amounts, rates, categories and units for German readers', () => {
    expect(displayValue('BT-2', '2026-11-13', undefined)).toBe('13.11.2026');
    expect(displayValue('BT-112', '1190.5', 'EUR')).toBe('1.190,50 EUR');
    expect(displayValue('BT-119', '7.5', undefined)).toBe('7,5 %');
    expect(displayValue('BT-118', 'AE', undefined)).toBe(
      'AE – Steuerschuldnerschaft des Leistungsempfängers',
    );
    expect(displayValue('BT-130', 'HUR', undefined)).toBe('HUR (Stunde)');
    expect(displayValue('BT-130', 'XYZ', undefined)).toBe('XYZ');
    expect(displayValue('BT-27', 'Muster', undefined)).toBe('Muster');
  });

  it('shows the values of each VAT breakdown and each position', () => {
    const result = checkPflichtangaben(model());
    const lines = row(result, 'menge-art').groups[0];
    expect(lines?.items).toHaveLength(2);
    expect(lines?.items[0]).toEqual(
      expect.arrayContaining([
        { label: 'Bezeichnung', value: 'Bürostuhl' },
        { label: 'Einheit', value: 'C62 (Stück)' },
      ]),
    );
    expect(row(result, 'steuerbetrag').values).toEqual([
      { label: 'Summe der Umsatzsteuer', value: '190,00 EUR' },
    ]);
  });
});

describe('wording of the result (screenshot review 2026-11-13)', () => {
  it('ends the summary with one full stop when the last label ends with "USt-IdNr."', () => {
    const result = checkPflichtangaben(model({ 'BG-11': [{ 'BT-62': 'Vertreter GmbH' }] }));
    expect(result.summary).toBe('Es fehlt: Fiskalvertreter: Name, Anschrift und USt-IdNr.');
    expect(sentence('a.')).toBe('a.');
  });

  it('leaves out positions that would only show their number', () => {
    // BASE has no line periods: the time-of-supply row must not list "Positionsnummer: 1"
    expect(row(checkPflichtangaben(model()), 'leistungszeitpunkt').groups[0]?.items).toEqual([]);
    expect(
      row(checkPflichtangaben(model()), 'minderungen').groups.every((g) => g.items.length === 0),
    ).toBe(true);
  });
});

describe('conditions', () => {
  it('compares countries case-insensitively and needs both values', () => {
    const m = model();
    expect(holds(m, { kind: 'differ', a: 'BG-4/BG-5/BT-40', b: 'BG-7/BG-8/BT-55' })).toBe(false);
    expect(holds(m, { kind: 'differ', a: 'BG-4/BG-5/BT-40', b: 'BG-11/BT-62' })).toBe(false);
  });
});
