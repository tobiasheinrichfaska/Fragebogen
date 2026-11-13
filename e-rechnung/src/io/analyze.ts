// One file → what is in it (logic/analysis.ts). The file type is taken from the content, never
// from the name; XML among PDF attachments as well. Every XML document is disposed right after
// its values are read.
import type { Analysis, FileKind, InvoicePart, OtherPart, Problem } from '../logic/analysis';
import { HEADER_FIELDS } from '../logic/mapping';
import type { BtId, HeaderValues } from '../logic/mapping';
import { looksLikeXml } from '../logic/prolog';
import { syntaxOf } from '../logic/syntax';
import { readPdfAttachments } from './pdf';
import type { PdfJsLike } from './pdf';
import { readXml, rootOf, valuesAt } from './xml';

const PDF_MAGIC = '%PDF-';

/** PDF when "%PDF-" appears in the first KB (as viewers accept), XML by its prolog. */
export function fileKindOf(bytes: Uint8Array): FileKind {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  if (head.includes(PDF_MAGIC)) return 'pdf';
  if (looksLikeXml(bytes)) return 'xml';
  return 'unknown';
}

type XmlOutcome =
  | { kind: 'invoice'; part: InvoicePart }
  | { kind: 'other'; root: { name: string; namespace: string } }
  | { kind: 'doctype' }
  | { kind: 'tooLarge' }
  | { kind: 'broken'; problems: Problem[] };

function readInvoiceXml(origin: string, bytes: Uint8Array): XmlOutcome {
  const read = readXml(bytes);
  if (!read.ok) {
    if (read.issue === 'doctype') return { kind: 'doctype' };
    if (read.issue === 'tooLarge') return { kind: 'tooLarge' };
    return { kind: 'broken', problems: read.problems };
  }
  const doc = read.doc;
  try {
    const root = rootOf(doc);
    const syntax = syntaxOf(root);
    if (!syntax) return { kind: 'other', root };
    const header: Partial<Record<BtId, string[]>> = {};
    for (const field of HEADER_FIELDS) {
      const path = field.paths[syntax.id];
      if (path) header[field.bt] = valuesAt(doc, path, syntax.namespaces);
    }
    return { kind: 'invoice', part: { origin, syntax: syntax.id, header: header as HeaderValues } };
  } finally {
    doc.dispose();
  }
}

export async function analyzeFile(
  fileName: string,
  bytes: Uint8Array,
  loadPdfJs: () => Promise<PdfJsLike>,
): Promise<Analysis> {
  const base = { fileName, invoices: [], others: [] };
  if (bytes.byteLength === 0) {
    return { ...base, kind: 'unknown', problem: { kind: 'empty', problems: [] } };
  }
  const kind = fileKindOf(bytes);

  if (kind === 'xml') {
    const outcome = readInvoiceXml(fileName, bytes);
    switch (outcome.kind) {
      case 'invoice':
        return { ...base, kind, invoices: [outcome.part] };
      case 'other':
        return { ...base, kind, root: outcome.root };
      case 'doctype':
        return { ...base, kind, problem: { kind: 'xmlDoctype', problems: [] } };
      case 'tooLarge':
        return { ...base, kind, problem: { kind: 'tooLarge', problems: [] } };
      case 'broken':
        return { ...base, kind, problem: { kind: 'xmlBroken', problems: outcome.problems } };
    }
  }

  if (kind === 'pdf') {
    const read = await readPdfAttachments(await loadPdfJs(), bytes);
    if (!read.ok) {
      return {
        ...base,
        kind,
        problem: {
          kind: read.issue,
          problems: read.detail ? [{ message: read.detail }] : [],
        },
      };
    }
    const invoices: InvoicePart[] = [];
    const others: OtherPart[] = [];
    for (const attachment of read.attachments) {
      if (!looksLikeXml(attachment.bytes)) {
        others.push({ origin: attachment.name, kind: 'notXml' });
        continue;
      }
      const outcome = readInvoiceXml(attachment.name, attachment.bytes);
      if (outcome.kind === 'invoice') invoices.push(outcome.part);
      else if (outcome.kind === 'other') {
        others.push({ origin: attachment.name, kind: 'otherXml', root: outcome.root });
      } else if (outcome.kind === 'doctype') {
        others.push({ origin: attachment.name, kind: 'doctypeXml' });
      } else {
        others.push({
          origin: attachment.name,
          kind: 'brokenXml',
          problems: outcome.kind === 'broken' ? outcome.problems : [],
        });
      }
    }
    return {
      ...base,
      kind,
      pdf: { pages: read.pages, unreadable: read.unreadable, truncated: read.truncated },
      invoices,
      others,
    };
  }

  return { ...base, kind, problem: { kind: 'unsupportedType', problems: [] } };
}
