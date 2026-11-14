// Check hints (Prüfhinweise) for the recipient of the questionnaire (research 2026-10-30): the app collects
// the facts, people decide the status. A hint combines answers of any roles and named tests (pure
// functions, e.g. the Regelaltersgrenze from the birth date). Informational only — hints never
// block and are never sealed, so verification stays independent of other roles.
import { describeCondition, evaluateCondition, forEachLeaf } from './conditions';
import { ageOn, dayNumber, formatGermanDate, isIsoDate, MONTH_NAMES } from './dates';
import { displayValue } from './display';
import { fieldsById, ownerOfField, roleOf, visibility } from './form';
import { canonicalize } from './jcs';
import {
  berufsmaessigNachVorbeschaeftigungen,
  entgeltImSelbenMonat,
  regelmaessig,
  endOfMonths,
  zeitgrenze,
  type ShortTermJob,
} from './kurzfristig';
import { listCodesOf, optionsOf, validityByName, validityNote, validOn } from './options';
import type {
  CheckHint,
  FieldDefinition,
  FieldId,
  FieldType,
  FieldValue,
  FormDefinition,
  IsoDate,
  Questionnaire,
  RoleId,
} from './model';
import {
  GERINGVERDIENERGRENZE,
  RECHENGROESSEN,
  UEBERGANGSBEREICH_OBERGRENZE,
} from './data/rechengroessen';
import { PLZ_FORMATE } from './data/plzFormate';
import { monthAfter, regelaltersgrenze } from './regelaltersgrenze';

export interface HintResult {
  id: string;
  message: string;
  source?: string;
  /** Computed facts behind the hint, e.g. the day the Regelaltersgrenze is reached. */
  detail: string[];
}

interface HintTest {
  args: readonly FieldType[];
  /** German clause for the catalogue, from the argument labels. */
  describe: (labels: readonly string[]) => string;
  /**
   * undefined when an argument is missing — the hint is then not shown. `uncertain`: the test could
   * not decide for sure (e.g. a year without Rechengrößen); a derivation then asks for a check.
   */
  run: (
    values: readonly FieldValue[],
  ) => { holds: boolean; detail: string[]; uncertain?: boolean } | undefined;
}

function germanMonth(month: string): string {
  const [year = '', number = '1'] = month.split('-');
  return `${MONTH_NAMES[Number(number) - 1] ?? number} ${year}`;
}

/** Regelaltersgrenze of `birth` compared with a reference day (e.g. the start of employment). */
function ragTest(
  holds: (reached: IsoDate, on: IsoDate) => boolean,
  describe: (birth: string, on: string) => string,
): HintTest {
  return {
    args: ['date', 'date'],
    describe: ([birth = '', on = '']) => describe(birth, on),
    run: ([birth, on]) => {
      if (typeof birth !== 'string' || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const reached = regelaltersgrenze(birth);
      if (!reached) return undefined;
      return {
        holds: holds(reached, on),
        detail: [
          `Regelaltersgrenze laut Geburtsdatum: ${formatGermanDate(reached)}; Folgemonat: ${germanMonth(monthAfter(reached))}.`,
        ],
      };
    },
  };
}

const oneYearLater = (date: IsoDate): IsoDate => {
  const [year = 0, rest = ''] = [Number(date.slice(0, 4)), date.slice(4)];
  return `${String(year + 1).padStart(4, '0')}${rest === '-02-29' ? '-02-28' : rest}` as IsoDate;
};

/** A stored money value ("1234.56") or a column of them (summed) in cents; null = nothing. */
function cents(value: FieldValue): number | undefined {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    const parts = value.map(cents).filter((part): part is number => part !== undefined);
    return parts.length === 0 ? undefined : parts.reduce((a, b) => a + b, 0);
  }
  if (typeof value !== 'string' || !/^\d+(?:\.\d{2})?$/.test(value)) return undefined;
  const [euros = '0', rest = '00'] = value.split('.');
  return Number(euros) * 100 + Number(rest);
}

function euro(amount: number): string {
  const [euros = '0', rest = '00'] = (amount / 100).toFixed(2).split('.');
  return `${euros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${rest} €`;
}

/**
 * Own monthly pay plus the monthly pay of other jobs (a table column, summed; may be empty) against
 * a Rechengröße of the year of the start date. A year without data is a hint of its own kind: it
 * holds and says so, never guesses.
 */
function overLimit(
  limit: (year: string) => { monthly: number; label: string } | undefined,
  describe: (labels: readonly string[]) => string,
): HintTest {
  return {
    args: ['money', 'money', 'date'],
    describe,
    run: ([own, others, on]) => {
      const mine = cents(own ?? null);
      if (mine === undefined || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const together = mine + (cents(others ?? null) ?? 0);
      const year = on.slice(0, 4);
      const found = limit(year);
      if (!found) {
        return {
          holds: true,
          detail: [
            `Für ${year} sind die Rechengrößen in der App nicht hinterlegt – bitte selbst prüfen (zusammen ${euro(together)} im Monat).`,
          ],
        };
      }
      return {
        holds: together > found.monthly,
        detail: [
          `Zusammen ${euro(together)} im Monat (davon diese Beschäftigung ${euro(mine)}); ${found.label} ${year}: ${euro(found.monthly)} im Monat.`,
        ],
      };
    },
  };
}

const rechengroesse = (year: string, key: 'bbgKvMonat' | 'bbgRvMonat') => {
  const value = RECHENGROESSEN[year]?.[key];
  return value === undefined ? undefined : cents(value);
};

/**
 * Yearly view of a regular monthly pay: twelve times the month plus the one-off payments the person
 * is entitled to (an amount column filtered by a yes/no column of the same table).
 */
function yearlyPay(monthly: number, oneOff: FieldValue, entitled: FieldValue) {
  const flags = Array.isArray(entitled) ? entitled : [];
  const amounts = Array.isArray(oneOff) ? oneOff : [];
  const extra = amounts.reduce<number>(
    (sum, amount, i) => (flags[i] === true ? sum + (cents(amount) ?? 0) : sum),
    0,
  );
  const yearly = monthly * 12 + extra;
  const facts = `12 × ${euro(monthly)}${extra > 0 ? ` + Einmalzahlungen mit Anspruch ${euro(extra)}` : ''} = ${euro(yearly)} im Jahr`;
  return { yearly, facts };
}

/** The monthly pay: the fixed amount, else the expected one (only one is asked). */
const UEBERGANGSBEREICH_OBERGRENZE_CENT = cents(UEBERGANGSBEREICH_OBERGRENZE) ?? 0;

const ownPay = (fixed: FieldValue | undefined, expected: FieldValue | undefined) =>
  cents(fixed ?? null) ?? cents(expected ?? null);

/** Trailing arguments of the pay tests: kind of bAV, the contracts' contribution and subsidy. */
const UMWANDLUNG_ARGS: readonly FieldType[] = ['choice', 'money', 'money'];

/**
 * Entgeltumwandlung (Geringfügigkeits-Richtlinien 2026, example 14): the converted pay — the
 * contribution minus the employer's subsidy — is no Arbeitsentgelt up to 4 % of the BBG RV
 * (§ 14 Abs. 1 S. 2 SGB IV, § 1 Abs. 1 S. 1 Nr. 9 SvEV) and lowers the pay for the Minijob limit, the
 * Übergangsbereich and the JAEG. Contributions above the 4 % (shared with the employer-financed
 * ones) or a missing amount: uncertain.
 */
function umwandlung(
  kind: FieldValue | undefined,
  beitrag: FieldValue | undefined,
  zuschuss: FieldValue | undefined,
  on: FieldValue | undefined,
): { cents: number; uncertain: boolean; notes: string[] } {
  if (kind !== 'umwandlung' && kind !== 'beides') return { cents: 0, uncertain: false, notes: [] };
  const amounts = Array.isArray(beitrag) ? beitrag : [];
  const subsidies = Array.isArray(zuschuss) ? zuschuss : [];
  let converted = 0;
  let total = 0;
  let uncertain = false;
  amounts.forEach((value, i) => {
    const amount = cents(value ?? null);
    if (amount === undefined) {
      uncertain = true;
      return;
    }
    total += amount;
    converted += Math.max(0, amount - (cents(subsidies[i] ?? null) ?? 0));
  });
  const year = yearOf(on);
  const bbg = year === undefined ? undefined : cents(RECHENGROESSEN[year]?.bbgRvMonat ?? '');
  if (bbg === undefined) return { cents: 0, uncertain: true, notes: [] };
  const cap = Math.round(bbg * 0.04);
  const deducted = Math.min(converted, cap);
  return {
    cents: deducted,
    uncertain: uncertain || total > cap,
    notes:
      deducted === 0
        ? []
        : [
            `Entgeltumwandlung ${euro(deducted)} im Monat abgezogen: kein Arbeitsentgelt bis 4 % der Beitragsbemessungsgrenze der Rentenversicherung (${euro(cap)}; § 14 Abs. 1 S. 2 SGB IV, § 1 Abs. 1 S. 1 Nr. 9 SvEV; Geringfügigkeits-Richtlinien Beispiel 14).`,
          ],
  };
}

/** The monthly pay after an Entgeltumwandlung, with its note. */
function payOf(
  fixed: FieldValue | undefined,
  expected: FieldValue | undefined,
  kind: FieldValue | undefined,
  beitrag: FieldValue | undefined,
  zuschuss: FieldValue | undefined,
  on: FieldValue | undefined,
): { cents: number | undefined; uncertain: boolean; notes: string[] } {
  const gross = ownPay(fixed, expected);
  if (gross === undefined) return { cents: undefined, uncertain: false, notes: [] };
  const off = umwandlung(kind, beitrag, zuschuss, on);
  return { cents: Math.max(0, gross - off.cents), uncertain: off.uncertain, notes: off.notes };
}

/** An amount, or the first row of a table column. */
const firstAmount = (pay: FieldValue | undefined) =>
  cents(Array.isArray(pay) ? (pay[0] ?? null) : (pay ?? null));

const yearOf = (on: FieldValue | undefined) =>
  typeof on === 'string' && isIsoDate(on) ? on.slice(0, 4) : undefined;

/**
 * Regular yearly pay (§ 6 Abs. 1 Nr. 1 SGB V) of this and the other jobs (monthly column) plus
 * one-off payments with entitlement, against the Jahresarbeitsentgeltgrenze that applies: the
 * lower one (§ 6 Abs. 7) when the choice says "ja" (privately insured on 31.12.2002). A missing
 * year holds and says so.
 */
const massgeblicheJaeg: HintTest = {
  args: [
    'money',
    'money',
    'money',
    'money',
    'boolean',
    'choice',
    'date',
    'choice',
    'date',
    ...UMWANDLUNG_ARGS,
  ],
  describe: ([
    fixed = '',
    expected = '',
    others = '',
    oneOff = '',
    entitled = '',
    y2002 = '',
    on = '',
    art = '',
  ]) =>
    `zwölfmal „${fixed}“ bzw. „${expected}“ und „${others}“ der laut „${art}“ versicherungspflichtigen anderen Beschäftigungen mit „${oneOff}“ (nur bei „${entitled}“) die Jahresarbeitsentgeltgrenze des Jahres von „${on}“ übersteigen – die besondere, wenn „${y2002}“ Ja ist`,
  run: ([
    fixed,
    expected,
    others,
    oneOff,
    entitled,
    y2002,
    on,
    arts,
    starts,
    kind,
    beitrag,
    zuschuss,
  ]) => {
    const pay = payOf(fixed, expected, kind, beitrag, zuschuss, on);
    const mine = pay.cents;
    const year = yearOf(on);
    if (mine === undefined || year === undefined) return undefined;
    // The first Minijob next to a main job does not count (GfR B 2.2.2.8: only a "zweite oder
    // weitere" Minijob is added to the main job).
    const insured = insuredOtherPay(
      mine,
      cents(RECHENGROESSEN[year]?.geringfuegigkeitsgrenzeMonat ?? '0') ?? 0,
      otherJobs(arts ?? null, others ?? null, starts ?? null),
      'Geringfügigkeits-Richtlinien B 2.2.2.8',
    );
    const { yearly, facts } = yearlyPay(mine + insured.cents, oneOff ?? null, entitled ?? null);
    const special = y2002 === 'ja';
    const label = special
      ? 'besondere Jahresarbeitsentgeltgrenze (§ 6 Abs. 7 SGB V)'
      : 'Jahresarbeitsentgeltgrenze';
    const value = RECHENGROESSEN[year]?.[special ? 'jaegBesondersJahr' : 'jaegJahr'];
    const limit = value === undefined ? undefined : cents(value);
    if (limit === undefined) {
      return {
        holds: true,
        uncertain: true,
        detail: [
          `Regelmäßiges Jahresarbeitsentgelt: ${facts}. Für ${year} ist die ${label} in der App nicht hinterlegt – bitte selbst prüfen.`,
        ],
      };
    }
    return {
      holds: yearly > limit,
      ...(insured.uncertain || pay.uncertain ? { uncertain: true } : {}),
      detail: [
        `Regelmäßiges Jahresarbeitsentgelt: ${facts}; ${label} ${year}: ${euro(limit)}.`,
        ...pay.notes,
        ...insured.notes,
      ],
    };
  },
};

/**
 * Minijob limit in the yearly view (Geringfügigkeits-Richtlinien): twelve months plus one-off
 * payments with entitlement against twelve times the monthly limit of the start year. `within`
 * chooses the direction; a year without data holds, uncertain.
 */
function geringfuegigkeit(within: boolean): HintTest {
  return {
    args: ['money', 'money', 'money', 'boolean', 'date', ...UMWANDLUNG_ARGS],
    describe: ([fixed = '', expected = '', oneOff = '', entitled = '', on = '', kind = '']) =>
      `zwölfmal „${fixed}“ bzw. „${expected}“ (nach Abzug einer Entgeltumwandlung laut „${kind}“) mit „${oneOff}“ (nur bei „${entitled}“) ${within ? 'höchstens das Zwölffache der' : 'mehr als das Zwölffache der'} Geringfügigkeitsgrenze des Jahres von „${on}“ beträgt`,
    run: ([fixed, expected, oneOff, entitled, on, kind, beitrag, zuschuss]) => {
      const pay = payOf(fixed, expected, kind, beitrag, zuschuss, on);
      const amount = pay.cents;
      const year = yearOf(on);
      if (amount === undefined || year === undefined) return undefined;
      const { yearly, facts } = yearlyPay(amount, oneOff ?? null, entitled ?? null);
      const limit = RECHENGROESSEN[year]?.geringfuegigkeitsgrenzeMonat;
      if (limit === undefined) {
        return {
          holds: true,
          uncertain: true,
          detail: [
            `${facts}. Für ${year} ist die Geringfügigkeitsgrenze in der App nicht hinterlegt – bitte selbst prüfen.`,
          ],
        };
      }
      const max = (cents(limit) ?? 0) * 12;
      return {
        holds: within ? yearly <= max : yearly > max,
        ...(pay.uncertain ? { uncertain: true } : {}),
        detail: [
          `${facts}; Geringfügigkeitsgrenze ${year}: 12 × ${euro(max / 12)} = ${euro(max)}.`,
          ...pay.notes,
        ],
      };
    },
  };
}

/** Kinds of other jobs that count as a main employment next to a Minijob (§ 8 Abs. 2 SGB IV). */
const HAUPTBESCHAEFTIGUNG = new Set(['svpflichtig', 'ausbildung']);

interface OtherJobs {
  /** Index rows of the table of other jobs: kind, monthly pay in cents, start. */
  rows: { art: string; cents: number | undefined; seit: string | undefined }[];
  haupt: boolean;
}

function otherJobs(arts: FieldValue, pays: FieldValue, starts: FieldValue): OtherJobs {
  const kinds = Array.isArray(arts) ? arts : [];
  const amounts = Array.isArray(pays) ? pays : [];
  const since = Array.isArray(starts) ? starts : [];
  const rows = kinds.map((art, i) => {
    const seit = since[i];
    return {
      art: typeof art === 'string' ? art : '',
      cents: cents(amounts[i] ?? null),
      seit: typeof seit === 'string' && isIsoDate(seit) ? seit : undefined,
    };
  });
  return { rows, haupt: rows.some((row) => HAUPTBESCHAEFTIGUNG.has(row.art)) };
}

const MINIJOB_ARGS: readonly FieldType[] = [
  'money',
  'money',
  'money',
  'boolean',
  'date',
  'choice',
  'money',
  'date',
  ...UMWANDLUNG_ARGS,
];

/**
 * Whether this job is a Minijob once the other jobs are counted (Tobias 2026-11-01: "es sollen am
 * Ende die korrekten Schlüsse gezogen werden"; § 8 Abs. 2 SGB IV, Geringfügigkeits-Richtlinien B
 * 2.2): its own pay in the yearly view within the limit, and — next to a main employment — it is
 * the first Minijob taken up (the others are added to the main employment), or — without one — all
 * Minijobs together stay within the limit. Unknown pay or start of another job: uncertain.
 */
const geringfuegigEntlohnt: HintTest = {
  args: MINIJOB_ARGS,
  describe: ([
    fixed = '',
    expected = '',
    oneOff = '',
    entitled = '',
    on = '',
    art = '',
    pay = '',
  ]) =>
    `zwölfmal „${fixed}“ bzw. „${expected}“ mit „${oneOff}“ (nur bei „${entitled}“) höchstens das Zwölffache der Geringfügigkeitsgrenze des Jahres von „${on}“ beträgt und – laut „${art}“ und „${pay}“ – neben einer Hauptbeschäftigung kein anderer Minijob früher begann bzw. ohne Hauptbeschäftigung alle Minijobs zusammen die Grenze einhalten`,
  run: ([fixed, expected, oneOff, entitled, on, arts, pays, starts, kind, beitrag, zuschuss]) => {
    const own = geringfuegigkeit(true).run(
      [fixed, expected, oneOff, entitled, on, kind, beitrag, zuschuss].map(
        (value) => value ?? null,
      ),
    );
    if (!own || !own.holds || own.uncertain) return own;
    const jobs = otherJobs(arts ?? null, pays ?? null, starts ?? null);
    const minijobs = jobs.rows.filter((row) => row.art === 'minijob');
    if (minijobs.length === 0) return own;
    const start = typeof on === 'string' ? on : '';
    if (jobs.haupt) {
      const unknown = minijobs.some((row) => row.seit === undefined);
      const earlier = minijobs.some((row) => row.seit !== undefined && row.seit < start);
      return {
        holds: !earlier,
        uncertain: unknown,
        detail: [
          ...own.detail,
          earlier
            ? 'Neben der Hauptbeschäftigung begann ein anderer Minijob früher; nur der zuerst aufgenommene bleibt frei, dieser wird mit der Hauptbeschäftigung zusammengerechnet (§ 8 Abs. 2 SGB IV).'
            : 'Neben der Hauptbeschäftigung ist dies der zuerst aufgenommene Minijob; er bleibt frei.',
        ],
      };
    }
    const amount = payOf(fixed, expected, kind, beitrag, zuschuss, on).cents ?? 0;
    const unknown = minijobs.some((row) => row.cents === undefined);
    const together = amount + minijobs.reduce((sum, row) => sum + (row.cents ?? 0), 0);
    const limit =
      cents(RECHENGROESSEN[start.slice(0, 4)]?.geringfuegigkeitsgrenzeMonat ?? '0') ?? 0;
    return {
      holds: together <= limit,
      uncertain: unknown,
      detail: [
        ...own.detail,
        `Minijobs zusammen ${euro(together)} im Monat; ${together <= limit ? 'innerhalb' : 'über'} der Geringfügigkeitsgrenze von ${euro(limit)} – sie werden zusammengerechnet (§ 8 Abs. 2 SGB IV).`,
      ],
    };
  },
};

/**
 * A Minijob next to a main employment: free in the unemployment insurance even when it is added to
 * the main employment in the other branches (§ 27 Abs. 2 SGB III).
 */
const minijobNebenHauptbeschaeftigung: HintTest = {
  args: MINIJOB_ARGS,
  describe: ([fixed = '', expected = '', , , on = '', art = '']) =>
    `„${fixed}“ bzw. „${expected}“ höchstens bei der Geringfügigkeitsgrenze des Jahres von „${on}“ liegt und laut „${art}“ eine Hauptbeschäftigung besteht`,
  run: ([fixed, expected, oneOff, entitled, on, arts, pays, starts, kind, beitrag, zuschuss]) => {
    const own = geringfuegigkeit(true).run(
      [fixed, expected, oneOff, entitled, on, kind, beitrag, zuschuss].map(
        (value) => value ?? null,
      ),
    );
    if (!own) return undefined;
    const { haupt } = otherJobs(arts ?? null, pays ?? null, starts ?? null);
    return {
      holds: own.holds && haupt,
      ...(own.uncertain ? { uncertain: true } : {}),
      detail: own.detail,
    };
  },
};

/**
 * The monthly pay of the other jobs that is added to this one, itself subject to insurance, for the
 * Übergangsbereich (Rundschreiben Übergangsbereich 20.12.2022, Tz. 4.2.2): only jobs subject to
 * insurance — not a civil servant's, not a short-term job, not the Minijob taken up first next to a
 * main employment (§ 20 Abs. 2a S. 1 SGB IV); Minijobs that are added up count. This job is a main
 * employment unless its own pay is within the Minijob limit. A job abroad or a missing amount or
 * start leaves the sum uncertain.
 */
function insuredOtherPay(
  own: number,
  limit: number,
  jobs: OtherJobs,
  source = 'Rundschreiben Übergangsbereich Tz. 4.2.2',
) {
  const haupt = own > limit || jobs.haupt;
  const minijobs = jobs.rows.filter((row) => row.art === 'minijob');
  const first = haupt
    ? [...minijobs].sort((a, b) => (a.seit ?? '').localeCompare(b.seit ?? ''))[0]
    : undefined;
  let sum = 0;
  let uncertain = first !== undefined && minijobs.some((row) => row.seit === undefined);
  const left: string[] = [];
  for (const row of jobs.rows) {
    if (row.art === 'svpflichtig' || (row.art === 'minijob' && row !== first)) {
      if (row.cents === undefined) uncertain = true;
      else sum += row.cents;
    } else if (row.art === 'ausland') {
      uncertain = true;
      left.push('Beschäftigung im Ausland (bitte prüfen)');
    } else if (row.art === 'minijob') {
      left.push('der zuerst aufgenommene Minijob neben der Hauptbeschäftigung');
    } else if (row.art === 'beamter') {
      left.push('Bezüge als Beamtin oder Beamter');
    } else if (row.art === 'kurzfristig') {
      left.push('kurzfristige Beschäftigung');
    }
  }
  const notes =
    jobs.rows.length === 0
      ? []
      : [
          `Mitgerechnet aus anderen Beschäftigungen: ${euro(sum)} im Monat${left.length > 0 ? `; nicht mitgerechnet: ${[...new Set(left)].join(', ')}` : ''} (${source}).`,
        ];
  return { cents: sum, uncertain, notes };
}

/**
 * Übergangsbereich (§ 20 Abs. 2 SGB IV): the regular monthly pay — yearly view divided by twelve —
 * with the pay of the other jobs subject to insurance (`insuredOtherPay`) above the Minijob limit
 * and at most 2.000 €. A year without data holds, uncertain.
 */
const uebergangsbereich: HintTest = {
  args: MINIJOB_ARGS,
  describe: ([
    fixed = '',
    expected = '',
    oneOff = '',
    entitled = '',
    on = '',
    art = '',
    pay = '',
  ]) =>
    `„${fixed}“ bzw. „${expected}“ mit „${oneOff}“ (nur bei „${entitled}“) und „${pay}“ der laut „${art}“ versicherungspflichtigen anderen Beschäftigungen im Monat über der Geringfügigkeitsgrenze des Jahres von „${on}“ und höchstens bei 2.000 € liegen`,
  run: ([fixed, expected, oneOff, entitled, on, arts, pays, starts, kind, beitrag, zuschuss]) => {
    const pay = payOf(fixed, expected, kind, beitrag, zuschuss, on);
    const mine = pay.cents;
    const year = yearOf(on);
    if (mine === undefined || year === undefined) return undefined;
    const lower = RECHENGROESSEN[year]?.geringfuegigkeitsgrenzeMonat;
    if (lower === undefined) {
      return {
        holds: true,
        uncertain: true,
        detail: [
          `Für ${year} ist die Geringfügigkeitsgrenze in der App nicht hinterlegt – bitte selbst prüfen.`,
        ],
      };
    }
    const limit = cents(lower) ?? 0;
    const others = insuredOtherPay(
      mine,
      limit,
      otherJobs(arts ?? null, pays ?? null, starts ?? null),
    );
    const { yearly, facts } = yearlyPay(mine + others.cents, oneOff ?? null, entitled ?? null);
    const monthly = yearly / 12;
    return {
      holds: monthly > limit && monthly <= UEBERGANGSBEREICH_OBERGRENZE_CENT,
      ...(others.uncertain || pay.uncertain ? { uncertain: true } : {}),
      detail: [
        `${facts}, im Monat ${euro(Math.round(monthly))}; Übergangsbereich ${year}: über ${euro(limit)} bis ${euro(UEBERGANGSBEREICH_OBERGRENZE_CENT)}.`,
        ...pay.notes,
        ...others.notes,
      ],
    };
  },
};

/**
 * Arguments of the short-term tests: the employer's start, end, working days, framework agreement
 * and fixed term; the person's earlier jobs (kind, from, until, working days, monthly pay); the pay
 * (fixed, expected, one-off amounts and entitlement); the other current jobs (kind, monthly pay,
 * start, fixed until).
 */
const KURZFRISTIG_ARGS: readonly FieldType[] = [
  'date',
  'date',
  'number',
  'boolean',
  'boolean',
  'choice',
  'date',
  'date',
  'number',
  'money',
  'money',
  'money',
  'money',
  'boolean',
  'choice',
  'money',
  'date',
  'date',
  ...UMWANDLUNG_ARGS,
  'boolean',
  'choice',
  'date',
  'date',
];

const isoOrUndefined = (value: FieldValue | undefined) =>
  typeof value === 'string' && isIsoDate(value) ? value : undefined;
const numberOrUndefined = (value: FieldValue | undefined) =>
  typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) ? Number(value) : undefined;
const column = (value: FieldValue | undefined): readonly FieldValue[] =>
  Array.isArray(value) ? value : [];

interface ShortTermFacts {
  job: ShortTermJob;
  limit: number;
  /** This job's regular monthly pay (yearly view / 12), undefined when not answered. */
  own: number | undefined;
  /** Pay of other short-term jobs running at the same time (B 2.3.3). */
  parallel: number;
  facts: string;
}

function shortTermFacts(values: readonly FieldValue[]): ShortTermFacts | 'noYear' | undefined {
  const [beginn, bis, tage, rahmen, befristet, vbArt, vbVon, vbBis, vbTage, vbEntgelt] = values;
  const [
    fixed,
    expected,
    oneOff,
    entitled,
    jobArt,
    jobEntgelt,
    jobSeit,
    jobBis,
    kind,
    beitrag,
    zuschuss,
    landwirtschaft,
    rentenart,
    renteSeit,
    ausgeschiedenSeit,
  ] = values.slice(10);
  const start = isoOrUndefined(beginn);
  if (start === undefined) return undefined;
  const limitValue = RECHENGROESSEN[start.slice(0, 4)]?.geringfuegigkeitsgrenzeMonat;
  if (limitValue === undefined) return 'noYear';
  const job: ShortTermJob = {
    beginn: start,
    bis: isoOrUndefined(bis),
    arbeitstage: numberOrUndefined(tage),
    rahmenvereinbarung: typeof rahmen === 'boolean' ? rahmen : undefined,
    befristet: typeof befristet === 'boolean' ? befristet : undefined,
    frueher: column(vbArt).map((art, i) => ({
      art: typeof art === 'string' ? art : '',
      von: isoOrUndefined(column(vbVon)[i]),
      bis: isoOrUndefined(column(vbBis)[i]),
      arbeitstage: numberOrUndefined(column(vbTage)[i]),
      entgelt: cents(column(vbEntgelt)[i] ?? null),
    })),
    landwirtschaft: landwirtschaft === true,
    // Out of working life (GfR B 2.3.3.3): since the start of a full old-age pension, or since the
    // day a person in the household names.
    ausscheiden:
      rentenart === 'altersvoll' ? isoOrUndefined(renteSeit) : isoOrUndefined(ausgeschiedenSeit),
  };
  const mine = payOf(fixed, expected, kind, beitrag, zuschuss, beginn).cents;
  const yearly = mine === undefined ? undefined : yearlyPay(mine, oneOff ?? null, entitled ?? null);
  const end = job.bis ?? start;
  const parallel = column(jobArt).reduce<number>((sum, art, i) => {
    const seit = isoOrUndefined(column(jobSeit)[i]);
    const until = isoOrUndefined(column(jobBis)[i]);
    const running = (seit === undefined || seit <= end) && (until === undefined || until >= start);
    return art === 'kurzfristig' && running
      ? sum + (cents(column(jobEntgelt)[i] ?? null) ?? 0)
      : sum;
  }, 0);
  return {
    job,
    limit: cents(limitValue) ?? 0,
    own: yearly === undefined ? undefined : Math.round(yearly.yearly / 12),
    parallel,
    facts: yearly?.facts ?? '',
  };
}

/**
 * Whether the job chosen as short-term is one (Geringfügigkeits-Richtlinien 2026 B 2.3): within the
 * time limit, not regular and — where Berufsmäßigkeit matters — not above the pay limit counting the
 * short-term jobs running at the same time or in the same month (B 2.3.3, examples 4c, 4d).
 * `gegeben`: for a person who is not berufsmäßig by status — berufsmäßig only from earlier jobs
 * (B 2.3.3.3). `bisGrenze`: for a person berufsmäßig by status — only within the pay limit. Open
 * facts: holds, uncertain (the employer's choice stands, with a check). `werkstudent`: a Werkstudent
 * job with a fixed term of at most three months is also short-term and then reported as 110
 * (Rundschreiben Studenten und Praktikanten Tz. C 1); the working days are not asked there, so only
 * the three months count.
 */
function kurzfristigkeit(mode: 'gegeben' | 'bisGrenze' | 'werkstudent'): HintTest {
  return {
    args: KURZFRISTIG_ARGS,
    describe: ([beginn = '', bis = '', tage = '', rahmen = '', , vbArt = '']) =>
      `die Aushilfe von „${beginn}“ bis „${bis}“ (mit „${tage}“, „${rahmen}“ und den früheren Beschäftigungen laut „${vbArt}“) die Zeitgrenze von drei Monaten oder 70 Arbeitstagen einhält, nicht regelmäßig ist und ${mode === 'gegeben' ? 'nicht nach den früheren Beschäftigungen berufsmäßig mit einem Entgelt über der Geringfügigkeitsgrenze ist' : 'mit den gleichzeitigen oder im selben Monat liegenden Aushilfen höchstens die Geringfügigkeitsgrenze erreicht'}`,
    run: (values) => {
      const facts = shortTermFacts(values);
      if (facts === undefined) return undefined;
      if (facts === 'noYear') {
        return {
          holds: true,
          uncertain: true,
          detail: ['Für dieses Jahr ist die Geringfügigkeitsgrenze in der App nicht hinterlegt.'],
        };
      }
      const { job, limit, own, parallel } = facts;
      if (
        mode === 'werkstudent' &&
        (job.bis === undefined || job.bis > endOfMonths(job.beginn, 3))
      ) {
        return { holds: false, detail: [] };
      }
      const time = zeitgrenze(job);
      const regular = regelmaessig(job);
      const total = own === undefined ? undefined : own + parallel + entgeltImSelbenMonat(job);
      const payOver = total !== undefined && total > limit;
      const detail = [...time.detail];
      if (regular) {
        detail.push(
          'Rahmenvereinbarung ohne Befristung oder über mehr als ein Jahr: regelmäßig, keine kurzfristige Beschäftigung (Geringfügigkeits-Richtlinien B 2.3).',
        );
      }
      if (total !== undefined && own !== undefined && total !== own) {
        detail.push(
          `Mit den gleichzeitig laufenden oder im selben Monat liegenden Aushilfen ${euro(total)} im Monat (Geringfügigkeits-Richtlinien B 2.3.3).`,
        );
      }
      // A short-term job is fixed in advance (GfR B 2.3, 2.4); "befristet: Nein" rules it out.
      const open =
        mode !== 'werkstudent' && job.befristet === false && job.rahmenvereinbarung !== true;
      if (open) {
        detail.push(
          'Nicht im Voraus befristet: keine kurzfristige Beschäftigung (Geringfügigkeits-Richtlinien B 2.3, 2.4).',
        );
      }
      let notShortTerm = time.status === 'ueberschritten' || regular || open;
      let uncertain = time.status === 'offen';
      let berufsmaessig = false;
      if (mode !== 'bisGrenze') {
        const earlier = berufsmaessigNachVorbeschaeftigungen(job, limit);
        if (payOver || own === undefined) detail.push(...earlier.detail);
        if (earlier.holds && payOver) berufsmaessig = true;
        if (earlier.holds && own === undefined) uncertain = true;
        if (earlier.uncertain && payOver) uncertain = true;
      } else {
        if (payOver) berufsmaessig = true;
        if (own === undefined) uncertain = true;
      }
      if (berufsmaessig && total !== undefined) {
        notShortTerm = true;
        detail.push(
          `Berufsmäßig und mit ${euro(total)} im Monat über der Geringfügigkeitsgrenze von ${euro(limit)}: keine kurzfristige Beschäftigung (Geringfügigkeits-Richtlinien B 2.3.3).`,
        );
      }
      return { holds: !notShortTerm, ...(uncertain ? { uncertain: true } : {}), detail };
    },
  };
}

/**
 * The opposite of a test, with the same facts — e.g. why a job chosen as short-term is none, so a
 * 101 proposal names the limit that failed (Tobias 2026-11-08). Undecided stays undecided.
 */
function negated(test: HintTest): HintTest {
  return {
    args: test.args,
    describe: (labels) => `nicht zutrifft, dass ${test.describe(labels)}`,
    run: (values) => {
      const outcome = test.run(values);
      return outcome && { ...outcome, holds: !outcome.holds };
    },
  };
}

const WERKSTUDENT_STUNDEN = 20;
const WERKSTUDENT_TAGE = 26 * 7;
const hours = (value: number) => String(value).replace('.', ',');

/**
 * The Werkstudentenprivileg (§ 6 Abs. 1 Nr. 3 SGB V, § 27 Abs. 4 Nr. 2 SGB III; Rundschreiben
 * Studenten und Praktikanten 23.11.2016, Tz. A 1.2.4, checked in the text 2026-11-02): only in the
 * semester breaks, or at most 20 hours a week in the lecture period with the other jobs together;
 * above that only with the hours beyond 20 at weekends, evenings or nights (example 1: 18 + 7 at the
 * weekend) and fixed to at most 26 weeks (examples 1, 2, 4). Missing hours or end, or more than 20 hours elsewhere in the last 12 months (the 26-week rule,
 * Tz. A 1.2.4 d): holds, uncertain. Arguments: semester breaks only, hours, mostly at the edges of the
 * day, fixed term, start, fixed until, more than 20 hours in the last 12 months, hours of the other
 * jobs (column).
 */
const werkstudentenprivileg: HintTest = {
  args: ['boolean', 'number', 'boolean', 'boolean', 'date', 'date', 'boolean', 'number'],
  describe: ([ferien = '', stunden = '', randzeiten = '', , , , , andere = '']) =>
    `nach „${ferien}“, „${stunden}“ (mit „${andere}“) und „${randzeiten}“ das Werkstudentenprivileg gilt`,
  run: ([ferien, stunden, randzeiten, befristet, beginn, bis, ueber20, andere]) => {
    if (ferien === true) {
      return {
        holds: true,
        detail: [
          'Nur in der vorlesungsfreien Zeit: Werkstudentenprivileg unabhängig von den Stunden (Rundschreiben Studenten und Praktikanten Tz. A 1.2.4 b).',
        ],
      };
    }
    const own = numberOrUndefined(stunden);
    if (own === undefined) {
      return {
        holds: true,
        uncertain: true,
        detail: ['Die Wochenstunden in der Vorlesungszeit fehlen – bitte prüfen.'],
      };
    }
    const others = column(andere).reduce<number>(
      (sum, value) => sum + (numberOrUndefined(value) ?? 0),
      0,
    );
    const total = own + others;
    const sum =
      others > 0
        ? `${hours(own)} + ${hours(others)} Stunden anderer Beschäftigungen = ${hours(total)} Wochenstunden`
        : `${hours(total)} Wochenstunden`;
    if (total <= WERKSTUDENT_STUNDEN) {
      return {
        holds: true,
        detail: [`${sum}: höchstens 20 (Rundschreiben Studenten und Praktikanten Tz. A 1.2.4 a).`],
      };
    }
    if (randzeiten !== true) {
      return {
        holds: false,
        detail: [
          `${sum} in der Vorlesungszeit, die Stunden über 20 nicht am Wochenende, abends oder nachts: kein Werkstudentenprivileg (Tz. A 1.2.4 a, Beispiele 2 und 4).`,
        ],
      };
    }
    const start = isoOrUndefined(beginn);
    const end = isoOrUndefined(bis);
    const tooLong =
      befristet === false ||
      (start !== undefined &&
        end !== undefined &&
        dayNumber(end) - dayNumber(start) + 1 > WERKSTUDENT_TAGE);
    if (tooLong) {
      return {
        holds: false,
        detail: [
          `${sum}, unbefristet oder länger als 26 Wochen: kein Werkstudentenprivileg (Tz. A 1.2.4 a, Beispiel 1).`,
        ],
      };
    }
    const open = befristet !== true || start === undefined || end === undefined;
    return {
      holds: true,
      ...(open || ueber20 === true ? { uncertain: true } : {}),
      detail: [
        `${sum}, die Stunden über 20 am Wochenende, abends oder nachts, höchstens 26 Wochen befristet: Werkstudentenprivileg (Tz. A 1.2.4 a)${ueber20 === true ? '; in den letzten 12 Monaten schon mehr als 20 Wochenstunden – mehr als 26 Wochen im Jahr beenden es (Tz. A 1.2.4 d), bitte prüfen' : ''}.`,
      ],
    };
  },
};

const WOCHEN_JE_MONAT = 52 / 12;

/** Weekly hours of this job from the working-time answers; undefined where the model gives none. */
function weeklyHours(model: FieldValue | undefined, values: readonly FieldValue[]) {
  const [woche, mo, di, mi, don, fr, sa, so, abruf, monat, jahr] = values.map(numberOrUndefined);
  const rounded = (value: number | undefined) =>
    value === undefined ? undefined : Math.round(value * 100) / 100;
  switch (model) {
    case 'wechselnd':
    case 'gleitzeit':
    case 'vertrauen':
      return woche;
    case 'festeTage': {
      const days = [mo, di, mi, don, fr, sa, so];
      return days.every((day) => day === undefined)
        ? undefined
        : rounded(days.reduce<number>((sum, day) => sum + (day ?? 0), 0));
    }
    case 'abruf':
      return abruf;
    case 'monatsstunden':
      return rounded(monat === undefined ? undefined : monat / WOCHEN_JE_MONAT);
    case 'jahresarbeitszeit':
      return rounded(jahr === undefined ? undefined : jahr / 52);
    default:
      return undefined;
  }
}

/**
 * A student in a job the employer chose as Minijob or "sv-pflichtig" that is not a Minijob, alone or
 * added to the other Minijobs (§ 8 Abs. 2 SGB IV): the Werkstudentenprivileg with the weekly hours of
 * the working-time answers and the other jobs (TK Fachinformation Studierende 2026, Beispiel 6;
 * Rundschreiben Studenten und Praktikanten Tz. A 1.2.4 a). Whether hours above 20 lie at weekends is
 * not asked here, so above 20 there is no privilege; without hours no proposal (undefined).
 */
const werkstudentenprivilegNachArbeitszeit: HintTest = {
  args: [
    'choice',
    ...Array<FieldType>(11).fill('number'),
    'boolean',
    'date',
    'date',
    'boolean',
    'number',
  ],
  describe: ([modell = '', ...rest]) =>
    `nach den Wochenstunden laut „${modell}“ (mit „${rest[15] ?? ''}“) höchstens 20 Wochenstunden vorliegen und damit das Werkstudentenprivileg gilt`,
  run: (values) => {
    const [modell, ...rest] = values;
    const own = weeklyHours(modell, rest.slice(0, 11));
    if (own === undefined) return undefined;
    const [befristet, beginn, bis, ueber20, andere] = rest.slice(11);
    return werkstudentenprivileg.run(
      [false, String(own), false, befristet, beginn, bis, ueber20, andere].map(
        (value) => value ?? null,
      ),
    );
  },
};

/**
 * A job chosen as short-term that is not one, but a Minijob: its pay with the other short-term
 * jobs running at the same time within the limit (B 2.3.3, example 4d) and a Minijob next to the
 * other jobs (`geringfuegigEntlohnt`).
 */
const geringfuegigNebenKurzfristigen: HintTest = {
  args: KURZFRISTIG_ARGS,
  describe: ([beginn = '']) =>
    `das Entgelt mit den gleichzeitig laufenden Aushilfen die Geringfügigkeitsgrenze des Jahres von „${beginn}“ einhält und die Beschäftigung neben den anderen ein Minijob ist`,
  run: (values) => {
    const facts = shortTermFacts(values);
    if (facts === undefined || facts === 'noYear' || facts.own === undefined) return undefined;
    const [beginn] = values;
    const [
      fixed,
      expected,
      oneOff,
      entitled,
      jobArt,
      jobEntgelt,
      jobSeit,
      ,
      kind,
      beitrag,
      zuschuss,
    ] = values.slice(10);
    if (facts.own + facts.parallel > facts.limit) {
      return {
        holds: false,
        detail: [
          `Mit den gleichzeitig laufenden Aushilfen ${euro(facts.own + facts.parallel)} im Monat: über der Geringfügigkeitsgrenze, kein Minijob (Geringfügigkeits-Richtlinien B 2.3.3, Beispiel 4d).`,
        ],
      };
    }
    return geringfuegigEntlohnt.run(
      [
        fixed,
        expected,
        oneOff,
        entitled,
        beginn,
        jobArt,
        jobEntgelt,
        jobSeit,
        kind,
        beitrag,
        zuschuss,
      ].map((value) => value ?? null),
    );
  },
};

/**
 * A second or further Minijob next to a main job whose pay is above the Jahresarbeitsentgeltgrenze
 * (Geringfügigkeits-Richtlinien 2026, examples 25 and 26): the main job is free in the KV, so the
 * Minijob is not added to it there. `bisGrenze`: the Minijobs together also stay within the limit —
 * then no PV from this job, the employer pays the KV flat rate with a report of its own to the
 * Minijob-Zentrale (101 · 6000). Arguments as `geringfuegigEntlohnt`, then "privately insured on
 * 31.12.2002".
 */
function weitererMinijobNebenJaegFrei(bisGrenze: boolean): HintTest {
  return {
    args: [...MINIJOB_ARGS, 'choice'],
    describe: ([fixed = '', expected = '', , , on = '', art = '']) =>
      `„${fixed}“ bzw. „${expected}“ höchstens bei der Geringfügigkeitsgrenze des Jahres von „${on}“ liegt und laut „${art}“ ein früherer Minijob neben einer Hauptbeschäftigung über der Jahresarbeitsentgeltgrenze besteht${bisGrenze ? ' und die Minijobs zusammen die Geringfügigkeitsgrenze einhalten' : ''}`,
    run: ([
      fixed,
      expected,
      oneOff,
      entitled,
      on,
      arts,
      pays,
      starts,
      kind,
      beitrag,
      zuschuss,
      y2002,
    ]) => {
      const own = geringfuegigkeit(true).run(
        [fixed, expected, oneOff, entitled, on, kind, beitrag, zuschuss].map(
          (value) => value ?? null,
        ),
      );
      if (!own || !own.holds) return own;
      const year = yearOf(on);
      const start = typeof on === 'string' ? on : '';
      const jobs = otherJobs(arts ?? null, pays ?? null, starts ?? null);
      const mains = jobs.rows.filter((row) => HAUPTBESCHAEFTIGUNG.has(row.art));
      const minijobs = jobs.rows.filter((row) => row.art === 'minijob');
      const earlier = minijobs.some((row) => row.seit !== undefined && row.seit < start);
      if (mains.length === 0 || !earlier || year === undefined) {
        return { holds: false, detail: [] };
      }
      const special = y2002 === 'ja';
      const jaeg = cents(RECHENGROESSEN[year]?.[special ? 'jaegBesondersJahr' : 'jaegJahr'] ?? '');
      const main = mains.reduce((sum, row) => sum + (row.cents ?? 0), 0) * 12;
      const unknown = jaeg === undefined || mains.some((row) => row.cents === undefined);
      if (!unknown && main <= (jaeg ?? 0)) return { holds: false, detail: [] };
      const limit = cents(RECHENGROESSEN[year]?.geringfuegigkeitsgrenzeMonat ?? '0') ?? 0;
      const together =
        (payOf(fixed, expected, kind, beitrag, zuschuss, on).cents ?? 0) +
        minijobs.reduce((sum, row) => sum + (row.cents ?? 0), 0);
      const within = together <= limit;
      if (bisGrenze && !within) return { holds: false, detail: [] };
      return {
        holds: true,
        ...(unknown ? { uncertain: true } : {}),
        detail: [
          `Hauptbeschäftigung ${euro(main)} im Jahr: über der Jahresarbeitsentgeltgrenze, krankenversicherungsfrei – dieser weitere Minijob wird in der KV nicht mit ihr zusammengerechnet (Geringfügigkeits-Richtlinien, Beispiele 25 und 26).`,
          within
            ? `Minijobs zusammen ${euro(together)} im Monat: innerhalb der Grenze – zusätzlich Meldung an die Minijob-Zentrale mit Personengruppe 101 und Beitragsgruppen 6000 (Pauschalbeitrag zur KV).`
            : `Minijobs zusammen ${euro(together)} im Monat: über der Grenze.`,
        ],
      };
    },
  };
}

/**
 * A second or further Minijob that lifts a main job below the JAEG above it (Geringfügigkeits-
 * Richtlinien 2026 B 2.2.2.8, examples 27; TK example): it is added to the main job and is at first
 * subject to KV; the KV obligation ends with the calendar year only if the JAEG is also exceeded in
 * the next one. Arguments as `weitererMinijobNebenJaegFreierHauptbeschaeftigung`.
 */
const weitererMinijobUeberJaeg: HintTest = {
  args: [...MINIJOB_ARGS, 'choice'],
  describe: ([fixed = '', expected = '', , , on = '', art = '']) =>
    `„${fixed}“ bzw. „${expected}“ höchstens bei der Geringfügigkeitsgrenze des Jahres von „${on}“ liegt, laut „${art}“ ein früherer Minijob neben einer Hauptbeschäftigung unter der Jahresarbeitsentgeltgrenze besteht und erst dieser weitere Minijob die Grenze überschreitet`,
  run: ([
    fixed,
    expected,
    oneOff,
    entitled,
    on,
    arts,
    pays,
    starts,
    kind,
    beitrag,
    zuschuss,
    y2002,
  ]) => {
    const own = geringfuegigkeit(true).run(
      [fixed, expected, oneOff, entitled, on, kind, beitrag, zuschuss].map(
        (value) => value ?? null,
      ),
    );
    if (!own || !own.holds) return own;
    const year = yearOf(on);
    const start = typeof on === 'string' ? on : '';
    const jobs = otherJobs(arts ?? null, pays ?? null, starts ?? null);
    const mains = jobs.rows.filter((row) => HAUPTBESCHAEFTIGUNG.has(row.art));
    const minijobs = [...jobs.rows.filter((row) => row.art === 'minijob')].sort((a, b) =>
      (a.seit ?? '').localeCompare(b.seit ?? ''),
    );
    const earlier = minijobs.some((row) => row.seit !== undefined && row.seit < start);
    if (mains.length === 0 || !earlier || year === undefined) return { holds: false, detail: [] };
    const jaeg = cents(
      RECHENGROESSEN[year]?.[y2002 === 'ja' ? 'jaegBesondersJahr' : 'jaegJahr'] ?? '',
    );
    if (jaeg === undefined) return { holds: false, uncertain: true, detail: [] };
    const main = mains.reduce((sum, row) => sum + (row.cents ?? 0), 0) * 12;
    if (main > jaeg) return { holds: false, detail: [] };
    const later = minijobs.slice(1).reduce((sum, row) => sum + (row.cents ?? 0), 0) * 12;
    const mine = (payOf(fixed, expected, kind, beitrag, zuschuss, on).cents ?? 0) * 12;
    const total = main + later + mine;
    if (total <= jaeg) return { holds: false, detail: [] };
    return {
      holds: true,
      ...(mains.some((row) => row.cents === undefined) ? { uncertain: true } : {}),
      detail: [
        `Hauptbeschäftigung ${euro(main)} und weitere Minijobs zusammen ${euro(total)} im Jahr: erst mit diesem Minijob über der Jahresarbeitsentgeltgrenze von ${euro(jaeg)} – zunächst krankenversicherungspflichtig; die Pflicht endet mit Ablauf des Kalenderjahres, wenn die Grenze auch im nächsten Jahr überschritten wird (Geringfügigkeits-Richtlinien B 2.2.2.8).`,
      ],
    };
  },
};

/** Another job is a vocational training (Rundschreiben Übergangsbereich Tz. 4.3.6.1). */
const andereBeschaeftigungAusbildung: HintTest = {
  args: ['choice'],
  describe: ([art = '']) => `laut „${art}“ eine andere Beschäftigung eine Ausbildung ist`,
  run: ([arts]) => {
    const kinds = Array.isArray(arts) ? arts : [];
    return { holds: kinds.includes('ausbildung'), detail: [] };
  },
};

const SV_SHAPE = /^\d{8}[A-Z]\d{3}$/;
/** The first letter of each part of a name, umlauts and accents resolved ("Özdemir" → O). */
const initials = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .split(/[\s-]+/)
    .map((part) => part.charAt(0))
    .filter((letter) => /^[A-Z]$/.test(letter));

/**
 * The Versicherungsnummer against birth date, Geburtsname and gender (Gemeinsames Rundschreiben
 * Meldeverfahren 17.06.2026 Tz. 3.1.1.2–3.1.1.4). The number is given once and kept, so only a
 * hint. Allowed without a hint: day or month 00 (no birth date in the passport), the day raised by
 * 32 or 64 (serial numbers used up), the initial of a later part of the name (a Vorsatzwort such as
 * „von“ comes first), a name whose first letter is not a Latin one.
 */
const versicherungsnummerWeichtAb: HintTest = {
  args: ['svNumber', 'date', 'text', 'text', 'choice'],
  describe: ([number = '', birth = '', birthName = '', name = '', gender = '']) =>
    `„${number}“ nicht zu „${birth}“, „${birthName}“ (sonst „${name}“) oder „${gender}“ passt`,
  run: ([number, birth, birthName, name, gender]) => {
    if (typeof number !== 'string' || !SV_SHAPE.test(number)) return undefined;
    const detail: string[] = [];
    if (typeof birth === 'string' && isIsoDate(birth)) {
      const [day, month, year] = [number.slice(2, 4), number.slice(4, 6), number.slice(6, 8)];
      const born = Number(birth.slice(8, 10));
      const dayFits = day === '00' || [0, 32, 64].some((plus) => Number(day) === born + plus);
      const monthFits = month === '00' || month === birth.slice(5, 7);
      if (!dayFits || !monthFits || year !== birth.slice(2, 4)) {
        detail.push(
          `Geburtsdatum in der Versicherungsnummer: ${day}.${month}.${year}; angegeben: ${formatGermanDate(birth)}.`,
        );
      }
    }
    const nameAtBirth = typeof birthName === 'string' ? birthName : name;
    if (typeof nameAtBirth === 'string') {
      const letters = initials(nameAtBirth);
      const letter = number.charAt(8);
      if (letters.length > 0 && !letters.includes(letter)) {
        detail.push(
          `Buchstabe in der Versicherungsnummer: ${letter}; Anfangsbuchstabe des Geburtsnamens: ${letters[0] ?? ''}.`,
        );
      }
    }
    if (typeof gender === 'string') {
      const serial = Number(number.slice(9, 11));
      const male = gender === 'maennlich';
      if (male !== serial < 50) {
        detail.push(
          `Seriennummer ${number.slice(9, 11)}: ${serial < 50 ? '00 bis 49 (Männer)' : '50 bis 99 (Frauen, divers, unbestimmt)'}.`,
        );
      }
    }
    return { holds: detail.length > 0, detail };
  },
};

// Territories whose banks have IBANs of another country (SWIFT IBAN Registry): a BIC of Jersey or
// Réunion fits a GB or FR IBAN.
const IBAN_GEBIETE: Readonly<Record<string, readonly string[]>> = {
  FI: ['AX'],
  FR: ['BL', 'GF', 'GP', 'MF', 'MQ', 'NC', 'PF', 'PM', 'RE', 'TF', 'WF', 'YT'],
  GB: ['GG', 'IM', 'JE'],
};

/** The country of a BIC (its 5th and 6th character, ISO 9362) against that of the IBAN. */
const bicPasstNichtZurIban: HintTest = {
  args: ['iban', 'text'],
  describe: ([iban = '', bic = '']) => `das Land von „${bic}“ nicht zu „${iban}“ passt`,
  run: ([iban, bic]) => {
    if (typeof iban !== 'string' || typeof bic !== 'string' || bic.length < 6) return undefined;
    const [ibanLand, bicLand] = [iban.slice(0, 2), bic.slice(4, 6)];
    const fits = bicLand === ibanLand || (IBAN_GEBIETE[ibanLand] ?? []).includes(bicLand);
    return {
      holds: !fits,
      detail: fits ? [] : [`Land im BIC: ${bicLand}; Land der IBAN: ${ibanLand}.`],
    };
  },
};

// The formats hold only N, A, spaces and hyphens, none of them special in a pattern.
const PLZ_PATTERNS = new Map(
  Object.entries(PLZ_FORMATE).map(([sign, [, format]]) => [
    sign,
    new RegExp(`^${format.replace(/N/g, '\\d').replace(/A/g, '[A-Z]')}$`),
  ]),
);
const example = (format: string) =>
  [...format]
    .map((c, i) => (c === 'N' ? String((i + 1) % 10) : c === 'A' ? 'ABCDEFGH'.charAt(i) : c))
    .join('');

/** A postcode abroad against the format of its state (DEÜV Anlage 18, DBAN026). */
const plzAuslandFormat: HintTest = {
  args: ['choice', 'text'],
  describe: ([state = '', plz = '']) =>
    `„${plz}“ nicht dem Format der Postleitzahlen von „${state}“ entspricht`,
  run: ([state, plz]) => {
    if (typeof state !== 'string' || typeof plz !== 'string') return undefined;
    const sign = listCodesOf('deuevStaaten2025', state).laenderkennzeichen ?? '';
    const pattern = PLZ_PATTERNS.get(sign);
    const format = PLZ_FORMATE[sign]?.[1];
    if (!pattern || format === undefined) return undefined;
    const fits = pattern.test(plz.toUpperCase());
    return {
      holds: !fits,
      detail: fits
        ? []
        : [
            `Format in ${state}: ${format} (N = Ziffer, A = Buchstabe), zum Beispiel ${example(format)}.`,
          ],
    };
  },
};

export const HINT_TESTS: Readonly<Record<string, HintTest>> = {
  andereBeschaeftigungAusbildung,
  versicherungsnummerWeichtAb,
  bicPasstNichtZurIban,
  plzAuslandFormat,
  werkstudentenprivileg,
  werkstudentenprivilegNachArbeitszeit,
  geringfuegigEntlohnt,
  geringfuegigNebenKurzfristigen,
  weitererMinijobNebenJaegFreierHauptbeschaeftigung: weitererMinijobNebenJaegFrei(false),
  weitererMinijobUeberJaeg,
  weitererMinijobNebenJaegFreierHauptbeschaeftigungBisGrenze: weitererMinijobNebenJaegFrei(true),
  kurzfristigBefristetBisDreiMonate: kurzfristigkeit('werkstudent'),
  kurzfristigGegeben: kurzfristigkeit('gegeben'),
  kurzfristigGegebenBisGeringfuegigkeitsgrenze: kurzfristigkeit('bisGrenze'),
  nichtKurzfristigGegeben: negated(kurzfristigkeit('gegeben')),
  nichtKurzfristigGegebenBisGeringfuegigkeitsgrenze: negated(kurzfristigkeit('bisGrenze')),
  minijobNebenHauptbeschaeftigung,
  hoechstensGeringfuegigkeitsgrenze: geringfuegigkeit(true),
  ueberGeringfuegigkeitsgrenze: geringfuegigkeit(false),
  imUebergangsbereich: uebergangsbereich,
  ueberMassgeblicheJahresarbeitsentgeltgrenze: massgeblicheJaeg,
  // A list entry (e.g. a health insurer after a merger) that is not valid on the reference day.
  listeneintragNichtGueltig: {
    args: ['text', 'date'],
    describe: ([entry = '', on = '']) =>
      `der Eintrag „${entry}“ am „${on}“ nicht mehr oder noch nicht gilt`,
    run: ([entry, on]) => {
      if (typeof entry !== 'string' || typeof on !== 'string' || !isIsoDate(on)) return undefined;
      const validity = validityByName(entry);
      return {
        holds: validity !== undefined && !validOn(validity, on),
        detail: validity ? [`${entry}: ${validityNote(validity)}.`] : [],
      };
    },
  },
  ab55Jahren: {
    args: ['date', 'date'],
    describe: ([birth = '', on = '']) => `laut „${birth}“ am „${on}“ mindestens 55 Jahre alt`,
    // A birth date after the day asked for leaves the age unknown instead of throwing (audit
    // 2026-11-14: a typo there crashed the proposals, the PDF and the Kanzlei merge).
    run: ([birth, on]) =>
      typeof birth === 'string' &&
      typeof on === 'string' &&
      isIsoDate(birth) &&
      isIsoDate(on) &&
      birth <= on
        ? {
            holds: ageOn(birth, on) >= 55,
            detail: [`Alter am Stichtag: ${ageOn(birth, on)} Jahre.`],
          }
        : undefined,
  },
  // No Krankengeld without six weeks of continued pay (§ 44 Abs. 2 S. 1 Nr. 3 SGB V). The EFZG pays
  // only after four weeks (§ 3 Abs. 3), so a job limited in advance to less than ten weeks has none
  // (Besprechungsergebnis 12.06.2008, TOP 3) — unless a main employment pays it (GfR 2026,
  // Beispiel 40); one resting in parental leave does not.
  kuerzerAlsZehnWochen: {
    args: ['date', 'date', 'choice', 'boolean'],
    describe: ([from = '', until = '', art = '', leave = '']) =>
      `von „${from}“ bis „${until}“ weniger als zehn Wochen liegen und laut „${art}“ keine Hauptbeschäftigung besteht (außer bei „${leave}“)`,
    run: ([from, until, arts, leave]) => {
      if (typeof from !== 'string' || typeof until !== 'string') return undefined;
      if (!isIsoDate(from) || !isIsoDate(until)) return undefined;
      const days = dayNumber(until) - dayNumber(from) + 1;
      const haupt = leave !== true && otherJobs(arts ?? null, null, null).haupt;
      return { holds: days < 70 && !haupt, detail: [`Dauer: ${days} Tage.`] };
    },
  },
  // Not without pay: DEÜV Anlage 2 (121) "Dies gilt nicht für Auszubildende ohne Arbeitsentgelt".
  hoechstensGeringverdienergrenze: {
    args: ['money'],
    describe: ([pay = '']) =>
      `„${pay}“ (bei einer Tabelle die erste Zeile) über 0 € und höchstens 325 € im Monat beträgt`,
    run: ([pay]) => {
      const amount = firstAmount(pay);
      if (amount === undefined) return undefined;
      const max = cents(GERINGVERDIENERGRENZE) ?? 0;
      return {
        holds: amount > 0 && amount <= max,
        detail: [`${euro(amount)} im Monat; Geringverdienergrenze: ${euro(max)}.`],
      };
    },
  },
  // Training or a prescribed internship without pay (DEÜV Anlage 2: 102/105; Rundschreiben
  // Studenten und Praktikanten, Teil C: 0-1-1-0).
  keinArbeitsentgelt: {
    args: ['money', 'money'],
    describe: ([fixed = '', expected = '']) =>
      `„${fixed}“ bzw. „${expected}“ (bei einer Tabelle die erste Zeile) 0 € beträgt`,
    run: ([fixed, expected]) => {
      const amount = firstAmount(fixed) ?? firstAmount(expected);
      if (amount === undefined) return undefined;
      return { holds: amount === 0, detail: amount === 0 ? ['Kein Arbeitsentgelt.'] : [] };
    },
  },
  kuerzerAlsEineWoche: {
    args: ['date', 'date'],
    describe: ([from = '', until = '']) =>
      `von „${from}“ bis „${until}“ weniger als eine Woche liegt`,
    run: ([from, until]) =>
      typeof from === 'string' && typeof until === 'string' && isIsoDate(from) && isIsoDate(until)
        ? { holds: dayNumber(until) - dayNumber(from) + 1 < 7, detail: [] }
        : undefined,
  },
  // E.g. the RV exemption request reaches the employer after the month the job began: it works from
  // the start of that month (§ 6 Abs. 4 S. 2 SGB VI; Geringfügigkeits-Richtlinien B 2.2.4.1).
  inSpaeteremMonat: {
    args: ['date', 'date'],
    describe: ([later = '', earlier = '']) =>
      `„${later}“ in einem späteren Kalendermonat als „${earlier}“ liegt`,
    run: ([later, earlier]) => {
      if (typeof later !== 'string' || typeof earlier !== 'string') return undefined;
      if (!isIsoDate(later) || !isIsoDate(earlier)) return undefined;
      const month = later.slice(0, 7);
      const holds = month > earlier.slice(0, 7);
      const [year = '', mm = ''] = month.split('-');
      return { holds, detail: holds ? [`Wirkt ab 01.${mm}.${year}.`] : [] };
    },
  },
  spaeterAls: {
    args: ['date', 'date'],
    describe: ([later = '', earlier = '']) => `„${later}“ nach „${earlier}“ liegt`,
    run: ([later, earlier]) =>
      typeof later === 'string' &&
      typeof earlier === 'string' &&
      isIsoDate(later) &&
      isIsoDate(earlier)
        ? { holds: later > earlier, detail: [] }
        : undefined,
  },
  ueberBeitragsbemessungsgrenze: overLimit(
    (year) => {
      const kv = rechengroesse(year, 'bbgKvMonat');
      const rv = rechengroesse(year, 'bbgRvMonat');
      return kv === undefined || rv === undefined
        ? undefined
        : {
            monthly: kv,
            label: `Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (Renten- und Arbeitslosenversicherung: ${euro(rv)})`,
          };
    },
    ([own = '', others = '', on = '']) =>
      `„${own}“ und „${others}“ zusammen die Beitragsbemessungsgrenze der Krankenversicherung des Jahres von „${on}“ übersteigen`,
  ),
  regelaltersgrenzeErreicht: ragTest(
    (reached, on) => reached <= on,
    (birth, on) => `laut „${birth}“ die Regelaltersgrenze am „${on}“ erreicht ist`,
  ),
  regelaltersgrenzeNichtErreicht: ragTest(
    (reached, on) => reached > on,
    (birth, on) => `laut „${birth}“ die Regelaltersgrenze am „${on}“ noch nicht erreicht ist`,
  ),
  regelaltersgrenzeInnerhalbEinesJahres: ragTest(
    (reached, on) => reached > on && reached <= oneYearLater(on),
    (birth, on) =>
      `laut „${birth}“ die Regelaltersgrenze innerhalb eines Jahres nach „${on}“ erreicht wird`,
  ),
};

/** Why a hint's test does not fit the definition, or undefined. */
export function hintTestProblem(
  test: NonNullable<CheckHint['test']>,
  fieldOf: (id: FieldId) => FieldDefinition | undefined,
): string | undefined {
  const spec = HINT_TESTS[test.fn];
  if (!spec) return `unknown test "${test.fn}"`;
  if (test.args.length !== spec.args.length) return `"${test.fn}" takes ${spec.args.length} fields`;
  for (const [i, id] of test.args.entries()) {
    const field = fieldOf(id);
    if (!field) return `unknown field "${id}"`;
    if (field.type !== spec.args[i]) return `"${id}" must be a ${spec.args[i] ?? '?'} field`;
  }
  return undefined;
}

/** Roles whose answers a hint, exclusion or derivation rule reads. */
export function rolesOf(
  hint: Pick<CheckHint, 'when' | 'test'>,
  definition: FormDefinition,
): Set<RoleId> {
  const roles = new Set<RoleId>();
  const add = (id: FieldId) => {
    const role =
      ownerOfField(definition, id) ??
      definition.sections
        .flatMap((section) => section.fields)
        .find((field) => field.columns?.some((column) => column.id === id))?.role;
    if (role !== undefined) roles.add(role);
  };
  if (hint.when) forEachLeaf(hint.when, '$', (leaf) => add(leaf.field));
  hint.test?.args.forEach(add);
  return roles;
}

/**
 * The hints that hold for the questionnaire as it stands: each role's current part (the latest
 * version, a draft included), hidden fields counting as unanswered.
 */
const currentPart = (questionnaire: Questionnaire, role: RoleId) =>
  questionnaire.parts[role]?.at(-1);

export interface Values {
  valueOf: (id: FieldId) => FieldValue;
  argumentOf: (id: FieldId) => FieldValue;
}

/** Values of the current parts (drafts included); hidden fields count as unanswered. */
export function valuesOf(questionnaire: Questionnaire, definition: FormDefinition): Values {
  const visible = new Map<RoleId, ReadonlyMap<FieldId, boolean>>();
  const valueOf = (id: FieldId): FieldValue => {
    const role = ownerOfField(definition, id);
    const part = role === undefined ? undefined : currentPart(questionnaire, role);
    if (role === undefined || !part) return null;
    let map = visible.get(role);
    if (!map) {
      map = visibility(definition, role, part.data);
      visible.set(role, map);
    }
    return map.get(id) === true ? (part.data[id] ?? null) : null;
  };
  // A table column in a test stands for the list of its values in the table's rows.
  const tables = new Map<FieldId, FieldDefinition>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      for (const column of field.columns ?? []) tables.set(column.id, field);
    }
  }
  const argumentOf = (id: FieldId): FieldValue => {
    const table = tables.get(id);
    if (!table) return valueOf(id);
    const rows = valueOf(table.id);
    if (!Array.isArray(rows)) return null;
    return rows.map((row) =>
      row !== null && typeof row === 'object' && !Array.isArray(row) ? (row[id] ?? null) : null,
    );
  };
  return { valueOf, argumentOf };
}

/** Whether a condition and named test hold, with the test's facts. */
export function ruleHolds(
  rule: Pick<CheckHint, 'when' | 'test'>,
  values: Values,
): { holds: boolean; detail: string[]; uncertain: boolean } {
  if (rule.when && !evaluateCondition(rule.when, values.valueOf)) {
    return { holds: false, detail: [], uncertain: false };
  }
  if (!rule.test) return { holds: true, detail: [], uncertain: false };
  const outcome = HINT_TESTS[rule.test.fn]?.run(rule.test.args.map(values.argumentOf));
  return {
    holds: outcome?.holds === true,
    detail: outcome?.detail ?? [],
    uncertain: outcome?.uncertain === true,
  };
}

function holding(
  hints: readonly CheckHint[],
  values: Values,
  ready: (hint: CheckHint) => boolean,
): HintResult[] {
  const results: HintResult[] = [];
  for (const hint of hints) {
    if (!ready(hint)) continue;
    if (hint.when && !evaluateCondition(hint.when, values.valueOf)) continue;
    let detail: string[] = [];
    if (hint.test) {
      const outcome = HINT_TESTS[hint.test.fn]?.run(hint.test.args.map(values.argumentOf));
      if (!outcome?.holds) continue;
      detail = outcome.detail;
    }
    results.push({
      id: hint.id,
      message: hint.message,
      ...(hint.source === undefined ? {} : { source: hint.source }),
      detail,
    });
  }
  return results;
}

/**
 * Special cases (`exclusions`) that hold for the questionnaire as it stands — evaluated as soon as
 * the answers exist, whichever role gave them. While one holds, signing and passing on are refused.
 */
export function activeExclusions(
  questionnaire: Questionnaire,
  definition: FormDefinition,
): HintResult[] {
  return holding(definition.exclusions ?? [], valuesOf(questionnaire, definition), () => true);
}

export function checkHints(questionnaire: Questionnaire, definition: FormDefinition): HintResult[] {
  const values = valuesOf(questionnaire, definition);
  const { valueOf } = values;
  const results = holding(definition.checkHints ?? [], values, (hint) =>
    [...rolesOf(hint, definition)].every((role) => currentPart(questionnaire, role)),
  );
  return [
    ...results,
    ...fromRoleHints(questionnaire, definition, valueOf).map(({ id, message, detail }) => ({
      id,
      message,
      detail,
    })),
  ];
}

/** The fields a hint reads: its condition's fields, then its test's arguments, each once. */
export function hintFields(hint: Pick<CheckHint, 'when' | 'test'>): FieldId[] {
  const ids: FieldId[] = [...(hint.test?.args ?? [])];
  if (hint.when) forEachLeaf(hint.when, '$', (leaf) => ids.push(leaf.field));
  return [...new Set(ids)];
}

/**
 * The hints marked `showWhileFilling` that hold for the role filling in, on its current part (a
 * draft included) — for the warning after an answer and the top of the summary. Never blocks.
 */
export function fillingHints(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  role: RoleId,
): (HintResult & { fields: FieldId[] })[] {
  const own = (definition.checkHints ?? []).filter(
    (hint) =>
      hint.showWhileFilling === true && [...rolesOf(hint, definition)].every((r) => r === role),
  );
  const fields = new Map(own.map((hint) => [hint.id, hintFields(hint)]));
  const values = valuesOf(questionnaire, definition);
  const defined = holding(own, values, () => Boolean(currentPart(questionnaire, role))).map(
    (result) => ({ ...result, fields: fields.get(result.id) ?? [] }),
  );
  // What another role decided or proposed earlier and the role still holds: the role sees it
  // before it signs, not only the Kanzlei (audit 2026-11-14).
  const earlier = fromRoleHints(questionnaire, definition, values.valueOf)
    .filter((hint) => hint.role === role && hint.earlier)
    .map(({ id, message, detail, fields: ids }) => ({ id, message, detail, fields: ids }));
  return [...defined, ...earlier];
}

/**
 * A field another role decides (fromRole) that differs from that role's answer — e.g. the person
 * signed before the employer changed the kind of wage tax. An own extra option ("Weiß ich nicht")
 * is no contradiction.
 *
 * With the deciding role's history (audit 2026-11-14), stated as it is, never changing an answer:
 * a decision its newest sealed version no longer makes, while the role still holds the earlier
 * one; a proposal it changed, while the role still holds the earlier one.
 */
interface FromRoleHint extends HintResult {
  /** The role whose answer the hint is about, and that answer's field. */
  role: RoleId;
  fields: FieldId[];
  /** The role still holds what the other role decided or proposed before (shown to the role too). */
  earlier: boolean;
}

function fromRoleHints(
  questionnaire: Questionnaire,
  definition: FormDefinition,
  valueOf: (id: FieldId) => FieldValue,
): FromRoleHint[] {
  const fields = fieldsById(definition);
  const results: FromRoleHint[] = [];
  const same = (a: FieldValue, b: FieldValue) => canonicalize(a) === canonicalize(b);
  for (const field of fields.values()) {
    const from = field.fromRole;
    const source = from && fields.get(from.field);
    if (!from || !source) continue;
    if (!currentPart(questionnaire, field.role) || !currentPart(questionnaire, from.role)) continue;
    const own = valueOf(field.id);
    const decided = valueOf(source.id);
    if (own === null) continue;
    const ownRole = roleOf(definition, field.role)?.label ?? field.role;
    const fromRole = roleOf(definition, from.role)?.label ?? from.role;
    const sealed = (questionnaire.parts[from.role] ?? []).filter((part) => part.seal);
    const earlier = sealed.slice(0, -1).map((part) => part.data[from.field] ?? null);
    const heldEarlier = earlier.some((value) => value !== null && same(value, own));
    const hint = { role: field.role, fields: [field.id], detail: [] };
    if (decided === null) {
      if (from.changeable !== true && heldEarlier) {
        results.push({
          ...hint,
          earlier: true,
          id: `fromRoleWithdrawn:${field.id}`,
          message: `„${field.label}“ hatte ${fromRole} festgelegt; in seiner neuen Fassung legt ${fromRole} das nicht mehr fest. Im Teil „${ownRole}“ steht noch „${displayValue(field, own)}“ – bitte prüfen.`,
        });
      }
      continue;
    }
    if (same(own, decided)) continue;
    if (source.type === 'choice' && !optionsOf(source).some((option) => option.id === own))
      continue;
    // A proposal the role was free to change is news for the other role, not a contradiction —
    // unless the role still holds what the other role proposed before.
    results.push({
      ...hint,
      earlier: from.changeable === true && heldEarlier,
      id: `fromRole:${field.id}`,
      message:
        from.changeable === true
          ? heldEarlier
            ? `${fromRole} schlägt für „${field.label}“ jetzt „${displayValue(source, decided)}“ vor; im Teil „${ownRole}“ steht noch der frühere Vorschlag „${displayValue(field, own)}“ – bitte prüfen.`
            : `„${field.label}“ geändert: ${fromRole} hatte „${displayValue(source, decided)}“ vorbelegt, im Teil „${ownRole}“ steht jetzt „${displayValue(field, own)}“.`
          : `„${field.label}“ weicht ab: ${fromRole} gibt „${displayValue(source, decided)}“ an, im Teil „${ownRole}“ steht „${displayValue(field, own)}“. Davon hängen Fragen an „${ownRole}“ ab; bitte klären und gegebenenfalls neu unterschreiben lassen.`,
    });
  }
  return results;
}

/** When a hint applies, in German (catalogue). */
export function describeHint(hint: CheckHint, definition: FormDefinition): string {
  const fields = fieldsById(definition);
  const parts: string[] = [];
  if (hint.when) parts.push(describeCondition(hint.when, fields));
  if (hint.test) {
    const labels = hint.test.args.map((id) => fields.get(id)?.label ?? id);
    parts.push(HINT_TESTS[hint.test.fn]?.describe(labels) ?? hint.test.fn);
  }
  return `wenn ${parts.join(' und ')}`;
}
