# Golden-Dateien

Hier liegen Fragebögen, wie sie die App erzeugt. Sie sichern zwei Dinge ab:

1. **Dauerhafte Prüfbarkeit:** Jede Datei muss sich mit dem aktuellen Code einlesen und prüfen
   lassen, mit genau den hinterlegten Prüfurteilen.
2. **Unveränderte Siegel:** Dieselben Eingaben (Testszenarien in `tests/support/sample.ts`) müssen
   byte-gleich dieselben Hashes ergeben. Schlägt dieser Test fehl, hat sich die Kanonisierung oder
   das Siegelformat geändert. Alte Fragebögen wären dann nicht mehr nachprüfbar.

## Regeln

- **Eine Golden-Datei wird nie geändert und nie neu erzeugt.** Eine bewusste Formatänderung braucht
  eine neue `canon`- bzw. `schema`-Version und neue Dateien **neben** den alten.
- Neue Dateien entstehen einmalig mit `WRITE_GOLDEN=1 npx vitest run tests/golden`. Vorhandene
  Dateien überschreibt das nicht.
- Prettier lässt die Dateien in Ruhe (`.prettierignore`), damit sie byte-gleich bleiben.
- Die Dateien unter `beispiel-<version>/` beruhen auf dem Testformular
  `tests/fixtures/forms/beispiel/<version>.json`. **Diese Testformulare sind damit eingefroren.** Ändert
  es sich, ändert sich sein `definitionHash`, und die Golden-Tests schlagen fehl.
- Alle Angaben sind erfunden.

| Datei                               | Szenario                                                                                                     | Erwartetes Urteil                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `beispiel-1.0.0/zwei-rollen.json`   | Person unterschreibt (gezeichnet), Arbeitgeber schließt ab und vermerkt den Eingang, Kanzlei-Eingang (DATEV) | beide Teile „bestätigt“, keine Befunde                                                             |
| `beispiel-1.0.0/neue-fassung.json`  | Person unterschreibt (getippt), Arbeitgeber vermerkt diese Fassung, Person unterschreibt eine 2. Fassung     | 1. Fassung „bestätigt“, 2. Fassung „in sich stimmig“; Hinweis „Verweis gilt einer älteren Fassung“ |
| `beispiel-1.1.0/minderjaehrig.json` | 16-Jährige unterschreibt, gesetzliche Vertretung unterschreibt mit Namen am selben Gerät und bindet den Teil | Person „bestätigt“ (durch die Vertretung), Vertretung „in sich stimmig“                            |
