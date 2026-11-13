// The official XSD files, bundled as text (see schemas/README.md for origin and licences).
const raw = import.meta.glob('../../schemas/**/*.xsd', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Schema text by path below `schemas/`, e.g. `cii-d16b/CrossIndustryInvoice_100pD16B.xsd`. */
export const SCHEMA_FILES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace(/^.*\/schemas\//, ''), text]),
);

export const SCHEMA_ENTRIES = {
  ublInvoice: 'ubl-2.1/maindoc/UBL-Invoice-2.1.xsd',
  ublCreditNote: 'ubl-2.1/maindoc/UBL-CreditNote-2.1.xsd',
  ciiD16B: 'cii-d16b/CrossIndustryInvoice_100pD16B.xsd',
} as const;
