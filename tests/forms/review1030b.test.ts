// Review of 2026-10-30 (later): payment way and BIC, preliminary tax data, Versorgungswerk, A1,
// fixed-term details, status marker, Sozialkasse, multiple jobs over the BBG / JAEG, and the
// validity of a form version. Fictitious data.
import { join } from 'node:path';
import { visibleFields } from '../../src/logic/form';
import { checkFormDefinition } from '../../src/logic/formDefinition';
import { checkHints } from '../../src/logic/hints';
import type { FieldValue, FormDefinition, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, sealPart, setValue, startPart } from '../../src/logic/questionnaire';
import { transmissionBlockers } from '../../src/logic/requirements';
import { interviewSummary } from '../../src/logic/interview';
import { describeValidity, withinValidity } from '../../src/logic/validity';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;
const SEALABLE_EMPLOYER = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345678',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
  agArbeitsortBundesland: 'BW',
  agBeschaeftigungsart: 'svpflichtig',
  agTaetigkeit: 'Verkauf',
  agBeziehung: 'keine',
  agBefristet: false,
  agArbeitszeitform: 'teilzeit',
  agArbeitszeitmodell: 'monatsstunden',
  agMonatsstunden: '80',
  agArbeitstageProWoche: '4',
  agUrlaubstage: '24',
  agUrlaubBezug: 'individuell',
  agEntgeltArt: 'monatsentgelt',
  agMonatsentgelt: '2.400,00',
  agVwl: false,
  agBav: 'keine',
  agSchwerbehinderung: 'nein',
};
const at = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };

const shown = (role: string, data: Record<string, FieldValue>) =>
  visibleFields(definition, role, data).map((field) => field.id);

function filled(role: string, values: Record<string, unknown>, base?: Questionnaire) {
  let q = ok(startPart(base ?? createQuestionnaire(QUESTIONNAIRE_ID, form), form, role));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, role, id, raw));
  return q;
}

describe('payment way and BIC', () => {
  it('asks no account for cash payment', () => {
    const ids = shown('person', { zahlungsweg: 'bar' });
    expect(ids).not.toContain('iban');
    expect(ids).not.toContain('kontoinhaberSelbst');
  });

  it('asks the BIC only for an account outside Germany', () => {
    expect(
      shown('person', { zahlungsweg: 'ueberweisung', iban: 'DE89370400440532013000' }),
    ).not.toContain('bic');
    expect(
      shown('person', { zahlungsweg: 'ueberweisung', iban: 'AT611904300234573201' }),
    ).toContain('bic');
    expect(shown('person', { zahlungsweg: 'ueberweisung', iban: null })).not.toContain('bic');
  });

  it('refuses "startsWith" on a field that is not text-like and an IBAN prefix in small letters', () => {
    const d = structuredClone(definition);
    const bic = d.sections.flatMap((s) => s.fields).find((f) => f.id === 'bic');
    if (!bic) throw new Error('draft changed');
    bic.showIf = { not: { field: 'iban', startsWith: 'de' } };
    expect(checkFormDefinition(d).map((i) => i.message)).toEqual([
      'IBANs are stored in capitals without spaces',
    ]);
    bic.showIf = { field: 'kontoinhaberSelbst', startsWith: 'J' };
    expect(
      checkFormDefinition(d)
        .map((i) => i.message)
        .join(' '),
    ).toContain('"startsWith" only applies to');
  });
});

describe('preliminary tax data for the first payroll', () => {
  const tax = (data: Record<string, FieldValue>) =>
    shown('person', { artLautVereinbarung: 'festeStelle', ...data });

  it('asks tax class, child allowances and church tax for the first employment', () => {
    const ids = tax({ dienstverhaeltnis: 'erstes', steuerklasse: '4f' });
    expect(ids).toEqual(
      expect.arrayContaining(['steuerklasse', 'faktor', 'kinderfreibetraege', 'kirchensteuer']),
    );
  });

  it('asks only the church tax for a further employment (tax class VI)', () => {
    const ids = tax({ dienstverhaeltnis: 'weiteres' });
    expect(ids).toContain('kirchensteuer');
    expect(ids).not.toContain('steuerklasse');
    expect(ids).not.toContain('kinderfreibetraege');
  });

  it('asks nothing of it with a flat-rate tax', () => {
    const ids = shown('person', { artLautVereinbarung: 'minijob', steuerart: 'pauschal2' });
    expect(ids).not.toContain('steuerklasse');
    expect(ids).not.toContain('kirchensteuer');
  });

  it('has no child allowances in tax class V', () => {
    expect(tax({ dienstverhaeltnis: 'erstes', steuerklasse: '5' })).not.toContain(
      'kinderfreibetraege',
    );
  });
});

describe('check hints of the review', () => {
  const employer = {
    agFirma: 'Beispiel GmbH',
    agBetriebsnummer: '12345678',
    agFamilienname: 'Musterfrau',
    agVorname: 'Erika',
    agBeschaeftigungsbeginn: '02.11.2026',
    agEntgeltArt: 'monatsentgelt',
    agMonatsentgelt: '5.000,00',
    agBeziehung: 'keine',
  };
  const person = { weitereBeschaeftigung: true };
  const ids = (q: Questionnaire) => checkHints(q, definition).map((hint) => hint.id);
  const job = (entgelt: string) => [
    {
      rowId: 'r1',
      jobArbeitgeber: 'Andere GmbH',
      jobArt: 'svpflichtig',
      jobSeit: '01.01.2025',
      jobEntgeltMonat: entgelt,
    },
  ];

  it('sums the other jobs for the BBG and the JAEG', () => {
    const below = filled(
      'arbeitgeber',
      employer,
      filled('person', { ...person, weitereJobs: job('500,00') }),
    );
    expect(ids(below)).not.toContain('mehrfachUeberBbgMonatsentgelt');
    const above = filled(
      'arbeitgeber',
      employer,
      filled('person', { ...person, weitereJobs: job('1.500,00') }),
    );
    const hint = checkHints(above, definition).find(
      (h) => h.id === 'mehrfachUeberBbgMonatsentgelt',
    );
    expect(hint?.detail.join(' ')).toContain(
      'Zusammen 6.500,00 € im Monat (davon diese Beschäftigung 5.000,00 €)',
    );
    expect(hint?.detail.join(' ')).toContain('5.812,50 €');
    expect(ids(above)).toContain('jaegMonatsentgelt');
  });

  it('flags the JAEG for a single high salary, but not the BBG of several jobs', () => {
    const q = filled(
      'arbeitgeber',
      { ...employer, agMonatsentgelt: '7.000,00' },
      filled('person', { weitereBeschaeftigung: false }),
    );
    expect(ids(q)).toContain('jaegMonatsentgelt');
    expect(ids(q)).not.toContain('mehrfachUeberBbgMonatsentgelt');
  });

  it('says so when the year has no Rechengrößen instead of guessing', () => {
    const q = filled(
      'arbeitgeber',
      { ...employer, agBeschaeftigungsbeginn: '02.01.2027' },
      filled('person', person),
    );
    const hint = checkHints(q, definition).find((h) => h.id === 'jaegMonatsentgelt');
    expect(hint?.detail.join(' ')).toContain(
      'Für 2027 ist die Jahresarbeitsentgeltgrenze in der App nicht hinterlegt',
    );
  });

  it('names a written fixed-term agreement after the first working day', () => {
    const late = filled(
      'arbeitgeber',
      {
        ...employer,
        agBefristet: true,
        agBefristungsart: 'kalender',
        agBefristetBis: '31.12.2026',
        agBefristungsgrund: 'ohneSachgrund',
        agBefristungSchriftlich: 'ja',
        agBefristungSchriftlichAm: '05.11.2026',
        agFrueherBeschaeftigt: true,
        agErsteintritt: '01.03.2020',
      },
      filled('person', person),
    );
    expect(ids(late)).toEqual(
      expect.arrayContaining(['befristungNachBeginn', 'sachgrundlosVorbeschaeftigung']),
    );
  });

  it('names the status marker, a missing exemption and a missing A1 certificate', () => {
    const q = filled(
      'arbeitgeber',
      { ...employer, agBeziehung: 'ehegatte' },
      filled('person', {
        versorgungswerk: 'offen',
        versorgungswerkName: 'Versorgungswerk der Steuerberater',
        svAusland: true,
        svAuslandStaat: 'Österreich',
        svAuslandA1: false,
      }),
    );
    expect(ids(q)).toEqual(
      expect.arrayContaining([
        'statusfeststellung',
        'versorgungswerkOhneBefreiung',
        'svAuslandOhneA1',
      ]),
    );
  });
});

describe('Sozialkasse decided by the employer', () => {
  it('asks the person for the Sozialkasse number only in such a business', () => {
    expect(shown('person', { sozialkasseBetrieb: 'nein' })).not.toContain('sozialkasseNummer');
    expect(shown('person', { sozialkasseBetrieb: 'unbekannt' })).toContain('sozialkasseNummer');
  });
});

describe('validity of a form version (Tobias 2026-10-30)', () => {
  it('compares dates and months inclusively', () => {
    const validity = { field: 'x', from: '2026-01-01', until: '2026-12-31' };
    expect(withinValidity('2026-10-15', validity)).toBe(true);
    expect(withinValidity('2026-12-31', validity)).toBe(true);
    expect(withinValidity('2027-01-01', validity)).toBe(false);
    expect(withinValidity('2026-12', validity)).toBe(true);
    expect(withinValidity('2025-12', { field: 'x', from: '2026-01-01' })).toBe(false);
  });

  it('describes the period', () => {
    expect(describeValidity(definition)).toBe(
      'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026',
    );
  });

  it('warns at once, refuses signing and passing on for a start outside the period', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const outside = setValue(q, form, 'arbeitgeber', 'agBeschaeftigungsbeginn', '04.01.2027');
    expect(outside.ok && outside.warnings).toContain('validity.outside');
    const draft = ok(outside).parts.arbeitgeber?.[0];
    const summary = interviewSummary(definition, 'arbeitgeber', draft ?? { data: {} }, []);
    expect(summary.outsideValidity).toEqual({
      value: '04.01.2027',
      validity: 'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026',
    });
    expect(summary.readyToSign).toBe(false);
    expect(
      sealPart(ok(outside), form, 'arbeitgeber', {
        nonce: 'd4'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    ).toMatchObject({ ok: false, code: 'outsideValidity' });
  });

  it('takes a start inside the period without a warning', () => {
    const q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const inside = setValue(q, form, 'arbeitgeber', 'agBeschaeftigungsbeginn', '01.10.2026');
    expect(inside.ok && inside.warnings).toEqual([]);
  });

  it('blocks passing on a questionnaire whose sealed reference date lies outside', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    for (const [id, raw] of Object.entries(SEALABLE_EMPLOYER)) {
      q = ok(setValue(q, form, 'arbeitgeber', id, raw));
    }
    q = ok(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'd4'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    );
    expect(transmissionBlockers(q, form).map((b) => b.code)).not.toContain('outsideValidity');
    // The same file read by a version whose period ends earlier (e.g. a part from another file).
    const narrower = {
      ...form,
      definition: {
        ...definition,
        validity: { field: 'agBeschaeftigungsbeginn', from: '2026-01-01', until: '2026-06-30' },
      },
    };
    expect(transmissionBlockers(q, narrower)).toContainEqual({
      code: 'outsideValidity',
      role: 'arbeitgeber',
      detail: [
        '02.11.2026',
        'gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 30.06.2026',
      ],
    });
  });

  it('refuses a validity on an optional, conditional or non-date field and a reversed period', () => {
    const problems = (change: (d: FormDefinition) => void) => {
      const d = structuredClone(definition);
      change(d);
      return checkFormDefinition(d).map((issue) => `${issue.path} ${issue.message}`);
    };
    expect(problems((d) => (d.validity = { field: 'agFirma', from: '2026-01-01' }))).toEqual([
      '$.validity.field must be a date or month field',
    ]);
    expect(problems((d) => (d.validity = { field: 'agErsteintritt', from: '2026-01-01' }))).toEqual(
      ['$.validity.field must be required and always available'],
    );
    expect(
      problems(
        (d) =>
          (d.validity = {
            field: 'agBeschaeftigungsbeginn',
            from: '2026-12-31',
            until: '2026-01-01',
          }),
      ),
    ).toEqual(['$.validity.until lies before "from"']);
  });
});
