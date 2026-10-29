// The interview of the role at the device: one step per screen (notice, question, summary).
// All rules live in the logic layer (session.ts, interview.ts); this only renders and dispatches.
import { useState } from 'react';
import { displayValue, editValue } from '../logic/display';
import { fieldsById, fieldsOfRole, roleOf } from '../logic/form';
import { interviewProgress } from '../logic/interview';
import type { InterviewStep } from '../logic/interview';
import { masterDataOf } from '../logic/masterData';
import { masterDataFragment } from '../logic/masterDataLink';
import { currentPart, latestSealed } from '../logic/questionnaire';
import {
  acknowledge,
  answer,
  currentStep,
  defer,
  goTo,
  nextStep,
  previousStep,
  stepsFor,
  summaryOf,
  type Session,
} from '../logic/session';
import { Banner, Card, Explainer, NoticeText, type BannerMessage } from './common';
import { isTextLike } from './fieldKinds';
import { FieldInput } from './FieldInput';

interface Props {
  session: Session;
  onSession: (session: Session) => void;
  onBanner: (message: BannerMessage | undefined) => void;
  onSign: () => void;
  onPause: () => void;
  onSaveInterim: () => void;
}

export function InterviewScreen(props: Props) {
  const { session, onPause } = props;
  const step = currentStep(session);
  const steps = stepsFor(session);
  const progress = interviewProgress(steps);
  const role =
    session.role === undefined ? undefined : roleOf(session.form.definition, session.role);
  if (!step || !role) return null;
  return (
    <div className="interview">
      <div className="interview-head">
        <p className="muted">
          {role.stationHeading} · {progress.answered} von etwa {progress.total} Fragen beantwortet
          {progress.deferred > 0 ? ` · ${progress.deferred} zurückgestellt` : ''}
        </p>
        <progress max={Math.max(progress.total, 1)} value={progress.answered} />
      </div>
      {step.kind === 'notice' && <NoticeStep {...props} step={step} />}
      {step.kind === 'question' && <QuestionStep key={step.key} {...props} step={step} />}
      {step.kind === 'summary' && <SummaryStep {...props} />}
      <p className="pause">
        <button type="button" className="link" onClick={onPause}>
          Unterbrechen – zur Übersicht (Angaben bleiben erhalten)
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
  nextDisabled,
}: {
  session: Session;
  onSession: (s: Session) => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const first = stepsFor(session)[0]?.key === session.stepKey;
  return (
    <div className="nav">
      <button type="button" disabled={first} onClick={() => onSession(previousStep(session))}>
        Zurück
      </button>
      <button
        type="button"
        className="primary"
        disabled={nextDisabled}
        onClick={onNext ?? (() => onSession(nextStep(session)))}
      >
        Weiter
      </button>
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

  const next = () => {
    let current = session;
    if (textLike) {
      const committed = commit(text.trim() === '' ? null : text);
      if (!committed) return;
      current = committed;
    }
    onSession(nextStep(current));
  };

  const choose = (raw: unknown) => {
    const committed = commit(raw);
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
          {field.question ?? field.label}
          {step.required ? '' : <span className="muted"> (freiwillig)</span>}
        </h2>
        {field.help !== undefined && <p className="help">{field.help}</p>}
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
        />
        {error !== undefined && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {step.state === 'deferred' && empty && (
          <p className="muted">Zurückgestellt mit „Weiß ich gerade nicht“.</p>
        )}
      </div>
      <Nav
        session={session}
        onSession={onSession}
        onNext={next}
        nextDisabled={step.required && empty && step.state !== 'deferred'}
      />
      {empty && (
        <p className="defer">
          <button type="button" className="link" onClick={putBack}>
            Weiß ich gerade nicht – später beantworten
          </button>
        </p>
      )}
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
  const visible = new Set(
    stepsFor(session).flatMap((step) => (step.kind === 'question' ? [step.fieldId] : [])),
  );
  const others = definition.roles.filter(
    (other) => other.id !== role && latestSealed(session.questionnaire, other.id),
  );
  const masterData = masterDataOf(definition, role, part.data);
  const link = Object.keys(masterData).length > 0 ? masterDataFragment(masterData) : undefined;

  return (
    <Card title="Zusammenfassung">
      {summary.missingRequired.length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Diese Pflichtangaben fehlen noch:',
            detail: summary.missingRequired.map(label),
          }}
        />
      )}
      {summary.missingNotices.length > 0 && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Bitte bestätigen Sie noch diese Hinweise:',
            detail: summary.missingNotices.map(
              (id) => definition.infoBlocks.find((b) => b.id === id)?.title ?? id,
            ),
          }}
        />
      )}
      {summary.deferred.length > 0 && (
        <Banner
          message={{
            tone: 'info',
            text: 'Zurückgestellt mit „Weiß ich gerade nicht“:',
            detail: summary.deferred.map(label),
          }}
        />
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
                    <button
                      type="button"
                      className="link"
                      onClick={() => onSession(goTo(session, `question:${field.id}`))}
                    >
                      ändern
                    </button>
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

      {link?.ok && (
        <div className="summary-section">
          <h3>Stammdaten für das nächste Mal</h3>
          <p className="muted">
            Legen Sie diesen Link als Lesezeichen an. Beim nächsten Fragebogen sind Firma und
            Betriebsnummer dann schon eingetragen. Der Link enthält keine Daten der beschäftigten
            Person.
          </p>
          <MasterDataLink fragment={link.fragment} onBanner={onBanner} />
        </div>
      )}

      <div className="nav">
        <button type="button" onClick={() => onSession(previousStep(session))}>
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

function MasterDataLink({
  fragment,
  onBanner,
}: {
  fragment: string;
  onBanner: (message: BannerMessage | undefined) => void;
}) {
  const url = `${location.href.split('#')[0] ?? ''}${fragment}`;
  return (
    <div className="master-link">
      <input
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        aria-label="Stammdaten-Link"
      />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url).then(
            () =>
              onBanner({
                tone: 'success',
                text: 'Link kopiert. Legen Sie ihn als Lesezeichen an.',
              }),
            () => onBanner({ tone: 'info', text: 'Bitte den Link markieren und kopieren.' }),
          );
        }}
      >
        Kopieren
      </button>
    </div>
  );
}
