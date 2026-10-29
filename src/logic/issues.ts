// Result type and user-facing issue codes of input normalisation and validation. The logic layer
// returns codes; the UI shows ISSUE_MESSAGES (German product text).

export type IssueCode =
  | 'text.illFormed'
  | 'value.type'
  | 'type.unsupported'
  | 'date.format'
  | 'date.invalid'
  | 'money.format'
  | 'money.decimals'
  | 'money.tooLarge'
  | 'iban.format'
  | 'iban.length'
  | 'iban.checksum'
  | 'iban.unknownCountry'
  | 'taxId.format'
  | 'taxId.leadingZero'
  | 'taxId.digitPattern'
  | 'taxId.checksum'
  | 'svNumber.format'
  | 'svNumber.checksum'
  | 'betriebsnummer.format'
  | 'choice.unknown'
  | 'signature.nameMismatch';

export const ISSUE_MESSAGES: Readonly<Record<IssueCode, string>> = {
  'text.illFormed': 'Der Text enthält ein ungültiges Zeichen.',
  'value.type': 'Der Wert hat ein unerwartetes Format.',
  'type.unsupported': 'Dieser Feldtyp wird noch nicht unterstützt.',
  'date.format': 'Bitte das Datum als TT.MM.JJJJ eingeben.',
  'date.invalid': 'Dieses Datum gibt es nicht.',
  'money.format': 'Bitte einen Betrag wie 1.234,56 eingeben.',
  'money.decimals': 'Bitte höchstens zwei Nachkommastellen angeben.',
  'money.tooLarge': 'Der Betrag ist zu groß.',
  'iban.format': 'Eine IBAN beginnt mit dem Länderkürzel und zwei Prüfziffern, zum Beispiel DE.',
  'iban.length': 'Die IBAN hat für dieses Land nicht die richtige Länge.',
  'iban.checksum': 'Die IBAN stimmt nicht (Prüfziffer). Bitte noch einmal vergleichen.',
  'iban.unknownCountry':
    'Das Länderkürzel kennt die App nicht; die Länge der IBAN wurde daher nicht geprüft.',
  'taxId.format': 'Die Steuer-Identifikationsnummer hat genau 11 Ziffern.',
  'taxId.leadingZero': 'Eine Steuer-Identifikationsnummer beginnt nie mit 0.',
  'taxId.digitPattern': 'Diese Ziffernfolge ist als Steuer-Identifikationsnummer nicht möglich.',
  'taxId.checksum': 'Die Steuer-Identifikationsnummer stimmt nicht (Prüfziffer).',
  'svNumber.format':
    'Die Versicherungsnummer hat 12 Stellen: 8 Ziffern, einen Buchstaben und 3 Ziffern.',
  'svNumber.checksum': 'Die Versicherungsnummer stimmt nicht (Prüfziffer).',
  'betriebsnummer.format': 'Die Betriebsnummer hat genau 8 Ziffern.',
  'choice.unknown': 'Bitte eine der angebotenen Möglichkeiten wählen.',
  'signature.nameMismatch': 'Der getippte Name weicht vom angegebenen Namen ab. Bitte prüfen.',
};

/** A value accepted (possibly with warnings), or rejected with exactly one issue. */
export type Checked<T> =
  { ok: true; value: T; warnings: readonly IssueCode[] } | { ok: false; issue: IssueCode };

export function accept<T>(value: T, warnings: readonly IssueCode[] = []): Checked<T> {
  return { ok: true, value, warnings };
}

export function reject<T = never>(issue: IssueCode): Checked<T> {
  return { ok: false, issue };
}
