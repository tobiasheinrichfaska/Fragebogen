# E-Rechnung prüfen

Ein Werkzeug für den Browser: Sie ziehen eine Rechnung (PDF oder XML) hinein und sehen,

- ob es eine E-Rechnung ist (Syntax UBL oder CII, Profil),
- ob die XML zu den offiziellen Schemadateien passt,
- welche Pflichtangaben nach § 14 Abs. 4 UStG enthalten sind – mit den Werten aus der XML,
- ob ausgewählte Beträge rechnerisch zusammenpassen.

Das Ergebnis sind **Hinweise, keine Freigabe**: eine technische Erstprüfung, keine steuerliche Prüfung.
Maßgeblich sind die Daten in der XML.

**Ihre Datei verlässt den Rechner nicht.** Das Werkzeug ist eine einzige HTML-Datei; der Browser
verbietet ihr jede Netzwerkverbindung (Content-Security-Policy). Es speichert nichts.

**Stand:** in Entwicklung, nur im Testbereich.

## Entwicklung

```bash
npm install --ignore-scripts
npm test          # Vitest
npm run build     # dist/index.html
npm run test:e2e  # Playwright
```

Quellen der offiziellen Artefakte: [`docs/quellen.md`](docs/quellen.md).

## Lizenz

Teil des Repositorys „Fragebogen“: AGPLv3 oder kommerzielle Lizenz, siehe [`../LICENSE`](../LICENSE)
und [`../LICENSE_COMMERCIAL.md`](../LICENSE_COMMERCIAL.md). Die übernommenen offiziellen Artefakte
behalten ihre eigenen Lizenzen (siehe `docs/quellen.md`).
