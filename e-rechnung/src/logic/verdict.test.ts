import type { Analysis, InvoicePart } from './analysis';
import { invoiceDetails } from './details';
import { TEXTS } from './texts';
import { differingTerms, verdictOf } from './verdict';

const part = (overrides: Partial<InvoicePart['header']> = {}, origin = 'a.xml'): InvoicePart => ({
  origin,
  syntax: 'cii',
  header: {
    'BT-1': ['R-1'],
    'BT-2': ['20261113'],
    'BT-3': ['380'],
    'BT-5': ['EUR'],
    'BT-24': ['urn:cen.eu:en16931:2017'],
    'BT-27': ['Muster GmbH'],
    'BT-112': ['119.00'],
    ...overrides,
  },
});

const analysis = (over: Partial<Analysis>): Analysis => ({
  fileName: 'r.pdf',
  kind: 'pdf',
  invoices: [],
  others: [],
  ...over,
});

describe('verdictOf', () => {
  it('never says ordnungsgemäß or gültig in any text', () => {
    const all = JSON.stringify(TEXTS);
    expect(all).not.toMatch(/ordnungsgem|gültig/i);
  });

  it('shows the fixed notice with the Kanzlei hint', () => {
    expect(TEXTS.fixedNotice).toContain('keine steuerliche Prüfung');
    expect(TEXTS.fixedNotice).toContain('Maßgeblich sind die Daten in der XML');
  });

  it('every file problem has a headline and a tone', () => {
    for (const kind of Object.keys(TEXTS.fileProblems) as (keyof typeof TEXTS.fileProblems)[]) {
      const verdict = verdictOf(analysis({ problem: { kind, problems: [] } }));
      expect(verdict.headline.length).toBeGreaterThan(0);
      expect(['ok', 'warn', 'bad']).toContain(verdict.tone);
      expect(verdict.tone).not.toBe('ok');
    }
  });

  it('adds the line of the first problem', () => {
    const verdict = verdictOf(
      analysis({
        kind: 'xml',
        problem: { kind: 'xmlBroken', problems: [{ message: 'Ende fehlt', line: 7 }] },
      }),
    );
    expect(verdict.explanation).toContain('Zeile 7: Ende fehlt');
  });

  it('uses the attachment name for a hybrid PDF and XML wording for an XML file', () => {
    const pdf = verdictOf(analysis({ invoices: [part({}, 'factur-x.xml')] }));
    expect(pdf.explanation[0]).toContain('factur-x.xml');
    const file = verdictOf(analysis({ kind: 'xml', invoices: [part()] }));
    expect(file.explanation).toEqual([TEXTS.xmlFile]);
  });

  it('lists the unreadable attachments of a PDF without invoice data', () => {
    const verdict = verdictOf(
      analysis({ pdf: { pages: 1, unreadable: ['kaputt.xml'], truncated: false } }),
    );
    expect(verdict.headline).toBe(TEXTS.pdfWithoutInvoiceData);
    expect(verdict.explanation[0]).toContain('kaputt.xml');
  });
});

describe('differingTerms', () => {
  it('compares dates across formats and amounts by value', () => {
    const ubl = part({ 'BT-2': ['2026-11-13'], 'BT-112': ['119'] }, 'x.xml');
    expect(differingTerms([part(), ubl])).toEqual([]);
  });

  it('ignores case and spacing of the supplier name', () => {
    expect(differingTerms([part(), part({ 'BT-27': ['MUSTER   gmbh'] })])).toEqual([]);
  });

  it('names every differing term', () => {
    const other = part({ 'BT-1': ['R-2'], 'BT-5': ['CHF'], 'BT-112': ['119.01'] });
    expect(differingTerms([part(), other])).toEqual(['BT-1', 'BT-5', 'BT-112']);
  });
});

describe('invoiceDetails', () => {
  it('formats date, amount and type code for German readers', () => {
    const verdict = verdictOf(analysis({ invoices: [part({ 'BT-3': ['389'] })] }));
    const invoice = verdict.invoices[0];
    if (!invoice) throw new Error('no invoice');
    const rows = Object.fromEntries(invoiceDetails(invoice, true).map((r) => [r.label, r.value]));
    expect(rows['Anhang']).toBe('a.xml');
    expect(rows['Rechnungsdatum (BT-2)']).toBe('13.11.2026');
    expect(rows['Betrag brutto (BT-112)']).toBe('119,00 EUR');
    expect(rows['Art der Rechnung (BT-3)']).toBe(
      '389 – Gutschrift (vom Leistungsempfänger ausgestellt)',
    );
  });

  it('shows missing values and keeps unreadable values as written', () => {
    const verdict = verdictOf(
      analysis({
        invoices: [part({ 'BT-1': [], 'BT-2': ['13.11.2026'], 'BT-112': ['1.000,00'] })],
      }),
    );
    const invoice = verdict.invoices[0];
    if (!invoice) throw new Error('no invoice');
    const rows = Object.fromEntries(invoiceDetails(invoice, false).map((r) => [r.label, r.value]));
    expect(rows['Rechnungsnummer (BT-1)']).toBe('– (fehlt)');
    expect(rows['Rechnungsdatum (BT-2)']).toBe('13.11.2026');
    expect(rows['Betrag brutto (BT-112)']).toBe('1.000,00');
  });
});
