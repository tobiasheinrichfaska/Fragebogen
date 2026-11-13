// The detail rows shown under the result for one invoice XML: label and display value, already
// formatted for German readers. The raw value stays visible where formatting could hide it.
import { germanDate, isoDate } from './dates';
import { formatAmount, parseDecimal } from './decimal';
import { first } from './model';
import { TYPE_CODES } from './texts';
import type { InvoiceVerdict } from './verdict';

export interface DetailRow {
  label: string;
  value: string;
}

const MISSING = '– (fehlt)';

export function invoiceDetails(invoice: InvoiceVerdict, inPdf: boolean): DetailRow[] {
  const h = invoice.part.header;
  const date = first(h, 'BT-2');
  const iso = isoDate(date);
  const type = first(h, 'BT-3');
  const amount = first(h, 'BT-112');
  const parsed = parseDecimal(amount);
  const currency = first(h, 'BT-5');
  return [
    { label: inPdf ? 'Anhang' : 'Datei', value: invoice.part.origin },
    { label: 'Syntax', value: invoice.syntaxLabel },
    { label: 'Spezifikation', value: invoice.specLabel },
    { label: 'Kennung (BT-24)', value: invoice.profile.id ?? MISSING },
    {
      label: 'Art der Rechnung (BT-3)',
      value: type ? `${type}${TYPE_CODES[type] ? ` – ${TYPE_CODES[type]}` : ''}` : MISSING,
    },
    { label: 'Rechnungsnummer (BT-1)', value: first(h, 'BT-1') ?? MISSING },
    {
      label: 'Rechnungsdatum (BT-2)',
      value: iso ? germanDate(iso) : (date ?? MISSING),
    },
    { label: 'Lieferant (BT-27)', value: first(h, 'BT-27') ?? MISSING },
    {
      label: 'Betrag brutto (BT-112)',
      value: parsed
        ? `${formatAmount(parsed)}${currency ? ` ${currency}` : ''}`
        : (amount ?? MISSING),
    },
  ];
}
