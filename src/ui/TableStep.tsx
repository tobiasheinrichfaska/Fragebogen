// Interview step for a table (repeat group): one small card per row ("Kind 1", "Kind 2", …), add
// and remove rows, every cell typed like a normal answer. "Weiter" checks the whole table first and
// points at the cell that is wrong; required cells must be filled or the row removed.
import { useState } from 'react';
import { editValue } from '../logic/display';
import type { InterviewStep } from '../logic/interview';
import { ISSUE_MESSAGES } from '../logic/issues';
import type { FieldDefinition, FieldValue } from '../logic/model';
import { missingCells, nextRowId, normalizeRows, ROW_ID_KEY } from '../logic/normalize';
import { currentPart } from '../logic/questionnaire';
import {
  answer,
  defer,
  nextChoice,
  nextStep,
  previousStep,
  skipToMissing,
  stepsFor,
  type Session,
} from '../logic/session';
import { Card, Explainer } from './common';
import { isTextLike } from './fieldKinds';
import { FieldInput } from './FieldInput';

interface Row {
  rowId: string;
  cells: Record<string, unknown>;
}

interface Props {
  session: Session;
  field: FieldDefinition;
  step: Extract<InterviewStep, { kind: 'question' }>;
  onSession: (session: Session) => void;
}

function rowsOf(field: FieldDefinition, value: FieldValue | undefined): Row[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
    const cells = Object.fromEntries(
      (field.columns ?? []).map((column) => [
        column.id,
        isTextLike(column) ? editValue(column, row[column.id]) : (row[column.id] ?? null),
      ]),
    );
    return [{ rowId: String(row[ROW_ID_KEY]), cells }];
  });
}

export function TableStep({ session, field, step, onSession }: Props) {
  const part =
    session.role === undefined ? undefined : currentPart(session.questionnaire, session.role);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(field, part?.data[field.id]));
  const [error, setError] = useState<{ row?: number; column?: string; text: string } | undefined>();
  const columns = field.columns ?? [];
  const label = field.rowLabel ?? 'Zeile';

  const raw = () =>
    rows.map((row) => ({
      [ROW_ID_KEY]: row.rowId,
      ...Object.fromEntries(
        columns.map((column) => {
          const cell = row.cells[column.id];
          return [
            column.id,
            typeof cell === 'string' && cell.trim() === '' ? null : (cell ?? null),
          ];
        }),
      ),
    }));

  const update = (index: number, column: string, cell: unknown) => {
    setRows(
      rows.map((row, i) =>
        i === index ? { ...row, cells: { ...row.cells, [column]: cell } } : row,
      ),
    );
    setError(undefined);
  };

  const leave = (move: (s: Session) => Session) => {
    const check = normalizeRows(field, raw());
    if (!check.ok) {
      setError({
        ...(check.row === undefined ? {} : { row: check.row }),
        ...(check.column === undefined ? {} : { column: check.column }),
        text: ISSUE_MESSAGES[check.issue],
      });
      return;
    }
    const gaps = missingCells(field, check.value);
    const firstGap = gaps[0];
    if (firstGap) {
      const index = rows.findIndex((row) => row.rowId === firstGap.rowId);
      setError({
        row: index,
        column: firstGap.column,
        text: 'Bitte ausfüllen oder die Zeile entfernen.',
      });
      return;
    }
    const result = answer(session, field.id, raw());
    if (!result.ok) {
      setError({ text: result.message });
      return;
    }
    onSession(move(result.session));
  };
  const next = () => leave(nextStep);
  const choice = nextChoice(session);

  const first = stepsFor(session)[0]?.key === session.stepKey;
  return (
    <Card>
      <div className="question">
        <h2 id={`field-${field.id}-label`}>
          {field.question ?? field.label}
          {step.required ? '' : <span className="muted"> (freiwillig)</span>}
        </h2>
        {field.help !== undefined && <p className="help">{field.help}</p>}
        <Explainer path={field.explainer} />
        {rows.length === 0 && <p className="muted">Noch keine Einträge.</p>}
        {rows.map((row, index) => (
          <fieldset key={row.rowId} className="table-row">
            <legend>
              {label} {index + 1}
            </legend>
            {columns.map((column) => {
              const id = `field-${field.id}-${row.rowId}-${column.id}`;
              const cell = row.cells[column.id];
              return (
                <div key={column.id} className="table-cell">
                  <span id={`${id}-label`} className="cell-label">
                    {column.question ?? column.label}
                    {column.required ? '' : ' (freiwillig)'}
                  </span>
                  <FieldInput
                    field={column}
                    id={id}
                    value={cell as FieldValue}
                    text={typeof cell === 'string' ? cell : ''}
                    onText={(text) => update(index, column.id, text)}
                    onChoose={(value) => update(index, column.id, value)}
                    onSubmit={next}
                  />
                  {error?.row === index && error.column === column.id && (
                    <p className="field-error" role="alert">
                      {error.text}
                    </p>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="link"
              onClick={() => {
                setRows(rows.filter((_, i) => i !== index));
                setError(undefined);
              }}
            >
              {label} {index + 1} entfernen
            </button>
          </fieldset>
        ))}
        {rows.length < 30 && (
          <button
            type="button"
            onClick={() => setRows([...rows, { rowId: nextRowId(rows), cells: {} }])}
          >
            {rows.length === 0
              ? `${label} hinzufügen`
              : `Weitere Zeile: ${label} ${rows.length + 1}`}
          </button>
        )}
        {error && error.column === undefined && (
          <p className="field-error" role="alert">
            {error.text}
          </p>
        )}
      </div>
      <div className="nav">
        <button type="button" disabled={first} onClick={() => onSession(previousStep(session))}>
          Zurück
        </button>
        <button
          type="button"
          className="primary"
          disabled={step.required && rows.length === 0 && step.state !== 'deferred'}
          onClick={next}
        >
          {choice.backToSummary ? 'Zurück zur Zusammenfassung' : 'Weiter'}
        </button>
        {choice.skip && (
          <button
            type="button"
            disabled={step.required && rows.length === 0 && step.state !== 'deferred'}
            onClick={() => leave(skipToMissing)}
          >
            {choice.skip.kind === 'summary'
              ? 'Zur Zusammenfassung'
              : 'Zur nächsten fehlenden Angabe'}
          </button>
        )}
      </div>
      {rows.length === 0 && (
        <p className="defer">
          <button
            type="button"
            className="link"
            onClick={() => {
              const result = defer(session, field.id);
              if (result.ok) onSession(nextStep(result.session));
              else setError({ text: result.message });
            }}
          >
            Weiß ich gerade nicht – später beantworten
          </button>
        </p>
      )}
    </Card>
  );
}
