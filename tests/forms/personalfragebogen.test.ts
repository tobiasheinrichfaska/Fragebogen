// The Personalfragebogen draft through the engine: which questions each employment variant gets,
// and that a complete person part and employer part can be sealed. Fictitious data.
import { join } from 'node:path';
import { missingRequired, visibleFields } from '../../src/logic/form';
import type { FieldValue } from '../../src/logic/model';
import { createQuestionnaire, sealPart, setValue, startPart } from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID, STROKES } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;

const visible = (role: string, data: Record<string, FieldValue>) =>
  visibleFields(definition, role, data).map((field) => field.id);

const BASE_PERSON: Record<string, FieldValue> = {
  familienname: 'Musterfrau',
  vorname: 'Erika',
  geburtsnameWieFamilienname: true,
  geburtsdatum: '1990-05-17',
  geburtsort: 'Musterstadt',
  geburtsland: 'Deutschland',
  geschlecht: 'weiblich',
  staatsangehoerigkeit: 'deutsch',
  strasse: 'Musterweg 1',
  postleitzahl: '12345',
  wohnort: 'Musterstadt',
  anschriftAusland: false,
  iban: 'DE89370400440532013000',
  kontoinhaberSelbst: true,
  weitereBeschaeftigung: false,
  steuerId: '86095742719',
  dienstverhaeltnis: 'erstes',
  steuerklasse: '1',
  kinderfreibetraege: '0',
  kirchensteuer: 'keine',
  krankenversicherung: 'gesetzlich',
  krankenkasse: 'Beispiel-Krankenkasse',
  kinder: false,
  schulabschluss: 'abitur',
  berufsabschluss: 'ohne',
  sozialkasseBetrieb: 'nein',
};

describe('Personalfragebogen draft — questions per variant', () => {
  it('asks a student in a Minijob the student questions and the Minijob pension question', () => {
    const ids = visible('person', {
      ...BASE_PERSON,
      situation: ['student'],
      artLautVereinbarung: 'minijob',
      ueber20hJahr: true,
    });
    expect(ids).toEqual(
      expect.arrayContaining([
        'studienArt',
        'hochschule',
        'urlaubssemester',
        'fachsemester',
        'ueber20hZeiten',
        'rvBefreiungWunsch',
      ]),
    );
    expect(ids).not.toContain('vorbeschJahr');
    expect(ids).not.toContain('rentenart');
  });

  it('asks a temporary helper who is registered unemployed about earlier jobs and benefits', () => {
    const ids = visible('person', {
      ...BASE_PERSON,
      situation: ['arbeitslos'],
      artLautVereinbarung: 'aushilfe',
      vorbeschJahr: true,
    });
    expect(ids).toEqual(
      expect.arrayContaining([
        'leistungArbeitslos',
        'arbeitsuchendSeit',
        'vorbeschJahr',
        'vorbeschaeftigungen',
      ]),
    );
    expect(ids).not.toContain('rvBefreiungWunsch');
  });

  it('asks a pensioner past the Regelaltersgrenze with a second job about waiver and Aktivrente', () => {
    const ids = visible('person', {
      ...BASE_PERSON,
      situation: ['rente', 'regelaltersgrenze'],
      rentenart: 'altersvoll',
      dienstverhaeltnis: 'weiteres',
      artLautVereinbarung: 'festeStelle',
    });
    expect(ids).toEqual(
      expect.arrayContaining([
        'renteSeit',
        'rvVerzicht',
        'aktivrenteMonat',
        'aktivrenteNichtAnderswo',
        'freibetragAbrufen',
      ]),
    );
    expect(ids).not.toContain('emBefristetBis');
  });

  it('ties the Aktivrente to the Regelaltersgrenze, not to a pension', () => {
    const withoutPension = visible('person', {
      ...BASE_PERSON,
      situation: ['regelaltersgrenze'],
      artLautVereinbarung: 'festeStelle',
    });
    expect(withoutPension).toContain('aktivrenteMonat');
    const pensionBeforeLimit = visible('person', {
      ...BASE_PERSON,
      situation: ['rente'],
      rentenart: 'altersvoll',
      artLautVereinbarung: 'festeStelle',
    });
    expect(pensionBeforeLimit).not.toContain('aktivrenteMonat');
    expect(pensionBeforeLimit).not.toContain('rvVerzicht');
  });

  it('asks the privately insured about the certificate, never an amount, and skips children', () => {
    const ids = visible('person', { ...BASE_PERSON, krankenversicherung: 'privat' });
    expect(ids).toEqual(
      expect.arrayContaining(['pkvBescheinigung', 'pkvAusland', 'pkvLetzteKrankenkasse']),
    );
    expect(ids).not.toContain('kinder');
    expect(
      definition.sections.flatMap((s) => s.fields).some((f) => /pkv.*betrag/i.test(f.id)),
    ).toBe(false);
  });

  it('asks for single children only where the digital retrieval may fail', () => {
    const plain = visible('person', {
      ...BASE_PERSON,
      kinder: true,
      kinderSonderfaelle: ['keines'],
    });
    expect(plain).toContain('kinderUnter25');
    expect(plain).not.toContain('kinderNichtAbrufbar');
    const step = visible('person', {
      ...BASE_PERSON,
      kinder: true,
      kinderSonderfaelle: ['stiefkind'],
    });
    expect(step).toContain('kinderNichtAbrufbar');
  });

  it('shows the employer only the fields of the chosen working-time model', () => {
    const base = { agArbeitszeitmodell: 'festeTage' };
    expect(visible('arbeitgeber', base)).toEqual(
      expect.arrayContaining(['agStdMo', 'agStdFr', 'agStdSo']),
    );
    expect(visible('arbeitgeber', base)).not.toContain('agAbrufWochenstunden');
    const abruf = visible('arbeitgeber', {
      agArbeitszeitmodell: 'abruf',
      agAbrufGrenze: 'mindest',
    });
    expect(abruf).toEqual(
      expect.arrayContaining([
        'agAbrufWochenstunden',
        'agAbrufGrenzeStunden',
        'agErwartetStundenMonat',
      ]),
    );
    expect(abruf).not.toContain('agStdMo');
  });

  it('keeps holidays, disability and pay with the employer, not the person', () => {
    const owner = (id: string) =>
      definition.sections.flatMap((s) => s.fields).find((f) => f.id === id)?.role;
    for (const id of [
      'agUrlaubstage',
      'agSchwerbehinderung',
      'agEntgeltArt',
      'agUnterlagen',
      'agVwl',
    ]) {
      expect(owner(id)).toBe('arbeitgeber');
    }
    expect(owner('schwerbehinderung')).toBeUndefined();
  });

  it('keeps contact details voluntary', () => {
    const fields = definition.sections.flatMap((s) => s.fields);
    for (const id of ['telefon', 'email']) {
      const field = fields.find((f) => f.id === id);
      expect(field?.required).toBe(false);
      expect(field?.requiredIf).toBeUndefined();
    }
  });
});

describe('Personalfragebogen draft — complete parts can be sealed', () => {
  const at = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };

  it('seals a student in a Minijob with a table of longer working periods', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    const values: Record<string, unknown> = {
      ...BASE_PERSON,
      geburtsdatum: '17.05.2003',
      situation: ['student'],
      studienArt: 'vollzeit',
      hochschule: 'Beispiel-Hochschule',
      urlaubssemester: false,
      fachsemester: '4',
      ueber20hJahr: true,
      ueber20hZeiten: [
        {
          rowId: 'r1',
          ueber20hVon: '01.08.2026',
          ueber20hBis: '30.09.2026',
          ueber20hStunden: '38,5',
          ueber20hFerien: true,
        },
      ],
      artLautVereinbarung: 'minijob',
      steuerart: 'pauschal2',
      rvBefreiungWunsch: 'nein',
    };
    for (const [id, raw] of Object.entries(values)) {
      q = ok(setValue(q, form, 'person', id, raw));
    }
    const data = q.parts.person?.[0]?.data ?? {};
    expect(missingRequired(definition, 'person', data)).toEqual([]);
    const sealed = ok(
      sealPart(q, form, 'person', {
        nonce: 'c3'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: ['datenschutz'],
        signature: { method: 'drawn', strokes: STROKES },
      }),
    );
    expect(sealed.parts.person?.[0]?.status).toBe('signed');
    expect(sealed.parts.person?.[0]?.data.fachsemester).toBe('4');
    // Flat-rate tax: the tax class question lapsed and is not signed.
    expect(sealed.parts.person?.[0]?.data).not.toHaveProperty('dienstverhaeltnis');
  });

  it('seals an employer part for a Minijob on call with fixed weekly hours', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const values: Record<string, unknown> = {
      agFirma: 'Beispiel Bau GmbH',
      agBetriebsnummer: '12345678',
      agFamilienname: 'Musterfrau',
      agVorname: 'Erika',
      agBeschaeftigungsbeginn: '02.11.2026',
      agArbeitsortBundesland: 'BW',
      agBeschaeftigungsart: 'minijob',
      agTaetigkeit: 'Aushilfe im Verkauf',
      agBefristet: false,
      agArbeitszeitform: 'teilzeit',
      agBesteuerung: 'pauschal2',
      agArbeitszeitmodell: 'abruf',
      agAbrufWochenstunden: '9',
      agAbrufGrenze: 'keine',
      agUrlaubstage: '12',
      agUrlaubBezug: 'individuell',
      agEntgeltArt: 'stundenlohn',
      agStundenlohn: '14,50',
      agErwartetMonat: '520,00',
      agBav: 'keine',
      agSchwerbehinderung: 'nein',
      agBeziehung: 'keine',
      agPauschalsteuerAbgewaelzt: false,
    };
    for (const [id, raw] of Object.entries(values)) {
      q = ok(setValue(q, form, 'arbeitgeber', id, raw));
    }
    const data = q.parts.arbeitgeber?.[0]?.data ?? {};
    expect(missingRequired(definition, 'arbeitgeber', data)).toEqual([]);
    const sealed = ok(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'd4'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    );
    expect(sealed.parts.arbeitgeber?.[0]?.status).toBe('sealed');
    expect(sealed.parts.arbeitgeber?.[0]?.data.agAbrufWochenstunden).toBe('9.00');
  });
});
