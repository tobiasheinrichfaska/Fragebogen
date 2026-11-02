// Interview step for a table (repeat group): one small card per row ("Kind 1", "Kind 2", …), add
// and remove rows, every cell typed like a normal answer. "Weiter" checks the whole table first and
// points at the cell that is wrong; required cells must be filled or the row removed. A further page
// of the table (Tobias 2026-11-01: Urlaub und Krankheit je Person) shows its own columns for the rows
// of the first page and adds or removes none; a column whose row condition does not hold is not
// shown, and last month's value (carryFrom) is shown, never typed.
import { useState } from 'react';
import { displayValue, editValue } from '../logic/display';
import { pageColumns, type InterviewStep } from '../logic/interview';
import { ISSUE_MESSAGES } from '../logic/issues';
import type { FieldDefinition, FieldValue } from '../logic/model';
import {
  columnShown,
  missingCells,
  nextRowId,
  normalizeFieldValue,
  normalizeRows,
  ROW_ID_KEY,
} from '../logic/normalize';
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

/** A cell as stored, for row conditions and read-only display (typed text normalised). */
function storedCell(column: FieldDefinition, cell: unknown): FieldValue {
  if (typeof cell === 'string' && cell.trim() === '') return null;
  const checked = normalizeFieldValue(column, cell ?? null);
  return checked.ok ? checked.value : null;
}

function storedCells(field: FieldDefinition, row: Row): Record<string, FieldValue> {
  return Object.fromEntries(
    (field.columns ?? []).map((column) => [column.id, storedCell(column, row.cells[column.id])]),
  );
}

export function TableStep({ session, field, step, onSession }: Props) {
  const part =
    session.role === undefined ? undefined : currentPart(session.questionnaire, session.role);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(field, part?.data[field.id]));
  const [error, setError] = useState<{ row?: number; column?: string; text: string } | undefined>();
  const page = field.pages?.find((candidate) => candidate.id === step.page);
  const columns = pageColumns(field, step.page);
  const label = field.rowLabel ?? 'Zeile';
  const context = { definition: session.form.definition, data: part?.data ?? {} };

  const raw = () =>
    rows.map((row) => ({
      [ROW_ID_KEY]: row.rowId,
      ...Object.fromEntries(
        (field.columns ?? []).map((column) => {
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
    // Only the cells this page asks for must be filled here.
    const asked = new Set(columns.map((column) => column.id));
    const firstGap = missingCells(field, check.value).find((gap) => asked.has(gap.column));
    if (firstGap) {
      const index = rows.findIndex((row) => row.rowId === firstGap.rowId);
      setError({
        row: index,
        column: firstGap.column,
        text: page ? 'Bitte ausfüllen.' : 'Bitte ausfüllen oder die Zeile entfernen.',
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

  const titleOf = (row: Row) => {
    const stored = storedCells(field, row);
    const parts = (field.rowTitle ?? []).flatMap((id) => {
      const column = field.columns?.find((candidate) => candidate.id === id);
      const value = stored[id] ?? null;
      return column && value !== null ? [displayValue(column, value)] : [];
    });
    return parts.join(' · ');
  };

  const first = stepsFor(session)[0]?.key === session.stepKey;
  return (
    <Card>
      <div className="question">
        <h2 id={`field-${field.id}-${step.page ?? 'main'}-label`}>
          {page ? page.question : (field.question ?? field.label)}
          {step.required ? '' : <span className="muted"> (freiwillig)</span>}
        </h2>
        {page
          ? page.help !== undefined && <p className="help">{page.help}</p>
          : field.help !== undefined && <p className="help">{field.help}</p>}
        {!page && <Explainer path={field.explainer} />}
        {rows.length === 0 && <p className="muted">Noch keine Einträge.</p>}
        {rows.map((row, index) => {
          const stored = storedCells(field, row);
          const title = titleOf(row);
          return (
            <fieldset key={row.rowId} className="table-row">
              <legend>
                {label} {index + 1}
                {title === '' ? '' : `: ${title}`}
              </legend>
              {columns
                .filter((column) => columnShown(column, stored))
                .map((column) => {
                  const id = `field-${field.id}-${row.rowId}-${column.id}`;
                  const cell = row.cells[column.id];
                  if (column.carryFrom !== undefined) {
                    return (
                      <p key={column.id} className="table-cell muted">
                        {column.label}: {displayValue(column, stored[column.id] ?? null)}
                      </p>
                    );
                  }
                  return (
                    <div key={column.id} className="table-cell">
                      <span id={`${id}-label`} className="cell-label">
                        {column.question ?? column.label}
                        {column.required ? '' : ' (freiwillig)'}
                      </span>
                      {column.help !== undefined && <span className="help">{column.help}</span>}
                      <FieldInput
                        field={column}
                        id={id}
                        value={cell as FieldValue}
                        text={typeof cell === 'string' ? cell : ''}
                        onText={(text) => update(index, column.id, text)}
                        onChoose={(value) => update(index, column.id, value)}
                        onSubmit={next}
                        context={context}
                      />
                      {error?.row === index && error.column === column.id && (
                        <p className="field-error" role="alert">
                          {error.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              {!page && (
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
              )}
            </fieldset>
          );
        })}
        {!page && rows.length < 30 && (
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
        {!page && rows.length === 0 && step.state !== 'deferred' && (
          <button
            type="button"
            onClick={() => {
              const result = defer(session, field.id);
              if (result.ok) onSession(nextStep(result.session));
              else setError({ text: result.message });
            }}
          >
            Vorerst überspringen
          </button>
        )}
        <button
          type="button"
          className="primary"
          disabled={!page && step.required && rows.length === 0 && step.state !== 'deferred'}
          onClick={next}
        >
          {choice.backToSummary ? 'Zurück zur Zusammenfassung' : 'Weiter'}
        </button>
        {choice.skip && (
          <button
            type="button"
            disabled={!page && step.required && rows.length === 0 && step.state !== 'deferred'}
            onClick={() => leave(skipToMissing)}
          >
            {choice.skip.kind === 'summary'
              ? 'Zur Zusammenfassung'
              : 'Zur nächsten fehlenden Angabe'}
          </button>
        )}
      </div>
    </Card>
  );
}
