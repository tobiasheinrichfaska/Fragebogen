# 04 – PDF, Einlesen und Papierweg

## MT-30: PDF erstellen (vollständig)

**Einstieg:** Direkt nach MT-21 (gezeichnete Unterschrift) – oder schneller:
[Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) (die Person hat dort mit
getipptem Namen unterschrieben).

**Voraussetzungen:** MT-21 bestanden: Arbeitgeber abgeschlossen, Person unterschrieben, im Kasten
„Stand“ steht „Vollständig“.

**Schritte:**

1. Klicken Sie **„PDF erstellen“**.
2. Öffnen Sie die heruntergeladene Datei in einem PDF-Programm (Acrobat Reader, Edge, Vorschau). Am
   Handy oder Tablet: erst **„Speichern“** in der Meldung (siehe MT-37).

**Erwartet:**

- Die Meldung nennt den Dateinamen `Sofortmeldung_xxxxxxxx_vollstaendig.pdf` und „5 Seiten, davon
  die letzten mit 7 QR-Codes“ (die Zahlen können abweichen).
- Seite 1 beginnt mit **„Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.“**
  Die Angaben des Arbeitgebers sind **grau hinterlegt**.
- Es folgen die Hinweise mit „bestätigt von: Beschäftigte Person“, dann **„Unterschriften und
  Abschlüsse“** mit der gezeichneten Unterschrift (nach dem Startlink: dem getippten Namen),
  Systemvermerk und Prüfwert je Rolle.
- Dann das **Prüfblatt**, eine Seite **„Anlage: Daten in maschinenlesbarer Form“** mit
  Zeichenkolonnen und eine Seite **„Anlage: Daten als QR-Codes“**.
- Unten auf jeder Seite: „Fragebogen-ID … · Daten … · Formular sofortmeldung 1.0.0 · Seite x von y“ (die Fassung, mit der der Bogen begonnen wurde).
- _Nicht offensichtlich:_ Der Dateiname enthält keinen Personennamen. Eine gezeichnete Unterschrift ist
  als Linie gesetzt (vergrößern bleibt scharf), nicht als Bild.

---

## MT-31: PDF zur Weitergabe (noch nicht vollständig)

**Einstieg:** [Nur Arbeitgeber abgeschlossen öffnen](start:sofortmeldung-arbeitgeber-abgeschlossen) –
Sie stehen in der Übersicht. Ohne Testbereich: direkt nach MT-20.

**Voraussetzungen:** Nur der Arbeitgeber hat abgeschlossen; der Teil der Person ist noch nicht
begonnen.

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

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig)
und **„PDF erstellen“** oder MT-31.

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

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig)
und **„PDF erstellen“** und ein PDF-Programm.

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

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen eine PDF aus MT-30 – schnell: [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig)
und **„PDF erstellen“**, einen Drucker und einen Scanner.

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

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie brauchen den Ausdruck aus MT-34 und ein Handy.

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

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“); Sie erstellen eine PDF wie in MT-30 oder MT-31.

**Voraussetzungen:** Eine App-Fassung, in der die Kanzlei ihre Adresse konfiguriert hat
(`config/kanzlei.local.json`, siehe `config/README.md`).

**Schritte:**

1. Erstellen Sie eine PDF und öffnen Sie sie in einem PDF-Programm.
2. Klicken Sie auf die Zeile „App: https://…“.

**Erwartet:**

- Der Browser öffnet die Adresse der App. Gedruckt ist die Adresse ebenfalls lesbar.
- _Nicht offensichtlich:_ Ohne konfigurierte Adresse (Fassung aus dem öffentlichen Repo) fehlt die
  Zeile ganz.

---

## MT-37: PDF auf dem Handy oder Tablet teilen

**Einstieg:** Auf einem Android-Handy (Chrome) oder iPhone/iPad (Safari) den Testordner öffnen,
[Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig).

**Voraussetzungen:** Ein Handy oder Tablet mit Touch-Bildschirm; eine App zum Weitergeben (E-Mail,
Messenger oder Cloud-Speicher).

**Schritte:**

1. Tippen Sie **„PDF erstellen“**.
2. Tippen Sie in der grünen Meldung **„Teilen“** und wählen Sie eine App, z. B. E-Mail. Brechen Sie
   vor dem Senden ab oder senden Sie an sich selbst.
3. Tippen Sie in derselben Meldung **„Speichern“**.

**Erwartet:**

- Schritt 1: Die PDF öffnet sich **nicht** von selbst. Die Seite rückt zur grünen Meldung „PDF … erstellt“
  mit den Knöpfen **„Teilen“** und **„Speichern“**.
- Schritt 2: Das Teilen-Menü des Geräts geht auf; in der gewählten App hängt die PDF mit ihrem
  Dateinamen (`Sofortmeldung_…_vollstaendig.pdf`) an. _Nicht offensichtlich:_ Brechen Sie das
  Teilen-Menü ab, passiert nichts weiter – kein Download, keine Fehlermeldung.
- Schritt 3: Die PDF wird wie bisher heruntergeladen (Android: Download-Hinweis; iPhone: „Laden“).
- _Nicht offensichtlich:_ Am PC lädt „PDF erstellen“ wie bisher sofort herunter; „Speichern“ gibt es
  dort nicht, „Teilen“ nur, wenn der Browser Dateien teilen kann (z. B. Edge unter Windows).
