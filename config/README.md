# Kanzlei-Konfiguration

Name, offizielle Adresse der App und Adresse der Erklärvideos gehören **nicht** ins öffentliche
Repo. Beim Build liest `vite.config.ts` die Datei `config/kanzlei.local.json`, falls es sie gibt,
sonst die neutrale `config/kanzlei.example.json` (leer). `kanzlei.local.json` ist per `.gitignore`
ausgeschlossen.

```json
{
  "kanzleiName": "Musterkanzlei",
  "appAddress": "https://fragebogen.example.org/",
  "explainerBase": "https://www.example.org/erklaervideos"
}
```

- Alle Angaben sind freiwillig.
- Adressen müssen mit `https://` beginnen und dürfen weder Zugangsdaten noch `?` oder `#` enthalten.
  Eine ungültige Datei bricht den Build ab.
- `appAddress` wird in jede PDF gedruckt und verlinkt.
- `explainerBase` und der im Formular eingefrorene Pfad ergeben den Link zum Erklärvideo, zum
  Beispiel `…/erklaervideos/sofortmeldung/versicherungsnummer`.

## Lokale Tests der Testseite (`tests.local.md`)

Tests, die DATEV-Lohnarten oder Felder von Lohn und Gehalt nennen, stehen in
`config/tests.local.md` (per `.gitignore` ausgeschlossen) und erscheinen nur auf der Testseite des
Testordners (`npm run build:test`). Format wie `manual_tests/`: Überschrift `# Bereich`, je Test
`## L-01: Titel`, darunter **Voraussetzungen:**, **Schritte:** (nummeriert) und **Erwartet:**
(Aufzählung). Nie echte Berater- oder Mandantennummern – nur erfundene.

## Übergabe an das Lohnprogramm (`export.local.json`)

Die Zuordnung „Antwort im Fragebogen → Maske und Feld im Lohnprogramm“ nennt die Felder des
Programms (für DATEV Lohn und Gehalt aus den DATEV-Unterlagen zum Stammdatenimport) und bleibt
deshalb **lokal**: `config/export.local.json` ist per `.gitignore` ausgeschlossen. Ohne diese Datei
hat der Build keine Übergabe. Mit ihr zeigt die Station „Kanzlei“ je Fragebogen das Erfassungsblatt
in der Reihenfolge der Programmmasken und bietet die Importdatei an (Lohn und Gehalt:
Kanzleiebene, Extras | Stammdatenimport).

**Nur der Kanzlei-Build** (`npm run build:kanzlei`, Ausgabe `dist-kanzlei/`) und die Prüf-Vorschau
enthalten die Zuordnung. Die gehostete App für die Mandanten (`npm run build`) enthält sie nie; ein
E2E-Test prüft das.

Aufbau (eine Liste, je Formular eine Zuordnung; `formVersion` beschränkt sie auf eine Fassung, z. B.
die Sofortmeldung 0.2.0): siehe `src/logic/exportMapping.ts` und das frei erfundene Beispiel
`tests/fixtures/export/beispiel.json`. `howTo` steht neben dem Download (wo die Datei eingespielt
wird). Eine ungültige Datei bricht den Build ab;
ob sie zur Formularfassung passt, prüft die Kanzlei-Station und zeigt Abweichungen an.

Besondere Werte:

- `"blank": true`: Diesen Wert kennt nur die Kanzlei, z. B. die Lohnart des Mandanten. Ist er Teil
  eines Einzelfelds, wird der ganze Datensatz nicht übertragen. Das Erfassungsblatt zeigt ihn mit
  „selbst erfassen“.
- `"companion": true`: Dieser Wert, z. B. der Monat „gültig ab“ eines Historienfelds, zählt nur
  zusammen mit den übrigen Werten des Felds.
- `"optional": true`: Das Unterfeld darf leer bleiben; das Programm ergänzt es selbst.
- `"input": "<id>"`: Den Wert trägt die Kanzlei je Fragebogen in der Station ein (`inputs`: Bezeichnung,
  Hilfe, `digits` [min, max] und/oder `options` (mit `digits` nur Vorschläge, jede passende Zahl geht),
  `default`, `defaultFrom` (Vorbelegung aus dem Fragebogen, z. B. die Betriebsnummer der Kasse, die die Person
  aus der Liste gewählt hat), `when`, `context` = Antworten, die beim
  Ausfüllen helfen). Beispiele: Lohnart des Mandanten, Betriebsnummer und KK-Nr. der Krankenkasse,
  Kürzel einer „anderen“ Konfession. Gefragt wird nur, solange ein Datensatz sie braucht. Leer zählt wie
  `blank`; ein Wert, der nicht passt, sperrt die Importdatei.
- `"first": [ … ]`: der erste dieser Werte, der etwas ergibt (z. B. die genaue Zahl der
  Kinderfreibeträge hinter „mehr als 3“, sonst die gewählte Zahl).
- `"notes": { "<Wert>": "<Hinweis>" }`: Der Wert wird übertragen, aber mit Hinweis „im Importprotokoll
  prüfen“ (z. B. Personengruppe 120, die in der Werteliste der LuG-Feldbeschreibung V16.1 fehlt).

**Mitarbeiter neu anlegen oder vorhandenen ergänzen** (Pflichtwahl in der Station): „neu anlegen“
schreibt die spezielle Satzbeschreibung `mitarbeiterNeu`, „vorhandenen ergänzen“ nur `mitarbeiterSel`
(legt nie einen Mitarbeiter an). So wird die Sofortmeldung als neuer Mitarbeiter eingespielt und der
Personalfragebogen später unter derselben Mitarbeiternummer ergänzt. Die Station zeigt Nummer, Name
und Eintritt zum Vergleich mit dem Lohnprogramm.
