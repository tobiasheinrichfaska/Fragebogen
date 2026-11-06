# Auslieferung auf der Homepage

Die App ist **eine Datei** (`index.html` aus `npm run build`, Ordner `dist/`). Sie wird auf einer eigenen
Subdomain ausgeliefert, z. B. `fragebogen.<kanzlei-domain>` (Plan Schritt 12). Auf dem Server liegen
keine Daten: Er liefert nur die Datei aus, die App sendet nichts.

## Dateien für den Ordner der Subdomain

| Datei             | Woher                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- |
| `index.html`      | `dist/index.html` nach `npm run build` (gehostete App, ohne Zuordnung zum Lohnprogramm) |
| `.htaccess`       | diese Vorlage, `deploy/.htaccess` (unverändert)                                         |
| `hilfe/` (später) | die Hilfeseiten „Wo finde ich …?“ aus `docs/hilfe/`                                     |

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
  `.htaccess` und `docs/hilfe/`). Vorher prüft das Werkzeug: keine Datei aus `dist-preview/`, `config/`,
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
- zeigt keine Ordnerlisten und liefert keine versteckten Dateien aus.

Sie **beschränkt den Zugriff nicht** – jeder darf die Seite aufrufen. Die Content-Security-Policy mit den
Hash-Werten von Skript und Stil steht als Meta-Tag in `index.html` selbst; die `.htaccess` ergänzt nur,
was ein Meta-Tag nicht kann. Bei einem Update der App bleibt sie unverändert.

## Prüfen nach dem Hochladen

Handtest MT-80 in [`manual_tests/08_auslieferung.md`](../manual_tests/08_auslieferung.md).
