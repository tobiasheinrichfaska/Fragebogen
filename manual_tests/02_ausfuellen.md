# 02 – Ausfüllen (Interview)

Alle Tests verwenden die **Sofortmeldung** und erfundene Daten.

## MT-10: Neuer Fragebogen und Rollenwahl

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ – genau das ist Schritt 1.

**Voraussetzungen:** Startseite der App (im Testbereich: „App neu starten“ im Testbereich links; als Datei: MT-01).

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

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und spielen MT-10 durch – oder Sie machen direkt nach MT-10 weiter.

**Voraussetzungen:** MT-10.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Arbeitgeber“**.
   - **Danach:** Es erscheint **eine Frage je Bildschirm**, mit Hilfetext darunter. Oben läuft ein
     Fortschrittsbalken („… von etwa 7 Fragen beantwortet“).
2. Beantworten Sie ab jetzt jede Frage und klicken Sie jeweils **„Weiter“**. Geben Sie **genau
   diese Werte** ein – zuerst die Firma `Beispiel Bau GmbH`.
   - **Achten Sie gleich auf:** Bei einer Pflichtfrage ohne Antwort ist **„Weiter“ ausgegraut**.
3. Betriebsnummer `1234 5671` **mit dem Leerzeichen in der Mitte** (geprüft wird, dass die App es
   entfernt).
   - **Danach:** Direkt nach der Betriebsnummer kommt „In welchem Wirtschaftsbereich arbeitet die
     Person?“ mit elf Bereichen und „keiner dieser Bereiche“.
4. Wirtschaftsbereich **„Baugewerbe“**.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Wählen Sie probeweise „keiner dieser
     Bereiche“, erscheint oben der Warnkasten „Für diesen Sonderfall ist der Fragebogen nicht
     gedacht …“ mit „Eine Sofortmeldung ist nur in den genannten Wirtschaftsbereichen
     vorgeschrieben.“; mit „Baugewerbe“ verschwindet er wieder. Die Frage gibt es ab Fassung 1.1.0
     (Testordner); die öffentliche Fassung 1.0.0 hat sie nicht.
5. Familienname `Musterfrau`, Vornamen `Erika`.
6. Personalnummer leer lassen.
   - **Achten Sie gleich auf:** Bei der Personalnummer (freiwillig) geht „Weiter“ auch ohne
     Antwort.
7. Tag der Beschäftigungsaufnahme `02.11.2026`.
   - **Danach:** Nach der letzten Frage erscheint die **Zusammenfassung** mit allen Antworten und je
     einem Link **„ändern“**.
   - **Danach:** _Nicht offensichtlich:_ Die eingegebene Betriebsnummer „1234 5671“ steht dort als
     „12345671“ – das Leerzeichen ist weg. Haben Sie eine andere Nummer eingegeben, steht dort Ihre
     Nummer, ebenfalls ohne Leerzeichen. Das Datum steht als „02.11.2026“.

---

## MT-12: Ungültige Eingaben

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und spielen MT-10 durch – oder Sie machen direkt nach MT-10 weiter (Rolle „Arbeitgeber“).

**Voraussetzungen:** MT-10, Rolle „Arbeitgeber“ begonnen.

**Schritte:**

1. Geben Sie als Betriebsnummer `1234567` ein (nur 7 Ziffern) und klicken Sie **„Weiter“**.
   - **Danach:** Unter dem Feld steht rot **„Die Betriebsnummer hat genau 8 Ziffern.“**, und die
     Frage bleibt stehen.
2. Geben Sie als Tag der Beschäftigungsaufnahme `31.02.2026` ein und klicken Sie **„Weiter“**.
   - **Danach:** Beim Datum steht **„Dieses Datum gibt es nicht.“**
3. Am Handy: Tippen Sie das Datum nur mit Ziffern ein, <kbd>02112026</kbd>, und klicken Sie
   **„Weiter“**.
   - **Achten Sie gleich auf:** Das leere Feld zeigt grau „TT.MM.JJJJ“. Jede Ziffer ersetzt einen
     grauen Buchstaben, die Punkte stehen schon da und bleiben: nach „0211“ steht „02.11“ schwarz
     und „.JJJJ“ grau im Feld, am Ende „02.11.2026“.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Die Tastatur am Handy zeigt nur Ziffern und
     ein Komma (das iPhone bietet Webseiten keine Zifferntastatur mit Punkt). Ein getipptes Komma
     erscheint sofort als Punkt, so geht auch „2,11,2026“ → „2.11.2026“; bei einstelligem Tag
     verschwindet die graue Vorgabe (iPhone-Testberichte vom 01.11. und 04.11.2026).

**Erwartet:**

- Nach einer korrekten Eingabe geht es mit „Weiter“ normal weiter.

---

## MT-13: Hinweise und „Vorerst überspringen“ (Person)

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und spielen MT-10 durch – oder Sie machen direkt nach MT-10 weiter.

**Voraussetzungen:** MT-10.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Beschäftigte Person“**.
   - **Danach:** Die beiden Hinweise kommen **vor** der ersten Frage.
2. Lesen Sie den **Datenschutzhinweis**, setzen Sie das Häkchen **„Ich habe den Hinweis gelesen.“**
   und klicken Sie **„Weiter“**.
   - **Achten Sie gleich auf:** _Nicht offensichtlich (ab Fassung 1.1.0):_ Im Datenschutzhinweis
     steht, dass sich die Online-Fassung einen angefangenen Fragebogen höchstens 7 Tage merkt.
3. Beim Hinweis **„Ausweispapiere mitführen“** klicken Sie **„Weiter“**, **ohne** das Häkchen zu
   setzen.
   - **Achten Sie gleich auf:** _Nicht offensichtlich (ab Fassung 1.1.0):_ Der Hinweis ist kurz und
     zählt **keine** Wirtschaftsbereiche mehr auf – die Branche hat der Arbeitgeber gewählt.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Beim Papierhinweis steht ein Satz, dass Sie
     erst bestätigen sollen, wenn Sie das Papier erhalten haben.
   - **Danach:** Weitermachen geht trotzdem.
4. Beantworten Sie die Fragen. Bei der **Versicherungsnummer** klicken Sie **„Vorerst überspringen“**
   (neben „Weiter“).
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Der Knopf fehlt, sobald die Frage eine
     Antwort hat – auch eine vorbelegte (z. B. „In Deutschland geboren? Ja“).
   - **Danach:** Nach „Vorerst überspringen“ springt das Interview zur nächsten Frage.
5. Beantworten Sie die übrigen Fragen bis zur Zusammenfassung.
   - **Danach:** Ganz oben steht der Kasten **„Das fehlt noch, bevor Sie abschließen können:“** mit
     „Bestätigung: Hinweis: Ausweispapiere mitführen …“ und dem Knopf **„ansehen und bestätigen“**
     (er führt zum Hinweis, „Zurück zur Zusammenfassung“ führt zurück). Fehlt eine Pflichtangabe,
     steht sie im selben Kasten mit **„beantworten“** – direkt dorthin, ohne Scrollen. Einen eigenen
     Kasten „Bitte bestätigen Sie noch diese Hinweise:“ gibt es nicht mehr (seit 06.11.2026).
   - **Danach:** Außerdem steht dort der Kasten **„Übersprungen: …“** mit der Versicherungsnummer und
     den Knöpfen **„beantworten“** und **„leer lassen“**.
6. In der Zusammenfassung tippen Sie bei der Versicherungsnummer auf **„leer lassen“**.
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

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und spielen MT-13 durch – oder Sie machen direkt nach MT-13 weiter (Interview der beschäftigten Person).

**Voraussetzungen:** MT-13, Interview der Person läuft.

**Schritte:**

1. Bei **„Ist Ihr Geburtsname gleich Ihrem Familiennamen?“** klicken Sie **„Nein“**, dann
   **„Weiter“**.
   - **Achten Sie gleich auf:** Die Vorbelegung ist gesetzt: Die Geburtsnamen-Frage startet mit
     „Ja“.
   - **Danach:** Die Frage **„Wie lautet Ihr Geburtsname?“** erscheint **direkt nach** der
     Ja/Nein-Frage, leicht eingerückt.
2. Geben Sie als Geburtsname `Mustermann` ein und klicken Sie **„Weiter“**.
3. Gehen Sie in der Zusammenfassung bei der Geburtsnamen-Frage auf **„ändern“** und wählen Sie
   **„Ja“**. Gehen Sie mit „Weiter“ bis zur Zusammenfassung.
   - **Danach:** In der Zusammenfassung steht ein Kasten: **„Diese Angaben werden nicht mit
     unterschrieben, weil ihre Voraussetzung nicht mehr gilt …: Geburtsname (erst wenn …)“**.
4. Ändern Sie die Antwort wieder auf **„Nein“**.
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
2. Starten Sie die App neu: im Testbereich links **„App neu starten (Startseite)“** (oder die Seite
   mit F5 neu laden, wie in MT-16); als Datei den Browser-Tab schließen und `index.html` neu öffnen.
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
2. Klicken Sie auf der Startseite **„Alle Daten auf diesem Gerät löschen“** und bei der
   Sicherheitsfrage zuerst **„Abbrechen“**.
   - **Achten Sie gleich auf:** **Immer** eine Sicherheitsfrage („Alle Daten auf diesem Gerät
     löschen? … nicht rückgängig …“), auch wenn gerade nichts geöffnet ist.
   - **Danach:** Nach „Abbrechen“ bleibt alles, wie es war.
3. Noch einmal, jetzt **„OK“**.
   - **Danach:** Die Seite lädt neu und zeigt die leere Startseite.
   - **Danach:** _Nicht offensichtlich:_ Ein Stammdaten-Link in der Adresszeile (alles hinter `#`)
     ist danach ebenfalls weg. Heruntergeladene Dateien bleiben im Download-Ordner; das ist normal.

---

## MT-18: Angaben aus einer anderen Datei übernehmen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“; dazu brauchen Sie die vollständige PDF aus MT-30.

**Voraussetzungen:** Eine vollständige PDF einer Sofortmeldung liegt vor (z. B. aus MT-30).

**Schritte:**

1. Startseite → **„Personalfragebogen: Angaben für die Sofortmeldung“** (ein neuer, leerer Fragebogen).
2. Auf „Wer füllt jetzt aus?“ klicken Sie **„Angaben aus einer anderen Datei übernehmen …“** und
   wählen die PDF aus Schritt „Voraussetzungen“.
   - **Danach:** Eine blaue Meldung „Angaben aus „Sofortmeldung“ übernommen …“ erscheint, mit einer
     Zeile je Rolle (z. B. „Beschäftigte Person: 14 Angaben übernommen.“). Beide Rollen stehen jetzt
     auf **„begonnen, nicht abgeschlossen“** – _nichts ist unterschrieben_, die Unterschriften der
     alten Datei werden nie übernommen.
3. Klicken Sie bei „Beschäftigte Person“ **„Weitermachen“**, blättern Sie durch das Interview und
   kehren Sie über **„Unterbrechen – zur Übersicht (Angaben bleiben erhalten)“** zurück.
   - **Achten Sie gleich auf:** Im Interview sind die Antworten eingetragen; eine abweichende
     Vorbelegung (z. B. „Geburtsname gleich Familienname?“ = Nein) ist durch die Antwort der alten
     Datei ersetzt, die Folgefrage „Geburtsname“ ist gefüllt.
4. Wiederholen Sie Schritt 2 mit derselben PDF noch einmal.
   - **Danach:** Gelbe Meldung „Aus „Sofortmeldung“ ließ sich nichts übernehmen.“ mit Zeilen wie
     „Beschäftigte Person: 0 Angaben übernommen, 14 vorhandene behalten (…)“ – vorhandene Antworten
     werden **nie** überschrieben.
5. Öffnen Sie über **„Datei öffnen …“** auf der Startseite die PDF und versuchen Sie dann, dieselbe
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
2. Die Frage nach dem Geburtsnamen lesen und **„Ja“** antippen.
   - **Achten Sie gleich auf:** Die Frage lautet „… gleich dem gerade angegebenen Familiennamen
     „Musterfrau“?“.
   - **Danach:** Ein Tipp auf „Ja“ antwortet **und** blättert weiter – „Weiter“ ist nicht nötig. Mit
     „Zurück“ lässt sich die Antwort ändern.
3. Bei „Sind Sie in Deutschland geboren?“ und „Haben Sie die deutsche Staatsangehörigkeit?“ ist
   **„Ja“** schon gewählt – „Weiter“. Bei der Versicherungsnummer **„Kenne ich nicht“** antippen.
   - **Achten Sie gleich auf:** Nach „In Deutschland geboren? Ja“ kommt direkt der Geburtsort („In
     welcher Stadt oder Gemeinde …“), kein Geburtsland.
   - **Danach:** „Kenne ich nicht“ lässt das freiwillige Feld leer und blättert weiter.
4. Bei „Liegt die Anschrift im Ausland?“ **„Nein“**, beim Anschriftenzusatz **„Kein Zusatz“**.
5. Als Postleitzahl `1234` eingeben, „Weiter“; dann `76131`.
   - **Danach:** „1234“ wird abgelehnt („Bitte eine deutsche Postleitzahl mit 5 Ziffern
     eingeben.“), „76131“ angenommen. _Nicht offensichtlich:_ Bei „Ausland: Ja“ fragt der
     Fragebogen stattdessen eine Postleitzahl ohne Prüfung.

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
2. Beim Geburtsland `tür` tippen und **„Türkei“** aus der Liste wählen, „Weiter“.
   - **Danach:** Keine Warnung; in der Zusammenfassung steht „Türkei“.
3. „Zurück“, stattdessen `Sowjetunion` eintippen, „Weiter“.
   - **Achten Sie gleich auf:** Schon beim Tippen erscheint gelb der Hinweis, dass ein Eintrag
     außerhalb der Liste Rückfragen und Zusatzaufwand verursachen kann. „Weiter“ geht trotzdem.
   - **Danach:** _Nicht offensichtlich:_ In der Übergabe an Lohn und Gehalt steht dafür ein Problem
     „bitte von Hand eintragen“ – kein Schlüssel wird geraten.
4. Bei „Haben Sie die deutsche Staatsangehörigkeit?“ **„Nein“**, dann **„türkisch“** aus der Liste.
   - **Achten Sie gleich auf:** „Deutschland“ und „deutsch“ stehen nicht in diesen Listen (das
     beantwortet die Ja/Nein-Frage).

---

## MT-27: Fragebogen verwerfen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ und beantworten einige Fragen.

**Voraussetzungen:** Ein Fragebogen ist geöffnet, einige Angaben sind gemacht.

**Schritte:**

1. Unten im Interview **„Fragebogen verwerfen“** tippen, bei der Sicherheitsabfrage **„Abbrechen“**.
   - **Achten Sie gleich auf:** Die Abfrage sagt, dass alle Angaben gelöscht werden und das nicht
     rückgängig zu machen ist.
   - **Danach:** Nach „Abbrechen“ ist alles unverändert.
2. Noch einmal, jetzt **„OK“**.
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

1. **„Ich bin: Arbeitgeber“** und bis zur Frage **„An welchem Tag beginnt die Beschäftigung?“**
   antworten.
2. Tippen Sie auf den **Kalender-Knopf** rechts neben dem Feld und wählen Sie einen Tag.
   - **Achten Sie gleich auf:** Es öffnet sich der Datumswähler des Geräts. Steht schon ein gültiges
     Datum im Feld, öffnet der Kalender auf diesem Tag.
   - **Danach:** Der gewählte Tag steht als „TT.MM.JJJJ“ im Feld (z. B. „09.11.2026“).
3. Später, als **„Beschäftigte Person“**, beim **Geburtsdatum** wieder den Kalender-Knopf tippen
   und als Jahr „1965“ einstellen.
   - **Achten Sie gleich auf:** _Nicht offensichtlich:_ Auf dem iPhone kommt man zum Jahr über einen
     Tipp auf **„Monat Jahr ›“** oben im Kalender – dann erscheinen Drehräder für Monat und Jahr;
     1965 ist mit wenigen Wischern erreicht. Auf Android tippt man im Kalender oben auf die
     **Jahreszahl** und bekommt eine Jahresliste. Tage nach heute sind beim Geburtsdatum grau und
     nicht wählbar.

**Erwartet:**

- Die Seite zoomt beim Öffnen des Kalenders **nicht** heran.
