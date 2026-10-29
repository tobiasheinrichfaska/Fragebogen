# Feldkatalog: Personalfragebogen: Angaben für die Sofortmeldung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | sofortmeldung, Version 1.0.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | 0e7aa81515f0f9f52f4e9bea417e4c3febfdc44ddf7be29b5f450fe1ef4284e5 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Beschäftigte Person (person) | Pflicht | immer | – | Ich versichere, dass meine Angaben richtig und vollständig sind. |
| Gesetzliche Vertretung (vertretung) | Pflicht | nur wenn die Person laut „Geburtsdatum“ am Tag ihrer Unterschrift unter 18 ist | aus „Vor- und Familienname der gesetzlichen Vertretung“ | Als gesetzliche Vertretung der minderjährigen Person schließe ich mich ihrer Erklärung an. |
| Arbeitgeber (arbeitgeber) | freiwillig | immer | – | Ich bestätige die Angaben des Arbeitgebers. |

## Felder

### 1. Angaben der beschäftigten Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Familienname (familienname) | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Vornamen (vorname) | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Geburtsdatum (geburtsdatum) | Beschäftigte Person | Datum | immer | Pflicht | Prüfung, ob die gesetzliche Vertretung mitunterschreiben muss; ohne Versicherungsnummer Inhalt der Sofortmeldung |
| Staatsangehörigkeit (staatsangehoerigkeit) | Beschäftigte Person | Text | immer | Pflicht | Meldungen zur Sozialversicherung |
| Versicherungsnummer der Rentenversicherung (falls bekannt) (versicherungsnummer) | Beschäftigte Person | Versicherungsnummer | immer | optional | Inhalt der Sofortmeldung; ersetzt die Angaben zu Geburt und Anschrift |

### 2. Nur ohne Versicherungsnummer: Angaben für ihre Vergabe

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Geschlecht (geschlecht) | Beschäftigte Person | Auswahl: männlich, weiblich, divers, unbestimmt | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Vergabe einer Versicherungsnummer |
| Geburtsname (falls abweichend vom Familiennamen) (geburtsname) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | optional | Vergabe einer Versicherungsnummer |
| Geburtsort (geburtsort) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |
| Geburtsland (geburtsland) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Vergabe einer Versicherungsnummer |
| Straße und Hausnummer (strasse) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |
| Anschriftenzusatz (anschriftZusatz) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | optional | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |
| Postleitzahl (postleitzahl) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |
| Wohnort (wohnort) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | Pflicht | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |
| Wohnsitzstaat (nur wenn nicht Deutschland) (wohnstaat) | Beschäftigte Person | Text | erst wenn „Versicherungsnummer der Rentenversicherung (falls bekannt)“ leer ist | optional | Inhalt der Sofortmeldung ohne Versicherungsnummer (§ 28a Abs. 4 SGB IV) |

### 3. Gesetzliche Vertretung (nur bei Minderjährigen)

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Vor- und Familienname der gesetzlichen Vertretung (vertretungName) | Gesetzliche Vertretung | Text | immer | Pflicht | Nachweis, wer für die minderjährige Person unterschreibt |

### 4. Angaben des Arbeitgebers

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Firma des Arbeitgebers (agFirma) | Arbeitgeber | Text | immer | Pflicht | Kopfzeile des Fragebogens, Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer) | Arbeitgeber | Betriebsnummer (8 Ziffern) | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Familienname der beschäftigten Person (agFamilienname) | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Vornamen der beschäftigten Person (agVorname) | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Personalnummer (agPersonalnummer) | Arbeitgeber | Text | immer | optional | Zuordnung in der Lohnabrechnung |
| Tag der Beschäftigungsaufnahme (agBeschaeftigungsbeginn) | Arbeitgeber | Datum | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |

## Hinweise zur Kenntnisnahme

### Datenschutzhinweis

- Kenntnisnahme durch: Beschäftigte Person
- Art: wird in der App gelesen und bestätigt
- Stand: 29.10.2026

> Ihr Arbeitgeber verarbeitet diese Angaben, um den Beginn Ihrer Beschäftigung an die Datenstelle der Träger der Rentenversicherung zu melden (Sofortmeldung nach § 28a Abs. 4 SGB IV) und um Ihre Beschäftigung abzurechnen. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Sie sind gesetzlich verpflichtet, diese Angaben zu machen (§ 28o Abs. 1 SGB IV); ohne sie kann die Meldung nicht erstattet werden.
>
> Verantwortlich ist Ihr Arbeitgeber. Seine Kontaktdaten und gegebenenfalls die seines Datenschutzbeauftragten stehen in der Datenschutzinformation für Beschäftigte, die Sie von Ihrem Arbeitgeber erhalten. Empfänger sind die vom Arbeitgeber beauftragte lohnabrechnende Stelle und die Datenstelle der Träger der Rentenversicherung. Die Angaben werden aufbewahrt, solange gesetzliche Fristen es verlangen (unter anderem § 28f SGB IV, § 41 EStG).
>
> Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung nach Art. 15 bis 18 DSGVO und das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
>
> Diese App speichert und versendet nichts. Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben.

### Hinweis: Ausweispapiere mitführen (§ 2a Schwarzarbeitsbekämpfungsgesetz)

- Kenntnisnahme durch: Beschäftigte Person
- Art: wird auf Papier ausgehändigt; im Fragebogen wird die Aushändigung bestätigt
- Stand: 29.10.2026

> Wer in einem der folgenden Wirtschaftsbereiche Dienst- oder Werkleistungen erbringt, muss während der Arbeit den Personalausweis, Pass, Passersatz oder Ausweisersatz bei sich haben und den Behörden der Zollverwaltung auf Verlangen vorlegen:
>
> - Baugewerbe
> - Gaststätten- und Beherbergungsgewerbe
> - Personenbeförderungsgewerbe
> - Speditions-, Transport- und damit verbundenes Logistikgewerbe einschließlich plattformbasierter Lieferdienste
> - Schaustellergewerbe
> - Gebäudereinigungsgewerbe
> - Unternehmen, die sich am Auf- und Abbau von Messen und Ausstellungen beteiligen
> - Fleischwirtschaft (ohne Fleischerhandwerk)
> - Prostitutionsgewerbe
> - Wach- und Sicherheitsgewerbe
> - Friseur- und Kosmetikgewerbe
>
> Ihr Arbeitgeber muss Sie darauf nachweislich und schriftlich hinweisen und diesen Hinweis aufbewahren, solange Sie die Arbeit erbringen (§ 2a Abs. 2 SchwarzArbG).

## Prüfregeln

- „Familienname“ (Beschäftigte Person) und „Familienname der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Der Familienname weicht zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“
- „Vornamen“ (Beschäftigte Person) und „Vornamen der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“

## Zuordnung getrennt eingegangener Teile

- Familienname: „Familienname“ (Beschäftigte Person) = „Familienname der beschäftigten Person“ (Arbeitgeber)
- Vornamen: „Vornamen“ (Beschäftigte Person) = „Vornamen der beschäftigten Person“ (Arbeitgeber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). Für die Angaben zur Sofortmeldung schreibt das Gesetz keine besondere Form vor.
- Dieser Fragebogen ist nicht die Sofortmeldung selbst. Der Arbeitgeber meldet den Beginn der Beschäftigung bei deren Aufnahme an die Datenstelle der Träger der Rentenversicherung (§ 28a Abs. 4 SGB IV).
- Den Hinweis auf die Pflicht, Ausweispapiere mitzuführen, gibt der Arbeitgeber nachweislich und schriftlich (§ 2a Abs. 2 SchwarzArbG). Er wird deshalb auf Papier ausgehändigt; im Fragebogen wird nur die Aushändigung bestätigt.
