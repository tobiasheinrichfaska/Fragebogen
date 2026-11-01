# 08 – Auslieferung auf der Homepage

## MT-80: App auf der Subdomain mit `.htaccess`

**Voraussetzungen:**

- Subdomain bei IONOS mit eigenem Ordner; HTTPS-Zertifikat aktiv.
- Hochgeladen: `index.html` (aus `npm run build`, Ordner `dist/`) und `deploy/.htaccess`
  (siehe [`deploy/README.md`](../deploy/README.md)).

**Schritte:**

1. Die Adresse mit `http://` statt `https://` aufrufen.
2. Die App öffnen, einen Fragebogen beginnen und eine PDF erzeugen.
3. Im Browser die Entwicklerwerkzeuge öffnen (F12) → Netzwerk → `index.html` anklicken → Antwort-Header
   ansehen.
4. Die Adresse `…/.htaccess` aufrufen.
5. Optional: die Adresse bei einem Header-Prüfdienst eingeben (z. B. securityheaders.com).

**Erwartet:**

- Schritt 1: Der Browser landet auf `https://…`.
- Schritt 2: Die App funktioniert wie offline; keine Fehlermeldung.
- Schritt 3: Es gibt `Content-Security-Policy` mit `frame-ancestors 'none'`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-cache`.
  _Nicht offensichtlich:_ Die strenge Policy für Skripte steht zusätzlich als Meta-Tag in der Datei; beide
  gelten gleichzeitig.
- Schritt 4: „Forbidden“ (versteckte Dateien werden nicht ausgeliefert).
- Schritt 5: Ein Hinweis auf eine fehlende Skript-Regel im Header ist erwartbar (sie steht im Meta-Tag).

## MT-82: Hochladen mit dem Upload-Werkzeug

**Voraussetzungen:** SFTP-Zugang bei IONOS (Server, Benutzer, Passwort), Ordner der Subdomain; PuTTY
installiert.

**Schritte:**

1. In VS Code im Terminal: `powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Probelauf`.
2. Im Fenster die Zugangsdaten eintragen, „Speichern“; den angezeigten Schlüssel mit „Ja“ bestätigen.
3. Ohne `-Probelauf` erneut aufrufen und die Rückfrage „Jetzt hochladen?“ mit „Ja“ beantworten.
4. Erneut mit `-Probelauf` aufrufen.
5. Die Datei `deploy/.local/sftp-passwort.dpapi` in einem Editor öffnen.

**Erwartet:**

- Schritt 2: „Verbindung in Ordnung“ mit der Liste der Dateien; der Inhalt des Zielordners steht im
  Terminal. Es wurde nichts hochgeladen.
- Schritt 3: Die App wird gebaut; die Rückfrage nennt Server, Ordner, Stand (Commit) und beide Dateien.
  Danach: „Hochgeladen …“ und **„index.html: online identisch“**. _Nicht offensichtlich:_ Gibt es nicht
  committete Änderungen, warnt die Rückfrage davor.
- Schritt 4: Kein Fenster mit Zugangsdaten mehr – sie sind gespeichert.
- Schritt 5: Nur eine lange Zeichenfolge, kein lesbares Passwort.
- _Nicht offensichtlich:_ Ein anderer Windows-Benutzer (oder ein anderer PC) kann die Datei nicht
  entschlüsseln; dort fragt das Werkzeug neu.

## MT-83: Test- und Kanzlei-Ordner nur von den IP-Adressen der Kanzlei

**Voraussetzungen:** MT-82 erledigt; im Einrichtungsfenster sind die IP-Adressen der Kanzlei
eingetragen (`deploy\upload.ps1 -Einrichten`).

**Schritte:**

1. `powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel kanzlei`, Rückfrage mit „Ja“.
2. Dasselbe mit `-Ziel test`.
3. Im Büro `…/kanzlei/` und `…/test/` im Browser öffnen.
4. Am Handy **ohne WLAN** (Mobilfunk) dieselben Adressen öffnen.

**Erwartet:**

- Schritt 1: Die Rückfrage nennt zuerst `.htaccess (Zugriffsregeln, erzeugt)`, dann `index.html`.
  Danach „index.html: online identisch“.
- Schritt 2: Solange es keinen freigegebenen Tester gibt, zusätzlich der Hinweis „Noch kein
  freigegebener Tester … – bis dahin nur eure IPs“.
- Schritt 3: Kanzlei-App bzw. „Fragebogen-Test“ mit dem gelben Hinweis auf Formular-Entwürfe. _Nicht
  offensichtlich:_ Auch im Testordner bietet die Kanzlei-Station die Übergabe an Lohn und Gehalt an.
- Schritt 4: **„Forbidden“** bei beiden. _Nicht offensichtlich:_ Die öffentliche App unter der
  Hauptadresse geht weiter für alle.

## MT-84: Tester anlegen und von außen anmelden

**Voraussetzungen:** MT-83 erledigt.

**Schritte:**

1. `powershell -ExecutionPolicy Bypass -File deploy\tester.ps1`, **„Neuer Tester …“**, Name
   „probe.tester“, „Anlegen“. Das angezeigte Passwort notieren, „Fertig“.
2. **„Testordner aktualisieren“**, Rückfrage mit „Ja“.
3. Am Handy **ohne WLAN** `https://…/test/` öffnen, mit „probe.tester“ und dem Passwort anmelden.
4. Dieselbe Adresse mit `http://` statt `https://` öffnen.
5. Im Fenster „probe.tester“ wählen, **„Sperren / Freigeben“**, wieder „Testordner aktualisieren“;
   am Handy die Seite neu laden (ggf. privates Fenster).
6. Im Büro `…/test/` öffnen.

**Erwartet:**

- Schritt 1: Das Passwort hat die Form „abcd-efgh-jkmn“ und erscheint nur dieses eine Mal.
- Schritt 2: Die Liste nennt `.htpasswd (erzeugt)` vor `.htaccess (erzeugt)`; kein Hinweis „nur eure
  IPs“ mehr.
- Schritt 3: Der Browser fragt nach Name und Passwort, danach erscheint „Fragebogen-Test“. _Nicht
  offensichtlich:_ Erscheint stattdessen „Internal Server Error“, stimmt der Pfad zur Passwortdatei
  nicht oder der Server kennt das Passwortformat nicht – bitte melden, nicht weiter probieren.
- Schritt 4: **Keine** Passwortabfrage über `http://` (erst die Umleitung auf `https://`, oder
  „Forbidden“).
- Schritt 5: Die Anmeldung gelingt nicht mehr.
- Schritt 6: Ohne Anmeldung.

## MT-81: Hilfeseiten „Wo finde ich …?“

**Voraussetzungen:** `docs/hilfe/` (aus `npm run catalogue`) lokal geöffnet oder auf der Homepage unter
dem Pfad, den die Kanzlei-Konfiguration als `explainerBase` nennt.

**Schritte:**

1. `docs/hilfe/steuer-id/index.html` öffnen, die Kachel „Lohnsteuerbescheinigung eines früheren
   Arbeitgebers“ antippen.
2. „Andere Auswahl“, dann „Nichts davon“.
3. `docs/hilfe/versicherungsnummer/index.html`, Kachel „Gesundheitskarte der Krankenkasse“.
4. Auf dem Handy wiederholen; dann in den Systemeinstellungen „Bewegung reduzieren“ einschalten und
   Schritt 1 wiederholen.

**Erwartet:**

- Schritt 1: Das Muster erscheint, zoomt nach etwa einer halben Sekunde auf das Feld
  „Identifikationsnummer:“ und markiert es; darunter „Hier: Identifikationsnummer:“. Überall steht schräg
  „MUSTER“, alle Nummern bestehen aus 9.
- Schritt 2: Kein Muster, sondern wie man die Nummer anfordert, mit Link.
- Schritt 3: Gestrichelte Markierung und „Achtung, andere Nummer: Versichertennummer“.
- Schritt 4: Mit „Bewegung reduzieren“ keine Animation, das ganze Blatt mit Markierung.
- _Nicht offensichtlich:_ Die Seiten laden nichts nach und funktionieren ohne Internet; nur die
  Links zu den Quellen führen nach außen.
