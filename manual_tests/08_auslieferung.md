# 08 – Auslieferung auf der Homepage

## MT-80: App auf der Subdomain mit `.htaccess`

**Einstieg:** Die öffentliche Adresse der App im Browser (nicht der Testbereich).

**Voraussetzungen:**

- Subdomain bei IONOS mit eigenem Ordner; HTTPS-Zertifikat aktiv.
- Hochgeladen: `index.html` (aus `npm run build`, Ordner `dist/`) und `deploy/.htaccess`
  (siehe [`deploy/README.md`](../deploy/README.md)).

**Schritte:**

1. Die Adresse mit `http://` statt `https://` aufrufen.
   - **Danach:** Der Browser landet auf `https://…`.
2. Die App öffnen, einen Fragebogen beginnen und eine PDF erzeugen.
   - **Danach:** Die App funktioniert wie offline; keine Fehlermeldung.
3. Im Browser die Entwicklerwerkzeuge öffnen (F12) → Netzwerk → `index.html` anklicken → Antwort-Header
   ansehen.
   - **Danach:** Es gibt `Content-Security-Policy` mit `frame-ancestors 'none'`,
     `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
     `Cache-Control: no-cache`. _Nicht offensichtlich:_ Die strenge Policy für Skripte steht
     zusätzlich als Meta-Tag in der Datei; beide gelten gleichzeitig.
4. Die Adresse `…/.htaccess` aufrufen.
   - **Danach:** „Forbidden“ (versteckte Dateien werden nicht ausgeliefert).
5. Optional: die Adresse bei einem Header-Prüfdienst eingeben (z. B. securityheaders.com).
   - **Danach:** Ein Hinweis auf eine fehlende Skript-Regel im Header ist erwartbar (sie steht im
     Meta-Tag).

## MT-82: Hochladen mit dem Upload-Werkzeug

**Testbereich:** nein – nur am Kanzlei-PC mit dem Upload-Werkzeug.

**Voraussetzungen:** Das Upload-Werkzeug „Auslieferung“ liegt auf dem Kanzlei-PC neben diesem Projekt
(`..\..\private\Auslieferung`), sein Zugang `fragebogen` ist eingerichtet (sonst fragt das erste
`npm run hochladen` die Zugangsdaten ab); PuTTY und Node.js installiert.

**Schritte:**

1. In VS Code im Terminal: `npm run hochladen -- -Ziel test -Probelauf`.
   - **Danach:** „Verbindung in Ordnung“ mit der Liste der Dateien und dem Vergleich mit der Seite
     online: „index.html: online schon genau diese Datei“ oder „online anders – ein Upload ändert die
     Seite“. Der Inhalt des Zielordners steht im Terminal. Es wurde nichts hochgeladen. _Nicht
     offensichtlich:_ Der Probelauf baut nicht neu, er vergleicht die Dateien, wie sie auf dem PC
     liegen.
2. `npm run hochladen -- -Ziel test` aufrufen.
   - **Danach:** Die App wird gebaut; dann erscheint die Rückfrage „Jetzt hochladen?“. Sie nennt
     Server, Ordner, Stand (Commit) und die Dateien. _Nicht offensichtlich:_ Gibt es nicht committete
     Änderungen, warnt die Rückfrage davor.
3. Die Rückfrage „Jetzt hochladen?“ mit **„Ja“** beantworten.
   - **Danach:** „Hochgeladen …“ und **„index.html: online identisch“**.
4. `npm run hochladen` (ohne Ziel).
   - **Danach:** Meldung „Welches Ziel? Vorhanden: oeffentlich, test, mehrfachbearbeitung“, nichts
     wird hochgeladen. _Nicht offensichtlich:_ Es gibt kein voreingestelltes Ziel mehr – die
     öffentliche App geht nur hoch, wenn sie ausdrücklich genannt wird.
5. Die Datei `..\..\private\Auslieferung\.local\zugaenge\fragebogen\sftp-passwort.dpapi` in einem
   Editor öffnen.
   - **Danach:** Nur eine lange Zeichenfolge, kein lesbares Passwort. _Nicht offensichtlich:_ Ein
     anderer Windows-Benutzer (oder ein anderer PC) kann die Datei nicht entschlüsseln; dort fragt
     das Werkzeug neu.
6. Eine Kleinigkeit ändern, ohne sie zu committen, und
   `npm run hochladen -- -Ziel test -OhneRueckfrage` aufrufen.
   - **Danach:** Es öffnet sich **kein** Fenster. Mit der Änderung bricht das Werkzeug im Terminal ab
     („Ohne Rückfrage wird nur ein committeter Stand hochgeladen …“) und lädt nichts hoch.
7. Die Änderung zurücknehmen und `npm run hochladen -- -Ziel test -OhneRueckfrage` erneut aufrufen.
   - **Danach:** Auch jetzt öffnet sich **kein** Fenster; im Terminal steht „Ohne Rückfrage: wird
     hochgeladen.“ und am Ende „index.html: online identisch“.
8. `npm run hochladen -- -Ziel oeffentlich -Probelauf`.
   - **Danach:** Zeigt, ob ein Upload die öffentliche App ändern würde – vor einer Veröffentlichung,
     ohne etwas hochzuladen.

**Erwartet:**

- Zugang oder IP-Adressen ändern:
  `powershell -ExecutionPolicy Bypass -File ..\..\private\Auslieferung\upload.ps1 -Einrichten -Zugang fragebogen`.

## MT-83: Test- und Kanzlei-Ordner nur von den IP-Adressen der Kanzlei

**Testbereich:** nein – nur am Kanzlei-PC mit dem Upload-Werkzeug.

**Voraussetzungen:** Das Upload-Werkzeug „Auslieferung“ liegt auf dem Kanzlei-PC neben diesem Projekt (`..\..\private\Auslieferung`), sein Zugang `fragebogen` ist eingerichtet; im Einrichtungsfenster sind die IP-Adressen der Kanzlei eingetragen („Zugang oder IP-Adressen ändern“).

**Schritte:**

1. Später, wenn die Mehrfachbearbeitung hochgeladen wird:
   `npm run hochladen -- -Ziel mehrfachbearbeitung` aufrufen.
   - **Danach:** Die Rückfrage „Jetzt hochladen?“ nennt zuerst `.htaccess (Zugriffsregeln, erzeugt)`,
     dann `index.html`.
2. Die Rückfrage mit **„Ja“** beantworten.
   - **Danach:** „index.html: online identisch“.
3. Für den Testordner `npm run hochladen -- -Ziel test` aufrufen.
   - **Danach:** Solange es keinen freigegebenen Tester gibt, nennt die Rückfrage „Jetzt hochladen?“
     zusätzlich den Hinweis „Noch kein freigegebener Tester … – bis dahin nur die IPs des Büros“.
4. Die Rückfrage mit **„Ja“** beantworten.
   - **Danach:** „Hochgeladen …“ und „index.html: online identisch“.
5. Im Büro `…/mehrfachbearbeitung/` und `…/test/` im Browser öffnen.
   - **Danach:** Kanzlei-App bzw. „Fragebogen-Test“ mit dem gelben Hinweis auf Formular-Entwürfe.
     _Nicht offensichtlich:_ Auch im Testordner bietet die Kanzlei-Station die Übergabe an Lohn und
     Gehalt an.
6. Am Handy **ohne WLAN** (Mobilfunk) `…/mehrfachbearbeitung/` und `…/test/` öffnen.
   - **Danach:** **„Forbidden“** bei beiden. _Nicht offensichtlich:_ Die öffentliche App unter der
     Hauptadresse geht weiter für alle.

## MT-84: Tester anlegen und von außen anmelden

**Testbereich:** nein – nur am Kanzlei-PC mit dem Upload-Werkzeug.

**Voraussetzungen:** Das Upload-Werkzeug „Auslieferung“ ist eingerichtet (Zugang `fragebogen`, IP-Adressen der Kanzlei eingetragen), und der Testordner ist hochgeladen (`npm run hochladen -- -Ziel test`).

**Schritte:**

1. Im Terminal `npm run tester` aufrufen und im Fenster **„Neuer Tester …“** klicken.
2. Als Anmeldename `probe.tester` eintragen, das Passwort leer lassen und **„OK“** klicken.
   - **Danach:** Ein Passwort wird angezeigt. Es hat die Form „abcd-efgh-jkmn“ und erscheint nur
     dieses eine Mal.
3. Das angezeigte Passwort notieren und **„Fertig“** klicken.
4. **„Ordner aktualisieren“** klicken.
   - **Danach:** Die Liste in der Rückfrage nennt `.htpasswd (erzeugt)` vor `.htaccess (erzeugt)`;
     kein Hinweis „nur die IPs des Büros“ mehr.
5. Die Rückfrage mit **„Ja“** beantworten.
6. Am Handy **ohne WLAN** `https://…/test/` öffnen.
   - **Danach:** Der Browser fragt nach Name und Passwort.
7. Mit `probe.tester` und dem notierten Passwort anmelden.
   - **Danach:** Es erscheint „Fragebogen-Test“. _Nicht offensichtlich:_ Erscheint stattdessen
     „Internal Server Error“, stimmt der Pfad zur Passwortdatei nicht oder der Server kennt das
     Passwortformat nicht – bitte melden, nicht weiter probieren.
8. Am Handy `http://…/test/` öffnen (mit `http://` statt `https://`).
   - **Danach:** **Keine** Passwortabfrage über `http://` (erst die Umleitung auf `https://`, oder
     „Forbidden“).
9. Im Fenster des Werkzeugs „probe.tester“ wählen und **„Sperren / Freigeben“** klicken.
10. **„Ordner aktualisieren“** klicken und die Rückfrage mit **„Ja“** beantworten.
11. Am Handy die Seite `https://…/test/` neu laden (ggf. in einem privaten Fenster öffnen) und mit
    `probe.tester` und dem Passwort anmelden.
    - **Danach:** Die Anmeldung gelingt nicht mehr.
12. Im Büro `…/test/` öffnen.
    - **Danach:** „Fragebogen-Test“ öffnet sich ohne Anmeldung.

## MT-85: Testseite im Testordner

**Einstieg:** Der Testbereich selbst – Sie sind schon da.

**Voraussetzungen:** Der Testordner ist hochgeladen, oder lokal `npm run build:test` und
`dist-test/index.html` öffnen.

**Schritte:**

1. Den Testordner öffnen.
   - **Danach:** Oben eine Kopfzeile „Testbereich“ mit **„App neu starten“**, **„App vollständig
     zurücksetzen“** und **„Testbericht herunterladen“**. Links die **„Testübersicht“**: je Bereich
     eine Zeile mit Kästchen, eines je Test (die Nummer ohne „MT-“), rechts die App. Die Tests sind
     dieselben wie in `manual_tests/`; lokale Tests (L-…) stehen am Ende.
2. Mit der Maus auf ein Kästchen zeigen.
   - **Danach:** Kennung und Titel des Tests erscheinen, z. B. „MT-11: Interview des Arbeitgebers“.
3. Bei „Ihr Name (erscheint im Testbericht)“ den eigenen Namen eintragen.
4. Das Kästchen **„11“** anklicken.
   - **Danach:** Die Frage „App für MT-11 neu starten?“ erscheint (mehr dazu in MT-133).
5. **„App so lassen“** klicken.
   - **Danach:** Die Testübersicht ist ausgeblendet; links steht nur MT-11, oben mit **„← Zurück zur
     Testübersicht“**, darunter **„‹ Vorheriger“**, „5 von 109“ (oder ähnlich) und **„Nächster ›“**.
     Der Test beginnt oben mit seiner Überschrift.
6. **„Test beginnen (Zeit läuft)“** klicken und rechts in der App den Schritten folgen.
   - **Danach:** Was ein Schritt bringt, steht grün gleich darunter („Danach:“). Neben einem Wert
     zum Eintragen steht ⧉; ein Klick kopiert ihn, das Zeichen wird zu ✓ (klappt das Kopieren nicht,
     steht daneben „(bitte markieren und kopieren)“). Ein Wert, den Sie selbst tippen sollen, ist wie
     eine Taste dargestellt, ohne ⧉. _Nicht offensichtlich:_ ⧉ trägt nichts in die App ein – den
     kopierten Wert dort selbst einfügen.
7. **„✗ Klappt nicht“** klicken.
   - **Danach:** Es gibt nur diese zwei Ergebnisse: **„✓ Wie erwartet“** und **„✗ Klappt nicht“**.
     Darunter steht: „Hat es nur zum Teil geklappt? Bitte „Klappt nicht“ und im Kommentar, was.“
8. Bei „Kommentar – was ist aufgefallen?“ <kbd>Probe</kbd> tippen und bei „Dauer korrigieren“ eine
   Minutenzahl eintragen.
9. **„← Zurück zur Testübersicht“** klicken.
   - **Danach:** Das Kästchen „11“ ist rot und zeigt „✗ 11“; es ist umrandet, weil es der zuletzt
     geöffnete Test ist.
10. Das Kästchen „11“ wieder öffnen und **„✓ Wie erwartet“** klicken, dann zurück zur Übersicht.
    - **Danach:** Das Kästchen ist grün und zeigt „✓ 11“. Über den Kästchen steht „1 von 109
      geprüft · ✓ wie erwartet 1 · ✗ klappt nicht 0 · Zeit …“.
11. Das Häkchen **„Erledigte ausblenden“** setzen.
    - **Danach:** Das Kästchen „11“ fehlt; die anderen Tests bleiben.
12. Das Häkchen wieder entfernen und die Seite neu laden.
    - **Danach:** Name, Ergebnisse und Kommentare sind noch da. _Nicht offensichtlich:_ In einem
      privaten Fenster warnt die Seite, dass sie nichts speichern kann.
13. MT-30 öffnen und in Schritt 2 auf **„MT-37“** klicken.
    - **Danach:** MT-37 öffnet sich (nach der Frage zum Neustart).
14. Das Kästchen **„01“** anklicken.
    - **Danach:** _Nicht offensichtlich:_ Keine Frage zum Neustart. MT-01 zeigt oben „Nicht im
      Testbereich: …“ mit Grund; sein Kästchen ist in der Übersicht blasser.
15. Am Handy den Testordner öffnen und bei „Ihr Name (erscheint im Testbericht)“ den eigenen Namen
    eintragen.
16. Ein Kästchen antippen, bei der Frage **„App so lassen“** und dann **„Test beginnen (Zeit
    läuft)“** tippen.
17. Oben auf **„App“** wechseln, einen Fragebogen beginnen und die erste Frage beantworten.
18. Oben auf **„Testanleitung“** wechseln, dann wieder auf **„App“**.
    - **Danach:** Der Wechsel zur App und zurück verliert keine Eingaben in der App.
19. Oben auf **„Testanleitung“** wechseln, ein Ergebnis wählen und ganz oben auf der Seite
    **„Testbericht herunterladen“** tippen.
    - **Danach:** Im Testbericht vom Handy steht oben „iPhone · Safari …“ oder „Android-Smartphone ·
      Chrome …“. _Nicht offensichtlich:_ Ein iPad meldet sich in Safari wie ein Mac; die App erkennt
      es an der Touch-Bedienung und schreibt „iPad“.
20. MT-21 öffnen, bei der Frage **„App so lassen“**, dann im Test **„▶ Zum Unterschreiben öffnen“**
    anklicken.
    - **Danach:** Die Frage „Vorbereiteten Fragebogen öffnen?“ mit **„Abbrechen“** und **„Öffnen“**.
21. **„Öffnen“** klicken.
    - **Danach:** Rechts öffnet sich die Zusammenfassung der beschäftigten Person mit dem Hinweis
      „Vorbereitet: Sofortmeldung – alles ausgefüllt, die Person unterschreibt.“; am Handy springt
      die Ansicht auf „App“. _Nicht offensichtlich:_ Passt ein Startpunkt nicht mehr zum Formular,
      meldet der Testbereich das mit Grund, statt einen halben Fragebogen zu öffnen.

**Erwartet:**

- _Nicht offensichtlich:_ Wird ein Test geändert, nachdem Sie ihn bewertet haben (z. B. nach einem
  neuen Upload des Testordners), ist sein Kästchen gestrichelt umrandet, der Test bittet, ihn neu zu
  bewerten, und der Testbericht vermerkt es ebenfalls.
- _Nicht offensichtlich:_ Ein „teilweise“ aus der Zeit vor dem 07.11.2026 steht jetzt als „✗ Klappt
  nicht“ da; der Kommentar bleibt.

## MT-133: Neuen Test öffnen – die App passend neu starten

**Einstieg:** Der Testbereich selbst – Sie sind schon da.

**Voraussetzungen:** Die Testübersicht ist zu sehen (sonst **„← Zurück zur Testübersicht“**).

**Schritte:**

1. In der Testübersicht weit unten das Kästchen **„132“** anklicken.
   - **Danach:** Die Frage „App für MT-132 neu starten?“: „Dieser Test beginnt mit „Sofortmeldung –
     nur der Arbeitgeber hat abgeschlossen“.“ und „Ihre Eingaben in der App gehen verloren; die
     Testergebnisse bleiben erhalten.“, dazu **„App so lassen“** und **„Mit diesem Einstieg neu
     starten“**.
2. **„Mit diesem Einstieg neu starten“** klicken.
   - **Danach:** Rechts steht die App bei „Wer füllt jetzt aus?“ mit dem abgeschlossenen Teil des
     Arbeitgebers. Links beginnt MT-132 oben mit seiner Überschrift – nicht am Ende des Tests.
     _Nicht offensichtlich:_ Am Handy bleibt die Ansicht auf „Testanleitung“, damit Sie die Schritte
     zuerst lesen.
3. **„← Zurück zur Testübersicht“** klicken und das Kästchen **„132“** noch einmal anklicken.
   - **Danach:** _Nicht offensichtlich:_ Keine Frage – es ist derselbe Test wie zuletzt.
4. **„Nächster ›“** klicken.
   - **Danach:** Die Frage zum Neustart für den nächsten Test erscheint.
5. **„App so lassen“** klicken, zurück zur Übersicht und das Kästchen **„03“** anklicken.
   - **Danach:** „Dieser Test beginnt auf der Startseite der App.“ mit **„App so lassen“** und
     **„App neu starten“**.
6. **„App neu starten“** klicken.
   - **Danach:** Rechts die Startseite der App mit „Neuer Fragebogen“.
7. Zurück zur Übersicht und das Kästchen **„80“** anklicken.
   - **Danach:** „Einstieg: Die öffentliche Adresse der App im Browser (nicht der Testbereich).“ und „Die App kann dafür bleiben, wie sie ist.“; hier ist **„App so lassen“** hervorgehoben, **„App neu starten (Startseite)“** steht daneben.
8. **„App so lassen“** klicken.
9. In der App einen Fragebogen beginnen, dann in der Kopfzeile **„App neu starten“** klicken.
   - **Danach:** Die Frage „App neu starten?“ mit **„Abbrechen“** und **„App neu starten“**.
10. **„Abbrechen“** klicken.
    - **Danach:** Die App bleibt beim angefangenen Fragebogen.
11. In der Kopfzeile **„App vollständig zurücksetzen“** klicken.
    - **Danach:** Die Frage „App vollständig zurücksetzen?“ erklärt, dass alles gelöscht wird, was die
      App in diesem Browser gespeichert hat – auch ein angefangener Fragebogen zum Fortsetzen – und
      der Link in der Adresszeile; „Ihre Testergebnisse bleiben erhalten.“
12. **„Zurücksetzen“** klicken.
    - **Danach:** Grün unter der Kopfzeile: „Die App ist zurückgesetzt: nichts mehr in diesem Browser
      gespeichert, kein Link in der Adresszeile. Die Testergebnisse sind erhalten.“ Rechts die
      Startseite der App; die farbigen Kästchen der Testübersicht sind unverändert.

## MT-130: Gemeldete Tests fehlen im nächsten Testbericht

**Einstieg:** Der Testbereich selbst – Sie sind schon da.

**Voraussetzungen:** In diesem Browser wurde noch kein Testbericht heruntergeladen – sonst fragt schon Schritt 4 nach den gemeldeten Tests.

**Schritte:**

1. In der Testübersicht das Kästchen **„02“** anklicken und bei der Frage **„App so lassen“**
   wählen.
2. **„✓ Wie erwartet“** klicken und **„← Zurück zur Testübersicht“**.
3. Das Kästchen **„03“** anklicken, **„App so lassen“**, dann **„✗ Klappt nicht“** und zurück zur
   Übersicht.
   - **Danach:** Die Kästchen „02“ (grün) und „03“ (rot) haben ein Ergebnis.
4. In der Kopfzeile **„Testbericht herunterladen“** klicken.
   - **Danach:** Ohne Rückfrage lädt die PDF herunter; sie enthält alle Tests mit Ergebnis,
     Kommentar oder Beginn.
5. Mit der Maus auf das Kästchen eines dieser Tests zeigen.
   - **Danach:** _Nicht offensichtlich:_ Hinter Titel und Ergebnis steht „– berichtet“. Das Kästchen
     bleibt grün bzw. rot; im geöffneten Test steht „im Testbericht vom …“.
6. Noch einmal **„Testbericht herunterladen“** klicken.
   - **Danach:** Die Frage „Schon gemeldete Tests mitnehmen?“: wie viele Tests schon in einem früheren
     Testbericht standen und wie viele neu oder geändert sind, dazu **„Abbrechen“**, **„Ja, alle
     mitnehmen“** und **„Nein (Bericht ohne Tests)“**.
7. **„Nein (Bericht ohne Tests)“** klicken.
   - **Danach:** Die PDF enthält keinen Test, nur Kopf, Summen und den Gesamteindruck.
8. Einen der gemeldeten Tests öffnen und seinen Kommentar ändern.
9. In der Kopfzeile **„Testbericht herunterladen“** klicken.
   - **Danach:** Die Frage nennt jetzt einen Test als neu oder geändert; der dritte Knopf heißt
     **„Nein, nur neue und geänderte“**.
10. **„Nein, nur neue und geänderte“** klicken.

- **Danach:** Die PDF enthält nur den geänderten Test.

11. **„Testbericht herunterladen“** klicken und **„Ja, alle mitnehmen“** wählen.

- **Danach:** Die PDF enthält wieder alle Tests mit Ergebnis.

**Erwartet:**

- _Nicht offensichtlich:_ Auch ein Test ohne Ergebnis, aber mit Kommentar oder begonnen, gilt nach
  einem Bericht als gemeldet – sein Kommentar steht nicht in jedem weiteren Bericht wieder.
- Ein Test, der an einem anderen Tag begonnen als bewertet wurde, zeigt im Bericht das Datum beim
  Beginn (z. B. „Beginn 01.11. 14:42 Uhr“); im Test bittet ein Hinweis, die Dauer zu korrigieren,
  wenn mehr als 600 Minuten gemessen sind.

---

## MT-81: Hilfeseiten „Wo finde ich …?“

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“ und tippen bei der Steuer-Identifikationsnummer auf „Wo finde ich das?“.

**Voraussetzungen:** `docs/hilfe/` (aus `npm run catalogue`) lokal geöffnet oder auf der Homepage unter
dem Pfad, den die Kanzlei-Konfiguration als `explainerBase` nennt.

**Schritte:**

1. `docs/hilfe/steuer-id/index.html` öffnen, die Kachel „Lohnsteuerbescheinigung eines früheren
   Arbeitgebers“ antippen.
   - **Danach:** Das Muster erscheint, zoomt nach etwa einer halben Sekunde auf das Feld
     „Identifikationsnummer:“ und markiert es. Darunter steht „Hier: Identifikationsnummer:“. Überall
     steht schräg „MUSTER“, alle Nummern bestehen aus 9.
2. „Andere Auswahl“, dann „Nichts davon“.
   - **Danach:** Kein Muster, sondern wie man die Nummer anfordert, mit Link.
3. `docs/hilfe/versicherungsnummer/index.html`, Kachel „Gesundheitskarte der Krankenkasse“.
   - **Danach:** Gestrichelte Markierung und „Achtung, andere Nummer: Versichertennummer“.
4. Auf dem Handy `…/hilfe/steuer-id/index.html` öffnen, die Kachel „Lohnsteuerbescheinigung eines
   früheren Arbeitgebers“ antippen.
   - **Danach:** Das Muster erscheint, zoomt nach etwa einer halben Sekunde auf das Feld
     „Identifikationsnummer:“ und markiert es. Darunter steht „Hier: Identifikationsnummer:“.
5. Auf dem Handy „Andere Auswahl“, dann „Nichts davon“ antippen.
   - **Danach:** Kein Muster, sondern wie man die Nummer anfordert, mit Link.
6. Auf dem Handy `…/hilfe/versicherungsnummer/index.html` öffnen, Kachel „Gesundheitskarte der
   Krankenkasse“ antippen.
   - **Danach:** Gestrichelte Markierung und „Achtung, andere Nummer: Versichertennummer“.
7. In den Systemeinstellungen des Handys „Bewegung reduzieren“ einschalten.
8. Auf dem Handy `…/hilfe/steuer-id/index.html` wieder öffnen, die Kachel „Lohnsteuerbescheinigung
   eines früheren Arbeitgebers“ antippen.
   - **Danach:** Mit „Bewegung reduzieren“ keine Animation, das ganze Blatt mit Markierung.

**Erwartet:**

- _Nicht offensichtlich:_ Die Seiten laden nichts nach und funktionieren ohne Internet; nur die
  Links zu den Quellen führen nach außen.
