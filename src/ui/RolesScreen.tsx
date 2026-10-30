// "Wer füllt jetzt aus?" — the overview of the questionnaire: every role with its state, what
// still blocks passing it on and what the recipient still misses.
import { useRef } from 'react';
import { BLOCKER_MESSAGES, completenessGaps, transmissionBlockers } from '../logic/requirements';
import { roleStates, type RoleState, type Session } from '../logic/session';
import { Banner, Card } from './common';

interface Props {
  session: Session;
  onEnter: (role: string) => void;
  onNewVersion: (role: string) => void;
  onReopen: (role: string) => void;
  onSaveInterim: () => void;
  onTakeOver: (file: File) => void;
  onPdf: () => void;
  onClose: () => void;
}

const STATE_LABEL: Readonly<Record<RoleState['state'], string>> = {
  missing: 'noch offen',
  draft: 'begonnen, nicht abgeschlossen',
  sealed: 'abgeschlossen',
  signed: 'unterschrieben',
};

function requirementText(state: RoleState): string | undefined {
  if (!state.role.requiredIf) return undefined;
  switch (state.requirement.reason) {
    case 'pending':
      return 'Nur nötig, wenn die Person am Tag ihrer Unterschrift minderjährig ist.';
    case 'minor':
      return 'Erforderlich: Die Person ist am Tag ihrer Unterschrift minderjährig.';
    case 'adult':
      return 'Nicht erforderlich: Die Person ist volljährig.';
    case 'ageUnknown':
      return 'Das Alter lässt sich nicht bestimmen – bitte das Geburtsdatum prüfen.';
    default:
      return undefined;
  }
}

export function RolesScreen(props: Props) {
  const { session, onEnter, onNewVersion, onReopen, onSaveInterim, onTakeOver, onPdf, onClose } =
    props;
  const input = useRef<HTMLInputElement>(null);
  const states = roleStates(session);
  const blockers = transmissionBlockers(session.questionnaire, session.form);
  const gaps = completenessGaps(session.questionnaire, session.form).filter(
    (gap) => !blockers.some((b) => b.code === gap.code && b.role === gap.role),
  );
  const anySealed = states.some((s) => s.state === 'sealed' || s.state === 'signed');
  const anyOpen = states.some((s) => s.state === 'missing' || s.state === 'draft');
  return (
    <>
      <Card title="Wer füllt jetzt aus?">
        <p className="muted">
          Wählen Sie Ihre Rolle. Ein abgeschlossener Teil lässt sich danach nur noch als neue
          Fassung ändern.
        </p>
        <ul className="roles">
          {states.map((state) => {
            const note = requirementText(state);
            const notNeeded =
              state.role.requiredIf && !state.requirement.required && state.state === 'missing';
            return (
              <li key={state.role.id} className={notNeeded ? 'role muted' : 'role'}>
                <div>
                  <strong>{state.role.label}</strong>
                  <span className={`state state-${state.state}`}>
                    {STATE_LABEL[state.state]}
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
                          Unterschrift zurücknehmen
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
              text: 'Noch nicht weitergeben:',
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
              text: 'Kann an die nächste Station weitergegeben werden. Für die Lohnabrechnung fehlt noch:',
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
              text: 'Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.',
            }}
          />
        )}
        <div className="nav">
          <button type="button" onClick={onSaveInterim}>
            Zwischenstand speichern
          </button>
          <button
            type="button"
            className="primary"
            disabled={!anySealed || blockers.length > 0}
            onClick={onPdf}
          >
            PDF erstellen
          </button>
          <button type="button" className="link" onClick={onClose}>
            Fragebogen schließen
          </button>
        </div>
      </Card>
    </>
  );
}
