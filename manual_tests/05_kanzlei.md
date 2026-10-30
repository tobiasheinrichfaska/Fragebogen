# Station Kanzlei: Eingänge zusammenführen

Für diese Tests brauchen Sie PDFs aus den Tests MT-30/MT-31 (nur erfundene Daten).

## MT-40: Mehrere Dateien auf einmal einlesen

**Voraussetzungen:** Eine vollständige PDF (MT-30) und die PDF des Arbeitgebers zur Weitergabe
(MT-31) desselben Fragebogens liegen vor.

**Schritte:**

1. Startseite → Karte „Kanzlei“ → **„Eingänge zusammenführen …“**.
2. **„Dateien hinzufügen …“** und beide PDFs gleichzeitig auswählen (Strg gedrückt halten).
3. Dieselbe vollständige PDF über „Dateien hinzufügen …“ noch einmal auswählen.
4. **„Prüfergebnis je Datei“** aufklappen.

**Erwartet:**

- Beide Dateien stehen in der Liste mit Formular, Version und den ersten 8 Zeichen der
  Fragebogen-ID.
- Darunter **eine** Karte für den Fragebogen: „2 Datei(en)“, Hinweis „Dieselbe Fassung ist
  mehrfach eingegangen und wurde einmal übernommen. (Arbeitgeber …)“ und grün „Vollständig und
  ohne Widersprüche.“
- Schritt 3: Im Prüfergebnis steht „Diese Datei ist schon eingelesen; sie zählt einmal.“ – die
  Liste wird nicht länger.
- _Nicht offensichtlich:_ Das Einlesen vieler PDFs dauert einige Sekunden; die Schaltfläche zeigt
  so lange „Wird gelesen …“.

---

## MT-41: Formular ansehen und PDF für die Personalakte

**Voraussetzungen:** MT-40 durchgeführt.

**Schritte:**

1. In der Karte des Fragebogens **„Formular ansehen“**.
2. **„PDF für die Personalakte“**.
3. **„Daten speichern (JSON)“**.
4. **„Zur Startseite“** → „Eingänge zusammenführen …“ → die eben erstellte PDF einlesen →
   „Formular ansehen“.

**Erwartet:**

- Schritt 1: Alle Angaben nach Abschnitten, rechts, wer sie gemacht hat; darunter die
  nummerierten Unterschriften und Abschlüsse.
- Schritt 2: PDF „…_vollstaendig.pdf“ wird heruntergeladen. Im Prüfblatt steht je eingelesener
  Datei ein **Eingangsvermerk „Kanzlei (App)“** mit Uhrzeit des Einlesens und Dateiname.
- Schritt 3: Datei „…_Kanzlei.json“ wird heruntergeladen.
- Schritt 4: Unter „Eingangsvermerke“ stehen dieselben Vermerke wie vorher – **nicht doppelt**,
  obwohl die Datei ein zweites Mal eingegangen ist.

---

## MT-42: Zwei Fassungen, die nicht aufeinander aufbauen

**Voraussetzungen:** Zwei vollständige PDFs **desselben** Fragebogens, bei denen die Person zweimal
unabhängig unterschrieben hat (dieselbe PDF des Arbeitgebers zweimal ausfüllen lassen, einmal mit
anderem Vornamen).

**Schritte:**

1. Beide PDFs in „Eingänge zusammenführen …“ einlesen.
2. Bei einer Fassung **„Diese Fassung gilt“** klicken.
3. Unter „Ihre Entscheidungen“ **„zurücknehmen“** klicken.

**Erwartet:**

- Schritt 1: Rote Meldung „Für dieselbe Rolle liegen verschiedene Fassungen vor …“ mit einer
  Tabelle, die **nur die abweichenden Angaben** nebeneinander zeigt, je Spalte Datum und Datei.
  Es gibt noch keine Schaltflächen „PDF für die Personalakte“ – die App wählt nie selbst.
- Schritt 2: Der Konflikt verschwindet; ein Hinweis nennt die geltende und die verworfene Fassung.
  Weicht der Vorname jetzt von den Angaben des Arbeitgebers ab, erscheint gelb
  „Widersprüche: Die Vornamen weichen … ab.“ _Nicht offensichtlich:_ Ein Widerspruch blockiert die
  Ausgabe nicht; er ist ein Hinweis für die Kanzlei.
- Schritt 3: Der Konflikt ist wieder da.

---

## MT-43: Fragebögen ohne gemeinsame ID

**Voraussetzungen:** Die Person und der Arbeitgeber haben **jeweils einen eigenen** neuen Fragebogen
begonnen (zwei verschiedene IDs) und jeweils nur ihren Teil ausgefüllt und abgeschlossen.

**Schritte:**

1. Beide PDFs in „Eingänge zusammenführen …“ einlesen.
2. Bei „Gehören diese Fragebögen zusammen?“ **„Zusammenführen“** klicken.

**Erwartet:**

- Schritt 1: Zwei Karten, jede mit „Es fehlt noch: Ein erforderlicher Teil fehlt noch. (…)“, und
  oben der Vorschlag „Übereinstimmend: Familienname, Vornamen“.
- Schritt 2: Eine Karte „zusammengeführt aus …“ mit beiden IDs; unter „Ihre Entscheidungen“ steht
  „Zusammengeführt: …“ mit „zurücknehmen“.
- _Nicht offensichtlich:_ Danach bleibt „Es fehlt noch: Zwei Teile verweisen nicht aufeinander …“
  stehen. Die Zusammenführung auf Entscheidung ersetzt nicht, dass eine Seite die andere
  bestätigt; dafür muss eine Seite ihren Teil auf Grundlage der anderen neu abschließen.

---

## MT-44: Prüfhinweise bei der Zusammenführung

**Voraussetzungen:** Vorschau-Fassung (`npm run build:preview`), Personalfragebogen-Entwurf.

**Schritte:**

1. Neuen Personalfragebogen beginnen. Als Person bei „Situation“ „arbeitslos oder arbeitsuchend
   gemeldet“ wählen, Geburtsdatum 15.03.1960, sonst beliebig ausfüllen und unterschreiben.
2. Als Arbeitgeber „kurzfristige Aushilfe“ wählen, Tag der Beschäftigungsaufnahme 02.11.2026,
   abschließen, PDF erstellen.
3. Die PDF unter „Eingänge zusammenführen …“ einlesen.

**Erwartet:**

- In der Karte des Fragebogens steht „Prüfhinweise:“ mit u. a. „Arbeitsuchend gemeldet und als
  kurzfristige Aushilfe vorgesehen …“ und der Fundstelle.
- Dazu „Laut Geburtsdatum ist die Regelaltersgrenze bei Beschäftigungsbeginn erreicht …
  Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.“
- _Nicht offensichtlich:_ Prüfhinweise blockieren nichts; die PDF lässt sich trotzdem erstellen.

---

## MT-45: Vorschlag Personengruppe

**Voraussetzungen:** Vorschau-Fassung; ein Personalfragebogen, in dem der Arbeitgeber „Minijob“ mit
festem Monatsentgelt **520,00 €** angegeben hat und die Person „keine weitere Beschäftigung“; beide
Teile abgeschlossen, PDF erstellt.

**Schritte:**

1. Station Kanzlei: die PDF einlesen.
2. Die PDF für die Personalakte erstellen und das Prüfblatt ansehen.

**Erwartet:**

- Unter „Vorschläge (die App entscheidet nicht – bitte prüfen)“ steht „Personengruppe: 109 –
  Minijob: festes Monatsentgelt bis zur Geringfügigkeitsgrenze. 520,00 € im Monat;
  Geringfügigkeitsgrenze 2026: 603,00 €.“
- Dasselbe steht auf dem Prüfblatt mit „(Die App entscheidet das nicht.)“.
- _Nicht offensichtlich:_ Mit „weitere Beschäftigung: Ja“ steht zusätzlich „Bitte prüfen.“
  (Zusammenrechnung); bei einem Sonderfall gibt es keinen Vorschlag, sondern „Sonderfall – bitte
  selbst beurteilen“.

---

## MT-68: Übergabe an Lohn und Gehalt (nur Kanzlei-Build mit Zuordnung)

**Voraussetzungen:**

- Kanzlei-Build mit `config/export.local.json`: `npm run build:kanzlei` (für den Entwurf des
  Personalfragebogens die Vorschau: `npm run build:preview`).
- Ein vollständiger Personalfragebogen (beide Teile).
- **Ein Testmandant** in Lohn und Gehalt, nie ein echter Mandant.

**Schritte:**

1. Station „Kanzlei“: die PDFs einlesen.
2. Unter „Übergabe an DATEV Lohn und Gehalt“ zunächst nichts eintragen.
3. Mandantennummer des Testmandanten und eine freie Mitarbeiternummer eintragen;
   „Erfassungsblatt ansehen“.
4. „Importdatei herunterladen“; in Lohn und Gehalt auf Kanzleiebene Extras | Stammdatenimport
   die Datei wählen.
5. Auf Mandantenebene das Protokoll (Mandant | Ausgeben | Protokolle, „Stammdaten-Import-Prot.“)
   ansehen.

**Erwartet:**

- Schritt 2: „Noch keine Importdatei: Mandantennummer … fehlt“; der Knopf ist gesperrt.
- Schritt 3: Das Erfassungsblatt folgt den Masken von Lohn und Gehalt (Personaldaten, Beschäftigung,
  Sozialversicherung, Steuer …). Nicht Übertragbares steht mit Grund in der Liste „Nicht übertragen“.
- Schritt 4/5: Der Mitarbeiter ist angelegt; das Protokoll zeigt die übernommenen Felder.
  _Nicht offensichtlich:_ Krankenkasse und Lohnarten werden nicht übertragen; sie müssen in Lohn
  und Gehalt selbst erfasst werden. Das Gehalt steht deshalb nur auf dem Erfassungsblatt („Lohnart …
  selbst erfassen“). Fehlerhafte Felder nennt nur das Protokoll von Lohn und Gehalt.
- Gegenprobe: Die Datei `dist/index.html` (gehostete App) enthält die Zuordnung nicht.
- Danach den Testmitarbeiter wieder löschen.
