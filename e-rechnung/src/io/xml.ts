// The XML engine: libxml2 compiled to WebAssembly (libxml2-wasm). One engine for reading, XPath
// and XSD validation, so the view of the data and the schema check never disagree. The schemas
// are bundled and served to libxml2 from memory; nothing is loaded from outside.
import {
  ParseOption,
  XmlBufferInputProvider,
  XmlDocument,
  XmlLibError,
  XsdValidator,
  xmlRegisterInputProvider,
} from 'libxml2-wasm';
import type { ErrorDetail, XmlNode } from 'libxml2-wasm';
import { scanProlog, textOf } from '../logic/prolog';

export const MAX_XML_BYTES = 20 * 1024 * 1024;

/** No network, no external entities, no entity substitution — untrusted input. */
const SAFE_PARSE = ParseOption.XML_PARSE_NONET | ParseOption.XML_PARSE_NO_XXE;

export interface XmlProblem {
  message: string;
  line?: number;
  col?: number;
}

export type XmlRead =
  | { ok: true; doc: XmlDocument }
  | {
      ok: false;
      issue: 'tooLarge' | 'doctype' | 'noXml' | 'notWellFormed';
      problems: XmlProblem[];
    };

function problemsOf(details: readonly ErrorDetail[]): XmlProblem[] {
  return details.map((d) => ({
    message: d.message.trim(),
    ...(d.line > 0 ? { line: d.line } : {}),
    ...(d.col > 0 ? { col: d.col } : {}),
  }));
}

/** Reads untrusted bytes as XML. The caller disposes the document. */
export function readXml(bytes: Uint8Array): XmlRead {
  if (bytes.byteLength > MAX_XML_BYTES) return { ok: false, issue: 'tooLarge', problems: [] };
  const prolog = scanProlog(textOf(bytes.subarray(0, 256 * 1024)));
  if (prolog.kind === 'doctype') return { ok: false, issue: 'doctype', problems: [] };
  if (prolog.kind === 'noRoot') return { ok: false, issue: 'noXml', problems: [] };
  try {
    return { ok: true, doc: XmlDocument.fromBuffer(bytes, { option: SAFE_PARSE }) };
  } catch (error) {
    if (error instanceof XmlLibError) {
      return { ok: false, issue: 'notWellFormed', problems: problemsOf(error.details) };
    }
    throw error;
  }
}

export type Namespaces = Readonly<Record<string, string>>;

/** The text of every node an XPath selects (a string, number or boolean result as one value). */
export function valuesAt(context: XmlDocument | XmlNode, xpath: string, ns: Namespaces): string[] {
  const result = context.eval(xpath, { ...ns });
  if (Array.isArray(result)) return result.map((node) => node.content);
  return [String(result)];
}

/** The root element's local name and namespace URI. */
export function rootOf(doc: XmlDocument): { name: string; namespace: string } {
  return { name: doc.root.name, namespace: doc.root.namespaceUri };
}

// --- XSD -----------------------------------------------------------------------------------

/** Virtual folder libxml2 reads the bundled schemas from (relative imports resolve inside it). */
export const SCHEMA_BASE = '/schemas/';

let registered: XmlBufferInputProvider | undefined;
const validators = new Map<string, XsdValidator>();

/**
 * Hands the bundled schema files to libxml2 (once). Keys are paths below `schemas/`, e.g.
 * `ubl-2.1/maindoc/UBL-Invoice-2.1.xsd`.
 */
export function provideSchemas(files: Readonly<Record<string, string>>): void {
  const encoder = new TextEncoder();
  if (!registered) {
    registered = new XmlBufferInputProvider({});
    xmlRegisterInputProvider(registered);
  }
  for (const [path, text] of Object.entries(files)) {
    registered.addBuffer(SCHEMA_BASE + path, encoder.encode(text));
  }
}

/** The validator for an entry schema (a path below `schemas/`), compiled once. */
export function xsdValidator(entry: string, files: Readonly<Record<string, string>>): XsdValidator {
  const cached = validators.get(entry);
  if (cached) return cached;
  const text = files[entry];
  if (text === undefined) throw new Error(`Unknown schema: ${entry}`);
  provideSchemas(files);
  const schemaDoc = XmlDocument.fromString(text, { url: SCHEMA_BASE + entry });
  try {
    const validator = XsdValidator.fromDoc(schemaDoc);
    validators.set(entry, validator);
    return validator;
  } finally {
    schemaDoc.dispose();
  }
}

/** Schema problems of a document; empty when it is valid. */
export function schemaProblems(doc: XmlDocument, validator: XsdValidator): XmlProblem[] {
  try {
    validator.validate(doc);
    return [];
  } catch (error) {
    if (error instanceof XmlLibError) return problemsOf(error.details);
    throw error;
  }
}
