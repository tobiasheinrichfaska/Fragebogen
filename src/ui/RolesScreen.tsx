// "Wer füllt jetzt aus?" — the overview of the questionnaire: every role with its state, what
// still blocks passing it on and what the recipient still misses.
import { useRef, useState } from 'react';
import {
  BLOCKER_MESSAGES,
  completenessGaps,
  PASS_ON_TEXTS,
  requirementText,
  transmissionBlockers,
} from '../logic/requirements';
import { roleStates, takeOverOffered, type RoleState, type Session } from '../logic/session';
import type { TransferOffer } from '../logic/transferLink';
import { Banner, Card, FormScope } from './common';
import { PasswordOption } from './PasswordOption';
import { TransferLinkSection } from './TransferLinkSection';

interface Props {
  session: Session;
  onEnter: (role: string) => void;
  onNewVersion: (role: string) => void;
  onReopen: (role: string) => void;
  onSaveInterim: () => void;
  onTakeOver: (file: File) => void;
  onPdf: (password: string | undefined) => void;
  onClose: () => void;
  onDiscard: () => void;
  transfer: TransferOffer;
  onLinkCopied: () => void;
}

const STATE_LABEL: Readonly<Record<RoleState['state'], string>> = {
  missing: 'noch offen',
  draft: 'begonnen, nicht abgeschlossen',
  sealed: 'abgeschlossen',
  signed: 'unterschrieben',
};

// A role that only prefills (Kanzlei in the SEPA-Mandat) is never "offen" (Tobias 2026-11-05).
const PREFILL_LABEL: Readonly<Record<RoleState['state'], string>> = {
  missing: 'nichts vorbelegt (freiwillig)',
  draft: 'Vorbelegung begonnen, nicht abgeschlossen',
  sealed: 'vorbelegt',
  signed: 'vorbelegt',
};

export function RolesScreen(props: Props) {
  const {
    session,
    onEnter,
    onNewVersion,
    onReopen,
    onSaveInterim,
    onTakeOver,
    onPdf,
    onClose,
    onDiscard,
    transfer,
    onLinkCopied,
  } = props;
  const input = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState<string | undefined>();
  const states = roleStates(session);
  const blockers = transmissionBlockers(session.questionnaire, session.form);
  const gaps = completenessGaps(session.questionnaire, session.form).filter(
    (gap) => !blockers.some((b) => b.code === gap.code && b.role === gap.role),
  );
  const anySealed = states.some((s) => s.state === 'sealed' || s.state === 'signed');
  const anyOpen = takeOverOffered(states);
  return (
    <>
      <Card title="Wer füllt jetzt aus?">
        <p className="muted">
          Wählen Sie Ihre Rolle. Ein abgeschlossener Teil lässt sich danach nur noch als neue
          Fassung ändern.
        </p>
        <ul className="roles">
          {states.map((state) => {
            const note = requirementText(session.form.definition, state.role, state.requirement);
            const { notNeeded } = state;
            return (
              <li key={state.role.id} className={notNeeded ? 'role muted' : 'role'}>
                <div>
                  <strong>{state.role.label}</strong>
                  <span className={`state state-${state.state}`}>
                    {(state.role.prefills === true ? PREFILL_LABEL : STATE_LABEL)[state.state]}
                    {state.version !== undefined ? ` (Fassung ${state.version})` : ''}
                  </span>
                  {note && <p className="muted">{note}</p>}
                </div>
                <div className="role-actions">
                  {(state.state === 'missing' || state.state === 'draft') && !notNeeded && (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => onEnter(state.role.id)}
                    >
                      {state.state === 'draft' ? 'Weitermachen' : `Ich bin: ${state.role.label}`}
                    </button>
                  )}
                  {(state.state === 'sealed' || state.state === 'signed') && (
                    <>
                      {state.canReopen && (
                        <button type="button" onClick={() => onReopen(state.role.id)}>
                          {state.state === 'signed'
                            ? 'Unterschrift zurücknehmen'
                            : 'Abschluss zurücknehmen'}
                        </button>
                      )}
                      <button type="button" onClick={() => onNewVersion(state.role.id)}>
                        Neue Fassung beginnen
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {anyOpen && (
          <div className="take-over">
            <p className="muted">
              Liegt schon ein anderer Fragebogen dieser Person vor (z. B. die Sofortmeldung oder die
              Meldung des Vormonats)? Seine Angaben lassen sich in die noch offenen Teile übernehmen
              – nur in leere Felder, und alles bleibt zu prüfen und zu unterschreiben.
            </p>
            <input
              ref={input}
              type="file"
              accept=".pdf,.json,application/pdf,application/json,image/*"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onTakeOver(file);
                event.target.value = '';
              }}
            />
            <button type="button" onClick={() => input.current?.click()}>
              Angaben aus einer anderen Datei übernehmen …
            </button>
          </div>
        )}
      </Card>
      <Card title="Stand">
        {blockers.length > 0 && (
          <Banner
            message={{
              tone: 'warning',
              text: PASS_ON_TEXTS.blocked,
              detail: blockers.map(
                (b) =>
                  `${BLOCKER_MESSAGES[b.code]}${b.detail.length ? ` (${b.detail.join(', ')})` : ''}`,
              ),
            }}
          />
        )}
        {blockers.length === 0 && gaps.length > 0 && (
          <Banner
            message={{
              tone: 'info',
              text: PASS_ON_TEXTS.gaps,
              detail: gaps.map(
                (g) =>
                  `${BLOCKER_MESSAGES[g.code]}${g.detail.length ? ` (${g.detail.join(', ')})` : ''}`,
              ),
            }}
          />
        )}
        {blockers.length === 0 && gaps.length === 0 && (
          <Banner
            message={{
              tone: 'success',
              text: PASS_ON_TEXTS.complete,
            }}
          />
        )}
        {anySealed && blockers.length === 0 && (
          <PasswordOption password={password} onChange={setPassword} />
        )}
        <div className="nav">
          <button type="button" onClick={onSaveInterim}>
            Zwischenstand speichern
          </button>
          <button
            type="button"
            className="primary"
            disabled={!anySealed || blockers.length > 0}
            onClick={() => onPdf(password)}
          >
            PDF erstellen
          </button>
          <button type="button" className="link" onClick={onClose}>
            Fragebogen schließen
          </button>
          <button type="button" className="link danger" onClick={onDiscard}>
            Fragebogen verwerfen
          </button>
        </div>
        <TransferLinkSection transfer={transfer} password={password} onLinkCopied={onLinkCopied} />
      </Card>
      <Card title="Gültigkeit und Grenzen">
        <FormScope definition={session.form.definition} />
      </Card>
    </>
  );
}
