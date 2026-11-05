// App frame: start, overview ("Wer füllt jetzt aus?"), interview, signature, completion. All state
// is in memory (session.ts); files are the way out. Only the hosted app keeps unsaved changes in
// this browser for a while (logic/resume.ts). Rules come from the logic layer.
import { useEffect, useMemo, useRef, useState } from 'react';
import { APP_NAME, APP_VERSION } from '../appInfo';
import { APP_CONFIG } from '../config';
import { BUNDLED_FORMS, DRAFT_PREVIEW } from '../io/bundledForms';
import { InputTracker, newQuestionnaireId } from '../io/environment';
import { handOut } from '../io/files';
import { clearResume, loadResume, saveResume } from '../io/resumeStore';
import { buildPackage, packageText } from '../logic/dataPackage';
import type { Inbox } from '../logic/kanzlei';
import { fileNameFor } from '../logic/fileNames';
import type { FormRegistry, RegisteredForm } from '../logic/formRegistry';
import {
  MASTER_DATA_LINK_MESSAGES,
  masterDataLinkBase,
  parseMasterDataFragment,
  type ParsedMasterDataLink,
} from '../logic/masterDataLink';
import {
  resumeAction,
  resumeAllowed,
  resumePackageText,
  resumeRecord,
  type ResumeRead,
  type ResumeRecord,
} from '../logic/resume';
import {
  enterRole,
  fillMasterData,
  leaveRole,
  markSaved,
  reopen,
  startNewVersion,
  startSession,
  takeOver,
  type Session,
  type SessionResult,
} from '../logic/session';
import { Banner, Card, type BannerMessage } from './common';
import { DoneScreen } from './DoneScreen';
import { InterviewScreen } from './InterviewScreen';
import { KanzleiScreen } from './KanzleiScreen';
import { MasterDataLinkForm } from './MasterDataLinkForm';
import { RolesScreen } from './RolesScreen';
import { SignatureScreen } from './SignatureScreen';
import { StartScreen } from './StartScreen';
import {
  createPdf,
  fromPackageText,
  fromTransferLink,
  openAnyFile,
  type OpenResult,
} from './pdfActions';
import { ResumeOffer } from './ResumeOffer';
import { masterDataRolesText } from '../logic/masterData';
import { transferOffer } from '../logic/transferLink';
import { describeRevised } from '../logic/validity';

type Screen =
  | { kind: 'start' }
  | { kind: 'roles' }
  | { kind: 'interview' }
  | { kind: 'sign' }
  | { kind: 'done'; role: string }
  | { kind: 'kanzlei' }
  | { kind: 'stammdaten' };

const tracker = new InputTracker();

const RESUME_NOTES: Partial<Record<ResumeRead['kind'], BannerMessage>> = {
  expired: {
    tone: 'info',
    text: 'Ein angefangener Fragebogen war länger als 7 Tage in diesem Browser gemerkt und wurde gelöscht.',
  },
  outdated: {
    tone: 'info',
    text: 'Ein angefangener Fragebogen aus einer älteren Fassung der App ließ sich nicht übernehmen und wurde gelöscht. Gespeicherte Dateien sind davon nicht betroffen.',
  },
  damaged: {
    tone: 'warning',
    text: 'Ein angefangener Fragebogen in diesem Browser war beschädigt und wurde gelöscht. Gespeicherte Dateien sind davon nicht betroffen.',
  },
};

/** A questionnaire prepared by a start link of the test area, opened in its interview. */
export interface PreparedStart {
  title: string;
  /** The interview of the open role, the overview „Wer füllt jetzt aus?“ or the Kanzlei station. */
  screen: 'interview' | 'overview' | 'kanzlei';
  session?: Session;
  /** The Kanzlei station's prepared inputs. */
  inbox?: Inbox;
}

const START_SCREENS = { interview: 'interview', overview: 'roles', kanzlei: 'kanzlei' } as const;

const START_TEXTS: Readonly<Record<PreparedStart['screen'], string>> = {
  interview:
    'Die übrigen Angaben sind schon ausgefüllt – Sie beginnen bei der Frage, um die es im Test geht.',
  overview: 'Die Teile sind schon ausgefüllt und abgeschlossen.',
  kanzlei: 'Die Eingänge sind schon eingelesen.',
};

export function App({ start }: { start?: PreparedStart }) {
  if (!BUNDLED_FORMS.ok) {
    return (
      <main className="shell">
        <Banner
          message={{
            tone: 'error',
            text: 'Die mitgelieferten Formulare sind fehlerhaft. Bitte eine andere Version der App verwenden.',
            detail: BUNDLED_FORMS.issues.map((issue) => `${issue.path}: ${issue.message}`),
          }}
        />
      </main>
    );
  }
  return <Workspace registry={BUNDLED_FORMS.registry} {...(start ? { start } : {})} />;
}

/** The banner a fresh start shows: start point, bookmark link that opened a form, or a link error. */
function startBanner(
  start: PreparedStart | undefined,
  remembered: ParsedMasterDataLink,
  linked: RegisteredForm | undefined,
): BannerMessage | undefined {
  if (start) {
    return {
      tone: 'info',
      text: `Vorbereitet: ${start.title}. ${START_TEXTS[start.screen]}`,
    };
  }
  if (!remembered.ok) {
    return {
      tone: 'warning',
      text: `Stammdaten-Link: ${MASTER_DATA_LINK_MESSAGES[remembered.issue]}`,
      detail: remembered.detail,
    };
  }
  if (remembered.form === undefined) return undefined;
  return linked
    ? {
        tone: 'info',
        text: `Neuer Fragebogen „${linked.definition.title}“ aus Ihrem Lesezeichen. Die Angaben aus dem Link stehen schon im Teil ${masterDataRolesText(linked.definition)}.`,
      }
    : {
        tone: 'warning',
        text: `Ihr Lesezeichen soll einen neuen Fragebogen „${remembered.form}“ öffnen; diese Fassung der App enthält ihn nicht. Bitte wählen Sie unten selbst.`,
      };
}

function Workspace({ registry, start }: { registry: FormRegistry; start?: PreparedStart }) {
  // A link that passes a questionnaire on opens it like a file read in (Tobias 2026-11-05).
  const transferred = useMemo(
    () => (start ? undefined : fromTransferLink(location.hash, registry)),
    [registry, start],
  );
  const received = transferred?.kind === 'session' ? transferred.session : undefined;
  const remembered = useMemo(() => parseMasterDataFragment(location.hash), []);
  // A bookmark link that names a form opens a new questionnaire of its newest version at once.
  const linked = useMemo(
    () =>
      !start && remembered.ok && remembered.form ? registry.latest(remembered.form) : undefined,
    [registry, remembered, start],
  );
  const [session, setSession] = useState<Session | undefined>(
    () =>
      start?.session ??
      received ??
      (linked ? startSession(linked, newQuestionnaireId()) : undefined),
  );
  const [screen, setScreen] = useState<Screen>(
    start
      ? { kind: START_SCREENS[start.screen] }
      : { kind: received || linked ? 'roles' : 'start' },
  );
  // An interrupted questionnaire of this browser (hosted app only); read once at the start.
  const storage = useMemo(() => resumeAllowed(location.protocol), []);
  const [resumeRead] = useState<ResumeRead>(() =>
    storage ? loadResume(new Date().toISOString()) : { kind: 'none' },
  );
  const [offer, setOffer] = useState<ResumeRecord | undefined>(() =>
    resumeRead.kind === 'found' ? resumeRead.record : undefined,
  );
  const [resumeNote, setResumeNote] = useState<BannerMessage | undefined>(
    () => RESUME_NOTES[resumeRead.kind],
  );
  // QR codes read so far from photos of a print-out, until all parts are there.
  const [collected, setCollected] = useState<Uint8Array[]>([]);
  const [banner, setBanner] = useState<BannerMessage | undefined>(
    () => transferred?.message ?? startBanner(start, remembered, linked),
  );

  // The answers of a link stay out of the address bar once read: a reload does not read them again.
  useEffect(() => {
    if (transferred) history.replaceState(null, '', location.pathname + location.search);
  }, [transferred]);

  useEffect(() => {
    tracker.start();
    return () => tracker.stop();
  }, []);

  useEffect(() => {
    if (resumeRead.kind !== 'none' && resumeRead.kind !== 'found') clearResume();
  }, [resumeRead]);

  const storageRefused = useRef(false);
  // Keeps unsaved changes in this browser, written at once on every change (a delayed save lost the
  // last answer when the page closed, 2026-11-04); a PDF, an interim file, closing or discarding
  // removes them. Only the questionnaire is written — the form comes from the app by its hash.
  useEffect(() => {
    const action = resumeAction({ allowed: storage, offerOpen: offer !== undefined, session });
    if (action === 'none') return;
    if (action === 'clear' || !session) {
      clearResume();
      return;
    }
    const carried = registry.byHash(session.form.definitionHash) !== undefined;
    const saved = saveResume(
      resumeRecord({
        title: session.form.definition.title,
        definitionHash: session.form.definitionHash,
        questionnaire: session.questionnaire,
        ...(carried ? {} : { definition: session.form.definition }),
        savedAt: new Date().toISOString(),
      }),
    );
    if (!saved && !storageRefused.current) {
      // Said once, after this render: the browser refuses (full, blocked) and keeps nothing.
      storageRefused.current = true;
      queueMicrotask(() =>
        setResumeNote({
          tone: 'warning',
          text: 'Dieser Browser kann den Fragebogen nicht für später merken (zum Beispiel bei gesperrtem Speicher). Bitte bei einer Unterbrechung „Zwischenstand speichern“.',
        }),
      );
    }
  }, [session, offer, storage, registry]);

  useEffect(() => {
    if (!session?.dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [session?.dirty]);

  const apply = (result: SessionResult, next: Screen): boolean => {
    if (!result.ok) {
      setBanner({ tone: 'error', text: result.message, detail: result.detail });
      return false;
    }
    setSession(result.session);
    setScreen(next);
    setBanner(
      result.warnings.length > 0 ? { tone: 'warning', text: result.warnings.join(' ') } : undefined,
    );
    return true;
  };

  const startNew = (form: RegisteredForm) => {
    setSession(startSession(form, newQuestionnaireId()));
    setScreen({ kind: 'roles' });
    setBanner(undefined);
  };

  /** Fills the link's master data into the role just entered; later answers fill the rest. */
  const withLink = (next: Session): { session: Session; info?: BannerMessage } => {
    if (!remembered.ok || !remembered.data) return { session: next };
    const filled = fillMasterData(next, remembered.data);
    if (!filled.ok) return { session: next };
    if (filled.applied.length === 0 && filled.skipped.length === 0) {
      return { session: filled.session };
    }
    return {
      session: filled.session,
      info: {
        tone: filled.skipped.length > 0 ? 'warning' : 'info',
        text:
          filled.applied.length > 0
            ? 'Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.'
            : 'Stammdaten aus Ihrem Lesezeichen konnten nicht übernommen werden.',
        detail: filled.skipped,
      },
    };
  };

  const enter = (role: string) => {
    if (!session) return;
    const result = enterRole(session, role);
    if (!result.ok) return apply(result, screen);
    tracker.reset();
    const { session: next, info } = withLink(result.session);
    setSession(next);
    setScreen({ kind: 'interview' });
    setBanner(
      info ??
        (result.warnings.length > 0
          ? { tone: 'info', text: result.warnings.join(' ') }
          : undefined),
    );
  };

  /** A new version or a reopened part: the link fills what is still empty there as well. */
  const continueRole = (result: SessionResult) => {
    if (!result.ok) return apply(result, screen);
    tracker.reset();
    const { session: next, info } = withLink(result.session);
    setSession(next);
    setScreen({ kind: 'interview' });
    setBanner(
      info ??
        (result.warnings.length > 0
          ? { tone: 'warning', text: result.warnings.join(' ') }
          : undefined),
    );
  };

  const saveInterim = () => {
    if (!session) return;
    const { questionnaire, form } = session;
    const file = handOut(
      fileNameFor(form.definition.id, questionnaire.questionnaireId, 'interim'),
      packageText(buildPackage(questionnaire, form)),
      'application/json',
    );
    setSession(markSaved(session));
    setBanner({
      file,
      tone: 'success',
      text: 'Zwischenstand gespeichert. Die Datei enthält alle Angaben – bitte sicher aufbewahren.',
    });
  };

  /** Reads a PDF, interim file or photo; photos of a print-out are collected until complete. */
  const readOpened = async (file: File): Promise<OpenResult | undefined> => {
    const { result: opened } = await openAnyFile(file, registry, collected);
    if (opened.kind === 'partial') {
      setCollected(opened.collected);
      setBanner(opened.message);
      return undefined;
    }
    setCollected([]);
    if (opened.kind === 'error') {
      setBanner(opened.message);
      return undefined;
    }
    return opened;
  };

  const open = async (file: File) => {
    const opened = await readOpened(file);
    if (opened?.kind !== 'session') return;
    setSession(opened.session);
    setScreen({ kind: 'roles' });
    setBanner(opened.message);
  };

  const takeOverFile = async (file: File) => {
    if (!session) return;
    const opened = await readOpened(file);
    if (opened?.kind !== 'session') return;
    const result = takeOver(session, {
      questionnaire: opened.session.questionnaire,
      form: opened.session.form,
      altered: opened.altered,
    });
    if (!result.ok) return setBanner({ tone: 'error', text: result.message });
    setSession(result.session);
    setBanner({
      tone: result.applied === 0 ? 'warning' : 'info',
      text:
        result.applied === 0
          ? `Aus „${opened.session.form.definition.title}“ ließ sich nichts übernehmen.`
          : `Angaben aus „${opened.session.form.definition.title}“ übernommen. Bitte im Interview alles prüfen – unterschrieben ist damit noch nichts.`,
      detail: result.lines,
    });
  };

  const pdf = async () => {
    if (!session) return;
    const result = await createPdf(session);
    setSession(result.session);
    setBanner(result.message);
  };

  // Always asked (second test report, Tobias 2026-11-01: "hier kam keine Warnmeldung").
  const clearAll = () => {
    if (
      !confirm(
        'Alle Daten auf diesem Gerät löschen?\n\nDer geöffnete Fragebogen und alle Angaben verschwinden aus der App. Das lässt sich nicht rückgängig machen. Bereits gespeicherte Dateien bleiben erhalten.',
      )
    ) {
      return;
    }
    setSession(undefined);
    clearResume();
    // Drop the master-data fragment as well and start from a clean page.
    location.replace(location.pathname + location.search);
  };

  const close = () => {
    if (
      session?.dirty &&
      !confirm('Nicht gespeicherte Angaben gehen verloren. Fragebogen schließen?')
    ) {
      return;
    }
    setSession(undefined);
    setScreen({ kind: 'start' });
    setBanner(undefined);
  };

  // "Fragebogen verwerfen": always asked, whatever was saved; files already downloaded stay.
  const discard = () => {
    if (
      !confirm(
        'Fragebogen endgültig verwerfen?\n\nAlle Angaben dieses Fragebogens werden aus der App gelöscht. Das lässt sich nicht rückgängig machen. Bereits gespeicherte Dateien (PDF oder Zwischenstand) bleiben erhalten.',
      )
    ) {
      return;
    }
    setSession(undefined);
    setScreen({ kind: 'start' });
    setBanner({ tone: 'success', text: 'Der Fragebogen wurde verworfen.' });
  };

  const continueResumed = () => {
    if (!offer) return;
    const now = new Date().toISOString();
    const text = resumePackageText(offer, (hash) => registry.byHash(hash)?.definition);
    if (text === undefined) {
      clearResume();
      setOffer(undefined);
      setBanner({
        tone: 'error',
        text: `Der angefangene Fragebogen „${offer.title}“ lässt sich nicht fortsetzen: Diese Fassung der App enthält sein Formular nicht mehr. Er wurde aus dem Browser gelöscht.`,
      });
      return;
    }
    const opened = fromPackageText(
      text,
      registry,
      { local: now, utc: now, source: 'same-device' },
      ['Angefangener Fragebogen aus diesem Browser fortgesetzt.'],
    );
    setOffer(undefined);
    setResumeNote(undefined);
    if (opened.kind !== 'session') {
      clearResume();
      setBanner(opened.message);
      return;
    }
    // Still saved nowhere else: kept in the browser until a PDF or an interim file exists.
    setSession({ ...opened.session, dirty: true });
    setScreen({ kind: 'roles' });
    setBanner(opened.message);
  };

  const deleteResumed = () => {
    if (
      !confirm(
        'Den angefangenen Fragebogen aus diesem Browser löschen?\n\nDas lässt sich nicht rückgängig machen. Bereits gespeicherte Dateien bleiben erhalten.',
      )
    ) {
      return;
    }
    clearResume();
    setOffer(undefined);
    setResumeNote(undefined);
    setBanner({ tone: 'success', text: 'Der angefangene Fragebogen wurde gelöscht.' });
  };

  const role = session?.role;
  const roleLabel = session?.form.definition.roles.find((r) => r.id === role)?.label;

  return (
    <main className="shell">
      {DRAFT_PREVIEW && (
        <Banner
          message={{
            tone: 'warning',
            text: 'Vorschau mit Formular-Entwürfen zur Prüfung – bitte keine echten Daten eingeben.',
          }}
        />
      )}
      <header className="app-header">
        <div>
          <h1>{session ? session.form.definition.title : APP_NAME}</h1>
          {session && (
            <p className="muted">
              Fragebogen {session.questionnaire.questionnaireId.slice(0, 8)} · Formular{' '}
              {session.form.definition.version}
              {roleLabel ? ` · Sie füllen aus als: ${roleLabel}` : ''}
            </p>
          )}
        </div>
      </header>

      {offer && (
        <ResumeOffer record={offer} onContinue={continueResumed} onDelete={deleteResumed} />
      )}
      {resumeNote && <Banner message={resumeNote} onClose={() => setResumeNote(undefined)} />}
      {banner && <Banner message={banner} onClose={() => setBanner(undefined)} />}

      {screen.kind === 'start' && (
        <StartScreen
          registry={registry}
          onNew={startNew}
          onOpen={(f) => void open(f)}
          onKanzlei={() => {
            setBanner(undefined);
            setScreen({ kind: 'kanzlei' });
          }}
          onMasterDataLink={() => {
            setBanner(undefined);
            setScreen({ kind: 'stammdaten' });
          }}
          onClearAll={clearAll}
        />
      )}
      {screen.kind === 'kanzlei' && (
        <KanzleiScreen
          registry={registry}
          {...(start?.inbox ? { initialInbox: start.inbox } : {})}
          {...(remembered.ok && remembered.data ? { remembered: remembered.data } : {})}
          onBack={() => setScreen({ kind: 'start' })}
        />
      )}
      {screen.kind === 'stammdaten' && (
        <Card title="Stammdaten-Link erstellen oder ändern">
          <MasterDataLinkForm
            registry={registry}
            {...(remembered.ok && remembered.data ? { initial: remembered.data } : {})}
            {...(remembered.ok && remembered.form ? { initialForm: remembered.form } : {})}
          />
          <div className="nav">
            <button type="button" className="link" onClick={() => setScreen({ kind: 'start' })}>
              Zur Startseite
            </button>
          </div>
        </Card>
      )}
      {session && screen.kind === 'roles' && (
        <RolesScreen
          session={session}
          onEnter={enter}
          onNewVersion={(r) => continueRole(startNewVersion(session, r))}
          onReopen={(r) => continueRole(reopen(session, r))}
          onSaveInterim={saveInterim}
          onTakeOver={(f) => void takeOverFile(f)}
          onPdf={() => void pdf()}
          onClose={close}
          onDiscard={discard}
        />
      )}
      {session && screen.kind === 'interview' && (
        <InterviewScreen
          session={session}
          onSession={setSession}
          onBanner={setBanner}
          onSign={() => setScreen({ kind: 'sign' })}
          onPause={() => {
            setSession(leaveRole(session));
            setScreen({ kind: 'roles' });
          }}
          onSaveInterim={saveInterim}
          onDiscard={discard}
        />
      )}
      {session && screen.kind === 'sign' && (
        <SignatureScreen
          session={session}
          tracker={tracker}
          onBack={() => setScreen({ kind: 'interview' })}
          onSealed={(sealed, sealedRole, warnings) => {
            setSession(sealed);
            setScreen({ kind: 'done', role: sealedRole });
            setBanner(
              warnings.length > 0 ? { tone: 'warning', text: warnings.join(' ') } : undefined,
            );
          }}
        />
      )}
      {session && screen.kind === 'done' && (
        <DoneScreen
          session={session}
          role={screen.role}
          onOverview={() => setScreen({ kind: 'roles' })}
          onSaveInterim={saveInterim}
          onPdf={() => void pdf()}
          transfer={transferOffer(
            session.questionnaire,
            session.form,
            masterDataLinkBase(location.href, APP_CONFIG.appAddress),
          )}
          onLinkCopied={() => setSession(markSaved(session))}
        />
      )}

      <footer className="footer">
        {APP_NAME} {APP_VERSION}
        {APP_CONFIG.kanzleiName ? ` · ${APP_CONFIG.kanzleiName}` : ''} · läuft vollständig auf
        diesem Gerät
        {session && (
          <>
            <br />
            Formular {session.form.definition.id} {session.form.definition.version}
            {describeRevised(session.form.definition)
              ? ` · ${describeRevised(session.form.definition)}`
              : ''}
          </>
        )}
      </footer>
    </main>
  );
}
