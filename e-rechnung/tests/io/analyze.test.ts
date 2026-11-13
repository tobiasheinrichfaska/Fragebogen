import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { analyzeFile, fileKindOf } from '../../src/io/analyze';
import type { PdfJsLike } from '../../src/io/pdf';
import { verdictOf } from '../../src/logic/verdict';
import { encode, official, officialText, withInvoiceNumber, withSpecId } from '../support/fixtures';
import { miniPdf } from '../support/minipdf';
import type { Attachment } from '../support/minipdf';

const load = () => Promise.resolve(pdfjs as unknown as PdfJsLike);
const check = async (name: string, bytes: Uint8Array) => {
  const analysis = await analyzeFile(name, bytes, load);
  return { analysis, verdict: verdictOf(analysis) };
};
const xml = (name: string, text: string): Attachment => ({
  name,
  bytes: encode(text),
  mime: 'text/xml',
  relationship: 'Alternative',
});

const CII = officialText('cen/CII_example1.xml');
const XR_UBL = 'kosit/01.01a-INVOICE_ubl.xml';
const XR_CII = 'kosit/01.01a-INVOICE_uncefact.xml';

describe('file kind by content', () => {
  it('tells PDF, XML and other files apart regardless of the name', () => {
    expect(fileKindOf(miniPdf())).toBe('pdf');
    expect(fileKindOf(encode(CII))).toBe('xml');
    expect(fileKindOf(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe('unknown');
  });
});

describe('XML files', () => {
  it.each([
    ['cen/CII_example1.xml', 'cii', 'E-Rechnung erkannt (EN 16931'],
    ['cen/UBL_ubl-tc434-example1.xml', 'ubl-invoice', 'E-Rechnung erkannt (EN 16931'],
    ['cen/UBL_ubl-tc434-creditnote1.xml', 'ubl-creditnote', 'E-Rechnung erkannt (EN 16931'],
    [XR_UBL, 'ubl-invoice', 'E-Rechnung erkannt (XRechnung 3.0)'],
    [XR_CII, 'cii', 'E-Rechnung erkannt (XRechnung 3.0)'],
    [
      'kosit/04.01a-INVOICE_ubl.xml',
      'ubl-invoice',
      'E-Rechnung erkannt (XRechnung 3.0 mit Extension)',
    ],
    ['kosit/02.01a-cvd_INVOICE_ubl.xml', 'ubl-invoice', 'E-Rechnung erkannt (XRechnung 3.0 (CVD))'],
  ])('%s is recognised as %s', async (path, syntax, headline) => {
    const { analysis, verdict } = await check(path, official(path));
    expect(analysis.invoices.map((i) => i.syntax)).toEqual([syntax]);
    expect(verdict.tone).toBe('ok');
    expect(verdict.headline.startsWith(headline)).toBe(true);
  });

  it('reads the header values of the official XRechnung example', async () => {
    const { analysis } = await check('x.xml', official(XR_UBL));
    expect(analysis.invoices[0]?.header['BT-1']).toEqual(['123456XX']);
    expect(analysis.invoices[0]?.header['BT-2']).toEqual(['2016-04-04']);
  });

  it('names the profiles MINIMUM and BASIC WL as no e-invoice', async () => {
    const minimum = await check('m.xml', encode(withSpecId(CII, 'urn:factur-x.eu:1p0:minimum')));
    expect(minimum.verdict.tone).toBe('bad');
    expect(minimum.verdict.headline).toBe(
      'Rechnungsdaten im Profil MINIMUM: keine E-Rechnung im Sinne des UStG',
    );
    const basicWl = await check('b.xml', encode(withSpecId(CII, 'urn:factur-x.eu:1p0:basicwl')));
    expect(basicWl.verdict.headline).toContain('Profil BASIC WL: keine E-Rechnung');
  });

  it('does not judge an unknown or missing specification identifier', async () => {
    const unknown = await check('u.xml', encode(withSpecId(CII, 'urn:example:unbekannt')));
    expect(unknown.verdict.tone).toBe('warn');
    expect(unknown.verdict.headline).toBe(
      'Rechnungsdaten erkannt, Spezifikation unbekannt: nicht beurteilt',
    );
    expect(unknown.verdict.explanation.join(' ')).toContain('urn:example:unbekannt');
    const missing = await check('m.xml', encode(withSpecId(CII, '')));
    expect(missing.verdict.explanation.join(' ')).toContain('fehlt');
  });

  it('treats the ZUGFeRD 1.0 identifier in an official CEN example as ZUGFeRD 1.0', async () => {
    const { verdict } = await check('z.xml', official('cen/CII_business_example_02.xml'));
    expect(verdict.tone).toBe('bad');
    expect(verdict.explanation.join(' ')).toContain('erst ab Version 2.0.1');
  });

  it('recognises a ZUGFeRD 1.0 document by its namespace', async () => {
    const zugferd1 = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryDocument xmlns:rsm="urn:ferd:CrossIndustryDocument:invoice:1p0"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:12">
  <rsm:SpecifiedExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter>
    <ram:ID>urn:ferd:CrossIndustryDocument:invoice:1p0:comfort</ram:ID>
  </ram:GuidelineSpecifiedDocumentContextParameter></rsm:SpecifiedExchangedDocumentContext>
</rsm:CrossIndustryDocument>`;
    const { analysis, verdict } = await check('zugferd-invoice.xml', encode(zugferd1));
    expect(analysis.invoices[0]?.syntax).toBe('zugferd1');
    expect(verdict.headline).toBe(
      'Rechnungsdaten im Profil ZUGFeRD 1.0: keine E-Rechnung im Sinne des UStG',
    );
  });

  it('names an XML without a known invoice syntax and does not call it no e-invoice', async () => {
    const { verdict } = await check('order.xml', encode('<Order xmlns="urn:example:order"/>'));
    expect(verdict.headline).toBe('XML-Datei ohne bekanntes Rechnungsformat');
    expect(verdict.explanation.join(' ')).toContain('urn:example:order');
    expect(verdict.explanation.join(' ')).toContain('vereinbart');
  });

  it('refuses a DOCTYPE and reports broken XML with its line', async () => {
    const doctype = await check('d.xml', encode('<!DOCTYPE x [<!ENTITY a "b">]><x>&a;</x>'));
    expect(doctype.analysis.problem?.kind).toBe('xmlDoctype');
    const broken = await check('b.xml', encode('<?xml version="1.0"?>\n<a>\n<b></a>'));
    expect(broken.verdict.headline).toBe('Die XML-Datei ist fehlerhaft');
    expect(broken.verdict.explanation.join(' ')).toMatch(/Rn\. 6a/);
    expect(broken.verdict.explanation.join(' ')).toMatch(/Zeile \d+:/);
  });
});

describe('PDF files', () => {
  it('calls a PDF without attachments a plain PDF', async () => {
    const { verdict } = await check('r.pdf', miniPdf({ text: 'Rechnung 4711' }));
    expect(verdict.headline).toBe('Keine E-Rechnung: einfaches PDF');
  });

  it('recognises a hybrid PDF by the content of its attachment, not by the name', async () => {
    const { analysis, verdict } = await check(
      'r.pdf',
      miniPdf({ attachments: [xml('irgendwas.dat', CII)] }),
    );
    expect(analysis.invoices[0]?.origin).toBe('irgendwas.dat');
    expect(verdict.tone).toBe('ok');
    expect(verdict.explanation[0]).toContain('irgendwas.dat');
  });

  it('names MINIMUM inside a PDF as in the hand-over', async () => {
    const pdf = miniPdf({
      attachments: [xml('factur-x.xml', withSpecId(CII, 'urn:factur-x.eu:1p0:minimum'))],
    });
    const { verdict } = await check('r.pdf', pdf);
    expect(verdict.headline).toBe(
      'PDF mit Rechnungsdaten, Profil MINIMUM: keine E-Rechnung im Sinne des UStG',
    );
  });

  it('lists foreign attachments and finds no invoice data', async () => {
    const pdf = miniPdf({
      attachments: [
        { name: 'Lieferschein.txt', bytes: encode('Lieferschein') },
        xml('bestellung.xml', '<Order xmlns="urn:example:order"/>'),
      ],
    });
    const { analysis, verdict } = await check('r.pdf', pdf);
    expect(verdict.headline).toBe('Keine E-Rechnung: PDF ohne Rechnungsdaten');
    expect(analysis.others.map((o) => o.kind).sort()).toEqual(['notXml', 'otherXml']);
  });

  it('keeps the invoice when other attachments are present', async () => {
    const pdf = miniPdf({
      attachments: [
        xml('xrechnung.xml', officialText(XR_UBL)),
        { name: 'a.txt', bytes: encode('x') },
      ],
    });
    const { verdict } = await check('r.pdf', pdf);
    expect(verdict.headline).toBe('E-Rechnung erkannt (XRechnung 3.0)');
  });

  it('reports a broken XML attachment as a format error', async () => {
    const pdf = miniPdf({ attachments: [xml('factur-x.xml', '<?xml version="1.0"?><a><b></a>')] });
    const { verdict } = await check('r.pdf', pdf);
    expect(verdict.headline).toBe('PDF mit fehlerhafter XML');
    expect(verdict.explanation.join(' ')).toContain('Rn. 6a');
  });

  it('sees the same invoice in UBL and CII as one invoice embedded twice', async () => {
    const pdf = miniPdf({
      attachments: [
        xml('xrechnung.xml', officialText(XR_UBL)),
        xml('factur-x.xml', officialText(XR_CII)),
      ],
    });
    const { verdict } = await check('r.pdf', pdf);
    expect(verdict.comparison).toEqual({ same: true, differing: [] });
    expect(verdict.tone).toBe('warn');
    expect(verdict.headline).toBe('E-Rechnung erkannt (XRechnung 3.0)');
    expect(verdict.explanation.join(' ')).toContain('2-mal eingebettet');
  });

  it('never picks one of two different invoices', async () => {
    const pdf = miniPdf({
      attachments: [xml('a.xml', CII), xml('b.xml', withInvoiceNumber(CII, 'ANDERE-NR'))],
    });
    const { verdict } = await check('r.pdf', pdf);
    expect(verdict.headline).toBe('Mögliche Auffälligkeit: widersprüchliche Rechnungsdaten im PDF');
    expect(verdict.comparison).toEqual({ same: false, differing: ['BT-1'] });
    expect(verdict.invoices).toHaveLength(2);
  });

  it('reports a password-protected PDF', async () => {
    const { verdict } = await check('r.pdf', miniPdf({ passwordProtected: true }));
    expect(verdict.headline).toBe('Das PDF ist mit einem Kennwort geschützt');
  });

  it('reports a damaged PDF', async () => {
    const { verdict } = await check('r.pdf', encode('%PDF-1.7\nnichts'));
    expect(verdict.headline).toBe('Das PDF lässt sich nicht lesen');
  });

  it('refuses a too large PDF before reading it', async () => {
    const big = new Uint8Array(31 * 1024 * 1024);
    big.set(encode('%PDF-1.7'));
    const { verdict } = await check('r.pdf', big);
    expect(verdict.headline).toBe('Die Datei ist zu groß');
  });
});

describe('other files', () => {
  it('names empty and unsupported files', async () => {
    expect((await check('leer.pdf', new Uint8Array())).verdict.headline).toBe('Die Datei ist leer');
    const png = await check('bild.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    expect(png.verdict.headline).toBe('Diese Dateiart prüft das Tool nicht');
  });
});
