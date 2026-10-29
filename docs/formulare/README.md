# Feldkataloge

Lesbare Übersicht jedes Formulars und jedes Entwurfs, erzeugt aus der Formulardefinition:
Rollen, Abschnitte, Felder, Zuständigkeit, Pflicht und Bedingungen, Zweck, Hinweistexte,
Prüfregeln und rechtliche Hinweise.

- **Nicht von Hand ändern.** Nach jeder Änderung einer Definition `npm run catalogue` ausführen.
  `tests/forms/catalogue.test.ts` schlägt fehl, wenn ein Katalog nicht mehr zur Definition passt.
- Jeder Katalog nennt den `definitionHash`. Eine Freigabe gilt genau für diese Fassung.
- Dateiname: `<id>-<version>.md`.
