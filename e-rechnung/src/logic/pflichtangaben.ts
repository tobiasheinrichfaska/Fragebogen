// The Pflichtangaben of an invoice as data: what the law asks for, where it sits in EN 16931 and
// how the tool decides "vorhanden". Assignment to BT/BG after KoSIT/FeRD „Empfehlungen zu
// Pflichtangaben in einer E-Rechnung, Teil I“ (Stand 25.07.2025, page in `source`), wording of the
// law from gesetze-im-internet.de (13.11.2026). Tax decisions are Tobias' (docs/offene-fragen.md).

/** Which list of minimum content applies. */
export type Mode = 'regel' | 'kleinbetrag' | 'kleinunternehmer';

/** How much a mode asks for a row. */
export type Need =
  | { kind: 'immer' }
  /** only when the condition holds; otherwise "nur im Einzelfall nötig" */
  | { kind: 'bedingt'; when: Condition; because: string }
  /** the tool cannot tell from the data whether the case applies */
  | { kind: 'einzelfall'; because: string }
  /** this list of minimum content does not ask for it */
  | { kind: 'nicht'; because: string };

export type Presence =
  | { kind: 'any'; paths: string[] }
  | { kind: 'address'; group: string }
  /** every occurrence of `group` (at least one) has a value at every relative path */
  | { kind: 'each'; group: string; paths: string[]; unless?: { path: string; values: string[] } }
  /** a value matches the pattern (case-insensitive) at one of the paths */
  | { kind: 'text'; paths: string[]; pattern: string }
  | { kind: 'equals'; path: string; values: string[] }
  | { kind: 'anyOf'; of: Presence[] }
  | { kind: 'allOf'; of: Presence[] };

export type Condition =
  | { kind: 'categoryIn'; codes: string[] }
  | { kind: 'equals'; path: string; values: string[] }
  | { kind: 'present'; path: string }
  | { kind: 'differ'; a: string; b: string }
  | { kind: 'atMost'; path: string; limit: string }
  | { kind: 'text'; paths: string[]; pattern: string }
  | { kind: 'all'; of: Condition[] }
  | { kind: 'any'; of: Condition[] }
  | { kind: 'not'; of: Condition };

export interface Pflichtangabe {
  id: string;
  /** Where the law asks for it, per mode where it differs */
  norm: string;
  label: string;
  section: 'paragraph14' | 'besondere';
  /** Terms shown with their values (paths into the model) */
  show: string[];
  /** Per occurrence of a repeated group (positions, VAT breakdown …): what each shows */
  each?: { group: string; paths: string[] }[];
  presence: Presence;
  needs: Record<Mode, Need>;
  /** Shown only in these modes (rows that exist for a special list of minimum content) */
  onlyFor?: Mode[];
  /** Where the KoSIT/FeRD recommendation or the law names it */
  source: string;
}

/** Address parts per address group: street-like lines, postcode, city (country is shown only). */
export const ADDRESS_PARTS: Readonly<
  Record<string, { street: string[]; postcode: string; city: string }>
> = {
  'BG-5': { street: ['BT-35', 'BT-36', 'BT-162'], postcode: 'BT-38', city: 'BT-37' },
  'BG-8': { street: ['BT-50', 'BT-51', 'BT-163'], postcode: 'BT-53', city: 'BT-52' },
  'BG-12': { street: ['BT-64', 'BT-65', 'BT-164'], postcode: 'BT-67', city: 'BT-66' },
  'BG-15': { street: ['BT-75', 'BT-76', 'BT-165'], postcode: 'BT-78', city: 'BT-77' },
};

const NOTES = ['BG-1/BT-22'];
const EXEMPTION_TEXT = ['BG-23/BT-120', 'BG-23/BT-121', ...NOTES];
const EXEMPTION_WORDS =
  'steuerfrei|steuerbefrei|befreit|befreiung|§\\s*4\\s*nr|nicht steuerbar|nicht im inland steuerbar|innergemeinschaftlich|ausfuhr|vatex';
const IMMER: Need = { kind: 'immer' };
const NICHT_KB: Need = {
  kind: 'nicht',
  because: 'Bei einer Kleinbetragsrechnung bis 250 Euro nicht vorgeschrieben (§ 33 UStDV).',
};
const NICHT_KU: Need = {
  kind: 'nicht',
  because: 'Bei einer Rechnung eines Kleinunternehmers nicht vorgeschrieben (§ 34a UStDV).',
};

export const SMALL_AMOUNT_LIMIT = '250';

/**
 * § 14 Abs. 4 Satz 1 Nr. 8 UStG: rate and tax amount for taxable supplies; for exempt or not
 * taxable ones (E, AE, K, G, O) a hint is enough (§ 14a Abs. 5 Satz 2 for AE). Without any VAT
 * breakdown the tool cannot tell and asks for both.
 */
const TAXABLE: Condition = {
  kind: 'any',
  of: [
    { kind: 'categoryIn', codes: ['S', 'Z', 'L', 'M'] },
    { kind: 'not', of: { kind: 'present', path: 'BG-23/BT-118' } },
  ],
};
const TAXABLE_BECAUSE =
  'Nur nötig bei steuerpflichtigen Umsätzen; bei einer Steuerbefreiung genügt ein Hinweis.';

export const PFLICHTANGABEN: readonly Pflichtangabe[] = [
  {
    id: 'name-leistender',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 1 UStG',
    label: 'Name des leistenden Unternehmers',
    section: 'paragraph14',
    show: ['BG-4/BT-27', 'BG-4/BT-28'],
    presence: { kind: 'any', paths: ['BG-4/BT-27', 'BG-4/BT-28'] },
    needs: { regel: IMMER, kleinbetrag: IMMER, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 2: BG-4, BT-27, BT-28',
  },
  {
    id: 'anschrift-leistender',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 1 UStG',
    label: 'Anschrift des leistenden Unternehmers',
    section: 'paragraph14',
    show: [
      'BG-4/BG-5/BT-35',
      'BG-4/BG-5/BT-36',
      'BG-4/BG-5/BT-162',
      'BG-4/BG-5/BT-38',
      'BG-4/BG-5/BT-37',
      'BG-4/BG-5/BT-39',
      'BG-4/BG-5/BT-40',
    ],
    presence: { kind: 'address', group: 'BG-4/BG-5' },
    needs: { regel: IMMER, kleinbetrag: IMMER, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 2: BG-5, BT-35 – BT-40, BT-162',
  },
  {
    id: 'name-empfaenger',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 1 UStG',
    label: 'Name des Leistungsempfängers',
    section: 'paragraph14',
    show: ['BG-7/BT-44', 'BG-7/BT-45'],
    presence: { kind: 'any', paths: ['BG-7/BT-44', 'BG-7/BT-45'] },
    needs: { regel: IMMER, kleinbetrag: NICHT_KB, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 2: BG-7, BT-44, BT-45',
  },
  {
    id: 'anschrift-empfaenger',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 1 UStG',
    label: 'Anschrift des Leistungsempfängers',
    section: 'paragraph14',
    show: [
      'BG-7/BG-8/BT-50',
      'BG-7/BG-8/BT-51',
      'BG-7/BG-8/BT-163',
      'BG-7/BG-8/BT-53',
      'BG-7/BG-8/BT-52',
      'BG-7/BG-8/BT-54',
      'BG-7/BG-8/BT-55',
    ],
    presence: { kind: 'address', group: 'BG-7/BG-8' },
    needs: { regel: IMMER, kleinbetrag: NICHT_KB, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 2: BG-8, BT-50 – BT-55, BT-163',
  },
  {
    id: 'steuernummer',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 2 UStG',
    label: 'Steuernummer oder USt-IdNr. des leistenden Unternehmers',
    section: 'paragraph14',
    show: ['BG-4/BT-31', 'BG-4/BT-32'],
    presence: { kind: 'any', paths: ['BG-4/BT-31', 'BG-4/BT-32'] },
    needs: { regel: IMMER, kleinbetrag: NICHT_KB, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 2: BT-31 oder BT-32',
  },
  {
    id: 'ausstellungsdatum',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 3 UStG',
    label: 'Ausstellungsdatum',
    section: 'paragraph14',
    show: ['BT-2'],
    presence: { kind: 'any', paths: ['BT-2'] },
    needs: { regel: IMMER, kleinbetrag: IMMER, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 3: BT-2',
  },
  {
    id: 'rechnungsnummer',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 4 UStG',
    label: 'Rechnungsnummer',
    section: 'paragraph14',
    show: ['BT-1'],
    presence: { kind: 'any', paths: ['BT-1'] },
    needs: { regel: IMMER, kleinbetrag: NICHT_KB, kleinunternehmer: NICHT_KU },
    source: 'KoSIT/FeRD S. 3: BT-1',
  },
  {
    id: 'menge-art',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 5 UStG',
    label: 'Menge und Art der Lieferung oder Umfang und Art der Leistung',
    section: 'paragraph14',
    show: [],
    each: [
      { group: 'BG-25', paths: ['BT-126', 'BT-129', 'BT-130', 'BG-31/BT-153', 'BG-31/BT-154'] },
    ],
    presence: { kind: 'each', group: 'BG-25', paths: ['BT-129', 'BG-31/BT-153'] },
    needs: { regel: IMMER, kleinbetrag: IMMER, kleinunternehmer: IMMER },
    source: 'KoSIT/FeRD S. 3: BG-25, BT-129, BG-31',
  },
  {
    id: 'leistungszeitpunkt',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 6 UStG, § 31 Abs. 4 UStDV',
    label: 'Zeitpunkt der Lieferung oder Leistung (Kalendermonat genügt)',
    section: 'paragraph14',
    show: ['BG-13/BT-72', 'BG-14/BT-73', 'BG-14/BT-74'],
    each: [{ group: 'BG-25', paths: ['BT-126', 'BG-26/BT-134', 'BG-26/BT-135'] }],
    presence: {
      kind: 'anyOf',
      of: [
        { kind: 'any', paths: ['BG-13/BT-72', 'BG-14/BT-73', 'BG-14/BT-74'] },
        { kind: 'each', group: 'BG-25', paths: ['BG-26/BT-134'] },
        { kind: 'each', group: 'BG-25', paths: ['BG-26/BT-135'] },
        // Tobias 2026-11-13 (F3): a note "Leistungsdatum = Rechnungsdatum" counts as present
        {
          kind: 'text',
          paths: NOTES,
          pattern:
            '(leistungs|liefer)(datum|zeitpunkt|tag)[^.\\n]{0,40}(entspricht|gleich|=|identisch)[^.\\n]{0,25}rechnungsdatum|rechnungsdatum[^.\\n]{0,25}(entspricht|gleich|=|identisch)[^.\\n]{0,25}(leistungs|liefer)(datum|zeitpunkt|tag)',
        },
      ],
    },
    needs: { regel: IMMER, kleinbetrag: NICHT_KB, kleinunternehmer: NICHT_KU },
    source: 'KoSIT/FeRD S. 3–4: BT-72, BG-14, BG-26',
  },
  {
    id: 'vereinnahmung',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 6, Abs. 5 Satz 1 UStG',
    label: 'Zeitpunkt der Vereinnahmung (Anzahlung vor Ausstellung der Rechnung)',
    section: 'paragraph14',
    show: ['BT-7'],
    presence: { kind: 'any', paths: ['BT-7'] },
    needs: {
      regel: {
        kind: 'einzelfall',
        because: 'Nur nötig, wenn das Entgelt vor dem Ausstellungsdatum vereinnahmt wurde.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 4: BT-7',
  },
  {
    id: 'entgelt-aufgeschluesselt',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 7 UStG',
    label: 'Entgelt, aufgeschlüsselt nach Steuersätzen und Steuerbefreiungen',
    section: 'paragraph14',
    show: ['BG-22/BT-109'],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-119', 'BT-116'] }],
    presence: { kind: 'each', group: 'BG-23', paths: ['BT-116', 'BT-118'] },
    needs: {
      regel: IMMER,
      kleinbetrag: {
        kind: 'nicht',
        because:
          'Bei einer Kleinbetragsrechnung genügen Entgelt und Steuer in einer Summe (§ 33 UStDV).',
      },
      kleinunternehmer: {
        kind: 'nicht',
        because: 'Bei einem Kleinunternehmer genügt das Entgelt in einer Summe (§ 34a UStDV).',
      },
    },
    source: 'KoSIT/FeRD S. 5: BG-23, BT-116 (und BG-22, BG-25)',
  },
  {
    id: 'summe',
    norm: '§ 33 Satz 1 Nr. 4 bzw. § 34a Satz 1 Nr. 5 UStDV',
    label: 'Entgelt und Steuerbetrag in einer Summe',
    section: 'paragraph14',
    show: ['BG-22/BT-112'],
    presence: { kind: 'any', paths: ['BG-22/BT-112'] },
    needs: {
      regel: {
        kind: 'nicht',
        because: 'Im Regelfall gelten Entgelt und Steuerbetrag getrennt (Nr. 7 und 8).',
      },
      kleinbetrag: IMMER,
      kleinunternehmer: IMMER,
    },
    onlyFor: ['kleinbetrag', 'kleinunternehmer'],
    source: 'Gesetzestext; BT-112',
  },
  {
    id: 'minderungen',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 7 UStG',
    label: 'Im Voraus vereinbarte Minderungen des Entgelts (z. B. Skonto, Rabatte, Boni)',
    section: 'paragraph14',
    show: ['BT-20'],
    each: [
      { group: 'BG-20', paths: ['BT-92', 'BT-97'] },
      { group: 'BG-25', paths: ['BT-126', 'BG-27/BT-136', 'BG-27/BT-139'] },
    ],
    presence: {
      kind: 'any',
      paths: ['BT-20', 'BG-20/BT-92', 'BG-20/BT-97', 'BG-25/BG-27/BT-136', 'BG-25/BG-27/BT-139'],
    },
    needs: {
      regel: {
        kind: 'einzelfall',
        because:
          'Nur nötig, wenn eine Minderung vereinbart ist, die nicht schon im Entgelt steckt.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 6: BT-20, BG-20 (BT-92, BT-97), BG-27 (BT-136, BT-139 – F8)',
  },
  {
    id: 'steuersatz',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 8 UStG',
    label: 'Anzuwendender Steuersatz',
    section: 'paragraph14',
    show: [],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-119'] }],
    presence: {
      kind: 'each',
      group: 'BG-23',
      paths: ['BT-119'],
      unless: { path: 'BT-118', values: ['O'] },
    },
    needs: {
      regel: { kind: 'bedingt', when: TAXABLE, because: TAXABLE_BECAUSE },
      kleinbetrag: { kind: 'bedingt', when: TAXABLE, because: TAXABLE_BECAUSE },
      kleinunternehmer: {
        kind: 'nicht',
        because: 'Ein Kleinunternehmer weist keine Steuer aus (§ 34a UStDV).',
      },
    },
    source: 'KoSIT/FeRD S. 6: BT-118, BT-119 (BT-152, BT-96)',
  },
  {
    id: 'steuerbetrag',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 8 UStG',
    label: 'Auf das Entgelt entfallender Steuerbetrag',
    section: 'paragraph14',
    show: ['BG-22/BT-110'],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-119', 'BT-117'] }],
    presence: {
      kind: 'allOf',
      of: [
        { kind: 'any', paths: ['BG-22/BT-110'] },
        { kind: 'each', group: 'BG-23', paths: ['BT-117'] },
      ],
    },
    needs: {
      regel: { kind: 'bedingt', when: TAXABLE, because: TAXABLE_BECAUSE },
      kleinbetrag: {
        kind: 'nicht',
        because:
          'Bei einer Kleinbetragsrechnung genügen Entgelt und Steuer in einer Summe (§ 33 UStDV).',
      },
      kleinunternehmer: {
        kind: 'nicht',
        because: 'Ein Kleinunternehmer weist keine Steuer aus (§ 34a UStDV).',
      },
    },
    source: 'KoSIT/FeRD S. 7: BG-23, BT-110',
  },
  {
    id: 'befreiung',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 8 UStG',
    label: 'Hinweis auf eine Steuerbefreiung',
    section: 'paragraph14',
    show: [],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-120', 'BT-121'] }],
    presence: {
      kind: 'anyOf',
      of: [
        { kind: 'any', paths: ['BG-23/BT-120', 'BG-23/BT-121'] },
        { kind: 'text', paths: NOTES, pattern: EXEMPTION_WORDS },
      ],
    },
    needs: {
      regel: {
        kind: 'bedingt',
        when: { kind: 'categoryIn', codes: ['E', 'K', 'G', 'O'] },
        because:
          'Nur nötig bei einer steuerfreien oder nicht steuerbaren Leistung (Kategorie E, K, G oder O).',
      },
      kleinbetrag: {
        kind: 'bedingt',
        when: { kind: 'categoryIn', codes: ['E', 'K', 'G', 'O'] },
        because:
          'Nur nötig bei einer steuerfreien oder nicht steuerbaren Leistung (§ 33 Satz 1 Nr. 4 UStDV).',
      },
      kleinunternehmer: {
        kind: 'nicht',
        because: 'Dafür gilt der Hinweis auf die Kleinunternehmerregelung.',
      },
    },
    onlyFor: ['regel', 'kleinbetrag'],
    source: 'KoSIT/FeRD S. 7: BT-120, BT-121, BG-1',
  },
  {
    id: 'kleinunternehmer',
    norm: '§ 34a Satz 1 Nr. 5 UStDV',
    label: 'Hinweis auf die Steuerbefreiung für Kleinunternehmer (§ 19 UStG)',
    section: 'paragraph14',
    show: [],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-120', 'BT-121'] }],
    presence: { kind: 'text', paths: EXEMPTION_TEXT, pattern: '§\\s*19|kleinunternehmer' },
    needs: {
      regel: { kind: 'nicht', because: 'Nur bei Kleinunternehmern.' },
      kleinbetrag: { kind: 'nicht', because: 'Nur bei Kleinunternehmern.' },
      kleinunternehmer: IMMER,
    },
    onlyFor: ['kleinunternehmer'],
    source: 'Gesetzestext',
  },
  {
    id: 'aufbewahrung',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 9 UStG',
    label:
      'Hinweis auf die Aufbewahrungspflicht des Leistungsempfängers (§ 14b Abs. 1 Satz 5 UStG)',
    section: 'paragraph14',
    show: [],
    presence: { kind: 'text', paths: NOTES, pattern: 'aufbewahr' },
    needs: {
      regel: {
        kind: 'einzelfall',
        because:
          'Nur nötig bei bestimmten Leistungen im Zusammenhang mit einem Grundstück an Nichtunternehmer.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 7: BG-1',
  },
  {
    id: 'gutschrift',
    norm: '§ 14 Abs. 4 Satz 1 Nr. 10 UStG (§ 34a Satz 1 Nr. 6 UStDV)',
    label: 'Angabe „Gutschrift“ (Rechnung vom Leistungsempfänger ausgestellt)',
    section: 'paragraph14',
    show: ['BT-3'],
    // KoSIT/FeRD: BT-3 = 389 with cardinality 1, the note "Gutschrift" 0..1 – the code counts.
    presence: { kind: 'equals', path: 'BT-3', values: ['389'] },
    needs: {
      regel: {
        kind: 'einzelfall',
        because: 'Nur nötig, wenn der Leistungsempfänger die Rechnung ausstellt (Typcode 389).',
      },
      kleinbetrag: {
        kind: 'nicht',
        because: 'Bei einer Kleinbetragsrechnung nicht vorgeschrieben (§ 33 UStDV).',
      },
      kleinunternehmer: {
        kind: 'einzelfall',
        because: 'Nur nötig, wenn der Leistungsempfänger die Rechnung ausstellt (Typcode 389).',
      },
    },
    source: 'KoSIT/FeRD S. 7: BT-3 = 389, BG-1 (F2)',
  },
  {
    id: 'endrechnung',
    norm: '§ 14 Abs. 5 Satz 2 UStG',
    label: 'Endrechnung: abgesetzte Teilentgelte und Steuerbeträge',
    section: 'besondere',
    show: ['BG-22/BT-113', 'BG-22/BT-115', 'BG-24/BT-122'],
    presence: { kind: 'any', paths: ['BG-22/BT-113'] },
    needs: {
      regel: {
        kind: 'einzelfall',
        because: 'Nur nötig in einer Endrechnung nach Anzahlungsrechnungen.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 7: BG-1, BG-24, BT-113, BT-115',
  },
  {
    id: 'reverse-charge',
    norm: '§ 14a Abs. 1 Satz 1, Abs. 5 Satz 1 UStG',
    label: 'Angabe „Steuerschuldnerschaft des Leistungsempfängers“',
    section: 'besondere',
    show: [],
    each: [{ group: 'BG-23', paths: ['BT-118', 'BT-120', 'BT-121'] }],
    presence: {
      kind: 'anyOf',
      of: [
        { kind: 'any', paths: ['BG-23/BT-120', 'BG-23/BT-121'] },
        {
          kind: 'text',
          paths: NOTES,
          pattern: 'steuerschuldnerschaft des leistungsempf|reverse.?charge',
        },
      ],
    },
    needs: {
      regel: {
        kind: 'bedingt',
        when: { kind: 'categoryIn', codes: ['AE'] },
        because: 'Nur nötig, wenn der Leistungsempfänger die Steuer schuldet (Kategorie AE).',
      },
      kleinbetrag: {
        kind: 'bedingt',
        when: { kind: 'categoryIn', codes: ['AE'] },
        because: 'Nur nötig, wenn der Leistungsempfänger die Steuer schuldet (Kategorie AE).',
      },
      kleinunternehmer: { kind: 'nicht', because: 'Nicht bei Kleinunternehmern.' },
    },
    source: 'KoSIT/FeRD S. 8–9: BT-120, BT-121',
  },
  {
    id: 'ust-id-beide',
    norm: '§ 14a Abs. 1 Satz 3, Abs. 3 Satz 2 UStG',
    label: 'USt-IdNr. des leistenden Unternehmers und des Leistungsempfängers',
    section: 'besondere',
    show: ['BG-4/BT-31', 'BG-7/BT-48'],
    presence: {
      kind: 'allOf',
      of: [
        { kind: 'any', paths: ['BG-4/BT-31'] },
        { kind: 'any', paths: ['BG-7/BT-48'] },
      ],
    },
    needs: {
      regel: {
        kind: 'bedingt',
        when: {
          kind: 'any',
          of: [
            { kind: 'categoryIn', codes: ['K'] },
            {
              kind: 'all',
              of: [
                { kind: 'categoryIn', codes: ['AE'] },
                { kind: 'differ', a: 'BG-4/BG-5/BT-40', b: 'BG-7/BG-8/BT-55' },
              ],
            },
          ],
        },
        because:
          'Nur nötig bei einer innergemeinschaftlichen Lieferung (Kategorie K) oder einer Leistung an einen Empfänger in einem anderen Mitgliedstaat, der die Steuer schuldet.',
      },
      kleinbetrag: {
        kind: 'nicht',
        because:
          'Kleinbetragsrechnungen gelten nicht für diese Fälle (§ 33 Satz 3 UStDV) – das Tool prüft dann im Regelfall.',
      },
      kleinunternehmer: { kind: 'nicht', because: 'Nicht bei Kleinunternehmern.' },
    },
    source: 'KoSIT/FeRD S. 9: BT-31, BT-48',
  },
  {
    id: 'sonderregelung',
    norm: '§ 14a Abs. 6 UStG',
    label: 'Angabe „Sonderregelung für Reisebüros“ oder Differenzbesteuerung',
    section: 'besondere',
    show: [],
    presence: { kind: 'text', paths: NOTES, pattern: 'sonderregelung' },
    needs: {
      regel: {
        kind: 'einzelfall',
        because:
          'Nur nötig bei Reiseleistungen (§ 25 UStG) oder Differenzbesteuerung (§ 25a UStG).',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 10: BG-1',
  },
  {
    id: 'dreiecksgeschaeft',
    norm: '§ 14a Abs. 7 UStG',
    label: 'Hinweis auf ein innergemeinschaftliches Dreiecksgeschäft',
    section: 'besondere',
    show: [],
    presence: { kind: 'text', paths: NOTES, pattern: 'dreiecksgesch' },
    needs: {
      regel: {
        kind: 'einzelfall',
        because: 'Nur nötig bei einem innergemeinschaftlichen Dreiecksgeschäft.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 10: BG-1, BT-31, BT-48',
  },
  {
    id: 'fiskalvertreter',
    norm: '§ 22c UStG',
    label: 'Fiskalvertreter: Name, Anschrift und USt-IdNr.',
    section: 'besondere',
    show: ['BG-11/BT-62', 'BG-11/BT-63', 'BG-11/BG-12/BT-66', 'BG-11/BG-12/BT-69'],
    presence: {
      kind: 'allOf',
      of: [
        { kind: 'any', paths: ['BG-11/BT-62'] },
        { kind: 'any', paths: ['BG-11/BT-63'] },
        { kind: 'address', group: 'BG-11/BG-12' },
      ],
    },
    needs: {
      regel: {
        kind: 'bedingt',
        when: { kind: 'present', path: 'BG-11/BT-62' },
        because: 'Nur nötig, wenn ein Fiskalvertreter handelt.',
      },
      kleinbetrag: NICHT_KB,
      kleinunternehmer: NICHT_KU,
    },
    source: 'KoSIT/FeRD S. 10: BG-11, BT-62, BG-12, BT-63',
  },
];

/** When a list of minimum content other than the general one applies (first match wins). */
export const MODES: readonly { mode: Exclude<Mode, 'regel'>; when: Condition; text: string }[] = [
  {
    mode: 'kleinunternehmer',
    when: { kind: 'text', paths: EXEMPTION_TEXT, pattern: '§\\s*19|kleinunternehmer' },
    text: 'Hinweis auf die Kleinunternehmerregelung gefunden: Es gelten die verringerten Angaben nach § 34a UStDV.',
  },
  {
    mode: 'kleinbetrag',
    when: {
      kind: 'all',
      of: [
        { kind: 'equals', path: 'BT-5', values: ['EUR'] },
        { kind: 'atMost', path: 'BG-22/BT-112', limit: SMALL_AMOUNT_LIMIT },
        // § 33 Satz 3 UStDV: not for §§ 6a (intra-Community supply) and 13b UStG
        { kind: 'not', of: { kind: 'categoryIn', codes: ['K', 'AE'] } },
      ],
    },
    text: 'Gesamtbetrag bis 250 Euro: Es gelten die verringerten Angaben einer Kleinbetragsrechnung nach § 33 UStDV.',
  },
];
