// Date order in the forms (Tobias 2026-11-13, choice "1": a bound to another field, in new form
// versions). Found by the walk over every form: the Personalfragebogen 1.0.0 took an end of a fixed
// term before the start without a word and then called it a term of under a week. Version 1.1.0
// (draft) refuses it as it is typed; 1.0.0 stays frozen as it was published.
import { join } from 'node:path';
import type { RegisteredForm } from '../../src/logic/formRegistry';
import { answer, enterRole, startSession, type Session } from '../../src/logic/session';
import { DRAFTS_DIR, FORMS_DIR, readJson, registeredFrom } from '../support/formFiles';
import { QUESTIONNAIRE_ID } from '../support/sample';

const pfb100 = registeredFrom(readJson(join(FORMS_DIR, 'personalfragebogen', '1.0.0.json')));
const pfb110 = registeredFrom(readJson(join(DRAFTS_DIR, 'personalfragebogen', '1.1.0.json')));

// The extension to a start in 2027 (Tobias 2026-11-14): exactly these texts of 1.1.0 (as they stand
// in its JSON text), each with its wording in 1.0.0.
const UNDO_2027: [string, string][] = [
  ['"until":"2027-12-31"', '"until":"2026-12-31"'],
  ['"onOrBefore":"1961-07-01"', '"onOrBefore":"1960-09-01"'],
  [
    'Nur bei einem Geburtsdatum zwischen dem 02.11.1959 und dem 01.07.1961 hängt es vom Beginn der Beschäftigung in den Jahren 2026 und 2027 ab, ob die Regelaltersgrenze erreicht ist; davor ist sie sicher erreicht, danach nicht (§ 235 Abs. 2 SGB VI).',
    'Nur bei einem Geburtsdatum zwischen dem 02.11.1959 und dem 01.09.1960 hängt es vom Beginn der Beschäftigung im Jahr 2026 ab, ob die Regelaltersgrenze erreicht ist; davor ist sie sicher erreicht, danach nicht (§ 235 Abs. 2 SGB VI).',
  ],
  [
    '"label":"Minijob (2026 bis 603 €, 2027 bis 633 € im Monat)"',
    '"label":"Minijob (bis 603 € im Monat)"',
  ],
  ['einen Minijob (2026 bis 603 €, 2027 bis 633 € im Monat)', 'einen Minijob (bis 603 € im Monat)'],
  [
    'Die Werte dieser Fassung (z. B. die Minijob-Grenze von 603 € im Jahr 2026 und 633 € im Jahr 2027 und die Rechengrößen der Sozialversicherung) gelten für einen Beschäftigungsbeginn in den Jahren 2026 und 2027; maßgeblich sind jeweils die Werte des Jahres, in dem die Beschäftigung beginnt.',
    'Die Werte dieser Fassung (z. B. die Minijob-Grenze von 603 € und die Rechengrößen der Sozialversicherung) gelten für einen Beschäftigungsbeginn im Jahr 2026.',
  ],
  [
    'Das regelmäßige Jahresarbeitsentgelt – mit weiteren Beschäftigungen und Einmalzahlungen mit Anspruch – übersteigt die maßgebliche Jahresarbeitsentgeltgrenze (bei am 31.12.2002 privat Versicherten die besondere; 2027 bei Personen, die am 31.12.2026 wegen ihres Verdiensts versicherungsfrei und privat versichert waren, die nach § 6 Abs. 8 SGB V): Versicherungsfreiheit in der Krankenversicherung prüfen; dann freiwillige oder private Versicherung mit Beitragszuschuss des Arbeitgebers. Die Summe enthält alle angegebenen weiteren Beschäftigungen; ein Minijob daneben zählt nicht mit – dann nachrechnen.',
    'Das regelmäßige Jahresarbeitsentgelt – mit weiteren Beschäftigungen und Einmalzahlungen mit Anspruch – übersteigt die maßgebliche Jahresarbeitsentgeltgrenze (bei am 31.12.2002 privat Versicherten die besondere): Versicherungsfreiheit in der Krankenversicherung prüfen; dann freiwillige oder private Versicherung mit Beitragszuschuss des Arbeitgebers. Die Summe enthält alle angegebenen weiteren Beschäftigungen; ein Minijob daneben zählt nicht mit – dann nachrechnen.',
  ],
  ['§ 6 Abs. 1 Nr. 1, Abs. 6 bis 8, § 257 SGB V', '§ 6 Abs. 1 Nr. 1, Abs. 6, 7, § 257 SGB V'],
  // Review of the drafts 2026-11-15 (X-2): the data also leave as a link; the memory ends with more.
  [
    'verlassen das Gerät nur als Datei oder als Link, die Sie selbst weitergeben.',
    'verlassen das Gerät nur als Datei, die Sie selbst weitergeben.',
  ],
  [
    '– bis Sie eine PDF oder einen Zwischenstand speichern oder den Fragebogen schließen oder verwerfen, höchstens 7 Tage.',
    '– bis die PDF erstellt oder der Fragebogen verworfen ist, höchstens 7 Tage.',
  ],
];
const austritt = registeredFrom(readJson(join(DRAFTS_DIR, 'austritt', '0.1.0.json')));

function employer(form: RegisteredForm, values: Record<string, unknown>): Session {
  const entered = enterRole(startSession(form, QUESTIONNAIRE_ID), 'arbeitgeber');
  if (!entered.ok) throw new Error(entered.message);
  return Object.entries(values).reduce((s, [id, raw]) => {
    const result = answer(s, id, raw);
    if (!result.ok) throw new Error(`${id}: ${result.message}`);
    return result.session;
  }, entered.session);
}

const FIXED_TERM = {
  agBeschaeftigungsbeginn: '01.11.2026',
  agBeschaeftigungsart: 'svpflichtig',
  agBefristet: true,
};

describe('Personalfragebogen: the end of a fixed term', () => {
  it('1.1.0 refuses an end before the start of employment, naming the start', () => {
    const result = answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '17.05.2026');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt vor „Tag der Beschäftigungsaufnahme“ (01.11.2026).',
    );
  });

  it('1.1.0 takes an end on or after the start', () => {
    expect(answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '01.11.2026').ok).toBe(true);
    expect(answer(employer(pfb110, FIXED_TERM), 'agBefristetBis', '30.04.2027').ok).toBe(true);
  });

  it('1.0.0 stays as it was published: frozen, without the rule', () => {
    expect(answer(employer(pfb100, FIXED_TERM), 'agBefristetBis', '17.05.2026').ok).toBe(true);
  });

  // Besides the date rules, 1.1.0 carries the wording of the Chrome evaluation (B3, B4, B14–B16,
  // B27; tests/forms/chromeEvaluierung.test.ts) — help texts only.
  // And (2026-11-13) the employer's proposed names, the second representative under joint custody,
  // the documents offered only where they fit (option conditions, tests/forms/unterlagen.test.ts).
  it('1.1.0 differs from 1.0.0 only in its version, its stamp, the date rules, help texts and 2027', () => {
    const SECOND = ['vertretung2', 'vertretungUnterschrift'];
    // 2026-11-15 (Tobias: „ja“): alone, alone with the other parent's consent, or together — the
    // guardian's confirmation says so, a legal note names the consent to the contract.
    const CUSTODY = {
      confirmation:
        'Als gesetzliche Vertretung der minderjährigen Person schließe ich mich ihrer Erklärung an.',
      note: 'Die Unterschrift der gesetzlichen Vertretung bestätigt die Angaben im Fragebogen.',
    };
    // 2026-11-15 (Tobias: „ich folge deiner Empfehlung“): the question about 31.12.2026 and its
    // answer as the last argument of the JAEG tests (tests/forms/personalfragebogen2027.test.ts).
    const BESTAND_2026 = 'pkvBestand2026';
    const text = JSON.stringify(pfb110.definition);
    for (const [now] of UNDO_2027) expect(text, now).toContain(now);
    const undone = UNDO_2027.reduce((all, [now, before]) => all.split(now).join(before), text);
    const strip = (definition: unknown) =>
      JSON.stringify(definition, function (this: unknown, key, value: unknown) {
        if (['version', 'revised', 'notBefore', 'notAfter', 'help', 'fromRole'].includes(key)) {
          return undefined;
        }
        // The condition of an answer (an option has a label but no role), not of a field.
        const parent = this as { id?: unknown; label?: unknown; role?: unknown };
        // Audit 2026-11-16: 31.12.2002 is asked in a Minijob next to another job too, the JAEG
        // hints leave a Minijob out (tests/forms/personalfragebogen2027.test.ts pins both).
        if (parent.id === 'pkvBestand2002' && (key === 'showIf' || key === 'because')) {
          return undefined;
        }
        if (['jaeg', 'jaegNichtAngegeben'].includes(String(parent.id)) && key === 'when') {
          return undefined;
        }
        if (key === 'showIf' && parent.label !== undefined && parent.role === undefined) {
          return undefined;
        }
        if (key === 'because' && typeof value === 'string' && value.includes('vorbelegt')) {
          return undefined;
        }
        if (key === 'confirmationText' && typeof value === 'string') {
          return value.startsWith(CUSTODY.confirmation) ? CUSTODY.confirmation : value;
        }
        if (Array.isArray(value)) {
          return value.filter(
            (item: unknown) =>
              item !== BESTAND_2026 &&
              // Audit 2026-11-16, round 4: a privately insured person lifted above the JAEG only
              // by a further Minijob (KV and PV rule, pinned in personalfragebogen2027.test.ts).
              !(
                typeof item === 'object' &&
                item !== null &&
                String((item as { reason?: unknown }).reason).includes(
                  'privat oder anderweitig versichert: Das setzt für die Hauptbeschäftigung',
                )
              ) &&
              !(typeof item === 'string' && item.startsWith(CUSTODY.note)) &&
              !(
                typeof item === 'object' &&
                item !== null &&
                [...SECOND, BESTAND_2026].includes((item as { id?: string }).id ?? '')
              ),
          );
        }
        return value;
      });
    expect(strip(JSON.parse(undone))).toBe(strip(pfb100.definition));
  });
});

describe('Austritt: the notice', () => {
  const NOTICE = {
    agBeendigungsart: 'kuendigungArbeitgeber',
    agEndeArbeitsverhaeltnis: '31.12.2026',
    agKuendigungDatum: '20.11.2026',
  };

  it('refuses a notice received after the end (it used to read as a notice period under a week)', () => {
    const result = answer(employer(austritt, NOTICE), 'agKuendigungZugang', '02.01.2027');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt nach „Ende des Arbeitsverhältnisses“ (31.12.2026).',
    );
  });

  it('refuses a notice received before the letter was written', () => {
    const result = answer(employer(austritt, NOTICE), 'agKuendigungZugang', '19.11.2026');
    expect(result.ok ? '' : result.message).toBe(
      'Das Datum liegt vor „Datum des Kündigungsschreibens“ (20.11.2026).',
    );
  });

  it('takes a notice between the letter and the end', () => {
    expect(answer(employer(austritt, NOTICE), 'agKuendigungZugang', '21.11.2026').ok).toBe(true);
  });
});
