# 08 – Auslieferung auf der Homepage

## MT-80: Öffentliche App auf bunny.net

**Einstieg:** Die öffentliche Adresse der App im Browser (nicht der Testbereich).

**Voraussetzungen:**

- Seit dem 15.11.2026 liefert bunny.net die öffentliche App aus; die Subdomain zeigt dorthin. Die
  Kopfzeilen kommen aus den Edge Rules der Live-Zone, eine `.htaccess` gibt es dort nicht (siehe
  [`deploy/README.md`](../deploy/README.md)).
- Für Schritt 5 ein PC mit Edge, Chrome oder Firefox, oder ein Terminal mit `curl`.

**Schritte:**

1. Die Adresse mit `http://` statt `https://` aufrufen.
   - **Danach:** Der Browser landet auf `https://…`.
2. Einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“ beginnen, als
   „Arbeitgeber“ ausfüllen und abschließen.
   - **Danach:** „Arbeitgeber: abgeschlossen“, keine Fehlermeldung.
3. **„PDF erstellen“** klicken.
   - **Danach:** Ein Fenster fragt „Mit Kennwort schützen?“.
4. **„Ohne Kennwort“** klicken.
   - **Danach:** Die PDF wird heruntergeladen. Die App funktioniert wie die heruntergeladene Datei.
5. Die Kopfzeilen ansehen: im Browser die Entwicklerwerkzeuge öffnen (F12) → Netzwerk → die Seite
   neu laden → die erste Anfrage (die Seite selbst) anklicken → Antwort-Header; oder im Terminal
   `curl -I` mit der öffentlichen Adresse.
   - **Danach:** Es gibt `Strict-Transport-Security` (ein Jahr), `Content-Security-Policy` mit
     `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
     `Referrer-Policy: no-referrer` und `Cache-Control: max-age=0`. _Nicht offensichtlich:_ Die
     strenge Policy für Skripte steht zusätzlich als Meta-Tag in der Datei; beide gelten
     gleichzeitig. `max-age=0` heißt: Jede neue Fassung ist nach dem Hochladen sofort da.
6. Optional: die Adresse bei einem Header-Prüfdienst eingeben (z. B. securityheaders.com).
   - **Danach:** Ein Hinweis auf eine fehlende Skript-Regel im Header ist erwartbar (sie steht im
     Meta-Tag).

## MT-82: Hochladen über Freigabe

**Testbereich:** nein – nur Tobias, im privaten Repo Freigabe auf GitHub.

**Voraussetzungen:** Ein Merge auf `main` dieses Repos, dessen Check „Tests“ grün ist, und ein
Testerzugang für die Testzone. Seit dem 15.11.2026 lädt nur noch Freigabe hoch (GitHub Actions); den
Fragebogen lädt kein Werkzeug mehr per SFTP zu IONOS. Ob Freigabe beim Bauen die privaten Dateien aus
`Fragebogen-privat` einspielt, ist nicht dokumentiert; ohne sie entsteht ohne Warnung eine neutrale
Fassung (ohne Zugangshinweis, Impressum, Datenschutz und Übergabe an Lohn und Gehalt). Die Schritte
unten prüfen das bei jedem Ausrollen.

**Schritte:**

1. Den nächsten Lauf von „Testbereiche aktualisieren“ in Freigabe abwarten (alle zwei Stunden
   zwischen 6 und 20 Uhr) und seine Zusammenfassung öffnen.
   - **Danach:** Sie nennt den Fragebogen mit dem Commit des Merges. Der Lauf ist grün. _Nicht
     offensichtlich:_ Nach dem Ausrollen prüft der Lauf selbst, dass die Testzone ohne Anmeldung mit
     401 antwortet.
2. Die Testzone angemeldet öffnen und die geänderte Stelle ansehen.
   - **Danach:** Die Testzone zeigt den neuen Stand. _Nicht offensichtlich:_ Die Testzone hebt
     nichts im Browser auf (`Cache-Control: private, no-store`); Neuladen holt immer den Stand vom
     Server.
3. Auf der Testseite oben **„App vollständig zurücksetzen“** klicken.
   - **Danach:** Die Rückfrage „App vollständig zurücksetzen?“.
4. **„Zurücksetzen“** klicken.
   - **Danach:** Die App zeigt „Bitte bestätigen“ mit dem Zugangshinweis der Kanzlei. Darunter
     stehen „Impressum“ und „Datenschutz“. _Nicht offensichtlich:_ Fehlt eins davon, hat Freigabe
     ohne die privaten Dateien gebaut – bitte melden.
5. Den Zugangshinweis und „Antwort für die Zukunft merken“ ankreuzen.
6. **„Weiter“** klicken.
   - **Danach:** Die Startseite der App. Unten stehen „Impressum“, „Datenschutz“ und „Tester
     einladen“.
7. Auf der Testseite auf
   [Kanzlei mit vollständigem Personalfragebogen öffnen](start:kanzlei-personalfragebogen-vollstaendig)
   klicken.
   - **Danach:** Die Rückfrage „Vorbereiteten Stand laden?“.
8. **„Laden“** klicken.
   - **Danach:** Die App zeigt die Kanzlei-Station mit einem eingelesenen Personalfragebogen.
9. In der Kanzlei-Station nach unten scrollen.
   - **Danach:** Der Abschnitt „Übergabe an DATEV Lohn und Gehalt“ steht da. _Nicht offensichtlich:_
     Fehlt er, wurde ohne die Zuordnung aus `Fragebogen-privat` gebaut – bitte melden.
10. Nur wenn die öffentliche App den Stand bekommen soll: in Freigabe den Lauf für die öffentliche
    App des Fragebogens von Hand starten.
    - **Danach:** Der Lauf ist grün.
11. Die öffentliche Adresse in einem privaten Fenster öffnen.
    - **Danach:** Der neue Stand erscheint sofort, ohne dass jemand den Zwischenspeicher des CDN
      leeren muss. Die App zeigt „Bitte bestätigen“ mit dem Zugangshinweis; darunter stehen
      „Impressum“ und „Datenschutz“. Fehlt eins davon: bitte melden.
12. Den Zugangshinweis ankreuzen und **„Weiter“** klicken.
    - **Danach:** Die Startseite der App; unten der Link „Testbereich (für Tester)“.
13. **„Testbereich (für Tester)“** klicken.
    - **Danach:** Der Browser fragt nach Benutzername und Passwort der Testzone. Eine Fehlerseite
      (404) ist ein Fehler: bitte melden. _Nicht offensichtlich:_ Die Live-Datei vom 15.11.2026
      führt noch auf `…/test/` und damit auf eine Fehlerseite; erst eine Live-Fassung mit der neuen
      Adresse des Testbereichs führt in die Testzone.

## MT-83: Testzone nur mit Anmeldung

**Testbereich:** nein – die Testseite steht selbst hinter der Anmeldung; geprüft wird in einem
privaten Fenster ohne Anmeldung.

**Voraussetzungen:** Die Adresse der Testzone (von der Kanzlei; eine eigene Adresse, kein Ordner der
öffentlichen App) und ein eigener Testerzugang. Eine Ausnahme für die IP-Adressen des Büros gibt es
nicht mehr: Auch im Büro fragt die Testzone nach der Anmeldung.

**Schritte:**

1. Ein privates Fenster öffnen und die Adresse der Testzone aufrufen.
   - **Danach:** Der Browser fragt nach Benutzername und Passwort. Von der App ist nichts zu sehen.
2. **„Abbrechen“** klicken.
   - **Danach:** „Anmeldung erforderlich.“
3. Die Seite neu laden und mit Ihrem Testerzugang anmelden.
   - **Danach:** Die Testseite erscheint: App links, Tests rechts (am Handy die Reiter „App“ und
     „Tests“).
4. Das private Fenster schließen, ein normales Fenster öffnen und die Adresse der Testzone aufrufen.
   - **Danach:** Der Browser fragt nach der Anmeldung, wenn sich dieser Browser noch nie angemeldet
     hat; sonst erscheint die Testseite sofort.
5. Falls gefragt: mit Ihrem Testerzugang anmelden.
   - **Danach:** Die Testseite erscheint.
6. Den Browser ganz schließen (alle Fenster) und wieder öffnen.
7. Die Adresse der Testzone aufrufen.
   - **Danach:** Die Testseite erscheint ohne Anmeldung. _Nicht offensichtlich:_ Ein Cookie erkennt
     das Gerät wieder, bis zu 400 Tage nach dem letzten Besuch; ein privates Fenster fragt dagegen
     jedes Mal.

## MT-84: Einen Tester einladen

**Testbereich:** nein – „Tester einladen“ verlässt die Testseite, und die Einladung braucht ein
zweites, privates Fenster.

**Voraussetzungen:** Sie sind in der Testzone angemeldet. Tester gibt es nur noch per Einladung;
das frühere `npm run tester` mit Passwörtern für einen Ordner bei IONOS gilt nicht mehr. Für das
Sperren: eine Cloud-Sitzung mit dem Repo Testumgebung und, wenn es eilt, Zugriff auf Freigabe.

**Schritte:**

1. In der Testzone unten in der App auf **„Tester einladen“** klicken.
   - **Danach:** Die Seite „Tester einladen“ zeigt einen Link `…/_zugang/registrieren/…`, das Datum,
     bis zu dem er gilt, und „Zurück zur App“. _Nicht offensichtlich:_ Derselbe Link steht auch oben
     auf der Testseite.
2. Den Link kopieren und in einem privaten Fenster öffnen.
   - **Danach:** „Als Tester registrieren“ mit Ihrem Namen als Einladendem. Der Browser fragt
     **nicht** nach der Anmeldung.
3. Als Anmeldenamen einen neuen Probenamen mit dem heutigen Datum eintragen, z. B.
   `probe.fragebogen.1611` am 16.11.
4. Zweimal dasselbe Passwort mit mindestens 12 Zeichen eingeben.
5. **„Registrieren“** klicken.
   - **Danach:** Die Testseite des Fragebogens erscheint, ohne Anmeldung. _Nicht offensichtlich:_
     Kommt „Diesen Anmeldenamen gibt es schon. Bitte einen anderen wählen.“, war der Name schon
     einmal vergeben: die Schritte 3 bis 5 mit einem anderen Namen wiederholen.
6. Im privaten Fenster den Link aus Schritt 1 noch einmal öffnen.
   - **Danach:** „Dieser Link ist ungültig, abgelaufen oder schon benutzt. Bitten Sie um einen
     neuen.“
7. Im ersten Fenster **„Zurück zur App“** klicken.
   - **Danach:** Die Testseite erscheint wieder; Ihre Testergebnisse sind noch da.
8. Den Probenamen sperren lassen: in einer Cloud-Sitzung des Repos Testumgebung die Zeile
   `gesperrt:<Probename>` in die Testerliste des Kanzlei-Kontos eintragen, die Skripte neu bauen
   (`npm run bauen`) und auf `main` mergen lassen.
   - **Danach:** Der Merge ist auf `main`, sein Check „Tests“ ist grün. _Nicht offensichtlich:_
     Freigabe rollt die Sperre beim nächsten Lauf von „Testbereiche aktualisieren“ aus, spätestens 2
     Stunden nach dem Merge.
9. Soll die Sperre sofort gelten: in Freigabe „Login ausrollen“ für jeden Testbereich des
   Kanzlei-Kontos starten.
   - **Danach:** Der Lauf ist grün.
10. Sobald die Sperre gilt: im privaten Fenster die Testzone neu laden (ist es inzwischen
    geschlossen: ein neues privates Fenster öffnen und sich mit dem Probenamen anmelden).
    - **Danach:** Der Browser fragt nach Benutzername und Passwort; mit dem Probenamen kommt man
      nicht mehr hinein, auch nicht mit dem gemerkten Gerät.

**Erwartet:**

- _Nicht offensichtlich:_ Ein eingeladener Tester darf jeden Testbereich desselben bunny-Kontos
  testen, mit demselben Namen und Passwort.
- Jeder Anmeldename geht je bunny-Konto nur einmal, auch nach einer Sperre. Deshalb bekommt jeder
  Probelauf einen neuen Namen mit dem Datum; einen alten Probenamen gibt es nicht wieder.

## MT-85: Testseite am echten Handy und iPad

**Einstieg:** Der Testbereich selbst – Sie sind schon da.

**Voraussetzungen:** Die Testzone ist aktuell (Freigabe rollt `main` von selbst aus). Ein echtes
Handy (iPhone oder Android), wenn vorhanden auch ein iPad. Die Testseite ist seit dem 15.11.2026 die
gemeinsame aus „Testumgebung“; ihr Verhalten prüfen die Tests dort, die Anbindung an den Fragebogen
(Handtests, vorbereitete Stände, Neustart, Zurücksetzen, Bericht, die Ansicht am Handy nachgestellt)
prüft `tests/e2e/handtests/08_testbereich.spec.ts`.

**Schritte:**

1. Am Handy den Testbereich öffnen.
   - **Danach:** Oben die Reiter **„App“** und **„Tests“**, darunter die Testübersicht. Alles lässt
     sich ohne Zoomen lesen und antippen.
2. Einen Test antippen, dessen Einstieg ein vorbereiteter Stand ist, und dort auf den Knopf des
   Einstiegs tippen.
   - **Danach:** Die Rückfrage „Vorbereiteten Stand laden?“ mit **„Laden“** und **„Abbrechen“**.
3. **„Laden“** tippen.
   - **Danach:** Der Reiter **„Tests“** bleibt offen.
4. Auf **„App“** tippen.
   - **Danach:** Der Reiter **„App“** zeigt den vorbereiteten Fragebogen.
5. Auf **„Tests“** wechseln, dann wieder auf **„App“**.
   - **Danach:** Die App steht noch an derselben Stelle.
6. Auf **„Tests“** wechseln, **„Nicht bestanden“** tippen und bei Schritt 1 einen Grund wählen.
   - **Danach:** Die Auswahl der Gründe lässt sich am Handy bedienen und ist ganz zu lesen.
7. **„Bestanden“** tippen.
   - **Danach:** Die Auswahl der Schritte verschwindet; die Uhr zeigt die gemessene Zeit.
8. Oben **„Bericht senden“** tippen.
   - **Danach:** Die Rückfrage „Bericht senden?“ mit **„Senden“** und **„Abbrechen“**.
9. **„Senden“** tippen.
   - **Danach:** „Bericht gespeichert.“
10. Am iPad im Querformat die Schritte 1 bis 3, 8 und 9 wiederholen.
    - **Danach:** Wie am Handy, nur stehen App und Tests nebeneinander, ohne Reiter; nach „Laden“
      zeigt die App links gleich den vorbereiteten Fragebogen.

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
6. Im Flugmodus den Arbeitgeberteil der Sofortmeldung ausfüllen und abschließen.
   - **Danach:** „Arbeitgeber: abgeschlossen“.
7. **„PDF erstellen“** tippen.
   - **Danach:** Ein Fenster fragt „Mit Kennwort schützen?“.
8. **„Ohne Kennwort“** tippen.
   - **Danach:** Die PDF wird erstellt wie online (am Handy mit „Teilen“ und „Speichern“).
9. Den Flugmodus ausschalten und die App neu öffnen.
   - **Danach:** Sie startet wie gewohnt.

**Erwartet:**

- _Nicht offensichtlich:_ Ohne Netz startet die Fassung, die beim letzten Besuch mit Netz
  gespeichert wurde. Mit Netz kommt die App immer vom Server.
- Gespeichert ist nur die App selbst, nie eine Antwort.
