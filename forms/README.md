# Formulardefinitionen

Jedes Formular liegt als `forms/<id>/<version>.json`, zum Beispiel
`forms/personalfragebogen/1.0.0.json`. Die Definition ist reine Daten: Rollen, Abschnitte, Felder,
Bedingungen, Hinweise und Prüfregeln. Code gehört nicht hinein. Ein abgeleiteter Wert verweist nur
auf den Namen einer Funktion in `src/logic/compute.ts`.

## Regeln

1. **Veröffentlicht heißt eingefroren.** Jede mitgelieferte Version steht mit ihrem
   `definitionHash` in [`published.json`](published.json). Der Hash ist SHA-256 über die
   JCS-Form (RFC 8785) der Definition. Ein Fragebogen verweist über diesen Hash auf seine
   Definition. Eine nachträgliche Änderung würde alte Fragebögen unprüfbar machen.
2. **Änderung = neue Version.** Eine neue Datei mit höherer Versionsnummer, dazu ein neuer Eintrag
   in `published.json`. Der Test `tests/forms/publishedForms.test.ts` nennt den Hash, der
   einzutragen ist.
3. **Einträge in `published.json` werden nie entfernt** und nie geändert.
4. **Eine Feld-ID wird nie umgedeutet.** Innerhalb eines Formulars behält eine ID über alle
   Versionen denselben Typ und dieselbe Rolle. Für eine neue Bedeutung gibt es eine neue ID.
5. Dateiname und Ordner müssen zu `id` und `version` in der Datei passen.

Der Test prüft die Regeln bei jedem `npm test`. Eine Lücke bleibt: Werden ein Eintrag und seine
Datei **gemeinsam** entfernt oder gemeinsam geändert, merkt der Test das nicht. Das prüft später die
CI gegen das letzte Release (Schritt 12). Bis dahin sichern die Golden-Dateien aus Schritt 3 ab,
denn sie verweisen per Hash auf ihre Definition.

## Aufbau

Die maßgebliche Beschreibung aller Felder steht in
[`docs/data-model.html`](../docs/data-model.html#definition). Die Prüfungen sind in
`src/logic/formDefinition.ts` hinterlegt (Form und Typen, dazu alle Verweise zwischen Rollen,
Feldern, Hinweisen und Regeln).
