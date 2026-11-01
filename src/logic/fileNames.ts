// File names after the Gemeinsame Grundsätze § 9a BVV (Verfahrensbeschreibung Ziff. 3): at most 64
// characters, no dot, comma, umlaut, ß, space or other special character. Names carry the form and
// the first characters of the questionnaire id, never a person's name (device mode, shared PCs).

export const MAX_FILE_NAME = 64;

const TRANSLITERATION: Readonly<Record<string, string>> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  Ä: 'Ae',
  Ö: 'Oe',
  Ü: 'Ue',
  ß: 'ss',
};

/** Joins the parts with "_" using only A–Z, a–z, 0–9 and "_"; cut to 64 characters. */
export function safeFileName(parts: readonly string[]): string {
  const cleaned = parts
    .map((part) =>
      part
        .replace(/[äöüÄÖÜß]/g, (char) => TRANSLITERATION[char] ?? '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    )
    .filter((part) => part !== '');
  return cleaned.join('_').slice(0, MAX_FILE_NAME).replace(/_+$/, '') || 'Fragebogen';
}

export type FileKind = 'interim' | 'handover' | 'complete' | 'merged';

const SUFFIX: Readonly<Record<FileKind, string>> = {
  interim: 'Zwischenstand',
  handover: 'Weitergabe',
  complete: 'vollstaendig',
  merged: 'Kanzlei',
};

const EXTENSION: Readonly<Record<FileKind, string>> = {
  interim: '.json',
  handover: '.pdf',
  complete: '.pdf',
  merged: '.json',
};

function formName(formId: string): string {
  return formId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/** E.g. "Sofortmeldung_3f2b8c1e_Weitergabe.pdf". */
export function fileNameFor(formId: string, questionnaireId: string, kind: FileKind): string {
  return (
    safeFileName([formName(formId), questionnaireId.slice(0, 8), SUFFIX[kind]]) + EXTENSION[kind]
  );
}

/** Import file for a payroll program, e.g. "LuG_Stammdaten_10001_42.txt" — numbers, never a name. */
export function importFileName(target: string, mandant: string, employee: string): string {
  return `${safeFileName([target, 'Stammdaten', mandant, employee || 'neu'])}.txt`;
}

/** Erfassungsblatt of that import, e.g. "Erfassungsblatt_LuG_M10001_MA42_3f2b8c1e.pdf". */
export function sheetFileName(
  target: string,
  mandant: string,
  employee: string,
  questionnaireId: string,
): string {
  const parts = [
    'Erfassungsblatt',
    target,
    `M${mandant}`,
    `MA${employee}`,
    questionnaireId.slice(0, 8),
  ];
  return `${safeFileName(parts)}.pdf`;
}

/** Report of a tester's run, e.g. "Testbericht_Erika_M_2026-11-01.pdf". */
export function testReportFileName(tester: string, day: string): string {
  return `${safeFileName(['Testbericht', tester.trim() || 'Tester', day])}.pdf`;
}
