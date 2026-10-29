// Readable field catalogue of a form definition (German Markdown) for the expert review before a
// form is published. It is generated from the definition alone, so what gets approved is exactly
// what gets frozen; tests/forms/catalogue.test.ts keeps docs/formulare/ in sync with the JSON.
import { formatGermanDate } from './dates';
import { describeFieldRules, fieldsById } from './form';
import type { RegisteredForm } from './formRegistry';
import type {
  AcknowledgementKind,
  FieldDefinition,
  FieldType,
  FormDefinition,
  RoleCondition,
  RoleDefinition,
  SignaturePolicy,
  SignatureRequirement,
} from './model';

export const FIELD_TYPE_LABELS: Readonly<Record<FieldType, string>> = {
  text: 'Text',
  date: 'Datum',
  choice: 'Auswahl',
  multiChoice: 'Mehrfachauswahl',
  boolean: 'Ja/Nein',
  iban: 'IBAN',
  taxId: 'Steuer-Identifikationsnummer',
  svNumber: 'Versicherungsnummer',
  betriebsnummer: 'Betriebsnummer (8 Ziffern)',
  money: 'Betrag in Euro',
  repeatGroup: 'Tabelle',
  file: 'Datei',
};

export const SIGNATURE_POLICY_LABELS: Readonly<Record<SignaturePolicy, string>> = {
  electronic: 'Einfache elektronische Unterschrift in der App genügt',
  paperRecommended: 'Unterschrift auf Papier empfohlen',
  paperRequired: 'Unterschrift auf Papier erforderlich',
};

const SIGNATURE_LABELS: Readonly<Record<SignatureRequirement, string>> = {
  required: 'Pflicht',
  optional: 'freiwillig',
  none: 'keine',
};

const ACKNOWLEDGEMENT_LABELS: Readonly<Record<AcknowledgementKind, string>> = {
  read: 'wird in der App gelesen und bestätigt',
  paperHandout: 'wird auf Papier ausgehändigt; im Fragebogen wird die Aushändigung bestätigt',
};

const ROLE_CONDITIONS: Readonly<
  Record<RoleCondition['kind'], (condition: RoleCondition, definition: FormDefinition) => string>
> = {
  minorOnSigning: (condition, definition) =>
    `nur wenn die Person laut „${fieldLabel(definition, condition.birthDateField)}“ am Tag ihrer ` +
    'Unterschrift unter 18 ist',
};

export const CATALOGUE_STATUSES = ['draft', 'published'] as const;
export type CatalogueStatus = (typeof CATALOGUE_STATUSES)[number];

const STATUS_LABELS: Readonly<Record<CatalogueStatus, string>> = {
  draft: 'Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht',
  published: 'Veröffentlicht und eingefroren',
};

/** Escapes a value for one Markdown table cell. */
export function tableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function row(cells: readonly string[]): string {
  return `| ${cells.map(tableCell).join(' | ')} |`;
}

function table(header: readonly string[], rows: readonly (readonly string[])[]): string[] {
  return [row(header), row(header.map(() => '---')), ...rows.map(row)];
}

function fieldLabel(definition: FormDefinition, id: string): string {
  return fieldsById(definition).get(id)?.label ?? id;
}

function roleLabel(definition: FormDefinition, id: string): string {
  return definition.roles.find((role) => role.id === id)?.label ?? id;
}

function fieldKind(field: FieldDefinition): string {
  let kind = FIELD_TYPE_LABELS[field.type];
  if (field.multiline) kind += ', mehrzeilig';
  if (field.options) kind += `: ${field.options.map((option) => option.label).join(', ')}`;
  if (field.computed) kind += ` (berechnet: ${field.computed.fn})`;
  return kind;
}

function fieldRows(definition: FormDefinition, field: FieldDefinition, prefix = ''): string[][] {
  const { input, requirement } = describeFieldRules(definition, field);
  const own = [
    `${prefix}${field.label} (${field.id})`,
    roleLabel(definition, field.role),
    fieldKind(field),
    input,
    requirement,
    field.purpose,
  ];
  return [own, ...(field.columns ?? []).flatMap((column) => fieldRows(definition, column, '– '))];
}

function roleRequired(definition: FormDefinition, role: RoleDefinition): string {
  return role.requiredIf
    ? ROLE_CONDITIONS[role.requiredIf.kind](role.requiredIf, definition)
    : 'immer';
}

function quote(text: string): string[] {
  return text.split('\n').map((line) => (line === '' ? '>' : `> ${line}`));
}

function list(items: readonly string[]): string[] {
  return items.length === 0 ? ['Keine.'] : items.map((item) => `- ${item}`);
}

/** The catalogue as German Markdown; deterministic for a given definition and status. */
export function formCatalogue(form: RegisteredForm, status: CatalogueStatus): string {
  const { definition } = form;
  const lines: string[] = [
    `# Feldkatalog: ${definition.title}`,
    '',
    '> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der',
    '> Definition `npm run catalogue` ausführen.',
    '',
    ...table(
      ['Angabe', 'Wert'],
      [
        ['Formular', `${definition.id}, Version ${definition.version}`],
        ['Status', STATUS_LABELS[status]],
        ['Definition (SHA-256)', form.definitionHash],
        ['Unterschrift', SIGNATURE_POLICY_LABELS[definition.signaturePolicy]],
        ['Empfänger', definition.recipient.label],
      ],
    ),
    '',
    '## Rollen',
    '',
    ...table(
      [
        'Rolle',
        'Unterschrift',
        'Erforderlich',
        'Name der unterzeichnenden Person',
        'Bestätigungstext',
      ],
      definition.roles.map((role) => [
        `${role.label} (${role.id})`,
        SIGNATURE_LABELS[role.signature],
        roleRequired(definition, role),
        role.signerNameField === undefined
          ? '–'
          : `aus „${fieldLabel(definition, role.signerNameField)}“`,
        role.confirmationText,
      ]),
    ),
    '',
    '## Felder',
  ];

  definition.sections.forEach((section, i) => {
    lines.push(
      '',
      `### ${i + 1}. ${section.title}`,
      '',
      ...table(
        ['Feld', 'Zuständig', 'Art', 'Eingabe möglich', 'Pflicht', 'Zweck'],
        section.fields.flatMap((field) => fieldRows(definition, field)),
      ),
    );
  });

  lines.push('', '## Hinweise zur Kenntnisnahme');
  if (definition.infoBlocks.length === 0) lines.push('', 'Keine.');
  for (const block of definition.infoBlocks) {
    lines.push(
      '',
      `### ${block.title}`,
      '',
      `- Kenntnisnahme durch: ${roleLabel(definition, block.role)}`,
      `- Art: ${ACKNOWLEDGEMENT_LABELS[block.acknowledgement]}`,
      `- Stand: ${formatGermanDate(block.asOf)}`,
      '',
      ...quote(block.text),
    );
  }

  const fieldWithRole = (id: string) => {
    const field = fieldsById(definition).get(id);
    return field ? `„${field.label}“ (${roleLabel(definition, field.role)})` : id;
  };
  lines.push(
    '',
    '## Prüfregeln',
    '',
    ...list(
      definition.consistencyRules.map(
        (rule) =>
          `${fieldWithRole(rule.fields[0])} und ${fieldWithRole(rule.fields[1])} sollen ` +
          `übereinstimmen. Sonst: „${rule.message}“`,
      ),
    ),
    '',
    '## Zuordnung getrennt eingegangener Teile',
    '',
    ...list(
      definition.matchKeys.map(
        (key) => `${key.label}: ${Object.values(key.fields).map(fieldWithRole).join(' = ')}`,
      ),
    ),
  );
  if (definition.matchKeys.length > 0) {
    lines.push(
      '',
      'Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird ' +
        'nur auf menschliche Entscheidung.',
    );
  }
  lines.push('', '## Rechtliche Hinweise', '', ...list(definition.legalNotes), '');
  return lines.join('\n');
}
