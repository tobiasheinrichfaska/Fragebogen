// The Austritt draft against the data set of the electronic Arbeitsbescheinigung (Tobias 2026-11-15:
// „prüfe das mit einem agenten“). Checked that day in the BA's „Datensatz und Datenbausteine sowie
// Fehlerkatalog im BEA-Verfahren“ 4.6 (Datenbaustein DBKE), the Vordruck BA II 2 – 08/2023 and
// § 312 SGB III: what the Bescheinigung requires is asked, in its order; the special cases it treats
// apart are excluded; § 159 Abs. 1 S. 2 Nr. 9 and § 41 Abs. 3 SGB VI read in the law. Fictitious data.
import { join } from 'node:path';
import { derive } from '../../src/logic/derivations';
import { activeInfoBlocks, visibleFields } from '../../src/logic/form';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { activeExclusions, checkHints } from '../../src/logic/hints';
import type { Questionnaire } from '../../src/logic/model';
import {
  createQuestionnaire,
  currentPart,
  setValue,
  startPart,
} from '../../src/logic/questionnaire';
import { DRAFTS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { ok, QUESTIONNAIRE_ID } from '../support/sample';

const form: RegisteredForm = registeredFrom(readJson(join(DRAFTS_DIR, 'austritt', '0.1.0.json')));
const ROLE = 'arbeitgeber';

function draftWith(values: Record<string, unknown>): Questionnaire {
  return Object.entries(values).reduce(
    (q, [id, value]) => ok(setValue(q, form, ROLE, id, value)),
    ok(startPart(createQuestionnaire(QUESTIONNAIRE_ID, form), form, ROLE)),
  );
}
const asked = (q: Questionnaire) =>
  visibleFields(form.definition, ROLE, currentPart(q, ROLE)?.data ?? {}).map((f) => f.id);
const hintIds = (q: Questionnaire) => checkHints(q, form.definition).map((h) => h.id);
const excluded = (q: Questionnaire) => activeExclusions(q, form.definition).map((e) => e.id);
const proposal = (q: Questionnaire, id: string) =>
  derive(q, form.definition).find((d) => d.id === id)?.value;
const fieldOf = (id: string) =>
  form.definition.sections.flatMap((s) => s.fields).find((f) => f.id === id);

const BEFRISTUNG = {
  agBeendigungsart: 'befristung',
  agSonderfall: 'keiner',
  agEndeArbeitsverhaeltnis: '31.12.2026',
};

describe('Befristung in the order of the Arbeitsbescheinigung (Nr. 62 to 67)', () => {
  it('asks the first end, the day of the contract, an extension, the form and the prospect', () => {
    const ids = asked(draftWith({ ...BEFRISTUNG, agBefristungVerlaengert: true }));
    const block = [
      'agBefristungUrspruenglichBis',
      'agBefristungAbschluss',
      'agBefristungVerlaengert',
      'agBefristungVerlaengertAm',
      'agBefristetBis',
      'agBefristungSchriftlich',
      'agBefristungWeiterbeschaeftigung',
    ];
    expect(ids.filter((id) => block.includes(id))).toEqual(block);
  });

  it('asks when and until when only after an extension', () => {
    const ids = asked(draftWith({ ...BEFRISTUNG, agBefristungVerlaengert: false }));
    expect(ids).not.toContain('agBefristungVerlaengertAm');
    expect(ids).not.toContain('agBefristetBis');
  });

  it('refuses a contract concluded after its first end', () => {
    const q = draftWith({ ...BEFRISTUNG, agBefristungUrspruenglichBis: '30.06.2026' });
    expect(setValue(q, form, ROLE, 'agBefristungAbschluss', '01.07.2026')).toMatchObject({
      ok: false,
    });
    expect(setValue(q, form, ROLE, 'agBefristungAbschluss', '01.01.2026').ok).toBe(true);
  });

  // § 41 Abs. 3 SGB VI: „bedarf … der Textform. § 14 Absatz 4 des Teilzeit- und
  // Befristungsgesetzes gilt nicht.“
  it('takes Textform for an end at the Regelaltersgrenze, and flags only a missing form', () => {
    expect(hintIds(draftWith({ ...BEFRISTUNG, agBefristungSchriftlich: 'nein' }))).toContain(
      'befristungNichtSchriftlich',
    );
    expect(
      hintIds(draftWith({ ...BEFRISTUNG, agBefristungSchriftlich: 'textformRegelaltersgrenze' })),
    ).not.toContain('befristungNichtSchriftlich');
    expect(fieldOf('agBefristungSchriftlich')?.help).toContain('§ 41 Abs. 3 SGB VI');
  });
});

describe('Kündigung, Sozialauswahl and Abmahnung', () => {
  const AG = { agBeendigungsart: 'kuendigungArbeitgeber', agSonderfall: 'keiner' };

  it('asks the delivery only for the employer’s notice, with the two values of the data set', () => {
    expect(asked(draftWith(AG))).toContain('agKuendigungZustellung');
    expect(
      asked(draftWith({ agBeendigungsart: 'kuendigungPerson', agSonderfall: 'keiner' })),
    ).not.toContain('agKuendigungZustellung');
    expect(fieldOf('agKuendigungZustellung')?.options?.map((o) => o.id)).toEqual([
      'persoenlich',
      'nichtPersoenlich',
    ]);
  });

  it('asks the Sozialauswahl for an Aufhebungsvertrag too, and the agency only after its check', () => {
    const aufhebung = { agBeendigungsart: 'aufhebungsvertrag', agSonderfall: 'keiner' };
    expect(asked(draftWith(aufhebung))).toEqual(
      expect.arrayContaining(['agSozialauswahl', 'agZusatzvereinbarung']),
    );
    expect(asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja' }))).toContain(
      'agSozialauswahlGeprueft',
    );
    expect(
      asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja', agSozialauswahlGeprueft: false })),
    ).not.toContain('agSozialauswahlAgentur');
    expect(
      asked(draftWith({ ...aufhebung, agSozialauswahl: 'ja', agSozialauswahlGeprueft: true })),
    ).toContain('agSozialauswahlAgentur');
  });

  it('derives the Sozialauswahl from the reason where it follows from it', () => {
    expect(
      proposal(draftWith({ ...AG, agKuendigungsgrund: 'personenbedingt' }), 'sozialauswahl'),
    ).toBe('entfällt');
    expect(
      proposal(draftWith({ ...AG, agKuendigungsgrund: 'verhaltensbedingt' }), 'sozialauswahl'),
    ).toBe('nein');
    expect(
      proposal(
        draftWith({ ...AG, agKuendigungsgrund: 'betriebsbedingt', agSozialauswahl: 'ja' }),
        'sozialauswahl',
      ),
    ).toBe('ja');
  });

  it('asks for an Abmahnung also when the employer would have dismissed for a breach of duty', () => {
    const q = draftWith({
      agBeendigungsart: 'aufhebungsvertrag',
      agSonderfall: 'keiner',
      agHaetteGekuendigt: 'selberZeitpunkt',
      agHaetteVertragswidrig: true,
    });
    expect(asked(q)).toContain('agAbmahnung');
  });
});

describe('payments because of the end', () => {
  const BASE = { agBeendigungsart: 'aufhebungsvertrag', agSonderfall: 'keiner' };

  it('asks whether the Abfindung would have been paid on a dismissal, for every Aufhebungsvertrag', () => {
    expect(asked(draftWith({ ...BASE, agHaetteGekuendigt: 'nein', agAbfindung: 'ja' }))).toContain(
      'agAbfindungAuchBeiAgKuendigung',
    );
  });

  it('takes an open Arbeitsentgelt after the end and then asks why', () => {
    const q = draftWith({ ...BASE, agEntgeltUeberEnde: 'offen' });
    expect(asked(q)).toContain('agUngewissGrund');
    expect(proposal(q, 'leistungBeiBeendigung')).toBe('ungewiss');
    expect(fieldOf('agEntgeltUeberEnde')?.help).toContain('§ 8 EFZG');
  });

  it('asks a Vorruhestandsleistung with its start and its share of the gross pay', () => {
    const q = draftWith({ ...BASE, agAbfindung: 'nein', agVorruhestand: 'ja' });
    expect(asked(q)).toEqual(expect.arrayContaining(['agVorruhestandAb', 'agVorruhestandProzent']));
    expect(proposal(q, 'leistungBeiBeendigung')).toBe('ja');
    expect(hintIds(q)).toContain('vorruhestand');
  });
});

describe('special cases the Arbeitsbescheinigung treats apart', () => {
  it.each([
    ['insolvenz', 'sonderfallInsolvenz'],
    ['arbeitskampf', 'sonderfallArbeitskampf'],
    ['heimarbeit', 'sonderfallHeimarbeit'],
    ['transfer', 'sonderfallTransfer'],
    ['altersteilzeitVorzeitig', 'sonderfallAltersteilzeitVorzeitig'],
  ])('excludes %s', (option, exclusion) => {
    expect(excluded(draftWith({ ...BEFRISTUNG, agSonderfall: option }))).toEqual([exclusion]);
  });

  it('only notes an Altersteilzeit that ends as agreed', () => {
    const q = draftWith({ ...BEFRISTUNG, agSonderfall: 'altersteilzeit' });
    expect(excluded(q)).toEqual([]);
    expect(hintIds(q)).toContain('altersteilzeitEnde');
  });
});

it('says the Sperrzeit of a late registration lasts one week, after § 159 Abs. 1 S. 2 Nr. 9', () => {
  const text = form.definition.infoBlocks.find((b) => b.id === 'hinweisArbeitsuche')?.text ?? '';
  expect(text).toContain('Sperrzeit von einer Woche');
  expect(text).toContain('§ 159 Abs. 1 S. 2 Nr. 9, Abs. 6 SGB III');
});

// Audit 2026-11-15: every notice came for every end, the Kündigung ones also after a death, and the
// employer had to confirm that he tells a deceased person to register as a job seeker.
describe('the notices that fit the way the employment ends', () => {
  const notices = (art: string) =>
    activeInfoBlocks(
      form.definition,
      ROLE,
      currentPart(draftWith({ agBeendigungsart: art }), ROLE)?.data ?? {},
    ).map((block) => block.id);
  it.each([
    [
      'kuendigungArbeitgeber',
      [
        'hinweisAblauf',
        'hinweisSchriftform',
        'hinweisZugang',
        'hinweisFristen',
        'hinweisBesondererSchutz',
        'hinweisBetriebsrat',
        'hinweisFreistellungUrlaub',
        'hinweisArbeitsuche',
      ],
    ],
    // Audit 2026-11-16: a Kündigung of the person the employer brought about counts for the
    // Massenentlassung (§ 17 Abs. 1 Satz 2 KSchG).
    [
      'kuendigungPerson',
      [
        'hinweisAblauf',
        'hinweisSchriftform',
        'hinweisZugang',
        'hinweisFristen',
        'hinweisBetriebsrat',
        'hinweisFreistellungUrlaub',
        'hinweisArbeitsuche',
      ],
    ],
    [
      'aufhebungsvertrag',
      [
        'hinweisAblauf',
        'hinweisSchriftform',
        'hinweisFristen',
        'hinweisBetriebsrat',
        'hinweisFreistellungUrlaub',
        'hinweisArbeitsuche',
      ],
    ],
    ['befristung', ['hinweisAblauf', 'hinweisFreistellungUrlaub', 'hinweisArbeitsuche']],
    ['gesetzTarif', ['hinweisAblauf', 'hinweisFreistellungUrlaub', 'hinweisArbeitsuche']],
    ['ausbildungsende', ['hinweisAblauf', 'hinweisFreistellungUrlaub']],
    ['tod', ['hinweisAblauf', 'hinweisFreistellungUrlaub']],
    // Audit 2026-11-16: no end at all (both excluded), and nothing chosen yet.
    ['wechselIntern', ['hinweisAblauf', 'hinweisFreistellungUrlaub']],
    ['betriebsuebergang', ['hinweisAblauf', 'hinweisFreistellungUrlaub']],
  ])('%s', (art, expected) => {
    expect(notices(art).sort()).toEqual([...expected].sort());
  });

  it('shows no notice of an end before the way it ends is chosen', () => {
    const data = currentPart(draftWith({}), ROLE)?.data ?? {};
    expect(
      activeInfoBlocks(form.definition, ROLE, data)
        .map((block) => block.id)
        .sort(),
    ).toEqual(['hinweisAblauf', 'hinweisFreistellungUrlaub']);
  });

  it('keeps the exception for a training in the job-seeker notice', () => {
    const text = form.definition.infoBlocks.find((b) => b.id === 'hinweisArbeitsuche')?.text;
    expect(text).toContain('§ 38 Abs. 1 S. 4 SGB III');
  });

  it('counts what the employer brought about for a Massenentlassung', () => {
    const text = form.definition.infoBlocks.find((b) => b.id === 'hinweisBetriebsrat')?.text;
    expect(text).toContain('§ 17 Abs. 1 Satz 2 KSchG');
  });
});

// § 21 BBiG: the training ends with its time (Abs. 1), earlier on a passed exam (Abs. 2), later on
// a failed one when the person asks (Abs. 3).
it('names every end of a training in the help on the last day', () => {
  const help = fieldOf('agEndeArbeitsverhaeltnis')?.help ?? '';
  for (const part of ['§ 21 Abs. 1 BBiG', '§ 21 Abs. 2 BBiG', '§ 21 Abs. 3 BBiG']) {
    expect(help).toContain(part);
  }
});

// § 41 Abs. 3 SGB VI allows Textform since 01.01.2025 (Bürokratieentlastungsgesetz IV).
it('flags an age limit agreed only in Textform in a contract from before 2025', () => {
  const textform = { ...BEFRISTUNG, agBefristungSchriftlich: 'textformRegelaltersgrenze' };
  expect(hintIds(draftWith({ ...textform, agBefristungAbschluss: '01.06.2020' }))).toContain(
    'textformVor2025',
  );
  expect(hintIds(draftWith({ ...textform, agBefristungAbschluss: '15.01.2025' }))).not.toContain(
    'textformVor2025',
  );
});

it('refuses an extension that ends before the day it was agreed', () => {
  const q = draftWith({
    ...BEFRISTUNG,
    agBefristungAbschluss: '01.01.2026',
    agBefristungVerlaengert: true,
    agBefristungVerlaengertAm: '15.06.2026',
  });
  expect(setValue(q, form, ROLE, 'agBefristetBis', '01.03.2026')).toMatchObject({ ok: false });
  expect(setValue(q, form, ROLE, 'agBefristetBis', '31.12.2026').ok).toBe(true);
});
