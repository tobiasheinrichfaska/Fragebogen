// What the IO layer found in a file, as plain data. The logic layer judges it (verdict.ts); the
// UI shows both. Nothing here holds an XML document or a PDF — only values.
import type { HeaderValues } from './mapping';
import type { SyntaxId } from './syntax';

export interface Problem {
  message: string;
  line?: number;
  col?: number;
}

export type FileKind = 'pdf' | 'xml' | 'unknown';

export type FileProblemKind =
  'empty' | 'unsupportedType' | 'tooLarge' | 'password' | 'damaged' | 'xmlDoctype' | 'xmlBroken';

/** One invoice XML: the file itself or a PDF attachment. */
export interface InvoicePart {
  /** File name or attachment name */
  origin: string;
  syntax: SyntaxId;
  header: HeaderValues;
}

export type OtherPartKind = 'otherXml' | 'brokenXml' | 'doctypeXml' | 'notXml';

/** A PDF attachment that is no invoice XML. */
export interface OtherPart {
  origin: string;
  kind: OtherPartKind;
  /** Root element of an XML that is no known invoice */
  root?: { name: string; namespace: string };
  problems?: Problem[];
}

export interface Analysis {
  fileName: string;
  kind: FileKind;
  problem?: { kind: FileProblemKind; problems: Problem[] };
  /** XML file that is no known invoice syntax */
  root?: { name: string; namespace: string };
  pdf?: { pages: number; unreadable: string[]; truncated: boolean };
  invoices: InvoicePart[];
  others: OtherPart[];
}
