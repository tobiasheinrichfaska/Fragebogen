// Business Terms of EN 16931 → where they sit in each syntax (XPath). Data, not code: the IO layer
// evaluates these paths, the logic layer works with the values. Paths from the syntax bindings
// EN 16931-3-2 (UBL) and -3-3 (CII) as published in the XRechnung and ZUGFeRD specifications.
// Step 1a needs the header terms below; step 1b adds the groups (lines, VAT breakdown, …).
import type { SyntaxId } from './syntax';

export type BtId = `BT-${number}`;

export interface HeaderField {
  bt: BtId;
  /** German label */
  label: string;
  /** XPath per syntax; `/*` stands for the root, so Invoice and CreditNote share one path */
  paths: Partial<Record<SyntaxId, string>>;
}

const CII_DOC = '/rsm:CrossIndustryInvoice/rsm:ExchangedDocument';
const CII_TX = '/rsm:CrossIndustryInvoice/rsm:SupplyChainTradeTransaction';
const CII_AGREEMENT = `${CII_TX}/ram:ApplicableHeaderTradeAgreement`;
const CII_SETTLEMENT = `${CII_TX}/ram:ApplicableHeaderTradeSettlement`;
const UBL_BOTH = (path: string) => ({ 'ubl-invoice': path, 'ubl-creditnote': path });

export const HEADER_FIELDS: readonly HeaderField[] = [
  {
    bt: 'BT-1',
    label: 'Rechnungsnummer',
    paths: { ...UBL_BOTH('/*/cbc:ID'), cii: `${CII_DOC}/ram:ID` },
  },
  {
    bt: 'BT-2',
    label: 'Rechnungsdatum',
    paths: {
      ...UBL_BOTH('/*/cbc:IssueDate'),
      cii: `${CII_DOC}/ram:IssueDateTime/udt:DateTimeString`,
    },
  },
  {
    bt: 'BT-3',
    label: 'Art der Rechnung',
    paths: {
      'ubl-invoice': '/*/cbc:InvoiceTypeCode',
      'ubl-creditnote': '/*/cbc:CreditNoteTypeCode',
      cii: `${CII_DOC}/ram:TypeCode`,
    },
  },
  {
    bt: 'BT-5',
    label: 'Währung',
    paths: {
      ...UBL_BOTH('/*/cbc:DocumentCurrencyCode'),
      cii: `${CII_SETTLEMENT}/ram:InvoiceCurrencyCode`,
    },
  },
  {
    bt: 'BT-24',
    label: 'Kennung der Spezifikation',
    paths: {
      ...UBL_BOTH('/*/cbc:CustomizationID'),
      cii: '/rsm:CrossIndustryInvoice/rsm:ExchangedDocumentContext/ram:GuidelineSpecifiedDocumentContextParameter/ram:ID',
      zugferd1:
        '/rsm:CrossIndustryDocument/rsm:SpecifiedExchangedDocumentContext/ram:GuidelineSpecifiedDocumentContextParameter/ram:ID',
    },
  },
  {
    bt: 'BT-27',
    label: 'Lieferant',
    paths: {
      ...UBL_BOTH(
        '/*/cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName',
      ),
      cii: `${CII_AGREEMENT}/ram:SellerTradeParty/ram:Name`,
    },
  },
  {
    bt: 'BT-112',
    label: 'Rechnungsbetrag brutto',
    paths: {
      ...UBL_BOTH('/*/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount'),
      cii: `${CII_SETTLEMENT}/ram:SpecifiedTradeSettlementHeaderMonetarySummation/ram:GrandTotalAmount`,
    },
  },
];

export type HeaderValues = Readonly<Partial<Record<BtId, readonly string[]>>>;

/** The first non-empty value of a term, trimmed. */
export function first(values: HeaderValues, bt: BtId): string | undefined {
  return values[bt]?.map((v) => v.trim()).find((v) => v.length > 0);
}
