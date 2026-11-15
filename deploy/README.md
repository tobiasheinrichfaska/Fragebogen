# Auslieferung auf der Homepage

Die App ist **eine Datei** (`index.html` aus `npm run build`, Ordner `dist/`). Sie wird auf einer eigenen
Subdomain ausgeliefert, z. B. `fragebogen.<kanzlei-domain>` (Plan Schritt 12). Auf dem Server liegen
keine Daten: Er liefert nur die Datei aus, die App sendet nichts.

## Dateien für den Ordner der Subdomain

| Datei                                  | Woher                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `index.html`                           | `dist/index.html` nach `npm run build` (gehostete App, ohne Zuordnung zum Lohnprogramm) |
| `.htaccess`                            | diese Vorlage, `deploy/.htaccess` (unverändert)                                         |
| `hilfe/`                               | die Hilfeseiten „Wo finde ich …?“ aus `dist/hilfe/` nach `npm run build`                |
| `manifest.json`, `sw.js`, vier `*.png` | aus `dist/` nach `npm run build`: installierbar, Start ohne Netz (seit 15.11.2026)      |

Ohne die sechs Dateien neben `index.html` läuft die App wie bisher, lässt sich aber nicht installieren
und startet ohne Netz nicht. `sw.js` muss als JavaScript ausgeliefert werden (`.js`, wie üblich), das
Manifest als JSON. Der Testbereich bekommt dieselben Dateien aus `dist-test/`.

Die Hilfeseiten in `dist/hilfe/` tragen unten Impressum und Datenschutz der Kanzlei aus
`config/kanzlei.local.json` (seit 15.11.2026). `docs/hilfe/` ist die neutrale Fassung im Repo und
wird nicht hochgeladen.

**Nie hochladen:** `dist-preview/` (Entwürfe **und** Zuordnung), `config/*.local.json`, `import/`,
`.tmp/`. `dist-kanzlei/` (mit der lokalen Zuordnung zum Lohnprogramm) nur in den Kanzlei-Ordner, der
allein von den IP-Adressen der Kanzlei erreichbar ist – das Upload-Werkzeug lässt es nirgends sonst zu.

## Hochladen mit dem Upload-Werkzeug „Auslieferung“ (SFTP)

Seit 2026-11-06 lädt das Werkzeug **Auslieferung** hoch, ein eigenes, privates Projekt auf dem
Kanzlei-PC neben diesem Repo (`..\..\private\Auslieferung`). Dieses Repo sagt nur, **was wohin** geht:
`deploy/upload.json`. Bis dahin lag ein eigenes Upload-Skript hier in `deploy/`.

```powershell
npm run hochladen -- -Ziel oeffentlich -Probelauf     # erst prüfen, nichts hochladen
npm run hochladen -- -Ziel oeffentlich                # öffentliche App
npm run hochladen -- -Ziel test                       # Testordner
npm run hochladen -- -Ziel mehrfachbearbeitung        # später
npm run hochladen -- -Ziel regeln                     # nur diese .htaccess, App unverändert
npm run hochladen -- -Ziel test -OhneRueckfrage       # ohne Fenster
npm run tester                                        # Tester des Testordners
```

- **Es gibt kein voreingestelltes Ziel:** Ohne `-Ziel` nennt das Werkzeug die Ziele und lädt nichts
  hoch – die öffentliche App geht nur hoch, wenn sie ausdrücklich genannt wird.
- **Probelauf** (`-Probelauf`): prüft den Plan und die Verbindung und vergleicht die Dateien auf diesem
  PC mit der Seite online („online schon genau diese Datei“ oder „online anders – ein Upload ändert die
  Seite“). Er baut nicht neu und lädt nichts hoch.
- **Ohne Rückfrage** (`-OhneRueckfrage`, z. B. wenn niemand am Platz ist): kein Fenster, auch nicht die
  Frage „Jetzt hochladen?“; alle Meldungen nur im Terminal und im Protokoll. Das geht nur mit
  gespeichertem Zugang und gemerktem Serverschlüssel und nur für einen **committeten** Stand – sonst
  bricht das Werkzeug ab, ohne etwas hochzuladen.

| Ziel                  | Ordner                 | Inhalt                                                                                                                  | Wer darf zugreifen                                                 |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `oeffentlich`         | Subdomain              | App (`npm run build`) und diese `.htaccess`                                                                             | alle                                                               |
| `test`                | `test/`                | App mit Formular-Entwürfen und Übergabe an Lohn und Gehalt                                                              | IP-Adressen der Kanzlei; sonst Tester-Anmeldung (`npm run tester`) |
| `mehrfachbearbeitung` | `mehrfachbearbeitung/` | Kanzlei-Fassung mit Übergabe an Lohn und Gehalt – **vorerst nicht hochgeladen** (der Testordner deckt die Testphase ab) | **nur** IP-Adressen der Kanzlei                                    |
| `regeln`              | Subdomain              | nur diese `.htaccess` – für eine Änderung der Regeln, ohne die öffentliche App neu zu bauen oder hochzuladen            | alle                                                               |

Die `.htaccess` der geschützten Ordner erzeugt das Werkzeug aus den IP-Adressen des Zugangs und lädt sie
**vor** der App hoch – der Ordner ist also nie offen.

- **Der Zugang** `fragebogen` (Server, Port, Benutzer, Zielordner, Adresse der Seite, IP-Adressen der
  Kanzlei, Serverpfad für die Tester-Anmeldung, Schlüssel des Servers; das Passwort mit Windows
  verschlüsselt – nur dieses Windows-Konto auf diesem PC kann es lesen) liegt nur im Werkzeug, in seinem
  gitignorierten `.local/zugaenge/fragebogen/`, nie in diesem Repo. Ändern:
  `powershell -ExecutionPolicy Bypass -File ..\..\private\Auslieferung\upload.ps1 -Einrichten -Zugang fragebogen`.
  Meldet sich der Server mit einem anderen Schlüssel als dem gemerkten, bricht der Upload ab.
- **In diesem Repo, gitignoriert** (`deploy/.local/`): die Testerliste `tester.json` (nur Hashes) und
  die erzeugten Zugriffsregeln (`erzeugt/<Ziel>/.htaccess`, `.htpasswd`). Das Werkzeug schreibt dorthin
  nur, wenn Git den Ordner wirklich ignoriert.
- **Was hochgeladen wird**, steht in `deploy/upload.json` (Ziel `oeffentlich`: `dist/index.html`, diese
  `.htaccess` und `dist/hilfe/`). Vorher prüft das Werkzeug: keine Datei aus `dist-preview/`, `config/`,
  `import/`, `.tmp/`, `deploy/.local/`; **keine Datei, die die Zuordnung zum Lohnprogramm enthält**
  (die Masken aus `config/export.local.json`), außer in `test/` und `mehrfachbearbeitung/`. Fehlt die
  Zuordnungsdatei, sagt es das. Die Prüfung nennt nur die Datei, nie den gefundenen Inhalt.
- **Danach** lädt das Werkzeug die Seite über die Adresse und vergleicht den SHA-256 mit der
  hochgeladenen Datei („online identisch“). Das Protokoll (wann welcher Stand mit welchem SHA-256) führt
  das Werkzeug; das alte `deploy/.local/upload-protokoll.txt` reicht bis 2026-11-05.
- Voraussetzung: das Werkzeug Auslieferung, PuTTY (`psftp.exe`, `plink.exe`) und Node.js.

## Tester des Testordners

```powershell
npm run tester
```

- Ein Fenster mit der Liste der Tester: **„Neuer Tester …“**, **„Neues Passwort“**, **„Sperren /
  Freigeben“**, **„Löschen“** und **„Ordner aktualisieren“** (lädt den Testordner neu hoch).
- Ein neues Passwort erscheint **einmal** zum Kopieren; gespeichert wird nur sein Hash
  (`deploy/.local/tester.json`). Am besten getrennt von der Adresse weitergeben, z. B. am Telefon.
- Von den IP-Adressen der Kanzlei geht der Testordner ohne Anmeldung; von anderswo fragt der Browser
  nach Anmeldename und Passwort („Fragebogen - Testbereich“) – nur über HTTPS. Merken übernimmt der
  Passwortmanager des Browsers.
- Änderungen gelten erst nach „Ordner aktualisieren“.

## Was die `.htaccess` tut

- leitet `http://` auf `https://` um und sagt dem Browser, die Seite ein Jahr lang nur per HTTPS zu laden;
- verbietet das Einbetten in fremde Seiten (`frame-ancestors 'none'`, `X-Frame-Options`);
- schickt keine Herkunftsadresse, erlaubt keine Kamera, kein Mikrofon, keinen Standort;
- lässt den Browser bei jedem Aufruf nach einer neuen Fassung fragen (wichtig im Betatest);
- zeigt keine Ordnerlisten und liefert keine versteckten Dateien aus;
- lässt auf der ganzen Subdomain kein Skript laufen (2026-11-07): Jede Datei mit einer Skript-Endung
  (`.php`, `.phtml`, `.phar` …, auch groß geschrieben oder als `x.php.txt`) wird abgewiesen, bevor
  der Server sie ausführen oder als Quelltext ausliefern könnte – auch in Unterordnern.

Sie **beschränkt den Zugriff nicht** – jeder darf die Seite aufrufen. Die Content-Security-Policy mit den
Hash-Werten von Skript und Stil steht als Meta-Tag in `index.html` selbst; die `.htaccess` ergänzt nur,
was ein Meta-Tag nicht kann. Bei einem Update der App bleibt sie unverändert.

## Auf bunny.net (geplant; eingestellt am 15.11.2026)

Die öffentliche App zieht zu bunny.net um (`CLAUDE.md`, „Hosting move decided“). bunny.net liest keine
`.htaccess`. Was sie hier tut, ist dort im Dashboard der Pull Zone eingestellt, von Hand auf dem
Kanzlei-PC:

| `.htaccess` hier                                                                               | auf bunny.net                                                                                 |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `http://` → `https://`                                                                         | „Force SSL“ je Hostname                                                                       |
| HSTS, CSP-Ergänzung, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP | Edge Rule „Sicherheits-Header“ mit denselben Werten                                           |
| `Cache-Control "no-cache"`                                                                     | Edge Rule „Kein Zwischenspeicher“: Cache-Zeit im CDN und im Browser 0                         |
| keine Ordnerlisten, keine versteckten Dateien                                                  | gibt es dort nicht; hochgeladen wird nur die feste Liste der gebauten Dateien                 |
| Skript-Sperre                                                                                  | entfällt, bunny.net führt nichts aus; dazu „Block POST requests“ und nur GET und HEAD erlaubt |

- **Ändert sich hier ein Header, muss er auch in der Edge Rule geändert werden.** Das geht nur im
  Dashboard, also auf dem Kanzlei-PC. Eine Cloud-Sitzung, die die `.htaccess` ändert, schreibt das in
  ihre Übergabe.
- **Die Testzone weicht beim Zwischenspeicher ab** (umgestellt am 15.11.2026 abends, mit `curl -I`
  geprüft): Ihre Edge Rule „Kein Zwischenspeicher“ setzt `Cache-Control: private, no-store`, die
  Cache-Zeit im CDN bleibt 0. Hinter dem Login soll auch der Browser nichts aufheben. Die Live-Zone
  bleibt bei der Tabelle oben.
- Die `.htaccess` selbst geht nicht nach bunny.net; dort wäre sie nur eine lesbare Datei.
- Außerdem eingestellt: TLS ab 1.2, Logs ohne IP-Adressen, Auslieferung nur über Rechenzentren in
  EU-Staaten.
- Geprüft wird mit `curl -I` nach dem ersten Upload. Bis dahin ist der Speicher leer, und der
  DNS-Eintrag der Subdomain zeigt weiter auf IONOS.

## Prüfen nach dem Hochladen

Handtest MT-80 in [`manual_tests/08_auslieferung.md`](../manual_tests/08_auslieferung.md).
