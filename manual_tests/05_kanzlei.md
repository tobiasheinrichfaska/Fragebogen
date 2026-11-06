# Station Kanzlei: Eingänge zusammenführen

Für diese Tests brauchen Sie PDFs aus den Tests MT-30/MT-31 (nur erfundene Daten).

## MT-40: Mehrere Dateien auf einmal einlesen

**Einstieg:** Startseite der App (im Testbereich: „App neu starten“), Karte „Kanzlei“ → „Eingänge zusammenführen …“; Sie brauchen die PDFs aus MT-30 und MT-31.

**Voraussetzungen:** Eine vollständige PDF und die PDF des Arbeitgebers zur Weitergabe **desselben**
Fragebogens. Am schnellsten: [Nur Arbeitgeber abgeschlossen öffnen](start:sofortmeldung-arbeitgeber-abgeschlossen),
**„PDF erstellen“** (Weitergabe); dann im selben Fragebogen als „Beschäftigte Person“ ausfüllen,
unterschreiben und noch einmal **„PDF erstellen“** (vollständig).

**Schritte:**

1. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
2. **„Dateien hinzufügen …“** und beide PDFs gleichzeitig auswählen (Strg gedrückt halten).
   - **Danach:** _Nicht offensichtlich:_ Das Einlesen vieler PDFs dauert einige Sekunden; die
     Schaltfläche zeigt so lange „Wird gelesen …“.
   - **Danach:** Dann stehen beide Dateien in der Liste mit Formular, Version und den ersten 8
     Zeichen der Fragebogen-ID.
   - **Danach:** Darunter **eine** Karte für den Fragebogen: „2 Datei(en)“, Hinweis „Dieselbe
     Fassung ist mehrfach eingegangen und wurde einmal übernommen. (Arbeitgeber …)“ und grün
     „Vollständig und ohne Widersprüche.“
3. Dieselbe vollständige PDF über **„Dateien hinzufügen …“** noch einmal auswählen.
   - **Danach:** Die Liste wird nicht länger.
4. **„Prüfergebnis je Datei“** aufklappen.
   - **Danach:** Im Prüfergebnis steht zur noch einmal gewählten Datei „Diese Datei ist schon
     eingelesen; sie zählt einmal.“

---

## MT-41: Formular ansehen und PDF für die Personalakte

**Einstieg:** [Kanzlei mit vollständiger Sofortmeldung öffnen](start:kanzlei-sofortmeldung-vollstaendig) –
die Kanzlei-Station mit einem eingelesenen, vollständigen Fragebogen. Oder direkt nach MT-40.

**Voraussetzungen:** Startlink oder MT-40.

**Schritte:**

1. In der Karte des Fragebogens **„Formular ansehen“**.
   - **Danach:** Alle Angaben nach Abschnitten, rechts, wer sie gemacht hat; darunter die
     nummerierten Unterschriften und Abschlüsse.
2. **„PDF für die Personalakte“**.
   - **Danach:** PDF „…_vollstaendig.pdf“ wird heruntergeladen. Im Prüfblatt steht je
     eingelesener Datei ein **Eingangsvermerk „Kanzlei (App)“** mit Uhrzeit des Einlesens und
     Dateiname.
3. **„Daten speichern (JSON)“**.
   - **Danach:** Datei „…_Kanzlei.json“ wird heruntergeladen.
4. **„Zur Startseite“** klicken.
5. Dort weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
6. **„Dateien hinzufügen …“** und die eben heruntergeladene PDF für die Personalakte wählen.
7. In der Karte des Fragebogens **„Formular ansehen“**.
   - **Danach:** Unter „Eingangsvermerke“ stehen dieselben Vermerke wie vorher – **nicht doppelt**,
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
   - **Danach:** Rote Meldung „Für dieselbe Rolle liegen verschiedene Fassungen vor …“ mit einer
     Tabelle, die **nur die abweichenden Angaben** nebeneinander zeigt, je Spalte Datum und Datei.
     Es gibt noch keine Schaltflächen „PDF für die Personalakte“ – die App wählt nie selbst.
2. Bei „Sofortmeldung_Fassung_2.pdf“ **„Diese Fassung gilt“** klicken.
   - **Danach:** Der Konflikt verschwindet; ein Hinweis nennt die geltende und die verworfene
     Fassung. Weicht der Vorname jetzt von den Angaben des Arbeitgebers ab, erscheint gelb
     „Widersprüche: Die Vornamen weichen … ab.“ _Nicht offensichtlich:_ Ein Widerspruch blockiert
     die Ausgabe nicht; er ist ein Hinweis für die Kanzlei.
3. Unter „Ihre Entscheidungen“ **„zurücknehmen“** klicken.
   - **Danach:** Der Konflikt ist wieder da.

**Erwartet:**

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
   - **Danach:** Zwei Karten, jede mit „Es fehlt noch: Ein erforderlicher Teil fehlt noch. (…)“,
     und oben der Vorschlag „Übereinstimmend: Familienname, Vornamen“.
2. Bei „Gehören diese Fragebögen zusammen?“ **„Zusammenführen“** klicken.
   - **Danach:** Eine Karte „zusammengeführt aus …“ mit beiden IDs; unter „Ihre Entscheidungen“
     steht „Zusammengeführt: …“ mit „zurücknehmen“.
   - **Danach:** _Nicht offensichtlich:_ Danach bleibt „Es fehlt noch: Zwei Teile verweisen nicht
     aufeinander …“ stehen. Die Zusammenführung auf Entscheidung ersetzt nicht, dass eine Seite die
     andere bestätigt; dafür muss eine Seite ihren Teil auf Grundlage der anderen neu abschließen.

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
2. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, dort unter „Stand“ **„Fragebogen schließen“**.
4. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
5. **„Dateien hinzufügen …“** und die eben erstellte PDF wählen.
   - **Danach:** In der Karte des Fragebogens steht „Prüfhinweise:“ mit u. a. „Arbeitsuchend
     gemeldet und als kurzfristige Aushilfe vorgesehen …“ und der Fundstelle.
   - **Danach:** Dazu „Laut Geburtsdatum ist die Regelaltersgrenze bei Beschäftigungsbeginn
     erreicht … Regelaltersgrenze laut Geburtsdatum: 14.07.2026; Folgemonat: August 2026.“
   - **Danach:** _Nicht offensichtlich:_ Prüfhinweise blockieren nichts; die PDF lässt sich
     trotzdem erstellen.

---

## MT-45: Vorschlag Personengruppe

**Einstieg:** [Minijob vorbereitet öffnen](start:personalfragebogen-minijob-entgelt-offen) – die Person
(„einen Minijob“, keine weitere Beschäftigung) hat unterschrieben; der Arbeitgeber steht bei „Wie
wird die Person bezahlt?“.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen).

**Schritte:**

1. „festes Monatsentgelt“ `520,00 €`; „Wie ist die Beschäftigung vorgesehen?“ → „Minijob (bis
   603 € im Monat)“; Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
2. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
3. **„Gerät weitergeben – zur Übersicht“**, dort unter „Stand“ **„Fragebogen schließen“**.
4. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
5. **„Dateien hinzufügen …“** und die eben erstellte PDF wählen.
   - **Danach:** Unter „Vorschläge (die App entscheidet nicht – bitte prüfen)“ steht
     „Personengruppe: 109 – Minijob: festes Monatsentgelt bis zur Geringfügigkeitsgrenze. 520,00 €
     im Monat; Geringfügigkeitsgrenze 2026: 603,00 €.“
6. In der Karte des Fragebogens **„PDF für die Personalakte“** klicken.
7. Die heruntergeladene PDF öffnen und das Prüfblatt ansehen.
   - **Danach:** Dasselbe steht auf dem Prüfblatt mit „(Die App entscheidet das nicht.)“.

**Erwartet:**

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

1. Station „Kanzlei“ (auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge
   zusammenführen …“**): die PDFs einlesen (nach dem Startlink schon geschehen).
2. Unter „Übergabe an DATEV Lohn und Gehalt“ zunächst nichts eintragen.
   - **Danach:** „Noch keine Importdatei: Mandantennummer … fehlt“ und „Bitte wählen: Mitarbeiter
     neu anlegen oder vorhandenen Mitarbeiter ergänzen.“; der Knopf ist gesperrt. Unter den
     Eingabefeldern steht die Krankenkasse, die die Person genannt hat.
3. Mandantennummer des Testmandanten und eine freie Mitarbeiternummer eintragen; „neu anlegen“
   wählen; „Lohnart für das Monatsentgelt“, „Betriebsnummer der Krankenkasse“ und „KK-Nr. der
   Krankenkasse beim Mandanten“ aus dem Testmandanten eintragen; „Erfassungsblatt ansehen“.
   - **Danach:** Das Erfassungsblatt folgt den Masken von Lohn und Gehalt (Personaldaten,
     Beschäftigung, Sozialversicherung, Steuer …). Nicht Übertragbares steht mit Grund in der Liste
     „Nicht übertragen“.
4. „Importdatei herunterladen“; in Lohn und Gehalt auf Kanzleiebene Extras | Stammdatenimport
   die Datei wählen.
5. Auf Mandantenebene das Protokoll (Mandant | Ausgeben | Protokolle, „Stammdaten-Import-Prot.“)
   ansehen.
   - **Danach:** Der Mitarbeiter ist angelegt; das Protokoll zeigt die übernommenen Felder.
     Krankenkasse und Gehalt (mit der eingetragenen Lohnart) sind übernommen. _Nicht
     offensichtlich:_ Die Krankenkasse muss beim Testmandanten schon angelegt sein, sonst lehnt
     Lohn und Gehalt sie ab. Fehlerhafte Felder nennt nur das Protokoll von Lohn und Gehalt.

**Erwartet:**

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
   - **Danach:** Dateiname nur mit Nummern, z. B. `Erfassungsblatt_LuG_M10001_MA42_3f2b8c1e.pdf`
     (kein Name).
2. Die PDF öffnen.
   - **Danach:** Oben: Mandant, Mitarbeiter, „neu anlegen“ oder „vorhandenen Mitarbeiter
     ergänzen“, Name und Eintritt; darunter die Grundlage (Teile mit SHA-256), „Von der Kanzlei
     eingetragen“, dann alle Werte in der Reihenfolge der Masken, „Nicht übertragen …“,
     „Übertragen, bitte im Importprotokoll prüfen“ und „Einspielen“.

**Erwartet:**

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
   oder die Sofortmeldung selbst einlesen (Startseite, weiter unten im Abschnitt „Kanzlei“
   **„Eingänge zusammenführen …“**); „neu anlegen“, Mandanten- und Mitarbeiternummer; Importdatei
   herunterladen und einspielen.
   - **Danach:** Der Mitarbeiter ist mit Name, Anschrift und persönlichen Angaben angelegt.
2. Später [Kanzlei mit Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig) (dieselbe
   Person) – oder den Personalfragebogen selbst einlesen; dieselbe Mitarbeiternummer, „vorhandenen Mitarbeiter
   ergänzen“; die Zeile „Bitte in DATEV Lohn und Gehalt vergleichen: Mitarbeiter … ist …“ mit Lohn und
   Gehalt vergleichen; Importdatei einspielen.
   - **Danach:** Derselbe Mitarbeiter ist ergänzt; es gibt keinen zweiten.
3. Gegenprobe: eine Mitarbeiternummer, die es im Testmandanten nicht gibt, mit „vorhandenen Mitarbeiter
   ergänzen“ einspielen.
   - **Danach:** **Bitte festhalten, was das Protokoll meldet** – erwartet ist ein Fehler
     „Mitarbeiter nicht gefunden“ und kein neu angelegter Mitarbeiter (in der DATEV-Beschreibung
     nicht ausdrücklich beschrieben).

**Erwartet:**

- _Nicht offensichtlich:_ Die eingefrorene Sofortmeldung 0.1.0 hat keine Übergabe (Straße mit
  Hausnummer und Staatsangehörigkeit als Freitext). Den Personalfragebogen **nicht zweimal**
  einspielen: Lohn und Gehalt legt Bezüge/Abzüge dann ein zweites Mal an (Auswahl nach „Gültig ab“ und
  Bezug/Abzug-Nr.).

## MT-71: Krankenkasse aus der Liste, frei eingegeben, und die Sicherheitsfrage

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Voraussetzungen:** Vorschau- oder Kanzlei-Build mit Zuordnung; ein Personalfragebogen, in dem die Person
„gesetzlich“ gewählt hat.

**Schritte:**

1. Als Person bei „Gesetzliche Krankenkasse“ <kbd>tk</kbd> tippen.
   - **Danach:** Die Liste filtert beim Tippen; „Techniker Krankenkasse“ steht oben (Suchwort TK).
2. Den Eintrag „Techniker Krankenkasse“ mit den Pfeiltasten und Enter wählen.
3. Mit **„Weiter“** bis zum Ende, unterschreiben und in der Übersicht unter „Stand“ **„PDF
   erstellen“**.
4. Unter „Stand“ **„Fragebogen schließen“**.
5. Auf der Startseite einen zweiten neuen Fragebogen „Personalfragebogen: Angaben für die
   Lohnabrechnung“ als „Beschäftigte Person“ beginnen und bis „Gesetzliche Krankenkasse“ ausfüllen
   (wieder „gesetzlich“).
6. Bei „Gesetzliche Krankenkasse“ `Meine Betriebskasse` frei eintippen.
   - **Danach:** Unter dem Feld erscheint sofort „Nicht in der Liste. Die freie Eingabe ist möglich,
     kann aber Rückfragen und Zusatzaufwand verursachen …“.
7. **„Weiter“** klicken.
   - **Danach:** „Weiter“ geht trotzdem.
8. Mit **„Weiter“** bis zum Ende, unterschreiben und in der Übersicht unter „Stand“ **„PDF
   erstellen“**.
9. Unter „Stand“ **„Fragebogen schließen“**.
10. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
11. **„Dateien hinzufügen …“** und beide PDFs gleichzeitig auswählen (Strg gedrückt halten).
12. Beim ersten Bogen „Übergabe an DATEV Lohn und Gehalt“ öffnen.
    - **Danach:** 15027365 steht schon im Feld „Betriebsnummer der Krankenkasse“.
13. Beim zweiten Bogen „Übergabe an DATEV Lohn und Gehalt“ öffnen.
    - **Danach:** Das Feld „Betriebsnummer der Krankenkasse“ ist leer. Die Suchliste findet Kassen
      nach Name oder Nummer; eine fehlende Kasse lässt sich mit 8 Ziffern eintippen.
14. Beim ersten Bogen das Feld „Mitarbeiternummer“ ansehen.
    - **Danach:** Ohne Personalnummer im Fragebogen steht am Feld „Im Fragebogen nicht angegeben –
      bitte eintragen.“
15. Dort eine Mandantennummer und eine Mitarbeiternummer eintragen und „neu anlegen“ wählen.
16. **„Importdatei herunterladen“** klicken.
    - **Danach:** Vor dem Download erscheint die Sicherheitsfrage („Mitarbeiternummer … Ist sie …
      noch frei?“); die Datei wird noch nicht heruntergeladen.
17. **„Ja, geprüft – Datei herunterladen“** klicken.
    - **Danach:** Erst jetzt wird die Datei heruntergeladen.

## MT-72: Kinderfreibeträge mit − und +

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:**

1. Als Person bei „Kinderfreibeträge“ einmal **„+“** drücken.
   - **Danach:** Die Zahl ist 0,5.
2. Noch einmal **„+“** drücken.
   - **Danach:** Die Zahl ist 1.
3. Noch einmal **„+“** drücken.
   - **Danach:** Die Zahl ist 1,5.
4. Einmal **„−“** drücken.
   - **Danach:** Die Zahl ist wieder 1.
5. Das Feld auf `4,3` ändern und **„Weiter“** klicken.
   - **Danach:** „4,3“ wird abgelehnt („Bitte eine Zahl in halben Schritten eingeben …“).
6. Das Feld auf `4,5` ändern und **„Weiter“** klicken.
   - **Danach:** „4,5“ wird angenommen.

**Erwartet:**

- Unter 0 geht es nicht.

---

## MT-88: Vorschläge ziehen die richtigen Schlüsse (mehrere Minijobs, berufsmäßige Aushilfe)

**Einstieg:** Drei Startlinks, je einer am Anfang einer Gruppe von Schritten: Schritt 1, 7 und 13
(der dritte öffnet denselben vorbereiteten Fragebogen wie der zweite, für die Gegenprobe).

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen), Beginn 02.11.2026.

**Schritte:**

1. [Zweiter Minijob vorbereitet öffnen](start:personalfragebogen-zweiter-minijob-entgelt-offen) – die
   Person hat eine andere Beschäftigung angegeben (Minijob seit 01.01.2025, 300 € im Monat); der
   Arbeitgeber steht bei „Wie wird die Person bezahlt?“.
2. Als Arbeitgeber „festes Monatsentgelt“ `450,00 €`; „Wie ist die Beschäftigung vorgesehen?“ →
   „Minijob (bis 603 € im Monat)“; Lohnsteuer „nach den Lohnsteuermerkmalen (ELStAM)“.
3. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
4. **„Gerät weitergeben – zur Übersicht“**, dort unter „Stand“ **„Fragebogen schließen“**.
5. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
6. **„Dateien hinzufügen …“** und die eben erstellte PDF wählen.
   - **Danach:** Vorschlag Personengruppe **101** mit „bitte prüfen“, Beitragsgruppen **1111**,
     Kennzeichen Übergangsbereich 1 (mit „bitte prüfen“) – die beiden Minijobs liegen zusammen über
     603 € und werden zusammengerechnet (nicht 109).
7. [Arbeitsuchend vorbereitet öffnen](start:personalfragebogen-arbeitslos-entgelt-offen) – die Person
   ist „arbeitslos oder arbeitsuchend gemeldet“ (Arbeitslosengeld); der Arbeitgeber steht beim
   Monatsentgelt.
8. Als Arbeitgeber `1.500,00 €` eingeben; „Wie ist die Beschäftigung vorgesehen?“ → „kurzfristige
   Aushilfe …“; Ende `31.12.2026`, `30` Arbeitstage, Rahmenvereinbarung „Nein“, Lohnsteuer „nach
   den Lohnsteuermerkmalen (ELStAM)“.
9. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
10. **„Gerät weitergeben – zur Übersicht“**, dort unter „Stand“ **„Fragebogen schließen“**.
11. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
12. **„Dateien hinzufügen …“** und die eben erstellte PDF wählen.
    - **Danach:** Personengruppe **101** mit „bitte prüfen“ statt 110 – wer arbeitsuchend gemeldet
      ist, ist berufsmäßig beschäftigt; über der Geringfügigkeitsgrenze ist die Aushilfe nicht
      kurzfristig.
13. Für die Gegenprobe noch einmal
    [Arbeitsuchend vorbereitet öffnen](start:personalfragebogen-arbeitslos-entgelt-offen) – derselbe
    vorbereitete Fragebogen noch einmal; der Arbeitgeber steht wieder beim Monatsentgelt.
14. Als Arbeitgeber `500,00 €` eingeben; „Wie ist die Beschäftigung vorgesehen?“ → „kurzfristige
    Aushilfe …“; Ende `31.12.2026`, `30` Arbeitstage, Rahmenvereinbarung „Nein“, Lohnsteuer „nach
    den Lohnsteuermerkmalen (ELStAM)“.
15. Mit **„Weiter“** bis zur Zusammenfassung, ohne Unterschrift abschließen und **„PDF erstellen“**.
16. **„Gerät weitergeben – zur Übersicht“**, dort unter „Stand“ **„Fragebogen schließen“**.
17. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken.
18. **„Dateien hinzufügen …“** und die eben erstellte PDF wählen.
    - **Danach:** Wieder Personengruppe **110** und Beitragsgruppen **0000** – bis zur Grenze kommt es
      auf die Berufsmäßigkeit nicht an.

**Erwartet:**

- _Nicht offensichtlich:_ Die Begründung des Vorschlags nennt jeweils die Rechnung (Minijobs zusammen …
  bzw. Berufsmäßigkeit); alle Varianten stehen auch in `docs/sv-varianten/`.
