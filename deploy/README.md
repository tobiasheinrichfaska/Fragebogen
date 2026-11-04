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

## Hochladen mit dem Upload-Werkzeug (SFTP)

```powershell
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Probelauf     # erst prüfen, nichts hochladen
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1                # öffentliche App
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel test     # Testordner
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel mehrfachbearbeitung  # später
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Einrichten    # Zugang oder IPs ändern
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel test -OhneRueckfrage  # ohne Fenster
```

**Ohne Rückfrage** (`-OhneRueckfrage`, z. B. wenn niemand am Platz ist): kein Fenster, auch nicht die
Frage „Jetzt hochladen?“; alle Meldungen nur im Terminal und im Protokoll. Das geht nur mit
gespeichertem Zugang und gemerktem Serverschlüssel und nur für einen **committeten** Stand – sonst
bricht das Werkzeug ab, ohne etwas hochzuladen.

| Ziel                  | Ordner                 | Inhalt                                                                                                                  | Wer darf zugreifen                                             |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `oeffentlich`         | Subdomain              | App (`npm run build`) und diese `.htaccess`                                                                             | alle                                                           |
| `test`                | `test/`                | App mit Formular-Entwürfen und Übergabe an Lohn und Gehalt                                                              | IP-Adressen der Kanzlei; sonst Tester-Anmeldung (`tester.ps1`) |
| `mehrfachbearbeitung` | `mehrfachbearbeitung/` | Kanzlei-Fassung mit Übergabe an Lohn und Gehalt – **vorerst nicht hochgeladen** (der Testordner deckt die Testphase ab) | **nur** IP-Adressen der Kanzlei                                |

Die `.htaccess` der geschützten Ordner erzeugt das Werkzeug aus den IP-Adressen im Einrichtungsfenster
und lädt sie **vor** der App hoch – der Ordner ist also nie offen. Die IP-Adressen stehen nur in
`deploy/.local/`.

- **Beim ersten Aufruf** fragt ein Fenster Server, Port, Benutzer, Passwort, Zielordner und die Adresse
  der Seite ab (IONOS-Kundenbereich, SFTP-Zugang des Hosting-Pakets). Danach zeigt es den Schlüssel des
  Servers; mit „Ja“ wird er gemerkt. Meldet sich der Server später mit einem anderen Schlüssel, bricht
  der Upload ab.
- **Gespeichert** wird nur auf diesem PC in `deploy/.local/` (nie im Repo): `sftp.json` (Server, Port,
  Benutzer, Ordner, Adresse, Schlüssel des Servers), `sftp-passwort.dpapi` (das Passwort, mit Windows
  verschlüsselt – nur dieses Windows-Konto auf diesem PC kann es lesen) und `upload-protokoll.txt`
  (wann welcher Stand mit welchem SHA-256 hochgeladen wurde).
- **Was hochgeladen wird**, steht in `deploy/upload.json` (Ziel `oeffentlich`: `dist/index.html` und
  diese `.htaccess`). Vorher prüft `deploy/uploadPlan.ts`: keine Datei aus `dist-kanzlei/`,
  `dist-preview/`, `config/` usw.; keine Seite, die die Zuordnung zum Lohnprogramm enthält.
- **Danach** lädt das Werkzeug die Seite über die Adresse und vergleicht den SHA-256 mit der
  hochgeladenen Datei („online identisch“).
- Voraussetzung: PuTTY (`psftp.exe`) und Node.js; der eingebaute Windows-OpenSSH-Client liest nur den
  Schlüssel des Servers.

## Weitere Ziele nur auf diesem PC (`deploy/.local/upload.local.json`)

Ein anderes Projekt kann denselben Zugang nutzen, ohne in diesem öffentlichen Repo vorzukommen: Seine
Ziele stehen nur in `deploy/.local/upload.local.json` (gitignored), im selben Format wie
`deploy/upload.json`, mit diesen Zusätzen:

| Feld       | Bedeutung                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `root`     | absoluter Ordner auf diesem PC, aus dem die `from`-Dateien kommen (der Build des anderen Projekts) |
| `testers`  | eigene Testerliste in `deploy/.local/`, z. B. `deploy/.local/tester-projekt.json`                  |
| `authName` | Name im Anmeldefenster des Browsers                                                                |
| `frames`   | `"self"`: Seiten des Ordners dürfen einander einbetten (z. B. eine Testseite um ihre App)          |

Ein lokales Ziel ersetzt nie eines aus `deploy/upload.json`, und mit `root` gibt es kein `build` –
das andere Projekt baut selbst. Das Werkzeug meldet dann den Git-Stand jenes Projekts. Jeder
geschützte Ordner bekommt `noindex`.

```powershell
powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel <lokales Ziel>
node deploy/testers.ts neu <Name> --datei=deploy/.local/tester-projekt.json   # Tester dieses Ordners
```

## Tester des Testordners

```powershell
powershell -ExecutionPolicy Bypass -File deploy\tester.ps1
```

- Ein Fenster mit der Liste der Tester: **„Neuer Tester …“**, **„Neues Passwort“**, **„Sperren /
  Freigeben“**, **„Löschen“** und **„Testordner aktualisieren“** (lädt den Testordner neu hoch).
- Ein neues Passwort erscheint **einmal** zum Kopieren; gespeichert wird nur sein Hash
  (`deploy/.local/tester.json`). Am besten getrennt von der Adresse weitergeben, z. B. am Telefon.
- Von den IP-Adressen der Kanzlei geht der Testordner ohne Anmeldung; von anderswo fragt der Browser
  nach Anmeldename und Passwort – nur über HTTPS. Merken übernimmt der Passwortmanager des Browsers.
- Änderungen gelten erst nach „Testordner aktualisieren“.

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
