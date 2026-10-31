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

**Nie hochladen:** `dist-kanzlei/` oder `dist-preview/` (enthalten die lokale Zuordnung zum Lohnprogramm),
`config/*.local.json`, `import/`, `.tmp/`.

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
