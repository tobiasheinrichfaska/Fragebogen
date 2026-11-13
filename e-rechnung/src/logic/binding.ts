// EN 16931 semantic model → syntax (XPath 1.0), as data. Source: KoSIT "XRechnung Visualization"
// v2026-10-13 (Apache-2.0), xsl/ubl-invoice-xr.xsl, ubl-creditnote-xr.xsl and cii-xr.xsl, which
// map UBL and CII onto the semantic model term by term. XPath 2.0 constructs there are rewritten
// to XPath 1.0 (libxml2); deviations are commented. Group paths are relative to the parent group,
// term paths relative to their group. Covered: every term the Pflichtangaben view and the
// plausibility rules need — payment instructions (BG-16 …) and XRechnung sub-lines are not.

export type TermKind = 'text' | 'code' | 'id' | 'date' | 'amount' | 'quantity' | 'percent';

/** One path per syntax; `ublCreditNote` only where a CreditNote differs from an Invoice. */
export interface Paths {
  ubl?: string;
  ublCreditNote?: string;
  cii?: string;
}

export interface TermDef extends Paths {
  bt: `BT-${number}`;
  label: string;
  kind: TermKind;
}

export interface GroupDef extends Paths {
  bg: `BG-${number}` | 'INVOICE';
  label: string;
  /** May occur more than once (lines, VAT breakdown, allowances, notes …) */
  repeats: boolean;
  terms: TermDef[];
  groups: GroupDef[];
}

const CII_DOC = '/rsm:CrossIndustryInvoice/rsm:ExchangedDocument';
const CII_TX = '/rsm:CrossIndustryInvoice/rsm:SupplyChainTradeTransaction';
const AGREEMENT = `${CII_TX}/ram:ApplicableHeaderTradeAgreement`;
const DELIVERY = `${CII_TX}/ram:ApplicableHeaderTradeDelivery`;
const SETTLEMENT = `${CII_TX}/ram:ApplicableHeaderTradeSettlement`;
// xs:boolean also allows 0/1; the KoSIT stylesheets only test 'false'/'true'.
const UBL_ALLOWANCE =
  "cac:AllowanceCharge[cbc:ChargeIndicator = 'false' or cbc:ChargeIndicator = '0']";
const UBL_CHARGE = "cac:AllowanceCharge[cbc:ChargeIndicator = 'true' or cbc:ChargeIndicator = '1']";
const CII_ALLOWANCE =
  "ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator = 'false' or ram:ChargeIndicator/udt:Indicator = '0']";
const CII_CHARGE =
  "ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator = 'true' or ram:ChargeIndicator/udt:Indicator = '1']";

const term = (
  bt: TermDef['bt'],
  label: string,
  kind: TermKind,
  ubl: string | undefined,
  cii: string | undefined,
  ublCreditNote?: string,
): TermDef => ({
  bt,
  label,
  kind,
  ...(ubl ? { ubl } : {}),
  ...(cii ? { cii } : {}),
  ...(ublCreditNote ? { ublCreditNote } : {}),
});

function address(
  bg: GroupDef['bg'],
  label: string,
  bts: [number, number, number, number, number, number, number],
  ubl: string,
  cii: string,
): GroupDef {
  const [street, additional, line3, city, postcode, subdivision, country] = bts;
  return {
    bg,
    label,
    repeats: false,
    ubl,
    cii,
    groups: [],
    terms: [
      term(`BT-${street}`, 'Straße', 'text', 'cbc:StreetName', 'ram:LineOne'),
      term(`BT-${additional}`, 'Adresszusatz', 'text', 'cbc:AdditionalStreetName', 'ram:LineTwo'),
      term(`BT-${line3}`, 'Adresszeile 3', 'text', 'cac:AddressLine/cbc:Line', 'ram:LineThree'),
      term(`BT-${city}`, 'Ort', 'text', 'cbc:CityName', 'ram:CityName'),
      term(`BT-${postcode}`, 'Postleitzahl', 'text', 'cbc:PostalZone', 'ram:PostcodeCode'),
      term(
        `BT-${subdivision}`,
        'Region',
        'text',
        'cbc:CountrySubentity',
        'ram:CountrySubDivisionName',
      ),
      term(`BT-${country}`, 'Land', 'code', 'cac:Country/cbc:IdentificationCode', 'ram:CountryID'),
    ],
  };
}

function contact(
  bg: GroupDef['bg'],
  bts: [number, number, number],
  ubl: string,
  cii: string,
): GroupDef {
  const [name, phone, mail] = bts;
  return {
    bg,
    label: 'Kontakt',
    repeats: false,
    ubl,
    cii,
    groups: [],
    terms: [
      // KoSIT reads either PersonName or DepartmentName for the contact point (CII).
      term(
        `BT-${name}`,
        'Ansprechpartner',
        'text',
        'cbc:Name',
        'ram:PersonName | ram:DepartmentName',
      ),
      term(
        `BT-${phone}`,
        'Telefon',
        'text',
        'cbc:Telephone',
        'ram:TelephoneUniversalCommunication/ram:CompleteNumber',
      ),
      term(
        `BT-${mail}`,
        'E-Mail',
        'text',
        'cbc:ElectronicMail',
        'ram:EmailURIUniversalCommunication/ram:URIID',
      ),
    ],
  };
}

function allowanceGroup(
  bg: GroupDef['bg'],
  label: string,
  first: number,
  ubl: string,
  cii: string,
): GroupDef {
  return {
    bg,
    label,
    repeats: true,
    ubl,
    cii,
    groups: [],
    terms: [
      term(`BT-${first}`, 'Betrag', 'amount', 'cbc:Amount', 'ram:ActualAmount'),
      term(`BT-${first + 1}`, 'Grundbetrag', 'amount', 'cbc:BaseAmount', 'ram:BasisAmount'),
      term(
        `BT-${first + 2}`,
        'Prozentsatz',
        'percent',
        'cbc:MultiplierFactorNumeric',
        'ram:CalculationPercent',
      ),
      term(`BT-${first + 3}`, 'Grund', 'text', 'cbc:AllowanceChargeReason', 'ram:Reason'),
      term(
        `BT-${first + 4}`,
        'Grund (Code)',
        'code',
        'cbc:AllowanceChargeReasonCode',
        'ram:ReasonCode',
      ),
    ],
  };
}

/** Document-level allowances/charges carry their VAT category and rate as well. */
function documentAllowanceGroup(
  bg: GroupDef['bg'],
  label: string,
  first: number,
  ubl: string,
  cii: string,
): GroupDef {
  return {
    bg,
    label,
    repeats: true,
    ubl,
    cii,
    groups: [],
    terms: [
      term(`BT-${first}`, 'Betrag', 'amount', 'cbc:Amount', 'ram:ActualAmount'),
      term(`BT-${first + 1}`, 'Grundbetrag', 'amount', 'cbc:BaseAmount', 'ram:BasisAmount'),
      term(
        `BT-${first + 2}`,
        'Prozentsatz',
        'percent',
        'cbc:MultiplierFactorNumeric',
        'ram:CalculationPercent',
      ),
      term(
        `BT-${first + 3}`,
        'Umsatzsteuerkategorie',
        'code',
        'cac:TaxCategory/cbc:ID',
        'ram:CategoryTradeTax/ram:CategoryCode',
      ),
      term(
        `BT-${first + 4}`,
        'Umsatzsteuersatz',
        'percent',
        'cac:TaxCategory/cbc:Percent',
        'ram:CategoryTradeTax/ram:RateApplicablePercent',
      ),
      term(`BT-${first + 5}`, 'Grund', 'text', 'cbc:AllowanceChargeReason', 'ram:Reason'),
      term(
        `BT-${first + 6}`,
        'Grund (Code)',
        'code',
        'cbc:AllowanceChargeReasonCode',
        'ram:ReasonCode',
      ),
    ],
  };
}

export const INVOICE: GroupDef = {
  bg: 'INVOICE',
  label: 'Rechnung',
  repeats: false,
  terms: [
    term('BT-1', 'Rechnungsnummer', 'id', '/*/cbc:ID', `${CII_DOC}/ram:ID`),
    term(
      'BT-2',
      'Rechnungsdatum',
      'date',
      '/*/cbc:IssueDate',
      `${CII_DOC}/ram:IssueDateTime/udt:DateTimeString`,
    ),
    term(
      'BT-3',
      'Art der Rechnung',
      'code',
      '/*/cbc:InvoiceTypeCode',
      `${CII_DOC}/ram:TypeCode`,
      '/*/cbc:CreditNoteTypeCode',
    ),
    term(
      'BT-5',
      'Währung',
      'code',
      '/*/cbc:DocumentCurrencyCode',
      `${SETTLEMENT}/ram:InvoiceCurrencyCode`,
    ),
    term(
      'BT-6',
      'Währung der Umsatzsteuer',
      'code',
      '/*/cbc:TaxCurrencyCode',
      `${SETTLEMENT}/ram:TaxCurrencyCode`,
    ),
    // CII: not in the KoSIT stylesheet; TradeTaxType/TaxPointDate (udt:DateType) in the CII D16B
    // schema, BR-CO-03 of the CEN schematron tests //ram:TaxPointDate.
    term(
      'BT-7',
      'Steuerpunktdatum',
      'date',
      '/*/cbc:TaxPointDate',
      `${SETTLEMENT}/ram:ApplicableTradeTax/ram:TaxPointDate/udt:DateString`,
    ),
    term(
      'BT-8',
      'Code für das Steuerpunktdatum',
      'code',
      '/*/cac:InvoicePeriod/cbc:DescriptionCode',
      `${SETTLEMENT}/ram:ApplicableTradeTax/ram:DueDateTypeCode`,
    ),
    term(
      'BT-9',
      'Fälligkeitsdatum',
      'date',
      '/*/cbc:DueDate',
      `${SETTLEMENT}/ram:SpecifiedTradePaymentTerms/ram:DueDateDateTime/udt:DateTimeString`,
      '/*/cac:PaymentMeans/cbc:PaymentDueDate',
    ),
    term(
      'BT-10',
      'Käuferreferenz (Leitweg-ID)',
      'id',
      '/*/cbc:BuyerReference',
      `${AGREEMENT}/ram:BuyerReference`,
    ),
    term(
      'BT-13',
      'Bestellnummer',
      'id',
      '/*/cac:OrderReference/cbc:ID',
      `${AGREEMENT}/ram:BuyerOrderReferencedDocument/ram:IssuerAssignedID`,
    ),
    term(
      'BT-20',
      'Zahlungsbedingungen',
      'text',
      '/*/cac:PaymentTerms/cbc:Note',
      `${SETTLEMENT}/ram:SpecifiedTradePaymentTerms/ram:Description`,
    ),
    term(
      'BT-23',
      'Geschäftsprozess',
      'id',
      '/*/cbc:ProfileID',
      '/rsm:CrossIndustryInvoice/rsm:ExchangedDocumentContext/ram:BusinessProcessSpecifiedDocumentContextParameter/ram:ID',
    ),
    term(
      'BT-24',
      'Kennung der Spezifikation',
      'id',
      '/*/cbc:CustomizationID',
      '/rsm:CrossIndustryInvoice/rsm:ExchangedDocumentContext/ram:GuidelineSpecifiedDocumentContextParameter/ram:ID',
    ),
  ],
  groups: [
    {
      // UBL: KoSIT pairs a preceding three-letter note as subject code (BT-21); here every note
      // is its own BG-1 and BT-21 is read for CII only.
      bg: 'BG-1',
      label: 'Bemerkung',
      repeats: true,
      ubl: '/*/cbc:Note',
      cii: `${CII_DOC}/ram:IncludedNote`,
      groups: [],
      terms: [
        term('BT-21', 'Betreff der Bemerkung', 'code', undefined, 'ram:SubjectCode'),
        term('BT-22', 'Bemerkung', 'text', '.', 'ram:Content'),
      ],
    },
    {
      bg: 'BG-3',
      label: 'Vorausgegangene Rechnung',
      repeats: true,
      ubl: '/*/cac:BillingReference/cac:InvoiceDocumentReference',
      cii: `${SETTLEMENT}/ram:InvoiceReferencedDocument`,
      groups: [],
      terms: [
        term(
          'BT-25',
          'Nummer der vorausgegangenen Rechnung',
          'id',
          'cbc:ID',
          'ram:IssuerAssignedID',
        ),
        term(
          'BT-26',
          'Datum der vorausgegangenen Rechnung',
          'date',
          'cbc:IssueDate',
          'ram:FormattedIssueDateTime/qdt:DateTimeString',
        ),
      ],
    },
    {
      bg: 'BG-4',
      label: 'Verkäufer (leistender Unternehmer)',
      repeats: false,
      ubl: '/*/cac:AccountingSupplierParty/cac:Party',
      cii: `${AGREEMENT}/ram:SellerTradeParty`,
      terms: [
        term(
          'BT-27',
          'Name des Verkäufers',
          'text',
          'cac:PartyLegalEntity/cbc:RegistrationName',
          'ram:Name',
        ),
        term(
          'BT-28',
          'Handelsname des Verkäufers',
          'text',
          'cac:PartyName/cbc:Name',
          'ram:SpecifiedLegalOrganization/ram:TradingBusinessName',
        ),
        term(
          'BT-29',
          'Kennung',
          'id',
          "cac:PartyIdentification/cbc:ID[not(@schemeID = 'SEPA')]",
          'ram:ID | ram:GlobalID',
        ),
        term(
          'BT-30',
          'Registernummer',
          'id',
          'cac:PartyLegalEntity/cbc:CompanyID',
          'ram:SpecifiedLegalOrganization/ram:ID',
        ),
        term(
          'BT-31',
          'USt-IdNr. des Verkäufers',
          'id',
          "cac:PartyTaxScheme[cac:TaxScheme/cbc:ID = 'VAT']/cbc:CompanyID",
          "ram:SpecifiedTaxRegistration/ram:ID[@schemeID = 'VA']",
        ),
        term(
          'BT-32',
          'Steuernummer des Verkäufers',
          'id',
          "cac:PartyTaxScheme[not(cac:TaxScheme/cbc:ID = 'VAT')]/cbc:CompanyID",
          "ram:SpecifiedTaxRegistration/ram:ID[@schemeID = 'FC']",
        ),
        term(
          'BT-33',
          'Weitere rechtliche Informationen',
          'text',
          'cac:PartyLegalEntity/cbc:CompanyLegalForm',
          'ram:Description',
        ),
        term(
          'BT-34',
          'Elektronische Adresse',
          'id',
          'cbc:EndpointID',
          'ram:URIUniversalCommunication/ram:URIID',
        ),
      ],
      groups: [
        address(
          'BG-5',
          'Anschrift',
          [35, 36, 162, 37, 38, 39, 40],
          'cac:PostalAddress',
          'ram:PostalTradeAddress',
        ),
        contact('BG-6', [41, 42, 43], 'cac:Contact', 'ram:DefinedTradeContact'),
      ],
    },
    {
      bg: 'BG-7',
      label: 'Käufer (Leistungsempfänger)',
      repeats: false,
      ubl: '/*/cac:AccountingCustomerParty/cac:Party',
      cii: `${AGREEMENT}/ram:BuyerTradeParty`,
      terms: [
        term(
          'BT-44',
          'Name des Käufers',
          'text',
          'cac:PartyLegalEntity/cbc:RegistrationName',
          'ram:Name',
        ),
        term(
          'BT-45',
          'Handelsname des Käufers',
          'text',
          'cac:PartyName/cbc:Name',
          'ram:SpecifiedLegalOrganization/ram:TradingBusinessName',
        ),
        term('BT-46', 'Kennung', 'id', 'cac:PartyIdentification/cbc:ID', 'ram:ID | ram:GlobalID'),
        term(
          'BT-47',
          'Registernummer',
          'id',
          'cac:PartyLegalEntity/cbc:CompanyID',
          'ram:SpecifiedLegalOrganization/ram:ID',
        ),
        // CII: KoSIT accepts schemeID VA and VAT (XPath 2.0 sequence rewritten with "or").
        term(
          'BT-48',
          'USt-IdNr. des Käufers',
          'id',
          "cac:PartyTaxScheme[cac:TaxScheme/cbc:ID = 'VAT']/cbc:CompanyID",
          "ram:SpecifiedTaxRegistration/ram:ID[@schemeID = 'VA' or @schemeID = 'VAT']",
        ),
        term(
          'BT-49',
          'Elektronische Adresse',
          'id',
          'cbc:EndpointID',
          'ram:URIUniversalCommunication/ram:URIID',
        ),
      ],
      groups: [
        address(
          'BG-8',
          'Anschrift',
          [50, 51, 163, 52, 53, 54, 55],
          'cac:PostalAddress',
          'ram:PostalTradeAddress',
        ),
        contact('BG-9', [56, 57, 58], 'cac:Contact', 'ram:DefinedTradeContact'),
      ],
    },
    {
      bg: 'BG-10',
      label: 'Zahlungsempfänger',
      repeats: false,
      ubl: '/*/cac:PayeeParty',
      cii: `${SETTLEMENT}/ram:PayeeTradeParty`,
      groups: [],
      terms: [term('BT-59', 'Name', 'text', 'cac:PartyName/cbc:Name', 'ram:Name')],
    },
    {
      bg: 'BG-11',
      label: 'Steuerlicher Vertreter (Fiskalvertreter)',
      repeats: false,
      ubl: '/*/cac:TaxRepresentativeParty',
      cii: `${AGREEMENT}/ram:SellerTaxRepresentativeTradeParty`,
      terms: [
        term('BT-62', 'Name', 'text', 'cac:PartyName/cbc:Name', 'ram:Name'),
        term(
          'BT-63',
          'USt-IdNr. des Fiskalvertreters',
          'id',
          "cac:PartyTaxScheme[cac:TaxScheme/cbc:ID = 'VAT']/cbc:CompanyID",
          'ram:SpecifiedTaxRegistration/ram:ID',
        ),
      ],
      groups: [
        address(
          'BG-12',
          'Anschrift',
          [64, 65, 164, 66, 67, 68, 69],
          'cac:PostalAddress',
          'ram:PostalTradeAddress',
        ),
      ],
    },
    {
      bg: 'BG-13',
      label: 'Lieferung',
      repeats: false,
      ubl: '/*/cac:Delivery',
      cii: DELIVERY,
      terms: [
        term(
          'BT-70',
          'Name des Empfängers der Lieferung',
          'text',
          'cac:DeliveryParty/cac:PartyName/cbc:Name',
          'ram:ShipToTradeParty/ram:Name',
        ),
        term(
          'BT-71',
          'Kennung des Lieferorts',
          'id',
          'cac:DeliveryLocation/cbc:ID',
          'ram:ShipToTradeParty/ram:ID | ram:ShipToTradeParty/ram:GlobalID',
        ),
        term(
          'BT-72',
          'Tatsächliches Lieferdatum',
          'date',
          'cbc:ActualDeliveryDate',
          'ram:ActualDeliverySupplyChainEvent/ram:OccurrenceDateTime/udt:DateTimeString',
        ),
      ],
      groups: [
        address(
          'BG-15',
          'Lieferanschrift',
          [75, 76, 165, 77, 78, 79, 80],
          'cac:DeliveryLocation/cac:Address',
          'ram:ShipToTradeParty/ram:PostalTradeAddress',
        ),
      ],
    },
    {
      bg: 'BG-14',
      label: 'Rechnungszeitraum',
      repeats: false,
      ubl: '/*/cac:InvoicePeriod',
      cii: `${SETTLEMENT}/ram:BillingSpecifiedPeriod`,
      groups: [],
      terms: [
        term('BT-73', 'Beginn', 'date', 'cbc:StartDate', 'ram:StartDateTime/udt:DateTimeString'),
        term('BT-74', 'Ende', 'date', 'cbc:EndDate', 'ram:EndDateTime/udt:DateTimeString'),
      ],
    },
    documentAllowanceGroup(
      'BG-20',
      'Nachlass auf Dokumentenebene',
      92,
      `/*/${UBL_ALLOWANCE}`,
      `${SETTLEMENT}/${CII_ALLOWANCE}`,
    ),
    documentAllowanceGroup(
      'BG-21',
      'Zuschlag auf Dokumentenebene',
      99,
      `/*/${UBL_CHARGE}`,
      `${SETTLEMENT}/${CII_CHARGE}`,
    ),
    {
      bg: 'BG-22',
      label: 'Gesamtbeträge',
      repeats: false,
      ubl: '/*/cac:LegalMonetaryTotal',
      cii: `${SETTLEMENT}/ram:SpecifiedTradeSettlementHeaderMonetarySummation`,
      groups: [],
      terms: [
        term(
          'BT-106',
          'Summe der Nettobeträge der Positionen',
          'amount',
          'cbc:LineExtensionAmount',
          'ram:LineTotalAmount',
        ),
        term(
          'BT-107',
          'Summe der Nachlässe',
          'amount',
          'cbc:AllowanceTotalAmount',
          'ram:AllowanceTotalAmount',
        ),
        term(
          'BT-108',
          'Summe der Zuschläge',
          'amount',
          'cbc:ChargeTotalAmount',
          'ram:ChargeTotalAmount',
        ),
        term(
          'BT-109',
          'Gesamtbetrag ohne Umsatzsteuer',
          'amount',
          'cbc:TaxExclusiveAmount',
          'ram:TaxBasisTotalAmount',
        ),
        // CII: KoSIT requires the currency attribute; it is optional in the D16B schema, so an
        // amount without one counts as well.
        term(
          'BT-110',
          'Summe der Umsatzsteuer',
          'amount',
          '/*/cac:TaxTotal/cbc:TaxAmount[@currencyID = /*/cbc:DocumentCurrencyCode]',
          'ram:TaxTotalAmount[not(@currencyID) or @currencyID = ../preceding-sibling::ram:InvoiceCurrencyCode]',
        ),
        term(
          'BT-112',
          'Gesamtbetrag mit Umsatzsteuer',
          'amount',
          'cbc:TaxInclusiveAmount',
          'ram:GrandTotalAmount',
        ),
        term(
          'BT-113',
          'Vorausgezahlter Betrag',
          'amount',
          'cbc:PrepaidAmount',
          'ram:TotalPrepaidAmount',
        ),
        term(
          'BT-114',
          'Rundungsbetrag',
          'amount',
          'cbc:PayableRoundingAmount',
          'ram:RoundingAmount',
        ),
        term('BT-115', 'Fälliger Betrag', 'amount', 'cbc:PayableAmount', 'ram:DuePayableAmount'),
      ],
    },
    {
      bg: 'BG-23',
      label: 'Aufschlüsselung der Umsatzsteuer',
      repeats: true,
      ubl: '/*/cac:TaxTotal/cac:TaxSubtotal',
      cii: `${SETTLEMENT}/ram:ApplicableTradeTax`,
      groups: [],
      terms: [
        term(
          'BT-116',
          'Steuerbemessungsgrundlage',
          'amount',
          'cbc:TaxableAmount',
          'ram:BasisAmount',
        ),
        term('BT-117', 'Steuerbetrag', 'amount', 'cbc:TaxAmount', 'ram:CalculatedAmount'),
        term(
          'BT-118',
          'Umsatzsteuerkategorie',
          'code',
          'cac:TaxCategory/cbc:ID',
          'ram:CategoryCode',
        ),
        term(
          'BT-119',
          'Umsatzsteuersatz',
          'percent',
          'cac:TaxCategory/cbc:Percent',
          'ram:RateApplicablePercent',
        ),
        term(
          'BT-120',
          'Befreiungsgrund',
          'text',
          'cac:TaxCategory/cbc:TaxExemptionReason',
          'ram:ExemptionReason',
        ),
        term(
          'BT-121',
          'Befreiungsgrund (Code)',
          'code',
          'cac:TaxCategory/cbc:TaxExemptionReasonCode',
          'ram:ExemptionReasonCode',
        ),
      ],
    },
    {
      bg: 'BG-24',
      label: 'Rechnungsbegründende Unterlage',
      repeats: true,
      ubl: "/*/cac:AdditionalDocumentReference[not(cbc:DocumentTypeCode = '130')]",
      cii: `${AGREEMENT}/ram:AdditionalReferencedDocument[ram:TypeCode = '916']`,
      groups: [],
      terms: [
        term('BT-122', 'Kennung der Unterlage', 'id', 'cbc:ID', 'ram:IssuerAssignedID'),
        term('BT-123', 'Beschreibung', 'text', 'cbc:DocumentDescription', 'ram:Name'),
      ],
    },
    {
      bg: 'BG-25',
      label: 'Position',
      repeats: true,
      ubl: '/*/cac:InvoiceLine',
      ublCreditNote: '/*/cac:CreditNoteLine',
      cii: `${CII_TX}/ram:IncludedSupplyChainTradeLineItem`,
      terms: [
        term(
          'BT-126',
          'Positionsnummer',
          'id',
          'cbc:ID',
          'ram:AssociatedDocumentLineDocument/ram:LineID',
        ),
        term(
          'BT-127',
          'Bemerkung zur Position',
          'text',
          'cbc:Note',
          'ram:AssociatedDocumentLineDocument/ram:IncludedNote/ram:Content',
        ),
        term(
          'BT-129',
          'Menge',
          'quantity',
          'cbc:InvoicedQuantity',
          'ram:SpecifiedLineTradeDelivery/ram:BilledQuantity',
          'cbc:CreditedQuantity',
        ),
        term(
          'BT-130',
          'Einheit',
          'code',
          'cbc:InvoicedQuantity/@unitCode',
          'ram:SpecifiedLineTradeDelivery/ram:BilledQuantity/@unitCode',
          'cbc:CreditedQuantity/@unitCode',
        ),
        term(
          'BT-131',
          'Nettobetrag der Position',
          'amount',
          'cbc:LineExtensionAmount',
          'ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeSettlementLineMonetarySummation/ram:LineTotalAmount',
        ),
        term(
          'BT-132',
          'Bestellposition',
          'id',
          'cac:OrderLineReference/cbc:LineID',
          'ram:SpecifiedLineTradeAgreement/ram:BuyerOrderReferencedDocument/ram:LineID',
        ),
      ],
      groups: [
        {
          bg: 'BG-26',
          label: 'Leistungszeitraum der Position',
          repeats: false,
          ubl: 'cac:InvoicePeriod',
          cii: 'ram:SpecifiedLineTradeSettlement/ram:BillingSpecifiedPeriod',
          groups: [],
          terms: [
            term(
              'BT-134',
              'Beginn',
              'date',
              'cbc:StartDate',
              'ram:StartDateTime/udt:DateTimeString',
            ),
            term('BT-135', 'Ende', 'date', 'cbc:EndDate', 'ram:EndDateTime/udt:DateTimeString'),
          ],
        },
        allowanceGroup(
          'BG-27',
          'Nachlass auf die Position',
          136,
          UBL_ALLOWANCE,
          `ram:SpecifiedLineTradeSettlement/${CII_ALLOWANCE}`,
        ),
        allowanceGroup(
          'BG-28',
          'Zuschlag auf die Position',
          141,
          UBL_CHARGE,
          `ram:SpecifiedLineTradeSettlement/${CII_CHARGE}`,
        ),
        {
          bg: 'BG-29',
          label: 'Preis',
          repeats: false,
          ubl: 'cac:Price',
          cii: 'ram:SpecifiedLineTradeAgreement',
          groups: [],
          terms: [
            term(
              'BT-146',
              'Nettopreis',
              'amount',
              'cbc:PriceAmount',
              'ram:NetPriceProductTradePrice/ram:ChargeAmount',
            ),
            term(
              'BT-147',
              'Rabatt auf den Preis',
              'amount',
              "cac:AllowanceCharge[cbc:ChargeIndicator = 'false' or cbc:ChargeIndicator = '0']/cbc:Amount",
              'ram:GrossPriceProductTradePrice/ram:AppliedTradeAllowanceCharge/ram:ActualAmount',
            ),
            term(
              'BT-148',
              'Bruttopreis',
              'amount',
              "cac:AllowanceCharge[cbc:ChargeIndicator = 'false' or cbc:ChargeIndicator = '0']/cbc:BaseAmount",
              'ram:GrossPriceProductTradePrice/ram:ChargeAmount',
            ),
            // CII: KoSIT reads the base quantity of the gross or the net price; both may be
            // written (EN 16931 requires them equal) — the first in document order counts once.
            term(
              'BT-149',
              'Basismenge',
              'quantity',
              'cbc:BaseQuantity',
              '(ram:GrossPriceProductTradePrice/ram:BasisQuantity | ram:NetPriceProductTradePrice/ram:BasisQuantity)[1]',
            ),
            term(
              'BT-150',
              'Einheit der Basismenge',
              'code',
              'cbc:BaseQuantity/@unitCode',
              '(ram:GrossPriceProductTradePrice/ram:BasisQuantity | ram:NetPriceProductTradePrice/ram:BasisQuantity)[1]/@unitCode',
            ),
          ],
        },
        {
          bg: 'BG-30',
          label: 'Umsatzsteuer der Position',
          repeats: false,
          ubl: 'cac:Item/cac:ClassifiedTaxCategory',
          cii: 'ram:SpecifiedLineTradeSettlement/ram:ApplicableTradeTax',
          groups: [],
          terms: [
            term('BT-151', 'Umsatzsteuerkategorie', 'code', 'cbc:ID', 'ram:CategoryCode'),
            term(
              'BT-152',
              'Umsatzsteuersatz',
              'percent',
              'cbc:Percent',
              'ram:RateApplicablePercent',
            ),
          ],
        },
        {
          bg: 'BG-31',
          label: 'Artikel',
          repeats: false,
          ubl: 'cac:Item',
          cii: 'ram:SpecifiedTradeProduct',
          terms: [
            term('BT-153', 'Bezeichnung', 'text', 'cbc:Name', 'ram:Name'),
            term('BT-154', 'Beschreibung', 'text', 'cbc:Description', 'ram:Description'),
            term(
              'BT-155',
              'Artikelnummer des Verkäufers',
              'id',
              'cac:SellersItemIdentification/cbc:ID',
              'ram:SellerAssignedID',
            ),
            term(
              'BT-156',
              'Artikelnummer des Käufers',
              'id',
              'cac:BuyersItemIdentification/cbc:ID',
              'ram:BuyerAssignedID',
            ),
            term(
              'BT-157',
              'Standardkennung',
              'id',
              'cac:StandardItemIdentification/cbc:ID',
              'ram:GlobalID',
            ),
            term(
              'BT-158',
              'Klassifizierung',
              'code',
              'cac:CommodityClassification/cbc:ItemClassificationCode',
              'ram:DesignatedProductClassification/ram:ClassCode',
            ),
            term(
              'BT-159',
              'Ursprungsland',
              'code',
              'cac:OriginCountry/cbc:IdentificationCode',
              'ram:OriginTradeCountry/ram:ID',
            ),
          ],
          groups: [
            {
              bg: 'BG-32',
              label: 'Artikeleigenschaft',
              repeats: true,
              ubl: 'cac:AdditionalItemProperty',
              cii: 'ram:ApplicableProductCharacteristic',
              groups: [],
              terms: [
                term('BT-160', 'Name', 'text', 'cbc:Name', 'ram:Description'),
                term('BT-161', 'Wert', 'text', 'cbc:Value', 'ram:Value'),
              ],
            },
          ],
        },
      ],
    },
  ],
};

export type SyntaxFamily = 'ubl' | 'ublCreditNote' | 'cii';

/** The path for a syntax: a CreditNote falls back to the Invoice path. */
export function pathFor(def: Paths, family: SyntaxFamily): string | undefined {
  if (family === 'ublCreditNote') return def.ublCreditNote ?? def.ubl;
  return def[family];
}

/** Every term and group definition, depth first. */
export function allDefinitions(group: GroupDef = INVOICE): {
  groups: GroupDef[];
  terms: TermDef[];
} {
  const groups: GroupDef[] = [group];
  const terms: TermDef[] = [...group.terms];
  for (const child of group.groups) {
    const nested = allDefinitions(child);
    groups.push(...nested.groups);
    terms.push(...nested.terms);
  }
  return { groups, terms };
}

/** Label of a term, e.g. for "Unterschiedlich: Rechnungsnummer". */
export function termLabel(bt: string): string {
  return allDefinitions().terms.find((t) => t.bt === bt)?.label ?? bt;
}
