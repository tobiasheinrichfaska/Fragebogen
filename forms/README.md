# Formulardefinitionen

Jedes Formular liegt als `forms/<id>/<version>.json`, zum Beispiel
`forms/personalfragebogen/1.0.0.json`. Die Definition ist reine Daten: Rollen, Abschnitte, Felder,
Bedingungen, Hinweise und Prüfregeln. Code gehört nicht hinein. Ein abgeleiteter Wert verweist nur
auf den Namen einer Funktion in `src/logic/compute.ts`.

## Regeln

1. **Veröffentlicht heißt eingefroren.** Jede mitgelieferte Version steht mit ihrem
   `definitionHash` in [`published.json`](published.json). Der Hash ist SHA-256 über die
   JCS-Form (RFC 8785) der Definition. Ein Fragebogen verweist über diesen Hash auf seine
   Definition. Eine nachträgliche Änderung würde Bögen, die mit dieser Version unterwegs sind,
   unprüfbar machen und ihre Weiterbearbeitung verhindern.
2. **Änderung = neue Version.** Eine neue Datei mit höherer Versionsnummer, dazu ein neuer Eintrag
   in `published.json`. Der Test `tests/forms/publishedForms.test.ts` nennt den Hash, der
   einzutragen ist.
3. **Einträge in `published.json` werden nie geändert.** Eine Version **darf entfernt werden**
   (Datei und Eintrag gemeinsam), sobald keine Bögen mehr mit ihr unterwegs sind (Tobias
   2026-11-01: „wir brauchen alte Bögen nicht eingefroren aufbewahren, da wir die fertigen Bögen
   bei DATEV einreichen“). Die fertige PDF in DATEV ist der Beleg. Jede Datei trägt ihre
   Definition mit; ein alter Bogen bleibt lesbar, die App bestätigt ihn dann nur nicht mehr als
   eigene Fassung („nur in der Datei beschrieben“).
4. **Eine Feld-ID wird nie umgedeutet.** Innerhalb eines Formulars behält eine ID über alle
   Versionen denselben Typ und dieselbe Rolle. Für eine neue Bedeutung gibt es eine neue ID.
5. Dateiname und Ordner müssen zu `id` und `version` in der Datei passen.

Der Test prüft die Regeln bei jedem `npm test`. Eine Lücke bleibt: Werden ein Eintrag und seine
Datei **gemeinsam** entfernt oder gemeinsam geändert, merkt der Test das nicht. Das prüft später die
CI gegen das letzte Release (Schritt 12). Bis dahin sichern die Golden-Dateien aus Schritt 3 ab,
denn sie verweisen per Hash auf ihre Definition.

## Testfassungen und Produktivfassungen (Tobias 03.11.2026)

- **Produktivfassung** = veröffentlicht hier in `forms/` ab Version **1.0.0**, nur nach
  ausdrücklicher Freigabe. Für neue Bögen bietet die App immer die neueste Fassung eines Formulars
  an; ältere Fassungen bleiben nur im Register, damit unterwegs befindliche Bögen weiter geprüft
  und bearbeitet werden können.
- **Testfassung** = Entwurf in [`form-drafts/`](../form-drafts/README.md), nur im Testbereich und
  dort gekennzeichnet. Eine Änderung wird dort erprobt und danach als nächste Produktivfassung
  (1.1.0, 2.0.0 …) veröffentlicht. Ein Entwurf ist immer neuer als alles Veröffentlichte desselben
  Formulars, und ein Formular mit Produktivfassung bekommt keine 0.x-Fassung mehr
  (`tests/forms/sofortmeldung100.test.ts`).
- **Die Fassungen 0.x** in `forms/` stammen aus der Testphase vor der ersten Produktivfassung (z. B.
  `sofortmeldung/0.2.0.json` bis `0.4.0.json`); die App kennzeichnet sie als „Testfassung“. Sie
  dürfen, wie jede Version, entfernt werden, sobald keine Bögen mehr mit ihnen unterwegs sind.

Golden-Dateien prüfen das Dateiformat (Siegel, Kanonisierung) gegen feste Beispiele; sie hängen
nicht davon ab, welche Fassungen die App mitliefert.

## Entwürfe

Ein neues Formular entsteht zuerst als Entwurf in [`form-drafts/`](../form-drafts/README.md). Zu
jedem Entwurf gibt es einen lesbaren Feldkatalog in [`docs/formulare/`](../docs/formulare/README.md)
zur fachlichen Freigabe. Erst nach der Freigabe wird die Datei hierher verschoben und in
`published.json` eingetragen.

## Aufbau

Die maßgebliche Beschreibung aller Felder steht in
[`docs/data-model.html`](../docs/data-model.html#definition). Die Prüfungen sind in
`src/logic/formDefinition.ts` hinterlegt (Form und Typen, dazu alle Verweise zwischen Rollen,
Feldern, Hinweisen und Regeln).
