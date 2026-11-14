// Station Kanzlei (step 9): read many files at once, see them grouped by questionnaire, decide what
// the app must not decide itself (which questionnaires belong together, which version counts),
// see contradictions and gaps, and write the merged result — PDF for the Personalakte, JSON for
// the next run. All rules are in logic/kanzlei.ts and logic/merge.ts.
import { useMemo, useRef, useState } from 'react';
import { APP_VERSION } from '../appInfo';
import { EXPORT_MAPPINGS } from '../config';
import { downloadFile } from '../io/files';
import { buildPackage, packageText } from '../logic/dataPackage';
import { displayValue } from '../logic/display';
import { mappingFor } from '../logic/exportMapping';
import { fileNameFor } from '../logic/fileNames';
import { fieldsById } from '../logic/form';
import type { FormRegistry } from '../logic/formRegistry';
import {
  addToInbox,
  decide,
  EMPTY_INBOX,
  filesOfGroup,
  inboxRegistry,
  mergeInbox,
  removeFromInbox,
  withdraw,
  withKanzleiReceipts,
  type Inbox,
  type InboxFile,
} from '../logic/kanzlei';
import {
  MERGE_CONFLICT_MESSAGES,
  MERGE_NOTE_MESSAGES,
  type MergeConflict,
  type MergeGroup,
} from '../logic/merge';
import type { MasterData } from '../logic/masterData';
import type { FormDefinition, MergeDecision } from '../logic/model';
import { BLOCKER_MESSAGES } from '../logic/requirements';
import { sessionFromFile } from '../logic/session';
import { formatLocalDateTime } from '../logic/time';
import { Banner, Card, type BannerMessage } from './common';
import { FormView } from './FormView';
import { LugExport } from './LugExport';
import { MasterDataLinkForm } from './MasterDataLinkForm';
import { usePasswordDialog } from './usePasswordDialog';
import { createPdf, openAnyFile } from './pdfActions';

interface Props {
  registry: FormRegistry;
  /** The master-data link the app was opened with, as the start of a Mandant's link. */
  remembered?: MasterData;
  /** Inputs prepared by a start point of the test area. */
  initialInbox?: Inbox;
  onBack: () => void;
}

interface FileReport {
  name: string;
  message: BannerMessage;
}

const PART_STATUS = {
  signed: 'unterschrieben',
  sealed: 'abgeschlossen',
  draft: 'Entwurf',
} as const;

export function KanzleiScreen({ registry, remembered, initialInbox, onBack }: Props) {
  const [inbox, setInbox] = useState<Inbox>(initialInbox ?? EMPTY_INBOX);
  const [reports, setReports] = useState<FileReport[]>(() =>
    (initialInbox?.files ?? []).map((file) => ({
      name: file.name,
      message: {
        tone: 'info',
        text: 'Vorbereiteter Eingang aus dem Testbereich – nicht aus einer Datei gelesen.',
      },
    })),
  );
  const [collected, setCollected] = useState<Uint8Array[]>([]);
  const [viewing, setViewing] = useState<string | undefined>();
  const [banner, setBanner] = useState<BannerMessage | undefined>();
  const [busy, setBusy] = useState(false);
  const { dialog: passwordDialog, ask: askPassword } = usePasswordDialog();
  const input = useRef<HTMLInputElement>(null);
  const merged = useMemo(() => mergeInbox(inbox, registry), [inbox, registry]);
  const forms = useMemo(() => inboxRegistry(registry, inbox), [inbox, registry]);
  const fileName = (sha: string) => inbox.files.find((f) => f.fileSha256 === sha)?.name ?? sha;

  const addFiles = async (files: readonly File[]) => {
    setBusy(true);
    let next = inbox;
    let codes = collected;
    const added: FileReport[] = [];
    const taken: InboxFile[] = [];
    // One after the other: photos of one print-out add up their QR codes.
    for (const file of files) {
      const { result, fileSha256, received } = await openAnyFile(
        file,
        registry,
        codes,
        askPassword,
      );
      if (result.kind === 'partial') {
        codes = result.collected;
        added.push({ name: file.name, message: result.message });
        continue;
      }
      codes = [];
      if (result.kind === 'error' || fileSha256 === undefined) {
        added.push({ name: file.name, message: result.message });
        continue;
      }
      const { questionnaire, form, origin } = result.session;
      const entry: InboxFile = {
        name: file.name,
        fileSha256,
        questionnaire,
        form,
        origin,
        received,
      };
      const fresh = addToInbox(next, entry);
      next = fresh.inbox;
      if (!fresh.duplicate) taken.push(entry);
      added.push({
        name: file.name,
        message: fresh.duplicate
          ? { tone: 'info', text: 'Diese Datei ist schon eingelesen; sie zählt einmal.' }
          : result.message,
      });
    }
    // Added to the inbox as it is now: a decision or removal made while the files were read stays
    // (audit 2026-11-14: the inbox of the start was put back).
    setInbox((current) => taken.reduce((acc, entry) => addToInbox(acc, entry).inbox, current));
    setCollected(codes);
    setReports((current) => [...current, ...added]);
    setBusy(false);
  };

  // Writing the PDF stands the page still for seconds: locked meanwhile, so a second click does not
  // write a second PDF (audit 2026-11-14).
  // The group whose PDF is being written; the others' buttons are locked too, but keep their label.
  const [writing, setWriting] = useState<string | undefined>();
  const write = async (group: MergeGroup, kind: 'pdf' | 'json') => {
    if (writing !== undefined) return;
    const result = withKanzleiReceipts(group, inbox, APP_VERSION);
    const form = result && forms.byHash(result.questionnaire.form.definitionHash);
    if (!result || !form) {
      setBanner({ tone: 'error', text: 'Für diesen Fragebogen fehlt die Formulardefinition.' });
      return;
    }
    const refused = result.refused.map((r) => `${r.fileName}: ${r.reason}`);
    const origin = registry.byHash(form.definitionHash) ? 'published' : 'embedded';
    if (kind === 'json') {
      downloadFile(
        fileNameFor(form.definition.id, result.questionnaire.questionnaireId, 'merged'),
        packageText(buildPackage(result.questionnaire, form)),
        'application/json',
      );
      setBanner({
        tone: refused.length > 0 ? 'warning' : 'success',
        text: 'Daten der Zusammenführung gespeichert (mit Eingangsvermerken der Kanzlei).',
        detail: refused,
      });
      return;
    }
    const first = filesOfGroup(group, inbox)[0];
    const session = sessionFromFile(
      { questionnaire: result.questionnaire, form, origin },
      {
        local: first?.received.local ?? '',
        utc: first?.received.utc ?? '',
        source: 'file',
      },
    );
    setWriting(group.questionnaireId);
    try {
      // Paint „PDF wird erstellt …“ before the work blocks the page.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const created = await createPdf(session);
      setBanner({
        ...created.message,
        detail: [...(created.message.detail ?? []), ...refused],
      });
    } finally {
      setWriting(undefined);
    }
  };

  return (
    <>
      {banner && <Banner message={banner} onClose={() => setBanner(undefined)} />}
      {passwordDialog}
      <Card title="Kanzlei: Eingänge zusammenführen">
        <p>
          Lesen Sie alle PDFs, Zwischenstände oder Fotos ein, die zu den Fragebögen eingegangen sind
          – auch mehrere auf einmal. Die App ordnet sie nach Fragebogen, prüft jede Fassung und
          entscheidet nie selbst, wenn etwas nicht eindeutig ist.
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,.json,application/pdf,application/json,image/*"
          className="visually-hidden"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = '';
            if (files.length > 0) void addFiles(files);
          }}
        />
        <div className="nav">
          <button type="button" className="link" onClick={onBack}>
            Zur Startseite
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? 'Wird gelesen …' : 'Dateien hinzufügen …'}
          </button>
        </div>
        {reports.length > 0 && (
          <details className="file-reports">
            <summary>Prüfergebnis je Datei ({reports.length})</summary>
            {reports.map((report, i) => (
              <Banner
                key={`${report.name}-${i}`}
                message={{ ...report.message, text: `${report.name}: ${report.message.text}` }}
              />
            ))}
          </details>
        )}
        {inbox.files.length > 0 && (
          <ul className="inbox">
            {inbox.files.map((file) => (
              <li key={file.fileSha256}>
                <span>
                  {file.name}
                  <span className="muted">
                    {' '}
                    · {file.form.definition.title} {file.form.definition.version} · Fragebogen{' '}
                    {file.questionnaire.questionnaireId.slice(0, 8)}
                    {file.origin === 'embedded' ? ' · Formular nur aus der Datei' : ''}
                  </span>
                </span>
                <button
                  type="button"
                  className="link"
                  onClick={() => setInbox(removeFromInbox(inbox, file.fileSha256))}
                >
                  entfernen
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Stammdaten-Link für einen Mandanten">
        <details className="master-link-form">
          <summary>Stammdaten-Link erstellen oder ändern</summary>
          <MasterDataLinkForm
            registry={registry}
            {...(remembered ? { initial: remembered } : {})}
          />
        </details>
      </Card>

      {merged.proposals.length > 0 && (
        <Card title="Gehören diese Fragebögen zusammen?">
          <p className="muted">
            Sie haben keine gemeinsame ID, stimmen aber in einigen Angaben überein. Bitte nur
            zusammenführen, wenn es dieselbe Person und derselbe Vorgang ist.
          </p>
          <ul className="roles">
            {merged.proposals.map((proposal) => (
              <li key={proposal.questionnaireIds.join('-')} className="role">
                <span>
                  Fragebogen {proposal.questionnaireIds.map((id) => id.slice(0, 8)).join(' und ')}
                  <span className="state">Übereinstimmend: {proposal.matchKeys.join(', ')}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setInbox(
                      decide(inbox, {
                        kind: 'link',
                        questionnaireIds: [...proposal.questionnaireIds],
                      }),
                    )
                  }
                >
                  Zusammenführen
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {merged.groups.map((group) => {
        const groupFiles = filesOfGroup(group, inbox);
        // Same form for every file of a group, else it is a formMismatch conflict.
        const definition = forms.byHash(groupFiles[0]?.form.definitionHash ?? '')?.definition;
        const title = definition?.title ?? 'Fragebogen';
        const decisions = inbox.decisions.filter((d) =>
          d.kind === 'link'
            ? d.questionnaireIds.some((id) => group.sourceIds.includes(id))
            : group.sourceIds.includes(d.questionnaireId),
        );
        const ready = group.questionnaire !== undefined;
        return (
          <Card
            key={group.questionnaireId}
            title={`${title} · ${group.questionnaireId.slice(0, 8)}`}
          >
            <p className="muted">
              {groupFiles.length} Datei(en)
              {group.sourceIds.length > 1
                ? ` · zusammengeführt aus ${group.sourceIds.map((id) => id.slice(0, 8)).join(', ')}`
                : ''}
            </p>
            {group.conflicts.map((conflict, i) => (
              <ConflictView
                key={`${conflict.code}-${conflict.role ?? ''}-${i}`}
                conflict={conflict}
                group={group}
                definition={definition}
                fileName={fileName}
                onChoose={(decision) => setInbox(decide(inbox, decision))}
              />
            ))}
            {group.notes.length > 0 && (
              <Banner
                message={{
                  tone: 'info',
                  text: 'Hinweise zur Zusammenführung:',
                  detail: group.notes.map(
                    (note) =>
                      `${MERGE_NOTE_MESSAGES[note.code]}${note.detail.length ? ` (${note.detail.join(', ')})` : ''}`,
                  ),
                }}
              />
            )}
            {group.contradictions.length > 0 && (
              <Banner
                message={{
                  tone: 'warning',
                  text: 'Widersprüche:',
                  detail: group.contradictions.map((c) => c.message),
                }}
              />
            )}
            {group.derivations.length > 0 && (
              <Banner
                message={{
                  tone: 'info',
                  text: 'Vorschläge (die App entscheidet nicht – bitte prüfen):',
                  detail: group.derivations.map(
                    (d) =>
                      `${d.label}: ${d.value ?? '–'} – ${[d.reason, ...d.detail].join(' ')}` +
                      (d.check && d.status === 'proposed' ? ' Bitte prüfen.' : ''),
                  ),
                }}
              />
            )}
            {group.hints.length > 0 && (
              <Banner
                message={{
                  tone: 'info',
                  text: 'Prüfhinweise:',
                  detail: group.hints.map(
                    (hint) =>
                      [hint.message, ...hint.detail].join(' ') +
                      (hint.source === undefined ? '' : ` (${hint.source})`),
                  ),
                }}
              />
            )}
            {ready && group.gaps.length > 0 && (
              <Banner
                message={{
                  tone: 'warning',
                  text: 'Es fehlt noch:',
                  detail: group.gaps.map(
                    (g) =>
                      `${BLOCKER_MESSAGES[g.code]}${g.detail.length ? ` (${g.detail.join(', ')})` : ''}`,
                  ),
                }}
              />
            )}
            {ready && group.gaps.length === 0 && group.contradictions.length === 0 && (
              <Banner message={{ tone: 'success', text: 'Vollständig und ohne Widersprüche.' }} />
            )}
            {decisions.length > 0 && (
              <div className="decisions">
                <h3>Ihre Entscheidungen</h3>
                <ul>
                  {decisions.map((decision) => (
                    <li key={JSON.stringify(decision)}>
                      {describeDecision(decision, definition, inbox)}{' '}
                      <button
                        type="button"
                        className="link"
                        onClick={() => setInbox(withdraw(inbox, decision))}
                      >
                        zurücknehmen
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ready && (
              <div className="nav">
                <button
                  type="button"
                  onClick={() =>
                    setViewing(
                      viewing === group.questionnaireId ? undefined : group.questionnaireId,
                    )
                  }
                >
                  {viewing === group.questionnaireId ? 'Formular schließen' : 'Formular ansehen'}
                </button>
                <button type="button" onClick={() => void write(group, 'json')}>
                  Daten speichern (JSON)
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={writing !== undefined}
                  onClick={() => void write(group, 'pdf')}
                >
                  {writing === group.questionnaireId
                    ? 'PDF wird erstellt …'
                    : 'PDF für die Personalakte'}
                </button>
              </div>
            )}
            {viewing === group.questionnaireId && group.questionnaire && definition && (
              <FormView questionnaire={group.questionnaire} definition={definition} />
            )}
            {ready &&
              group.questionnaire &&
              definition &&
              EXPORT_MAPPINGS.filter((mapping) => mappingFor(mapping, definition)).map(
                (mapping) => (
                  <LugExport
                    key={mapping.title}
                    questionnaire={group.questionnaire as NonNullable<typeof group.questionnaire>}
                    definition={definition}
                    mapping={mapping}
                  />
                ),
              )}
          </Card>
        );
      })}
    </>
  );
}

function describeDecision(
  decision: MergeDecision,
  definition: FormDefinition | undefined,
  inbox: Inbox,
): string {
  if (decision.kind === 'link') {
    return `Zusammengeführt: Fragebogen ${decision.questionnaireIds.map((id) => id.slice(0, 8)).join(' und ')}.`;
  }
  const role = definition?.roles.find((r) => r.id === decision.role)?.label ?? decision.role;
  const from = inbox.files.flatMap((file) =>
    (file.questionnaire.parts[decision.role] ?? [])
      .filter((part) => part.seal?.contentHash === decision.contentHash)
      .map((part) => ({ file: file.name, signed: part.seal?.payload.systemNote.signedAtLocal })),
  );
  const first = from[0];
  return first?.signed === undefined
    ? `${role}: Es gilt die Fassung ${decision.contentHash.slice(0, 12)} …`
    : `${role}: Es gilt die Fassung vom ${formatLocalDateTime(first.signed)} (aus ${from.map((f) => f.file).join(', ')}).`;
}

function ConflictView({
  conflict,
  group,
  definition,
  fileName,
  onChoose,
}: {
  conflict: MergeConflict;
  group: MergeGroup;
  definition: FormDefinition | undefined;
  fileName: (sha: string) => string;
  onChoose: (decision: MergeDecision) => void;
}) {
  const fields = definition ? fieldsById(definition) : new Map();
  const role = conflict.role;
  return (
    <div className="conflict">
      <Banner
        message={{
          tone: 'error',
          text: MERGE_CONFLICT_MESSAGES[conflict.code],
          detail: conflict.detail,
        }}
      />
      {conflict.candidates.length > 0 && (
        <table className="compare">
          <thead>
            <tr>
              <th>Angabe</th>
              {conflict.candidates.map((candidate, i) => (
                <th key={candidate.contentHash}>
                  Fassung {i + 1}: {PART_STATUS[candidate.status]} am{' '}
                  {formatLocalDateTime(candidate.signedAtLocal)}
                  <span className="muted"> aus {candidate.sources.map(fileName).join(', ')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conflict.comparison.map((row) => {
              const field = fields.get(row.fieldId);
              return (
                <tr key={row.fieldId}>
                  <th scope="row">{field?.label ?? row.fieldId}</th>
                  {row.values.map((value, i) => (
                    <td key={conflict.candidates[i]?.contentHash ?? i}>
                      {field ? displayValue(field, value) : JSON.stringify(value)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {conflict.code === 'versionConflict' && role !== undefined && (
              <tr>
                <th scope="row" />
                {conflict.candidates.map((candidate) => (
                  <td key={candidate.contentHash}>
                    <button
                      type="button"
                      onClick={() =>
                        onChoose({
                          kind: 'chooseVersion',
                          questionnaireId: group.questionnaireId,
                          role,
                          contentHash: candidate.contentHash,
                        })
                      }
                    >
                      Diese Fassung gilt
                    </button>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
