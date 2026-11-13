// Every sentence the tool says, in one place: German, Sie-form, simple sentences. Hints, never an
// approval — no text may say "ordnungsgemäß" or "gültig".
import type { FileProblemKind } from './analysis';
import type { Tone } from './verdict';

export const TEXTS = {
  fixedNotice:
    'Technische Erstprüfung, keine steuerliche Prüfung. Maßgeblich sind die Daten in der XML. Bei Fragen wenden Sie sich an Ihre Kanzlei.',

  eRechnung: 'E-Rechnung erkannt ({spec})',
  hybridSource: 'Das PDF enthält Rechnungsdaten als XML (Anhang „{name}“).',
  xmlCounts: 'Maßgeblich sind die Daten in der XML, nicht das Bild des PDF.',
  xmlFile: 'Die Datei enthält die Rechnungsdaten als XML.',

  keineERechnungPdf: 'PDF mit Rechnungsdaten, Profil {profile}: keine E-Rechnung im Sinne des UStG',
  keineERechnungXml: 'Rechnungsdaten im Profil {profile}: keine E-Rechnung im Sinne des UStG',
  minimumReason:
    'Nach dem BMF-Schreiben vom 15.10.2024 gelten ZUGFeRD- und Factur-X-Rechnungen in den Profilen MINIMUM und BASIC WL nicht als E-Rechnung.',
  zugferd1Reason: 'Das BMF erkennt ZUGFeRD erst ab Version 2.0.1 als E-Rechnung an.',

  nichtBeurteilt: 'Rechnungsdaten erkannt, Spezifikation unbekannt: nicht beurteilt',
  specUnknown: 'Spezifikation unbekannt',
  unknownSpec: 'Kennung der Spezifikation (BT-24): {id}. Diese Kennung kennt das Tool nicht.',
  missingSpec: 'Die Kennung der Spezifikation (BT-24) fehlt.',
  shownAnyway: 'Die Angaben aus der XML werden trotzdem angezeigt.',

  sameSeveral:
    'Die gleiche Rechnung ist {count}-mal eingebettet ({names}). Der Standard sieht eine Rechnungs-XML vor.',
  contradicting: 'Mögliche Auffälligkeit: widersprüchliche Rechnungsdaten im PDF',
  contradictingWhy:
    'Das PDF enthält {count} Rechnungs-XML mit unterschiedlichen Daten ({names}). Unklar ist, welche gilt.',
  askSupplier: 'Bitte fordern Sie beim Lieferanten eine eindeutige Fassung an.',

  otherXml: 'XML-Datei ohne bekanntes Rechnungsformat',
  rootIs: 'Wurzelelement: {name} (Namensraum {namespace}).',
  otherFormats:
    'Das Tool kennt UBL und CII nach EN 16931. Andere Formate können eine E-Rechnung sein, wenn Sie das mit dem Lieferanten vereinbart haben. Das Tool beurteilt sie nicht.',

  plainPdf: 'Keine E-Rechnung: einfaches PDF',
  pdfWithoutInvoiceData: 'Keine E-Rechnung: PDF ohne Rechnungsdaten',
  plainPdfWhy: 'Das PDF enthält keine Rechnungsdaten als XML. Ein PDF allein ist keine E-Rechnung.',
  attachmentsNoInvoice: 'Anhänge im PDF: {names}. Keiner davon enthält Rechnungsdaten.',
  pdfBrokenXml: 'PDF mit fehlerhafter XML',
  attachmentBroken: 'Der Anhang „{name}“ ist XML, lässt sich aber nicht lesen.',
  attachmentDoctype:
    'Der Anhang „{name}“ enthält eine Dokumenttyp-Angabe (DOCTYPE). Aus Sicherheitsgründen liest das Tool ihn nicht.',
  formatError: 'Formatfehler, gem. Rn. 6a ggf. keine E-Rechnung.',
  problemAtLine: 'Zeile {line}: {message}',

  fileProblems: {
    empty: { tone: 'bad', headline: 'Die Datei ist leer', explanation: [] },
    unsupportedType: {
      tone: 'bad',
      headline: 'Diese Dateiart prüft das Tool nicht',
      explanation: ['Bitte wählen Sie eine PDF- oder XML-Datei.'],
    },
    tooLarge: {
      tone: 'bad',
      headline: 'Die Datei ist zu groß',
      explanation: ['Das Tool prüft PDF-Dateien bis 30 MB und XML-Dateien bis 20 MB.'],
    },
    password: {
      tone: 'bad',
      headline: 'Das PDF ist mit einem Kennwort geschützt',
      explanation: [
        'Das Tool kann geschützte PDF-Dateien nicht lesen. Bitte fordern Sie beim Lieferanten eine ungeschützte Fassung an.',
      ],
    },
    damaged: {
      tone: 'bad',
      headline: 'Das PDF lässt sich nicht lesen',
      explanation: ['Die Datei ist beschädigt oder kein PDF.'],
    },
    xmlDoctype: {
      tone: 'warn',
      headline: 'XML-Datei mit Dokumenttyp-Angabe: nicht geprüft',
      explanation: [
        'E-Rechnungen enthalten keine Dokumenttyp-Angabe (DOCTYPE). Aus Sicherheitsgründen prüft das Tool solche Dateien nicht.',
      ],
    },
    xmlBroken: {
      tone: 'bad',
      headline: 'Die XML-Datei ist fehlerhaft',
      explanation: ['Formatfehler, gem. Rn. 6a ggf. keine E-Rechnung.'],
    },
  } satisfies Record<FileProblemKind, { tone: Tone; headline: string; explanation: string[] }>,
};

/** Replaces {name} placeholders. */
export function fill(text: string, values: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/** Labels of the document type codes (BT-3, UNTDID 1001) that occur in German practice. */
export const TYPE_CODES: Readonly<Record<string, string>> = {
  '326': 'Teilrechnung',
  '380': 'Rechnung',
  '381': 'Rechnungskorrektur (Credit Note)',
  '384': 'Korrigierte Rechnung',
  '386': 'Anzahlungsrechnung',
  '389': 'Gutschrift (vom Leistungsempfänger ausgestellt)',
  '751': 'Rechnungsinformation für Buchungszwecke',
  '875': 'Abschlagsrechnung (Bauleistung)',
  '876': 'Teilschlussrechnung (Bauleistung)',
  '877': 'Schlussrechnung (Bauleistung)',
};
