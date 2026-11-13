# Feldkatalog: Zustimmung zur elektronischen Übermittlung der Steuererklärungen

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | steuerfreigabe, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Datum des Anschreibens“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 13.11.2026 um 12:58 |
| Definition (SHA-256) | d148b63b2c7c7ec2f815c8e93afd0bdb6b481a117c93f1219af5c9442c68c364 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für die Zustimmung zur Übermittlung an das Finanzamt schreibt das Gesetz keine Form vor (§ 87d Abs. 3 AO); nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Sie gilt nur für die Erklärungen, die Ihnen die Kanzlei mit dem genannten Schreiben übersandt hat. |
| Empfänger | Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Kanzlei (kanzlei) | keine | freiwillig – belegt nur Angaben der anderen vor | – | Wir legen die Erklärungen mit diesen Angaben zur Zustimmung vor; unsere Allgemeinen Geschäftsbedingungen haben wir mit den Erklärungen übersandt. |
| Mandant / Steuerpflichtiger (mandant) | Pflicht | immer | aus „Name der unterschreibenden Person“ | Ich habe die oben genannten Erklärungen geprüft und habe keine Änderungswünsche. Ich beauftrage die Kanzlei, sie elektronisch einzureichen; Einschränkungen, die oben stehen, gelten dabei. Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit den Erklärungen übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden. |
| Ehegatte / Lebenspartner (ehegatte) | Pflicht | nur wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist (nach dem abgeschlossenen Teil, der das angibt)<br>Warum: Bei Zusammenveranlagung geben beide Ehegatten oder Lebenspartner eine gemeinsame Erklärung ab (§ 25 Abs. 3 Satz 2 EStG); deshalb stimmt auch der andere zu. | aus „Ihr Vor- und Familienname“ | Ich habe die gemeinsame Einkommensteuererklärung geprüft und habe keine Änderungswünsche. Ich beauftrage die Kanzlei, sie elektronisch einzureichen; Einschränkungen, die oben stehen, gelten dabei. Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit der Erklärung übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden. |

## Felder

### 1. Vorlage der Kanzlei

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandant / Steuerpflichtiger (mandantName)<br>Frage: Für wen legen Sie die Erklärungen vor?<br>Hilfe: Vor- und Familienname oder Firma. | Kanzlei | Text, höchstens 70 Zeichen | immer | Pflicht | Wessen Erklärungen die Zustimmung betrifft |
| Datum des Anschreibens (vorlageDatum)<br>Frage: Von wann ist das Schreiben, mit dem Sie die Erklärungen übersandt haben? | Kanzlei | Datum, spätestens heute | immer | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO); Stichtag dieser Fassung |
| Erklärungen (erklaerungen)<br>Frage: Welche Erklärungen haben Sie übersandt?<br>Hilfe: Alle, die mit diesem Schreiben zur Zustimmung vorliegen. Eine Zerlegungserklärung folgt als eigene Frage zur Gewerbesteuererklärung. | Kanzlei | Mehrfachauswahl: Einkommensteuererklärung, Gesonderte und einheitliche Feststellungserklärung, Gewinnermittlung (Anlage EÜR), Körperschaftsteuererklärung, Gewerbesteuererklärung, Umsatzsteuererklärung, Zusammenfassende Meldung, E-Bilanz, Digitaler Finanzbericht (an Banken), Offenlegung oder Hinterlegung beim Unternehmensregister | immer | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Zerlegungserklärung (zerlegung)<br>Frage: Gehört eine Zerlegungserklärung zur Gewerbesteuererklärung?<br>Hilfe: Wenn Betriebsstätten in mehreren Gemeinden lagen (§ 28 GewStG). | Kanzlei | Ja/Nein | erst wenn bei „Erklärungen“ „Gewerbesteuererklärung“ angekreuzt ist<br>Warum: Eine Zerlegungserklärung gibt es nur zusammen mit der Gewerbesteuererklärung (§ 14a Satz 1 GewStG). | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Veranlagung (veranlagung)<br>Frage: Einzel- oder Zusammenveranlagung? | Kanzlei | Auswahl: Einzelveranlagung (auch von Ehegatten, § 26a EStG), Zusammenveranlagung (§ 26b EStG) | erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist<br>Warum: Eine Veranlagung gibt es nur bei der Einkommensteuer; sie entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt. | Pflicht | Entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt (§ 25 Abs. 3 Satz 2 EStG) |
| Ehegatte / Lebenspartner (ehegatteNameKanzlei)<br>Frage: Wie heißt der Ehegatte oder Lebenspartner?<br>Hilfe: Vor- und Familienname. Er stimmt mit zu. | Kanzlei | Text, höchstens 70 Zeichen | erst wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist<br>Warum: Nur bei Zusammenveranlagung stimmt der Ehegatte oder Lebenspartner mit zu; dafür nennt die Kanzlei seinen Namen. | Pflicht | Wer bei Zusammenveranlagung mit zustimmt |
| Einschränkungen der Kanzlei (einschraenkungenKanzlei)<br>Frage: Gibt es Einschränkungen zu den übersandten Erklärungen?<br>Hilfe: Zum Beispiel „ohne die noch fehlende Spendenbescheinigung“. Der Mandant sieht sie vor dem Unterschreiben und stimmt mit ihnen zu. Leer lassen, wenn es keine gibt. | Kanzlei | Text, mehrzeilig, höchstens 1000 Zeichen | immer | optional | Gehört zur übersandten Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |

### 2. Zustimmung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandant / Steuerpflichtiger (zustimmungMandant)<br>Frage: Für wen stimmen Sie zu?<br>Hilfe: Vor- und Familienname oder Firma, wie im Anschreiben der Kanzlei. | Mandant / Steuerpflichtiger | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei fest („Mandant / Steuerpflichtiger“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Namen nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Wessen Erklärungen die Zustimmung betrifft |
| Schreiben der Kanzlei vom (zustimmungSchreibenVom)<br>Frage: Von wann ist das Schreiben, mit dem Sie die Erklärungen erhalten haben? | Mandant / Steuerpflichtiger | Datum | immer<br>Legt Kanzlei fest („Datum des Anschreibens“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Das Datum des Schreibens nennt die Kanzlei; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Erklärungen (zustimmungErklaerungen)<br>Frage: Welchen Erklärungen stimmen Sie zu? | Mandant / Steuerpflichtiger | Mehrfachauswahl: Einkommensteuererklärung, Gesonderte und einheitliche Feststellungserklärung, Gewinnermittlung (Anlage EÜR), Körperschaftsteuererklärung, Gewerbesteuererklärung, Umsatzsteuererklärung, Zusammenfassende Meldung, E-Bilanz, Digitaler Finanzbericht (an Banken), Offenlegung oder Hinterlegung beim Unternehmensregister | immer<br>Legt Kanzlei fest („Erklärungen“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Welche Erklärungen vorliegen, nennt die Kanzlei; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Zerlegungserklärung (zustimmungZerlegung)<br>Frage: Gehört eine Zerlegungserklärung zur Gewerbesteuererklärung? | Mandant / Steuerpflichtiger | Ja/Nein | erst wenn bei „Erklärungen“ „Gewerbesteuererklärung“ angekreuzt ist<br>Legt Kanzlei fest („Zerlegungserklärung“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Eine Zerlegungserklärung gibt es nur zusammen mit der Gewerbesteuererklärung (§ 14a Satz 1 GewStG). Ob sie vorliegt, nennt die Kanzlei; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Veranlagung (zustimmungVeranlagung)<br>Frage: Einzel- oder Zusammenveranlagung?<br>Hilfe: Bei Zusammenveranlagung stimmt auch Ihr Ehegatte oder Lebenspartner zu. | Mandant / Steuerpflichtiger | Auswahl: Einzelveranlagung (auch von Ehegatten, § 26a EStG), Zusammenveranlagung (§ 26b EStG) | erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist<br>Legt Kanzlei fest („Veranlagung“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Eine Veranlagung gibt es nur bei der Einkommensteuer. Sie nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt (§ 25 Abs. 3 Satz 2 EStG) |
| Einschränkungen des Mandanten / Steuerpflichtigen (einschraenkungenMandant)<br>Frage: Möchten Sie Einschränkungen zu Ihrer Zustimmung angeben?<br>Hilfe: Die Kanzlei sieht sie und prüft sie vor der Übermittlung. Leer lassen, wenn es keine gibt. | Mandant / Steuerpflichtiger | Text, mehrzeilig, höchstens 1000 Zeichen | immer | optional | Einschränkungen der Zustimmung; die Kanzlei prüft sie vor der Übermittlung |
| Name der unterschreibenden Person (unterzeichnerName)<br>Frage: Wer unterschreibt?<br>Hilfe: Vor- und Familienname. Bei einer Firma die Person, die für sie unterschreibt. Dieser Name steht an der Unterschrift.<br>Vorschlag im Eingabefeld: „‹Mandant / Steuerpflichtiger›“ | Mandant / Steuerpflichtiger | Text, höchstens 70 Zeichen | immer | Pflicht | Wer zustimmt (Name an der Unterschrift) |

### 3. Zustimmung Ehegatte / Lebenspartner

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (ehegatteName)<br>Frage: Wie heißen Sie?<br>Hilfe: Dieser Name steht an Ihrer Unterschrift. | Ehegatte / Lebenspartner | Text, höchstens 70 Zeichen | immer<br>Belegt Kanzlei vor („Ehegatte / Lebenspartner“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Den Namen nennt die Kanzlei; er steht da und kann geändert werden. | Pflicht | Wer mit zustimmt (Name an der Unterschrift) |
| Einschränkungen des Ehegatten / Lebenspartners (einschraenkungenEhegatte)<br>Frage: Möchten Sie Einschränkungen zu Ihrer Zustimmung angeben?<br>Hilfe: Die Kanzlei sieht sie und prüft sie vor der Übermittlung. Leer lassen, wenn es keine gibt. | Ehegatte / Lebenspartner | Text, mehrzeilig, höchstens 1000 Zeichen | immer | optional | Einschränkungen der Zustimmung; die Kanzlei prüft sie vor der Übermittlung |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Erklärungen (Kanzlei; unabhängig)
  - Zerlegungserklärung (Kanzlei; Ebene 1) – erst wenn bei „Erklärungen“ „Gewerbesteuererklärung“ angekreuzt ist
  - Veranlagung (Kanzlei; Ebene 1) – erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist
    - Ehegatte / Lebenspartner (Kanzlei; Ebene 2) – erst wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist
- Erklärungen (Mandant / Steuerpflichtiger; unabhängig)
  - Zerlegungserklärung (Mandant / Steuerpflichtiger; Ebene 1) – erst wenn bei „Erklärungen“ „Gewerbesteuererklärung“ angekreuzt ist
  - Veranlagung (Mandant / Steuerpflichtiger; Ebene 1) – erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Steuererklärungen

- Kenntnisnahme durch: Mandant / Steuerpflichtiger
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026
- Nur wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist oder bei „Erklärungen“ „Gesonderte und einheitliche Feststellungserklärung“ angekreuzt ist oder bei „Erklärungen“ „Gewinnermittlung (Anlage EÜR)“ angekreuzt ist oder bei „Erklärungen“ „Körperschaftsteuererklärung“ angekreuzt ist oder bei „Erklärungen“ „Gewerbesteuererklärung“ angekreuzt ist oder bei „Erklärungen“ „Umsatzsteuererklärung“ angekreuzt ist oder bei „Erklärungen“ „Zusammenfassende Meldung“ angekreuzt ist oder bei „Erklärungen“ „E-Bilanz“ angekreuzt ist
- Warum: Ein Hinweis je Empfänger (Tobias 2026-11-12): diese Seite, sobald die Kanzlei eine Erklärung an die Finanzverwaltung vorlegt.

> Sie haben die Steuererklärungen, die Ihnen die Kanzlei übersandt hat, auf Vollständigkeit und Richtigkeit geprüft (§ 87d Abs. 3 AO) und haben keine Änderungswünsche. Die Kanzlei übermittelt sie in Ihrem Auftrag elektronisch an die Finanzverwaltung (§ 87d AO) – an das Finanzamt, die Zusammenfassende Meldung an das Bundeszentralamt für Steuern (§ 18a Abs. 1 UStG).
>
> Es bleiben Ihre Erklärungen: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Bei Zusammenveranlagung stimmt auch Ihr Ehegatte oder Lebenspartner der Einkommensteuererklärung zu.
>
> Haben Sie Änderungswünsche, schließen Sie nicht ab und melden Sie sich bei der Kanzlei.

### Digitaler Finanzbericht

- Kenntnisnahme durch: Mandant / Steuerpflichtiger
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026
- Nur wenn bei „Erklärungen“ „Digitaler Finanzbericht (an Banken)“ angekreuzt ist
- Warum: Ein Hinweis je Empfänger: diese Seite nur mit dem Digitalen Finanzbericht, der an Banken geht.

> Den Digitalen Finanzbericht übermittelt die Kanzlei nicht an das Finanzamt, sondern an Banken. Sie haben ihn geprüft und haben keine Änderungswünsche; mit Ihrer Zustimmung beauftragen Sie die Kanzlei, ihn elektronisch zu übermitteln.
>
> Haben Sie Änderungswünsche, schließen Sie nicht ab und melden Sie sich bei der Kanzlei.

### Offenlegung oder Hinterlegung beim Unternehmensregister

- Kenntnisnahme durch: Mandant / Steuerpflichtiger
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026
- Nur wenn bei „Erklärungen“ „Offenlegung oder Hinterlegung beim Unternehmensregister“ angekreuzt ist
- Warum: Ein Hinweis je Empfänger: diese Seite nur mit der Offenlegung oder Hinterlegung, die an das Unternehmensregister geht.

> Die Kanzlei übermittelt den Jahresabschluss in Ihrem Auftrag elektronisch an die das Unternehmensregister führende Stelle (§ 325 Abs. 1 HGB). Eine Kleinstkapitalgesellschaft kann stattdessen nur die Bilanz übermitteln und ihre dauerhafte Hinterlegung verlangen (§ 326 Abs. 2 HGB). Sie haben die Unterlagen geprüft und haben keine Änderungswünsche.
>
> Haben Sie Änderungswünsche, schließen Sie nicht ab und melden Sie sich bei der Kanzlei.

### Allgemeine Geschäftsbedingungen und Datenschutz

- Kenntnisnahme durch: Mandant / Steuerpflichtiger
- Art: wird in der App gelesen und bestätigt
- Stand: 13.11.2026

> Mit Ihrer Zustimmung sind Sie auch mit den Allgemeinen Geschäftsbedingungen einverstanden, die Ihnen die Kanzlei mit den Erklärungen übersandt hat. Liegen sie Ihnen nicht vor, fragen Sie bitte die Kanzlei, bevor Sie zustimmen.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Zustimmung wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App versendet nichts; Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben. Damit eine versehentliche Unterbrechung nichts kostet, merkt sich die Online-Fassung einen angefangenen Fragebogen im Browser dieses Geräts – bis die PDF erstellt oder der Fragebogen verworfen ist, höchstens 7 Tage. Beim Aufruf der Seite verarbeitet der Webserver wie bei jeder Website technische Zugriffsdaten (siehe Datenschutzerklärung der Website).

### Gemeinsame Einkommensteuererklärung

- Kenntnisnahme durch: Ehegatte / Lebenspartner
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026

> Sie haben die gemeinsame Einkommensteuererklärung, die Ihnen die Kanzlei übersandt hat, auf Vollständigkeit und Richtigkeit geprüft (§ 87d Abs. 3 AO) und haben keine Änderungswünsche. Die Kanzlei übermittelt sie in Ihrem Auftrag elektronisch an das Finanzamt (§ 87d AO).
>
> Es ist auch Ihre Erklärung: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Haben Sie Änderungswünsche, schließen Sie nicht ab und melden Sie sich bei der Kanzlei.

### Allgemeine Geschäftsbedingungen und Datenschutz

- Kenntnisnahme durch: Ehegatte / Lebenspartner
- Art: wird in der App gelesen und bestätigt
- Stand: 13.11.2026

> Mit Ihrer Zustimmung sind Sie auch mit den Allgemeinen Geschäftsbedingungen einverstanden, die Ihnen die Kanzlei mit der Erklärung übersandt hat. Liegen sie Ihnen nicht vor, fragen Sie bitte die Kanzlei, bevor Sie zustimmen.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Zustimmung wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App versendet nichts; Ihre Angaben verlassen das Gerät nur als Datei, die Sie selbst weitergeben. Damit eine versehentliche Unterbrechung nichts kostet, merkt sich die Online-Fassung einen angefangenen Fragebogen im Browser dieses Geräts – bis die PDF erstellt oder der Fragebogen verworfen ist, höchstens 7 Tage. Beim Aufruf der Seite verarbeitet der Webserver wie bei jeder Website technische Zugriffsdaten (siehe Datenschutzerklärung der Website).

## Verknüpfung der Teile

- Kanzlei und Mandant / Steuerpflichtiger: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Mandant / Steuerpflichtiger“ (Kanzlei) und „Mandant / Steuerpflichtiger“ (Mandant / Steuerpflichtiger) sollen übereinstimmen. Sonst: „Der Name weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Datum des Anschreibens“ (Kanzlei) und „Schreiben der Kanzlei vom“ (Mandant / Steuerpflichtiger) sollen übereinstimmen. Sonst: „Das Datum des Schreibens weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Erklärungen“ (Kanzlei) und „Erklärungen“ (Mandant / Steuerpflichtiger) sollen übereinstimmen. Sonst: „Die Erklärungen weichen zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Zerlegungserklärung“ (Kanzlei) und „Zerlegungserklärung“ (Mandant / Steuerpflichtiger) sollen übereinstimmen. Sonst: „Die Zerlegungserklärung weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Veranlagung“ (Kanzlei) und „Veranlagung“ (Mandant / Steuerpflichtiger) sollen übereinstimmen. Sonst: „Die Veranlagung weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“

## Zuordnung getrennt eingegangener Teile

- Mandant / Steuerpflichtiger: „Mandant / Steuerpflichtiger“ (Kanzlei) = „Mandant / Steuerpflichtiger“ (Mandant / Steuerpflichtiger)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Prüfhinweise für den Empfänger (Kanzlei)

Nur Hinweise: Sie blockieren nichts und werden nicht unterschrieben. Sie erscheinen bei der Zusammenführung, sobald alle genannten Teile vorliegen.

- „Der Mandant hat Einschränkungen zu seiner Zustimmung angegeben. Bitte vor der Übermittlung prüfen, ob sie zu den Erklärungen passen.“ – wenn „Einschränkungen des Mandanten / Steuerpflichtigen“ ausgefüllt ist
- „Der Ehegatte oder Lebenspartner hat Einschränkungen zu seiner Zustimmung angegeben. Bitte vor der Übermittlung prüfen, ob sie zu der Erklärung passen.“ – wenn „Einschränkungen des Ehegatten / Lebenspartners“ ausgefüllt ist

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen übermittelt nichts. Er dokumentiert die Zustimmung zu den Erklärungen, die die Kanzlei mit dem genannten Schreiben übersandt hat (§ 87d AO).
- Eine Erklärung, die das Gesetz eigenhändig unterschrieben verlangt, ersetzt er nicht; dafür bleibt das Papier.
- Er prüft den Inhalt der Erklärungen nicht; das bleibt Sache der Kanzlei und der Mandanten.
- Änderungswünsche nimmt er nicht auf: Wer nicht zustimmt, schließt nicht ab und meldet sich bei der Kanzlei. Einschränkungen dagegen können Kanzlei, Mandant und Ehegatte frei eintragen; die der Kanzlei sieht der Mandant vor dem Unterschreiben, die der anderen meldet die App der Kanzlei als Prüfhinweis.
- Die Kanzlei belegt nur vor und unterschreibt nicht. Wer ohne ihren Teil beginnt, trägt Name, Datum des Schreibens und Erklärungen selbst ein; weichen sie später von den Angaben der Kanzlei ab, zeigt die App einen Widerspruch.
- Höchstens zwei Personen stimmen zu: der Mandant oder Steuerpflichtige und bei Zusammenveranlagung der Ehegatte oder Lebenspartner.
- Die Allgemeinen Geschäftsbedingungen fügt die App nicht bei: Die Zustimmung bezieht sich auf die, die die Kanzlei mit den Erklärungen übersandt hat.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). § 87d Abs. 3 AO schreibt für die Zustimmung keine Form vor; nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe.
- Bei Zusammenveranlagung stimmen beide Ehegatten oder Lebenspartner zu, weil die gemeinsame Erklärung eine Erklärung beider ist (§ 25 Abs. 3 Satz 2 EStG). Sonst stimmt eine Person zu – bei einer Firma die Person, die für sie unterschreibt.
- Eine Zerlegungserklärung gibt es nur zusammen mit der Gewerbesteuererklärung (§ 14a Satz 1, § 28 Abs. 1 GewStG); deshalb fragt der Fragebogen nach ihr nur, wenn die Gewerbesteuererklärung vorliegt.
- Die Zustimmung gilt für die Erklärungen, die die Kanzlei mit dem genannten Schreiben übersandt hat: Ändert die Kanzlei danach eine Erklärung, ist eine neue Zustimmung nötig.
- § 87d AO gilt für Übermittlungen an die Finanzverwaltung. Der Digitale Finanzbericht geht an Banken, die Offenlegung oder Hinterlegung an die das Unternehmensregister führende Stelle (§ 325 Abs. 1, § 326 Abs. 2 HGB); dafür ist die Zustimmung der Auftrag an die Kanzlei.
- Dieser Fragebogen ist weder eine Steuererklärung noch eine Vollmacht (§ 80 AO).
- Die Kanzlei bewahrt die Zustimmung in der Handakte auf (§ 66 StBerG).
