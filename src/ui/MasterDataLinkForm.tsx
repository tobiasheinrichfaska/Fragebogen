// "Stammdaten-Link erstellen oder ändern" (Tobias 2026-11-03): every master datum of the forms in
// this app once, entered like in the interview, and the bookmark link it makes — for the employer
// on the start page, for a Mandant in the Kanzlei station. The catalogue, the checks and what the
// values exclude come from the logic layer.
import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../config';
import { editValue } from '../logic/display';
import { latestForms, type FormRegistry } from '../logic/formRegistry';
import { ISSUE_MESSAGES, issueMessage, type IssueBounds, type IssueCode } from '../logic/issues';
import { storedValue, type MasterData } from '../logic/masterData';
import {
  masterDataCatalog,
  masterDataExclusions,
  masterDataInput,
  unknownMasterDataKeys,
  type MasterDataCatalog,
  type MasterDataEntry,
} from '../logic/masterDataCatalog';
import {
  fragmentOf,
  MASTER_DATA_LINK_MAX_LENGTH,
  MASTER_DATA_LINK_MESSAGES,
  masterDataFragment,
  masterDataLinkBase,
  parseMasterDataFragment,
} from '../logic/masterDataLink';
import type { FieldValue } from '../logic/model';
import { Banner, type BannerMessage } from './common';
import { FieldInput } from './FieldInput';
import { isTextLike } from './fieldKinds';
import { MasterDataLink } from './MasterDataLink';

interface Props {
  registry: FormRegistry;
  /** The link the app was opened with: its values are the start. */
  initial?: MasterData;
}

/** Typed text for text-like entries, the chosen option or yes/no otherwise; null = no answer. */
type Inputs = Record<string, unknown>;

function inputsOf(catalog: MasterDataCatalog, record: MasterData | undefined): Inputs {
  return Object.fromEntries(
    catalog.groups.flatMap((group) =>
      group.entries.map((entry) => {
        const value = record?.[entry.key];
        if (isTextLike(entry.field)) return [entry.key, editValue(entry.field, value ?? null)];
        return [entry.key, value === undefined ? null : storedValue(entry.field, value)];
      }),
    ),
  );
}

function keptOf(catalog: MasterDataCatalog, record: MasterData | undefined): MasterData {
  if (!record) return {};
  return Object.fromEntries(
    unknownMasterDataKeys(catalog, record).map((key) => [key, record[key] ?? null]),
  );
}

const issueText = (issue: string, bounds?: IssueBounds) =>
  issue in ISSUE_MESSAGES ? issueMessage(issue as IssueCode, bounds) : 'Diese Angabe ist ungültig.';

export function MasterDataLinkForm({ registry, initial }: Props) {
  const forms = useMemo(() => latestForms(registry), [registry]);
  const catalog = useMemo(() => masterDataCatalog(forms), [forms]);
  const [inputs, setInputs] = useState<Inputs>(() => inputsOf(catalog, initial));
  // Keys this app does not know (e.g. from a newer version) stay in the link unchanged.
  const [kept, setKept] = useState<MasterData>(() => keptOf(catalog, initial));
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState<BannerMessage | undefined>();

  const record: MasterData = { ...kept };
  const errors = new Map<string, string>();
  for (const group of catalog.groups) {
    for (const entry of group.entries) {
      const raw = inputs[entry.key] ?? null;
      if (raw === null || (typeof raw === 'string' && raw.trim() === '')) continue;
      const result = masterDataInput(entry, raw);
      if (result.ok) {
        if (result.value !== null) record[entry.key] = result.value;
      } else errors.set(entry.key, issueText(result.issue, entry.field));
    }
  }
  const link =
    errors.size === 0 && Object.keys(record).length > 0 ? masterDataFragment(record) : undefined;
  const exclusions = masterDataExclusions(forms, record);
  const base = masterDataLinkBase(location.href, APP_CONFIG.appAddress);

  const readPasted = () => {
    const parsed = parseMasterDataFragment(fragmentOf(pasted));
    if (!parsed.ok) {
      setMessage({
        tone: 'error',
        text: MASTER_DATA_LINK_MESSAGES[parsed.issue],
        detail: parsed.detail,
      });
      return;
    }
    if (!parsed.data) {
      setMessage({ tone: 'warning', text: 'Das ist kein Stammdaten-Link dieser App.' });
      return;
    }
    setInputs(inputsOf(catalog, parsed.data));
    setKept(keptOf(catalog, parsed.data));
    setPasted('');
    setMessage({
      tone: 'success',
      text: `Link eingelesen: ${String(Object.keys(parsed.data).length)} Angaben. Sie können sie jetzt ändern.`,
    });
  };

  const set = (key: string, raw: unknown) => setInputs({ ...inputs, [key]: raw });

  return (
    <div className="master-link-form">
      {catalog.conflicts.length > 0 && (
        <Banner
          message={{
            tone: 'error',
            text: 'Die Formulare dieser App verstehen einige Angaben verschieden. Bitte diese Angaben nicht verwenden.',
            detail: catalog.conflicts,
          }}
        />
      )}
      <p>
        Der Link enthält nur Angaben zum Betrieb, keine Daten von Beschäftigten. Leere Angaben
        bleiben im Fragebogen offen. Jede Angabe ist nur eine Vorbelegung: Wer den Fragebogen
        ausfüllt, sieht sie und kann sie ändern.
      </p>
      <div className="master-entry">
        <label htmlFor="master-paste">Vorhandenen Link einfügen (optional)</label>
        <div className="master-link">
          <input
            id="master-paste"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            placeholder="https://…#stammdaten=1&…"
          />
          <button type="button" disabled={pasted.trim() === ''} onClick={readPasted}>
            Einlesen
          </button>
        </div>
      </div>
      {message && <Banner message={message} onClose={() => setMessage(undefined)} />}

      {catalog.groups.map((group) => (
        <div key={group.title} className="summary-section">
          <h3>{group.title}</h3>
          {group.entries.map((entry) => (
            <EntryInput
              key={entry.key}
              entry={entry}
              raw={inputs[entry.key] ?? null}
              error={errors.get(entry.key)}
              onChange={(raw) => set(entry.key, raw)}
            />
          ))}
        </div>
      ))}

      {Object.keys(kept).length > 0 && (
        <p className="muted">
          Der Link enthält weitere Angaben, die diese Version der App nicht kennt. Sie bleiben
          unverändert im Link: {Object.keys(kept).join(', ')}.
        </p>
      )}

      {exclusions.length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Was diese Angaben bewirken:',
            detail: exclusions.map((exclusion) =>
              exclusion.kind === 'always'
                ? `${exclusion.form}: Die App macht für diesen Betrieb keine Vorschläge – ${exclusion.message}`
                : `${exclusion.form}: Je nach den Angaben zur Person macht die App keine Vorschläge – ${exclusion.message}`,
            ),
          }}
        />
      )}

      <div className="summary-section">
        <h3>Ihr Link</h3>
        {errors.size > 0 && (
          <p className="field-error" role="alert">
            Bitte erst die markierten Angaben berichtigen.
          </p>
        )}
        {errors.size === 0 && link === undefined && (
          <p className="muted">Sobald eine Angabe ausgefüllt ist, erscheint hier der Link.</p>
        )}
        {link?.ok === false && (
          <p className="field-error" role="alert">
            {MASTER_DATA_LINK_MESSAGES[link.issue]}
          </p>
        )}
        {link?.ok && (
          <>
            <MasterDataLink url={`${base}${link.fragment}`} />
            <p className="muted">
              {link.fragment.length.toLocaleString('de-DE')} von{' '}
              {MASTER_DATA_LINK_MAX_LENGTH.toLocaleString('de-DE')} Zeichen. Legen Sie den Link als
              Lesezeichen an oder geben Sie ihn weiter; geöffnet trägt er die Angaben in jeden neuen
              Fragebogen ein.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function EntryInput({
  entry,
  raw,
  error,
  onChange,
}: {
  entry: MasterDataEntry;
  raw: unknown;
  error: string | undefined;
  onChange: (raw: unknown) => void;
}) {
  const id = `master-${entry.key}`;
  const textLike = isTextLike(entry.field);
  const chosen = !textLike && raw !== null;
  return (
    <div className="master-entry">
      <p id={`${id}-label`} className="master-question">
        {entry.question}
      </p>
      {entry.help !== undefined && <p className="help">{entry.help}</p>}
      <FieldInput
        field={entry.field}
        id={id}
        value={textLike ? undefined : (raw as FieldValue)}
        text={textLike && typeof raw === 'string' ? raw : ''}
        onText={onChange}
        onChoose={onChange}
        onSubmit={() => undefined}
      />
      {chosen && (
        <p className="clear-choice">
          <button type="button" className="link" onClick={() => onChange(null)}>
            Auswahl aufheben
          </button>
        </p>
      )}
      {error !== undefined && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {entry.forms.length > 1 && <p className="muted">Genutzt in: {entry.forms.join(', ')}</p>}
    </div>
  );
}
