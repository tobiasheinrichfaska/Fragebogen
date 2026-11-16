# Auslieferung auf der Homepage

Die App ist **eine Datei** (`index.html` aus `npm run build`, Ordner `dist/`) mit den Hilfeseiten
und den Dateien zum Installieren daneben. Seit dem 15.11.2026 liefert **bunny.net** sie auf einer
eigenen Subdomain der Kanzlei-Homepage aus, z. B. `fragebogen.<kanzlei-domain>` (Plan Schritt 12);
vorher lag sie bei IONOS. Auf dem Server liegen keine Daten: Er liefert nur die Dateien aus, die
App sendet nichts.

## Was online liegt

**Öffentliche App** (Live-Zone auf bunny.net, unter der Subdomain):

| Datei                                  | Woher                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `index.html`                           | `dist/index.html` nach `npm run build` (gehostete App, ohne Zuordnung zum Lohnprogramm) |
| `hilfe/`                               | die Hilfeseiten „Wo finde ich …?“ aus `dist/hilfe/` nach `npm run build`                |
| `manifest.json`, `sw.js`, vier `*.png` | aus `dist/` nach `npm run build`: installierbar, Start ohne Netz (seit 15.11.2026)      |

Ohne die sechs Dateien neben `index.html` läuft die App wie bisher, lässt sich aber nicht installieren
und startet ohne Netz nicht. `sw.js` muss als JavaScript ausgeliefert werden (`.js`, wie üblich), das
Manifest als JSON.

**Keine `.htaccess`:** bunny.net liest sie nicht und führt nichts aus. Die Kopfzeilen, die sie bei
IONOS setzte, sind in den Edge Rules der Zone nachgebildet (Abschnitt „Auf bunny.net“ unten).
`deploy/.htaccess` bleibt die Quelle dieser Werte; ein Test bewacht sie
(`tests/static/htaccess.test.ts`). Bei IONOS liegt die alte Kopie noch im früheren Ordner der
Subdomain; sie bekommt keinen Upload mehr.

**Testbereich:** eine eigene Zone auf bunny.net mit eigener `….b-cdn.net`-Adresse, kein Ordner der
öffentlichen App. Sie trägt dieselben Dateien aus `dist-test/` (`npm run build:test`: mit den
Formular-Entwürfen und der gemeinsamen Testseite) und das Login-Skript aus dem privaten Repo
Testumgebung: Jeder Aufruf braucht eine Anmeldung, danach erkennt ein Cookie das Gerät wieder. Eine
Ausnahme für die IP-Adressen des Büros gibt es nicht. Tester kommen per Einladung (siehe „Tester der
Testzone“ unten).

Die Hilfeseiten in `dist/hilfe/` tragen unten Impressum und Datenschutz der Kanzlei aus
`config/kanzlei.local.json` (seit 15.11.2026). `docs/hilfe/` ist die neutrale Fassung im Repo und
wird nicht hochgeladen.

**Nie hochladen:** `dist-preview/` (Entwürfe **und** Zuordnung), `config/*.local.json`, `import/`,
`.tmp/`. `dist-kanzlei/` (mit der lokalen Zuordnung zum Lohnprogramm) ist vorerst nirgends online.

## Hochladen über Freigabe (seit 15.11.2026)

Hochgeladen wird nur noch über das private Repo **Freigabe** (GitHub Actions). Es wird nie an eine
Cloud-Sitzung gehängt; Cloud-Sitzungen laden nichts hoch.

- **Testzone:** Freigabe baut sie selbst aus `main` dieses Repos und rollt sie aus. Es schaut alle
  zwei Stunden zwischen 6 und 20 Uhr nach; eine Änderung ist also spätestens zwei Stunden nach dem
  Merge in der Testzone, sobald ihr Check grün ist. Nach dem Ausrollen prüft der Lauf, dass die
  Testzone ohne Anmeldung mit 401 antwortet.
- **Öffentliche App:** nur von Hand in Freigabe, gestartet von Tobias, und nur auf sein
  ausdrückliches OK.
- Die Live-Zone sendet `Cache-Control: max-age=0`: Eine neue Fassung ist sofort da, niemand muss den
  Zwischenspeicher des CDN leeren.
- **Nicht dokumentiert** (weder hier noch in Testumgebung): welchen Build-Befehl Freigabe benutzt,
  ob es dabei die privaten Dateien aus `Fragebogen-privat` (`config/kanzlei.local.json`,
  `config/export.local.json`) einspielt und ob es `deploy/upload.json` anwendet. Die Tabelle oben
  sagt, was online liegen soll, nicht, wie Freigabe es baut.
- **Ohne die privaten Dateien baut `vite.config.ts` still neutral:** Es nimmt dann
  `config/kanzlei.example.json` und keine Zuordnung, ohne Warnung. Der App fehlen dann der
  Zugangshinweis, Impressum und Datenschutz, die Farben der Kanzlei, die Links „Wo finde ich das?“,
  die App-Adresse in der PDF, der Link „Testbereich (für Tester)“ und in der Testzone die Übergabe an
  Lohn und Gehalt. Die Live-Datei vom 15.11.2026 hat Zugangshinweis, Impressum, Datenschutz und
  Farben, wurde also mit den privaten Dateien gebaut; wo, ist nicht festgehalten. MT-82 prüft das
  nach jedem Ausrollen.
- **Stand 16.11.2026:** Die Live-Datei trägt noch die alte `testAddress` (`test/`). `…/test/` gibt es
  auf der Live-Zone nicht (404), der Link „Testbereich (für Tester)“ der öffentlichen App führt also
  auf eine Fehlerseite, bis die nächste Live-Fassung mit der neuen `testAddress` gebaut ist. Eine
  Weiterleitung alter Links per Edge Rule wirkt nicht oder ist nicht eingerichtet.
- Handtest: MT-82 in [`manual_tests/08_auslieferung.md`](../manual_tests/08_auslieferung.md).

### Bis 15.11.2026: Upload-Werkzeug „Auslieferung“ (SFTP zu IONOS)

Vom 06.11. bis 15.11.2026 lud das private Werkzeug **Auslieferung** auf dem Kanzlei-PC per SFTP zu
IONOS hoch (`npm run hochladen -- -Ziel <Ziel>`, `npm run tester`; davor ein eigenes Skript in
`deploy/`). Seine Ziele stehen noch in `deploy/upload.json`:

| Ziel                  | Ordner bei IONOS       | Inhalt                                                             |
| --------------------- | ---------------------- | ------------------------------------------------------------------ |
| `oeffentlich`         | Subdomain              | App (`npm run build`) und `deploy/.htaccess`                       |
| `test`                | `test/`                | App mit Formular-Entwürfen; IP-Adressen der Kanzlei oder Login     |
| `mehrfachbearbeitung` | `mehrfachbearbeitung/` | Kanzlei-Fassung, nur IP-Adressen der Kanzlei – nie hochgeladen     |
| `regeln`              | Subdomain              | nur `deploy/.htaccess`, ohne die App neu zu bauen oder hochzuladen |

Für den Fragebogen wird dieser Weg nicht mehr benutzt. `deploy/upload.json` ist die Zielliste dieses
früheren Werkzeugs. `tests/static/uploadSpec.test.ts` bewacht sie weiter als Daten: welche gebauten
Dateien zu jeder Fassung gehören, welche Pfade nie hochgehen (`dist-preview/`, `config/`, `import/`,
`.tmp/`, `deploy/.local/`) und dass die Zuordnung zum Lohnprogramm (die Masken aus
`config/export.local.json`) nur in den geschützten Ordnern erlaubt ist. Abgewiesen hat solche
Dateien das Werkzeug selbst, nicht der Test. Ob Freigabe die Liste liest, ist nicht dokumentiert.

Dass die Zuordnung zum Lohnprogramm nicht in die öffentliche App kommt, leisten heute zwei Dinge:

- **Der Build:** Nur `npm run build:kanzlei`, `npm run build:test` und `npm run build:preview`
  bündeln sie (`__EXPORT_MAPPINGS__` in `vite.config.ts`); `npm run build` nie.
- **Der e2e-Wächter** in `tests/e2e/flow.spec.ts` („the hosted build carries no mapping …“): Er
  sucht in `dist/index.html` nach den Masken aus `config/export.local.json`. Ohne diese Datei hat er
  nichts zu suchen; er greift also nur, wo die privaten Dateien liegen, nicht in der CI.

Der Zugang des Werkzeugs (Server, Passwort, IP-Adressen) lag nur im Werkzeug auf dem Kanzlei-PC, nie
in diesem Repo; das gitignorierte `deploy/.local/` hält die alte Testerliste (nur Hashes) und die
damals erzeugten Zugriffsregeln.

## Tester der Testzone

- Tester kommen per Einladung: Ein angemeldeter Tester klickt in der Testfassung **„Tester
  einladen“** (Fußzeile der App und oben auf der Testseite, `/_zugang/einladen`) und schickt den
  Link weiter. Er gilt 7 Tage und einmal; die neue Person wählt Anmeldenamen und Passwort selbst
  (mindestens 12 Zeichen). Handtest MT-84.
- Die festen Tester stehen in der Testerliste des Repos Testumgebung, nur als Hash. Ein Tester wird
  dort mit `gesperrt:<Name>` gesperrt; das gilt spätestens zwei Stunden nach dem Merge, sofort mit
  „Login ausrollen“ in Freigabe.
- Die Anmeldung gilt für jeden Testbereich desselben bunny-Kontos. Ein Cookie erkennt das Gerät bis
  zu 400 Tage nach dem letzten Besuch wieder. Handtest MT-83.
- Die Tester-Anmeldung bei IONOS (`npm run tester`, Basic Auth im Ordner `test/`) gilt nicht mehr.

## Was die Kopfzeilen tun (Quelle `deploy/.htaccess`)

- `http://` wird auf `https://` umgeleitet; der Browser lädt die Seite ein Jahr lang nur per HTTPS;
- das Einbetten in fremde Seiten ist verboten (`frame-ancestors 'none'`, `X-Frame-Options`);
- keine Herkunftsadresse, keine Kamera, kein Mikrofon, kein Standort;
- der Browser fragt bei jedem Aufruf nach einer neuen Fassung (wichtig im Betatest).

Nur bei IONOS galt außerdem: keine Ordnerlisten, keine versteckten Dateien, und auf der ganzen
Subdomain lief kein Skript (2026-11-07: jede Datei mit einer Skript-Endung wie `.php`, `.phtml`,
`.phar` …, auch groß geschrieben oder als `x.php.txt`, wurde abgewiesen, auch in Unterordnern). Auf
bunny.net entfällt das: Dort wird nichts ausgeführt, und hochgeladen wird nur die feste Liste der
gebauten Dateien.

Die Kopfzeilen **beschränken den Zugriff nicht** – jeder darf die öffentliche Seite aufrufen. Die
Content-Security-Policy mit den Hash-Werten von Skript und Stil steht als Meta-Tag in `index.html`
selbst; die Kopfzeilen ergänzen nur, was ein Meta-Tag nicht kann. Bei einem Update der App bleiben
sie unverändert.

## Auf bunny.net (seit dem 15.11.2026)

Die öffentliche App ist zu bunny.net umgezogen (`CLAUDE.md`, „Hosting move decided“ und „Moved“).
bunny.net liest keine `.htaccess`. Was sie bei IONOS tat, ist dort im Dashboard der Pull Zone
eingestellt, von Hand auf dem Kanzlei-PC:

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
- Geprüft mit `curl -I` am 15.11.2026 abends: Die Subdomain zeigt auf bunny.net, die Live-Zone
  sendet die Kopfzeilen der Tabelle, die Testzone antwortet mit einer Anmeldung.

## Prüfen nach dem Hochladen

Handtests in [`manual_tests/08_auslieferung.md`](../manual_tests/08_auslieferung.md): MT-80 (die
öffentliche App und ihre Kopfzeilen), MT-82 (Hochladen über Freigabe), MT-83 (Testzone nur mit
Anmeldung).
