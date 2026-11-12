# Feldkatalog: Zustimmung zur elektronischen Übermittlung der Steuererklärungen

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | steuerfreigabe, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Datum des Anschreibens“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 12.11.2026 um 11:35 |
| Definition (SHA-256) | 6a707019816fcee20da8497a1a735c3b793075752cef39aa3737754efda35db7 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für die Zustimmung zur Übermittlung an das Finanzamt schreibt das Gesetz keine Form vor (§ 87d Abs. 3 AO); nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Sie gilt nur für die Erklärungen, die Ihnen die Kanzlei mit dem genannten Schreiben übersandt hat. |
| Empfänger | Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Kanzlei (kanzlei) | keine | freiwillig – belegt nur Angaben der anderen vor | – | Wir legen die Erklärungen mit diesen Angaben zur Zustimmung vor; unsere Allgemeinen Geschäftsbedingungen haben wir mit den Erklärungen übersandt. |
| Mandantin oder Mandant (mandant) | Pflicht | immer | aus „Name der unterschreibenden Person“ | Ich habe die oben genannten Erklärungen geprüft und habe keine Änderungswünsche. Ich beauftrage die Kanzlei, sie elektronisch einzureichen. Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit den Erklärungen übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden. |
| Ehegatte oder Lebenspartner (ehegatte) | Pflicht | nur wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist (nach dem abgeschlossenen Teil, der das angibt)<br>Warum: Bei Zusammenveranlagung geben beide Ehegatten oder Lebenspartner eine gemeinsame Erklärung ab (§ 25 Abs. 3 Satz 2 EStG); deshalb stimmt auch der andere zu. | aus „Ihr Vor- und Familienname“ | Ich habe die gemeinsame Einkommensteuererklärung geprüft und habe keine Änderungswünsche. Ich beauftrage die Kanzlei, sie elektronisch einzureichen. Die Allgemeinen Geschäftsbedingungen, die mir die Kanzlei mit der Erklärung übersandt hat, habe ich zur Kenntnis genommen und bin damit einverstanden. |

## Felder

### 1. Vorlage der Kanzlei

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandantin oder Mandant (mandantName)<br>Frage: Für wen legen Sie die Erklärungen vor?<br>Hilfe: Vor- und Familienname oder Firma. | Kanzlei | Text, höchstens 70 Zeichen | immer | Pflicht | Wessen Erklärungen die Zustimmung betrifft |
| Datum des Anschreibens (vorlageDatum)<br>Frage: Von wann ist das Schreiben, mit dem Sie die Erklärungen übersandt haben? | Kanzlei | Datum, spätestens heute | immer | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO); Stichtag dieser Fassung |
| Erklärungen (erklaerungen)<br>Frage: Welche Erklärungen haben Sie übersandt?<br>Hilfe: Alle, die mit diesem Schreiben zur Zustimmung vorliegen. | Kanzlei | Mehrfachauswahl: Einkommensteuererklärung, Gesonderte und einheitliche Feststellungserklärung, Gewinnermittlung (Anlage EÜR), Körperschaftsteuererklärung, Gewerbesteuererklärung, Gewerbesteuererklärung mit Zerlegung, Umsatzsteuererklärung, Zusammenfassende Meldung, E-Bilanz, Digitaler Finanzbericht (an Banken), Offenlegung oder Hinterlegung beim Unternehmensregister | immer | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Veranlagung (veranlagung)<br>Frage: Einzel- oder Zusammenveranlagung? | Kanzlei | Auswahl: Einzelveranlagung (auch von Ehegatten, § 26a EStG), Zusammenveranlagung (§ 26b EStG) | erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist<br>Warum: Eine Veranlagung gibt es nur bei der Einkommensteuer; sie entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt. | Pflicht | Entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt (§ 25 Abs. 3 Satz 2 EStG) |
| Ehegatte oder Lebenspartner (ehegatteNameKanzlei)<br>Frage: Wie heißt der Ehegatte oder Lebenspartner?<br>Hilfe: Vor- und Familienname. Er stimmt mit zu. | Kanzlei | Text, höchstens 70 Zeichen | erst wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist<br>Warum: Nur bei Zusammenveranlagung stimmt der Ehegatte oder Lebenspartner mit zu; dafür nennt die Kanzlei seinen Namen. | Pflicht | Wer bei Zusammenveranlagung mit zustimmt |

### 2. Zustimmung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Mandantin oder Mandant (zustimmungMandant)<br>Frage: Für wen stimmen Sie zu?<br>Hilfe: Vor- und Familienname oder Firma, wie im Anschreiben der Kanzlei. | Mandantin oder Mandant | Text, höchstens 70 Zeichen | immer<br>Legt Kanzlei fest („Mandantin oder Mandant“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Den Namen nennt die Kanzlei; liegt ihr Teil vor, steht er hier fest und wird nicht gefragt. | Pflicht | Wessen Erklärungen die Zustimmung betrifft |
| Schreiben der Kanzlei vom (zustimmungSchreibenVom)<br>Frage: Von wann ist das Schreiben, mit dem Sie die Erklärungen erhalten haben? | Mandantin oder Mandant | Datum | immer<br>Legt Kanzlei fest („Datum des Anschreibens“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Das Datum des Schreibens nennt die Kanzlei; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Erklärungen (zustimmungErklaerungen)<br>Frage: Welchen Erklärungen stimmen Sie zu? | Mandantin oder Mandant | Mehrfachauswahl: Einkommensteuererklärung, Gesonderte und einheitliche Feststellungserklärung, Gewinnermittlung (Anlage EÜR), Körperschaftsteuererklärung, Gewerbesteuererklärung, Gewerbesteuererklärung mit Zerlegung, Umsatzsteuererklärung, Zusammenfassende Meldung, E-Bilanz, Digitaler Finanzbericht (an Banken), Offenlegung oder Hinterlegung beim Unternehmensregister | immer<br>Legt Kanzlei fest („Erklärungen“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Welche Erklärungen vorliegen, nennt die Kanzlei; liegt ihr Teil vor, steht es hier fest und wird nicht gefragt. | Pflicht | Bezeichnet die übersandte Fassung, an die die Zustimmung gebunden ist (§ 87d Abs. 3 AO) |
| Veranlagung (zustimmungVeranlagung)<br>Frage: Einzel- oder Zusammenveranlagung?<br>Hilfe: Bei Zusammenveranlagung stimmt auch Ihr Ehegatte oder Lebenspartner zu. | Mandantin oder Mandant | Auswahl: Einzelveranlagung (auch von Ehegatten, § 26a EStG), Zusammenveranlagung (§ 26b EStG) | erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist<br>Legt Kanzlei fest („Veranlagung“): liegt dessen abgeschlossener Teil vor, wird die Angabe übernommen und nicht gefragt<br>Warum: Eine Veranlagung gibt es nur bei der Einkommensteuer. Sie nennt die Kanzlei; liegt ihr Teil vor, steht sie hier fest und wird nicht gefragt. | Pflicht | Entscheidet, ob auch der Ehegatte oder Lebenspartner zustimmt (§ 25 Abs. 3 Satz 2 EStG) |
| Name der unterschreibenden Person (unterzeichnerName)<br>Frage: Wer unterschreibt?<br>Hilfe: Vor- und Familienname. Bei einer Firma die Person, die für sie unterschreibt. Dieser Name steht an der Unterschrift.<br>Vorschlag im Eingabefeld: „‹Mandantin oder Mandant›“ | Mandantin oder Mandant | Text, höchstens 70 Zeichen | immer | Pflicht | Wer zustimmt (Name an der Unterschrift) |

### 3. Zustimmung des Ehegatten oder Lebenspartners

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ihr Vor- und Familienname (ehegatteName)<br>Frage: Wie heißen Sie?<br>Hilfe: Dieser Name steht an Ihrer Unterschrift. | Ehegatte oder Lebenspartner | Text, höchstens 70 Zeichen | immer<br>Belegt Kanzlei vor („Ehegatte oder Lebenspartner“): liegt dessen abgeschlossener Teil vor, steht die Angabe schon da, wird gefragt und bleibt änderbar<br>Warum: Den Namen nennt die Kanzlei; er steht da und kann geändert werden. | Pflicht | Wer mit zustimmt (Name an der Unterschrift) |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Erklärungen (Kanzlei; unabhängig)
  - Veranlagung (Kanzlei; Ebene 1) – erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist
    - Ehegatte oder Lebenspartner (Kanzlei; Ebene 2) – erst wenn bei „Veranlagung“ „Zusammenveranlagung (§ 26b EStG)“ gewählt ist
- Erklärungen (Mandantin oder Mandant; unabhängig)
  - Veranlagung (Mandantin oder Mandant; Ebene 1) – erst wenn bei „Erklärungen“ „Einkommensteuererklärung“ angekreuzt ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Was Sie mit der Zustimmung erklären

- Kenntnisnahme durch: Mandantin oder Mandant
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026

> Die Kanzlei übermittelt Ihre Steuererklärungen in Ihrem Auftrag elektronisch an die Finanzverwaltung (§ 87d AO). Vorher stellt sie Ihnen die Daten in leicht nachprüfbarer Form zur Verfügung; Sie müssen sie unverzüglich auf Vollständigkeit und Richtigkeit prüfen (§ 87d Abs. 3 AO).
>
> Es bleiben Ihre Erklärungen: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Der Digitale Finanzbericht geht nicht an das Finanzamt, sondern an Banken; die Offenlegung oder Hinterlegung geht an das Unternehmensregister (§§ 325, 326 HGB). Auch dafür ist Ihre Zustimmung der Auftrag an die Kanzlei.
>
> Mit Ihrer Zustimmung sind Sie auch mit den Allgemeinen Geschäftsbedingungen einverstanden, die Ihnen die Kanzlei mit den Erklärungen übersandt hat. Liegen sie Ihnen nicht vor, fragen Sie bitte die Kanzlei, bevor Sie zustimmen.
>
> Haben Sie Änderungswünsche, stimmen Sie nicht zu: Schließen Sie diesen Fragebogen nicht ab und melden Sie sich bei der Kanzlei.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Zustimmung wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

### Was Sie mit der Zustimmung erklären

- Kenntnisnahme durch: Ehegatte oder Lebenspartner
- Art: wird in der App gelesen und bestätigt
- Stand: 12.11.2026

> Die Kanzlei übermittelt Ihre gemeinsame Einkommensteuererklärung in Ihrem Auftrag elektronisch an die Finanzverwaltung (§ 87d AO). Vorher stellt sie Ihnen die Daten in leicht nachprüfbarer Form zur Verfügung; Sie müssen sie unverzüglich auf Vollständigkeit und Richtigkeit prüfen (§ 87d Abs. 3 AO).
>
> Es bleibt Ihre Erklärung: Die Angaben müssen wahrheitsgemäß nach bestem Wissen und Gewissen sein (§ 150 Abs. 2 AO). Daten, die Dritte dem Finanzamt schon gemeldet haben und die übernommen wurden (zum Beispiel die Lohnsteuerbescheinigung), gelten als Ihre Angaben, wenn Sie nichts anderes angeben (§ 150 Abs. 7 AO). Erkennen Sie später einen Fehler, müssen Sie ihn unverzüglich anzeigen und richtigstellen (§ 153 AO) – sagen Sie dann bitte sofort der Kanzlei Bescheid.
>
> Mit Ihrer Zustimmung sind Sie auch mit den Allgemeinen Geschäftsbedingungen einverstanden, die Ihnen die Kanzlei mit der Erklärung übersandt hat. Liegen sie Ihnen nicht vor, fragen Sie bitte die Kanzlei, bevor Sie zustimmen.
>
> Haben Sie Änderungswünsche, stimmen Sie nicht zu: Schließen Sie diesen Fragebogen nicht ab und melden Sie sich bei der Kanzlei.
>
> Datenschutz: Verantwortlich ist die Kanzlei, die Ihnen diesen Fragebogen vorgelegt hat; ihre Kontaktdaten stehen in ihrer Datenschutzinformation. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b und c DSGVO. Die Zustimmung wird in der Handakte aufbewahrt (§ 66 StBerG). Sie haben die Rechte nach Art. 15 bis 18 und 77 DSGVO. Diese App speichert und versendet nichts.

## Verknüpfung der Teile

- Kanzlei und Mandantin oder Mandant: Wer zuletzt abschließt, bestätigt die aktuelle Fassung des anderen Teils. Ohne diese Verknüpfung ist der Fragebogen nicht vollständig.

## Prüfregeln

- „Mandantin oder Mandant“ (Kanzlei) und „Mandantin oder Mandant“ (Mandantin oder Mandant) sollen übereinstimmen. Sonst: „Der Name weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Datum des Anschreibens“ (Kanzlei) und „Schreiben der Kanzlei vom“ (Mandantin oder Mandant) sollen übereinstimmen. Sonst: „Das Datum des Schreibens weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Erklärungen“ (Kanzlei) und „Erklärungen“ (Mandantin oder Mandant) sollen übereinstimmen. Sonst: „Die Erklärungen weichen zwischen der Vorlage der Kanzlei und der Zustimmung ab.“
- „Veranlagung“ (Kanzlei) und „Veranlagung“ (Mandantin oder Mandant) sollen übereinstimmen. Sonst: „Die Veranlagung weicht zwischen der Vorlage der Kanzlei und der Zustimmung ab.“

## Zuordnung getrennt eingegangener Teile

- Mandantin oder Mandant: „Mandantin oder Mandant“ (Kanzlei) = „Mandantin oder Mandant“ (Mandantin oder Mandant)

Ein Vorschlag zur Verknüpfung entsteht nur, wenn alle Merkmale übereinstimmen. Verknüpft wird nur auf menschliche Entscheidung.

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen übermittelt nichts. Er dokumentiert die Zustimmung zu den Erklärungen, die die Kanzlei mit dem genannten Schreiben übersandt hat (§ 87d AO).
- Eine Erklärung, die das Gesetz eigenhändig unterschrieben verlangt, ersetzt er nicht; dafür bleibt das Papier.
- Er prüft den Inhalt der Erklärungen nicht; das bleibt Sache der Kanzlei und der Mandanten.
- Änderungswünsche nimmt er nicht auf: Wer nicht zustimmt, schließt nicht ab und meldet sich bei der Kanzlei.
- Die Kanzlei belegt nur vor und unterschreibt nicht. Wer ohne ihren Teil beginnt, trägt Name, Datum des Schreibens und Erklärungen selbst ein; weichen sie später von den Angaben der Kanzlei ab, zeigt die App einen Widerspruch.
- Höchstens zwei Personen stimmen zu: die Mandantin oder der Mandant und bei Zusammenveranlagung der Ehegatte oder Lebenspartner.
- Die Allgemeinen Geschäftsbedingungen fügt die App nicht bei: Die Zustimmung bezieht sich auf die, die die Kanzlei mit den Erklärungen übersandt hat.

## Sonderfälle, die Abschließen und Weitergeben sperren

Keine.

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). § 87d Abs. 3 AO schreibt für die Zustimmung keine Form vor; nach den Hinweisen der Bundessteuerberaterkammer genügt für Steuererklärungen eine Freigabe.
- Bei Zusammenveranlagung stimmen beide Ehegatten oder Lebenspartner zu, weil die gemeinsame Erklärung eine Erklärung beider ist (§ 25 Abs. 3 Satz 2 EStG). Sonst stimmt eine Person zu – bei einer Firma die Person, die für sie unterschreibt.
- Die Zustimmung gilt für die Erklärungen, die die Kanzlei mit dem genannten Schreiben übersandt hat: Ändert die Kanzlei danach eine Erklärung, ist eine neue Zustimmung nötig.
- § 87d AO gilt für Übermittlungen an die Finanzverwaltung. Der Digitale Finanzbericht geht an Banken, die Offenlegung oder Hinterlegung an die das Unternehmensregister führende Stelle (§ 325 Abs. 1, § 326 Abs. 2 HGB); dafür ist die Zustimmung der Auftrag an die Kanzlei.
- Dieser Fragebogen ist weder eine Steuererklärung noch eine Vollmacht (§ 80 AO).
- Die Kanzlei bewahrt die Zustimmung in der Handakte auf (§ 66 StBerG).
