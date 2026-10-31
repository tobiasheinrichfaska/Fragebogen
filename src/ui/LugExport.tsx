// Kanzlei: hand-over to the payroll program — Erfassungsblatt in the order of its masks (screen and
// PDF for the Personalakte) and the master-data import file (only in builds with a local mapping,
// config/export.local.json). What only the Kanzlei knows it enters here per questionnaire.
import { useMemo, useState } from 'react';
import { downloadFile } from '../io/files';
import { MODE_TEXT } from '../io/sheetPdf';
import { encodeWindows1252 } from '../io/windows1252';
import {
  checkExportMapping,
  EMPLOYEE_MODES,
  type EmployeeMode,
  type ExportMapping,
} from '../logic/exportMapping';
import { importFileName } from '../logic/fileNames';
import { buildLugImport, neededInputs, type SheetRow } from '../logic/lugImport';
import type { FormDefinition, Questionnaire } from '../logic/model';
import { Banner, type BannerMessage } from './common';
import { createSheetPdf } from './pdfActions';

interface Props {
  questionnaire: Questionnaire;
  definition: FormDefinition;
  mapping: ExportMapping;
}

const MODE_HELP: Readonly<Record<EmployeeMode, string>> = {
  neu: 'Die Datei legt den Mitarbeiter mit dieser Nummer an.',
  vorhanden:
    'Die Datei wählt den Mitarbeiter mit dieser Nummer aus und ergänzt ihn, z. B. nach dem Import der Sofortmeldung. Sie legt keinen neuen an.',
};

export function LugExport({ questionnaire, definition, mapping }: Props) {
  const [mandant, setMandant] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [mode, setMode] = useState<EmployeeMode | undefined>();
  const [entered, setEntered] = useState<Record<string, string>>({});
  const [showSheet, setShowSheet] = useState(false);
  const [banner, setBanner] = useState<BannerMessage | undefined>();
  const unfit = useMemo(() => checkExportMapping(mapping, definition), [mapping, definition]);
  const inputs = useMemo(
    () => neededInputs(questionnaire, definition, mapping, entered),
    [questionnaire, definition, mapping, entered],
  );
  const result = useMemo(
    () =>
      buildLugImport(questionnaire, definition, mapping, {
        mandantennummer: mandant,
        ...(employeeNumber.trim() ? { mitarbeiternummer: employeeNumber } : {}),
        ...(mode === undefined ? {} : { mode }),
        inputs: entered,
      }),
    [questionnaire, definition, mapping, mandant, employeeNumber, mode, entered],
  );

  if (unfit.length > 0) {
    return (
      <Banner
        message={{
          tone: 'error',
          text: `Die Zuordnung für ${mapping.title} passt nicht zu dieser Formularfassung:`,
          detail: unfit.map((issue) => `${issue.path}: ${issue.message}`),
        }}
      />
    );
  }

  const download = () => {
    if (result.text === undefined) return;
    const encoded = encodeWindows1252(result.text);
    if (!encoded.ok) {
      setBanner({
        tone: 'error',
        text: 'Diese Zeichen kann die Importdatei (Windows-1252) nicht darstellen:',
        detail: encoded.unsupported.map((c) => `„${c}“`),
      });
      return;
    }
    setBanner(undefined);
    downloadFile(
      importFileName(mapping.target, mandant.trim(), result.employee.number),
      encoded.bytes,
      'text/plain',
    );
  };

  const sheetPdf = async () => {
    setBanner(
      await createSheetPdf({
        questionnaire,
        definition,
        mapping,
        result,
        inputs,
        mandant: mandant.trim(),
        ...(mode === undefined ? {} : { mode }),
      }),
    );
  };

  const { employee } = result;
  return (
    <div className="export">
      <h3>Übergabe an {mapping.title}</h3>
      <div className="export-numbers">
        <label>
          Mandantennummer
          <input
            value={mandant}
            inputMode="numeric"
            autoComplete="off"
            onChange={(event) => setMandant(event.target.value)}
          />
        </label>
        <label>
          Mitarbeiternummer
          <input
            value={employeeNumber}
            inputMode="numeric"
            autoComplete="off"
            placeholder={
              employee.number ? `laut Fragebogen: ${employee.number}` : 'laut Fragebogen'
            }
            onChange={(event) => setEmployeeNumber(event.target.value)}
          />
        </label>
      </div>
      <fieldset className="export-mode">
        <legend>Mitarbeiter in {mapping.title}</legend>
        {EMPLOYEE_MODES.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={`mode-${questionnaire.questionnaireId}-${mapping.title}`}
              checked={mode === option}
              onChange={() => setMode(option)}
            />
            {MODE_TEXT[option]}
          </label>
        ))}
        {mode && <p className="muted">{MODE_HELP[mode]}</p>}
        <p className="muted">
          Bitte in {mapping.title} vergleichen: Mitarbeiter {employee.number || '–'} ist{' '}
          {[employee.name, employee.firstName].filter(Boolean).join(', ') || '–'}
          {employee.start ? `, Eintritt ${employee.start}` : ''}.
        </p>
      </fieldset>
      {inputs.length > 0 && (
        <div className="export-inputs">
          {inputs.map((needed) => (
            <label key={needed.input.id}>
              {needed.input.label}
              {needed.input.options ? (
                <select
                  value={needed.value}
                  onChange={(event) =>
                    setEntered({ ...entered, [needed.input.id]: event.target.value })
                  }
                >
                  <option value="">– bitte wählen –</option>
                  {needed.input.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} – {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={entered[needed.input.id] ?? needed.input.default ?? ''}
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(event) =>
                    setEntered({ ...entered, [needed.input.id]: event.target.value })
                  }
                />
              )}
              {needed.context.map((c) => (
                <span key={c.label} className="muted">
                  {c.label}: {c.value}
                </span>
              ))}
              {needed.input.help && <span className="muted">{needed.input.help}</span>}
              {needed.problem && <span className="error-text">{needed.problem}</span>}
            </label>
          ))}
        </div>
      )}
      {result.blocking.length > 0 && (
        <Banner
          message={{ tone: 'warning', text: 'Noch keine Importdatei:', detail: result.blocking }}
        />
      )}
      {result.problems.length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: `Nicht übertragen – bitte in ${mapping.title} selbst erfassen:`,
            detail: result.problems,
          }}
        />
      )}
      {result.notes.length > 0 && (
        <Banner
          message={{
            tone: 'info',
            text: 'Übertragen, bitte im Importprotokoll prüfen:',
            detail: result.notes,
          }}
        />
      )}
      {banner && <Banner message={banner} />}
      <div className="nav">
        <button type="button" onClick={() => setShowSheet(!showSheet)}>
          {showSheet ? 'Erfassungsblatt schließen' : 'Erfassungsblatt ansehen'}
        </button>
        <button type="button" onClick={() => void sheetPdf()}>
          Erfassungsblatt als PDF
        </button>
        <button
          type="button"
          className="primary"
          disabled={result.text === undefined}
          onClick={download}
        >
          Importdatei herunterladen
        </button>
      </div>
      {(mapping.howTo ?? []).map((step) => (
        <p key={step} className="muted">
          {step}
        </p>
      ))}
      {showSheet && (
        <table className="sheet">
          <thead>
            <tr>
              <th>Feld</th>
              <th>Wert</th>
            </tr>
          </thead>
          <tbody>
            {result.sheet.map((row, i) => (
              <SheetRowView
                key={`${row.mask}|${row.field}|${i}`}
                row={row}
                first={result.sheet[i - 1]?.mask !== row.mask}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SheetRowView({ row, first }: { row: SheetRow; first: boolean }) {
  return (
    <>
      {first && (
        <tr className="sheet-mask">
          <th colSpan={2}>{row.mask.split('|').join(' › ')}</th>
        </tr>
      )}
      <tr>
        <td>{row.field}</td>
        <td>
          {row.problem ? <span className="muted">– ({row.problem})</span> : row.value || '–'}
          {row.note && <span className="muted"> · Hinweis: {row.note}</span>}
        </td>
      </tr>
    </>
  );
}
