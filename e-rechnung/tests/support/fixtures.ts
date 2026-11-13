import { readFileSync } from 'node:fs';

const OFFICIAL = new URL('../fixtures/offiziell/', import.meta.url);

/** Bytes of an official test file, e.g. `cen/CII_example1.xml`. */
export function official(path: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(path, OFFICIAL)));
}

export function officialText(path: string): string {
  return new TextDecoder().decode(official(path));
}

export const encode = (text: string) => new TextEncoder().encode(text);

/** Replaces the specification identifier (BT-24) of a CII or UBL text. */
export function withSpecId(xml: string, id: string): string {
  const cii = /(<ram:GuidelineSpecifiedDocumentContextParameter>\s*<ram:ID>)[^<]*(<\/ram:ID>)/;
  const ubl = /(<cbc:CustomizationID>)[^<]*(<\/cbc:CustomizationID>)/;
  const pattern = cii.test(xml) ? cii : ubl;
  if (!pattern.test(xml)) throw new Error('No BT-24 element found');
  return xml.replace(pattern, `$1${id}$2`);
}

/** Replaces the invoice number (BT-1) of a CII or UBL text. */
export function withInvoiceNumber(xml: string, number: string): string {
  const cii = /(<rsm:ExchangedDocument>\s*<ram:ID>)[^<]*(<\/ram:ID>)/;
  const ubl = /(<\/cbc:CustomizationID>[\s\S]*?<cbc:ID>)[^<]*(<\/cbc:ID>)/;
  const pattern = cii.test(xml) ? cii : ubl;
  if (!pattern.test(xml)) throw new Error('No BT-1 element found');
  return xml.replace(pattern, `$1${number}$2`);
}
