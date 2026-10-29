# Formularentwürfe

Hier liegen Formulardefinitionen, die noch **fachlich geprüft** werden. Der Aufbau ist derselbe
wie in [`forms/`](../forms/README.md): `form-drafts/<id>/<version>.json`.

- Ein Entwurf wird **nie in die App eingebaut**. Er dient nur der Prüfung.
- Zu jedem Entwurf erzeugt `npm run catalogue` den lesbaren Feldkatalog in
  [`docs/formulare/`](../docs/formulare/). Er nennt den `definitionHash`, damit die Freigabe genau
  diese Fassung betrifft. Ein Test schlägt fehl, wenn Katalog und Definition auseinanderlaufen.
- Ein Entwurf darf geändert werden, bis er freigegeben ist.
- **Veröffentlichen nach der Freigabe:** die Datei nach `forms/<id>/<version>.json` verschieben, den
  Eintrag mit `definitionHash` in `forms/published.json` ergänzen und `npm run catalogue` ausführen.
  Ab dann gilt sie als eingefroren.

Die Tests in `tests/forms/formDrafts.test.ts` prüfen:

- Jeder Entwurf ist gültig und richtig abgelegt.
- Keine Version ist schon veröffentlicht.
- Jeder Entwurf ist neuer als alle veröffentlichten Versionen desselben Formulars.
- Feld-IDs veröffentlichter Versionen behalten Typ und Rolle.
