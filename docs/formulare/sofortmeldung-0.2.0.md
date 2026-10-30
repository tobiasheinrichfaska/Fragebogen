# Feldkatalog: Personalfragebogen: Angaben für die Sofortmeldung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | sofortmeldung, Version 0.2.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Tag der Beschäftigungsaufnahme“ ab 01.01.2026 |
| Definition (SHA-256) | bef79a99e5ad592e0c8b039bf543d4a96af800bde1263316e3782f175b5a3125 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für Ihre Angaben schreibt das Gesetz keine besondere Form vor: Sie teilen sie Ihrem Arbeitgeber nur mit (§ 28o Abs. 1 SGB IV). Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name. Sie ist nach Art. 3 Nr. 10 der eIDAS-Verordnung jede elektronische Angabe, die Sie zum Unterzeichnen verwenden. Die Zeit stammt von diesem Gerät; Gewissheit über den Zeitpunkt gibt erst die Ablage beim Arbeitgeber. |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Beschäftigte Person (person) | Pflicht | immer | – | Ich versichere, dass meine Angaben richtig und vollständig sind. |
| Gesetzliche Vertretung (vertretung) | Pflicht | nur wenn die Person laut „Geburtsdatum“ am Tag ihrer Unterschrift unter 18 ist<br>Warum: Wer am Tag der eigenen Unterschrift noch minderjährig ist (§§ 187, 188 BGB), ist nur beschränkt geschäftsfähig (§ 106 BGB). Deshalb bestätigt die gesetzliche Vertretung die Angaben mit ihrer Unterschrift. | aus „Vor- und Familienname der gesetzlichen Vertretung“ | Als gesetzliche Vertretung der minderjährigen Person schließe ich mich ihrer Erklärung an. |
| Arbeitgeber (arbeitgeber) | freiwillig | immer | – | Ich bestätige die Angaben des Arbeitgebers. |

## Felder

### 1. Angaben der beschäftigten Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Familienname (familienname)<br>Frage: Wie lautet Ihr Familienname?<br>Hilfe: So, wie er in Ihrem Ausweis steht – ohne Titel wie „Dr.“ und ohne Vorsatzwort wie „von“; nach diesen fragen wir gleich gesondert. | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Vornamen (vorname)<br>Frage: Wie lauten Ihre Vornamen?<br>Hilfe: Alle Vornamen, wie in Ihrem Ausweis. | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Titel, Vorsatzwort oder Namenszusatz (namensbestandteile)<br>Frage: Gehört zu Ihrem Namen ein Titel, ein Vorsatzwort oder ein Namenszusatz?<br>Hilfe: Zum Beispiel „Dr.“, „von“ oder „Freiherr“. Diese Teile stehen in den Meldungen zur Sozialversicherung in eigenen Feldern. | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Meldungen zur Sozialversicherung (Datenbaustein Name nach den Gemeinsamen Grundsätzen zur DEÜV: Titel, Vorsatzwort und Namenszusatz in eigenen Feldern); Stammdaten der Lohnabrechnung |
| Titel (titel)<br>Frage: Welchen akademischen Grad oder Titel führen Sie im Namen?<br>Hilfe: Zum Beispiel „Dr.“ oder „Prof. Dr.“ – so, wie er in Ihrem Ausweis steht.<br>Knöpfe: „Keinen“ (leer lassen) | Beschäftigte Person | Text | erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist<br>Warum: Nur wer einen Titel, ein Vorsatzwort oder einen Namenszusatz führt, wird danach gefragt; die Meldungen zur Sozialversicherung führen diese Teile in eigenen Feldern. | optional | Meldungen zur Sozialversicherung (Datenbaustein Name nach den Gemeinsamen Grundsätzen zur DEÜV: Titel, Vorsatzwort und Namenszusatz in eigenen Feldern); Stammdaten der Lohnabrechnung |
| Vorsatzwort (vorsatzwort)<br>Frage: Wie lautet das Vorsatzwort Ihres Namens?<br>Hilfe: Zum Beispiel „von“, „van der“ oder „de“ – aus der amtlichen Liste. Steht Ihr Vorsatzwort nicht darin, gehört es zum Familiennamen; lassen Sie dieses Feld dann leer.<br>Knöpfe: „Keines“ (leer lassen) | Beschäftigte Person | Auswahl: aus der Liste „Vorsatzworte“ (188 Einträge; DEÜV-Rundschreiben, Anlage 6 (Stand 18.03.2026, mit den Schreibweisen vom 08.08.2007)) | erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist<br>Warum: Nur wer einen Titel, ein Vorsatzwort oder einen Namenszusatz führt, wird danach gefragt; die Meldungen zur Sozialversicherung führen diese Teile in eigenen Feldern. | optional | Meldungen zur Sozialversicherung (Datenbaustein Name nach den Gemeinsamen Grundsätzen zur DEÜV: Titel, Vorsatzwort und Namenszusatz in eigenen Feldern); Stammdaten der Lohnabrechnung – nur Einträge der amtlichen Liste (DEÜV-Rundschreiben, Anlagen 6 und 7) |
| Namenszusatz (namenszusatz)<br>Frage: Wie lautet der Namenszusatz?<br>Hilfe: Zum Beispiel „Freiherr“, „Gräfin“ oder „Edle“ – aus der amtlichen Liste. Steht er nicht darin, gehört er zum Familiennamen; lassen Sie dieses Feld dann leer.<br>Knöpfe: „Keinen“ (leer lassen) | Beschäftigte Person | Auswahl: aus der Liste „Namenszusätze“ (70 Einträge; DEÜV-Rundschreiben, Anlage 7 (Stand 04.05.2006)) | erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist<br>Warum: Nur wer einen Titel, ein Vorsatzwort oder einen Namenszusatz führt, wird danach gefragt; die Meldungen zur Sozialversicherung führen diese Teile in eigenen Feldern. | optional | Meldungen zur Sozialversicherung (Datenbaustein Name nach den Gemeinsamen Grundsätzen zur DEÜV: Titel, Vorsatzwort und Namenszusatz in eigenen Feldern); Stammdaten der Lohnabrechnung – nur Einträge der amtlichen Liste (DEÜV-Rundschreiben, Anlagen 6 und 7) |
| Ist Ihr Geburtsname gleich Ihrem Familiennamen? (geburtsnameWieFamilienname)<br>Frage: Ist Ihr Geburtsname gleich dem gerade angegebenen Familiennamen „‹Familienname›“?<br>Hilfe: Der Geburtsname ist der Familienname, den Sie bei Ihrer Geburt hatten. | Beschäftigte Person | Ja/Nein; vorbelegt: Ja | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geburtsname (geburtsname)<br>Frage: Wie lautet Ihr Geburtsname? | Beschäftigte Person | Text | erst wenn „Ist Ihr Geburtsname gleich Ihrem Familiennamen?“ mit „Nein“ beantwortet ist<br>Warum: Der Geburtsname ist nur dann eine eigene Angabe, wenn er vom Familiennamen abweicht; sonst steht er schon fest. | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geburtsdatum (geburtsdatum)<br>Frage: Wann sind Sie geboren?<br>Hilfe: Zum Beispiel 17.05.1990. | Beschäftigte Person | Datum | immer | Pflicht | Prüfung, ob die gesetzliche Vertretung mitunterschreiben muss; Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV) |
| Geburtsort (geburtsort)<br>Frage: Wo sind Sie geboren?<br>Hilfe: Der Ort, wie er in Ihrem Ausweis steht. | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Geburtsland (geburtsstaat)<br>Frage: In welchem Land sind Sie geboren?<br>Hilfe: Tippen Sie die ersten Buchstaben und wählen Sie aus der Liste. Gibt es den Staat nicht mehr (zum Beispiel Sowjetunion oder Jugoslawien), wählen Sie den heutigen Staat, in dem Ihr Geburtsort liegt.<br>Knöpfe: „Deutschland“ | Beschäftigte Person | Auswahl: aus der Liste „Staaten und Gebiete“ (259 Einträge; DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)) | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geschlecht (geschlecht)<br>Frage: Welches Geschlecht ist bei Ihnen eingetragen?<br>Hilfe: So, wie es in Ihren amtlichen Papieren steht. | Beschäftigte Person | Auswahl: männlich, weiblich, divers, unbestimmt | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Staatsangehörigkeit (staatsangehoerigkeitSchluessel)<br>Frage: Welche Staatsangehörigkeit haben Sie?<br>Hilfe: Tippen Sie die ersten Buchstaben, zum Beispiel „deutsch“, und wählen Sie aus der Liste. Bei mehreren Staatsangehörigkeiten genügt eine; eine deutsche geht vor.<br>Knöpfe: „deutsch“ | Beschäftigte Person | Auswahl: aus der Liste „Staatsangehörigkeiten“ (204 Einträge; DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)) | immer | Pflicht | Meldungen zur Sozialversicherung |
| Versicherungsnummer der Rentenversicherung (falls bekannt) (versicherungsnummer)<br>Frage: Wie lautet Ihre Versicherungsnummer der Rentenversicherung?<br>Hilfe: Sie hat 12 Stellen und steht auf Ihrem Sozialversicherungsausweis oder einer Meldebescheinigung zur Sozialversicherung. Nicht zur Hand? Dann „Weiß ich gerade nicht“ wählen.<br>Knöpfe: „Kenne ich nicht“ (leer lassen) | Beschäftigte Person | Versicherungsnummer | immer | optional | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |

### 2. Anschrift

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Liegt die Anschrift im Ausland? (anschriftAusland)<br>Hilfe: Diese Frage steht am Anfang der Anschrift, weil davon abhängt, wie nach Staat und Postleitzahl gefragt wird: Eine deutsche Postleitzahl hat 5 Ziffern und wird geprüft, eine ausländische nicht. | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Staat (anschriftStaat)<br>Frage: In welchem Staat liegt Ihre Anschrift?<br>Hilfe: Tippen Sie die ersten Buchstaben und wählen Sie aus der Liste. | Beschäftigte Person | Auswahl: aus der Liste „Staaten und Gebiete außer Deutschland“ (258 Einträge; DEÜV-Rundschreiben, Anlage 8 Teil A (Stand 11.09.2025)) | erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist<br>Warum: Bei einer Anschrift in Deutschland steht der Staat fest; nur eine Anschrift im Ausland braucht ihn. | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Straße (strassenname)<br>Frage: In welcher Straße wohnen Sie?<br>Hilfe: Nur der Straßenname; die Hausnummer kommt als Nächstes. | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Hausnummer (hausnummer)<br>Frage: Welche Hausnummer hat die Anschrift?<br>Hilfe: Mit Zusatz, zum Beispiel „12a“. Leer lassen, wenn die Anschrift keine Hausnummer hat.<br>Knöpfe: „Keine Hausnummer“ (leer lassen) | Beschäftigte Person | Text | immer | optional | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung – die Meldungen führen Straße und Hausnummer getrennt |
| Anschriftenzusatz (anschriftZusatz)<br>Frage: Gibt es einen Zusatz zur Anschrift?<br>Hilfe: Zum Beispiel „bei Müller“ oder „Hinterhaus“. Sonst leer lassen.<br>Knöpfe: „Kein Zusatz“ (leer lassen) | Beschäftigte Person | Text | immer | optional | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Postleitzahl (postleitzahl)<br>Frage: Wie lautet Ihre Postleitzahl?<br>Hilfe: 5 Ziffern. | Beschäftigte Person | Text, deutsche Postleitzahl (5 Ziffern) | erst wenn „Liegt die Anschrift im Ausland?“ mit „Nein“ beantwortet ist<br>Warum: Eine deutsche Postleitzahl hat immer 5 Ziffern und wird darauf geprüft. Deshalb wird sie nur bei einer Anschrift in Deutschland so gefragt. | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Postleitzahl (Ausland) (postleitzahlAusland)<br>Frage: Wie lautet die Postleitzahl?<br>Hilfe: So, wie sie in Ihrem Wohnstaat geschrieben wird. Gibt es dort keine, lassen Sie das Feld leer. | Beschäftigte Person | Text | erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist<br>Warum: Postleitzahlen im Ausland haben andere Formate; sie werden bei einer Anschrift im Ausland ohne Prüfung übernommen. | optional | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |
| Wohnort (wohnort)<br>Frage: In welchem Ort wohnen Sie? | Beschäftigte Person | Text | immer | Pflicht | Inhalt der Sofortmeldung, wenn die Versicherungsnummer fehlt (§ 28a Abs. 4 SGB IV); Stammdaten für die Lohnabrechnung |

### 3. Gesetzliche Vertretung (nur bei Minderjährigen)

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Vor- und Familienname der gesetzlichen Vertretung (vertretungName)<br>Frage: Wie lautet Ihr Vor- und Familienname?<br>Hilfe: Sie unterschreiben als gesetzliche Vertretung der minderjährigen Person, zum Beispiel als Elternteil. | Gesetzliche Vertretung | Text | immer | Pflicht | Nachweis, wer für die minderjährige Person unterschreibt |

### 4. Angaben des Arbeitgebers

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Firma des Arbeitgebers (agFirma)<br>Frage: Wie lautet die Firma des Arbeitgebers?<br>Hilfe: So, wie sie auf dem Briefkopf oder im Handelsregister steht. | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Kopfzeile des Fragebogens, Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer)<br>Frage: Wie lautet die Betriebsnummer?<br>Hilfe: 8 Ziffern, vergeben von der Bundesagentur für Arbeit. Sie steht auf den Meldungen zur Sozialversicherung; Ihre Lohnabrechnung kennt sie. | Arbeitgeber | Betriebsnummer (8 Ziffern); Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |
| Familienname der beschäftigten Person (agFamilienname)<br>Frage: Wie lautet der Familienname der beschäftigten Person? | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Vornamen der beschäftigten Person (agVorname)<br>Frage: Wie lauten die Vornamen der beschäftigten Person? | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Personalnummer (agPersonalnummer)<br>Frage: Welche Personalnummer hat die Person?<br>Hilfe: Nur, wenn schon eine vergeben ist. | Arbeitgeber | Text | immer | optional | Zuordnung in der Lohnabrechnung |
| Tag der Beschäftigungsaufnahme (agBeschaeftigungsbeginn)<br>Frage: An welchem Tag beginnt die Beschäftigung?<br>Hilfe: Der erste Arbeitstag. Die Sofortmeldung muss spätestens bei Arbeitsaufnahme erstattet sein. | Arbeitgeber | Datum | immer | Pflicht | Inhalt der Sofortmeldung (§ 28a Abs. 4 SGB IV) |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Titel, Vorsatzwort oder Namenszusatz (Beschäftigte Person; unabhängig)
  - Titel (Beschäftigte Person; Ebene 1) – erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist
  - Vorsatzwort (Beschäftigte Person; Ebene 1) – erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist
  - Namenszusatz (Beschäftigte Person; Ebene 1) – erst wenn „Titel, Vorsatzwort oder Namenszusatz“ mit „Ja“ beantwortet ist
- Ist Ihr Geburtsname gleich Ihrem Familiennamen? (Beschäftigte Person; unabhängig)
  - Geburtsname (Beschäftigte Person; Ebene 1) – erst wenn „Ist Ihr Geburtsname gleich Ihrem Familiennamen?“ mit „Nein“ beantwortet ist
- Liegt die Anschrift im Ausland? (Beschäftigte Person; unabhängig)
  - Staat (Beschäftigte Person; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist
  - Postleitzahl (Beschäftigte Person; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Nein“ beantwortet ist
  - Postleitzahl (Ausland) (Beschäftigte Person; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist

Alle übrigen Angaben sind unabhängig.

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

## Verknüpfung der Teile

- Beschäftigte Person und Arbeitgeber: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Familienname“ (Beschäftigte Person) und „Familienname der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Der Familienname weicht zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“
- „Vornamen“ (Beschäftigte Person) und „Vornamen der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“

## Zuordnung getrennt eingegangener Teile

- Familienname: „Familienname“ (Beschäftigte Person) = „Familienname der beschäftigten Person“ (Arbeitgeber)
- Vornamen: „Vornamen“ (Beschäftigte Person) = „Vornamen der beschäftigten Person“ (Arbeitgeber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen ist nicht die Sofortmeldung selbst: Die Meldung an die Rentenversicherung (§ 28a Abs. 4 SGB IV) erstattet die lohnabrechnende Stelle mit diesen Angaben spätestens bei Beschäftigungsaufnahme.
- Der Hinweis auf die Mitführungspflicht wird auf Papier ausgehändigt; der Fragebogen bestätigt nur die Aushändigung.
- Er fragt nur, was die Sofortmeldung braucht; die übrigen Angaben für die Lohnabrechnung folgen im Personalfragebogen.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). Für die Angaben zur Sofortmeldung schreibt das Gesetz keine besondere Form vor.
- Dieser Fragebogen ist nicht die Sofortmeldung selbst. Der Arbeitgeber meldet den Beginn der Beschäftigung bei deren Aufnahme an die Datenstelle der Träger der Rentenversicherung (§ 28a Abs. 4 SGB IV).
- Den Hinweis auf die Pflicht, Ausweispapiere mitzuführen, gibt der Arbeitgeber nachweislich und schriftlich (§ 2a Abs. 2 SchwarzArbG). Er wird deshalb auf Papier ausgehändigt; im Fragebogen wird nur die Aushändigung bestätigt.
