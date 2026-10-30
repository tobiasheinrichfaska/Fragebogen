# 01 – Start

## MT-01: Datei per Doppelklick öffnen

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

**Voraussetzungen:** MT-01 ist bestanden. Sie verwenden Edge oder Chrome.

**Schritte:**

1. Trennen Sie den Rechner vom Internet (WLAN aus bzw. Netzwerkkabel ziehen).
2. Öffnen Sie `index.html` erneut per Doppelklick.
3. Drücken Sie **F12**, wählen Sie den Reiter **„Netzwerk“** (bzw. „Network“) und laden Sie die
   Seite mit **F5** neu.

**Erwartet:**

- Die Seite sieht genauso aus wie in MT-01, obwohl kein Internet da ist.
- Im Reiter „Netzwerk“ erscheint nur die Datei `index.html` selbst (Adresse beginnt mit `file:`)
  und ggf. ein Eintrag mit `data:`. **Keine** Adresse beginnt mit `http://` oder `https://`.
- _Nicht offensichtlich:_ Ein Eintrag „favicon“ mit `data:,` ist gewollt. Er verhindert, dass der
  Browser ein Symbol aus dem Internet nachlädt.

---

## MT-03: Darstellung im dunklen Modus

**Voraussetzungen:** Das Betriebssystem steht auf dunkles Design (Windows: Einstellungen →
Personalisierung → Farben → „Dunkel“).

**Schritte:**

1. Öffnen Sie `index.html`.

**Erwartet:**

- Die Seite erscheint mit dunklem Hintergrund und heller Schrift. Alles bleibt gut lesbar.
