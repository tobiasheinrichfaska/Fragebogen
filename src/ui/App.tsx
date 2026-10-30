// App frame: start, overview ("Wer füllt jetzt aus?"), interview, signature, completion. All state
// is in memory (session.ts); files are the only way out. Rules come from the logic layer.
import { useEffect, useMemo, useState } from 'react';
import { APP_NAME, APP_VERSION } from '../appInfo';
import { APP_CONFIG } from '../config';
import { BUNDLED_FORMS } from '../io/bundledForms';
import { InputTracker, newQuestionnaireId } from '../io/environment';
import { downloadFile } from '../io/files';
import { buildPackage, packageText } from '../logic/dataPackage';
import { fileNameFor } from '../logic/fileNames';
import type { FormRegistry, RegisteredForm } from '../logic/formRegistry';
import { MASTER_DATA_LINK_MESSAGES, parseMasterDataFragment } from '../logic/masterDataLink';
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
import { Banner, type BannerMessage } from './common';
import { DoneScreen } from './DoneScreen';
import { InterviewScreen } from './InterviewScreen';
import { KanzleiScreen } from './KanzleiScreen';
import { RolesScreen } from './RolesScreen';
import { SignatureScreen } from './SignatureScreen';
import { StartScreen } from './StartScreen';
import { createPdf, openAnyFile, type OpenResult } from './pdfActions';

type Screen =
  | { kind: 'start' }
  | { kind: 'roles' }
  | { kind: 'interview' }
  | { kind: 'sign' }
  | { kind: 'done'; role: string }
  | { kind: 'kanzlei' };

const tracker = new InputTracker();

export function App() {
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
  return <Workspace registry={BUNDLED_FORMS.registry} />;
}

function Workspace({ registry }: { registry: FormRegistry }) {
  const [session, setSession] = useState<Session | undefined>();
  const [screen, setScreen] = useState<Screen>({ kind: 'start' });
  // QR codes read so far from photos of a print-out, until all parts are there.
  const [collected, setCollected] = useState<Uint8Array[]>([]);
  const remembered = useMemo(() => parseMasterDataFragment(location.hash), []);
  const [banner, setBanner] = useState<BannerMessage | undefined>(() =>
    remembered.ok
      ? undefined
      : {
          tone: 'warning',
          text: `Stammdaten-Link: ${MASTER_DATA_LINK_MESSAGES[remembered.issue]}`,
          detail: remembered.detail,
        },
  );

  useEffect(() => {
    tracker.start();
    return () => tracker.stop();
  }, []);

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

  const enter = (role: string) => {
    if (!session) return;
    const result = enterRole(session, role);
    if (!result.ok) return apply(result, screen);
    tracker.reset();
    let next = result.session;
    let info: BannerMessage | undefined;
    if (remembered.ok && remembered.data) {
      const filled = fillMasterData(next, remembered.data);
      if (filled.ok && (filled.applied.length > 0 || filled.skipped.length > 0)) {
        next = filled.session;
        info = {
          tone: filled.skipped.length > 0 ? 'warning' : 'info',
          text:
            filled.applied.length > 0
              ? 'Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.'
              : 'Stammdaten aus Ihrem Lesezeichen konnten nicht übernommen werden.',
          detail: filled.skipped.map((skip) => `${skip.key}: ${skip.detail.join(' ')}`),
        };
      }
    }
    setSession(next);
    setScreen({ kind: 'interview' });
    setBanner(info);
  };

  const saveInterim = () => {
    if (!session) return;
    const { questionnaire, form } = session;
    downloadFile(
      fileNameFor(form.definition.id, questionnaire.questionnaireId, 'interim'),
      packageText(buildPackage(questionnaire, form)),
      'application/json',
    );
    setSession(markSaved(session));
    setBanner({
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

  const clearAll = () => {
    if (session?.dirty && !confirm('Nicht gespeicherte Angaben gehen verloren. Alles löschen?'))
      return;
    setSession(undefined);
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

  const role = session?.role;
  const roleLabel = session?.form.definition.roles.find((r) => r.id === role)?.label;

  return (
    <main className="shell">
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
          onClearAll={clearAll}
        />
      )}
      {screen.kind === 'kanzlei' && (
        <KanzleiScreen registry={registry} onBack={() => setScreen({ kind: 'start' })} />
      )}
      {session && screen.kind === 'roles' && (
        <RolesScreen
          session={session}
          onEnter={enter}
          onNewVersion={(r) => {
            if (apply(startNewVersion(session, r), { kind: 'interview' })) tracker.reset();
          }}
          onReopen={(r) => {
            if (apply(reopen(session, r), { kind: 'interview' })) tracker.reset();
          }}
          onSaveInterim={saveInterim}
          onTakeOver={(f) => void takeOverFile(f)}
          onPdf={() => void pdf()}
          onClose={close}
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
        />
      )}

      <footer className="footer">
        {APP_NAME} {APP_VERSION}
        {APP_CONFIG.kanzleiName ? ` · ${APP_CONFIG.kanzleiName}` : ''} · läuft vollständig auf
        diesem Gerät
      </footer>
    </main>
  );
}
