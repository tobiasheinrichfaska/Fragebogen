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

**Voraussetzungen:** MT-82 erledigt; im Einrichtungsfenster sind die IP-Adressen der Kanzlei
eingetragen (siehe MT-82, „Zugang oder IP-Adressen ändern“).

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

**Voraussetzungen:** MT-83 erledigt.

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

**Voraussetzungen:** Testordner hochgeladen (MT-83/84), oder lokal `npm run build:test` und
`dist-test/index.html` öffnen.

**Schritte:**

1. Den Testordner öffnen; links den eigenen Namen eintragen, einen Bereich wählen.
   - **Danach:** Die Tests sind dieselben wie in `manual_tests/` (Kennung MT-…); lokale Tests (L-…)
     stehen am Ende.
2. Einen Test anklicken, **„Test beginnen (Zeit läuft)“**, rechts in der App den Schritten folgen.
   - **Danach:** Was ein Schritt bringt, steht grün gleich darunter („Danach:“). Neben einem Wert
     zum Eintragen steht ⧉; ein Klick kopiert ihn, das Zeichen wird zu ✓ (klappt das Kopieren nicht,
     steht daneben „(bitte markieren und kopieren)“). Ein Wert, den Sie selbst tippen sollen, ist wie
     eine Taste dargestellt, ohne ⧉. _Nicht offensichtlich:_ ⧉ trägt nichts in die App ein – den
     kopierten Wert dort selbst einfügen.
3. Ein Ergebnis wählen („bestanden“, „teilweise“ oder „nicht bestanden“), einen Kommentar schreiben,
   bei „Dauer korrigieren“ eine Minutenzahl eintragen.
   - **Danach:** In der Liste steht beim Test das Zeichen des Ergebnisses.
4. Die Seite neu laden.
   - **Danach:** Name, Ergebnisse und Kommentare sind noch da. _Nicht offensichtlich:_ In einem
     privaten Fenster warnt die Seite, dass sie nichts speichern kann.
5. **„Testbericht als PDF“**.
   - **Danach:** Eine PDF „Testbericht_<Name>_<Datum>.pdf“ mit Ergebnis, Beginn, Ende, gemessener und
     korrigierter Dauer, Kommentar und Summen; nicht bearbeitete Tests fehlen darin. Oben steht
     „Gerät laut Browser: …“, z. B. „Windows-Computer · Edge 142 · Bildschirm 1920 × 1080“.
6. MT-11 öffnen und bei „Voraussetzungen“ auf **„MT-10“** klicken.
   - **Danach:** MT-10 öffnet sich.
7. MT-01 öffnen.
   - **Danach:** MT-01 zeigt oben „Nicht im Testbereich: …“ mit Grund und steht in der Liste
     mit „– nicht im Testbereich“.
8. In der App einen Fragebogen beginnen, dann links **„App neu starten (Startseite)“** und die
   Rückfrage bestätigen.
   - **Danach:** Die App zeigt wieder ihre Startseite; die Ergebnisse links sind noch da.
9. Am Handy den Testordner öffnen und bei „Ihr Name (erscheint im Testbericht)“ den eigenen Namen
   eintragen.
10. Einen Test antippen und **„Test beginnen (Zeit läuft)“** tippen.
11. Oben auf **„App“** wechseln, einen Fragebogen beginnen und die erste Frage beantworten.
12. Oben auf **„Testanleitung“** wechseln, dann wieder auf **„App“**.
    - **Danach:** Der Wechsel zur App und zurück verliert keine Eingaben in der App.
13. Oben auf **„Testanleitung“** wechseln, ein Ergebnis wählen, mit **„← Zur Liste“** zurück zur
    Liste und **„Testbericht als PDF“** tippen.
    - **Danach:** Im Testbericht vom Handy steht oben „iPhone · Safari …“ oder „Android-Smartphone ·
      Chrome …“. _Nicht offensichtlich:_ Ein iPad meldet sich in Safari wie ein Mac; die App erkennt
      es an der Touch-Bedienung und schreibt „iPad“.
14. MT-21 öffnen und **„▶ Zum Unterschreiben öffnen“** anklicken, die Rückfrage bestätigen.
    - **Danach:** Rechts öffnet sich die Zusammenfassung der beschäftigten Person mit dem Hinweis
      „Vorbereitet: Sofortmeldung – alles ausgefüllt, die Person unterschreibt.“; am Handy springt
      die Ansicht auf „App“. _Nicht offensichtlich:_ Passt ein Startpunkt nicht mehr zum Formular,
      meldet der Testbereich das mit Grund, statt einen halben Fragebogen zu öffnen.

**Erwartet:**

- _Nicht offensichtlich:_ Wird ein Test geändert, nachdem Sie ihn bewertet haben (z. B. nach einem
  neuen Upload des Testordners), steht er in der Liste mit „– geändert seit Ihrem Test“ und im Test
  mit der Bitte, ihn neu zu bewerten; der Testbericht vermerkt es ebenfalls.

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
