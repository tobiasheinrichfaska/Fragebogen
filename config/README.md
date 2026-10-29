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
