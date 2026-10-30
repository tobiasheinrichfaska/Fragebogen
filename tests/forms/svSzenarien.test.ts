// Scenarios of the social-insurance assessment (Tobias 2026-10-30: "automatisierte Tests, z. B. Azubis
// mit unter 600 € Gehalt"): answers of person and employer → Personengruppe proposal, check hints and
// exclusions. One table row per case; add a case by adding a row. Fictitious data.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { visibleFields } from '../../src/logic/form';
import { activeExclusions, checkHints } from '../../src/logic/hints';
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

function assess(employer: Answers, person: Answers = {}) {
  const q = filled(
    'arbeitgeber',
    { agBeschaeftigungsbeginn: '02.11.2026', ...employer },
    filled(
      'person',
      { weitereBeschaeftigung: false, ...person },
      createQuestionnaire(QUESTIONNAIRE_ID, form),
    ),
  );
  return {
    gruppe: derive(q, definition).find((d) => d.id === 'personengruppe'),
    hints: checkHints(q, definition).map((h) => h.id),
    exclusions: activeExclusions(q, definition).map((h) => h.id),
  };
}

const shown = (role: string, data: Answers) =>
  visibleFields(definition, role, data as never).map((f) => f.id);

const azubi = (betrag: string, art = 'ausbildung'): Answers => ({
  agEntgeltArt: 'ausbildungsverguetung',
  agAusbildungsverguetung: [
    { rowId: 'r1', avJahr: '1', avBetrag: betrag, avGueltigAb: '01.09.2026' },
  ],
  agBeschaeftigungsart: art,
  ...(art === 'ausbildung' ? { agAusserbetrieblich: false } : {}),
});
const monatlich = (betrag: string, art: string): Answers => ({
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: betrag,
  agBeschaeftigungsart: art,
});
const weihnachtsgeld = (betrag: string, anspruch: boolean): Answers => ({
  agEinmalzahlungen: [
    { rowId: 'r1', ezArt: 'weihnachtsgeld', ezBetrag: betrag, ezMonat: '11', ezAnspruch: anspruch },
  ],
});
const PRIVAT = { krankenversicherung: 'privat', krankenkasse: 'Muster-PKV' };

describe('Personengruppe per scenario', () => {
  it.each<[string, Answers, Answers, string, boolean]>([
    ['Azubi with 550 € — never a Minijob', azubi('550,00'), {}, '102', false],
    ['Azubi with exactly 603 €', azubi('603,00'), {}, '102', false],
    ['Azubi with 300 € (Geringverdiener)', azubi('300,00'), {}, '121', false],
    ['Azubi with exactly 325 €', azubi('325,00'), {}, '121', false],
    ['dual student with 550 €', azubi('550,00', 'dualesStudium'), {}, '102', false],
    ['Minijob with 520 €', monatlich('520,00', 'minijob'), {}, '109', false],
    ['Minijob with exactly 603 €', monatlich('603,00', 'minijob'), {}, '109', false],
    [
      'Minijob 600 € + Weihnachtsgeld 300 € with entitlement (7.500 € > 7.236 €)',
      { ...monatlich('600,00', 'minijob'), ...weihnachtsgeld('300,00', true) },
      {},
      '101',
      true,
    ],
    [
      'Minijob 600 € + voluntary Weihnachtsgeld 300 € (does not count)',
      { ...monatlich('600,00', 'minijob'), ...weihnachtsgeld('300,00', false) },
      {},
      '109',
      false,
    ],
    [
      'Minijob paid by the hour, 500 € expected',
      {
        agEntgeltArt: 'stundenlohn',
        agStundenlohn: '14,50',
        agErwartetMonat: '500,00',
        agBeschaeftigungsart: 'minijob',
      },
      {},
      '109',
      false,
    ],
    ['main employment with 2.500 €', monatlich('2.500,00', 'svpflichtig'), {}, '101', false],
    [
      'old-age pension of a Versorgungswerk',
      monatlich('1.200,00', 'svpflichtig'),
      { situation: ['rente'], rentenart: 'versorgungswerkAlter', rvVerzicht: 'nein' },
      '119',
      false,
    ],
    [
      'never insured until the Regelaltersgrenze: free, but not Personengruppe 119',
      monatlich('1.200,00', 'svpflichtig'),
      { situation: ['regelaltersgrenze'], rvNieVersichert: 'nieVersichert', rvVerzicht: 'nein' },
      '101',
      false,
    ],
  ])('%s', (_name, employer, person, value, check) => {
    expect(assess(employer, person).gruppe).toMatchObject({ status: 'proposed', value, check });
  });
});

describe('check hints per scenario', () => {
  it.each<[string, Answers, Answers, string[], string[]]>([
    [
      'Azubi with 550 € gets no Minijob hint',
      azubi('550,00'),
      { artLautVereinbarung: 'ausbildung' },
      [],
      [
        'minijobUeberGrenzeMonatsentgelt',
        'svpflichtigUnterGrenzeMonatsentgelt',
        'minijobAusbildung',
        'artWeichtAb',
      ],
    ],
    [
      'Azubi entered as Minijob by the employer',
      { ...monatlich('550,00', 'minijob') },
      { artLautVereinbarung: 'ausbildung' },
      ['minijobAusbildung', 'artWeichtAb'],
      [],
    ],
    [
      'Minijob above the limit in the yearly view',
      { ...monatlich('600,00', 'minijob'), ...weihnachtsgeld('300,00', true) },
      {},
      ['minijobUeberGrenzeMonatsentgelt'],
      ['svpflichtigUnterGrenzeMonatsentgelt'],
    ],
    [
      'hourly Minijob expected above the limit',
      {
        agEntgeltArt: 'stundenlohn',
        agStundenlohn: '15,00',
        agErwartetMonat: '700,00',
        agBeschaeftigungsart: 'minijob',
      },
      {},
      ['minijobUeberGrenzeErwartet'],
      [],
    ],
    [
      'employment subject to insurance with Minijob pay',
      monatlich('500,00', 'svpflichtig'),
      {},
      ['svpflichtigUnterGrenzeMonatsentgelt'],
      ['minijobUeberGrenzeMonatsentgelt'],
    ],
    [
      'private insurance on 31.12.2002: the lower JAEG applies (72.000 € > 69.750 €)',
      monatlich('6.000,00', 'svpflichtig'),
      { ...PRIVAT, pkvBestand2002: 'ja' },
      ['jaeg2002Monatsentgelt'],
      ['jaegMonatsentgelt'],
    ],
    [
      'same pay without that status stays below the JAEG (72.000 € < 77.400 €)',
      monatlich('6.000,00', 'svpflichtig'),
      { ...PRIVAT, pkvBestand2002: 'nein' },
      [],
      ['jaegMonatsentgelt', 'jaeg2002Monatsentgelt'],
    ],
    [
      'an entitled one-off payment lifts the yearly pay above the JAEG (78.000 €)',
      { ...monatlich('6.000,00', 'svpflichtig'), ...weihnachtsgeld('6.000,00', true) },
      { ...PRIVAT, pkvBestand2002: 'nein' },
      ['jaegMonatsentgelt'],
      [],
    ],
    [
      'an exemption from KV without the notice at hand',
      monatlich('3.000,00', 'svpflichtig'),
      { ...PRIVAT, kvBefreiung: 'ja', kvBefreiungGrund: 'teilzeit' },
      ['kvBefreiungsbescheid'],
      [],
    ],
    [
      'an exemption from KV with the notice at hand',
      { ...monatlich('3.000,00', 'svpflichtig'), agUnterlagen: ['kvBefreiungsbescheid'] },
      { ...PRIVAT, kvBefreiung: 'ja', kvBefreiungGrund: 'teilzeit' },
      [],
      ['kvBefreiungsbescheid'],
    ],
    [
      'Vorruhestandsgeld without pay',
      {
        agEntgeltArt: 'keines',
        agBeschaeftigungsart: 'vorruhestand',
        agVorruhestandBis: '31.12.2028',
        agVorruhestandBetrag: '1.500,00',
      },
      {},
      [],
      ['entgeltOhneVorruhestand'],
    ],
    [
      'Vorruhestandsgeld with a monthly salary',
      { ...monatlich('1.500,00', 'vorruhestand') },
      {},
      ['entgeltOhneVorruhestand'],
      [],
    ],
  ])('%s', (_name, employer, person, present, absent) => {
    const { hints } = assess(employer, person);
    expect(hints).toEqual(expect.arrayContaining(present));
    for (const id of absent) expect(hints).not.toContain(id);
  });
});

describe('special cases are excluded (Tobias: not covered → pre-question)', () => {
  it.each<[string, Answers, string]>([
    ['member of the board of a stock corporation', { agSonderstatus: 'vorstandAg' }, 'vorstandAg'],
    ['clergy or member of a religious order', { agSonderstatus: 'geistlich' }, 'geistlich'],
    ['civil-service style protection', { agSonderstatus: 'beamtenrechtlich' }, 'beamtenrechtlich'],
    ['miners’ insurance (Knappschaft)', { agBetriebsart: 'knappschaft' }, 'knappschaft'],
  ])('%s', (_name, employer, exclusion) => {
    expect(assess({ ...monatlich('2.500,00', 'svpflichtig'), ...employer }).exclusions).toEqual([
      exclusion,
    ]);
    expect(assess({ ...monatlich('2.500,00', 'svpflichtig'), ...employer }).gruppe?.status).toBe(
      'excluded',
    );
  });

  it('excludes nothing for an ordinary employee', () => {
    expect(assess(monatlich('2.500,00', 'svpflichtig')).exclusions).toEqual([]);
  });
});

describe('questions that close the gaps of the SV assessment (2026-10-30)', () => {
  it('asks pensioners about Beihilfe as well (§ 6 Abs. 1 Nr. 6 SGB V)', () => {
    expect(shown('person', { situation: ['pensionaer'] })).toContain('beamtBeihilfe');
    expect(shown('person', { situation: ['beamter'] })).toContain('beamtBeihilfe');
    expect(shown('person', { situation: ['arbeitnehmer'] })).not.toContain('beamtBeihilfe');
  });

  it('asks about a KV exemption and the lower JAEG only outside the statutory insurance', () => {
    const privat = shown('person', { krankenversicherung: 'privat' });
    expect(privat).toEqual(expect.arrayContaining(['kvBefreiung', 'pkvBestand2002']));
    expect(shown('person', { krankenversicherung: 'anderweitig' })).toContain('kvBefreiung');
    expect(shown('person', { krankenversicherung: 'anderweitig' })).not.toContain('pkvBestand2002');
    const gesetzlich = shown('person', { krankenversicherung: 'gesetzlich' });
    expect(gesetzlich).not.toContain('kvBefreiung');
    expect(shown('person', { krankenversicherung: 'privat', kvBefreiung: 'ja' })).toEqual(
      expect.arrayContaining(['kvBefreiungGrund', 'kvBefreiungAb']),
    );
  });

  it('asks "never insured" only after the Regelaltersgrenze without old-age pension or Versorgung', () => {
    expect(shown('person', { situation: ['regelaltersgrenze'] })).toContain('rvNieVersichert');
    expect(
      shown('person', { situation: ['regelaltersgrenze', 'rente'], rentenart: 'altersvoll' }),
    ).not.toContain('rvNieVersichert');
    expect(shown('person', { situation: ['arbeitnehmer'] })).not.toContain('rvNieVersichert');
  });

  it('offers the waiver to everyone free under § 5 Abs. 4 SGB VI', () => {
    for (const data of [
      { situation: ['regelaltersgrenze'], rvNieVersichert: 'nieVersichert' },
      { situation: ['regelaltersgrenze'], rvNieVersichert: 'erstattung' },
      { situation: ['rente'], rentenart: 'versorgungswerkAlter' },
      { situation: ['regelaltersgrenze', 'rente'], rentenart: 'altersvoll' },
    ]) {
      expect(shown('person', data)).toContain('rvVerzicht');
    }
    expect(
      shown('person', { situation: ['regelaltersgrenze'], rvNieVersichert: 'nein' }),
    ).not.toContain('rvVerzicht');
    expect(
      shown('person', { situation: ['rente'], rentenart: 'versorgungswerkAndere' }),
    ).not.toContain('rvVerzicht');
  });

  it('asks the seasonal-worker flag only for fixed-term jobs that are not Minijob or short-term', () => {
    const base = { agBefristet: true };
    expect(shown('arbeitgeber', { ...base, agBeschaeftigungsart: 'svpflichtig' })).toContain(
      'agSaisonarbeit',
    );
    for (const art of ['minijob', 'kurzfristig']) {
      expect(shown('arbeitgeber', { ...base, agBeschaeftigungsart: art })).not.toContain(
        'agSaisonarbeit',
      );
    }
    expect(
      shown('arbeitgeber', { agBefristet: false, agBeschaeftigungsart: 'svpflichtig' }),
    ).not.toContain('agSaisonarbeit');
  });

  it('requires the employer’s tax number for a Minijob only (DEÜV Tz. 1.3.7)', () => {
    const field = definition.sections
      .flatMap((s) => s.fields)
      .find((f) => f.id === 'agSteuernummer');
    expect(field?.required).toBe(false);
    expect(field?.requiredIf).toEqual({ field: 'agBeschaeftigungsart', equals: 'minijob' });
  });
});

describe('pay first (Tobias 2026-10-30)', () => {
  it('asks the employer for the pay before the kind of employment', () => {
    const order = definition.sections.flatMap((s) => s.fields).map((f) => f.id);
    for (const id of ['agEntgeltArt', 'agMonatsentgelt', 'agErwartetMonat', 'agEinmalzahlungen']) {
      expect(order.indexOf(id)).toBeLessThan(order.indexOf('agBeschaeftigungsart'));
    }
    expect(order.indexOf('agSonderstatus')).toBeLessThan(order.indexOf('agEntgeltArt'));
  });

  it('asks the pay without knowing the kind of employment', () => {
    expect(shown('arbeitgeber', {})).toContain('agEntgeltArt');
    expect(shown('arbeitgeber', { agEntgeltArt: 'stundenlohn' })).toEqual(
      expect.arrayContaining(['agStundenlohn', 'agErwartetMonat']),
    );
  });
});
