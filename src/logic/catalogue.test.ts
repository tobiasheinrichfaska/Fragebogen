import {
  beispielForm,
  chainForm,
  guardianForm,
  linkedForm,
  logicForm,
} from '../../tests/support/sample';
import { formCatalogue, tableCell } from './catalogue';
import type { RegisteredForm } from './formRegistry';

function lineWith(markdown: string, text: string): string {
  const line = markdown.split('\n').find((candidate) => candidate.includes(text));
  if (line === undefined) throw new Error(`no line contains ${text}`);
  return line;
}

describe('formCatalogue', () => {
  it('names the form, the status and the exact definition hash', () => {
    const form = guardianForm();
    const markdown = formCatalogue(form, 'draft');
    expect(markdown.startsWith('# Feldkatalog: Beispielformular (nur für Tests)\n')).toBe(true);
    expect(markdown).toContain('| Formular | beispiel, Version 1.1.0 |');
    expect(markdown).toContain(`| Definition (SHA-256) | ${form.definitionHash} |`);
    expect(markdown).toContain('| Status | Entwurf zur fachlichen Freigabe');
    expect(formCatalogue(form, 'published')).toContain(
      '| Status | Veröffentlicht und eingefroren |',
    );
  });

  it('explains when the guardian must sign and where the name comes from', () => {
    const line = lineWith(
      formCatalogue(guardianForm(), 'draft'),
      '| Gesetzliche Vertretung (vertretung) |',
    );
    expect(line).toContain(
      'nur wenn die Person laut „Geburtsdatum“ am Tag ihrer Unterschrift unter 18 ist',
    );
    expect(line).toContain('aus „Vor- und Nachname der gesetzlichen Vertretung“');
    expect(
      lineWith(formCatalogue(guardianForm(), 'draft'), '| Arbeitgeber (arbeitgeber) |'),
    ).toContain('| freiwillig | immer | – |');
  });

  it('lists every field with owner, kind, availability, requirement and purpose', () => {
    const form = logicForm();
    const markdown = formCatalogue(form, 'draft');
    for (const field of form.definition.sections.flatMap((section) => section.fields)) {
      expect(markdown).toContain(`| ${tableCell(field.label)} (${field.id}) |`);
    }
    expect(lineWith(markdown, '(weitereArt)')).toBe(
      '| Art der weiteren Beschäftigung (weitereArt) | Beschäftigte Person | Auswahl: Minijob, ' +
        'Sozialversicherungspflichtig | erst wenn „Üben Sie eine weitere Beschäftigung aus?“ mit ' +
        '„Ja“ beantwortet ist | Pflicht | Versicherungsrechtliche Beurteilung |',
    );
    expect(lineWith(markdown, '(bemerkungen)')).toContain(
      '| Text, mehrzeilig | immer | optional |',
    );
  });

  it('quotes notices line by line with kind and date', () => {
    const markdown = formCatalogue(beispielForm(), 'draft');
    expect(markdown).toContain(
      '### Datenschutzhinweis\n\n- Kenntnisnahme durch: Beschäftigte Person\n' +
        '- Art: wird in der App gelesen und bestätigt\n- Stand: 29.10.2026\n\n' +
        '> Erfundener Hinweistext für Tests.',
    );
  });

  it('describes rules, match keys and legal notes', () => {
    const markdown = formCatalogue(beispielForm(), 'draft');
    expect(markdown).toContain(
      '- „Nachname“ (Beschäftigte Person) und „Nachname der beschäftigten Person“ (Arbeitgeber) ' +
        'sollen übereinstimmen. Sonst: „Der Nachname weicht zwischen den Angaben ab.“',
    );
    expect(markdown).toContain(
      '- Nachname: „Nachname“ (Beschäftigte Person) = „Nachname der beschäftigten Person“ (Arbeitgeber)',
    );
    expect(
      markdown.endsWith(
        '## Rechtliche Hinweise\n\n- Einfache elektronische Signatur; nur für Tests.\n',
      ),
    ).toBe(true);
  });

  it('says "Keine." for empty lists', () => {
    const form: RegisteredForm = structuredClone(beispielForm());
    form.definition.infoBlocks = [];
    form.definition.consistencyRules = [];
    form.definition.matchKeys = [];
    const markdown = formCatalogue(form, 'draft');
    expect(markdown).toContain('## Hinweise zur Kenntnisnahme\n\nKeine.');
    expect(markdown).toContain('## Prüfregeln\n\nKeine.');
    expect(markdown).toContain(
      '## Zuordnung getrennt eingegangener Teile\n\nKeine.\n\n## Rechtliche',
    );
  });

  it('names preselections, master data and linked parts', () => {
    const markdown = formCatalogue(linkedForm(), 'draft');
    expect(lineWith(markdown, '(weitereBeschaeftigung)')).toContain('| Ja/Nein; vorbelegt: Nein |');
    expect(lineWith(markdown, '(agFirma)')).toContain(
      '| Text; Stammdatum, kann auf dem Gerät gemerkt werden |',
    );
    expect(markdown).toContain(
      '## Verknüpfung der Teile\n\n- Beschäftigte Person und Arbeitgeber: Wer zuletzt abschließt, ' +
        'bestätigt die aktuelle Fassung des anderen Teils.',
    );
    expect(formCatalogue(beispielForm(), 'draft')).toContain('## Verknüpfung der Teile\n\nKeine.');
  });

  it('shows question and help texts in the field cell', () => {
    expect(lineWith(formCatalogue(chainForm(), 'draft'), '(nachname)')).toContain(
      '| Nachname (nachname)<br>Frage: Wie lautet Ihr Nachname?<br>Hilfe: Wie im Ausweis. |',
    );
  });

  it('draws the dependencies as a tree with levels', () => {
    const markdown = formCatalogue(chainForm(), 'draft');
    const tree = markdown.slice(
      markdown.indexOf('## Abhängigkeiten'),
      markdown.indexOf('## Hinweise zur Kenntnisnahme'),
    );
    expect(tree.split('\n').filter((line) => line.trimStart().startsWith('- '))).toEqual([
      '- Üben Sie eine weitere Beschäftigung aus? (Beschäftigte Person; unabhängig)',
      '  - Art der weiteren Beschäftigung (Beschäftigte Person; Ebene 1) – erst wenn „Üben Sie eine weitere Beschäftigung aus?“ mit „Ja“ beantwortet ist',
      '    - Firma der weiteren Beschäftigung (Beschäftigte Person; Ebene 2) – erst wenn bei „Art der weiteren Beschäftigung“ „Sozialversicherungspflichtig“ gewählt ist',
      '      - Wochenstunden dort (Beschäftigte Person; Ebene 3) – erst wenn „Üben Sie eine weitere Beschäftigung aus?“ mit „Ja“ beantwortet ist und „Firma der weiteren Beschäftigung“ ausgefüllt ist',
    ]);
    expect(tree).toContain('Alle übrigen Angaben sind unabhängig.');
  });

  it('says so when no answer rests on another', () => {
    const form: RegisteredForm = structuredClone(beispielForm());
    for (const section of form.definition.sections) {
      for (const field of section.fields) delete field.showIf;
    }
    expect(formCatalogue(form, 'draft')).toContain(
      '## Abhängigkeiten\n\nAlle Angaben sind unabhängig voneinander.',
    );
  });

  it('marks a published 0.x version as a deletable test version', () => {
    const form: RegisteredForm = structuredClone(beispielForm());
    form.definition.version = '0.3.0';
    expect(formCatalogue(form, 'published')).toContain(
      '| Status | Eingefrorene Testfassung (0.x):',
    );
    expect(formCatalogue(form, 'draft')).toContain('| Status | Entwurf zur fachlichen Freigabe');
  });

  it('keeps table cells intact', () => {
    expect(tableCell('a | b\nc')).toBe('a \\| b<br>c');
  });

  it('is deterministic', () => {
    expect(formCatalogue(logicForm(), 'draft')).toBe(formCatalogue(logicForm(), 'draft'));
  });
});
