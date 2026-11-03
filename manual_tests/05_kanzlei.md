# Station Kanzlei: Eingänge zusammenführen

Für diese Tests brauchen Sie PDFs aus den Tests MT-30/MT-31 (nur erfundene Daten).

## MT-40: Mehrere Dateien auf einmal einlesen

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“), Karte „Kanzlei“ → „Eingänge zusammenführen …“; Sie brauchen die PDFs aus MT-30 und MT-31.

**Voraussetzungen:** Eine vollständige PDF und die PDF des Arbeitgebers zur Weitergabe **desselben**
Fragebogens. Am schnellsten: [Nur Arbeitgeber abgeschlossen öffnen](start:sofortmeldung-arbeitgeber-abgeschlossen),
**„PDF erstellen“** (Weitergabe); dann im selben Fragebogen als „Beschäftigte Person“ ausfüllen,
unterschreiben und noch einmal **„PDF erstellen“** (vollständig).

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

**Einstieg:** [Kanzlei mit vollständiger Sofortmeldung öffnen](start:kanzlei-sofortmeldung-vollstaendig) –
die Kanzlei-Station mit einem eingelesenen, vollständigen Fragebogen. Oder direkt nach MT-40.

**Voraussetzungen:** Startlink oder MT-40.

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

**Einstieg:** [Zwei Fassungen öffnen](start:kanzlei-zwei-fassungen) – die Kanzlei-Station mit zwei
Eingängen **desselben** Fragebogens: derselbe Teil des Arbeitgebers, aber die Person hat zweimal
unabhängig unterschrieben (Vorname „Erika“ bzw. „Erika Maria“).

**Voraussetzungen:** Startlink. Ohne Testbereich: dieselbe PDF des Arbeitgebers zweimal von der
Person ausfüllen lassen, einmal mit anderem Vornamen, und beide PDFs einlesen.

**Schritte:**

1. Den Kasten zum Fragebogen ansehen.
2. Bei „Sofortmeldung_Fassung_2.pdf“ **„Diese Fassung gilt“** klicken.
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
- _Nicht offensichtlich:_ Nach dem Startlink tragen beide Fassungen dieselbe Uhrzeit; im Prüfergebnis
  steht je Eingang „Vorbereiteter Eingang aus dem Testbereich – nicht aus einer Datei gelesen.“

---

## MT-43: Fragebögen ohne gemeinsame ID

**Einstieg:** [Zwei eigene Fragebögen öffnen](start:kanzlei-ohne-gemeinsame-id) – die Kanzlei-Station
mit zwei Eingängen: Die Person und der Arbeitgeber haben **jeweils einen eigenen** Fragebogen
begonnen (zwei verschiedene IDs) und nur ihren Teil abgeschlossen.

**Voraussetzungen:** Startlink. Ohne Testbereich: zwei neue Fragebögen, je einer nur von der Person
und nur vom Arbeitgeber abgeschlossen, beide PDFs einlesen.

**Schritte:**

1. Die beiden Karten ansehen.
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

**Einstieg:** [Arbeitsuchende Person vorbereitet öffnen](start:personalfragebogen-rag-arbeitslos-art-offen)
– die Person (geboren 15.03.1960, „arbeitslos oder arbeitsuchend gemeldet“, Arbeitslosengeld,
„Regelaltersgrenze erreicht?“ **„Nein“**) hat unterschrieben; der Arbeitgeber (Beginn 02.11.2026,
1.500,00 €, befristet bis 31.12.2026) steht bei der Art der Beschäftigung.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „Wie ist die Beschäftigung vorgesehen?“ → „kurzfristige Aushilfe …“; Ende `31.12.2026`, `30`
   Arbeitstage, Rahmenvereinbarung „Nein“, Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
2. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen.

**Erwartet:**

- In der Karte des Fragebogens steht „Prüfhinweise:“ mit u. a. „Arbeitsuchend gemeldet und als
  kurzfristige Aushilfe vorgesehen …“ und der Fundstelle.
- Dazu „Laut Geburtsdatum ist die Regelaltersgrenze bei Beschäftigungsbeginn erreicht …
  Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.“
- _Nicht offensichtlich:_ Prüfhinweise blockieren nichts; die PDF lässt sich trotzdem erstellen.

---

## MT-45: Vorschlag Personengruppe

**Einstieg:** [Minijob vorbereitet öffnen](start:personalfragebogen-minijob-entgelt-offen) – die Person
(„einen Minijob“, keine weitere Beschäftigung) hat unterschrieben; der Arbeitgeber steht bei „Wie
wird die Person bezahlt?“.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „festes Monatsentgelt“ **520,00 €**; „Wie ist die Beschäftigung vorgesehen?“ → „Minijob (bis
   603 € im Monat)“; Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
2. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen.
3. Die PDF für die Personalakte erstellen und das Prüfblatt ansehen.

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

**Einstieg:** [Kanzlei mit vollständigem Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig)
– die Kanzlei-Station mit einem eingelesenen Personalfragebogen (Erika Musterfrau, Beginn
02.11.2026, 2.500,00 €, Personalnummer 42).

**Testbereich:** Die App-Schritte gehen auch dort; das Einspielen in Lohn und Gehalt nur in der
Kanzlei (Testmandant).

**Voraussetzungen:**

- Kanzlei-Build mit `config/export.local.json`: `npm run build:kanzlei` (für den Entwurf des
  Personalfragebogens die Vorschau: `npm run build:preview`).
- Ein vollständiger Personalfragebogen (beide Teile) – im Testbereich über den Startlink.
- **Ein Testmandant** in Lohn und Gehalt, nie ein echter Mandant.

**Schritte:**

1. Station „Kanzlei“: die PDFs einlesen (nach dem Startlink schon geschehen).
2. Unter „Übergabe an DATEV Lohn und Gehalt“ zunächst nichts eintragen.
3. Mandantennummer des Testmandanten und eine freie Mitarbeiternummer eintragen; „neu anlegen“
   wählen; „Lohnart für das Monatsentgelt“, „Betriebsnummer der Krankenkasse“ und „KK-Nr. der
   Krankenkasse beim Mandanten“ aus dem Testmandanten eintragen; „Erfassungsblatt ansehen“.
4. „Importdatei herunterladen“; in Lohn und Gehalt auf Kanzleiebene Extras | Stammdatenimport
   die Datei wählen.
5. Auf Mandantenebene das Protokoll (Mandant | Ausgeben | Protokolle, „Stammdaten-Import-Prot.“)
   ansehen.

**Erwartet:**

- Schritt 2: „Noch keine Importdatei: Mandantennummer … fehlt“ und „Bitte wählen: Mitarbeiter neu
  anlegen oder vorhandenen Mitarbeiter ergänzen.“; der Knopf ist gesperrt. Unter den Eingabefeldern
  steht die Krankenkasse, die die Person genannt hat.
- Schritt 3: Das Erfassungsblatt folgt den Masken von Lohn und Gehalt (Personaldaten, Beschäftigung,
  Sozialversicherung, Steuer …). Nicht Übertragbares steht mit Grund in der Liste „Nicht übertragen“.
- Schritt 4/5: Der Mitarbeiter ist angelegt; das Protokoll zeigt die übernommenen Felder.
  Krankenkasse und Gehalt (mit der eingetragenen Lohnart) sind übernommen.
  _Nicht offensichtlich:_ Die Krankenkasse muss beim Testmandanten schon angelegt sein, sonst lehnt
  Lohn und Gehalt sie ab. Fehlerhafte Felder nennt nur das Protokoll von Lohn und Gehalt.
- Variante Rentner (Altersvollrente vor der Regelaltersgrenze): Personengruppe 120 wird übertragen
  und steht unter „Übertragen, bitte im Importprotokoll prüfen“. **Bitte im Protokoll nachsehen, ob
  Lohn und Gehalt die 120 annimmt**; die Feldbeschreibung V16.1 führt sie nicht.
- Gegenprobe: Die Datei `dist/index.html` (gehostete App) enthält die Zuordnung nicht.
- Danach den Testmitarbeiter wieder löschen.

## MT-69: Erfassungsblatt als PDF für die Personalakte

**Einstieg:** Direkt nach MT-68 (Schritt 3 erledigt).

**Voraussetzungen:** wie MT-68, Schritt 3 erledigt.

**Schritte:**

1. „Erfassungsblatt als PDF“.
2. Die PDF öffnen.

**Erwartet:**

- Dateiname nur mit Nummern, z. B. `Erfassungsblatt_LuG_M10001_MA42_3f2b8c1e.pdf` (kein Name).
- Oben: Mandant, Mitarbeiter, „neu anlegen“ oder „vorhandenen Mitarbeiter ergänzen“, Name und Eintritt;
  darunter die Grundlage (Teile mit SHA-256), „Von der Kanzlei eingetragen“, dann alle Werte in der
  Reihenfolge der Masken, „Nicht übertragen …“, „Übertragen, bitte im Importprotokoll prüfen“ und
  „Einspielen“.
- _Nicht offensichtlich:_ Das Blatt geht auch ohne Importdatei (dann steht oben „Noch keine
  Importdatei: …“). Es ist eine eigene Datei, keine Seite der Fragebogen-PDF (eine Unterlage je Datei).

## MT-70: Sofortmeldung zuerst, Personalfragebogen später zum selben Mitarbeiter

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“, danach einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ für dieselbe Person.

**Testbereich:** nur in der Kanzlei – braucht einen Testmandanten in Lohn und Gehalt.

**Voraussetzungen:** Fassung mit Entwürfen und Zuordnung (im Testbereich schon geladen; lokal `npm run build:preview`), Testmandant; eine
Sofortmeldung (ab 0.2.0) mit Personalnummer und später ein Personalfragebogen derselben Person
(„Angaben übernehmen“ aus der Sofortmeldung).

**Schritte:**

1. [Kanzlei mit Sofortmeldung öffnen](start:kanzlei-sofortmeldung-personalnummer) (Personalnummer 42) –
   oder die Sofortmeldung selbst einlesen; „neu anlegen“, Mandanten- und Mitarbeiternummer;
   Importdatei herunterladen und einspielen.
2. Später [Kanzlei mit Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig) (dieselbe
   Person) – oder den Personalfragebogen selbst einlesen; dieselbe Mitarbeiternummer, „vorhandenen Mitarbeiter
   ergänzen“; die Zeile „Bitte in DATEV Lohn und Gehalt vergleichen: Mitarbeiter … ist …“ mit Lohn und
   Gehalt vergleichen; Importdatei einspielen.
3. Gegenprobe: eine Mitarbeiternummer, die es im Testmandanten nicht gibt, mit „vorhandenen Mitarbeiter
   ergänzen“ einspielen.

**Erwartet:**

- Schritt 1: Der Mitarbeiter ist mit Name, Anschrift und persönlichen Angaben angelegt.
- Schritt 2: Derselbe Mitarbeiter ist ergänzt; es gibt keinen zweiten.
- Schritt 3: **Bitte festhalten, was das Protokoll meldet** – erwartet ist ein Fehler „Mitarbeiter nicht
  gefunden“ und kein neu angelegter Mitarbeiter (in der DATEV-Beschreibung nicht ausdrücklich
  beschrieben).
- _Nicht offensichtlich:_ Die eingefrorene Sofortmeldung 0.1.0 hat keine Übergabe (Straße mit
  Hausnummer und Staatsangehörigkeit als Freitext). Den Personalfragebogen **nicht zweimal**
  einspielen: Lohn und Gehalt legt Bezüge/Abzüge dann ein zweites Mal an (Auswahl nach „Gültig ab“ und
  Bezug/Abzug-Nr.).

## MT-71: Krankenkasse aus der Liste, frei eingegeben, und die Sicherheitsfrage

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Voraussetzungen:** Vorschau- oder Kanzlei-Build mit Zuordnung; ein Personalfragebogen, in dem die Person
„gesetzlich“ gewählt hat.

**Schritte:**

1. Als Person bei „Gesetzliche Krankenkasse“ „tk“ tippen.
2. Den Eintrag „Techniker Krankenkasse“ mit den Pfeiltasten und Enter wählen; weiter bis zum Ende,
   unterschreiben.
3. Zweiter Bogen: „Meine Betriebskasse“ frei eintippen und „Weiter“.
4. Kanzlei-Station: beide Bögen einlesen, je „Übergabe an DATEV Lohn und Gehalt“ öffnen.
5. Mandanten-/Mitarbeiternummer und „neu anlegen“ wählen, „Importdatei herunterladen“.

**Erwartet:**

- Schritt 1: Die Liste filtert beim Tippen; „Techniker Krankenkasse“ steht oben (Suchwort TK).
- Schritt 3: Unter dem Feld erscheint sofort „Nicht in der Liste. Die freie Eingabe ist möglich, kann aber
  Rückfragen und Zusatzaufwand verursachen …“; „Weiter“ geht trotzdem.
- Schritt 4: Beim ersten Bogen steht 15027365 schon im Feld „Betriebsnummer der Krankenkasse“; beim
  zweiten ist es leer. Die Suchliste findet Kassen nach Name oder Nummer; eine fehlende Kasse lässt sich
  mit 8 Ziffern eintippen.
- Schritt 5: Vor dem Download erscheint die Sicherheitsfrage („Mitarbeiternummer … Ist sie … noch frei?“);
  erst „Ja, geprüft – Datei herunterladen“ lädt die Datei. Ohne Personalnummer im Fragebogen steht am
  Feld „Im Fragebogen nicht angegeben – bitte eintragen.“

## MT-72: Kinderfreibeträge mit − und +

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:** Als Person bei „Kinderfreibeträge“ dreimal „+“, einmal „−“ drücken; dann „4,3“ tippen und
„Weiter“.

**Erwartet:** Die Zahl geht 0,5 → 1 → 1,5 → 1; „4,3“ wird abgelehnt („Bitte eine Zahl in halben Schritten
eingeben …“), „4,5“ wird angenommen. Unter 0 geht es nicht.

---

## MT-88: Vorschläge ziehen die richtigen Schlüsse (mehrere Minijobs, berufsmäßige Aushilfe)

**Einstieg:** Drei Startlinks, je einer pro Schritt.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen), Beginn 02.11.2026.

**Schritte:**

1. [Zweiter Minijob vorbereitet öffnen](start:personalfragebogen-zweiter-minijob-entgelt-offen) – die
   Person hat eine andere Beschäftigung angegeben (Minijob seit 01.01.2025, 300 € im Monat). Als
   Arbeitgeber „festes Monatsentgelt“ 450,00 €, „Minijob (bis 603 € im Monat)“, Lohnsteuer ELStAM;
   abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen.
2. [Arbeitsuchend vorbereitet öffnen](start:personalfragebogen-arbeitslos-entgelt-offen) – die Person
   ist „arbeitslos oder arbeitsuchend gemeldet“ (Arbeitslosengeld); der Arbeitgeber steht beim
   Monatsentgelt. 1.500,00 € eingeben; „kurzfristige Aushilfe …“, Ende `31.12.2026`, `30`
   Arbeitstage, Rahmenvereinbarung „Nein“, Lohnsteuer ELStAM; abschließen, **„PDF erstellen“** und die PDF in der Kanzlei-Station unter „Eingänge zusammenführen …“ einlesen.
3. Den Startlink aus Schritt 2 erneut öffnen und 500,00 € eingeben, sonst wie Schritt 2.

**Erwartet:**

- Schritt 1: Vorschlag Personengruppe **101** mit „bitte prüfen“, Beitragsgruppen **1111**,
  Kennzeichen Übergangsbereich 1 (mit „bitte prüfen“) – die beiden Minijobs liegen zusammen über 603 € und werden
  zusammengerechnet (nicht 109).
- Schritt 2: Personengruppe **101** mit „bitte prüfen“ statt 110 – wer arbeitsuchend gemeldet ist, ist
  berufsmäßig beschäftigt; über der Geringfügigkeitsgrenze ist die Aushilfe nicht kurzfristig.
- Schritt 3: wieder **110** / **0000** – bis zur Grenze kommt es auf die Berufsmäßigkeit nicht an.
- _Nicht offensichtlich:_ Die Begründung des Vorschlags nennt jeweils die Rechnung (Minijobs zusammen …
  bzw. Berufsmäßigkeit); alle Varianten stehen auch in `docs/sv-varianten/`.
