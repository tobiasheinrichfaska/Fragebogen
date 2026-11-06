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
2. `npm run hochladen -- -Ziel test` und die Rückfrage „Jetzt hochladen?“ mit „Ja“ beantworten.
   - **Achten Sie gleich auf:** Die App wird gebaut; die Rückfrage nennt Server, Ordner, Stand
     (Commit) und die Dateien. _Nicht offensichtlich:_ Gibt es nicht committete Änderungen, warnt die
     Rückfrage davor.
   - **Danach:** „Hochgeladen …“ und **„index.html: online identisch“**.
3. `npm run hochladen` (ohne Ziel).
   - **Danach:** Meldung „Welches Ziel? Vorhanden: oeffentlich, test, mehrfachbearbeitung“, nichts
     wird hochgeladen. _Nicht offensichtlich:_ Es gibt kein voreingestelltes Ziel mehr – die
     öffentliche App geht nur hoch, wenn sie ausdrücklich genannt wird.
4. Die Datei `..\..\private\Auslieferung\.local\zugaenge\fragebogen\sftp-passwort.dpapi` in einem
   Editor öffnen.
   - **Danach:** Nur eine lange Zeichenfolge, kein lesbares Passwort. _Nicht offensichtlich:_ Ein
     anderer Windows-Benutzer (oder ein anderer PC) kann die Datei nicht entschlüsseln; dort fragt
     das Werkzeug neu.
5. Eine Kleinigkeit ändern, ohne sie zu committen, und
   `npm run hochladen -- -Ziel test -OhneRueckfrage` aufrufen.
   - **Danach:** Es öffnet sich **kein** Fenster. Mit der Änderung bricht das Werkzeug im Terminal ab
     („Ohne Rückfrage wird nur ein committeter Stand hochgeladen …“) und lädt nichts hoch.
6. Die Änderung zurücknehmen und `npm run hochladen -- -Ziel test -OhneRueckfrage` erneut aufrufen.
   - **Danach:** Auch jetzt öffnet sich **kein** Fenster; im Terminal steht „Ohne Rückfrage: wird
     hochgeladen.“ und am Ende „index.html: online identisch“.
7. `npm run hochladen -- -Ziel oeffentlich -Probelauf`.
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
   `npm run hochladen -- -Ziel mehrfachbearbeitung`, Rückfrage mit „Ja“.
   - **Achten Sie gleich auf:** Die Rückfrage nennt zuerst `.htaccess (Zugriffsregeln, erzeugt)`,
     dann `index.html`.
   - **Danach:** „index.html: online identisch“.
2. Dasselbe für den Testordner: `npm run hochladen -- -Ziel test`, Rückfrage mit „Ja“.
   - **Achten Sie gleich auf:** Solange es keinen freigegebenen Tester gibt, nennt die Rückfrage
     zusätzlich den Hinweis „Noch kein freigegebener Tester … – bis dahin nur die IPs des Büros“.
3. Im Büro `…/mehrfachbearbeitung/` und `…/test/` im Browser öffnen.
   - **Danach:** Kanzlei-App bzw. „Fragebogen-Test“ mit dem gelben Hinweis auf Formular-Entwürfe.
     _Nicht offensichtlich:_ Auch im Testordner bietet die Kanzlei-Station die Übergabe an Lohn und
     Gehalt an.
4. Am Handy **ohne WLAN** (Mobilfunk) dieselben Adressen öffnen.
   - **Danach:** **„Forbidden“** bei beiden. _Nicht offensichtlich:_ Die öffentliche App unter der
     Hauptadresse geht weiter für alle.

## MT-84: Tester anlegen und von außen anmelden

**Testbereich:** nein – nur am Kanzlei-PC mit dem Upload-Werkzeug.

**Voraussetzungen:** MT-83 erledigt.

**Schritte:**

1. `npm run tester`, **„Neuer Tester …“**, Anmeldename `probe.tester`, Passwort leer lassen,
   **„OK“**. Das angezeigte Passwort notieren, **„Fertig“**.
   - **Achten Sie gleich auf:** Das Passwort hat die Form „abcd-efgh-jkmn“ und erscheint nur dieses
     eine Mal.
2. **„Ordner aktualisieren“**, Rückfrage mit „Ja“.
   - **Achten Sie gleich auf:** Die Liste in der Rückfrage nennt `.htpasswd (erzeugt)` vor
     `.htaccess (erzeugt)`; kein Hinweis „nur die IPs des Büros“ mehr.
3. Am Handy **ohne WLAN** `https://…/test/` öffnen, mit `probe.tester` und dem Passwort anmelden.
   - **Achten Sie gleich auf:** Der Browser fragt nach Name und Passwort.
   - **Danach:** Es erscheint „Fragebogen-Test“. _Nicht offensichtlich:_ Erscheint stattdessen
     „Internal Server Error“, stimmt der Pfad zur Passwortdatei nicht oder der Server kennt das
     Passwortformat nicht – bitte melden, nicht weiter probieren.
4. Dieselbe Adresse mit `http://` statt `https://` öffnen.
   - **Danach:** **Keine** Passwortabfrage über `http://` (erst die Umleitung auf `https://`, oder
     „Forbidden“).
5. Im Fenster „probe.tester“ wählen, **„Sperren / Freigeben“**, wieder **„Ordner aktualisieren“**;
   am Handy die Seite neu laden (ggf. privates Fenster).
   - **Danach:** Die Anmeldung gelingt nicht mehr.
6. Im Büro `…/test/` öffnen.
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
   - **Danach:** Was ein Schritt bringt, steht gleich bei ihm: „Achten Sie gleich auf:“ darüber,
     „Danach:“ darunter. Neben einem Wert zum Eintragen steht ⧉; ein Klick kopiert ihn, das Zeichen
     wird zu ✓ (klappt das Kopieren nicht, steht daneben „(bitte markieren und kopieren)“). Ein Wert,
     den Sie selbst tippen sollen, ist wie eine Taste dargestellt, ohne ⧉. _Nicht offensichtlich:_
     ⧉ trägt nichts in die App ein – den kopierten Wert dort selbst einfügen.
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
6. MT-11 öffnen und bei „Voraussetzungen“ auf **„MT-10“** klicken; dann MT-01 öffnen.
   - **Danach:** MT-10 öffnet sich. MT-01 zeigt oben „Nicht im Testbereich: …“ mit Grund und steht in
     der Liste mit „– nicht im Testbereich“.
7. In der App einen Fragebogen beginnen, dann links **„App neu starten (Startseite)“** und die
   Rückfrage bestätigen.
   - **Danach:** Die App zeigt wieder ihre Startseite; die Ergebnisse links sind noch da.
8. Am Handy dasselbe; oben zwischen **„Testanleitung“** und **„App“** wechseln.
   - **Danach:** Der Wechsel zur App und zurück verliert keine Eingaben in der App.
   - **Danach:** Im Testbericht vom Handy steht oben „iPhone · Safari …“ oder „Android-Smartphone ·
     Chrome …“. _Nicht offensichtlich:_ Ein iPad meldet sich in Safari wie ein Mac; die App erkennt
     es an der Touch-Bedienung und schreibt „iPad“.
9. MT-21 öffnen und **„▶ Zum Unterschreiben öffnen“** anklicken, die Rückfrage bestätigen.
   - **Danach:** Rechts öffnet sich die Zusammenfassung der beschäftigten Person mit dem Hinweis
     „Vorbereitet: Sofortmeldung – alles ausgefüllt, die Person unterschreibt.“; am Handy springt die
     Ansicht auf „App“. _Nicht offensichtlich:_ Passt ein Startpunkt nicht mehr zum Formular, meldet
     der Testbereich das mit Grund, statt einen halben Fragebogen zu öffnen.

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
   - **Achten Sie gleich auf:** Das Muster erscheint, zoomt nach etwa einer halben Sekunde auf das
     Feld „Identifikationsnummer:“ und markiert es.
   - **Danach:** Darunter steht „Hier: Identifikationsnummer:“. Überall steht schräg „MUSTER“, alle
     Nummern bestehen aus 9.
2. „Andere Auswahl“, dann „Nichts davon“.
   - **Danach:** Kein Muster, sondern wie man die Nummer anfordert, mit Link.
3. `docs/hilfe/versicherungsnummer/index.html`, Kachel „Gesundheitskarte der Krankenkasse“.
   - **Danach:** Gestrichelte Markierung und „Achtung, andere Nummer: Versichertennummer“.
4. Auf dem Handy wiederholen; dann in den Systemeinstellungen „Bewegung reduzieren“ einschalten und
   Schritt 1 wiederholen.
   - **Danach:** Mit „Bewegung reduzieren“ keine Animation, das ganze Blatt mit Markierung.

**Erwartet:**

- _Nicht offensichtlich:_ Die Seiten laden nichts nach und funktionieren ohne Internet; nur die
  Links zu den Quellen führen nach außen.
