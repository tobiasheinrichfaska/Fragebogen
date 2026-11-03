// Result type and user-facing issue codes of input normalisation and validation. The logic layer
// returns codes; the UI shows ISSUE_MESSAGES (German product text).

export type IssueCode =
  | 'text.illFormed'
  | 'value.type'
  | 'type.unsupported'
  | 'date.format'
  | 'date.invalid'
  | 'date.tooEarly'
  | 'date.tooLate'
  | 'text.tooLong'
  | 'money.format'
  | 'money.decimals'
  | 'money.tooLarge'
  | 'number.format'
  | 'number.decimals'
  | 'number.negative'
  | 'number.tooLarge'
  | 'number.belowMin'
  | 'number.aboveMax'
  | 'number.step'
  | 'number.unusual'
  | 'month.format'
  | 'month.invalid'
  | 'plz.format'
  | 'kldb.format'
  | 'halbeSchritte.format'
  | 'telefon.format'
  | 'email.format'
  | 'bic.format'
  | 'glaeubigerId.format'
  | 'glaeubigerId.checksum'
  | 'mandatsreferenz.format'
  | 'steuernummer.format'
  | 'jahr.format'
  | 'ziffern.format'
  | 'kennzeichen.format'
  | 'deuev.zeichen'
  | 'deuev.anfang'
  | 'deuev.ende'
  | 'validity.outside'
  | 'iban.format'
  | 'iban.length'
  | 'iban.checksum'
  | 'iban.unknownCountry'
  | 'list.freeEntry'
  | 'taxId.format'
  | 'taxId.leadingZero'
  | 'taxId.digitPattern'
  | 'taxId.checksum'
  | 'svNumber.format'
  | 'svNumber.checksum'
  | 'betriebsnummer.format'
  | 'betriebsnummer.prefix'
  | 'betriebsnummer.checksum'
  | 'choice.unknown'
  | 'choice.notInList'
  | 'rows.tooMany'
  | 'rows.rowId'
  | 'rows.unknownColumn'
  | 'calendar.format'
  | 'calendar.duplicate'
  | 'signature.nameMismatch';

export const ISSUE_MESSAGES: Readonly<Record<IssueCode, string>> = {
  'text.illFormed': 'Der Text enthält ein ungültiges Zeichen.',
  'value.type': 'Der Wert hat ein unerwartetes Format.',
  'type.unsupported': 'Dieser Feldtyp wird noch nicht unterstützt.',
  'date.format':
    'Bitte das Datum als TT.MM.JJJJ eingeben (am Handy genügen die Ziffern, z. B. 17051990).',
  'date.invalid': 'Dieses Datum gibt es nicht.',
  'date.tooEarly': 'Das Datum liegt zu weit zurück – frühestens {minDate}.',
  'date.tooLate': 'Das Datum liegt zu spät – spätestens {maxDate}.',
  'text.tooLong': 'Höchstens {maxLength} Zeichen.',
  'money.format': 'Bitte einen Betrag wie 1.234,56 eingeben.',
  'money.decimals': 'Bitte höchstens zwei Nachkommastellen angeben.',
  'money.tooLarge': 'Der Betrag ist zu groß.',
  'number.format': 'Bitte eine Zahl wie 12,5 eingeben.',
  'number.decimals': 'Bitte nicht so viele Nachkommastellen angeben.',
  'number.negative': 'Hier ist keine negative Zahl möglich.',
  'number.tooLarge': 'Die Zahl ist zu groß.',
  'number.belowMin': 'Mindestens {min}.',
  'number.aboveMax': 'Höchstens {max}.',
  'number.step': 'Nur in Schritten von {step} möglich.',
  'number.unusual': 'Ungewöhnlich hoher Wert – bitte prüfen.',
  'month.format':
    'Bitte einen Monat wie 03.2026 eingeben (am Handy genügen die Ziffern, z. B. 032026).',
  'month.invalid': 'Diesen Monat gibt es nicht.',
  'plz.format': 'Bitte eine deutsche Postleitzahl mit 5 Ziffern eingeben.',
  'kldb.format': 'Die Berufskennziffer nach der Klassifikation der Berufe 2010 hat 5 Ziffern.',
  'halbeSchritte.format': 'Bitte eine Zahl in halben Schritten eingeben, zum Beispiel 4 oder 4,5.',
  'telefon.format':
    'Bitte eine Telefonnummer mit Vorwahl eingeben, zum Beispiel 0721 123456 oder +49 721 123456.',
  'email.format': 'Bitte eine E-Mail-Adresse wie name@beispiel.de eingeben.',
  'bic.format':
    'Der BIC hat 8 oder 11 Stellen: 4 Buchstaben für die Bank, 2 für das Land, 2 Zeichen für den Ort und gegebenenfalls 3 für die Filiale.',
  'glaeubigerId.format':
    'Die Gläubiger-Identifikationsnummer beginnt mit dem Länderkürzel und zwei Prüfziffern; in Deutschland hat sie 18 Stellen, zum Beispiel DE98ZZZ09999999999.',
  'glaeubigerId.checksum': 'Die Gläubiger-Identifikationsnummer stimmt nicht (Prüfziffer).',
  'mandatsreferenz.format':
    "Die Mandatsreferenz hat höchstens 35 Zeichen: Buchstaben ohne Umlaute, Ziffern und + ? / - : ( ) . , ', ohne Leerzeichen.",
  'steuernummer.format':
    'Die Steuernummer hat 10 bis 13 Ziffern, auch mit Schrägstrichen oder Leerzeichen geschrieben.',
  'jahr.format': 'Bitte ein Jahr mit vier Ziffern angeben, zum Beispiel 2025.',
  'ziffern.format': 'Bitte nur Ziffern eingeben.',
  'kennzeichen.format':
    'Das Kennzeichen hat die Form „KA-AB 1234“: bis zu 3 Buchstaben für den Ort, 1 oder 2 Buchstaben und eine Zahl bis 9999, gegebenenfalls E oder H.',
  'deuev.zeichen':
    'Hinweis: Die Meldung zur Sozialversicherung nimmt hier nur bestimmte Zeichen an – Buchstaben, Leerzeichen, Bindestrich und je nach Angabe Punkt, Hochkomma, Ziffern oder Klammern. Bitte prüfen.',
  'deuev.anfang':
    'Hinweis: Für die Meldung zur Sozialversicherung muss die Angabe mit einem Buchstaben beginnen (nicht mit „ß“). Bitte prüfen.',
  'deuev.ende':
    'Hinweis: So darf die Angabe für die Meldung zur Sozialversicherung nicht enden. Bitte prüfen.',
  'validity.outside':
    'Dieses Datum liegt außerhalb der Gültigkeit dieser Formularfassung. Unterschreiben und weitergeben lässt sich der Fragebogen so nicht; bitte die Fassung verwenden, die für dieses Datum gilt.',
  'iban.format': 'Eine IBAN beginnt mit dem Länderkürzel und zwei Prüfziffern, zum Beispiel DE.',
  'iban.length': 'Die IBAN hat für dieses Land nicht die richtige Länge.',
  'iban.checksum': 'Die IBAN stimmt nicht (Prüfziffer). Bitte noch einmal vergleichen.',
  'list.freeEntry':
    'Nicht in der Liste. Die freie Eingabe ist möglich, kann aber Rückfragen und Zusatzaufwand verursachen – bitte möglichst einen Eintrag aus der Liste wählen.',
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
  'betriebsnummer.prefix':
    'Diese Betriebsnummer gibt es nicht: Die ersten drei Ziffern sind 001 bis 099 oder größer als 110.',
  'betriebsnummer.checksum': 'Die Betriebsnummer stimmt nicht (Prüfziffer).',
  'choice.unknown': 'Bitte eine der angebotenen Möglichkeiten wählen.',
  'choice.notInList':
    'Diese Angabe steht nicht in der amtlichen Liste. Bitte einen Eintrag aus den Vorschlägen wählen.',
  'rows.tooMany': 'Die Tabelle hat zu viele Zeilen (höchstens 30).',
  'rows.rowId': 'Eine Tabellenzeile ist fehlerhaft gekennzeichnet.',
  'rows.unknownColumn': 'Eine Tabellenzeile enthält eine unbekannte Spalte.',
  'calendar.format': 'Ein Kalendertag ist fehlerhaft eingetragen.',
  'calendar.duplicate': 'Ein Kalendertag ist doppelt eingetragen.',
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

/** The bounds a message may name; from the field definition. */
export interface IssueBounds {
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  minDate?: string;
  maxDate?: string;
}

const germanNumber = (value: number | undefined) =>
  value === undefined ? '' : String(value).replace('.', ',');
const germanDay = (value: string | undefined) =>
  value === undefined ? '' : value === 'today' ? 'heute' : value.split('-').reverse().join('.');

/** The German message of an issue, with the field's bounds filled in (e.g. „Höchstens 30 Zeichen.“). */
export function issueMessage(issue: IssueCode, bounds: IssueBounds = {}): string {
  return ISSUE_MESSAGES[issue]
    .replace('{maxLength}', germanNumber(bounds.maxLength))
    .replace('{min}', germanNumber(bounds.min))
    .replace('{max}', germanNumber(bounds.max))
    .replace('{step}', germanNumber(bounds.step))
    .replace('{minDate}', germanDay(bounds.minDate))
    .replace('{maxDate}', germanDay(bounds.maxDate));
}
