// Walks the binding (logic/binding.ts) over a parsed invoice: group paths select nodes, term
// paths read text relative to them. Generic — adding a term means adding data, not code.
import type { XmlDocument, XmlNode } from 'libxml2-wasm';
import { INVOICE, pathFor } from '../logic/binding';
import type { GroupDef, SyntaxFamily } from '../logic/binding';
import type { GroupId, RawGroup } from '../logic/model';
import type { SyntaxEntry } from '../logic/syntax';
import { valuesAt } from './xml';
import type { Namespaces } from './xml';

export function familyOf(syntax: SyntaxEntry): SyntaxFamily | undefined {
  if (syntax.id === 'cii') return 'cii';
  if (syntax.id === 'ubl-invoice') return 'ubl';
  if (syntax.id === 'ubl-creditnote') return 'ublCreditNote';
  return undefined;
}

function extractGroup(
  context: XmlDocument | XmlNode,
  def: GroupDef,
  family: SyntaxFamily,
  ns: Namespaces,
): RawGroup {
  const terms: RawGroup['terms'] = {};
  for (const term of def.terms) {
    const path = pathFor(term, family);
    if (path) terms[term.bt] = valuesAt(context, path, ns);
  }
  const groups: Partial<Record<GroupId, RawGroup[]>> = {};
  for (const child of def.groups) {
    const path = pathFor(child, family);
    if (!path) continue;
    groups[child.bg] = context
      .find(path, { ...ns })
      .map((node) => extractGroup(node, child, family, ns));
  }
  return { bg: def.bg, terms, groups };
}

/** The raw model of an EN 16931 invoice (UBL or CII); undefined for other syntaxes. */
export function extractModel(doc: XmlDocument, syntax: SyntaxEntry): RawGroup | undefined {
  const family = familyOf(syntax);
  return family ? extractGroup(doc, INVOICE, family, syntax.namespaces) : undefined;
}
