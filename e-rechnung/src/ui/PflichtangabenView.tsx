import { sentence } from '../logic/check';
import type { GroupDisplay, PflichtResult, RowResult, Status } from '../logic/check';
import { TEXTS, fill } from '../logic/texts';

const STATUS_TEXT: Readonly<Record<Status, string>> = {
  vorhanden: TEXTS.statusVorhanden,
  fehlt: TEXTS.statusFehlt,
  einzelfall: TEXTS.statusEinzelfall,
};

function GroupValues({ display }: { display: GroupDisplay }) {
  if (display.items.length === 0) return null;
  if (display.group === 'BG-25') {
    return (
      <details className="positions">
        <summary>{fill(TEXTS.showPositions, { count: display.items.length })}</summary>
        <ol>
          {display.items.map((items, index) => (
            <li key={index}>{items.map((v) => `${v.label}: ${v.value}`).join(' · ')}</li>
          ))}
        </ol>
      </details>
    );
  }
  return (
    <ul className="occurrences">
      {display.items.map((items, index) => (
        <li key={index}>{items.map((v) => `${v.label}: ${v.value}`).join(' · ')}</li>
      ))}
    </ul>
  );
}

function Row({ result }: { result: RowResult }) {
  const hasValues = result.values.length > 0 || result.groups.some((g) => g.items.length > 0);
  return (
    <tr data-testid={`pflicht-${result.row.id}`} className={`status-${result.status}`}>
      <td>
        {result.row.label}
        <br />
        <small className="norm">{result.row.norm}</small>
      </td>
      <td>
        {result.values.map((v, i) => (
          <div key={i}>
            <span className="value-label">{v.label}:</span> {v.value}
          </div>
        ))}
        {result.groups.map((g) => (
          <GroupValues key={g.group} display={g} />
        ))}
        {!hasValues && <span className="muted">{TEXTS.notInXml}</span>}
        {result.missing.length > 0 && (
          <div className="missing">
            {sentence(fill(TEXTS.missingList, { list: result.missing.join('; ') }))}
          </div>
        )}
        {result.reason && <div className="muted">{result.reason}</div>}
      </td>
      <td>
        <span className={`badge badge-${result.status}`} data-testid="status">
          {STATUS_TEXT[result.status]}
        </span>
      </td>
    </tr>
  );
}

function RowsTable({ rows }: { rows: RowResult[] }) {
  return (
    <table className="pflicht-table">
      <thead>
        <tr>
          <th scope="col">Angabe</th>
          <th scope="col">Werte aus der XML</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Row key={r.row.id} result={r} />
        ))}
      </tbody>
    </table>
  );
}

export function PflichtangabenView({ result }: { result: PflichtResult }) {
  const main = result.rows.filter((r) => r.row.section === 'paragraph14');
  const special = result.rows.filter((r) => r.row.section === 'besondere');
  return (
    <section className="pflicht" aria-label={TEXTS.pflichtHeading}>
      <h3>{TEXTS.pflichtHeading}</h3>
      {result.modeText && <p className="mode">{result.modeText}</p>}
      <p
        className={`summary ${result.missingLabels.length > 0 ? 'summary-missing' : 'summary-ok'}`}
        data-testid="pflicht-summary"
      >
        {result.summary}
      </p>
      <RowsTable rows={main} />
      {special.length > 0 && (
        <>
          <h4>{TEXTS.besondereHeading}</h4>
          <RowsTable rows={special} />
        </>
      )}
    </section>
  );
}
