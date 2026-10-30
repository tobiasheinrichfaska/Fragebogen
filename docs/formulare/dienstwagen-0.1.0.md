# Feldkatalog: Dienstwagen: Überlassung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | dienstwagen, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | e9eb7f317c10b5d6eb24c11adb57e1cd141287d06e5eb32bd557836fd58268c7 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für diese Angaben schreibt das Gesetz keine Form vor. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Einen Verzicht auf die private Nutzung erklären Sie auf Papier. |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Arbeitgeber (arbeitgeber) | Pflicht | immer | – | Ich bestätige die Angaben zu Fahrzeug und Überlassung. |
| Beschäftigte Person (person) | Pflicht | immer | – | Ich versichere, dass meine Angaben richtig sind. Einen Umzug oder einen Wechsel der Tätigkeitsstätte teile ich meinem Arbeitgeber unverzüglich mit. |

## Felder

### 1. Arbeitgeber und beschäftigte Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Firma des Arbeitgebers (agFirma)<br>Hilfe: So, wie sie auf dem Briefkopf steht. | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Zuordnung |
| Familienname der beschäftigten Person (agFamilienname) | Arbeitgeber | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe der Person |
| Vornamen der beschäftigten Person (agVorname) | Arbeitgeber | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe der Person |
| Personalnummer (agPersonalnummer)<br>Hilfe: Nur wenn schon vergeben. | Arbeitgeber | Text | immer | optional | Zuordnung in der Lohnabrechnung |

### 2. Fahrzeug

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Amtliches Kennzeichen (agKennzeichen) | Arbeitgeber | Text | immer | Pflicht | Zuordnung |
| Marke und Modell (agFahrzeug) | Arbeitgeber | Text | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Datum der Erstzulassung (agErstzulassung)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld B. | Arbeitgeber | Datum | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Kauf- oder Leasingbeginn beim Arbeitgeber (agAnschaffung)<br>Hilfe: Entscheidet bei Elektro- und Hybridfahrzeugen, welche Grenzen gelten. | Arbeitgeber | Datum | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Inländischer Listenpreis bei Erstzulassung (agListenpreis)<br>Hilfe: Unverbindliche Preisempfehlung des Herstellers einschließlich Umsatzsteuer, ohne Sonderausstattung – nicht der gezahlte Preis, auch bei Gebraucht- oder Leasingfahrzeugen. Rabatte zählen nicht. | Arbeitgeber | Betrag in Euro | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Werkseitige Sonderausstattung (agSonderausstattung)<br>Hilfe: Einschließlich Umsatzsteuer; 0, wenn keine. Nicht: Freisprecheinrichtung, zweiter Reifensatz, später eingebaute Teile. | Arbeitgeber | Betrag in Euro | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Antrieb (agAntrieb)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld 10. | Arbeitgeber | Auswahl: Verbrennungsmotor, Hybrid ohne Stecker, Plug-in-Hybrid (extern aufladbar), reines Elektrofahrzeug, Brennstoffzelle (Wasserstoff) | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR); geringerer Ansatz für Elektro- und Hybridfahrzeuge |
| Erstmals einer beschäftigten Person zur Privatnutzung überlassen am (agErstUeberlassung) | Arbeitgeber | Datum | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist<br>Warum: Bei Elektro-, Plug-in-Hybrid- und Brennstoffzellenfahrzeugen hängt der geringere Ansatz des Listenpreises vom Tag der ersten Überlassung ab (§ 6 Abs. 1 Nr. 4 Satz 2 EStG). | Pflicht | Maßgeblicher Zeitpunkt für die Begünstigung von Elektro- und Hybridfahrzeugen |
| CO2-Emission (agCo2)<br>Hilfe: Übereinstimmungsbescheinigung (CoC) Ziffer 49.4, gewichteter kombinierter Wert. | Arbeitgeber | Zahl, ganzzahlig, in g/km | erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist<br>Warum: Ein Plug-in-Hybrid wird nur bei geringem CO2-Ausstoß oder ausreichender elektrischer Reichweite geringer angesetzt (§ 6 Abs. 1 Nr. 4 Satz 2 EStG). | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Elektrische Reichweite (agReichweite)<br>Hilfe: CoC Ziffer 49.5.2, elektrische Reichweite innerorts. | Arbeitgeber | Zahl, ganzzahlig, in km | erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist<br>Warum: Ein Plug-in-Hybrid wird nur bei geringem CO2-Ausstoß oder ausreichender elektrischer Reichweite geringer angesetzt (§ 6 Abs. 1 Nr. 4 Satz 2 EStG). | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |

### 3. Überlassung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Überlassen ab (agUeberlassenAb) | Arbeitgeber | Datum | immer | Pflicht | Geldwerter Vorteil nach der 1-%-Regelung (§ 8 Abs. 2 Satz 2, § 6 Abs. 1 Nr. 4 Satz 2 EStG) |
| Überlassen bis (agUeberlassenBis)<br>Hilfe: Nur wenn bekannt oder bei Rückgabe. | Arbeitgeber | Datum | immer | optional | Geldwerter Vorteil nach der 1-%-Regelung (§ 8 Abs. 2 Satz 2, § 6 Abs. 1 Nr. 4 Satz 2 EStG) |
| Privatnutzung erlaubt (agPrivatnutzung)<br>Frage: Darf die Person das Fahrzeug privat nutzen?<br>Hilfe: Dann gilt die 1-%-Regelung: monatlich 1 % des Listenpreises (bei Elektro- und Hybridfahrzeugen weniger). | Arbeitgeber | Ja/Nein | immer | Pflicht | Geldwerter Vorteil nach der 1-%-Regelung (§ 8 Abs. 2 Satz 2, § 6 Abs. 1 Nr. 4 Satz 2 EStG) |
| Regelung des Nutzungsverbots (agNutzungsverbot)<br>Hilfe: Das Dokument gehört zum Lohnkonto. | Arbeitgeber | Auswahl: Arbeitsvertrag, Dienstwagenvereinbarung, Betriebsvereinbarung, schriftlicher Verzicht der Person (auf Papier) | erst wenn „Privatnutzung erlaubt“ mit „Nein“ beantwortet ist<br>Warum: Ohne Privatnutzung entfällt die 1-%-Regelung nur, wenn ein Nutzungsverbot vereinbart ist; deshalb wird seine Grundlage gebraucht. | Pflicht | Geldwerter Vorteil nach der 1-%-Regelung (§ 8 Abs. 2 Satz 2, § 6 Abs. 1 Nr. 4 Satz 2 EStG) |
| Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt (agFahrtenWohnung)<br>Frage: Darf die Person mit dem Fahrzeug zwischen Wohnung und erster Tätigkeitsstätte fahren? | Arbeitgeber | Ja/Nein | immer | Pflicht | Fahrten zwischen Wohnung und erster Tätigkeitsstätte: 0,03 % je Entfernungskilometer (§ 8 Abs. 2 Satz 3 EStG) |
| Pauschalierung mit 15 % (agPauschal15)<br>Frage: Sollen die Fahrten zwischen Wohnung und erster Tätigkeitsstätte mit 15 % pauschal versteuert werden?<br>Hilfe: Pauschal versteuert wird der Vorteil für 15 Arbeitstage im Monat; dieser Teil ist in der Sozialversicherung beitragsfrei. | Arbeitgeber | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist<br>Warum: Nur wenn das Fahrzeug für Fahrten zur ersten Tätigkeitsstätte genutzt wird, kann der Arbeitgeber diese Fahrten mit 15 % pauschal versteuern (§ 40 Abs. 2 Satz 2 Nr. 1a EStG). | Pflicht | Pauschale Lohnsteuer für 15 Fahrten im Monat (§ 40 Abs. 2 Satz 2 Nr. 1a EStG); beitragsfrei (§ 1 SvEV) |
| Sonderfälle (agSonderfaelle)<br>Frage: Trifft einer dieser Sonderfälle zu?<br>Hilfe: Diese Fälle deckt der Fragebogen nicht ab; die lohnabrechnende Stelle klärt sie gesondert mit Ihnen. | Arbeitgeber | Mehrfachauswahl: Fahrtenbuch statt 1-%-Regelung, Einzelbewertung der Fahrten (0,002 % je Fahrt), weniger als 5 Arbeitstage pro Woche vor Ort (Homeoffice), Zuzahlungen oder Kostenübernahme durch die Person, Familienheimfahrten (doppelte Haushaltsführung), Fahrer wird gestellt, mehrere Personen nutzen das Fahrzeug privat, Erstattung von Ladestrom zu Hause, Überlassung durch Gehaltsumwandlung, keiner davon | immer | Pflicht | Abweichungen von der Standardbewertung, die die lohnabrechnende Stelle gesondert klärt |

### 4. Angaben der beschäftigten Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Familienname (familienname)<br>Frage: Wie lautet Ihr Familienname? | Beschäftigte Person | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe des Arbeitgebers |
| Vornamen (vorname)<br>Frage: Wie lauten Ihre Vornamen? | Beschäftigte Person | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe des Arbeitgebers |
| Fahrten zwischen Wohnung und erster Tätigkeitsstätte (fahrtenWohnung)<br>Frage: Fahren Sie mit dem Dienstwagen zwischen Wohnung und erster Tätigkeitsstätte? | Beschäftigte Person | Ja/Nein | immer | Pflicht | Fahrten zwischen Wohnung und erster Tätigkeitsstätte: 0,03 % je Entfernungskilometer (§ 8 Abs. 2 Satz 3 EStG) |
| Fahrten von der Meldeanschrift (wohnungMeldeanschrift)<br>Frage: Fahren Sie von Ihrer Meldeanschrift aus? | Beschäftigte Person | Ja/Nein; vorbelegt: Ja | immer | Pflicht | Fahrten zwischen Wohnung und erster Tätigkeitsstätte: 0,03 % je Entfernungskilometer (§ 8 Abs. 2 Satz 3 EStG) |
| Anschrift der Wohnung, von der Sie fahren (wohnungAnschrift) | Beschäftigte Person | Text | erst wenn „Fahrten von der Meldeanschrift“ mit „Nein“ beantwortet ist<br>Warum: Fährt die Person nicht von ihrer Meldeanschrift, zählt die Wohnung, von der sie tatsächlich fährt, für die Entfernung. | Pflicht | Fahrten zwischen Wohnung und erster Tätigkeitsstätte: 0,03 % je Entfernungskilometer (§ 8 Abs. 2 Satz 3 EStG) |
| Entfernung Wohnung – erste Tätigkeitsstätte (entfernungKm)<br>Hilfe: Einfache Strecke, kürzeste Straßenverbindung, auf volle km abgerundet – auch wenn Sie einen längeren Weg fahren. | Beschäftigte Person | Zahl, ganzzahlig, in km | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist<br>Warum: Nur wer zur ersten Tätigkeitsstätte fährt, braucht die Entfernung für die 0,03 % je Kilometer (§ 8 Abs. 2 Satz 3 EStG). | Pflicht | Fahrten zwischen Wohnung und erster Tätigkeitsstätte: 0,03 % je Entfernungskilometer (§ 8 Abs. 2 Satz 3 EStG) |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Antrieb (Arbeitgeber; unabhängig)
  - Erstmals einer beschäftigten Person zur Privatnutzung überlassen am (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist
  - CO2-Emission (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
  - Elektrische Reichweite (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
- Privatnutzung erlaubt (Arbeitgeber; unabhängig)
  - Regelung des Nutzungsverbots (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Nein“ beantwortet ist
- Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt (Arbeitgeber; unabhängig)
  - Pauschalierung mit 15 % (Arbeitgeber; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
- Fahrten zwischen Wohnung und erster Tätigkeitsstätte (Beschäftigte Person; unabhängig)
  - Entfernung Wohnung – erste Tätigkeitsstätte (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist
- Fahrten von der Meldeanschrift (Beschäftigte Person; unabhängig)
  - Anschrift der Wohnung, von der Sie fahren (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten von der Meldeanschrift“ mit „Nein“ beantwortet ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Datenschutzhinweis

- Kenntnisnahme durch: Beschäftigte Person
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Ihr Arbeitgeber verarbeitet diese Angaben, um den geldwerten Vorteil aus der Überlassung des Dienstwagens zu ermitteln und die Lohnsteuer richtig einzubehalten. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Empfänger sind die lohnabrechnende Stelle, die Finanzverwaltung und die Sozialversicherung. Die Angaben werden als Beleg zum Lohnkonto aufbewahrt (§ 41 Abs. 1 EStG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

### Was Ihre Angaben bewirken

- Kenntnisnahme durch: Beschäftigte Person
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Darf das Fahrzeug privat genutzt werden, versteuern Sie jeden Monat einen Vorteil von 1 % des Listenpreises (bei Elektro- und Hybridfahrzeugen weniger). Für Fahrten zwischen Wohnung und erster Tätigkeitsstätte kommen 0,03 % je Entfernungskilometer hinzu. Melden Sie einen Umzug oder einen Wechsel der Tätigkeitsstätte sofort.

## Verknüpfung der Teile

- Arbeitgeber und Beschäftigte Person: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Familienname“ (Beschäftigte Person) und „Familienname der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Der Familienname weicht zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“
- „Vornamen“ (Beschäftigte Person) und „Vornamen der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“

## Zuordnung getrennt eingegangener Teile

- Familienname: „Familienname“ (Beschäftigte Person) = „Familienname der beschäftigten Person“ (Arbeitgeber)
- Vornamen: „Vornamen“ (Beschäftigte Person) = „Vornamen der beschäftigten Person“ (Arbeitgeber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). Für diese Angaben schreibt das Gesetz keine Form vor.
- Der Fragebogen deckt den Standard ab: 1-%-Regelung, Fahrten zwischen Wohnung und erster Tätigkeitsstätte mit 0,03 % je Entfernungskilometer und die Pauschalierung mit 15 %. Sonderfälle (Fahrtenbuch, Einzelbewertung, Zuzahlungen, Familienheimfahrten u. a.) klärt die lohnabrechnende Stelle gesondert.
- Dieser Fragebogen ist weder die Dienstwagenvereinbarung noch ein Nutzungsverbot; beides regelt der Arbeitsvertrag. Einen Nutzungsverzicht erklärt die Person auf Papier.
- Den geldwerten Vorteil berechnet die Lohnabrechnung, nicht die App. Bei einem Fahrzeugwechsel ist ein neuer Fragebogen nötig, bei geänderten Bedingungen eine neue Fassung.
