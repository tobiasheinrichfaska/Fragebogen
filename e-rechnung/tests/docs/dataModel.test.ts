import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ENTITIES, RELATIONS, dataModelPage } from '../../src/build/dataModelPage';
import { analyzeFile } from '../../src/io/analyze';
import type { PdfJsLike } from '../../src/io/pdf';
import { verdictOf } from '../../src/logic/verdict';
import { encode, officialText } from '../support/fixtures';
import { miniPdf } from '../support/minipdf';

describe('docs/data-model.html', () => {
  it('is up to date with the source (regenerate with npm run docs)', async () => {
    await expect(dataModelPage()).toMatchFileSnapshot('../../docs/data-model.html');
  });

  it('documents every field the real objects carry', async () => {
    const pdf = miniPdf({
      attachments: [
        { name: 'factur-x.xml', bytes: encode(officialText('cen/CII_example1.xml')) },
        { name: 'a.txt', bytes: encode('x') },
      ],
    });
    const analysis = await analyzeFile('r.pdf', pdf, () =>
      Promise.resolve(pdfjs as unknown as PdfJsLike),
    );
    const verdict = verdictOf(analysis);
    const documented = (name: string) =>
      new Set(ENTITIES.find((e) => e.name.startsWith(name))?.fields.map((f) => f.name));
    const undocumented = (name: string, object: object) =>
      Object.keys(object).filter((key) => !documented(name).has(key));
    expect(undocumented('Analysis', analysis)).toEqual([]);
    expect(undocumented('InvoicePart', analysis.invoices[0] ?? {})).toEqual([]);
    expect(undocumented('OtherPart', analysis.others[0] ?? {})).toEqual([]);
    expect(undocumented('Verdict', verdict)).toEqual([]);
    expect(undocumented('InvoiceVerdict', verdict.invoices[0] ?? {})).toEqual([]);
    expect(undocumented('ModelGroup', analysis.invoices[0]?.model ?? {})).toEqual([]);
  });

  it('names only documented entities in the relationship table', () => {
    const names = new Set(ENTITIES.map((e) => e.name.split(' ')[0]));
    const fixed = ['SyntaxEntry (SYNTAXES)', 'GroupDef (binding)', 'ProfileEntry (PROFILES)'];
    for (const [from, , to] of RELATIONS) {
      expect(names.has(from)).toBe(true);
      expect(names.has(to) || fixed.includes(to)).toBe(true);
    }
  });

  it('is self-contained: no script, no external resource', () => {
    const html = dataModelPage();
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/(src|href)="https?:/i);
  });
});
