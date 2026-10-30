// Beitragsgruppen, Kennzeichen Übergangsbereich and Tätigkeitsschlüssel as proposals (Tobias 2026-10-30):
// scenarios as table rows — answers of person and employer → the proposed key. Every proposed
// Beitragsgruppen combination must be allowed for its Personengruppe (DEÜV Anlage 16). Fictitious data.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;
type Answers = Record<string, unknown>;

function filled(role: string, values: Answers, base: Questionnaire): Questionnaire {
  let q = ok(startPart(base, form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

const GKV: Answers = { krankenversicherung: 'gesetzlich', krankenkasse: 'Muster-BKK' };
const PKV: Answers = { krankenversicherung: 'privat', krankenkasse: 'Muster-PKV' };

function proposals(employer: Answers, person: Answers = GKV) {
  const q = filled(
    'arbeitgeber',
    { agBeschaeftigungsbeginn: '02.11.2026', ...employer },
    filled(
      'person',
      { weitereBeschaeftigung: false, geburtsdatum: '17.05.1990', ...person },
      createQuestionnaire(QUESTIONNAIRE_ID, form),
    ),
  );
  return new Map(derive(q, definition).map((d) => [d.id, d] as const));
}

const monatlich = (betrag: string, art = 'svpflichtig'): Answers => ({
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: betrag,
  agBeschaeftigungsart: art,
});
const azubi = (betrag: string): Answers => ({
  agEntgeltArt: 'ausbildungsverguetung',
  agAusbildungsverguetung: [
    { rowId: 'r1', avJahr: '1', avBetrag: betrag, avGueltigAb: '01.09.2026' },
  ],
  agBeschaeftigungsart: 'ausbildung',
  agAusserbetrieblich: false,
});

// DEÜV Anlage 16 (Version 8.01): allowed digits per Personengruppe, in the order KV RV AV PV, for
// Meldezeiträume from 2009 (KV 2 and RV 2, 4, 6 only for earlier periods).
const ANLAGE_16: Record<string, [string, string, string, string]> = {
  '101': ['01369', '013', '012', '012'],
  '102': ['0139', '01', '01', '012'],
  '103': ['01349', '013', '012', '012'],
  '105': ['013', '01', '01', '012'],
  '106': ['06', '013', '0', '0'],
  '108': ['0349', '01', '0', '012'],
  '109': ['0136', '015', '012', '012'],
  '110': ['0', '0', '0', '0'],
  '119': ['039', '03', '012', '012'],
  '120': ['039', '1', '012', '012'],
  '121': ['013', '01', '01', '012'],
  '122': ['0139', '01', '01', '012'],
  '123': ['0139', '01', '012', '012'],
  '190': ['0', '0', '0', '0'],
};

describe('Beitragsgruppen per scenario', () => {
  it.each<[string, Answers, Answers, string, string, boolean]>([
    ['Azubi with 550 €', azubi('550,00'), GKV, '102', '1111', false],
    ['Azubi with 300 € (Geringverdiener)', azubi('300,00'), GKV, '121', '1111', false],
    ['main employment with 2.500 €', monatlich('2.500,00'), GKV, '101', '1111', false],
    [
      'Minijob, statutory insured, no exemption from RV',
      monatlich('520,00', 'minijob'),
      { ...GKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' },
      '109',
      '6100',
      false,
    ],
    [
      'Minijob, statutory insured, exempt from RV',
      monatlich('520,00', 'minijob'),
      { ...GKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'ja' },
      '109',
      '6500',
      false,
    ],
    [
      'Minijob, privately insured, exempt from RV',
      monatlich('520,00', 'minijob'),
      { ...PKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'ja', pkvBestand2002: 'nein' },
      '109',
      '0500',
      false,
    ],
    [
      '"Minijob" with Weihnachtsgeld above the yearly limit',
      {
        ...monatlich('600,00', 'minijob'),
        agEinmalzahlungen: [
          {
            rowId: 'r1',
            ezArt: 'weihnachtsgeld',
            ezBetrag: '300,00',
            ezMonat: '11',
            ezAnspruch: true,
          },
        ],
      },
      { ...GKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' },
      '101',
      '1111',
      false,
    ],
    ['short-term job', { agBeschaeftigungsart: 'kurzfristig' }, GKV, '110', '0000', false],
    [
      'mandatory internship during the studies',
      { agBeschaeftigungsart: 'praktikum', agPraktikumArt: 'pflichtStudium' },
      GKV,
      '190',
      '0000',
      false,
    ],
    ['Werkstudent with 1.200 €', monatlich('1.200,00', 'werkstudent'), GKV, '106', '0100', false],
    [
      'privately insured above the JAEG (84.000 €)',
      monatlich('7.000,00'),
      { ...PKV, pkvBestand2002: 'nein' },
      '101',
      '0110',
      false,
    ],
    [
      'voluntarily statutory insured above the JAEG: Firmenzahler assumed',
      monatlich('7.000,00'),
      GKV,
      '101',
      '9111',
      true,
    ],
    [
      'privately insured below the JAEG without a reason: insured, check',
      monatlich('3.000,00'),
      { ...PKV, pkvBestand2002: 'nein', kvBefreiung: 'nein', gkvLetzte5Jahre: 'ja' },
      '101',
      '1111',
      true,
    ],
    [
      'old-age full pension after the Regelaltersgrenze, no waiver',
      monatlich('1.200,00'),
      {
        ...GKV,
        geburtsdatum: '01.03.1958',
        situation: ['rente', 'regelaltersgrenze'],
        rentenart: 'altersvoll',
        renteSeit: '01.04.2024',
        rvVerzicht: 'nein',
      },
      '119',
      '3321',
      true,
    ],
    [
      'pupil of a general school with 700 €',
      monatlich('700,00'),
      { ...GKV, situation: ['schueler'], schulart: 'allgemein' },
      '101',
      '1101',
      false,
    ],
    [
      'civil servant with Beihilfe, privately insured, side job',
      monatlich('1.000,00'),
      { ...PKV, situation: ['beamter'], beamtBeihilfe: true, pkvBestand2002: 'nein' },
      '101',
      '0110',
      false,
    ],
  ])('%s', (_name, employer, person, gruppe, beitragsgruppen, check) => {
    const all = proposals(employer, person);
    expect(all.get('personengruppe')).toMatchObject({ status: 'proposed', value: gruppe });
    const bgr = all.get('beitragsgruppen');
    expect(bgr).toMatchObject({ status: 'proposed', value: beitragsgruppen, check });
    // The proposal is always a combination the reports accept.
    const allowed = ANLAGE_16[gruppe];
    expect(allowed).toBeDefined();
    [...beitragsgruppen].forEach((digit, i) => expect(allowed?.[i]).toContain(digit));
    expect(bgr?.detail.join(' ')).toContain('KV');
  });

  it('is incomplete without the person part', () => {
    const q = filled(
      'arbeitgeber',
      { agBeschaeftigungsbeginn: '02.11.2026', ...monatlich('2.500,00') },
      createQuestionnaire(QUESTIONNAIRE_ID, form),
    );
    expect(derive(q, definition).find((d) => d.id === 'beitragsgruppen')).toMatchObject({
      status: 'incomplete',
    });
  });

  it('gives none for an excluded special case', () => {
    expect(
      proposals({ ...monatlich('2.500,00'), agSonderstatus: 'vorstandAg' }).get('beitragsgruppen'),
    ).toMatchObject({ status: 'excluded' });
  });

  it('shows the parts only inside the joined proposals', () => {
    const ids = [...proposals(monatlich('2.500,00')).keys()];
    expect(ids).toEqual([
      'personengruppe',
      'beitragsgruppen',
      'uebergangsbereich',
      'taetigkeitsschluessel',
    ]);
  });
});

describe('Kennzeichen Übergangsbereich', () => {
  it.each<[string, Answers, Answers, string]>([
    ['1.500 € in one job', monatlich('1.500,00'), GKV, '1'],
    ['exactly 2.000 €', monatlich('2.000,00'), GKV, '1'],
    ['2.000,01 €', monatlich('2.000,01'), GKV, '0'],
    [
      'Minijob',
      monatlich('520,00', 'minijob'),
      { ...GKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' },
      '0',
    ],
    ['Azubi with 900 € (never in the Übergangsbereich)', azubi('900,00'), GKV, '0'],
    [
      '"Minijob" 600 € + entitled Weihnachtsgeld 300 € (625 € a month)',
      {
        ...monatlich('600,00', 'minijob'),
        agEinmalzahlungen: [
          {
            rowId: 'r1',
            ezArt: 'weihnachtsgeld',
            ezBetrag: '300,00',
            ezMonat: '11',
            ezAnspruch: true,
          },
        ],
      },
      { ...GKV, artLautVereinbarung: 'minijob', rvBefreiungWunsch: 'nein' },
      '1',
    ],
  ])('%s', (_name, employer, person, value) => {
    expect(proposals(employer, person).get('uebergangsbereich')).toMatchObject({
      status: 'proposed',
      value,
    });
  });

  it('adds the other jobs and asks for a check (§ 20 Abs. 2 SGB IV)', () => {
    const result = proposals(monatlich('1.500,00'), {
      ...GKV,
      weitereBeschaeftigung: true,
      weitereJobs: [
        {
          rowId: 'r1',
          jobArbeitgeber: 'Muster GmbH',
          jobArt: 'svpflichtig',
          jobSeit: '01.01.2025',
          jobEntgeltMonat: '1.000,00',
          jobStundenWoche: '10',
          jobRvBefreit: 'nein',
        },
      ],
    }).get('uebergangsbereich');
    // 2.500 € together: above the Übergangsbereich.
    expect(result).toMatchObject({ status: 'proposed', value: '0' });
  });
});

describe('Tätigkeitsschlüssel (DEÜV Anlage 5)', () => {
  const person: Answers = { ...GKV, schulabschluss: 'abitur', berufsabschluss: 'bachelor' };
  const employer = (more: Answers): Answers => ({
    ...monatlich('2.500,00'),
    agArbeitnehmerueberlassung: false,
    agBefristet: false,
    agArbeitszeitform: 'teilzeit',
    ...more,
  });

  it('joins the KldB code and the four digits', () => {
    expect(
      proposals(employer({ agKldb: '71402' }), person).get('taetigkeitsschluessel'),
    ).toMatchObject({ status: 'proposed', value: '714024412', check: false });
  });

  it('marks the missing KldB code and asks for a check', () => {
    expect(proposals(employer({}), person).get('taetigkeitsschluessel')).toMatchObject({
      status: 'proposed',
      value: '?????4412',
      check: true,
    });
  });

  it.each<[string, Answers, string]>([
    ['full time, open-ended', { agArbeitszeitform: 'vollzeit' }, '1'],
    ['part time, open-ended', {}, '2'],
    [
      'full time, fixed term',
      {
        agArbeitszeitform: 'vollzeit',
        agBefristet: true,
        agBefristungsart: 'kalender',
        agBefristetBis: '30.06.2027',
      },
      '3',
    ],
    [
      'Altersteilzeit counts as open-ended',
      {
        agArbeitszeitform: 'vollzeit',
        agArbeitszeitmodell: 'altersteilzeit',
        agBefristet: true,
        agBefristungsart: 'kalender',
        agBefristetBis: '30.06.2029',
      },
      '1',
    ],
    ['temporary agency work', { agArbeitnehmerueberlassung: true }, '2'],
  ])('%s', (_name, more, digit) => {
    const value = proposals(employer({ agKldb: '71402', ...more }), person).get(
      'taetigkeitsschluessel',
    )?.value;
    const position = 'agArbeitnehmerueberlassung' in more ? 7 : 8;
    expect(value?.[position]).toBe(digit);
  });

  it('refuses a KldB code that is not five digits', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    expect(setValue(q, form, 'arbeitgeber', 'agKldb', '7140')).toMatchObject({ ok: false });
  });
});

describe('definition rules for joined proposals', () => {
  const withDerivations = (derivations: unknown) =>
    checkFormDefinition({ ...definition, derivations } as never).map((i) => i.message);

  it('needs rules or parts, known parts with rules, and value or valueFrom', () => {
    const base = definition.derivations ?? [];
    expect(withDerivations(base)).toEqual([]);
    expect(withDerivations([...base, { id: 'leer', label: 'Leer' }])).toContain(
      'a derivation has either rules or parts',
    );
    expect(
      withDerivations([...base, { id: 'kaputt', label: 'K', parts: ['bgrKv', 'gibtsNicht'] }]),
    ).toContain('unknown derivation "gibtsNicht"');
    expect(
      withDerivations([
        ...base,
        { id: 'doppelt', label: 'D', parts: ['bgrKv', 'beitragsgruppen'] },
      ]),
    ).toContain('"beitragsgruppen" must be a derivation with rules');
    expect(
      withDerivations([...base, { id: 'wert', label: 'W', rules: [{ reason: 'ohne Wert' }] }]),
    ).toContain('a rule has either value or valueFrom');
    expect(
      withDerivations([
        ...base,
        { id: 'feld', label: 'F', rules: [{ valueFrom: 'agBefristet', reason: 'kein Text' }] },
      ]),
    ).toContain('"agBefristet" must be a top-level text field');
  });
});
