// The interview of the role at the device: one step per screen (notice, question, summary).
// All rules live in the logic layer (session.ts, interview.ts); this only renders and dispatches.
import { useState } from 'react';
import { displayValue, editValue } from '../logic/display';
import { fillPlaceholders } from '../logic/display';
import { fieldStates, fieldsById, fieldsOfRole, roleOf } from '../logic/form';
import { fillingHints } from '../logic/hints';
import { interviewProgress } from '../logic/interview';
import type { InterviewStep } from '../logic/interview';
import { masterDataKeyFor, masterDataOf, mergedMasterData } from '../logic/masterData';
import { MASTER_DATA_LINK_MESSAGES, masterDataFragment } from '../logic/masterDataLink';
import { currentPart, latestSealed } from '../logic/questionnaire';
import {
  acknowledge,
  answer,
  currentStep,
  defer,
  editFromSummary,
  filledFromLink,
  fixedFields,
  goTo,
  leaveEmpty,
  nextChoice,
  nextStep,
  noticeFromSummary,
  outOfScopeOf,
  previousStep,
  skipToMissing,
  stepsFor,
  summaryOf,
  type Session,
} from '../logic/session';
import { Banner, Card, Explainer, NoticeText, type BannerMessage } from './common';
import { MasterDataLink } from './MasterDataLink';
import { isTextLike } from './fieldKinds';
import { FieldInput } from './FieldInput';
import { TableStep } from './TableStep';

interface Props {
  session: Session;
  onSession: (session: Session) => void;
  onBanner: (message: BannerMessage | undefined) => void;
  onSign: () => void;
  onPause: () => void;
  onSaveInterim: () => void;
  onDiscard: () => void;
}

export function InterviewScreen(props: Props) {
  const { session, onPause } = props;
  const step = currentStep(session);
  const steps = stepsFor(session);
  const progress = interviewProgress(steps);
  const role =
    session.role === undefined ? undefined : roleOf(session.form.definition, session.role);
  if (!step || !role) return null;
  const tableField =
    step.kind === 'question' ? fieldsById(session.form.definition).get(step.fieldId) : undefined;
  return (
    <div className="interview">
      <div className="interview-head">
        <p className="muted">
          {role.stationHeading} · {progress.answered} von etwa {progress.total} Fragen beantwortet
          {progress.deferred > 0 ? ` · ${progress.deferred} zurückgestellt` : ''}
        </p>
        <progress max={Math.max(progress.total, 1)} value={progress.answered} />
      </div>
      {outOfScopeOf(session).length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: `Für diesen Sonderfall ist der Fragebogen nicht gedacht – er weiß nicht, welche Angaben dafür nötig sind. Abschließen und Weitergeben sind gesperrt; bitte fragen Sie bei der Stelle nach, die den Fragebogen bekommt (hier: ${session.form.definition.recipient.label}).`,
            detail: outOfScopeOf(session),
          }}
        />
      )}
      {step.kind === 'notice' && <NoticeStep {...props} step={step} />}
      {step.kind === 'question' && tableField?.type === 'repeatGroup' && (
        <TableStep
          key={step.key}
          session={session}
          field={tableField}
          step={step}
          onSession={props.onSession}
        />
      )}
      {step.kind === 'question' && tableField?.type !== 'repeatGroup' && (
        <QuestionStep key={step.key} {...props} step={step} />
      )}
      {step.kind === 'summary' && <SummaryStep {...props} />}
      <p className="pause">
        {step.kind !== 'summary' && (
          <button
            type="button"
            className="link"
            onClick={() => props.onSession(goTo(session, 'summary'))}
          >
            Zur Zusammenfassung – alle Angaben ansehen und ändern
          </button>
        )}
        <button type="button" className="link" onClick={onPause}>
          Unterbrechen – zur Übersicht (Angaben bleiben erhalten)
        </button>
        <button type="button" className="link danger" onClick={props.onDiscard}>
          Fragebogen verwerfen
        </button>
      </p>
    </div>
  );
}

function NoticeStep({
  session,
  onSession,
  step,
}: Props & { step: Extract<InterviewStep, { kind: 'notice' }> }) {
  const block = session.form.definition.infoBlocks.find((b) => b.id === step.infoBlockId);
  const role = session.role ?? '';
  if (!block) return null;
  const confirmed = (session.acknowledged[role] ?? []).includes(block.id);
  const label =
    block.acknowledgement === 'paperHandout'
      ? 'Ich habe diesen Hinweis auf Papier erhalten.'
      : 'Ich habe den Hinweis gelesen.';
  return (
    <Card title={block.title}>
      <NoticeText text={block.text} />
      <p className="muted">Stand: {block.asOf.split('-').reverse().join('.')}</p>
      <Explainer path={block.explainer} />
      <label className="confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onSession(acknowledge(session, block.id, event.target.checked))}
        />
        {label}
      </label>
      {block.acknowledgement === 'paperHandout' && !confirmed && (
        <p className="muted">
          Ihr Arbeitgeber händigt Ihnen diesen Hinweis auf Papier aus. Bestätigen Sie erst, wenn Sie
          ihn erhalten haben; vorher können Sie trotzdem weitermachen.
        </p>
      )}
      <Nav session={session} onSession={onSession} />
    </Card>
  );
}

function Nav({
  session,
  onSession,
  onNext,
  onSkip,
  onDefer,
  nextDisabled,
}: {
  session: Session;
  onSession: (s: Session) => void;
  onNext?: () => void;
  /** Like onNext, but ends at the next missing answer (the step commits its input first). */
  onSkip?: () => void;
  /** "Vorerst überspringen" — only while the question has no answer. */
  onDefer?: () => void;
  nextDisabled?: boolean;
}) {
  const first = stepsFor(session)[0]?.key === session.stepKey;
  const choice = nextChoice(session);
  return (
    <div className="nav">
      <button
        type="button"
        className="back"
        disabled={first}
        onClick={() => onSession(previousStep(session))}
      >
        Zurück
      </button>
      {onDefer && (
        <button type="button" onClick={onDefer}>
          Vorerst überspringen
        </button>
      )}
      <button
        type="button"
        className="primary"
        disabled={nextDisabled}
        onClick={onNext ?? (() => onSession(nextStep(session)))}
      >
        {choice.backToSummary ? 'Zurück zur Zusammenfassung' : 'Weiter'}
      </button>
      {choice.skip && (
        <button
          type="button"
          disabled={nextDisabled}
          onClick={onSkip ?? (() => onSession(skipToMissing(session)))}
        >
          {choice.skip.kind === 'summary' ? 'Zur Zusammenfassung' : 'Zur nächsten fehlenden Angabe'}
        </button>
      )}
    </div>
  );
}

function QuestionStep({
  session,
  onSession,
  onBanner,
  step,
}: Props & { step: Extract<InterviewStep, { kind: 'question' }> }) {
  const field = fieldsById(session.form.definition).get(step.fieldId);
  const part =
    session.role === undefined ? undefined : currentPart(session.questionnaire, session.role);
  const value = field ? part?.data[field.id] : undefined;
  const [text, setText] = useState(field ? editValue(field, value) : '');
  const [error, setError] = useState<string | undefined>();
  if (!field) return null;
  const inputId = `field-${field.id}`;
  const textLike = isTextLike(field);
  const empty = textLike ? text.trim() === '' : value === undefined || value === null;

  const commit = (raw: unknown): Session | undefined => {
    const result = answer(session, field.id, raw);
    if (!result.ok) {
      setError(result.message);
      return undefined;
    }
    setError(undefined);
    onBanner(
      result.warnings.length > 0 ? { tone: 'warning', text: result.warnings.join(' ') } : undefined,
    );
    return result.session;
  };

  const leave = (move: (s: Session) => Session) => {
    let current = session;
    if (textLike) {
      const committed = commit(text.trim() === '' ? null : text);
      if (!committed) return;
      current = committed;
    }
    onSession(move(current));
  };
  const next = () => leave(nextStep);

  // A yes/no or single choice is the whole answer: it moves on at once (back is one click away).
  // Several options stay on the step until "Weiter".
  const choose = (raw: unknown) => {
    const committed = commit(raw);
    if (!committed) return;
    onSession(field.type === 'multiChoice' ? committed : nextStep(committed));
  };

  const quickAnswer = (raw: string | null) => {
    const committed = commit(raw);
    if (committed) onSession(nextStep(committed));
  };

  const fields = fieldsById(session.form.definition);
  const said = (text: string) =>
    fillPlaceholders(
      text,
      (id) => fields.get(id),
      (id) => part?.data[id],
    );

  // A voluntary yes/no or single choice can be taken back; a required one only changed.
  const clearable =
    !step.required &&
    !textLike &&
    (field.type === 'boolean' || field.type === 'choice') &&
    value !== undefined &&
    value !== null;
  const clear = () => {
    const committed = commit(null);
    if (committed) onSession(committed);
  };

  const putBack = () => {
    const result = defer(session, field.id);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSession(nextStep(result.session));
  };

  return (
    <Card>
      <div className={`question level-${Math.min(step.level, 3)}`}>
        <h2 id={`${inputId}-label`}>
          {said(field.question ?? field.label)}
          {step.required ? '' : <span className="muted"> (freiwillig)</span>}
        </h2>
        {field.help !== undefined && <p className="help">{said(field.help)}</p>}
        {filledFromLink(session, field.id) && (
          <p className="link-note">Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.</p>
        )}
        <Explainer path={field.explainer} />
        <FieldInput
          field={field}
          id={inputId}
          value={value}
          text={text}
          onText={(t) => {
            setText(t);
            setError(undefined);
          }}
          onChoose={choose}
          onSubmit={next}
          context={{ definition: session.form.definition, data: part?.data ?? {} }}
        />
        {clearable && (
          <p className="clear-choice">
            <button type="button" className="link" onClick={clear}>
              Auswahl aufheben
            </button>
          </p>
        )}
        {field.quickAnswers && (
          <div className="quick-answers">
            {field.quickAnswers.map((quick) => (
              <button key={quick.label} type="button" onClick={() => quickAnswer(quick.value)}>
                {quick.label}
              </button>
            ))}
          </div>
        )}
        {error !== undefined && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {step.state === 'deferred' && empty && (
          <p className="muted">Übersprungen – Sie können die Frage jetzt beantworten.</p>
        )}
      </div>
      <Nav
        session={session}
        onSession={onSession}
        onNext={next}
        onSkip={() => leave(skipToMissing)}
        {...(empty && step.state !== 'deferred' ? { onDefer: putBack } : {})}
        nextDisabled={step.required && empty && step.state !== 'deferred'}
      />
    </Card>
  );
}

function SummaryStep({ session, onSession, onBanner, onSign, onSaveInterim }: Props) {
  const summary = summaryOf(session);
  const role = session.role;
  const definition = session.form.definition;
  const part = role === undefined ? undefined : currentPart(session.questionnaire, role);
  if (!summary || role === undefined || !part) return null;
  const fields = fieldsById(definition);
  const label = (id: string) => fields.get(id)?.label ?? id;
  const fixed = fixedFields(session);
  const states = fieldStates(definition, role, part.data);
  const visible = new Set([
    ...stepsFor(session).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : [])),
    ...[...fixed.keys()].filter((id) => states.get(id)?.visible === true),
  ]);
  const others = definition.roles.filter(
    (other) => other.id !== role && latestSealed(session.questionnaire, other.id),
  );
  // The link for next time keeps what the loaded link held for other forms (Tobias 2026-11-03).
  const own = masterDataOf(definition, role, part.data);
  const masterData = mergedMasterData(session.masterData?.record, definition, role, part.data);
  // Opened next time, it begins a new questionnaire of this form (Tobias 2026-11-03).
  const link =
    Object.keys(own).length > 0 ? masterDataFragment(masterData, definition.id) : undefined;
  const ownLabels = fieldsOfRole(definition, role).flatMap((field) => {
    const key = masterDataKeyFor(field, (id) => part.data[id] ?? null);
    return key !== undefined && Object.hasOwn(own, key.key) ? [key.label] : [];
  });
  const fromOthers = Object.keys(masterData).filter((key) => !Object.hasOwn(own, key)).length;
  // Missing required answers stand at the top with their link; "Übersprungen" keeps the rest.
  const voluntaryDeferred = summary.deferred.filter((id) => !summary.missingRequired.includes(id));
  const checks = fillingHints(session.questionnaire, definition, role);

  return (
    <Card title="Zusammenfassung">
      {summary.missingRequired.length > 0 && (
        <div className="skipped missing" role="group" aria-label="Fehlende Pflichtangaben">
          <p>
            <strong>Diese Pflichtangaben fehlen noch:</strong>
          </p>
          <ul>
            {summary.missingRequired.map((id) => (
              <li key={id}>
                <span>{label(id)}</span>
                <button
                  type="button"
                  className="link"
                  onClick={() => onSession(editFromSummary(session, id))}
                >
                  beantworten
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {checks.length > 0 && (
        <div className="skipped checks" role="group" aria-label="Bitte prüfen">
          <p>
            <strong>Bitte prüfen:</strong> Das kann richtig sein; abschließen können Sie trotzdem.
          </p>
          <ul>
            {checks.map((check) => {
              const target = check.fields.find((id) => visible.has(id));
              return (
                <li key={check.id}>
                  <span>
                    {check.message}
                    {check.detail.length > 0 && (
                      <span className="muted"> {check.detail.join(' ')}</span>
                    )}
                  </span>
                  {target !== undefined && (
                    <button
                      type="button"
                      className="link"
                      onClick={() => onSession(editFromSummary(session, target))}
                    >
                      ändern
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {summary.outsideValidity && (
        <Banner
          message={{
            tone: 'warning',
            text: `Der Stichtag ${summary.outsideValidity.value} liegt außerhalb der Gültigkeit dieser Formularfassung (sie ${summary.outsideValidity.validity}). So lässt sich nicht unterschreiben; bitte die Fassung verwenden, die für diesen Tag gilt.`,
          }}
        />
      )}
      {summary.missingNotices.length > 0 && (
        <div
          className="skipped notices-missing"
          role="group"
          aria-label="Hinweise ohne Bestätigung"
        >
          <p>
            <strong>Bitte bestätigen Sie noch diese Hinweise:</strong>
          </p>
          <ul>
            {summary.missingNotices.map((id) => (
              <li key={id}>
                <span>{definition.infoBlocks.find((b) => b.id === id)?.title ?? id}</span>
                <button
                  type="button"
                  className="link"
                  onClick={() => onSession(noticeFromSummary(session, id))}
                >
                  ansehen und bestätigen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {voluntaryDeferred.length > 0 && (
        <div className="skipped" role="group" aria-label="Übersprungene Fragen">
          <p>
            <strong>Übersprungen:</strong> Beantworten Sie diese freiwilligen Fragen jetzt oder
            lassen Sie sie leer.
          </p>
          <ul>
            {voluntaryDeferred.map((id) => {
              const required = summary.missingRequired.includes(id);
              return (
                <li key={id}>
                  <span>
                    {label(id)}
                    {required && <span className="muted"> (Pflicht)</span>}
                  </span>
                  <button
                    type="button"
                    className="link"
                    onClick={() => onSession(editFromSummary(session, id))}
                  >
                    beantworten
                  </button>
                  {!required && (
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        const result = leaveEmpty(session, id);
                        if (result.ok) onSession(result.session);
                        else onBanner({ tone: 'error', text: result.message });
                      }}
                    >
                      leer lassen
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {summary.inactive.length > 0 && (
        <Banner
          message={{
            tone: 'info',
            text: 'Diese Angaben werden nicht mit unterschrieben, weil ihre Voraussetzung nicht mehr gilt. Sie bleiben bis zur Unterschrift gespeichert:',
            detail: summary.inactive.map((entry) => `${label(entry.fieldId)} (${entry.reason})`),
          }}
        />
      )}

      {definition.sections.map((section) => {
        const own = section.fields.filter((f) => f.role === role && visible.has(f.id));
        if (own.length === 0) return null;
        return (
          <div key={section.id} className="summary-section">
            <h3>{section.title}</h3>
            <dl>
              {own.map((field) => (
                <div key={field.id} className="summary-row">
                  <dt>{field.label}</dt>
                  <dd>{displayValue(field, part.data[field.id])}</dd>
                  <dd>
                    {fixed.has(field.id) ? (
                      <span className="muted">festgelegt von: {fixed.get(field.id)}</span>
                    ) : (
                      <button
                        type="button"
                        className="link"
                        onClick={() => onSession(editFromSummary(session, field.id))}
                      >
                        ändern
                      </button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      {others.map((other) => {
        const sealed = latestSealed(session.questionnaire, other.id);
        const otherFields = fieldsOfRole(definition, other.id).filter(
          (f) => sealed && f.id in sealed.data,
        );
        if (!sealed || otherFields.length === 0) return null;
        return (
          <div key={other.id} className="summary-section other-role">
            <h3>Angaben: {other.label} (abgeschlossen, nur lesen)</h3>
            <p className="muted">
              Mit Ihrem Abschluss bestätigen Sie, diese Fassung erhalten zu haben.
            </p>
            <dl>
              {otherFields.map((field) => (
                <div key={field.id} className="summary-row">
                  <dt>{field.label}</dt>
                  <dd>{displayValue(field, sealed.data[field.id])}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      {link && (
        <div className="summary-section">
          <h3>Stammdaten für das nächste Mal</h3>
          {link.ok ? (
            <>
              <p className="muted">
                Legen Sie diesen Link als Lesezeichen an. Er beginnt beim nächsten Mal gleich einen
                neuen Fragebogen „{definition.title}“, und diese Angaben zum Betrieb sind dann schon
                eingetragen: {ownLabels.join(', ')}.
                {fromOthers > 0
                  ? ` Weitere ${String(fromOthers)} Angaben aus Ihrem bisherigen Link bleiben erhalten.`
                  : ''}{' '}
                Der Link enthält keine Daten der beschäftigten Person.
              </p>
              <MasterDataLink url={`${location.href.split('#')[0] ?? ''}${link.fragment}`} />
            </>
          ) : (
            <p className="field-error" role="alert">
              Für diese Angaben lässt sich kein Stammdaten-Link erzeugen:{' '}
              {MASTER_DATA_LINK_MESSAGES[link.issue]}
            </p>
          )}
        </div>
      )}

      <div className="nav">
        <button type="button" className="back" onClick={() => onSession(previousStep(session))}>
          Zurück
        </button>
        <button type="button" onClick={onSaveInterim}>
          Zwischenstand speichern
        </button>
        <button type="button" className="primary" disabled={!summary.readyToSign} onClick={onSign}>
          Weiter zum Abschluss
        </button>
      </div>
    </Card>
  );
}
