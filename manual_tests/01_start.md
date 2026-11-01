# 01 – Start

## MT-01: Datei per Doppelklick öffnen

**Testbereich:** nein – nur mit der heruntergeladenen Datei; im Testbereich läuft die App vom
Server (Einstieg dort: die Startseite der App rechts neben dem Testbereich).

**Voraussetzungen:** Die Datei `index.html` liegt auf dem Rechner, z. B. im Ordner „Downloads“.

**Schritte:**

1. Doppelklicken Sie auf `index.html`.
2. Warten Sie, bis der Browser die Seite anzeigt.

**Erwartet:**

- Die Überschrift **„Fragebogen“** erscheint, darunter drei Kästen: **„Neuer Fragebogen“** mit
  dem Knopf **„Personalfragebogen: Angaben für die Sofortmeldung“** (Version 0.1.0 · Testfassung),
  **„Weiterbearbeiten oder prüfen“** und **„Ihre Daten bleiben auf diesem Gerät“**.
- Ganz unten steht **„Fragebogen 0.1.0 · läuft vollständig auf diesem Gerät“** (oder eine höhere
  Version).
- _Nicht offensichtlich:_ In der Adresszeile steht `file:///…` statt einer Internetadresse. Das ist
  richtig, denn die Seite läuft ohne Server.

---

## MT-02: Keine Verbindung ins Internet

_Automatisch geprüft mit `npm run test:e2e` (Chromium, Firefox, WebKit): Die Datei verbietet per
Sicherheitsrichtlinie (CSP) jede Verbindung; der Test meldet jede Anfrage, die das Gerät verlässt.
Dieser Handtest bleibt für echte Geräte und Browser._

**Voraussetzungen:** Startseite der App (im Testbereich: „App neu starten“ im Testbereich links; als Datei: MT-01). Sie verwenden Edge oder Chrome am PC.

**Schritte:**

1. Drücken Sie **F12**, wählen Sie den Reiter **„Netzwerk“** (bzw. „Network“) und laden Sie die
   Seite mit **F5** neu.
2. Beginnen Sie einen Fragebogen und beantworten Sie einige Fragen.
3. Trennen Sie jetzt den Rechner vom Internet (WLAN aus bzw. Netzwerkkabel ziehen) und füllen Sie
   weiter aus.

**Erwartet:**

- Schritt 1: Im Reiter „Netzwerk“ erscheint nur die Seite selbst – im Testbereich die Adresse
  `https://…/test/`, als Datei `file:…` – und ggf. ein Eintrag mit `data:`.
- Schritt 2: Beim Ausfüllen kommt **keine** weitere Anfrage dazu.
- Schritt 3: Die App arbeitet ohne Internet weiter. _Nicht offensichtlich:_ Nur die Links
  „Wo finde ich das?“ brauchen Internet.
- _Nicht offensichtlich:_ Ein Eintrag „favicon“ mit `data:,` ist gewollt. Er verhindert, dass der
  Browser ein Symbol aus dem Internet nachlädt.

---

## MT-03: Darstellung im dunklen Modus

**Voraussetzungen:** Das Betriebssystem steht auf dunkles Design (Windows: Einstellungen →
Personalisierung → Farben → „Dunkel“; iPhone: Einstellungen → Anzeige & Helligkeit → „Dunkel“).

**Schritte:**

1. Öffnen Sie die App (im Testbereich oder als Datei) bzw. laden Sie sie neu.

**Erwartet:**

- Die Seite erscheint mit dunklem Hintergrund und heller Schrift. Alles bleibt gut lesbar –
  im Testbereich auch die Testanleitung.
