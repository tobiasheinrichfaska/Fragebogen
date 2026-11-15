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
5. Die Adresse `…/test.php` aufrufen (die Datei gibt es nicht).
   - **Danach:** „Forbidden“, nicht „Not Found“. _Nicht offensichtlich:_ Auf der Subdomain wird jede
     Datei mit einer Skript-Endung abgewiesen, ob es sie gibt oder nicht – auch in Unterordnern.
6. Optional: die Adresse bei einem Header-Prüfdienst eingeben (z. B. securityheaders.com).
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
   - **Danach:** Meldung „Welches Ziel? Vorhanden: oeffentlich, test, mehrfachbearbeitung, regeln“, nichts
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
9. `npm run hochladen -- -Ziel regeln -Probelauf`.
   - **Danach:** Hochgeladen würde nur `.htaccess` in den Hauptordner der Subdomain. _Nicht
     offensichtlich:_ Dieses Ziel baut nichts und lädt keine App hoch; die öffentliche App bleibt, wie
     sie ist. Einen Vergleich mit der Seite online gibt es dafür nicht (die `.htaccess` ist von außen
     gesperrt) – geprüft wird danach mit MT-80.

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

## MT-85: Testseite am echten Handy und iPad

**Einstieg:** Der Testbereich selbst – Sie sind schon da.

**Voraussetzungen:** Der Testbereich ist hochgeladen. Ein echtes Handy (iPhone oder Android), wenn
vorhanden auch ein iPad. Die Testseite ist seit dem 15.11.2026 die gemeinsame aus „Testumgebung“;
ihr Verhalten prüfen die Tests dort, die Anbindung an den Fragebogen (Handtests, vorbereitete
Stände, Neustart, Zurücksetzen, Bericht, die Ansicht am Handy nachgestellt) prüft
`tests/e2e/handtests/08_testbereich.spec.ts`.

**Schritte:**

1. Am Handy den Testbereich öffnen.
   - **Danach:** Oben die Reiter **„App“** und **„Tests“**, darunter die Testübersicht. Alles lässt
     sich ohne Zoomen lesen und antippen.
2. Einen Test antippen, dessen Einstieg ein vorbereiteter Stand ist, und dort auf den Knopf des
   Einstiegs tippen. Die Rückfrage mit **„Ja“** beantworten.
   - **Danach:** Der Reiter **„App“** zeigt den vorbereiteten Fragebogen.
3. Auf **„Tests“** wechseln, dann wieder auf **„App“**.
   - **Danach:** Die App steht noch an derselben Stelle.
4. Auf **„Tests“** wechseln, **„Nicht bestanden“** tippen und bei Schritt 1 einen Grund wählen.
   - **Danach:** Die Auswahl der Gründe lässt sich am Handy bedienen und ist ganz zu lesen.
5. **„Bestanden“** tippen, dann oben **„Bericht senden“** und die Rückfrage mit **„Ja“**
   beantworten.
   - **Danach:** Eine Meldung, dass der Bericht gespeichert ist.
6. Am iPad die Schritte 1, 2 und 5 wiederholen.
   - **Danach:** Wie am Handy; breit stehen App und Tests nebeneinander.

---

## MT-81: Hilfeseiten „Wo finde ich …?“ auf dem echten Handy

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“ und gehen bis zur Frage nach der Steuer-Identifikationsnummer.

**Voraussetzungen:** Ein echtes Handy mit Internet. Die Hilfeseiten (`dist/hilfe/` nach
`npm run build`) liegen auf der Homepage unter dem Pfad, den die Kanzlei-Konfiguration als
`explainerBase` nennt.

**Schritte:**

1. Bei der Steuer-Identifikationsnummer auf „Wo finde ich das?“ tippen.
   - **Danach:** Die Seite „Wo finde ich meine Steuer-Identifikationsnummer?“ öffnet sich von der
     Homepage.
2. Die Kachel „Lohnsteuerbescheinigung eines früheren Arbeitgebers“ antippen.
   - **Danach:** Das Muster zoomt ruhig auf das Feld „Identifikationsnummer:“. Die Markierung sitzt
     genau auf dem Feld; Schrift und Linien bleiben beim Zoomen scharf.
3. In den Systemeinstellungen des Handys „Bewegung reduzieren“ einschalten.
4. Die Hilfeseite neu laden und die Kachel „Lohnsteuerbescheinigung eines früheren Arbeitgebers“
   wieder antippen.
   - **Danach:** Keine Animation – das ganze Blatt mit der Markierung erscheint sofort.
5. „Bewegung reduzieren“ wieder ausschalten.
6. Unten auf der Hilfeseite auf „Impressum“ tippen, zurück, dann auf „Datenschutz“.
   - **Danach:** Es öffnen sich das Impressum und die Datenschutzerklärung der Kanzlei-Homepage.

**Erwartet:**

- _Nicht offensichtlich:_ Was die Seiten zeigen – Muster mit „MUSTER“ und lauter 9en, der Weg über
  „Nichts davon“, die gestrichelte Markierung bei der Versichertennummer, keine Anfrage nach außen –
  prüft ein automatischer Test in drei Browsern, auch auf einem nachgebildeten Handy
  (`tests/e2e/handtests/08_auslieferung.spec.ts`). Hier geht es nur um das echte Gerät und die Seiten
  auf der Homepage.

---

## MT-135: App auf dem Startbildschirm und ohne Netz

**Einstieg:** Sie öffnen die öffentliche App auf der Subdomain im Browser des Geräts.

**Voraussetzungen:** Die App ist mit Manifest, Symbolen und `sw.js` hochgeladen (seit 15.11.2026).
Ein echtes iPhone (Safari), ein Android-Handy (Chrome) und ein PC mit Edge oder Chrome. Dass die
Seite Manifest und Symbole verlinkt, online nichts aus dem Speicher nimmt und ohne Netz startet,
prüft ein automatischer Test (`tests/e2e/webApp.spec.ts`). Hier geht es um die echten Geräte.

**Schritte:**

1. Am iPhone in Safari auf „Teilen“ und dann auf „Zum Home-Bildschirm“ tippen.
   - **Danach:** Vorgeschlagen wird der Name „Fragebogen“ mit dem Symbol: weißes Blatt mit drei
     Linien und Haken auf der Farbe der Kanzlei.
2. „Hinzufügen“ tippen und die App vom Home-Bildschirm öffnen.
   - **Danach:** Die App öffnet sich ohne Adressleiste. Der Zugangshinweis wird noch einmal
     gefragt; die App vom Home-Bildschirm hat einen eigenen Speicher.
3. Am Android-Handy in Chrome im Menü „Zum Startbildschirm hinzufügen“ oder „App installieren“
   wählen und die App vom Startbildschirm öffnen.
   - **Danach:** Das Symbol ist rund oder abgerundet beschnitten. Das Blatt ist vollständig zu
     sehen.
4. Am PC in Edge oder Chrome auf das Installieren-Symbol in der Adressleiste klicken.
   - **Danach:** Die App öffnet sich in einem eigenen Fenster.
5. Am Handy den Flugmodus einschalten und die App vom Start- bzw. Home-Bildschirm öffnen.
   - **Danach:** Die App startet und zeigt „Neuer Fragebogen“.
6. Im Flugmodus einen Fragebogen beginnen, eine Frage beantworten und eine PDF erstellen.
   - **Danach:** Das geht wie online.
7. Den Flugmodus ausschalten und die App neu öffnen.
   - **Danach:** Sie startet wie gewohnt.

**Erwartet:**

- _Nicht offensichtlich:_ Ohne Netz startet die Fassung, die beim letzten Besuch mit Netz
  gespeichert wurde. Mit Netz kommt die App immer vom Server.
- Gespeichert ist nur die App selbst, nie eine Antwort.
