// Pre-questions that exclude the person groups the Personalfragebogen does not cover (Tobias
// 2026-10-30): firm attributes travel in the bookmark link (yes/no and choices too), per-person
// questions lead to exclusions, and an exclusion blocks signing and passing on. Vorruhestandsgeld
// (108) and Freiwilligendienst (123) are kinds of employment. Fictitious data.
import { join } from 'node:path';
import { dayNumber } from '../../src/logic/dates';
import { visibleFields } from '../../src/logic/form';
import { activeExclusions, HINT_TESTS } from '../../src/logic/hints';
import { applyMasterData, masterDataOf } from '../../src/logic/masterData';
import { masterDataFragment, parseMasterDataFragment } from '../../src/logic/masterDataLink';
import type { FieldValue, Questionnaire } from '../../src/logic/model';
import { createQuestionnaire, sealPart, setValue, startPart } from '../../src/logic/questionnaire';
import { transmissionBlockers } from '../../src/logic/requirements';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { note, ok, QUESTIONNAIRE_ID } from '../support/sample';

const form = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '0.1.0.json')));
const { definition } = form;
const at = { local: '2026-10-30T10:00:00.000+01:00', utc: '2026-10-30T09:00:00.000Z' };

function employer(values: Record<string, unknown>, base?: Questionnaire): Questionnaire {
  let q = ok(startPart(base ?? createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
  for (const [id, raw] of Object.entries(values)) q = ok(setValue(q, form, 'arbeitgeber', id, raw));
  return q;
}

const excluded = (q: Questionnaire) => activeExclusions(q, definition).map((e) => e.message);
const shown = (data: Record<string, FieldValue>) =>
  visibleFields(definition, 'arbeitgeber', data).map((f) => f.id);

describe('firm attributes in the bookmark link', () => {
  it('carries yes/no and choices as text and fills them in again over the preselection', () => {
    const q = employer({
      agLandwirtschaft: true,
      agBetriebsart: 'werkstatt',
      agArbeitsortBundesland: 'BW',
    });
    const data = masterDataOf(definition, 'arbeitgeber', q.parts.arbeitgeber?.[0]?.data ?? {});
    expect(data).toMatchObject({
      landwirtschaft: 'ja',
      privathaushalt: 'nein',
      seeschifffahrt: 'nein',
      betriebsart: 'werkstatt',
      sozialkasse: 'nein',
      bundesland: 'BW',
    });
    const link = masterDataFragment(data);
    expect(link.ok).toBe(true);
    const parsed = parseMasterDataFragment(link.ok ? link.fragment : '');
    const fresh = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const applied = applyMasterData(
      fresh,
      form,
      'arbeitgeber',
      parsed.ok ? parsed.data : undefined,
    );
    expect(applied.ok && applied.skipped).toEqual([]);
    const after = applied.ok ? applied.questionnaire.parts.arbeitgeber?.[0]?.data : undefined;
    expect(after?.agLandwirtschaft).toBe(true);
    expect(after?.agBetriebsart).toBe('werkstatt');
  });

  it('refuses a yes/no value that is neither "ja" nor "nein"', () => {
    const fresh = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'arbeitgeber'));
    const applied = applyMasterData(fresh, form, 'arbeitgeber', { landwirtschaft: 'vielleicht' });
    expect(applied.ok && applied.skipped.map((s) => s.fieldId)).toEqual(['agLandwirtschaft']);
  });
});

describe('pre-questions and exclusions', () => {
  it('asks the per-person questions only where the firm attribute makes them possible', () => {
    expect(shown({})).not.toContain('agEinrichtungTeilnehmer');
    expect(shown({ agBetriebsart: 'inklusionsbetrieb' })).toContain('agEinrichtungTeilnehmer');
    expect(shown({ agLandwirtschaft: true })).toContain('agFamilieLandwirtschaft');
    expect(shown({ agSeeschifffahrt: true })).toContain('agAnBord');
    expect(shown({})).toContain('agHeimarbeit');
  });

  it.each([
    ['home work', { agHeimarbeit: true }, '104, 124'],
    ['a workshop', { agBetriebsart: 'werkstatt', agEinrichtungTeilnehmer: true }, '107, 111, 127'],
    ['family on a farm', { agLandwirtschaft: true, agFamilieLandwirtschaft: true }, '112'],
    ['seafarers', { agSeeschifffahrt: true, agAnBord: true }, '140 bis 150'],
    [
      'a private household',
      { agPrivathaushalt: true, agBeschaeftigungsart: 'minijob' },
      '209, 210',
    ],
    [
      'less than a week',
      {
        agBeschaeftigungsbeginn: '02.11.2026',
        agBeschaeftigungsart: 'svpflichtig',
        agBefristet: true,
        agBefristetBis: '06.11.2026',
      },
      '117, 118',
    ],
  ])('excludes %s', (_name, values, groups) => {
    expect(excluded(employer(values)).join(' ')).toContain(groups);
  });

  it('keeps an employment of a full week and a short-term job in the household out of 117/118', () => {
    const week = employer({
      agBeschaeftigungsbeginn: '02.11.2026',
      agBeschaeftigungsart: 'svpflichtig',
      agBefristet: true,
      agBefristetBis: '08.11.2026',
    });
    expect(excluded(week)).toEqual([]);
  });

  it('excludes the person answers Nebenerwerbslandwirt and FELEG', () => {
    let q = ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, 'person'));
    q = ok(setValue(q, form, 'person', 'situation', ['selbstaendig', 'feleg']));
    q = ok(setValue(q, form, 'person', 'selbstLandwirtschaft', true));
    expect(excluded(q).join(' ')).toContain('113, 114');
    expect(excluded(q).join(' ')).toContain('116');
  });

  it('refuses signing and passing on while a special case holds', () => {
    const q = employer({ agHeimarbeit: true });
    expect(
      sealPart(q, form, 'arbeitgeber', {
        nonce: 'd4'.repeat(16),
        systemNote: note(at.local, at.utc),
        acknowledged: [],
      }),
    ).toMatchObject({ ok: false, code: 'outOfScope' });
    expect(transmissionBlockers(q, form).map((b) => b.code)).toContain('outOfScope');
  });

  it('counts the days of a short fixed term without Date', () => {
    expect(dayNumber('2026-03-01') - dayNumber('2026-02-28')).toBe(1);
    expect(dayNumber('2024-03-01') - dayNumber('2024-02-28')).toBe(2);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
    const test = HINT_TESTS.kuerzerAlsEineWoche;
    expect(test?.run(['2026-11-02', '2026-11-07'])?.holds).toBe(true);
    expect(test?.run(['2026-11-02', '2026-11-08'])?.holds).toBe(false);
  });
});

describe('Vorruhestandsgeld, Freiwilligendienst and Werkstudent', () => {
  it('asks no work questions for Vorruhestandsgeld, but its end and amount', () => {
    const ids = shown({ agBeschaeftigungsart: 'vorruhestand' });
    expect(ids).toEqual(expect.arrayContaining(['agVorruhestandBis', 'agVorruhestandBetrag']));
    for (const id of [
      'agTaetigkeit',
      'agArbeitszeitmodell',
      'agUrlaubstage',
      'agEntgeltArt',
      'agBav',
    ]) {
      expect(ids).not.toContain(id);
    }
  });

  it('asks a Werkstudent employer about the semester break', () => {
    expect(shown({ agBeschaeftigungsart: 'werkstudent' })).toContain('agNurSemesterferien');
    expect(shown({ agBeschaeftigungsart: 'freiwilligendienst' })).not.toContain(
      'agNurSemesterferien',
    );
  });
});
