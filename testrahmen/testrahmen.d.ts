// Types of the shared test page (Testumgebung, testrahmen/; docs/testrahmen.md). A test there
// keeps them in step with the exports of testrahmen.js.

/** What the app gives the test page (its test build only). */
export interface Anbindung {
  /** The app as its reports name it, as in Testumgebung's zugang/bereiche.json: "fragebogen". */
  app: string;
  /** Shown on top: "Fragebogen". */
  name: string;
  /** From package.json at build time: "1.4.2". */
  version: string;
  /** The commit of the build: `git rev-parse --short HEAD`. */
  stand: string;
  /** The manual tests: each file of manual_tests/ with its name and its text. */
  handtests: readonly { datei: string; text: string }[];
  /** Prepared states the tests name as `[text](start:<id>)`. */
  startpunkte?: readonly { id: string; titel: string }[];
  /** Restarts the app with a prepared state. Needed when there are start points. */
  laden?(id: string): void | Promise<void>;
  /** Restarts the app, keeping its data. Default: reload the page. */
  neuStarten?(): void | Promise<void>;
  /**
   * Removes everything the app keeps and restarts it. Default: empty the page's browser storage
   * except the test page's own key, then reload.
   */
  zuruecksetzen?(): void | Promise<void>;
}

export interface Optionen {
  speicher?: Storage;
  jetzt?: () => number;
  senden?: typeof fetch;
  berichtAdresse?: string;
  einladenAdresse?: string;
}

export interface Testrahmen {
  /** The app mounts itself here. */
  appBehaelter: HTMLElement;
  /** Stops the page (tests and hot reload): the clock pauses, the state is stored. */
  beenden(): void;
}

export declare const BERICHT_ADRESSE: string;
export declare const EINLADEN_ADRESSE: string;
/** The test page's own key in the browser storage; a reset of the app never removes it. */
export declare function speicherSchluessel(app: string): string;
/** What is wrong with a binding; the page shows it on top and sends no report while it is wrong. */
export declare function bindingProblems(anbindung: Anbindung): string[];
/** Puts the test page next to the app inside `ziel`; the app then mounts into `appBehaelter`. */
export declare function starteTestrahmen(ziel: HTMLElement, anbindung: Anbindung, optionen?: Optionen): Testrahmen;
