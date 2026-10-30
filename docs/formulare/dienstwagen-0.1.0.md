# Feldkatalog: Dienstwagen: Überlassung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | dienstwagen, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | 08b9700f6132d44aeb6edd53ee3d87e79cd2fd5a70c522585e7dbb75ff34fccc |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Arbeitgeber (arbeitgeber) | Pflicht | immer | – | Ich bestätige die Angaben zu Fahrzeug, Überlassung und Bewertung. |
| Beschäftigte Person (person) | Pflicht | immer | – | Ich versichere, dass meine Angaben richtig sind. Einen Umzug, einen Wechsel der Tätigkeitsstätte und Änderungen bei Familienheimfahrten teile ich meinem Arbeitgeber unverzüglich mit. |

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
| Fahrzeug-Identifizierungsnummer (FIN) (agFin)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld E. | Arbeitgeber | Text | immer | optional | Eindeutige Zuordnung |
| Marke und Modell (agFahrzeug) | Arbeitgeber | Text | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Datum der Erstzulassung (agErstzulassung)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld B. | Arbeitgeber | Datum | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Fahrzeug des Arbeitgebers (agFahrzeugHerkunft)<br>Frage: Wie hat der Arbeitgeber das Fahrzeug?<br>Hilfe: Bei Leasing muss der Arbeitgeber Leasingnehmer sein. | Arbeitgeber | Auswahl: gekauft, geleast, gemietet | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Kauf- oder Leasingbeginn beim Arbeitgeber (agAnschaffung) | Arbeitgeber | Datum | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Inländischer Listenpreis bei Erstzulassung (agListenpreis)<br>Hilfe: Unverbindliche Preisempfehlung des Herstellers einschließlich Umsatzsteuer, ohne Sonderausstattung – nicht der gezahlte Preis, auch bei Gebraucht- oder Leasingfahrzeugen. Rabatte zählen nicht. | Arbeitgeber | Betrag in Euro | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Werkseitige Sonderausstattung (agSonderausstattung)<br>Hilfe: Einschließlich Umsatzsteuer; 0, wenn keine. Nicht: Freisprecheinrichtung, zweiter Reifensatz, später eingebaute Teile. | Arbeitgeber | Betrag in Euro | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Reimportfahrzeug (agReimport) | Arbeitgeber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Ermittlung des inländischen Listenpreises (agReimportListenpreis)<br>Hilfe: Zum Beispiel: vergleichbares deutsches Modell, Ausstattung angepasst. | Arbeitgeber | Text | erst wenn „Reimportfahrzeug“ mit „Ja“ beantwortet ist | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Antrieb (agAntrieb)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld 10. | Arbeitgeber | Auswahl: Verbrennungsmotor, Hybrid ohne Stecker, Plug-in-Hybrid (extern aufladbar), reines Elektrofahrzeug, Brennstoffzelle (Wasserstoff) | immer | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Erstmals einer beschäftigten Person zur Privatnutzung überlassen am (agErstUeberlassung) | Arbeitgeber | Datum | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist | Pflicht | Maßgeblicher Zeitpunkt für die Begünstigung von Elektro- und Hybridfahrzeugen |
| CO2-Emission (agCo2)<br>Hilfe: Übereinstimmungsbescheinigung (CoC) Ziffer 49.4, gewichteter kombinierter Wert. | Arbeitgeber | Zahl, ganzzahlig, in g/km | erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Elektrische Reichweite (agReichweite)<br>Hilfe: CoC Ziffer 49.5.2, elektrische Reichweite innerorts. | Arbeitgeber | Zahl, ganzzahlig, in km | erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Batteriekapazität (agBatterie)<br>Hilfe: Zulassungsbescheinigung Teil I, Feld 22. Nur nötig, wenn das Fahrzeug vor 2019 erstmals überlassen wurde oder die Voraussetzungen nicht erfüllt. | Arbeitgeber | Zahl, 1 Nachkommastellen, in kWh | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist | optional | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |
| Batterie gesondert gemietet oder geleast (agBatterieGemietet) | Arbeitgeber | Ja/Nein | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist | optional | Bemessungsgrundlage (§ 6 Abs. 1 Nr. 4 Satz 2 EStG, R 8.1 Abs. 9 Nr. 1 Satz 6 LStR) |

### 3. Überlassung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Überlassen ab (agUeberlassenAb) | Arbeitgeber | Datum | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Überlassen bis (agUeberlassenBis)<br>Hilfe: Nur wenn bekannt oder bei Rückgabe. | Arbeitgeber | Datum | immer | optional | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Art der Überlassung (agUeberlassungsart) | Arbeitgeber | Auswahl: dauerhaft, gelegentlich aus besonderem Anlass (höchstens 5 Kalendertage im Monat) | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Privatnutzung erlaubt (agPrivatnutzung)<br>Frage: Darf die Person das Fahrzeug privat nutzen? | Arbeitgeber | Ja/Nein | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Regelung des Nutzungsverbots (agNutzungsverbot)<br>Hilfe: Das Dokument gehört zum Lohnkonto. Ein Verzicht der Person wird auf Papier erklärt. | Arbeitgeber | Auswahl: Arbeitsvertrag, Dienstwagenvereinbarung, Betriebsvereinbarung, schriftlicher Verzicht der Person | erst wenn „Privatnutzung erlaubt“ mit „Nein“ beantwortet ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt (agFahrtenWohnung)<br>Frage: Darf die Person mit dem Fahrzeug zwischen Wohnung und erster Tätigkeitsstätte fahren? | Arbeitgeber | Ja/Nein | immer | Pflicht | § 8 Abs. 2 Satz 3 EStG |
| Anschrift der ersten Tätigkeitsstätte (agTaetigkeitsstaette) | Arbeitgeber | Text | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist | Pflicht | Prüfung der Entfernung (§ 9 Abs. 4 EStG) |
| Arbeitstage vor Ort pro Woche (agTageVorOrt) | Arbeitgeber | Auswahl: 1, 2, 3, 4, 5, nicht festgelegt | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist | Pflicht | Tage bei der Pauschalierung (BMF vom 18.11.2021) |
| Pauschalierung mit 15 % (agPauschal15)<br>Frage: Sollen diese Fahrten, soweit zulässig, mit 15 % pauschal versteuert werden? | Arbeitgeber | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist | Pflicht | § 40 Abs. 2 Satz 2 Nr. 1a EStG; beitragsfrei nach § 1 SvEV |
| Einzelbewertung vertraglich ausgeschlossen (agEinzelbewertungAusgeschlossen)<br>Hilfe: Sonst muss der Arbeitgeber sie auf Wunsch der Person anwenden. | Arbeitgeber | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 03.03.2022 Rn. 13 |
| Familienheimfahrten erlaubt (agFamilienheimfahrten)<br>Hilfe: Nur bei doppelter Haushaltsführung. | Arbeitgeber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | § 8 Abs. 2 Satz 5 EStG |
| Private Nutzer (agNutzerAnzahl)<br>Frage: Wer darf das Fahrzeug privat nutzen? | Arbeitgeber | Auswahl: nur diese Person, mehrere Personen | erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Anzahl der Nutzungsberechtigten (agNutzerZahl) | Arbeitgeber | Zahl, ganzzahlig | erst wenn bei „Private Nutzer“ „mehrere Personen“ gewählt ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Weiteres Dienstfahrzeug (agWeiteresFahrzeug)<br>Frage: Steht der Person gleichzeitig ein weiteres Dienstfahrzeug zur Verfügung? | Arbeitgeber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Fahrer gestellt (agFahrer)<br>Frage: Stellt der Arbeitgeber einen Fahrer? | Arbeitgeber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | R 8.1 Abs. 10 LStR |
| Fahrer für (agFahrerFahrten) | Arbeitgeber | Mehrfachauswahl: Privatfahrten, Wohnung – erste Tätigkeitsstätte, Familienheimfahrten | erst wenn „Fahrer gestellt“ mit „Ja“ beantwortet ist | Pflicht | R 8.1 Abs. 10 LStR |
| Maut, Vignetten oder Fähren für Privatfahrten übernommen (agMaut) | Arbeitgeber | Ja/Nein | erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist | Pflicht | Eigener geldwerter Vorteil |
| Überlassung im Rahmen einer Gehaltsumwandlung (agGehaltsumwandlung) | Arbeitgeber | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |

### 4. Bewertungsmethode

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Methode gilt ab Kalenderjahr (agMethodeAbJahr)<br>Hilfe: Zum Beispiel 2027. Die Methode gilt jeweils für ein ganzes Kalenderjahr. | Arbeitgeber | Text | erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist | Pflicht | R 8.1 Abs. 9 Nr. 3 LStR |
| Methode (agMethode)<br>Hilfe: In Abstimmung mit der Person festlegen; kein Wechsel im Jahr. | Arbeitgeber | Auswahl: pauschal (1-%-Regelung), Fahrtenbuch | erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist | Pflicht | R 8.1 Abs. 9 LStR |
| Fahrtenbuch (agFahrtenbuchArt)<br>Hilfe: Elektronisch nur, wenn spätere Änderungen ausgeschlossen oder protokolliert sind. | Arbeitgeber | Auswahl: elektronisch, handschriftlich | erst wenn bei „Methode“ „Fahrtenbuch“ gewählt ist | Pflicht | R 8.1 Abs. 9 Nr. 2 LStR |
| Bewertung der Fahrten Wohnung – erste Tätigkeitsstätte (agMethodeWohnung)<br>Hilfe: Einzelbewertung nur mit monatlicher, datumsgenauer Erklärung der Person; höchstens 180 Fahrten im Jahr. | Arbeitgeber | Auswahl: 0,03 % je Entfernungskilometer im Monat, Einzelbewertung 0,002 % je Fahrt | erst wenn bei „Methode“ „pauschal (1-%-Regelung)“ gewählt ist und „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 03.03.2022 Rn. 13 |
| Kostendeckelung prüfen (agKostendeckelung)<br>Hilfe: Wenn die tatsächlichen Gesamtkosten niedriger sein könnten als der pauschale Wert. | Arbeitgeber | Ja/Nein | erst wenn bei „Methode“ „pauschal (1-%-Regelung)“ gewählt ist | optional | BMF vom 03.03.2022 Rn. 8 |

### 5. Zahlungen der beschäftigten Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Nutzungsentgelt der Person (agNutzungsentgelt)<br>Hilfe: Ein Gehaltsverzicht (Gehaltsumwandlung) zählt nicht. | Arbeitgeber | Mehrfachauswahl: nichts, feste Monatspauschale, Betrag je privat gefahrenem km, übernommene Leasingraten, einzelne Fahrzeugkosten (zum Beispiel Kraftstoff), Einmalzahlung zu Anschaffung oder Leasingsonderzahlung | erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist | Pflicht | Nutzungsentgelt mindert den Vorteil (BMF vom 03.03.2022 Rn. 52–57) |
| Monatspauschale (agEntgeltPauschale) | Arbeitgeber | Betrag in Euro | erst wenn bei „Nutzungsentgelt der Person“ „feste Monatspauschale“ angekreuzt ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Betrag je privat gefahrenem km (agEntgeltJeKm)<br>Hilfe: Die Person meldet dann monatlich ihre privat gefahrenen km. | Arbeitgeber | Betrag in Euro | erst wenn bei „Nutzungsentgelt der Person“ „Betrag je privat gefahrenem km“ angekreuzt ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Übernommene Leasingrate je Monat (agEntgeltLeasing) | Arbeitgeber | Betrag in Euro | erst wenn bei „Nutzungsentgelt der Person“ „übernommene Leasingraten“ angekreuzt ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Kosten, die die Person selbst trägt (agKostenPerson)<br>Hilfe: Die Person erklärt die Kosten jährlich mit Belegen. | Arbeitgeber | Mehrfachauswahl: Kraftstoff oder Strom, Wartung und Reparatur, Versicherung, Wagenpflege, Sonstiges | erst wenn bei „Nutzungsentgelt der Person“ „einzelne Fahrzeugkosten (zum Beispiel Kraftstoff)“ angekreuzt ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Einmalzahlung: Betrag (agEinmalBetrag) | Arbeitgeber | Betrag in Euro | erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist | Pflicht | R 8.1 Abs. 9 Nr. 4a LStR |
| Einmalzahlung: gezahlt am (agEinmalDatum) | Arbeitgeber | Datum | erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist | Pflicht | R 8.1 Abs. 9 Nr. 4a LStR |
| Vereinbarter Zeitraum der Einmalzahlung (agEinmalZeitraum)<br>Hilfe: Leer lassen, wenn kein Zeitraum vereinbart ist. | Arbeitgeber | Zahl, ganzzahlig, in Monate | erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist | optional | BMF vom 03.03.2022 Rn. 65 f. |

### 6. Laden

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Laden im Betrieb möglich (agLadenBetrieb) | Arbeitgeber | Ja/Nein | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | § 3 Nr. 46 EStG |
| Erstattung des Ladestroms zu Hause (agHeimladenErstattung)<br>Hilfe: Ab 2026 nur mit eigenem Zähler und Nachweis des Preises. | Arbeitgeber | Ja/Nein | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | § 3 Nr. 50 EStG; BMF vom 11.11.2025 |
| Abrechnung des Heimladestroms im Kalenderjahr (agHeimladenAbrechnung)<br>Hilfe: Für ein ganzes Kalenderjahr einheitlich. 2026: 34 Cent je kWh als Pauschale. | Arbeitgeber | Auswahl: Strompreis laut Stromvertrag, Strompreispauschale | erst wenn „Erstattung des Ladestroms zu Hause“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 11.11.2025 Rn. 30 |
| Erstattung öffentlichen Ladens gegen Beleg (agOeffentlichLaden) | Arbeitgeber | Ja/Nein | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | BMF vom 11.11.2025 Rn. 31 |
| Ladevorrichtung zu Hause (agWallbox) | Arbeitgeber | Auswahl: keine, vom Arbeitgeber überlassen, an die Person übereignet, Zuschuss zur eigenen Wallbox | erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist | Pflicht | § 3 Nr. 46, § 40 Abs. 2 EStG |

### 7. Angaben der beschäftigten Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Familienname (familienname)<br>Frage: Wie lautet Ihr Familienname? | Beschäftigte Person | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe des Arbeitgebers |
| Vornamen (vorname)<br>Frage: Wie lauten Ihre Vornamen? | Beschäftigte Person | Text | immer | Pflicht | Zuordnung; Abgleich mit der Angabe des Arbeitgebers |
| Fahrten zwischen Wohnung und erster Tätigkeitsstätte (fahrtenWohnung)<br>Frage: Fahren Sie mit dem Dienstwagen zwischen Wohnung und erster Tätigkeitsstätte? | Beschäftigte Person | Ja/Nein | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Fahrten von der Meldeanschrift (wohnungMeldeanschrift)<br>Frage: Fahren Sie von Ihrer Meldeanschrift aus? | Beschäftigte Person | Ja/Nein; vorbelegt: Ja | immer | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Anschrift der Wohnung, von der Sie fahren (wohnungAnschrift) | Beschäftigte Person | Text | erst wenn „Fahrten von der Meldeanschrift“ mit „Nein“ beantwortet ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Entfernung Wohnung – erste Tätigkeitsstätte (entfernungKm)<br>Hilfe: Einfache Strecke, kürzeste Straßenverbindung, auf volle km abgerundet – auch wenn Sie einen längeren Weg fahren. | Beschäftigte Person | Zahl, ganzzahlig, in km | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist | Pflicht | 0,03 % bzw. 0,002 % je Entfernungskilometer |
| Fahrten von mehreren Wohnungen (mehrereWohnungen)<br>Frage: Fahren Sie abwechselnd von mehreren Wohnungen? | Beschäftigte Person | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Entfernung von der weiteren Wohnung (entfernungWeitere) | Beschäftigte Person | Zahl, ganzzahlig, in km | erst wenn „Fahrten von mehreren Wohnungen“ mit „Ja“ beantwortet ist | Pflicht | Bewertung des geldwerten Vorteils durch die Lohnabrechnung (§ 8 Abs. 2 EStG, BMF vom 03.03.2022) |
| Nur eine Teilstrecke mit dem Dienstwagen (teilstrecke)<br>Frage: Fahren Sie nur eine Teilstrecke mit dem Dienstwagen und den Rest nachweislich mit Bus oder Bahn?<br>Hilfe: Den Nachweis, zum Beispiel eine Kopie der Jahreskarte, geben Sie bitte Ihrem Arbeitgeber. | Beschäftigte Person | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 03.03.2022 Rn. 22 f. |
| Teilstrecke mit dem Dienstwagen (teilstreckeKm) | Beschäftigte Person | Zahl, ganzzahlig, in km | erst wenn „Nur eine Teilstrecke mit dem Dienstwagen“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 03.03.2022 Rn. 22 f. |
| Antrag auf Einzelbewertung (einzelbewertungAntrag)<br>Frage: Beantragen Sie die Einzelbewertung Ihrer Fahrten?<br>Hilfe: Lohnt sich meist, wenn Sie seltener als an 15 Tagen im Monat fahren. Dann geben Sie jeden Monat an, an welchen Tagen (mit Datum) Sie gefahren sind; höchstens 180 Fahrten im Jahr. | Beschäftigte Person | Ja/Nein | erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 03.03.2022 Rn. 13 |
| Monatliche Angabe der Fahrtage (einzelbewertungZusage)<br>Frage: Werden Sie jeden Monat datumsgenau und fahrzeugbezogen angeben, an welchen Tagen Sie gefahren sind?<br>Hilfe: Ohne diese Angaben gilt die 0,03-%-Regel. | Beschäftigte Person | Ja/Nein | erst wenn „Antrag auf Einzelbewertung“ mit „Ja“ beantwortet ist | Pflicht | Voraussetzung der Einzelbewertung |
| Doppelter Haushalt (doppelterHaushalt)<br>Frage: Führen Sie einen doppelten Haushalt? | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | § 8 Abs. 2 Satz 5 EStG |
| Entfernung Beschäftigungsort – eigener Hausstand (entfernungHausstand) | Beschäftigte Person | Zahl, ganzzahlig, in km | erst wenn „Doppelter Haushalt“ mit „Ja“ beantwortet ist | Pflicht | 0,002 % je km ab der zweiten Heimfahrt pro Woche |
| Fahrer (fahrerVorhanden)<br>Frage: Steht Ihnen ein Fahrer zur Verfügung? | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | R 8.1 Abs. 10 LStR |
| Wer fährt bei Privatfahrten? (fahrerPrivat) | Beschäftigte Person | Auswahl: überwiegend der Fahrer, häufig ich selbst, weit überwiegend oder nur ich selbst | erst wenn „Fahrer“ mit „Ja“ beantwortet ist | Pflicht | R 8.1 Abs. 10 LStR |
| Laden zu Hause (ladenZuhause)<br>Frage: Laden Sie das Fahrzeug zu Hause? | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | BMF vom 11.11.2025 |
| Eigener Zähler für den Ladestrom (ladezaehler)<br>Frage: Haben Sie zu Hause einen eigenen Zähler für den Ladestrom?<br>Hilfe: Wallbox-Zähler oder fahrzeuginterner Zähler. Ohne Zähler ist ab 2026 keine steuerfreie Erstattung möglich. | Beschäftigte Person | Ja/Nein | erst wenn „Laden zu Hause“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 11.11.2025 Rn. 27 |
| Stromtarif (stromtarif)<br>Hilfe: Bei Abrechnung nach Vertrag legen Sie den Stromvertrag oder die Rechnung vor; ein Eigenbeleg genügt nicht. | Beschäftigte Person | Auswahl: fester Preis, dynamischer Tarif, mit eigener Photovoltaikanlage | erst wenn „Eigener Zähler für den Ladestrom“ mit „Ja“ beantwortet ist | Pflicht | BMF vom 11.11.2025 Rn. 28 f. |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Reimportfahrzeug (Arbeitgeber; unabhängig)
  - Ermittlung des inländischen Listenpreises (Arbeitgeber; Ebene 1) – erst wenn „Reimportfahrzeug“ mit „Ja“ beantwortet ist
- Antrieb (Arbeitgeber; unabhängig)
  - Erstmals einer beschäftigten Person zur Privatnutzung überlassen am (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist
  - CO2-Emission (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
  - Elektrische Reichweite (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
  - Batteriekapazität (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist
  - Batterie gesondert gemietet oder geleast (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ oder „Brennstoffzelle (Wasserstoff)“ gewählt ist
  - Laden im Betrieb möglich (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
  - Erstattung des Ladestroms zu Hause (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
    - Abrechnung des Heimladestroms im Kalenderjahr (Arbeitgeber; Ebene 2) – erst wenn „Erstattung des Ladestroms zu Hause“ mit „Ja“ beantwortet ist
  - Erstattung öffentlichen Ladens gegen Beleg (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
  - Ladevorrichtung zu Hause (Arbeitgeber; Ebene 1) – erst wenn bei „Antrieb“ „reines Elektrofahrzeug“ oder „Plug-in-Hybrid (extern aufladbar)“ gewählt ist
- Privatnutzung erlaubt (Arbeitgeber; unabhängig)
  - Regelung des Nutzungsverbots (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Nein“ beantwortet ist
  - Private Nutzer (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist
    - Anzahl der Nutzungsberechtigten (Arbeitgeber; Ebene 2) – erst wenn bei „Private Nutzer“ „mehrere Personen“ gewählt ist
  - Maut, Vignetten oder Fähren für Privatfahrten übernommen (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist
  - Methode gilt ab Kalenderjahr (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist
  - Methode (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist
    - Fahrtenbuch (Arbeitgeber; Ebene 2) – erst wenn bei „Methode“ „Fahrtenbuch“ gewählt ist
    - Bewertung der Fahrten Wohnung – erste Tätigkeitsstätte (Arbeitgeber; Ebene 2) – erst wenn bei „Methode“ „pauschal (1-%-Regelung)“ gewählt ist und „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
    - Kostendeckelung prüfen (Arbeitgeber; Ebene 2) – erst wenn bei „Methode“ „pauschal (1-%-Regelung)“ gewählt ist
  - Nutzungsentgelt der Person (Arbeitgeber; Ebene 1) – erst wenn „Privatnutzung erlaubt“ mit „Ja“ beantwortet ist
    - Monatspauschale (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „feste Monatspauschale“ angekreuzt ist
    - Betrag je privat gefahrenem km (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „Betrag je privat gefahrenem km“ angekreuzt ist
    - Übernommene Leasingrate je Monat (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „übernommene Leasingraten“ angekreuzt ist
    - Kosten, die die Person selbst trägt (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „einzelne Fahrzeugkosten (zum Beispiel Kraftstoff)“ angekreuzt ist
    - Einmalzahlung: Betrag (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist
    - Einmalzahlung: gezahlt am (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist
    - Vereinbarter Zeitraum der Einmalzahlung (Arbeitgeber; Ebene 2) – erst wenn bei „Nutzungsentgelt der Person“ „Einmalzahlung zu Anschaffung oder Leasingsonderzahlung“ angekreuzt ist
- Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt (Arbeitgeber; unabhängig)
  - Anschrift der ersten Tätigkeitsstätte (Arbeitgeber; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
  - Arbeitstage vor Ort pro Woche (Arbeitgeber; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
  - Pauschalierung mit 15 % (Arbeitgeber; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
  - Einzelbewertung vertraglich ausgeschlossen (Arbeitgeber; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte erlaubt“ mit „Ja“ beantwortet ist
- Fahrer gestellt (Arbeitgeber; unabhängig)
  - Fahrer für (Arbeitgeber; Ebene 1) – erst wenn „Fahrer gestellt“ mit „Ja“ beantwortet ist
- Fahrten zwischen Wohnung und erster Tätigkeitsstätte (Beschäftigte Person; unabhängig)
  - Entfernung Wohnung – erste Tätigkeitsstätte (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist
  - Fahrten von mehreren Wohnungen (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist
    - Entfernung von der weiteren Wohnung (Beschäftigte Person; Ebene 2) – erst wenn „Fahrten von mehreren Wohnungen“ mit „Ja“ beantwortet ist
  - Nur eine Teilstrecke mit dem Dienstwagen (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist
    - Teilstrecke mit dem Dienstwagen (Beschäftigte Person; Ebene 2) – erst wenn „Nur eine Teilstrecke mit dem Dienstwagen“ mit „Ja“ beantwortet ist
  - Antrag auf Einzelbewertung (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten zwischen Wohnung und erster Tätigkeitsstätte“ mit „Ja“ beantwortet ist
    - Monatliche Angabe der Fahrtage (Beschäftigte Person; Ebene 2) – erst wenn „Antrag auf Einzelbewertung“ mit „Ja“ beantwortet ist
- Fahrten von der Meldeanschrift (Beschäftigte Person; unabhängig)
  - Anschrift der Wohnung, von der Sie fahren (Beschäftigte Person; Ebene 1) – erst wenn „Fahrten von der Meldeanschrift“ mit „Nein“ beantwortet ist
- Doppelter Haushalt (Beschäftigte Person; unabhängig)
  - Entfernung Beschäftigungsort – eigener Hausstand (Beschäftigte Person; Ebene 1) – erst wenn „Doppelter Haushalt“ mit „Ja“ beantwortet ist
- Fahrer (Beschäftigte Person; unabhängig)
  - Wer fährt bei Privatfahrten? (Beschäftigte Person; Ebene 1) – erst wenn „Fahrer“ mit „Ja“ beantwortet ist
- Laden zu Hause (Beschäftigte Person; unabhängig)
  - Eigener Zähler für den Ladestrom (Beschäftigte Person; Ebene 1) – erst wenn „Laden zu Hause“ mit „Ja“ beantwortet ist
    - Stromtarif (Beschäftigte Person; Ebene 2) – erst wenn „Eigener Zähler für den Ladestrom“ mit „Ja“ beantwortet ist

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

> Darf das Fahrzeug privat genutzt werden, versteuern Sie jeden Monat einen Vorteil, meist 1 % des Listenpreises (bei Elektro- und Hybridfahrzeugen weniger). Für Fahrten zwischen Wohnung und erster Tätigkeitsstätte kommen 0,03 % je Entfernungskilometer hinzu, auf Antrag stattdessen 0,002 % je tatsächlicher Fahrt. Melden Sie einen Umzug, einen Wechsel der Tätigkeitsstätte und Änderungen bei Familienheimfahrten sofort. Ist ein Fahrtenbuch vereinbart, führen Sie es laufend, vollständig und zeitnah und heben Sie Belege für selbst getragene Kosten auf.

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
- Die Finanzverwaltung verlangt einzelne Erklärungen „schriftlich“ (monatliche Fahrtage bei Einzelbewertung, Nutzungsverzicht, jährliche Kostenerklärung). Ob dafür eine einfache elektronische Signatur genügt, ist nicht ausdrücklich geregelt; einen Nutzungsverzicht erklärt die Person auf Papier.
- Dieser Fragebogen ist weder die Dienstwagenvereinbarung noch ein Nutzungsverbot; beides regelt der Arbeitsvertrag.
- Den geldwerten Vorteil berechnet die Lohnabrechnung, nicht die App. Bei einem Fahrzeugwechsel ist ein neuer Fragebogen nötig, bei geänderten Bedingungen eine neue Fassung.
