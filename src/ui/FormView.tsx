// Form view for the Kanzlei (read only): every section with its answers, who answered, and which
// signature covers them — a footnote marks a value changed in a later version of its role.
import { displayValue } from '../logic/display';
import type { FormDefinition, Questionnaire } from '../logic/model';
import { signatureLayout } from '../logic/provenance';
import { formatLocalDateTime } from '../logic/time';
import { FormScope } from './common';

const STATUS_TEXT = {
  signed: 'unterschrieben',
  sealed: 'abgeschlossen',
  draft: 'Entwurf',
} as const;

export function FormView({
  questionnaire,
  definition,
}: {
  questionnaire: Questionnaire;
  definition: FormDefinition;
}) {
  const layout = signatureLayout(questionnaire, definition);
  const provenance = new Map(layout.fields.map((field) => [field.fieldId, field]));
  const roleLabel = (id: string) => definition.roles.find((role) => role.id === id)?.label ?? id;
  return (
    <div className="form-view">
      <FormScope definition={definition} />
      {definition.sections.map((section) => {
        const answered = section.fields.filter((field) => provenance.has(field.id));
        if (answered.length === 0) return null;
        return (
          <section key={section.id}>
            <h3>{section.title}</h3>
            <dl>
              {answered.map((field) => {
                const item = provenance.get(field.id);
                return (
                  <div key={field.id} className={`summary-row owner-${field.role}`}>
                    <dt>{field.label}</dt>
                    <dd>
                      {displayValue(field, item?.value)}
                      {item?.footnote !== undefined && <sup> ({item.footnote})</sup>}
                    </dd>
                    <dd className="muted">{roleLabel(field.role)}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
      <h3>Unterschriften und Abschlüsse</h3>
      <ol className="signature-lines">
        {layout.lines.map((line) => (
          <li key={line.number} value={line.number}>
            {line.roleLabel}, Fassung {line.version}: {STATUS_TEXT[line.status]} am{' '}
            {formatLocalDateTime(line.signedAtLocal)}
            {line.signerName ? ` von ${line.signerName}` : ''}
            {line.method === 'typed' ? ' (getippter Name)' : ''}
            {line.current ? '' : ' – ältere Fassung'}
          </li>
        ))}
      </ol>
      {questionnaire.receipts.length > 0 && (
        <>
          <h3>Eingangsvermerke</h3>
          <ul>
            {questionnaire.receipts.map((receipt) => (
              <li key={`${receipt.fileSha256}-${receipt.receivedAtUtc}`}>
                {receipt.station} ({receipt.source === 'datev' ? 'DATEV-Ablage' : 'App'}):{' '}
                {formatLocalDateTime(receipt.receivedAtLocal)}, Datei {receipt.fileName} –{' '}
                {receipt.parts.map((p) => roleLabel(p.role)).join(', ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
