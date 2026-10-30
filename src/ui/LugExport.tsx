// Kanzlei: hand-over to the payroll program — Erfassungsblatt in the order of its masks and the
// master-data import file (only in builds with a local mapping, config/export.local.json).
import { useMemo, useState } from 'react';
import { downloadFile } from '../io/files';
import { encodeWindows1252 } from '../io/windows1252';
import { checkExportMapping, type ExportMapping } from '../logic/exportMapping';
import { buildLugImport } from '../logic/lugImport';
import type { FormDefinition, Questionnaire } from '../logic/model';
import { Banner, type BannerMessage } from './common';

interface Props {
  questionnaire: Questionnaire;
  definition: FormDefinition;
  mapping: ExportMapping;
}

export function LugExport({ questionnaire, definition, mapping }: Props) {
  const [mandant, setMandant] = useState('');
  const [employee, setEmployee] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [banner, setBanner] = useState<BannerMessage | undefined>();
  const unfit = useMemo(() => checkExportMapping(mapping, definition), [mapping, definition]);
  const result = useMemo(
    () =>
      buildLugImport(questionnaire, definition, mapping, {
        mandantennummer: mandant,
        ...(employee.trim() ? { mitarbeiternummer: employee } : {}),
      }),
    [questionnaire, definition, mapping, mandant, employee],
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
      `${mapping.target}_Stammdaten_${mandant}_${employee || 'neu'}.txt`,
      encoded.bytes,
      'text/plain',
    );
  };

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
            value={employee}
            inputMode="numeric"
            autoComplete="off"
            placeholder="laut Fragebogen"
            onChange={(event) => setEmployee(event.target.value)}
          />
        </label>
      </div>
      {result.blocking.length > 0 && (
        <Banner
          message={{ tone: 'warning', text: 'Noch keine Importdatei:', detail: result.blocking }}
        />
      )}
      {result.problems.length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Nicht übertragen – bitte in Lohn und Gehalt selbst erfassen:',
            detail: result.problems,
          }}
        />
      )}
      {banner && <Banner message={banner} />}
      <div className="nav">
        <button type="button" onClick={() => setShowSheet(!showSheet)}>
          {showSheet ? 'Erfassungsblatt schließen' : 'Erfassungsblatt ansehen'}
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

function SheetRowView({
  row,
  first,
}: {
  row: { mask: string; field: string; value: string; problem?: string };
  first: boolean;
}) {
  return (
    <>
      {first && (
        <tr className="sheet-mask">
          <th colSpan={2}>{row.mask.split('|').join(' › ')}</th>
        </tr>
      )}
      <tr>
        <td>{row.field}</td>
        <td>{row.problem ? <span className="muted">– ({row.problem})</span> : row.value || '–'}</td>
      </tr>
    </>
  );
}
