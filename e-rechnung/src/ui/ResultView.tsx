import type { Analysis } from '../logic/analysis';
import { termLabel } from '../logic/binding';
import { checkPflichtangaben } from '../logic/check';
import { invoiceDetails } from '../logic/details';
import { TEXTS } from '../logic/texts';
import type { Verdict } from '../logic/verdict';
import { PflichtangabenView } from './PflichtangabenView';

interface Props {
  analysis: Analysis;
  verdict: Verdict;
}

const OTHER_KIND: Readonly<Record<string, string>> = {
  notXml: 'keine XML',
  otherXml: 'XML, aber keine Rechnung',
  brokenXml: 'XML, fehlerhaft',
  doctypeXml: 'XML mit DOCTYPE, nicht gelesen',
};

export function ResultView({ analysis, verdict }: Props) {
  const inPdf = analysis.kind === 'pdf';

  return (
    <section className="result" aria-live="polite">
      <div className={`verdict tone-${verdict.tone}`} data-testid="verdict">
        <h2 data-testid="headline">{verdict.headline}</h2>
        {verdict.explanation.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {verdict.comparison && !verdict.comparison.same && (
          <p data-testid="differing">
            Unterschiedlich: {verdict.comparison.differing.map(termLabel).join(', ')}.
          </p>
        )}
      </div>

      {verdict.invoices.map((invoice, index) => (
        <div className="card" key={`${invoice.part.origin}-${index}`}>
          {verdict.invoices.length > 1 && (
            <h3>
              Rechnungsdaten {index + 1} von {verdict.invoices.length}
            </h3>
          )}
          <table className="details">
            <tbody>
              {invoiceDetails(invoice, inPdf).map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoice.part.model ? (
            <PflichtangabenView result={checkPflichtangaben(invoice.part.model)} />
          ) : (
            <p className="muted">{TEXTS.noModel}</p>
          )}
        </div>
      ))}

      {inPdf && analysis.others.length > 0 && (
        <div className="card">
          <h3>Weitere Anhänge im PDF</h3>
          <ul>
            {analysis.others.map((other) => (
              <li key={other.origin}>
                {other.origin} – {OTHER_KIND[other.kind] ?? other.kind}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.pdf?.truncated && (
        <p className="hint">
          Das PDF hat sehr viele Anhänge. Das Tool hat nur die ersten 50 gelesen.
        </p>
      )}
    </section>
  );
}
