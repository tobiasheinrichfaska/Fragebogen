// "Stammdaten-Link erstellen oder ändern" (Tobias 2026-11-03): every master datum of the forms in
// this app once, entered like in the interview, and the bookmark link it makes — for the employer
// on the start page, for a Mandant in the Kanzlei station. The catalogue, the checks and what the
// values exclude come from the logic layer.
import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../config';
import { editValue } from '../logic/display';
import { latestForms, type FormRegistry, type RegisteredForm } from '../logic/formRegistry';
import { ISSUE_MESSAGES, issueMessage, type IssueBounds, type IssueCode } from '../logic/issues';
import { masterDataRolesText, storedValue, type MasterData } from '../logic/masterData';
import {
  catalogEntries,
  entriesOutside,
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
  /** The form that link opens. */
  initialForm?: string;
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

const isEmpty = (raw: unknown) => raw === null || (typeof raw === 'string' && raw.trim() === '');

/** The select's value while nothing is chosen; no form id can be "#". */
const NOT_CHOSEN = '#';

/**
 * What a read link opens: its form while this app has it, the start page for a link without one;
 * undefined = still to choose.
 */
function opensOf(
  forms: readonly RegisteredForm[],
  data: MasterData | undefined,
  form: string | undefined,
): string | undefined {
  if (form !== undefined) {
    return forms.some((f) => f.definition.id === form) ? form : undefined;
  }
  return data === undefined ? undefined : '';
}

export function MasterDataLinkForm({ registry, initial, initialForm }: Props) {
  const forms = useMemo(() => latestForms(registry), [registry]);
  // What the link opens is chosen first, then only that form's data are shown (Tobias 2026-11-05);
  // "" = the start page with the data of every form, undefined = not chosen yet.
  const [opens, setOpens] = useState(() => opensOf(forms, initial, initialForm));
  const catalog = useMemo(() => masterDataCatalog(forms), [forms]);
  const opened = forms.find((form) => form.definition.id === opens);
  const shown = useMemo(
    () => (opened ? masterDataCatalog([opened]) : opens === '' ? catalog : undefined),
    [catalog, opened, opens],
  );
  const [inputs, setInputs] = useState<Inputs>(() => inputsOf(catalog, initial));
  // Keys this app does not know (e.g. from a newer version) stay in the link unchanged.
  const [kept, setKept] = useState<MasterData>(() => keptOf(catalog, initial));
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState<BannerMessage | undefined>();

  const record: MasterData = { ...kept };
  const errors = new Map<string, string>();
  for (const entry of shown ? catalogEntries(shown) : []) {
    const raw = inputs[entry.key] ?? null;
    if (isEmpty(raw)) continue;
    const result = masterDataInput(entry, raw);
    if (result.ok) {
      if (result.value !== null) record[entry.key] = result.value;
    } else errors.set(entry.key, issueText(result.issue, entry.field));
  }
  // Values of other forms' data stay out of this link — named, never dropped silently.
  const left = shown
    ? entriesOutside(catalog, shown).filter((entry) => !isEmpty(inputs[entry.key] ?? null))
    : [];
  const link =
    opens !== undefined && errors.size === 0 && (Object.keys(record).length > 0 || opens !== '')
      ? masterDataFragment(record, opens === '' ? undefined : opens)
      : undefined;
  const exclusions = shown ? masterDataExclusions(opened ? [opened] : forms, record) : [];
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
    const now = opensOf(forms, parsed.data, parsed.form);
    setInputs(inputsOf(catalog, parsed.data));
    setKept(keptOf(catalog, parsed.data));
    setOpens(now);
    setPasted('');
    setMessage({
      tone: now === undefined ? 'warning' : 'success',
      text:
        `Link eingelesen: ${String(Object.keys(parsed.data).length)} Angaben. Sie können sie jetzt ändern.` +
        (now === undefined
          ? ' Das Formular, das der Link öffnet, gibt es in dieser App nicht – bitte wählen Sie, was der Link öffnen soll.'
          : ''),
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
        Der Link enthält nur Stammdaten – Angaben, die in jedem Fragebogen gleich sind, etwa zum
        Betrieb oder zur Kanzlei –, keine Daten einzelner Personen. Leere Angaben bleiben im
        Fragebogen offen. Jede Angabe ist nur eine Vorbelegung: Wer den Fragebogen ausfüllt, sieht
        sie und kann sie ändern.
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

      <div className="master-entry">
        <label htmlFor="master-opens" className="master-question">
          Was soll der Link öffnen?
        </label>
        <select
          id="master-opens"
          value={opens ?? NOT_CHOSEN}
          onChange={(event) => setOpens(event.target.value)}
        >
          {opens === undefined && (
            <option value={NOT_CHOSEN} disabled>
              Bitte wählen …
            </option>
          )}
          {forms.map((form) => (
            <option key={form.definition.id} value={form.definition.id}>
              einen neuen Fragebogen „{form.definition.title}“
            </option>
          ))}
          <option value="">die Startseite (das Formular wählt man dort)</option>
        </select>
        <p className="help">
          Danach zeigt die Seite nur die Angaben, die dieses Formular nutzt; für die Startseite die
          aller Formulare. Der Link nennt nur das Formular, keine Fassung: Er öffnet immer die
          neueste Fassung, auch nach einer Aktualisierung der App.
        </p>
      </div>

      {shown?.groups.map((group) => (
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
      {opened && shown?.groups.length === 0 && (
        <p className="muted">
          „{opened.definition.title}“ hat keine Stammdaten: Der Link öffnet nur einen neuen
          Fragebogen.
        </p>
      )}

      {left.length > 0 && (
        <p className="muted">
          Nicht in diesem Link, weil sie zu anderen Formularen gehören:{' '}
          {left.map((entry) => `${entry.question} (${entry.forms.join(', ')})`).join('; ')}.
        </p>
      )}

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
        {opens === undefined && (
          <p className="muted">Wählen Sie zuerst, was der Link öffnen soll.</p>
        )}
        {errors.size > 0 && (
          <p className="field-error" role="alert">
            Bitte erst die markierten Angaben berichtigen.
          </p>
        )}
        {opens !== undefined && errors.size === 0 && link === undefined && (
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
              Lesezeichen an oder geben Sie ihn weiter.{' '}
              {opened
                ? `Geöffnet beginnt er einen neuen Fragebogen „${opened.definition.title}“; die Angaben aus dem Link stehen dort schon im Teil ${masterDataRolesText(opened.definition)}.`
                : 'Geöffnet trägt er die Angaben in jeden neuen Fragebogen ein.'}
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
