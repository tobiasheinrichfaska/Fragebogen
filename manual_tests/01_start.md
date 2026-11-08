# 01 – Start

Was ein Browser ohne Bildschirm prüfen kann – den Inhalt der Startseite, dass nichts ins Internet
geht (auch offline), die Kontraste im dunklen Modus –, läuft automatisch in
`tests/e2e/handtests/01_start.spec.ts`. Hier bleibt, was nur am echten Gerät geht.

## MT-01: Datei per Doppelklick öffnen

**Testbereich:** nein – nur mit der heruntergeladenen Datei; im Testbereich läuft die App vom
Server (Einstieg dort: die Startseite der App rechts neben dem Testbereich).

**Voraussetzungen:** Die Datei `index.html` liegt auf dem Rechner, z. B. im Ordner „Downloads“.

**Schritte:**

1. Doppelklicken Sie auf `index.html`.
   - **Danach:** Ihr Standardbrowser öffnet sich und zeigt die Startseite mit der Überschrift
     **„Fragebogen“**.
   - **Danach:** _Nicht offensichtlich:_ In der Adresszeile steht `file:///…` statt einer
     Internetadresse. Das ist richtig, denn die Seite läuft ohne Server.

**Erwartet:**

- Was die Startseite zeigt (nur veröffentlichte Formulare, unten die Versionsnummer), prüft ein
  automatischer Test. Hier zählt nur, dass der Doppelklick die Datei im Browser öffnet.

---

## MT-03: Darstellung im dunklen Modus

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“).

**Voraussetzungen:** Das Betriebssystem steht auf dunkles Design (Windows: Einstellungen →
Personalisierung → Farben → „Dunkel“; iPhone: Einstellungen → Anzeige & Helligkeit → „Dunkel“).

**Schritte:**

1. Öffnen Sie die App (im Testbereich oder als Datei) bzw. laden Sie sie neu.
   - **Danach:** Die Seite erscheint mit dunklem Hintergrund und heller Schrift. Alles bleibt gut
     lesbar – im Testbereich auch die Testanleitung.

**Erwartet:**

- Den Kontrast jeder Schrift zu ihrem Hintergrund misst ein automatischer Test. Hier zählt Ihr
  Eindruck am echten Bildschirm.
