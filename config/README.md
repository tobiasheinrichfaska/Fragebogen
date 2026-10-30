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

Aufbau (eine Liste, je Formular eine Zuordnung): siehe `src/logic/exportMapping.ts` und das frei
erfundene Beispiel `tests/fixtures/export/beispiel.json`. Eine ungültige Datei bricht den Build ab;
ob sie zur Formularfassung passt, prüft die Kanzlei-Station und zeigt Abweichungen an.

Besondere Werte:

- `"blank": true`: Diesen Wert kennt nur die Kanzlei, z. B. die Lohnart des Mandanten. Ist er Teil
  eines Einzelfelds, wird der ganze Datensatz nicht übertragen. Das Erfassungsblatt zeigt ihn mit
  „selbst erfassen“.
- `"companion": true`: Dieser Wert, z. B. der Monat „gültig ab“ eines Historienfelds, zählt nur
  zusammen mit den übrigen Werten des Felds.
- `"optional": true`: Das Unterfeld darf leer bleiben; das Programm ergänzt es selbst.
