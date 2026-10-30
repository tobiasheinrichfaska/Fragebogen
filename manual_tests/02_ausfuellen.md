# 02 – Ausfüllen (Interview)

Alle Tests verwenden die **Sofortmeldung** und erfundene Daten.

## MT-10: Neuer Fragebogen und Rollenwahl

**Voraussetzungen:** MT-01 ist bestanden.

**Schritte:**

1. Klicken Sie auf **„Personalfragebogen: Angaben für die Sofortmeldung“**.

**Erwartet:**

- Es erscheint **„Wer füllt jetzt aus?“** mit drei Rollen: **Beschäftigte Person**, **Gesetzliche
  Vertretung**, **Arbeitgeber**, jeweils „noch offen“.
- _Nicht offensichtlich:_ Bei der gesetzlichen Vertretung steht „Nur nötig, wenn die Person am Tag
  ihrer Unterschrift minderjährig ist.“ und es gibt **keinen** Knopf. Das entscheidet sich erst mit
  der Unterschrift der Person.
- Im Kasten **„Stand“** steht „Noch nicht weitergeben“, und **„PDF erstellen“** ist ausgegraut.
- Oben steht eine Fragebogen-Nummer (8 Zeichen). Sie ist bei jedem neuen Fragebogen anders.

---

## MT-11: Interview des Arbeitgebers

**Voraussetzungen:** MT-10.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Arbeitgeber“**.
2. Beantworten Sie jede Frage und klicken Sie jeweils **„Weiter“**: Firma „Beispiel Bau GmbH“,
   Betriebsnummer „1234 5678“, Familienname „Musterfrau“, Vornamen „Erika“, Personalnummer leer
   lassen, Tag der Beschäftigungsaufnahme „02.11.2026“.

**Erwartet:**

- Es erscheint **eine Frage je Bildschirm**, mit Hilfetext darunter.
- Oben läuft ein Fortschrittsbalken („… von etwa 6 Fragen beantwortet“).
- Bei einer Pflichtfrage ohne Antwort ist **„Weiter“ ausgegraut**. Bei der Personalnummer
  (freiwillig) geht „Weiter“ auch ohne Antwort.
- Nach der letzten Frage erscheint die **Zusammenfassung** mit allen Antworten und je einem Link
  **„ändern“**.
- _Nicht offensichtlich:_ Die Betriebsnummer steht dort als „12345678“, das Leerzeichen ist weg. Das
  Datum steht als „02.11.2026“.

---

## MT-12: Ungültige Eingaben

**Voraussetzungen:** MT-10, Rolle „Arbeitgeber“ begonnen.

**Schritte:**

1. Geben Sie als Betriebsnummer „1234567“ ein (nur 7 Ziffern) und klicken Sie **„Weiter“**.
2. Geben Sie als Tag der Beschäftigungsaufnahme „31.02.2026“ ein und klicken Sie **„Weiter“**.

**Erwartet:**

- Unter dem Feld steht rot **„Die Betriebsnummer hat genau 8 Ziffern.“**, und die Frage bleibt
  stehen.
- Beim Datum steht **„Dieses Datum gibt es nicht.“**
- Nach einer korrekten Eingabe geht es mit „Weiter“ normal weiter.

---

## MT-13: Hinweise und „Weiß ich gerade nicht“ (Person)

**Voraussetzungen:** MT-10.

**Schritte:**

1. Klicken Sie auf **„Ich bin: Beschäftigte Person“**.
2. Lesen Sie den **Datenschutzhinweis**, setzen Sie das Häkchen **„Ich habe den Hinweis gelesen.“**
   und klicken Sie **„Weiter“**.
3. Beim Hinweis **„Ausweispapiere mitführen“** klicken Sie **„Weiter“**, **ohne** das Häkchen zu
   setzen.
4. Beantworten Sie die Fragen. Bei der **Versicherungsnummer** klicken Sie **„Weiß ich gerade
   nicht – später beantworten“**.

**Erwartet:**

- Die beiden Hinweise kommen **vor** der ersten Frage.
- _Nicht offensichtlich:_ Beim Papierhinweis steht ein Satz, dass Sie erst bestätigen sollen, wenn
  Sie das Papier erhalten haben. Weitermachen geht trotzdem.
- Nach „Weiß ich gerade nicht“ springt das Interview zur nächsten Frage.
- In der Zusammenfassung stehen zwei Kästen: **„Bitte bestätigen Sie noch diese Hinweise:
  Hinweis: Ausweispapiere mitführen …“** und **„Zurückgestellt mit ‚Weiß ich gerade nicht‘:
  Versicherungsnummer …“**.
- **„Weiter zum Abschluss“** ist ausgegraut, bis der Papierhinweis bestätigt ist (zurück zum
  Hinweis über „Zurück“). Die zurückgestellte Versicherungsnummer verhindert den Abschluss
  **nicht**, sie ist freiwillig.

---

## MT-14: Folgefragen und Antworten, die erhalten bleiben

**Voraussetzungen:** MT-13, Interview der Person läuft.

**Schritte:**

1. Bei **„Ist Ihr Geburtsname gleich Ihrem Familiennamen?“** klicken Sie **„Nein“**, dann
   **„Weiter“**.
2. Geben Sie als Geburtsname „Mustermann“ ein und klicken Sie **„Weiter“**.
3. Gehen Sie in der Zusammenfassung bei der Geburtsnamen-Frage auf **„ändern“** und wählen Sie
   **„Ja“**. Gehen Sie mit „Weiter“ bis zur Zusammenfassung.
4. Ändern Sie die Antwort wieder auf **„Nein“**.

**Erwartet:**

- Die Frage **„Wie lautet Ihr Geburtsname?“** erscheint **direkt nach** der Ja/Nein-Frage, leicht
  eingerückt.
- Nach Schritt 3 steht in der Zusammenfassung ein Kasten: **„Diese Angaben werden nicht mit
  unterschrieben, weil ihre Voraussetzung nicht mehr gilt …: Geburtsname (erst wenn …)“**.
- _Nicht offensichtlich:_ Nach Schritt 4 ist „Mustermann“ **wieder da**. Die Antwort war nur
  ausgeblendet, nicht gelöscht.
- Die Vorbelegungen sind gesetzt: Die Geburtsnamen-Frage startet mit „Ja“, „Liegt die Anschrift im
  Ausland?“ mit „Nein“.

---

## MT-15: Zwischenstand speichern und wieder öffnen

**Voraussetzungen:** Ein Interview ist begonnen, aber nicht abgeschlossen.

**Schritte:**

1. Klicken Sie in der Zusammenfassung auf **„Zwischenstand speichern“**.
2. Schließen Sie den Browser-Tab und öffnen Sie `index.html` neu.
3. Klicken Sie **„Datei öffnen …“** und wählen Sie die heruntergeladene Datei
   `Sofortmeldung_xxxxxxxx_Zwischenstand.json`.
4. Klicken Sie bei Ihrer Rolle auf **„Weitermachen“**.

**Erwartet:**

- Der Dateiname enthält **keinen Namen** der Person, nur die Fragebogen-Nummer.
- Nach dem Öffnen erscheint die Rollenübersicht mit Ihrer Rolle „begonnen, nicht abgeschlossen“.
- „Weitermachen“ springt zur **ersten noch offenen Frage**. Zurückgestellte Fragen bleiben
  zurückgestellt.
- _Nicht offensichtlich:_ Bestätigte Hinweise müssen nach dem Öffnen **erneut** bestätigt werden.
  Die Bestätigung gilt nur für die Sitzung, in der unterschrieben wird.

---

## MT-16: Warnung beim Schließen

**Voraussetzungen:** Ein Interview ist begonnen, seit dem letzten Speichern wurde etwas geändert.

**Schritte:**

1. Versuchen Sie, den Browser-Tab zu schließen oder die Seite neu zu laden.

**Erwartet:**

- Der Browser fragt nach, ob Sie die Seite wirklich verlassen wollen.
- Direkt nach „Zwischenstand speichern“ fragt er **nicht** mehr, bis Sie wieder etwas ändern.

---

## MT-17: Alle Daten löschen

**Voraussetzungen:** Ein Fragebogen ist geöffnet.

**Schritte:**

1. Klicken Sie **„Fragebogen schließen“** und bestätigen Sie die Rückfrage.
2. Klicken Sie auf der Startseite **„Alle Daten auf diesem Gerät löschen“**.

**Erwartet:**

- Die Seite lädt neu und zeigt die leere Startseite.
- _Nicht offensichtlich:_ Ein Stammdaten-Link in der Adresszeile (alles hinter `#`) ist danach
  ebenfalls weg. Heruntergeladene Dateien bleiben im Download-Ordner; das ist normal.

---

## MT-18: Angaben aus einer anderen Datei übernehmen

**Voraussetzungen:** Eine vollständige PDF einer Sofortmeldung liegt vor (z. B. aus MT-30).

**Schritte:**

1. Startseite → **„Sofortmeldung“** (ein neuer, leerer Fragebogen).
2. Auf „Wer füllt jetzt aus?“ klicken Sie **„Angaben aus einer anderen Datei übernehmen …“** und
   wählen die PDF aus Schritt „Voraussetzungen“.
3. Klicken Sie bei „Beschäftigte Person“ **„Weitermachen“**, blättern Sie durch das Interview und
   kehren Sie über **„Unterbrechen – zur Übersicht (Angaben bleiben erhalten)“** zurück.
4. Wiederholen Sie Schritt 2 mit derselben PDF noch einmal.
5. Öffnen Sie über **„Datei öffnen …“** auf der Startseite die PDF und versuchen Sie dann, dieselbe
   PDF über „Angaben aus einer anderen Datei übernehmen …“ zu übernehmen.

**Erwartet:**

- Nach Schritt 2 erscheint eine blaue Meldung „Angaben aus „Sofortmeldung“ übernommen …“ mit einer
  Zeile je Rolle (z. B. „Beschäftigte Person: 14 Angaben übernommen.“). Beide Rollen stehen jetzt
  auf **„begonnen, nicht abgeschlossen“** – _nichts ist unterschrieben_, die Unterschriften der
  alten Datei werden nie übernommen.
- Im Interview sind die Antworten eingetragen; eine abweichende Vorbelegung (z. B. „Geburtsname
  gleich Familienname?“ = Nein) ist durch die Antwort der alten Datei ersetzt, die Folgefrage
  „Geburtsname“ ist gefüllt.
- Schritt 4: Gelbe Meldung „Aus „Sofortmeldung“ ließ sich nichts übernehmen.“ mit Zeilen wie
  „Beschäftigte Person: 0 Angaben übernommen, 14 vorhandene behalten (…)“ – vorhandene Antworten
  werden **nie** überschrieben.
- Schritt 5: Rote Meldung „Das ist derselbe Fragebogen …“ – derselbe Fragebogen wird geöffnet,
  nicht übernommen.
- _Nicht offensichtlich:_ Die Schaltfläche fehlt, sobald alle Rollen abgeschlossen sind.

---

## MT-19: Schnellantworten, sofortiges Weiter und Postleitzahl

**Voraussetzungen:** Vorschau-Fassung (`npm run build:preview`), Sofortmeldung 0.2.0 (Entwurf).

**Schritte:**

1. Als „Beschäftigte Person“ den Familiennamen „Musterfrau“ eingeben, „Weiter“.
2. Die Frage nach dem Geburtsnamen lesen und **„Ja“** antippen.
3. Bei „Geburtsland“ den Knopf **„Deutschland“**, bei der Staatsangehörigkeit **„deutsch“** und bei
   der Versicherungsnummer **„Kenne ich nicht“** antippen.
4. Bei „Liegt die Anschrift im Ausland?“ **„Nein“**, beim Anschriftenzusatz **„Kein Zusatz“**.
5. Als Postleitzahl „1234“ eingeben, „Weiter“; dann „76131“.

**Erwartet:**

- Schritt 2: Die Frage lautet „… gleich dem gerade angegebenen Familiennamen „Musterfrau“?“. Ein
  Tipp auf „Ja“ antwortet **und** blättert weiter – „Weiter“ ist nicht nötig. Mit „Zurück“ lässt
  sich die Antwort ändern.
- Schritt 3: Jeder Knopf trägt die Antwort ein und blättert weiter; „Kenne ich nicht“ lässt das
  freiwillige Feld leer.
- Schritt 5: „1234“ wird abgelehnt („Bitte eine deutsche Postleitzahl mit 5 Ziffern eingeben.“),
  „76131“ angenommen. _Nicht offensichtlich:_ Bei „Ausland: Ja“ fragt der Fragebogen stattdessen
  eine Postleitzahl ohne Prüfung.
- Auf der Unterschriftsseite erklärt „Warum genügt das?“ mit Fundstellen, weshalb auch ein
  getippter Name als Unterschrift genügt.
