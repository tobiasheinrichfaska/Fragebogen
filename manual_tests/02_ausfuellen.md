# 02 – Ausfüllen (Interview)

Alle Tests verwenden die **Sofortmeldung** und erfundene Daten.

## MT-10: Neuer Fragebogen und Rollenwahl

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ – genau das ist Schritt 1.

**Voraussetzungen:** Startseite der App (im Testbereich: „App neu starten“ in der Kopfzeile; als Datei: `index.html` per Doppelklick öffnen).

**Schritte:**

1. Klicken Sie auf **„Personalfragebogen: Angaben für die Sofortmeldung“**.
   - **Danach:** Es erscheint **„Wer füllt jetzt aus?“** mit drei Rollen: **Beschäftigte Person**,
     **Gesetzliche Vertretung**, **Arbeitgeber**, jeweils „noch offen“.
   - **Danach:** _Nicht offensichtlich:_ Bei der gesetzlichen Vertretung steht „Nur nötig, wenn die
     Person am Tag ihrer Unterschrift minderjährig ist.“ und es gibt **keinen** Knopf. Das
     entscheidet sich erst mit der Unterschrift der Person.
   - **Danach:** Gleich unter den Rollen, vor „Gültigkeit und Grenzen“, steht der Kasten
     **„Stand“**: Dort steht „Noch nicht weitergeben“, und **„PDF erstellen“** ist ausgegraut.
   - **Danach:** Oben steht eine Fragebogen-Nummer (8 Zeichen). Sie ist bei jedem neuen Fragebogen
     anders.

---

## MT-11: Interview des Arbeitgebers

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Arbeitgeber“**.
   - **Danach:** Es erscheint **eine Frage je Bildschirm**, mit Hilfetext darunter. Oben läuft ein
     Fortschrittsbalken („… von etwa 7 Fragen beantwortet“).
   - **Danach:** Die erste Frage ist die Firma. Solange das Feld leer ist, ist **„Weiter“
     ausgegraut** – so bei jeder Pflichtfrage ohne Antwort.
2. Geben Sie als Firma `Beispiel Bau GmbH` ein und klicken Sie **„Weiter“**. Verwenden Sie in
   diesem Test **genau die genannten Werte**.
   - **Danach:** Es erscheint die Frage nach der Betriebsnummer.
3. Geben Sie als Betriebsnummer `1234 5671` ein – **mit dem Leerzeichen in der Mitte** (geprüft
   wird, dass die App es entfernt) – und klicken Sie **„Weiter“**.
   - **Danach:** Direkt nach der Betriebsnummer kommt „In welchem Wirtschaftsbereich arbeitet die
     Person?“ mit elf Bereichen und „keiner dieser Bereiche“. _Nicht offensichtlich:_ Die Frage
     gibt es ab Fassung 1.1.0 (Testordner); die öffentliche Fassung 1.0.0 hat sie nicht – dort geht
     es mit Schritt 6 weiter.
4. Wählen Sie beim Wirtschaftsbereich probeweise **„keiner dieser Bereiche“**.
   - **Danach:** _Nicht offensichtlich:_ Oben erscheint der Warnkasten „Für diesen Sonderfall ist
     der Fragebogen nicht gedacht …“ mit „Eine Sofortmeldung ist nur in den genannten
     Wirtschaftsbereichen vorgeschrieben.“ Die Auswahl hat schon zur nächsten Frage weitergeblättert.
5. Klicken Sie **„Zurück“** und wählen Sie beim Wirtschaftsbereich **„Baugewerbe“**.
   - **Danach:** Der Warnkasten verschwindet wieder.
6. Geben Sie als Familienname `Musterfrau` ein und klicken Sie **„Weiter“**.
7. Geben Sie als Vornamen `Erika` ein und klicken Sie **„Weiter“**.
8. Lassen Sie die Personalnummer leer und klicken Sie **„Weiter“**.
   - **Danach:** Bei der Personalnummer (freiwillig) geht „Weiter“ auch ohne Antwort: Es erscheint
     die Frage nach dem Tag der Beschäftigungsaufnahme.
9. Geben Sie als Tag der Beschäftigungsaufnahme `02.11.2026` ein und klicken Sie **„Weiter“**.
   - **Danach:** Nach der letzten Frage erscheint die **Zusammenfassung** mit allen Antworten und je
     einem Link **„ändern“**.
   - **Danach:** _Nicht offensichtlich:_ Die eingegebene Betriebsnummer „1234 5671“ steht dort als
     „12345671“ – das Leerzeichen ist weg. Haben Sie eine andere Nummer eingegeben, steht dort Ihre
     Nummer, ebenfalls ohne Leerzeichen. Das Datum steht als „02.11.2026“.

---

## MT-12: Ungültige Eingaben

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Arbeitgeber“**.
2. Geben Sie als Firma `Beispiel Bau GmbH` ein und klicken Sie **„Weiter“**.
   - **Danach:** Es erscheint die Frage nach der Betriebsnummer.
3. Geben Sie als Betriebsnummer `1234567` ein (nur 7 Ziffern) und klicken Sie **„Weiter“**.
   - **Danach:** Unter dem Feld steht rot **„Die Betriebsnummer hat genau 8 Ziffern.“**, und die
     Frage bleibt stehen.
4. Ändern Sie die Betriebsnummer auf `12345671` und klicken Sie **„Weiter“**.
   - **Danach:** Der Fehler verschwindet; nach der korrekten Eingabe geht es mit „Weiter“ normal
     weiter zur nächsten Frage.
5. Beantworten Sie die Fragen bis „An welchem Tag beginnt die Beschäftigung?“: beim
   Wirtschaftsbereich **„Baugewerbe“** antippen (nur ab Fassung 1.1.0 gefragt), Familienname
   `Musterfrau` und Vornamen `Erika` eingeben, die Personalnummer leer lassen – bei den Feldern
   jeweils **„Weiter“**.
6. Geben Sie als Tag der Beschäftigungsaufnahme `31.02.2026` ein und klicken Sie **„Weiter“**.
   - **Danach:** Beim Datum steht **„Dieses Datum gibt es nicht.“**
7. Löschen Sie das Datum im Feld.
   - **Danach:** Der Fehler verschwindet. Das leere Feld zeigt grau „TT.MM.JJJJ“. _Nicht
     offensichtlich:_ Am Handy zeigt die Tastatur nur Ziffern und ein Komma (das iPhone bietet
     Webseiten keine Zifferntastatur mit Punkt).
8. Tippen Sie nur Ziffern: <kbd>0211</kbd>.
   - **Danach:** Jede Ziffer ersetzt einen grauen Buchstaben, die Punkte stehen schon da und
     bleiben: Im Feld steht „02.11“ schwarz und „.JJJJ“ grau.
9. Tippen Sie weiter <kbd>2026</kbd>.
   - **Danach:** Im Feld steht „02.11.2026“.
10. Löschen Sie das Datum noch einmal und tippen Sie <kbd>2,11,2026</kbd>.
    - **Danach:** _Nicht offensichtlich:_ Ein getipptes Komma erscheint sofort als Punkt: Im Feld
      steht „2.11.2026“. Bei einstelligem Tag verschwindet die graue Vorgabe (iPhone-Testberichte
      vom 01.11. und 04.11.2026).
11. Klicken Sie **„Weiter“**.
    - **Danach:** Nach der korrekten Eingabe geht es normal weiter, zur Zusammenfassung.

---

## MT-13: Hinweise und „Vorerst überspringen“ (Person)

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und stehen bei „Wer füllt jetzt aus?“.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Beschäftigte Person“**.
   - **Danach:** Die beiden Hinweise kommen **vor** der ersten Frage; zuerst erscheint der
     **Datenschutzhinweis**. _Nicht offensichtlich (ab Fassung 1.1.0):_ Im Datenschutzhinweis
     steht, dass sich die Online-Fassung einen angefangenen Fragebogen höchstens 7 Tage merkt.
2. Setzen Sie beim Datenschutzhinweis das Häkchen **„Ich habe den Hinweis gelesen.“** und klicken
   Sie **„Weiter“**.
   - **Danach:** Es erscheint der Hinweis **„Ausweispapiere mitführen“**. _Nicht offensichtlich (ab
     Fassung 1.1.0):_ Der Hinweis ist kurz und zählt **keine** Wirtschaftsbereiche mehr auf – die
     Branche hat der Arbeitgeber gewählt.
   - **Danach:** _Nicht offensichtlich:_ Beim Papierhinweis steht ein Satz, dass Sie erst bestätigen
     sollen, wenn Sie das Papier erhalten haben.
3. Klicken Sie beim Hinweis „Ausweispapiere mitführen“ auf **„Weiter“**, **ohne** das Häkchen zu
   setzen.
   - **Danach:** Weitermachen geht trotzdem: Es erscheint die erste Frage.
4. Beantworten Sie die Fragen bis **„Sind Sie in Deutschland geboren?“**.
   - **Danach:** Dort ist **„Ja“** schon gewählt, und neben „Weiter“ gibt es **keinen** Knopf
     „Vorerst überspringen“. _Nicht offensichtlich:_ Der Knopf fehlt, sobald die Frage eine Antwort
     hat – auch eine vorbelegte.
5. Klicken Sie **„Weiter“** und beantworten Sie die Fragen bis zur **Versicherungsnummer**.
   - **Danach:** Das Feld ist leer, und neben „Weiter“ steht der Knopf **„Vorerst überspringen“**.
6. Klicken Sie **„Vorerst überspringen“**.
   - **Danach:** Das Interview springt zur nächsten Frage.
7. Beantworten Sie die übrigen Fragen bis zur Zusammenfassung.
   - **Danach:** Ganz oben steht der Kasten **„Das fehlt noch, bevor Sie abschließen können:“** mit
     „Bestätigung: Hinweis: Ausweispapiere mitführen …“ und dem Knopf **„ansehen und bestätigen“**
     (er führt zum Hinweis, „Zurück zur Zusammenfassung“ führt zurück). Fehlt eine Pflichtangabe,
     steht sie im selben Kasten mit **„beantworten“** – direkt dorthin, ohne Scrollen. Einen eigenen
     Kasten „Bitte bestätigen Sie noch diese Hinweise:“ gibt es nicht mehr (seit 06.11.2026).
   - **Danach:** Außerdem steht dort der Kasten **„Übersprungen: …“** mit der Versicherungsnummer und
     den Knöpfen **„beantworten“** und **„leer lassen“**.
8. In der Zusammenfassung tippen Sie bei der Versicherungsnummer auf **„leer lassen“**.
   - **Danach:** Die Versicherungsnummer verschwindet aus „Übersprungen“ und bleibt leer.

**Erwartet:**

- _Nicht offensichtlich:_ Fehlt beim Nachholen über „beantworten“ noch eine weitere Angabe oder ein
  noch nicht bestätigter Hinweis, gibt es neben „Zurück zur Zusammenfassung“ den Knopf **„Zur
  nächsten fehlenden Angabe“**. Er führt auch zum Hinweis, der noch zu bestätigen ist (seit
  06.11.2026; vorher fehlte er nach der letzten fehlenden Frage).
- **„Weiter zum Abschluss“** ist ausgegraut, bis der Papierhinweis bestätigt ist (über „ansehen
  und bestätigen“). Die zurückgestellte Versicherungsnummer verhindert den Abschluss
  **nicht**, sie ist freiwillig.

---

## MT-14: Folgefragen und Antworten, die erhalten bleiben

**Einstieg:** [Interview der Person öffnen](start:sofortmeldung-person-ab-geburtsname) – der Arbeitgeber hat abgeschlossen, die Person hat ihre Namen eingetragen; Sie stehen bei der Frage nach dem Geburtsnamen.

**Schritte:**

1. Sehen Sie sich die Frage **„Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen
   „Musterfrau“?“** an.
   - **Danach:** Die Vorbelegung ist gesetzt: Die Geburtsnamen-Frage startet mit „Ja“.
2. Klicken Sie **„Nein“**.
   - **Danach:** Die Frage **„Wie lautet Ihr Geburtsname?“** erscheint **direkt nach** der
     Ja/Nein-Frage, leicht eingerückt.
3. Geben Sie als Geburtsname `Mustermann` ein und klicken Sie **„Weiter“**.
4. Gehen Sie in der Zusammenfassung bei der Geburtsnamen-Frage auf **„ändern“** und wählen Sie
   **„Ja“**. Gehen Sie mit „Weiter“ bis zur Zusammenfassung.
   - **Danach:** In der Zusammenfassung steht ein Kasten: **„Diese Angaben werden nicht mit
     unterschrieben, weil ihre Voraussetzung nicht mehr gilt …: Geburtsname (erst wenn …)“**.
5. Ändern Sie die Antwort wieder auf **„Nein“**.
   - **Danach:** _Nicht offensichtlich:_ „Mustermann“ ist **wieder da**. Die Antwort war nur
     ausgeblendet, nicht gelöscht.

**Erwartet:**

- Auch „Liegt die Anschrift im Ausland?“ ist vorbelegt und startet mit „Nein“.

---

## MT-15: Zwischenstand speichern und wieder öffnen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und beantworten einige Fragen, ohne abzuschließen.

**Voraussetzungen:** Ein Interview ist begonnen, aber nicht abgeschlossen.

**Schritte:**

1. Klicken Sie in der Zusammenfassung auf **„Zwischenstand speichern“**.
   - **Danach:** Der Dateiname enthält **keinen Namen** der Person, nur die Fragebogen-Nummer.
2. Starten Sie die App neu: in der Kopfzeile **„App neu starten“** (oder die Seite
   mit **F5** neu laden); als Datei den Browser-Tab schließen und `index.html` neu öffnen.
3. Klicken Sie **„Datei öffnen …“** und wählen Sie die heruntergeladene Datei
   `Sofortmeldung_xxxxxxxx_Zwischenstand.json`.
   - **Danach:** Es erscheint die Rollenübersicht mit Ihrer Rolle „begonnen, nicht abgeschlossen“.
4. Klicken Sie bei Ihrer Rolle auf **„Weitermachen“**.
   - **Danach:** „Weitermachen“ springt zur **ersten noch offenen Frage**. Zurückgestellte Fragen
     bleiben zurückgestellt.

**Erwartet:**

- Bestätigte Hinweise sind nach dem Öffnen **weiterhin bestätigt** (seit 01.11.2026; vorher musste
  man sie erneut bestätigen).

---

## MT-16: Warnung beim Schließen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und beantworten einige Fragen.

**Voraussetzungen:** Ein Interview ist begonnen, seit dem letzten Speichern wurde etwas geändert.

**Schritte:**

1. Versuchen Sie, den Browser-Tab zu schließen oder die Seite neu zu laden.
   - **Danach:** Der Browser fragt nach, ob Sie die Seite wirklich verlassen wollen.

**Erwartet:**

- Direkt nach „Zwischenstand speichern“ fragt er **nicht** mehr, bis Sie wieder etwas ändern.

---

## MT-17: Alle Daten löschen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und beantworten eine Frage.

**Voraussetzungen:** Ein Fragebogen ist geöffnet.

**Schritte:**

1. Klicken Sie in der Übersicht unter „Stand“ **„Fragebogen schließen“** (aus dem Interview kommen
   Sie mit **„Unterbrechen – zur Übersicht (Angaben bleiben erhalten)“** dorthin) und bestätigen
   Sie die Rückfrage.
2. Klicken Sie auf der Startseite **„Alle Daten auf diesem Gerät löschen“**.
   - **Danach:** Es erscheint eine Sicherheitsfrage („Alle Daten auf diesem Gerät löschen? … nicht
     rückgängig …“) – **immer**, auch wenn gerade nichts geöffnet ist.
3. Klicken Sie bei der Sicherheitsfrage **„Abbrechen“**.
   - **Danach:** Nach „Abbrechen“ bleibt alles, wie es war.
4. Klicken Sie noch einmal **„Alle Daten auf diesem Gerät löschen“**, jetzt **„OK“**.
   - **Danach:** Die Seite lädt neu und zeigt die leere Startseite.
   - **Danach:** _Nicht offensichtlich:_ Ein Stammdaten-Link in der Adresszeile (alles hinter `#`)
     ist danach ebenfalls weg. Heruntergeladene Dateien bleiben im Download-Ordner; das ist normal.

---

## MT-18: Angaben aus einer anderen Datei übernehmen

**Einstieg:** [Vollständigen Fragebogen öffnen](start:sofortmeldung-vollstaendig) – Arbeitgeber abgeschlossen, die Person hat unterschrieben. Aus diesem Fragebogen erstellen Sie zuerst die PDF, deren Angaben Sie dann übernehmen.

**Schritte:**

1. Unter „Stand“ **„PDF erstellen“** klicken.
   - **Danach:** Die vollständige PDF wird heruntergeladen.
2. Unter „Stand“ **„Fragebogen schließen“** klicken.
3. Startseite → **„Personalfragebogen: Angaben für die Sofortmeldung“** (ein neuer, leerer Fragebogen).
4. Auf „Wer füllt jetzt aus?“ klicken Sie **„Angaben aus einer anderen Datei übernehmen …“** und
   wählen die eben erstellte PDF.
   - **Danach:** Eine blaue Meldung „Angaben aus „Sofortmeldung“ übernommen …“ erscheint, mit einer
     Zeile je Rolle (z. B. „Beschäftigte Person: 14 Angaben übernommen.“). Beide Rollen stehen jetzt
     auf **„begonnen, nicht abgeschlossen“** – _nichts ist unterschrieben_, die Unterschriften der
     alten Datei werden nie übernommen.
5. Klicken Sie bei „Beschäftigte Person“ **„Weitermachen“** und blättern Sie mit **„Weiter“** durch
   das Interview.
   - **Danach:** Im Interview sind die Antworten eingetragen; eine abweichende Vorbelegung (z. B.
     „Geburtsname gleich Familienname?“ = Nein) ist durch die Antwort der alten Datei ersetzt, die
     Folgefrage „Geburtsname“ ist gefüllt.
6. Kehren Sie über **„Unterbrechen – zur Übersicht (Angaben bleiben erhalten)“** zur Übersicht
   zurück.
7. Klicken Sie auf „Wer füllt jetzt aus?“ noch einmal
   **„Angaben aus einer anderen Datei übernehmen …“** und wählen Sie **dieselbe PDF**.
   - **Danach:** Gelbe Meldung „Aus „Sofortmeldung“ ließ sich nichts übernehmen.“ mit Zeilen wie
     „Beschäftigte Person: 0 Angaben übernommen, 14 vorhandene behalten (…)“ – vorhandene Antworten
     werden **nie** überschrieben.
8. Öffnen Sie über **„Datei öffnen …“** auf der Startseite die PDF und versuchen Sie dann, dieselbe
   PDF über „Angaben aus einer anderen Datei übernehmen …“ zu übernehmen.
   - **Danach:** Rote Meldung „Das ist derselbe Fragebogen …“ – derselbe Fragebogen wird geöffnet,
     nicht übernommen.

**Erwartet:**

- _Nicht offensichtlich:_ Die Schaltfläche fehlt, sobald alle Rollen abgeschlossen sind.

---

## MT-19: Schnellantworten, sofortiges Weiter und Postleitzahl

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ (ab Fassung 0.2.0; im Testbereich die neueste).

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen; lokal `npm run build:preview`), Sofortmeldung ab 0.2.0.

**Schritte:**

1. Als „Beschäftigte Person“ den Familiennamen `Musterfrau` eingeben, „Weiter“.
2. Die Vornamen `Erika` eingeben, „Weiter“, und die folgenden Fragen beantworten, bis die Frage
   nach dem Geburtsnamen erscheint.
   - **Danach:** Die Frage lautet „… gleich dem gerade angegebenen Familiennamen „Musterfrau“?“.
3. **„Ja“** antippen.
   - **Danach:** Ein Tipp auf „Ja“ antwortet **und** blättert weiter – „Weiter“ ist nicht nötig. Mit
     „Zurück“ lässt sich die Antwort ändern.
4. Das Geburtsdatum `17.05.1990` eingeben, „Weiter“.
5. Bei „Sind Sie in Deutschland geboren?“ ist **„Ja“** schon gewählt – „Weiter“.
   - **Danach:** Nach „In Deutschland geboren? Ja“ kommt direkt der Geburtsort („In welcher Stadt
     oder Gemeinde …“), kein Geburtsland.
6. Den Geburtsort `Musterstadt` eingeben, „Weiter“, und das Geschlecht antippen.
7. Bei „Haben Sie die deutsche Staatsangehörigkeit?“ ist **„Ja“** schon gewählt – „Weiter“.
8. Bei der Versicherungsnummer **„Kenne ich nicht“** antippen.
   - **Danach:** „Kenne ich nicht“ lässt das freiwillige Feld leer und blättert weiter.
9. Bei „Liegt die Anschrift im Ausland?“ **„Nein“** antippen, Straße `Musterweg` und Hausnummer `1`
   eingeben (jeweils „Weiter“), beim Anschriftenzusatz **„Kein Zusatz“** antippen.
10. Als Postleitzahl `1234` eingeben, „Weiter“.
    - **Danach:** „1234“ wird abgelehnt („Bitte eine deutsche Postleitzahl mit 5 Ziffern
      eingeben.“).
11. Die Postleitzahl auf `76131` ändern, „Weiter“.
    - **Danach:** Der Fehler verschwindet, „76131“ wird angenommen. _Nicht offensichtlich:_ Bei
      „Ausland: Ja“ fragt der Fragebogen stattdessen eine Postleitzahl ohne Prüfung.

**Erwartet:**

- Auf der Unterschriftsseite erklärt „Warum genügt das?“ mit Fundstellen, weshalb auch ein
  getippter Name als Unterschrift genügt.

---

## MT-26: Geburtsland und Staatsangehörigkeit außerhalb Deutschlands

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ (oder „Personalfragebogen: Angaben für die Sofortmeldung“) als „Beschäftigte Person“.

**Voraussetzungen:** Fassung mit Entwürfen (im Testbereich schon geladen; lokal `npm run build:preview`), Personalfragebogen oder Sofortmeldung
ab 0.2.0, Rolle „Beschäftigte Person“.

**Schritte:**

1. Bei „Sind Sie in Deutschland geboren?“ **„Nein“** antippen.
   - **Danach:** Erst jetzt kommt die Frage „In welchem Staat sind Sie geboren?“; danach der
     Geburtsort.
2. Beim Geburtsland `deu` tippen.
   - **Danach:** „Deutschland“ steht **nicht** in der Liste (das beantwortet die Ja/Nein-Frage).
3. Das Feld leeren, `tür` tippen und **„Türkei“** aus der Liste wählen, „Weiter“.
   - **Danach:** Keine Warnung; in der Zusammenfassung steht „Türkei“.
4. „Zurück“, beim Geburtsland stattdessen `Sowjetunion` eintippen.
   - **Danach:** Schon beim Tippen erscheint gelb der Hinweis, dass ein Eintrag außerhalb der Liste
     Rückfragen und Zusatzaufwand verursachen kann.
5. „Weiter“ klicken.
   - **Danach:** „Weiter“ geht trotzdem. _Nicht offensichtlich:_ In der Übergabe an Lohn und Gehalt
     steht dafür ein Problem „bitte von Hand eintragen“ – kein Schlüssel wird geraten.
6. Die Fragen bis „Haben Sie die deutsche Staatsangehörigkeit?“ beantworten und dort **„Nein“**
   antippen.
7. Bei der Staatsangehörigkeit `deu` tippen.
   - **Danach:** „deutsch“ steht **nicht** in der Liste (das beantwortet die Ja/Nein-Frage).
8. Das Feld leeren, `tür` tippen und **„türkisch“** aus der Liste wählen.

---

## MT-27: Fragebogen verwerfen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und beantworten einige Fragen.

**Voraussetzungen:** Ein Fragebogen ist geöffnet, einige Angaben sind gemacht.

**Schritte:**

1. Unten im Interview **„Fragebogen verwerfen“** tippen.
   - **Danach:** Eine Sicherheitsabfrage erscheint. Sie sagt, dass alle Angaben gelöscht werden und
     das nicht rückgängig zu machen ist.
2. Bei der Sicherheitsabfrage **„Abbrechen“** tippen.
   - **Danach:** Nach „Abbrechen“ ist alles unverändert.
3. Noch einmal **„Fragebogen verwerfen“** tippen, jetzt **„OK“**.
   - **Danach:** Die Startseite erscheint mit „Der Fragebogen wurde verworfen.“

**Erwartet:**

- _Nicht offensichtlich:_ Die Abfrage kommt immer, auch direkt nach „Zwischenstand speichern“; schon
  heruntergeladene Dateien bleiben auf dem Gerät.

---

## MT-116: Versehentlich geschlossen – angefangenen Fragebogen fortsetzen

**Einstieg:** Den **Testordner im Browser** öffnen (https, nicht als heruntergeladene Datei) und
einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ beginnen.

**Voraussetzungen:** Kein privates Fenster. Gut auch auf dem Handy.

**Schritte:**

1. **„Ich bin: Arbeitgeber“**, Firma `Beispiel Bau GmbH` eingeben und **„Weiter“**.
2. Schließen Sie den Tab (oder den ganzen Browser) – eine Warnung „Seite verlassen?“ dürfen Sie
   bestätigen.
3. Öffnen Sie den Testordner neu.
   - **Danach:** Oben steht **„Angefangener Fragebogen gefunden“** mit dem Formular, Datum und
     Uhrzeit und den Knöpfen **„Löschen“** und **„Fortsetzen“**.
4. Klicken Sie **„Fortsetzen“**, dann beim Arbeitgeber **„Weitermachen“**.
   - **Danach:** Die Meldung sagt „Angefangener Fragebogen aus diesem Browser fortgesetzt.“; der
     Arbeitgeber steht auf „begonnen, nicht abgeschlossen“, die Firma ist eingetragen.
5. Klicken Sie **„Fragebogen verwerfen“** und bestätigen Sie. Öffnen Sie den Testordner noch einmal
   neu.
   - **Danach:** Es wird **nichts** mehr angeboten – verworfen heißt auch aus dem Browser gelöscht.

**Erwartet:**

- _Nicht offensichtlich:_ Nach „PDF erstellen“ oder „Zwischenstand speichern“ merkt sich der Browser
  nichts mehr, bis Sie wieder etwas ändern – die Datei ist dann die Sicherung. Nach 7 Tagen ist der
  gemerkte Fragebogen weg (Meldung „… länger als 7 Tage … gelöscht“). In einer heruntergeladenen Kopie (`file://`) merkt sich die App nichts; ein privates Fenster
  vergisst beim Schließen alles. Kann der Browser gar nichts speichern, sagt die App das beim
  ersten Merken.

---

## MT-118: Datum im Kalender des Geräts wählen

**Einstieg:** Auf einem **iPhone** (Safari) und, wenn vorhanden, einem **Android-Handy** (Chrome)
den Testordner öffnen und einen neuen Fragebogen „Personalfragebogen: Angaben für die
Sofortmeldung“ beginnen.

**Voraussetzungen:** Keine.

**Schritte:**

1. Tippen Sie **„Ich bin: Arbeitgeber“** und beantworten Sie die Fragen bis
   **„An welchem Tag beginnt die Beschäftigung?“**: Firma `Beispiel Bau GmbH`, Betriebsnummer
   `12345671`, Wirtschaftsbereich **„Baugewerbe“** (nur ab Fassung 1.1.0 gefragt), Familienname
   `Musterfrau`, Vornamen `Erika`, Personalnummer leer lassen – bei den Feldern jeweils
   **„Weiter“**.
2. Tippen Sie auf den **Kalender-Knopf** rechts neben dem leeren Feld.
   - **Danach:** Es öffnet sich der Datumswähler des Geräts. Die Seite zoomt dabei **nicht** heran.
3. Wählen Sie einen Tag.
   - **Danach:** Der gewählte Tag steht als „TT.MM.JJJJ“ im Feld (z. B. „09.11.2026“).
4. Tippen Sie noch einmal auf den Kalender-Knopf und schließen Sie den Kalender wieder, ohne etwas
   zu ändern.
   - **Danach:** Steht schon ein gültiges Datum im Feld, öffnet der Kalender auf diesem Tag – hier
     auf dem eben gewählten.
5. Tippen Sie **„Weiter“**.
   - **Danach:** Die Zusammenfassung des Arbeitgebers erscheint.
6. Tippen Sie **„Unterbrechen – zur Übersicht (Angaben bleiben erhalten)“** und dann
   **„Ich bin: Beschäftigte Person“**.
7. Setzen Sie beim Datenschutzhinweis das Häkchen **„Ich habe den Hinweis gelesen.“**, tippen Sie
   bei beiden Hinweisen **„Weiter“** und beantworten Sie die Fragen bis **„Wann sind Sie geboren?“**:
   Familienname `Musterfrau`, Vornamen `Erika`, bei Titel, Vorsatzwort oder Namenszusatz **„Nein“**,
   beim Geburtsnamen **„Ja“**.
8. Tippen Sie beim **Geburtsdatum** auf den Kalender-Knopf.
   - **Danach:** _Nicht offensichtlich:_ Tage nach heute sind beim Geburtsdatum grau und nicht
     wählbar.
9. Stellen Sie als Jahr „1965“ ein.
   - **Danach:** _Nicht offensichtlich:_ Auf dem iPhone kommt man zum Jahr über einen Tipp auf
     **„Monat Jahr ›“** oben im Kalender – dann erscheinen Drehräder für Monat und Jahr; 1965 ist
     mit wenigen Wischern erreicht. Auf Android tippt man im Kalender oben auf die **Jahreszahl**
     und bekommt eine Jahresliste.
