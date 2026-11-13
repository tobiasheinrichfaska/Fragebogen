// The invoice syntaxes the tool knows, recognised by the root element and its namespace — never by
// the file name (factur-x.xml, zugferd-invoice.xml, xrechnung.xml … all occur).

export type SyntaxId = 'ubl-invoice' | 'ubl-creditnote' | 'cii' | 'zugferd1';

export interface SyntaxEntry {
  id: SyntaxId;
  /** German label for the result */
  label: string;
  root: string;
  namespace: string;
  /** Prefixes used by this syntax's XPaths in the field mapping */
  namespaces: Readonly<Record<string, string>>;
  /** Part of EN 16931 (UBL or CII D16B); ZUGFeRD 1.0 is not */
  en16931: boolean;
  /** Only for syntaxes outside the binding (ZUGFeRD 1.0): where the specification id sits */
  specIdPath?: string;
}

const UBL_COMMON = {
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
};

const CII = {
  rsm: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
  ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
  udt: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
  qdt: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
};

export const SYNTAXES: readonly SyntaxEntry[] = [
  {
    id: 'ubl-invoice',
    label: 'UBL 2.1 (Invoice)',
    root: 'Invoice',
    namespace: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    namespaces: UBL_COMMON,
    en16931: true,
  },
  {
    id: 'ubl-creditnote',
    label: 'UBL 2.1 (CreditNote)',
    root: 'CreditNote',
    namespace: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
    namespaces: UBL_COMMON,
    en16931: true,
  },
  {
    id: 'cii',
    label: 'UN/CEFACT CII (Cross Industry Invoice)',
    root: 'CrossIndustryInvoice',
    namespace: CII.rsm,
    namespaces: CII,
    en16931: true,
  },
  {
    // ZUGFeRD 1.0 (2014) used its own namespace; the BMF recognises ZUGFeRD only from 2.0.1 on.
    id: 'zugferd1',
    label: 'ZUGFeRD 1.0',
    root: 'CrossIndustryDocument',
    namespace: 'urn:ferd:CrossIndustryDocument:invoice:1p0',
    namespaces: {
      rsm: 'urn:ferd:CrossIndustryDocument:invoice:1p0',
      ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12',
      udt: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:15',
    },
    en16931: false,
    specIdPath:
      '/rsm:CrossIndustryDocument/rsm:SpecifiedExchangedDocumentContext/ram:GuidelineSpecifiedDocumentContextParameter/ram:ID',
  },
];

export function syntaxOf(root: { name: string; namespace: string }): SyntaxEntry | undefined {
  return SYNTAXES.find((s) => s.root === root.name && s.namespace === root.namespace);
}

export function syntaxById(id: SyntaxId): SyntaxEntry {
  const entry = SYNTAXES.find((s) => s.id === id);
  if (!entry) throw new Error(`Unknown syntax ${id}`);
  return entry;
}
