# 04 – PDF, Einlesen und Papierweg

## MT-30: PDF erstellen (vollständig)

**Voraussetzungen:** MT-21 bestanden: Arbeitgeber abgeschlossen, Person unterschrieben, im Kasten
„Stand“ steht „Vollständig“.

**Schritte:**

1. Klicken Sie **„PDF erstellen“**.
2. Öffnen Sie die heruntergeladene Datei in einem PDF-Programm (Acrobat Reader, Edge, Vorschau).

**Erwartet:**

- Die Meldung nennt den Dateinamen `Sofortmeldung_xxxxxxxx_vollstaendig.pdf` und „5 Seiten, davon
  die letzten mit 7 QR-Codes“ (die Zahlen können abweichen).
- Seite 1 beginnt mit **„Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.“**
  Die Angaben des Arbeitgebers sind **grau hinterlegt**.
- Es folgen die Hinweise mit „bestätigt von: Beschäftigte Person“, dann **„Unterschriften und
  Abschlüsse“** mit der gezeichneten Unterschrift, Systemvermerk und Prüfwert je Rolle.
- Dann das **Prüfblatt**, eine Seite **„Anlage: Daten in maschinenlesbarer Form“** mit
  Zeichenkolonnen und eine Seite **„Anlage: Daten als QR-Codes“**.
- Unten auf jeder Seite: „Fragebogen-ID … · Daten … · Formular sofortmeldung 0.1.0 · Seite x von y“.
- _Nicht offensichtlich:_ Der Dateiname enthält keinen Personennamen. Die Unterschrift ist als
  Linie gezeichnet (vergrößern bleibt scharf), nicht als Bild.

---

## MT-31: PDF zur Weitergabe (noch nicht vollständig)

**Voraussetzungen:** Neuer Fragebogen; nur der Arbeitgeber hat abgeschlossen (MT-20).

**Schritte:**

1. Klicken Sie in der Übersicht **„PDF erstellen“**.

**Erwartet:**

- Die Datei heißt `Sofortmeldung_xxxxxxxx_Weitergabe.pdf`.
- Seite 1 beginnt mit **„Zur Weitergabe an die nächste Station. Noch offen: …“** und nennt den
  fehlenden Teil der beschäftigten Person.
- _Nicht offensichtlich:_ Solange ein Teil **begonnen, aber nicht abgeschlossen** ist oder eine
  Pflicht-Unterschrift fehlt, ist „PDF erstellen“ ausgegraut. Ein noch gar nicht begonnener Teil
  sperrt die Weitergabe dagegen nicht.

---

## MT-32: Die eigene PDF wieder öffnen

**Voraussetzungen:** Eine PDF aus MT-30 oder MT-31.

**Schritte:**

1. Laden Sie die Seite neu (oder schließen Sie den Fragebogen) und klicken Sie **„Datei öffnen …“**.
2. Wählen Sie die PDF.

**Erwartet:**

- Grün: **„Geprüft: Alle abgeschlossenen Teile sind unverändert seit ihrem Abschluss.“** mit dem
  Zusatz „Geprüft wurden die Datenseiten, nicht der sichtbare Text.“
- Die Übersicht zeigt dieselben Zustände wie vor dem Erstellen. Bei einer Weitergabe-PDF kann die
  nächste Rolle jetzt ausfüllen.
- _Nicht offensichtlich:_ Das Öffnen dauert beim ersten Mal ein bis zwei Sekunden (das Lesemodul
  startet).

---

## MT-33: PDF in einem anderen Programm neu gespeichert

**Voraussetzungen:** Eine PDF aus MT-30; Acrobat oder ein anderes PDF-Programm.

**Schritte:**

1. Öffnen Sie die PDF in Acrobat, fügen Sie einen Kommentar ein und speichern Sie unter neuem Namen.
2. Öffnen Sie diese Datei in der App.

**Erwartet:**

- Gelb: „Geprüft: Alle abgeschlossenen Teile sind unverändert …“ **mit** dem Hinweis, dass die PDF
  verändert/ergänzt oder mit einem anderen Programm neu gespeichert wurde.
- _Nicht offensichtlich:_ Die Daten bleiben gültig, weil die App die Datenseiten prüft. Der Hinweis
  soll nur zeigen, dass die Datei nicht mehr das unveränderte Original ist.

---

## MT-34: Ausdruck scannen (Papierweg)

**Voraussetzungen:** Eine PDF aus MT-30, ein Drucker und ein Scanner (oder ein Kopierer mit
Scan-to-PDF).

**Schritte:**

1. Drucken Sie **nur die Seite mit den QR-Codes** aus (Seite „Anlage: Daten als QR-Codes“), in
   Originalgröße („Tatsächliche Größe“, nicht „An Seite anpassen“).
2. Scannen Sie sie als PDF (300 dpi, schwarz-weiß oder Graustufen); das Blatt liegt gerade.
3. Öffnen Sie den Scan in der App.

**Erwartet:**

- Grün oder gelb: „Geprüft: …“ mit dem Zusatz **„Gelesen aus den QR-Codes eines Ausdrucks. Das
  Original bleibt die elektronische Datei.“**
- _Nicht offensichtlich:_ Die Seiten mit den Zeichenkolonnen helfen beim Scan **nicht** (Texterkennung
  ist zu unsicher); nur die QR-Codes werden gelesen. Legen Sie das Blatt **gerade** auf: Bei einem
  schrägen Scan erkennt die App mehrere Codes womöglich nicht (bitte dann notieren, wie schräg).
- Fehlen Codes (Seite abgeschnitten), nennt die App die fehlenden Teile.

---

## MT-35: QR-Codes mit dem Handy fotografieren

**Voraussetzungen:** Ausdruck der QR-Seite aus MT-34; Handy oder Tablet mit der gehosteten App
(oder die Fotos per Mail an den PC).

**Schritte:**

1. Fotografieren Sie zuerst nur die **obere Reihe** der Codes, möglichst gerade von oben.
2. Öffnen Sie das Foto in der App.
3. Fotografieren Sie die übrigen Codes und öffnen Sie dieses Foto ebenfalls.

**Erwartet:**

- Nach Schritt 2: blau **„QR-Codes: 3 von 7 gelesen. Bitte ein weiteres Foto …“** mit der Liste der
  fehlenden Teile.
- Nach Schritt 3: „Geprüft: …“ wie in MT-34.
- _Nicht offensichtlich:_ Werden auf einem Foto mit vielen Codes nicht alle erkannt, hilft es, die
  Codes einzeln oder in kleineren Gruppen zu fotografieren (heller Raum, kein Schatten, Codes
  füllen das Bild).

---

## MT-36: Link zur App in der PDF

**Voraussetzungen:** Eine App-Fassung, in der die Kanzlei ihre Adresse konfiguriert hat
(`config/kanzlei.local.json`, siehe `config/README.md`).

**Schritte:**

1. Erstellen Sie eine PDF und öffnen Sie sie in einem PDF-Programm.
2. Klicken Sie auf die Zeile „App: https://…“.

**Erwartet:**

- Der Browser öffnet die Adresse der App. Gedruckt ist die Adresse ebenfalls lesbar.
- _Nicht offensichtlich:_ Ohne konfigurierte Adresse (Fassung aus dem öffentlichen Repo) fehlt die
  Zeile ganz.
