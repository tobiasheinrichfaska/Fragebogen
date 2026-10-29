# Feldkatalog: Personalfragebogen: Angaben für die Lohnabrechnung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | personalfragebogen, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Definition (SHA-256) | c32d3314acd9c38bbfbbd6f24a4bb4cd8513356030dbc6c81b3f48ee05a27998 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Beschäftigte Person (person) | Pflicht | immer | – | Ich versichere, dass meine Angaben richtig und vollständig sind. Ändert sich etwas, vor allem bei weiteren Beschäftigungen, teile ich das meinem Arbeitgeber unverzüglich mit. |
| Gesetzliche Vertretung (vertretung) | Pflicht | nur wenn die Person laut „Geburtsdatum“ am Tag ihrer Unterschrift unter 18 ist | aus „Vor- und Familienname der gesetzlichen Vertretung“ | Als gesetzliche Vertretung der minderjährigen Person schließe ich mich ihrer Erklärung an. |
| Arbeitgeber (arbeitgeber) | freiwillig | immer | – | Ich bestätige die Angaben des Arbeitgebers. |

## Felder

### 1. Persönliche Angaben

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Familienname (familienname)<br>Frage: Wie lautet Ihr Familienname?<br>Hilfe: So, wie er in Ihrem Ausweis steht. | Beschäftigte Person | Text | immer | Pflicht | Meldungen zur Sozialversicherung (§ 28a SGB IV); Stammdaten für die Lohnabrechnung |
| Vornamen (vorname)<br>Frage: Wie lauten Ihre Vornamen?<br>Hilfe: Alle Vornamen, wie in Ihrem Ausweis. | Beschäftigte Person | Text | immer | Pflicht | Meldungen zur Sozialversicherung (§ 28a SGB IV); Stammdaten für die Lohnabrechnung |
| Ist Ihr Geburtsname gleich Ihrem Familiennamen? (geburtsnameWieFamilienname)<br>Hilfe: Der Geburtsname ist der Familienname, den Sie bei Ihrer Geburt hatten. | Beschäftigte Person | Ja/Nein; vorbelegt: Ja | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geburtsname (geburtsname)<br>Frage: Wie lautet Ihr Geburtsname? | Beschäftigte Person | Text | erst wenn „Ist Ihr Geburtsname gleich Ihrem Familiennamen?“ mit „Nein“ beantwortet ist | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geburtsdatum (geburtsdatum)<br>Frage: Wann sind Sie geboren?<br>Hilfe: Zum Beispiel 17.05.1990. | Beschäftigte Person | Datum | immer | Pflicht | Abruf der Lohnsteuerabzugsmerkmale (§ 39e Abs. 4 EStG); Meldungen zur Sozialversicherung; Prüfung, ob die gesetzliche Vertretung mitunterschreiben muss |
| Geburtsort (geburtsort)<br>Frage: Wo sind Sie geboren?<br>Hilfe: Der Ort, wie er in Ihrem Ausweis steht. | Beschäftigte Person | Text | immer | Pflicht | Vergabe einer Versicherungsnummer, wenn sie fehlt; Stammdaten für die Lohnabrechnung |
| Geburtsland (geburtsland)<br>Frage: In welchem Land sind Sie geboren? | Beschäftigte Person | Text | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Geschlecht (geschlecht)<br>Frage: Welches Geschlecht ist bei Ihnen eingetragen?<br>Hilfe: So, wie es in Ihren amtlichen Papieren steht. | Beschäftigte Person | Auswahl: männlich, weiblich, divers, unbestimmt | immer | Pflicht | Vergabe einer Versicherungsnummer; Stammdaten für die Lohnabrechnung |
| Staatsangehörigkeit (staatsangehoerigkeit)<br>Frage: Welche Staatsangehörigkeit haben Sie?<br>Hilfe: Zum Beispiel „deutsch“. | Beschäftigte Person | Text | immer | Pflicht | Meldungen zur Sozialversicherung |
| Versicherungsnummer der Rentenversicherung (falls bekannt) (versicherungsnummer)<br>Frage: Wie lautet Ihre Versicherungsnummer der Rentenversicherung?<br>Hilfe: Sie hat 12 Stellen und steht auf Ihrem Sozialversicherungsausweis oder einer Meldebescheinigung zur Sozialversicherung. Nicht zur Hand? Dann „Weiß ich gerade nicht“ wählen. | Beschäftigte Person | Versicherungsnummer | immer | optional | Meldungen zur Sozialversicherung (§ 28a SGB IV) |

### 2. Anschrift

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Straße und Hausnummer (strasse)<br>Frage: Wie lauten Straße und Hausnummer Ihrer Anschrift? | Beschäftigte Person | Text | immer | Pflicht | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |
| Anschriftenzusatz (anschriftZusatz)<br>Frage: Gibt es einen Zusatz zur Anschrift?<br>Hilfe: Zum Beispiel „bei Müller“ oder „Hinterhaus“. Sonst leer lassen. | Beschäftigte Person | Text | immer | optional | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |
| Postleitzahl (postleitzahl)<br>Frage: Wie lautet Ihre Postleitzahl? | Beschäftigte Person | Text | immer | Pflicht | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |
| Wohnort (wohnort)<br>Frage: In welchem Ort wohnen Sie? | Beschäftigte Person | Text | immer | Pflicht | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |
| Liegt die Anschrift im Ausland? (anschriftAusland) | Beschäftigte Person | Ja/Nein; vorbelegt: Nein | immer | Pflicht | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |
| Staat (wohnstaat)<br>Frage: In welchem Staat liegt Ihre Anschrift? | Beschäftigte Person | Text | erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist | Pflicht | Stammdaten für die Lohnabrechnung; Vergabe einer Versicherungsnummer, wenn sie fehlt |

### 3. Kontakt

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Telefonnummer (telefon)<br>Frage: Unter welcher Telefonnummer sind Sie erreichbar?<br>Hilfe: Für Rückfragen zu Ihren Angaben. Eine Telefonnummer oder eine E-Mail-Adresse genügt. | Beschäftigte Person | Text | immer | Pflicht, wenn „E-Mail-Adresse“ leer ist | Rückfragen zu Ihren Angaben und zur Lohnabrechnung |
| E-Mail-Adresse (email)<br>Frage: Wie lautet Ihre E-Mail-Adresse?<br>Hilfe: Für Rückfragen zu Ihren Angaben. Haben Sie eine Telefonnummer angegeben, können Sie dieses Feld leer lassen. | Beschäftigte Person | Text | immer | Pflicht, wenn „Telefonnummer“ leer ist | Rückfragen zu Ihren Angaben und zur Lohnabrechnung |

### 4. Bankverbindung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| IBAN (iban)<br>Frage: Auf welches Konto soll Ihr Lohn oder Gehalt überwiesen werden?<br>Hilfe: Ihre IBAN steht zum Beispiel auf Ihrer Bankkarte, im Online-Banking oder auf einem Kontoauszug. | Beschäftigte Person | IBAN | immer | Pflicht | Überweisung des Arbeitsentgelts |
| Lautet das Konto auf Ihren Namen? (kontoinhaberSelbst) | Beschäftigte Person | Ja/Nein; vorbelegt: Ja | immer | Pflicht | Überweisung des Arbeitsentgelts |
| Name der Kontoinhaberin oder des Kontoinhabers (kontoinhaber)<br>Frage: Auf wessen Namen lautet das Konto?<br>Hilfe: Vor- und Familienname, wie bei der Bank hinterlegt. | Beschäftigte Person | Text | erst wenn „Lautet das Konto auf Ihren Namen?“ mit „Nein“ beantwortet ist | Pflicht | Überweisung des Arbeitsentgelts |

### 5. Weitere Beschäftigungen

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Haben Sie zurzeit noch eine andere Beschäftigung? (weitereBeschaeftigung)<br>Hilfe: Auch Minijobs und kurzfristige Beschäftigungen bei anderen Arbeitgebern zählen. Kommt später eine Beschäftigung hinzu, sagen Sie es Ihrem Arbeitgeber bitte unverzüglich. | Beschäftigte Person | Ja/Nein | immer | Pflicht | Versicherungsrechtliche Beurteilung bei mehreren Beschäftigungen, zum Beispiel Zusammenrechnung (§ 8 Abs. 2 SGB IV) und Beitragsbemessungsgrenzen (§ 22 Abs. 2 SGB IV) |
| Art der anderen Beschäftigungen (weitereArten)<br>Frage: Welcher Art sind Ihre anderen Beschäftigungen?<br>Hilfe: Kreuzen Sie alles an, was zutrifft. | Beschäftigte Person | Mehrfachauswahl: versicherungspflichtige Beschäftigung (kein Minijob), Minijob (geringfügig entlohnt), kurzfristige Beschäftigung | erst wenn „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantwortet ist | Pflicht | Versicherungsrechtliche Beurteilung bei mehreren Beschäftigungen |
| Angaben zu den anderen Beschäftigungen (weitereAngaben)<br>Frage: Bei welchen Arbeitgebern, seit wann und in welchem Umfang arbeiten Sie außerdem?<br>Hilfe: Bitte eine Zeile je Beschäftigung: Arbeitgeber, Beginn, Stunden pro Woche und Entgelt im Monat, zum Beispiel „Name des Arbeitgebers, seit 01.03.2026, 8 Stunden, 300 Euro“. | Beschäftigte Person | Text, mehrzeilig | erst wenn „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantwortet ist | Pflicht | Versicherungsrechtliche Beurteilung bei mehreren Beschäftigungen |

### 6. Steuer

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Steuerliche Identifikationsnummer (steuerId)<br>Frage: Wie lautet Ihre Steuer-Identifikationsnummer?<br>Hilfe: Sie hat 11 Ziffern und steht zum Beispiel auf Ihrer letzten Lohnsteuerbescheinigung, Ihrem Einkommensteuerbescheid oder dem Schreiben des Bundeszentralamts für Steuern, mit dem Sie die Nummer erhalten haben. | Beschäftigte Person | Steuer-Identifikationsnummer | immer | Pflicht | Abruf der elektronischen Lohnsteuerabzugsmerkmale (ELStAM) beim Bundeszentralamt für Steuern (§ 39e Abs. 4 EStG) |
| Erstes oder weiteres Dienstverhältnis (dienstverhaeltnis)<br>Frage: Welches Dienstverhältnis ist diese Beschäftigung für die Lohnsteuer?<br>Hilfe: Haben Sie nur diesen Arbeitgeber, ist es das erste. Arbeiten Sie gleichzeitig für mehrere Arbeitgeber, legen Sie fest, welches Arbeitsverhältnis das erste ist; für jedes weitere gilt Steuerklasse VI. | Beschäftigte Person | Auswahl: das erste (Hauptarbeitsverhältnis), ein weiteres (Steuerklasse VI) | immer | Pflicht | Abruf der Lohnsteuerabzugsmerkmale (§ 39e Abs. 4 EStG); Steuerklasse VI für ein weiteres Dienstverhältnis |
| Soll für dieses Dienstverhältnis ein Freibetrag abgerufen werden? (freibetragAbrufen)<br>Hilfe: Das geht nur, wenn das Finanzamt auf Ihren Antrag einen Freibetrag für ein weiteres Dienstverhältnis festgestellt hat. Sonst „Nein“. | Beschäftigte Person | Ja/Nein | erst wenn bei „Erstes oder weiteres Dienstverhältnis“ „ein weiteres (Steuerklasse VI)“ gewählt ist | Pflicht | Abruf der Lohnsteuerabzugsmerkmale (§ 39e Abs. 4 EStG) |
| Abzurufender Freibetrag (Jahresbetrag) (freibetragBetrag)<br>Frage: In welcher Höhe soll der Freibetrag abgerufen werden?<br>Hilfe: Jahresbetrag in Euro, höchstens der vom Finanzamt festgestellte Betrag. | Beschäftigte Person | Betrag in Euro | erst wenn „Soll für dieses Dienstverhältnis ein Freibetrag abgerufen werden?“ mit „Ja“ beantwortet ist | Pflicht | Abruf der Lohnsteuerabzugsmerkmale (§ 39e Abs. 4 EStG) |

### 7. Sozialversicherung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Krankenversicherung (krankenversicherung)<br>Frage: Wie sind Sie krankenversichert?<br>Hilfe: Sind Sie privat versichert, braucht Ihr Arbeitgeber zusätzlich eine Bescheinigung Ihrer Versicherung über die Beiträge, damit er den Beitragszuschuss zahlen kann. | Beschäftigte Person | Auswahl: gesetzlich (auch familienversichert), privat | immer | Pflicht | Anmeldung zur Sozialversicherung; Beitragszuschuss des Arbeitgebers bei privater Versicherung |
| Krankenkasse oder Versicherungsunternehmen (krankenkasse)<br>Frage: Bei welcher Krankenkasse oder Versicherung sind Sie versichert?<br>Hilfe: Gesetzlich versichert: die Krankenkasse, bei der Sie versichert sind oder Mitglied werden. Privat versichert: der Name des Versicherungsunternehmens. | Beschäftigte Person | Text | immer | Pflicht | Anmeldung bei der zuständigen Krankenkasse als Einzugsstelle (§ 28i SGB IV); Beitragszuschuss bei privater Versicherung |
| Letzte gesetzliche Krankenkasse (pkvLetzteKrankenkasse)<br>Frage: Bei welcher gesetzlichen Krankenkasse waren Sie zuletzt versichert?<br>Hilfe: Auch wenn Sie dort familienversichert waren. Waren Sie nie gesetzlich versichert, lassen Sie das Feld leer. | Beschäftigte Person | Text | erst wenn bei „Krankenversicherung“ „privat“ gewählt ist | optional | Bestimmung der Einzugsstelle für die Beiträge zur Renten- und Arbeitslosenversicherung (§ 28i SGB IV) |
| Status vor Beginn der Beschäftigung (statusBeginn)<br>Frage: Was trifft unmittelbar vor Beginn dieser Beschäftigung auf Sie zu?<br>Hilfe: Trifft mehreres zu, wählen Sie, was überwiegt. Schülerinnen, Schüler und Studierende legen ihrem Arbeitgeber bitte zusätzlich eine Schul- oder Immatrikulationsbescheinigung vor. | Beschäftigte Person | Auswahl: Schule gerade beendet, Schülerin oder Schüler, Studienbewerberin oder Studienbewerber, Studentin oder Student, Arbeitnehmerin oder Arbeitnehmer, Beamtin oder Beamter, selbständig, arbeitslos oder arbeitsuchend gemeldet, Freiwilligendienst oder Wehrdienst, Haushaltsführung oder Familienarbeit, Rentnerin oder Rentner, Sonstiges | immer | Pflicht | Versicherungsrechtliche Beurteilung der Beschäftigung, zum Beispiel bei Schülern, Studierenden oder Arbeitslosen |
| Status: Sonstiges (statusSonstiges)<br>Frage: Was haben Sie vor dieser Beschäftigung gemacht? | Beschäftigte Person | Text | erst wenn bei „Status vor Beginn der Beschäftigung“ „Sonstiges“ gewählt ist | Pflicht | Versicherungsrechtliche Beurteilung der Beschäftigung |
| Rentenbezug (rente)<br>Frage: Beziehen Sie eine Rente oder Pension?<br>Hilfe: Beziehen Sie mehrere, wählen Sie die zuerst genannte, die zutrifft. Legen Sie Ihrem Arbeitgeber dann bitte eine Kopie des Bescheids vor. | Beschäftigte Person | Auswahl: nein, Altersvollrente, Pension wegen Alters (Beamtenversorgung), Altersteilrente, Rente wegen voller Erwerbsminderung, Rente wegen teilweiser Erwerbsminderung, andere Rente (zum Beispiel Hinterbliebenenrente) | immer | Pflicht | Versicherungsrechtliche Beurteilung in der Renten- und Arbeitslosenversicherung |
| Haben Sie Kinder, die Ihr Arbeitgeber nicht digital abrufen kann? (kinderOhneAbruf)<br>Hilfe: Für den Beitrag zur Pflegeversicherung ruft Ihr Arbeitgeber Ihre Kinder digital beim Bundeszentralamt für Steuern ab. Das geht nur für Kinder, die dort steuerlich erfasst sind, in der Regel mit einer deutschen Steuer-Identifikationsnummer. Andere Kinder weisen Sie getrennt von diesem Fragebogen mit einer Urkunde nach, zum Beispiel mit einer Kopie der Geburtsurkunde. Haben Sie keine Kinder, wählen Sie „Nein“. | Beschäftigte Person | Ja/Nein | immer | Pflicht | Beitrag zur Pflegeversicherung nach Elterneigenschaft (§ 55a SGB XI): Hinweis, dass ein zusätzlicher Nachweis nötig ist |

### 8. Schul- und Berufsabschluss

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Höchster Schulabschluss (schulabschluss)<br>Frage: Welches ist Ihr höchster Schulabschluss?<br>Hilfe: Auch ein Abschluss aus dem Ausland zählt. Wählen Sie den Abschluss, der ihm am nächsten kommt. | Beschäftigte Person | Auswahl: ohne Schulabschluss, Haupt- oder Volksschulabschluss, Mittlere Reife oder gleichwertiger Abschluss, Abitur oder Fachabitur, kann ich nicht zuordnen | immer | Pflicht | Tätigkeitsschlüssel in den Meldungen zur Sozialversicherung (Schulbildung) |
| Höchster beruflicher Abschluss (berufsabschluss)<br>Frage: Welches ist Ihr höchster beruflicher Abschluss?<br>Hilfe: Auch ein Abschluss aus dem Ausland zählt. Wählen Sie den Abschluss, der ihm am nächsten kommt. | Beschäftigte Person | Auswahl: ohne beruflichen Abschluss, anerkannte Berufsausbildung, Meister-, Techniker- oder gleichwertiger Fachschulabschluss, Bachelor, Diplom/Magister/Master/Staatsexamen, Promotion, kann ich nicht zuordnen | immer | Pflicht | Tätigkeitsschlüssel in den Meldungen zur Sozialversicherung (Berufsausbildung) |

### 9. Freiwillige Angabe

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Schwerbehinderung oder Gleichstellung (schwerbehinderung)<br>Frage: Sind Sie schwerbehindert oder einem schwerbehinderten Menschen gleichgestellt?<br>Hilfe: Diese Angabe ist freiwillig; Sie können die Frage leer lassen. In den ersten sechs Monaten der Beschäftigung darf Ihr Arbeitgeber sie nur als freiwillige Angabe stellen. Trifft eines davon zu, legen Sie bitte eine Kopie des Ausweises oder des Gleichstellungsbescheids vor. | Beschäftigte Person | Auswahl: nein, schwerbehindert (Grad der Behinderung mindestens 50), einem schwerbehinderten Menschen gleichgestellt | immer | freiwillige Angabe | Rechte schwerbehinderter Menschen, etwa Zusatzurlaub, und Pflichten des Arbeitgebers nach dem SGB IX |

### 10. Gesetzliche Vertretung (nur bei Minderjährigen)

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Vor- und Familienname der gesetzlichen Vertretung (vertretungName)<br>Frage: Wie lautet Ihr Vor- und Familienname?<br>Hilfe: Sie unterschreiben als gesetzliche Vertretung der minderjährigen Person, zum Beispiel als Elternteil. | Gesetzliche Vertretung | Text | immer | Pflicht | Nachweis, wer für die minderjährige Person unterschreibt |

### 11. Angaben des Arbeitgebers

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Firma des Arbeitgebers (agFirma)<br>Frage: Wie lautet die Firma des Arbeitgebers?<br>Hilfe: So, wie sie auf dem Briefkopf oder im Handelsregister steht. | Arbeitgeber | Text; Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Kopfzeile des Fragebogens, Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer)<br>Frage: Wie lautet die Betriebsnummer?<br>Hilfe: 8 Ziffern, vergeben von der Bundesagentur für Arbeit. Sie steht auf den Meldungen zur Sozialversicherung; Ihre Lohnabrechnung kennt sie. | Arbeitgeber | Betriebsnummer (8 Ziffern); Stammdatum, kann auf dem Gerät gemerkt werden | immer | Pflicht | Meldungen zur Sozialversicherung (§ 28a SGB IV) |
| Familienname der beschäftigten Person (agFamilienname)<br>Frage: Wie lautet der Familienname der beschäftigten Person? | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Vornamen der beschäftigten Person (agVorname)<br>Frage: Wie lauten die Vornamen der beschäftigten Person? | Arbeitgeber | Text | immer | Pflicht | Zuordnung zu den Angaben der beschäftigten Person |
| Personalnummer (agPersonalnummer)<br>Frage: Welche Personalnummer hat die Person?<br>Hilfe: Nur, wenn schon eine vergeben ist. | Arbeitgeber | Text | immer | optional | Zuordnung in der Lohnabrechnung |
| Tag der Beschäftigungsaufnahme (agBeschaeftigungsbeginn)<br>Frage: An welchem Tag beginnt die Beschäftigung?<br>Hilfe: Der erste Arbeitstag. | Arbeitgeber | Datum | immer | Pflicht | Anmeldung zur Sozialversicherung (§ 28a SGB IV); Beginn der Lohnabrechnung |

### 12. Beschäftigung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ausgeübte Tätigkeit (agTaetigkeit)<br>Frage: Welche Tätigkeit übt die Person aus?<br>Hilfe: Möglichst genau, zum Beispiel „Kreditorenbuchhaltung“ statt „Büro“. Daraus wird der Tätigkeitsschlüssel für die Meldungen gebildet. | Arbeitgeber | Text | immer | Pflicht | Tätigkeitsschlüssel in den Meldungen zur Sozialversicherung; Zuordnung zur Gefahrtarifstelle der Unfallversicherung |
| Ist das Arbeitsverhältnis befristet? (agBefristet)<br>Hilfe: Auch eine Befristung bis zum Erreichen eines Zwecks zählt, etwa eine Vertretung. | Arbeitgeber | Ja/Nein | immer | Pflicht | Tätigkeitsschlüssel in den Meldungen zur Sozialversicherung (Vertragsform); Ende der Beschäftigung in der Lohnabrechnung |
| Befristet bis (agBefristetBis)<br>Frage: Bis wann ist das Arbeitsverhältnis befristet?<br>Hilfe: Bei einer Zweckbefristung das voraussichtliche Ende. Diese Angabe ersetzt nicht die schriftliche Befristungsabrede (§ 14 Abs. 4 TzBfG). | Arbeitgeber | Datum | erst wenn „Ist das Arbeitsverhältnis befristet?“ mit „Ja“ beantwortet ist | Pflicht | Ende der Beschäftigung in der Lohnabrechnung |
| Vollzeit oder Teilzeit (agArbeitszeitform)<br>Frage: Arbeitet die Person in Vollzeit oder in Teilzeit?<br>Hilfe: Vollzeit ist die übliche volle Arbeitszeit in Ihrem Betrieb. | Arbeitgeber | Auswahl: Vollzeit, Teilzeit | immer | Pflicht | Tätigkeitsschlüssel in den Meldungen zur Sozialversicherung (Vertragsform) |
| Wöchentliche Arbeitszeit in Stunden (agWochenstunden)<br>Frage: Wie viele Stunden pro Woche arbeitet die Person laut Vertrag?<br>Hilfe: Zum Beispiel 40 oder 19,5. Schwankt die Arbeitszeit, die vereinbarte durchschnittliche Stundenzahl. | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung, zum Beispiel Umrechnung zwischen Stunden- und Monatsentgelt |
| Arbeitstage pro Woche (agArbeitstage)<br>Frage: An wie vielen Tagen pro Woche arbeitet die Person?<br>Hilfe: Zum Beispiel 5. | Arbeitgeber | Text | immer | Pflicht | Lohnabrechnung, zum Beispiel Urlaubsentgelt und Entgeltfortzahlung |
| Urlaubsanspruch (Arbeitstage im Kalenderjahr) (agUrlaubstage)<br>Frage: Wie viele Urlaubstage stehen der Person im Kalenderjahr zu?<br>Hilfe: Laut Arbeitsvertrag, zum Beispiel 30. Beginnt die Beschäftigung im Lauf des Jahres, geben Sie den vollen Jahresanspruch an. | Arbeitgeber | Text | immer | optional | Urlaubsverwaltung und Urlaubsentgelt in der Lohnabrechnung |
| Kostenstelle (agKostenstelle)<br>Frage: Welcher Kostenstelle wird die Person zugeordnet?<br>Hilfe: Nur, wenn Sie mit Kostenstellen arbeiten. | Arbeitgeber | Text | immer | optional | Zuordnung der Lohnkosten in der Buchhaltung |

### 13. Vergütung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Art der Vergütung (agEntgeltArt)<br>Frage: Wie wird die Person bezahlt?<br>Hilfe: Eine Ausbildungsvergütung zählt als festes Monatsentgelt. | Arbeitgeber | Auswahl: Stundenlohn, festes Monatsentgelt | immer | Pflicht | Lohnabrechnung |
| Vergütung brutto (agEntgelt)<br>Frage: Wie hoch ist die vereinbarte Vergütung brutto?<br>Hilfe: Je nach Art der Vergütung pro Stunde oder pro Monat, zum Beispiel 15,50 oder 3.200,00. | Arbeitgeber | Betrag in Euro | immer | Pflicht | Lohnabrechnung |
| Weitere vereinbarte Bezüge (agWeitereBezuege)<br>Frage: Sind weitere Bezüge vereinbart?<br>Hilfe: Zum Beispiel Zulagen, Sachbezüge, Dienstwagen, Einmalzahlungen, vermögenswirksame Leistungen oder betriebliche Altersversorgung, jeweils mit Betrag. Sonst leer lassen. | Arbeitgeber | Text, mehrzeilig | immer | optional | Lohnabrechnung |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Ist Ihr Geburtsname gleich Ihrem Familiennamen? (Beschäftigte Person; unabhängig)
  - Geburtsname (Beschäftigte Person; Ebene 1) – erst wenn „Ist Ihr Geburtsname gleich Ihrem Familiennamen?“ mit „Nein“ beantwortet ist
- Liegt die Anschrift im Ausland? (Beschäftigte Person; unabhängig)
  - Staat (Beschäftigte Person; Ebene 1) – erst wenn „Liegt die Anschrift im Ausland?“ mit „Ja“ beantwortet ist
- Lautet das Konto auf Ihren Namen? (Beschäftigte Person; unabhängig)
  - Name der Kontoinhaberin oder des Kontoinhabers (Beschäftigte Person; Ebene 1) – erst wenn „Lautet das Konto auf Ihren Namen?“ mit „Nein“ beantwortet ist
- Haben Sie zurzeit noch eine andere Beschäftigung? (Beschäftigte Person; unabhängig)
  - Art der anderen Beschäftigungen (Beschäftigte Person; Ebene 1) – erst wenn „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantwortet ist
  - Angaben zu den anderen Beschäftigungen (Beschäftigte Person; Ebene 1) – erst wenn „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantwortet ist
- Erstes oder weiteres Dienstverhältnis (Beschäftigte Person; unabhängig)
  - Soll für dieses Dienstverhältnis ein Freibetrag abgerufen werden? (Beschäftigte Person; Ebene 1) – erst wenn bei „Erstes oder weiteres Dienstverhältnis“ „ein weiteres (Steuerklasse VI)“ gewählt ist
    - Abzurufender Freibetrag (Jahresbetrag) (Beschäftigte Person; Ebene 2) – erst wenn „Soll für dieses Dienstverhältnis ein Freibetrag abgerufen werden?“ mit „Ja“ beantwortet ist
- Krankenversicherung (Beschäftigte Person; unabhängig)
  - Letzte gesetzliche Krankenkasse (Beschäftigte Person; Ebene 1) – erst wenn bei „Krankenversicherung“ „privat“ gewählt ist
- Status vor Beginn der Beschäftigung (Beschäftigte Person; unabhängig)
  - Status: Sonstiges (Beschäftigte Person; Ebene 1) – erst wenn bei „Status vor Beginn der Beschäftigung“ „Sonstiges“ gewählt ist
- Ist das Arbeitsverhältnis befristet? (Arbeitgeber; unabhängig)
  - Befristet bis (Arbeitgeber; Ebene 1) – erst wenn „Ist das Arbeitsverhältnis befristet?“ mit „Ja“ beantwortet ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Datenschutzhinweis

- Kenntnisnahme durch: Beschäftigte Person
- Art: wird in der App gelesen und bestätigt
- Stand: 30.10.2026

> Ihr Arbeitgeber verarbeitet diese Angaben, um Ihr Arbeitsverhältnis durchzuführen und abzurechnen: für die Lohnabrechnung, für den Abruf Ihrer elektronischen Lohnsteuerabzugsmerkmale beim Bundeszentralamt für Steuern (§ 39e EStG) und für die Meldungen zur Sozialversicherung (§ 28a SGB IV). Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO.
>
> Die meisten Angaben müssen Sie machen (§ 28o Abs. 1 SGB IV, § 39e Abs. 4 EStG); fehlen sie, kann Ihr Arbeitgeber Sie nicht richtig anmelden und abrechnen. Ihre Bankverbindung und eine Telefonnummer oder E-Mail-Adresse braucht er für das Arbeitsverhältnis, um Ihnen das Entgelt zu überweisen und Sie bei Rückfragen zu erreichen. Die Angabe zu einer Schwerbehinderung oder Gleichstellung ist freiwillig. Machen Sie sie, verarbeitet Ihr Arbeitgeber sie, um Ihre Rechte als schwerbehinderter Mensch zu wahren und seine Pflichten nach dem SGB IX zu erfüllen (Art. 9 Abs. 2 Buchst. b DSGVO).
>
> Angaben zu Tätigkeit, Arbeitszeit und Vergütung trägt Ihr Arbeitgeber im selben Fragebogen ein.
>
> Verantwortlich ist Ihr Arbeitgeber. Seine Kontaktdaten und gegebenenfalls die seines Datenschutzbeauftragten stehen in der Datenschutzinformation für Beschäftigte, die Sie von Ihrem Arbeitgeber erhalten. Empfänger sind die vom Arbeitgeber beauftragte lohnabrechnende Stelle, die Finanzverwaltung, die zuständige Krankenkasse als Einzugsstelle und die übrigen Träger der Sozialversicherung sowie die Banken, über die Ihr Entgelt überwiesen wird.
>
> Die Angaben werden aufbewahrt, solange gesetzliche Fristen es verlangen: Entgeltunterlagen bis zum Ablauf des Kalenderjahres nach der letzten Betriebsprüfung (§ 28f Abs. 1 SGB IV), das Lohnkonto bis zum Ablauf des sechsten Kalenderjahres nach der letzten Lohnzahlung (§ 41 Abs. 1 Satz 9 EStG).
>
> Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung nach Art. 15 bis 18 DSGVO und das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.
>
> Diese App speichert und versendet nichts. Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben.

## Verknüpfung der Teile

- Beschäftigte Person und Arbeitgeber: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Familienname“ (Beschäftigte Person) und „Familienname der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Der Familienname weicht zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“
- „Vornamen“ (Beschäftigte Person) und „Vornamen der beschäftigten Person“ (Arbeitgeber) sollen übereinstimmen. Sonst: „Die Vornamen weichen zwischen den Angaben der beschäftigten Person und des Arbeitgebers ab.“

## Zuordnung getrennt eingegangener Teile

- Familienname: „Familienname“ (Beschäftigte Person) = „Familienname der beschäftigten Person“ (Arbeitgeber)
- Vornamen: „Vornamen“ (Beschäftigte Person) = „Vornamen der beschäftigten Person“ (Arbeitgeber)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). Für die Angaben im Personalfragebogen schreibt das Gesetz keine besondere Form vor; die beschäftigte Person muss sie ihrem Arbeitgeber nur mitteilen (§ 39e Abs. 4 EStG, § 28o Abs. 1 SGB IV).
- Hat der Betrieb einen Betriebsrat, bedarf der Personalfragebogen seiner Zustimmung (§ 94 Abs. 1 BetrVG).
- Die Angabe „Befristet bis“ ist nicht die Befristungsabrede. Eine Befristung bedarf der Schriftform (§ 14 Abs. 4 TzBfG) und wird gesondert vereinbart.
- Der Fragebogen ist nicht der Nachweis der wesentlichen Vertragsbedingungen nach dem Nachweisgesetz.
- Nach einer Schwerbehinderung oder Gleichstellung fragt der Fragebogen nur als freiwillige Angabe: In den ersten sechs Monaten des Arbeitsverhältnisses ist die Frage nur so zulässig (BAG, 6 AZR 553/10).
- Nach der Konfession fragt der Fragebogen nicht: Das Kirchensteuermerkmal erhält der Arbeitgeber mit den elektronischen Lohnsteuerabzugsmerkmalen (ELStAM).
- Die Elterneigenschaft für den Beitrag zur Pflegeversicherung ruft der Arbeitgeber seit 01.07.2025 digital beim Bundeszentralamt für Steuern ab (§ 55a SGB XI). Kinder, die dort nicht erfasst sind, weist die beschäftigte Person mit einer Urkundenkopie nach; ein Vermerk „hat vorgelegen“ genügt nicht. Der Fragebogen fragt deshalb nur, ob es solche Kinder gibt.
