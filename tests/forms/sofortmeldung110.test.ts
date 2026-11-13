// Sofortmeldung draft 1.1.0 (Tobias 2026-11-04): the employer chooses the sector — § 28a Abs. 4
// SGB IV and § 2a Abs. 1 SchwarzArbG list the same eleven — so the notice on carrying ID papers
// no longer needs the list; "keiner dieser Bereiche" is a special case the form is not meant for.
// The sector travels in the bookmark link. Example for the birth place: the neue Bundesländer.
import { join } from 'node:path';
import { activeExclusions } from '../../src/logic/hints';
import { applyMasterData, masterDataOf } from '../../src/logic/masterData';
import { masterDataFragment, parseMasterDataFragment } from '../../src/logic/masterDataLink';
import type { Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, sealPart, setValue, startPart } from '../../src/logic/questionnaire';
import { transmissionBlockers } from '../../src/logic/requirements';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'sofortmeldung', '1.1.0.json')));
const previous = registeredFrom(readJson(join(FORMS_DIR, 'sofortmeldung', '1.0.0.json')));
const { definition } = form;
const at = { local: '2026-11-04T10:00:00.000+01:00', utc: '2026-11-04T09:00:00.000Z' };
const fields = definition.sections.flatMap((s) => s.fields);
const field = (id: string) => fields.find((f) => f.id === id);

function employer(values: Record<string, unknown>): Questionnaire {
  let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, 'arbeitgeber', id, raw));
  return q;
}

const COMPLETE = {
  agFirma: 'Beispiel Bau GmbH',
  agBetriebsnummer: '12345671',
  agFamilienname: 'Musterfrau',
  agVorname: 'Erika',
  agBeschaeftigungsbeginn: '02.11.2026',
};
const seal = (q: Questionnaire) =>
  sealPart(q, form, 'arbeitgeber', {
    nonce: 'e5'.repeat(16),
    systemNote: note(at.local, at.utc),
    acknowledged: [],
  });

describe('Sofortmeldung 1.1.0: sector of the employer', () => {
  it('asks the sector right after the Betriebsnummer, with the eleven sectors and "keiner"', () => {
    const employerFields = fields.filter((f) => f.role === 'arbeitgeber').map((f) => f.id);
    expect(employerFields.indexOf('agBranche')).toBe(
      employerFields.indexOf('agBetriebsnummer') + 1,
    );
    const branche = field('agBranche');
    expect(branche?.type).toBe('choice');
    expect(branche?.required).toBe(true);
    expect(branche?.options?.map((o) => o.id)).toEqual([
      'bau',
      'gastgewerbe',
      'personenbefoerderung',
      'logistik',
      'schausteller',
      'gebaeudereinigung',
      'messebau',
      'fleischwirtschaft',
      'prostitution',
      'sicherheit',
      'friseurKosmetik',
      'keiner',
    ]);
  });

  it('is required: the employer cannot complete without it', () => {
    expect(seal(employer(COMPLETE))).toMatchObject({ ok: false });
    expect(seal(employer({ ...COMPLETE, agBranche: 'bau' }))).toMatchObject({ ok: true });
  });

  it('"keiner dieser Bereiche" blocks signing and passing on', () => {
    const q = employer({ ...COMPLETE, agBranche: 'keiner' });
    expect(
      activeExclusions(q, definition)
        .map((e) => e.message)
        .join(' '),
    ).toContain('nur in den genannten Wirtschaftsbereichen');
    expect(seal(q)).toMatchObject({ ok: false, code: 'outOfScope' });
    expect(transmissionBlockers(q, form).map((b) => b.code)).toContain('outOfScope');
    expect(activeExclusions(employer({ ...COMPLETE, agBranche: 'bau' }), definition)).toEqual([]);
  });

  it('travels in the bookmark link and fills the next questionnaire', () => {
    const q = employer({ ...COMPLETE, agBranche: 'gastgewerbe' });
    const data = masterDataOf(definition, 'arbeitgeber', q.parts.arbeitgeber?.[0]?.data ?? {});
    expect(data).toMatchObject({ branche: 'gastgewerbe', betriebsnummer: '12345671' });
    const link = masterDataFragment(data);
    expect(link.ok && link.fragment).toContain('branche=gastgewerbe');
    const parsed = parseMasterDataFragment(link.ok ? link.fragment : '');
    const fresh = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const applied = applyMasterData(
      fresh,
      form,
      'arbeitgeber',
      parsed.ok ? parsed.data : undefined,
    );
    expect(applied.ok && applied.skipped).toEqual([]);
    expect(applied.ok && applied.questionnaire.parts.arbeitgeber?.[0]?.data.agBranche).toBe(
      'gastgewerbe',
    );
  });

  it('refuses a sector in the link that is not one of the options', () => {
    const fresh = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const applied = applyMasterData(fresh, form, 'arbeitgeber', { branche: 'forstwirtschaft' });
    expect(applied.ok && applied.skipped.map((s) => s.fieldId)).toEqual(['agBranche']);
  });
});

describe('Sofortmeldung 1.1.0: texts', () => {
  const notice = (id: string) => definition.infoBlocks.find((b) => b.id === id);

  it('the notice on ID papers is short: no list of sectors, still paper', () => {
    const text = notice('mitfuehrungspflicht')?.text ?? '';
    expect(text).not.toContain('- Baugewerbe');
    expect(text.length).toBeLessThan(
      (previous.definition.infoBlocks.find((b) => b.id === 'mitfuehrungspflicht')?.text.length ??
        0) / 2,
    );
    expect(text).toContain('§ 2a Abs. 1 SchwarzArbG');
    expect(notice('mitfuehrungspflicht')?.acknowledgement).toBe('paperHandout');
  });

  it('names the neue Bundesländer as the example for a birth place in Germany', () => {
    expect(field('geborenInDeutschland')?.help).toContain('neuen Bundesländern');
    expect(field('geborenInDeutschland')?.help).not.toContain('DDR');
  });

  it('the privacy notice tells that the online app keeps an interrupted questionnaire', () => {
    const text = notice('datenschutz')?.text ?? '';
    expect(text).not.toContain('speichert und versendet Ihre Angaben nicht');
    expect(text).toContain('höchstens 7 Tage');
  });

  it('shows the SV number and the foreign postcode hints to the person while filling', () => {
    expect(
      (definition.checkHints ?? []).filter((h) => h.showWhileFilling).map((h) => h.id),
    ).toEqual(['versicherungsnummerWeichtAb', 'plzAuslandFormat']);
  });

  it('changes nothing else against 1.0.0 but the sector, the exclusion, these texts and the foreign postcode', () => {
    // 2026-11-13: the employer gets the person's names proposed (fromRole), and under joint
    // custody a second representative signs (role vertretung2, field vertretungAlleinSorge).
    const strip = (d: typeof definition) => ({
      ...d,
      roles: d.roles.filter((r) => r.id !== 'vertretung2'),
      version: '',
      revised: '',
      exclusions: [],
      checkHints: (d.checkHints ?? []).map((h) => {
        const rest = { ...h };
        delete rest.showWhileFilling;
        return rest;
      }),
      infoBlocks: d.infoBlocks.map((b) => ({ ...b, text: '', asOf: '' })),
      sections: d.sections
        .filter((s) => s.id !== 'vertretung2')
        .map((s) => ({
          ...s,
          fields: s.fields
            .filter((f) => f.id !== 'agBranche' && f.id !== 'vertretungAlleinSorge')
            .map((f) => {
              const rest = { ...f };
              if (f.id === 'agFamilienname' || f.id === 'agVorname') {
                delete rest.fromRole;
                delete rest.because;
              }
              return rest;
            })
            .map((f) => (f.id === 'geborenInDeutschland' ? { ...f, help: '' } : f))
            // The foreign postcode is required unless the state has none (Tobias 2026-11-06).
            .map((f) => {
              if (f.id !== 'postleitzahlAusland') return f;
              const rest = { ...f, help: '', because: '' };
              delete rest.requiredIf;
              delete rest.quickAnswers;
              return rest;
            }),
        })),
    });
    expect(strip(definition)).toEqual(strip(previous.definition));
  });
});
