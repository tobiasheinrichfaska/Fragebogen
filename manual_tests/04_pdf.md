# 04 – PDF, Einlesen und Papierweg

Was ein Browser selbst prüfen kann, läuft automatisch in `tests/e2e/handtests/04_pdf.spec.ts`:
Dateiname, Text und Reihenfolge der PDF, Wiedereinlesen, eine mit einem anderen Programm neu
gespeicherte PDF, Scans und Fotos der QR-Codes als Bilder, der Link zur App und das Kennwort in der
App. Hier steht nur noch, was ein echtes PDF-Programm, ein Drucker, eine Kamera oder ein Handy zeigt.

## MT-30: PDF in einem PDF-Programm ansehen

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – Arbeitgeber abgeschlossen, die Person hat mit getipptem Namen unterschrieben.

**Voraussetzungen:** Ein PDF-Programm (Acrobat Reader, Edge oder Vorschau).

**Schritte:**

1. Klicken Sie in der Übersicht unter „Stand“ **„PDF erstellen“**.
   - **Danach:** Die PDF wird heruntergeladen (am Handy oder Tablet: in der Meldung **„Speichern“**
     tippen, siehe MT-37).
2. Öffnen Sie die heruntergeladene Datei in einem PDF-Programm.
   - **Danach:** Die PDF öffnet ohne Fehlermeldung. Seite 1 beginnt mit **„Vollständig: alle
     erforderlichen Teile liegen vor und sind verknüpft.“**
   - **Danach:** _Nicht offensichtlich:_ Die Angaben des Arbeitgebers sind **grau hinterlegt**, die
     der Person nicht.
3. Blättern Sie bis zum Ende.
   - **Danach:** Alle Seiten sind gut lesbar, auch die Zeichenkolonnen und die QR-Codes am Ende.

---

## MT-33: PDF in Acrobat kommentiert und neu gespeichert

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – Arbeitgeber abgeschlossen, die Person hat unterschrieben; dann unter „Stand“ **„PDF erstellen“**. Die heruntergeladene PDF ist die PDF dieses Tests.

**Voraussetzungen:** Acrobat oder ein anderes PDF-Programm, das Kommentare speichert.

**Schritte:**

1. Öffnen Sie die PDF in Acrobat.
2. Fügen Sie einen Kommentar ein.
3. Speichern Sie die PDF unter neuem Namen.
4. Öffnen Sie diese Datei in der App (auf der Startseite **„Datei öffnen …“**).
   - **Danach:** Gelb: „Geprüft: Alle abgeschlossenen Teile sind unverändert …“ **mit** dem
     Hinweis, dass die PDF verändert/ergänzt oder mit einem anderen Programm neu gespeichert wurde.
   - **Danach:** _Nicht offensichtlich:_ Die Daten bleiben gültig, weil die App die Datenseiten
     prüft. Der Hinweis soll nur zeigen, dass die Datei nicht mehr das unveränderte Original ist.

---

## MT-34: Ausdruck scannen (Papierweg)

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – Arbeitgeber abgeschlossen, die Person hat unterschrieben; dann unter „Stand“ **„PDF erstellen“**. Die heruntergeladene PDF ist die PDF dieses Tests.

**Voraussetzungen:** Ein Drucker und ein Scanner (oder ein Kopierer mit Scan-to-PDF).

**Schritte:**

1. Drucken Sie **nur die Seite mit den QR-Codes** aus (Seite „Anlage: Daten als QR-Codes“; bei
   vielen Angaben sind es mehrere), in Originalgröße („Tatsächliche Größe“, nicht „An Seite
   anpassen“).
2. Legen Sie das Blatt **gerade** auf und scannen Sie es als PDF (300 dpi, schwarz-weiß oder
   Graustufen).
3. Öffnen Sie den Scan in der App (auf der Startseite **„Datei öffnen …“**).
   - **Danach:** Grün oder gelb: „Geprüft: …“ mit dem Zusatz **„Gelesen aus den QR-Codes eines
     Ausdrucks. Das Original bleibt die elektronische Datei.“**
4. Scannen Sie das Blatt noch einmal, diesmal **leicht schräg** aufgelegt, und öffnen Sie den
   Scan in der App.
   - **Danach:** _Nicht offensichtlich:_ Bei einem schrägen Scan erkennt die App womöglich nicht
     alle Codes und nennt die fehlenden Teile. Bitte notieren, wie schräg es noch ging.

**Erwartet:**

- _Nicht offensichtlich:_ Die Seiten mit den Zeichenkolonnen helfen beim Scan **nicht**
  (Texterkennung ist zu unsicher); nur die QR-Codes werden gelesen.

---

## MT-35: QR-Codes mit dem Handy fotografieren

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – Arbeitgeber abgeschlossen, die Person hat unterschrieben. Aus diesem Fragebogen erstellen und drucken Sie zuerst die Seiten mit den QR-Codes.

**Voraussetzungen:** Ein Drucker; ein Handy oder Tablet mit der gehosteten App (oder die Fotos per Mail an den PC).

**Schritte:**

1. Unter „Stand“ **„PDF erstellen“** klicken und die PDF öffnen.
2. Nur die Seite mit den QR-Codes („Anlage: Daten als QR-Codes“) in Originalgröße drucken
   („Tatsächliche Größe“, nicht „An Seite anpassen“).
3. Fotografieren Sie zuerst nur die **obere Reihe** der Codes, möglichst gerade von oben.
4. Öffnen Sie das Foto in der App.
   - **Danach:** Blau **„QR-Codes: 3 von 7 gelesen. Bitte ein weiteres Foto …“** mit der Liste der
     fehlenden Teile (die Zahlen können abweichen).
5. Fotografieren Sie die übrigen Codes.
6. Öffnen Sie dieses Foto ebenfalls in der App.
   - **Danach:** Grün oder gelb: „Geprüft: …“ mit dem Zusatz **„Gelesen aus den QR-Codes eines
     Ausdrucks. Das Original bleibt die elektronische Datei.“**

**Erwartet:**

- _Nicht offensichtlich:_ Werden auf einem Foto mit vielen Codes nicht alle erkannt, hilft es, die
  Codes einzeln oder in kleineren Gruppen zu fotografieren (heller Raum, kein Schatten, Codes
  füllen das Bild).

---

## MT-36: Link zur App in der PDF

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – in einer App-Fassung mit der Adresse der Kanzlei (siehe Voraussetzungen). Ohne Testbereich: einen Fragebogen ausfüllen und abschließen.

**Voraussetzungen:** Eine App-Fassung, in der die Kanzlei ihre Adresse konfiguriert hat
(`config/kanzlei.local.json`, siehe `config/README.md`).

**Schritte:**

1. Erstellen Sie eine PDF (in der Übersicht unter „Stand“ **„PDF erstellen“**).
2. Öffnen Sie die PDF in einem PDF-Programm.
3. Klicken Sie auf die Zeile „App: https://…“.
   - **Danach:** Der Browser öffnet die Adresse der App.
4. Drucken Sie Seite 1 aus.
   - **Danach:** Die Adresse ist auch gedruckt gut lesbar.

---

## MT-37: PDF auf dem Handy oder Tablet teilen

**Einstieg:** Auf einem Android-Handy (Chrome) oder iPhone/iPad (Safari) den Testordner öffnen,
[Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig).

**Voraussetzungen:** Ein Handy oder Tablet mit Touch-Bildschirm; eine App zum Weitergeben (E-Mail,
Messenger oder Cloud-Speicher).

**Schritte:**

1. Tippen Sie in der Übersicht unter „Stand“ **„PDF erstellen“**.
   - **Danach:** Die grüne Meldung „PDF … erstellt“ mit den Knöpfen **„Teilen“** und
     **„Speichern“** ist zu sehen.
2. Tippen Sie in der grünen Meldung **„Teilen“**.
   - **Danach:** Das Teilen-Menü des Geräts geht auf.
3. Brechen Sie das Teilen-Menü ab.
   - **Danach:** _Nicht offensichtlich:_ Es passiert nichts weiter – kein Download, keine
     Fehlermeldung.
4. Tippen Sie noch einmal **„Teilen“** und wählen Sie eine App, z. B. E-Mail.
   - **Danach:** In der gewählten App hängt die PDF mit ihrem Dateinamen
     (`Sofortmeldung_…_vollstaendig.pdf`) an.
5. Brechen Sie vor dem Senden ab oder senden Sie an sich selbst.
6. Tippen Sie in derselben Meldung **„Speichern“**.
   - **Danach:** Die PDF wird wie bisher heruntergeladen (Android: Download-Hinweis; iPhone:
     „Laden“).

**Erwartet:**

- _Nicht offensichtlich:_ Am PC lädt „PDF erstellen“ sofort herunter; „Teilen“ gibt es dort nur,
  wenn der Browser Dateien teilen kann (z. B. Edge unter Windows).

---

## MT-132: PDF mit Kennwort in PDF-Programmen öffnen

**Einstieg:** [Nur Arbeitgeber abgeschlossen öffnen](start:sofortmeldung-arbeitgeber-abgeschlossen) –
Sie stehen bei „Wer füllt jetzt aus?“.

**Voraussetzungen:** Chrome oder Edge; wenn vorhanden auch Acrobat Reader und am Mac die Vorschau.

**Schritte:**

1. In der Übersicht unter „Stand“ **„PDF erstellen“** klicken.
   - **Danach:** Ein Fenster fragt „Mit Kennwort schützen?“ und sagt, dass das Kennwort dann
     zusätzlich weitergegeben werden muss.
2. **„Mit Kennwort schützen“** klicken und das angezeigte Kennwort auf einem Zettel notieren.
   - **Danach:** Das Kennwort steht im Fenster, mit „Kopieren“ und „Neues Kennwort“.
3. **„Mit diesem Kennwort weiter“** klicken.
   - **Danach:** Grün: „PDF „Sofortmeldung_…_Weitergabe.pdf“ erstellt, mit Kennwort geschützt – …“;
     unter „Stand“ steht das Kennwort mit „ändern“.
4. Die heruntergeladene PDF direkt im Browser öffnen (Chrome oder Edge).
   - **Danach:** Der Browser fragt nach einem Kennwort.
5. Das Kennwort genau wie notiert eingeben: klein und mit Bindestrichen.
   - **Danach:** Die PDF zeigt die Angaben des Arbeitgebers wie ohne Kennwort.
6. Dieselbe PDF in Acrobat Reader öffnen und das Kennwort eingeben.
   - **Danach:** Acrobat Reader fragt nach dem Kennwort und zeigt die PDF damit an.
7. Am Mac: dieselbe PDF in der Vorschau öffnen und das Kennwort eingeben.
   - **Danach:** Die Vorschau fragt nach dem Kennwort und zeigt die PDF damit an.

**Erwartet:**

- Öffnet ein PDF-Programm die PDF auch mit dem richtigen Kennwort nicht, bitte Programm und Version
  melden. Bekannt: Die in Windows eingebaute PDF-Schnittstelle, die manche ältere Programme nutzen,
  kann AES-256 nicht öffnen.
