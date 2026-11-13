import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdfAttachments, type PdfJsLike } from '../../src/io/pdf';
import { miniPdf } from '../support/minipdf';

const lib = pdfjs as unknown as PdfJsLike;
const enc = (text: string) => new TextEncoder().encode(text);

describe('readPdfAttachments', () => {
  it('reads a plain PDF without attachments', async () => {
    const result = await readPdfAttachments(lib, miniPdf({ text: 'Rechnung' }));
    expect(result).toEqual({
      ok: true,
      pages: 1,
      attachments: [],
      unreadable: [],
      truncated: false,
    });
  });

  it('reads every embedded file with its name and bytes', async () => {
    const xml = enc('<?xml version="1.0"?><a/>');
    const result = await readPdfAttachments(
      lib,
      miniPdf({
        attachments: [
          { name: 'factur-x.xml', bytes: xml, mime: 'text/xml', relationship: 'Alternative' },
          { name: 'Lieferschein.txt', bytes: enc('Lieferschein'), description: 'Anlage' },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.attachments.map((a) => a.name).sort()).toEqual([
      'Lieferschein.txt',
      'factur-x.xml',
    ]);
    const invoice = result.attachments.find((a) => a.name === 'factur-x.xml');
    expect(new TextDecoder().decode(invoice?.bytes)).toBe('<?xml version="1.0"?><a/>');
  });

  it('reports a file that is no PDF as damaged', async () => {
    const result = await readPdfAttachments(lib, enc('%PDF-1.7\nnonsense'));
    expect(result).toMatchObject({ ok: false, issue: 'damaged' });
  });
});
