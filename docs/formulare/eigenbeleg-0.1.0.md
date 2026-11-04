# Feldkatalog: Eigenbeleg: Ausgabe ohne Originalbeleg, Entnahme, Einlage oder Geldtransit

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | eigenbeleg, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Tag des Vorgangs“ ab 01.01.2025 |
| Definition (SHA-256) | 5c04a3c7bb35b2bcaeb322b0a5fb3ce8321f046f570239df837c58c52ebd5324 |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für Eigenbelege schreibt kein Gesetz eine Form vor. Fehlt ein fremder Beleg, ist ein eigener zu erstellen (GoBD Rz. 61); er darf elektronisch entstehen. Für den digitalen Bewirtungs-Eigenbeleg lässt die Finanzverwaltung eine elektronische Unterschrift oder Genehmigung genügen, wenn der Zeitpunkt aufgezeichnet wird und die Angaben nicht unbemerkt geändert werden können (BMF-Schreiben vom 19.11.2025 Rn. 19, 22). Die App versiegelt die Angaben mit Zeitpunkt und Prüfsumme; eine einfache elektronische Signatur – gezeichnet oder als getippter Name – genügt (Art. 3 Nr. 10 eIDAS-Verordnung). |
| Empfänger | Buchhaltung oder Kanzlei |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Ausstellende Person (aussteller) | Pflicht | immer | aus „Ausgestellt von“ | Ich versichere, dass der Vorgang so stattgefunden hat, wie ich ihn beschrieben habe, und dass meine Angaben richtig sind. Bei einer Ausgabe liegt mir kein verwendbarer Originalbeleg vor, und ich reiche die Ausgabe nicht ein zweites Mal ein. |

## Felder

### 1. Unternehmen und ausstellende Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Unternehmen (firma)<br>Frage: Für welches Unternehmen stellen Sie den Eigenbeleg aus?<br>Hilfe: So, wie es auf Ihren Rechnungen oder im Handelsregister steht. | Ausstellende Person | Text; Stammdatum „firma“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Belegempfänger; Zuordnung zum Unternehmen (GoBD Rz. 77) |
| Mandantennummer (mandantennummer)<br>Frage: Wie lautet Ihre Mandantennummer?<br>Hilfe: Steht auf Schreiben Ihrer Kanzlei und im Lesezeichen-Link. Nicht zur Hand? Dann lassen Sie das Feld leer. | Ausstellende Person | Text, nur Ziffern; Stammdatum „mandantennummer“, kann im Stammdaten-Link gemerkt werden | immer | optional | Zuordnung in der Kanzlei |
| Ausgestellt von (ausstellerName)<br>Frage: Wer stellt den Eigenbeleg aus?<br>Hilfe: Ihr Vor- und Familienname. Sie unterschreiben am Ende. | Ausstellende Person | Text, höchstens 60 Zeichen | immer | Pflicht | Verantwortlicher Aussteller (GoBD Rz. 77); Name der unterschreibenden Person |

### 2. Art und Tag des Vorgangs

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Art des Vorgangs (vorgangsart)<br>Frage: Was möchten Sie mit diesem Eigenbeleg belegen?<br>Hilfe: Eine Ausgabe des Betriebs, zu der Ihnen kein Beleg vorliegt, oder Geld, das aus dem Betrieb genommen, in den Betrieb gegeben oder zwischen Kasse und Bank bewegt wurde. Haben Sie eine Ausgabe des Betriebs privat bezahlt und den Beleg noch, geben Sie einfach den Beleg ab. | Ausstellende Person | Auswahl: eine Ausgabe ohne Originalbeleg, eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde, eine Einlage: privates Geld, das in den Betrieb gegeben wurde, einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs | immer | Pflicht | Art des Geschäftsvorfalls: Ausgaben (§ 4 Abs. 4 EStG), Entnahmen und Einlagen (§ 4 Abs. 1 Satz 2 und 8 EStG) und Geldtransit werden verschieden gebucht |
| Rechtsform des Unternehmens (rechtsform)<br>Frage: Welche Rechtsform hat das Unternehmen?<br>Hilfe: Davon hängt ab, wie das Geld gebucht wird. Wenn Sie unsicher sind: Ihre Kanzlei kennt die Rechtsform. | Ausstellende Person | Auswahl: Einzelunternehmen (auch Freiberufler und eingetragene Kaufleute), Personengesellschaft (z. B. GbR, OHG, KG, auch GmbH & Co. KG), Kapitalgesellschaft (GmbH, UG oder AG), eine andere (z. B. Verein oder Genossenschaft); Stammdatum „rechtsform“, kann im Stammdaten-Link gemerkt werden | erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ oder „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist<br>Warum: Privatentnahmen und Einlagen gibt es bei Einzelunternehmen und Personengesellschaften. In einer Kapitalgesellschaft ist Geld, das jemand für sich herausnimmt oder privat hineingibt, ein Geschäft mit der Gesellschaft – etwa ein Darlehen, eine verdeckte Gewinnausschüttung oder eine verdeckte Einlage (§ 8 Abs. 3 Satz 2 und 3 KStG). | Pflicht | Einordnung von Entnahme und Einlage (§ 4 Abs. 1 Satz 2 und 8 EStG; § 8 Abs. 3 Satz 2 und 3 KStG) |
| Hinweis zur Kapitalgesellschaft (hinweisKapitalgesellschaft)<br>Frage: Bitte beachten Sie: In einer GmbH, UG oder AG gehört das Geld der Gesellschaft.<br>Hilfe: Eine Privatentnahme oder Einlage wie bei einem Einzelunternehmen gibt es dort nicht. Nimmt eine Gesellschafterin oder ein Gesellschafter Geld heraus oder gibt es hinein, bucht die Kanzlei das in der Regel auf ein Verrechnungskonto oder als Darlehen. Ohne klare Vereinbarung kann eine Entnahme steuerlich als verdeckte Gewinnausschüttung gelten. Sie können den Eigenbeleg trotzdem ausstellen; Ihre Kanzlei klärt die Buchung mit Ihnen. | Ausstellende Person | Auswahl: Verstanden | erst wenn bei „Rechtsform des Unternehmens“ „Kapitalgesellschaft (GmbH, UG oder AG)“ gewählt ist<br>Warum: Nur in einer Kapitalgesellschaft ist eine Privatentnahme oder Einlage in Wahrheit ein Geschäft mit der Gesellschaft (§ 8 Abs. 3 Satz 2 und 3 KStG). | Pflicht | Nachweis, dass die ausstellende Person auf die Folgen hingewiesen wurde |
| Tag des Vorgangs (vorgangsdatum)<br>Frage: An welchem Tag wurde bezahlt oder das Geld bewegt?<br>Hilfe: Bei einer Ausgabe der Tag der Zahlung, sonst der Tag, an dem das Geld entnommen, eingelegt oder gebracht wurde. Er bestimmt, in welchen Monat der Vorgang gehört. | Ausstellende Person | Datum, spätestens heute | immer | Pflicht | Belegdatum, Pflichtangabe (GoBD Rz. 77; § 146 Abs. 1 Satz 1 AO); Stichtag der Gültigkeit dieser Fassung |

### 3. Art der Ausgabe

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Art der Ausgabe (artAusgabe)<br>Frage: Wofür wurde bezahlt?<br>Hilfe: Wählen Sie das Passendste. Für manche Ausgaben genügt ein Eigenbeleg nicht – dann sagt Ihnen der Fragebogen, was stattdessen nötig ist. | Ausstellende Person | Auswahl: eine Parkgebühr, eine Fahrkarte (Bus, Bahn, Taxi), ein Trinkgeld, außer bei einer Bewirtung, Porto oder Versand, Material, Büro- oder Verbrauchsbedarf, Kraftstoff, Wäsche, Pflege oder Reparatur eines Fahrzeugs des Betriebs, eine Gebühr, einen Eintritt oder eine Maut, einen Gegenstand, der länger genutzt wird (z. B. ein Gerät), ein Geschenk an einen Geschäftspartner, ein Essen oder Getränke mit Gästen (Bewirtung), Ihre eigene Verpflegung auf einer Reise, Fahrten mit einem privaten Fahrzeug, eine Zahlung an Beschäftigte oder Aushilfen, eine Spende, etwas anderes | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe; einige Ausgaben haben eigene Nachweisregeln (§ 4 Abs. 5 Satz 1 Nr. 1, 2 und 5, Abs. 7 EStG; § 50 Abs. 1 EStDV). | Pflicht | Einordnung der Ausgabe; Sonderfälle mit eigenen Nachweisregeln erkennen (§ 4 Abs. 5 Satz 1 Nr. 1, 2 und 5, Abs. 7 EStG; § 50 Abs. 1 EStDV) |
| Empfänger des Geschenks (geschenkEmpfaenger)<br>Frage: Wer hat das Geschenk bekommen?<br>Hilfe: Vor- und Familienname der Person und ihr Unternehmen. | Ausstellende Person | Text | erst wenn bei „Art der Ausgabe“ „ein Geschenk an einen Geschäftspartner“ gewählt ist<br>Warum: Bei Geschenken muss der Name des Empfängers aus dem Beleg hervorgehen (R 4.11 Abs. 2 Satz 1 EStR). | Pflicht | Name des Empfängers auf dem Buchungsbeleg (R 4.11 Abs. 2 Satz 1 EStR); Freigrenze je Empfänger (§ 4 Abs. 5 Satz 1 Nr. 1 EStG); gesonderte Aufzeichnung (§ 4 Abs. 7 EStG) |
| Fahrtenbuch für das Fahrzeug (fahrtenbuch)<br>Frage: Wird für dieses Fahrzeug ein Fahrtenbuch geführt?<br>Hilfe: Wenn Sie es nicht wissen: Ihre Kanzlei weiß es. | Ausstellende Person | Ja/Nein | erst wenn bei „Art der Ausgabe“ „Kraftstoff, Wäsche, Pflege oder Reparatur eines Fahrzeugs des Betriebs“ gewählt ist<br>Warum: Wer ein Fahrtenbuch führt, muss alle Kosten des Fahrzeugs durch Belege nachweisen (§ 6 Abs. 1 Nr. 4 Satz 3 EStG). | Pflicht | Prüfhinweis zur Fahrtenbuchmethode (§ 6 Abs. 1 Nr. 4 Satz 3 EStG) |
| Hinweis zur Bewirtung (bewirtungHinweis)<br>Frage: Wichtig bei einer Bewirtung: Ohne die Rechnung der Gaststätte ist die Ausgabe nicht abziehbar.<br>Hilfe: Für ein Essen oder Getränke mit Gästen in einem Restaurant, Café oder einer anderen Gaststätte verlangt das Gesetz deren Rechnung (§ 4 Abs. 5 Satz 1 Nr. 2 EStG). Sie muss von der Kasse gedruckt sein. Ein selbst erstellter Beleg wie dieser ersetzt sie nicht – ohne sie zählt die Ausgabe überhaupt nicht als Betriebsausgabe. Bitten Sie die Gaststätte deshalb zuerst um eine Zweitschrift der Rechnung. Eine Bewirtung in Ihrer eigenen Wohnung ist in der Regel privat und keine Betriebsausgabe. Sie können den Eigenbeleg trotzdem ausstellen; Ihre Kanzlei prüft ihn. | Ausstellende Person | Auswahl: Verstanden | erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist<br>Warum: Nur bei einer Bewirtung: Ohne die maschinell erstellte Rechnung der Gaststätte ist die Ausgabe vom Abzug ausgeschlossen (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 3 EStG; R 4.10 Abs. 8 EStR; BMF-Schreiben vom 19.11.2025 Rn. 13), eine Bewirtung in der eigenen Wohnung ist in der Regel privat (R 4.10 Abs. 6 Satz 8 EStR). | Pflicht | Nachweis, dass die ausstellende Person auf die Folgen hingewiesen wurde |
| Art des Orts der Bewirtung (bewirtungOrt)<br>Frage: Wo fand die Bewirtung statt? | Ausstellende Person | Auswahl: in einem Restaurant, Café oder einer anderen Gaststätte, in Ihrer eigenen Wohnung, in den Räumen des Betriebs, an einem anderen Ort | erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist<br>Warum: Nur bei einer Bewirtung: Der Ort entscheidet über den Nachweis (Rechnung der Gaststätte, § 4 Abs. 5 Satz 1 Nr. 2 Satz 3 EStG) und darüber, ob die Ausgabe privat ist (R 4.10 Abs. 6 Satz 8 EStR). | Pflicht | Ort der Bewirtung (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG); Prüfhinweise zum Nachweis |

### 4. Warum es keinen Originalbeleg gibt

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Grund ohne Originalbeleg (grundOhneOriginal)<br>Frage: Warum gibt es keinen Originalbeleg?<br>Hilfe: Geschäfte mit elektronischer Kasse müssen einen Beleg ausgeben – fragen Sie zuerst dort nach. | Ausstellende Person | Auswahl: Es gab keinen Beleg (z. B. Automat ohne Quittung, Trinkgeld), Der Beleg wurde einbehalten (z. B. Parkschein an der Ausfahrt), Der Empfänger hat keinen Beleg ausgestellt, Der Beleg ist verloren gegangen, Der Beleg ist unleserlich oder beschädigt, aus einem anderen Grund | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Ein Eigenbeleg ist nur zulässig, wenn kein fremder Beleg vorhanden ist (GoBD Rz. 61); das betrifft nur Ausgaben. | Pflicht | Zulässigkeit des Eigenbelegs (GoBD Rz. 61); Belegausgabepflicht bei elektronischen Kassen (§ 146a Abs. 2 AO) |
| Erläuterung zum fehlenden Beleg (grundErlaeuterung)<br>Frage: Was ist genau passiert?<br>Hilfe: Kurz in eigenen Worten. Bei „aus einem anderen Grund“ ist die Angabe Pflicht. | Ausstellende Person | Text, mehrzeilig | erst wenn „Grund ohne Originalbeleg“ ausgefüllt ist<br>Warum: Nur bei einer Ausgabe ohne Originalbeleg. Ein anderer Grund muss beschrieben werden, sonst lässt sich nicht beurteilen, ob ein Eigenbeleg zulässig ist (GoBD Rz. 61). | Pflicht, wenn bei „Grund ohne Originalbeleg“ „aus einem anderen Grund“ gewählt ist | Erläuterung des Geschäftsvorfalls (GoBD Rz. 77) |
| Unleserlicher Beleg liegt bei (originalRestLiegtBei)<br>Frage: Geben Sie den unleserlichen Beleg zusammen mit diesem Eigenbeleg ab?<br>Hilfe: Auch ein verblasster Bon stützt Ihre Angaben. Werfen Sie ihn nicht weg. | Ausstellende Person | Ja/Nein | erst wenn bei „Grund ohne Originalbeleg“ „Der Beleg ist unleserlich oder beschädigt“ gewählt ist<br>Warum: Nur ein beschädigter Beleg kann noch beigelegt werden. | Pflicht | Belegfunktion: urschriftlich bzw. als Kopie der Urschrift belegen (GoBD Rz. 61) |
| Zweitschrift angefragt (zweitschrift)<br>Frage: Haben Sie um eine Zweitschrift gebeten?<br>Hilfe: Eine Zweitschrift des Ausstellers ersetzt das Original besser als ein Eigenbeleg; mit ihr ist oft auch der Vorsteuerabzug möglich. | Ausstellende Person | Auswahl: Ja, ich habe eine Zweitschrift bekommen, Ja, aber ohne Erfolg, Nein, das ist nicht möglich (z. B. Aussteller unbekannt), Nein | erst wenn bei „Grund ohne Originalbeleg“ „Der Beleg ist verloren gegangen“ oder „Der Beleg ist unleserlich oder beschädigt“ gewählt ist<br>Warum: Nur ein verlorener oder beschädigter Beleg lässt sich beim Aussteller neu anfordern. | Pflicht | Vorrang der Zweitschrift (UStAE 15.11 Abs. 1 Satz 4) |

### 5. Die Ausgabe

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Zahlungsempfänger (zahlungsempfaenger)<br>Frage: An wen wurde bezahlt?<br>Hilfe: Name des Geschäfts, des Automatenbetreibers, des Verkehrsbetriebs oder der Person – so genau wie möglich. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur eine Ausgabe hat einen Zahlungsempfänger. | Pflicht | Name des Vertragspartners, soweit zumutbar (GoBD Rz. 37, 77) |
| Ort (ortDerAusgabe)<br>Frage: Wo war das?<br>Hilfe: Ort, bei Parkhäusern oder Automaten auch die Straße; bei einer Bewirtung Name und Anschrift des Lokals oder der Ort. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe; der Ort macht sie nachvollziehbar. | Pflicht | Nachvollziehbarkeit des Geschäftsvorfalls (§ 145 Abs. 1 Satz 2 AO); Ort einer Bewirtung (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG) |
| Gekauft oder bezahlt (leistung)<br>Frage: Was wurde gekauft oder bezahlt?<br>Hilfe: Menge und Art, z. B. „2 Stunden Parken“ oder „3 Packungen Druckerpapier“. | Ausstellende Person | Text, höchstens 200 Zeichen | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe. | Pflicht | Hinreichende Erläuterung des Geschäftsvorfalls (GoBD Rz. 77) |
| Betrieblicher Anlass (betrieblicherAnlass)<br>Frage: Wofür wurde die Ausgabe im Betrieb gebraucht?<br>Hilfe: Zum Beispiel: „Kundentermin bei der Beispiel GmbH in Musterstadt“. | Ausstellende Person | Text, mehrzeilig | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist und nicht zutrifft, dass bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist<br>Warum: Nur bei einer Ausgabe; bei einer Bewirtung wird stattdessen deren Anlass gefragt. | Pflicht | Betriebliche Veranlassung (§ 4 Abs. 4 EStG; GoBD Rz. 61) |
| Anlass der Bewirtung (bewirtungAnlass)<br>Frage: Was war der geschäftliche Anlass der Bewirtung?<br>Hilfe: Möglichst genau, z. B. „Besprechung des Auftrags Neubau Musterstraße mit der Beispiel GmbH“. | Ausstellende Person | Text | erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist<br>Warum: Den Anlass einer Bewirtung verlangt das Gesetz schriftlich (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG). | Pflicht | Anlass der Bewirtung (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG) |
| Teilnehmende der Bewirtung (bewirtungTeilnehmer)<br>Frage: Wer hat an der Bewirtung teilgenommen?<br>Hilfe: Alle Personen mit Namen, auch Sie selbst; bei Geschäftspartnern auch ihr Unternehmen. Eine Person je Zeile. | Ausstellende Person | Text, mehrzeilig | erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist<br>Warum: Die Teilnehmer einer Bewirtung verlangt das Gesetz schriftlich (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG). | Pflicht | Teilnehmer der Bewirtung (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2 EStG) |
| In Euro bezahlt (inEuro)<br>Frage: Wurde in Euro bezahlt? | Ausstellende Person | Ja/Nein | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe; Geldbewegungen des Betriebs werden in Euro erfasst. | Pflicht | Währungsangabe (GoBD Rz. 77) |
| Währung (waehrung)<br>Frage: In welcher Währung?<br>Hilfe: Zum Beispiel CHF oder US-Dollar. | Ausstellende Person | Text, höchstens 20 Zeichen | erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist<br>Warum: Nur bei einer fremden Währung. | Pflicht | Währungsangabe bei Fremdwährung (GoBD Rz. 77) |
| Betrag in der fremden Währung (betragFremdwaehrung)<br>Frage: Wie viel wurde in dieser Währung bezahlt? | Ausstellende Person | Zahl, 2 Nachkommastellen | erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist<br>Warum: Nur bei einer fremden Währung. | Pflicht | Betrag und Kurs bei Fremdwährung (GoBD Rz. 77) |
| Betrag in Euro (betrag)<br>Frage: Wie viel wurde bezahlt, in Euro?<br>Hilfe: Der ganze gezahlte Betrag, so wie er ist. Die Umsatzsteuer wird nicht herausgerechnet – aus einem Eigenbeleg ist kein Vorsteuerabzug möglich. Bei fremder Währung: der Betrag laut Kontoauszug oder umgerechnet zum Tageskurs. | Ausstellende Person | Betrag in Euro | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe; Geldbewegungen haben eine eigene Frage nach dem Betrag. | Pflicht | Zu buchender Betrag, Pflichtangabe (GoBD Rz. 77); kein Vorsteuerabzug ohne Rechnung (§ 15 Abs. 1 Satz 1 Nr. 1 Satz 2 UStG) |
| Umrechnung in Euro (umrechnung)<br>Frage: Wie wurde in Euro umgerechnet?<br>Knöpfe: „Betrag laut Kontoauszug“, „Umgerechnet zum Tageskurs“ | Ausstellende Person | Text | erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist<br>Warum: Nur bei einer fremden Währung. | optional | Wechselkurs bei Fremdwährung (GoBD Rz. 77) |
| Zahlungsart (zahlungsart)<br>Frage: Wie wurde bezahlt? | Ausstellende Person | Auswahl: bar aus der Kasse des Betriebs, bar aus eigener Tasche, mit einer Karte des Betriebs, per Überweisung vom Konto des Betriebs, mit privater Karte oder von einem privaten Konto, über einen Bezahldienst im Internet oder per App | erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist<br>Warum: Nur bei einer Ausgabe. | Pflicht | Zahlungsart (GoBD Rz. 79); Buchung über Kasse, Bank oder als Einlage; tägliche Kassenaufzeichnung (§ 146 Abs. 1 Satz 2 AO) |
| Zahlungsnachweis liegt bei (zahlungsnachweis)<br>Frage: Geben Sie einen Zahlungsnachweis mit ab (Kontoauszug, Kartenbeleg, Bestätigung des Bezahldienstes)?<br>Hilfe: Dieser Fragebogen kann keine Dateien anhängen. Geben Sie den Nachweis zusammen mit der PDF ab und schreiben Sie die Belegnummer darauf, wenn Sie eine vergeben. | Ausstellende Person | Ja/Nein | erst wenn bei „Zahlungsart“ „mit einer Karte des Betriebs“ oder „per Überweisung vom Konto des Betriebs“ oder „mit privater Karte oder von einem privaten Konto“ oder „über einen Bezahldienst im Internet oder per App“ gewählt ist<br>Warum: Nur eine unbare Zahlung lässt sich durch einen Kontoauszug oder Kartenbeleg nachweisen. | Pflicht | Nachweis der Zahlung; Zuordnung mehrerer Belege zu einer Buchung (GoBD Rz. 71) |
| Ausgabe im Kassenbuch (kassenbuch)<br>Frage: Steht die Ausgabe am Tag der Zahlung im Kassenbuch?<br>Hilfe: Barausgaben müssen täglich aufgezeichnet werden. | Ausstellende Person | Ja/Nein | erst wenn bei „Zahlungsart“ „bar aus der Kasse des Betriebs“ gewählt ist<br>Warum: Nur Zahlungen aus der Kasse des Betriebs stehen im Kassenbuch (§ 146 Abs. 1 Satz 2 AO). | Pflicht | Tägliche Kassenaufzeichnung (§ 146 Abs. 1 Satz 2 AO; GoBD Rz. 48) |

### 6. Entnahme, Einlage oder Geldtransit

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Entnommen aus (entnahmeAus)<br>Frage: Woher wurde das Geld entnommen? | Ausstellende Person | Auswahl: bar aus der Kasse des Betriebs, vom Bankkonto des Betriebs | erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist<br>Warum: Nur bei einer Privatentnahme; davon hängt ab, ob sie ins Kassenbuch gehört (§ 146 Abs. 1 Satz 2 AO). | Pflicht | Buchung über Kasse oder Bank; Aufzeichnung jeder Entnahme (GoBD Rz. 37) |
| Eingelegt in (einlageIn)<br>Frage: Wohin wurde das Geld eingelegt? | Ausstellende Person | Auswahl: bar in die Kasse des Betriebs, auf das Bankkonto des Betriebs | erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist<br>Warum: Nur bei einer Einlage; davon hängt ab, ob sie ins Kassenbuch gehört (§ 146 Abs. 1 Satz 2 AO). | Pflicht | Buchung über Kasse oder Bank; Aufzeichnung jeder Einlage (GoBD Rz. 37) |
| Richtung des Geldtransits (geldtransitRichtung)<br>Frage: Von wo nach wo wurde das Geld gebracht? | Ausstellende Person | Auswahl: aus der Kasse auf das Bankkonto (Einzahlung bei der Bank), vom Bankkonto in die Kasse (Abhebung bei der Bank oder am Automaten), aus einer Kasse in eine andere Kasse des Betriebs | erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist<br>Warum: Nur bei einem Geldtransit; Abgang und Zugang werden je einmal gebucht (GoBD Rz. 41). | Pflicht | Buchung von Abgang und Zugang; Kassenaufzeichnung (§ 146 Abs. 1 Satz 2 AO) |
| Kasse (kassenBezeichnung)<br>Frage: Welche Kasse war es?<br>Hilfe: Nur nötig, wenn der Betrieb mehrere Kassen führt, z. B. „Kasse Filiale Nord“. | Ausstellende Person | Text | erst wenn bei „Entnommen aus“ „bar aus der Kasse des Betriebs“ gewählt ist oder bei „Eingelegt in“ „bar in die Kasse des Betriebs“ gewählt ist oder bei „Richtung des Geldtransits“ „aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“ oder „vom Bankkonto in die Kasse (Abhebung bei der Bank oder am Automaten)“ gewählt ist<br>Warum: Nur wenn Bargeld in eine Kasse kommt oder sie verlässt. | optional | Zuordnung zum Kassenbuch der richtigen Kasse (§ 146 Abs. 1 Satz 2 AO) |
| Von Kasse zu Kasse (transitKassen)<br>Frage: Aus welcher Kasse in welche Kasse?<br>Hilfe: Zum Beispiel „Hauptkasse → Kasse Filiale Nord“. | Ausstellende Person | Text | erst wenn bei „Richtung des Geldtransits“ „aus einer Kasse in eine andere Kasse des Betriebs“ gewählt ist<br>Warum: Nur bei einem Wechsel zwischen zwei Kassen; beide Kassenbücher zeigen ihn. | Pflicht | Zuordnung zu beiden Kassenbüchern (§ 146 Abs. 1 Satz 2 AO; GoBD Rz. 41) |
| Entnommen von (entnahmePerson)<br>Frage: Wer hat das Geld für private Zwecke entnommen?<br>Hilfe: Vor- und Familienname. Bei einer Personengesellschaft die Gesellschafterin oder der Gesellschafter, für die oder den entnommen wurde. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist<br>Warum: Nur bei einer Privatentnahme; die Entnahme wird der Person zugeordnet, für die sie erfolgt. | Pflicht | Zuordnung der Entnahme (§ 4 Abs. 1 Satz 2 EStG; GoBD Rz. 37) |
| Eingelegt von (einlagePerson)<br>Frage: Wer hat das Geld eingelegt?<br>Hilfe: Vor- und Familienname. Bei einer Personengesellschaft die Gesellschafterin oder der Gesellschafter, aus deren oder dessen Privatvermögen das Geld kommt. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist<br>Warum: Nur bei einer Einlage; die Einlage wird der Person zugeordnet, von der sie kommt. | Pflicht | Zuordnung der Einlage (§ 4 Abs. 1 Satz 8 EStG; GoBD Rz. 37) |
| Gebracht von (transitPerson)<br>Frage: Wer hat das Geld gebracht oder abgeholt?<br>Hilfe: Die Person, die das Bargeld zur Bank, von der Bank oder zur anderen Kasse gebracht hat. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist<br>Warum: Nur bei einem Geldtransit; Bargeld unterwegs muss jemandem zugeordnet sein. | Pflicht | Nachvollziehbarkeit des Geschäftsvorfalls (§ 145 Abs. 1 Satz 2 AO) |
| Betrag in Euro (geldBetrag)<br>Frage: Wie viel Geld war es, in Euro?<br>Hilfe: Der genaue Betrag. | Ausstellende Person | Betrag in Euro | erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ oder „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ oder „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist<br>Warum: Nur bei einer Entnahme, einer Einlage oder einem Geldtransit; eine Ausgabe hat eine eigene Frage nach dem Betrag. | Pflicht | Zu buchender Betrag, Pflichtangabe (GoBD Rz. 77) |
| Zweck der Entnahme (entnahmeZweck)<br>Frage: Wofür wurde das Geld entnommen?<br>Hilfe: Was Sie privat mit dem Geld machen, müssen Sie nicht angeben. Haben Sie sich damit aber eine Ausgabe erstattet, die Sie privat für den Betrieb bezahlt hatten, schreiben Sie das hier – dann ist es keine Privatentnahme. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist<br>Warum: Nur bei einer Privatentnahme; freiwillig, weil der private Zweck die Buchung nicht ändert. | optional | Abgrenzung der Privatentnahme von einer Erstattung betrieblicher Auslagen (§ 4 Abs. 1 Satz 2 EStG) |
| Herkunft des Geldes (einlageHerkunft)<br>Frage: Woher stammt das eingelegte Geld?<br>Hilfe: Zum Beispiel „vom privaten Girokonto abgehoben“ oder „private Ersparnisse“. Das zeigt, dass das Geld aus dem Privatvermögen kommt und keine Einnahme des Betriebs ist. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist<br>Warum: Nur bei einer Einlage: Sie verändert den Gewinn nicht und muss deshalb von einer Einnahme zu unterscheiden sein (§ 4 Abs. 1 Satz 1 und 8 EStG). | Pflicht | Abgrenzung der Einlage von Betriebseinnahmen (§ 4 Abs. 1 Satz 1 und 8 EStG; GoBD Rz. 37) |
| Grund des Geldtransits (transitGrund)<br>Frage: Warum wurde das Geld gebracht?<br>Hilfe: Kurz, z. B. „Tageseinnahmen zur Bank gebracht“ oder „Wechselgeld für die Filiale“. | Ausstellende Person | Text | erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist<br>Warum: Nur bei einem Geldtransit; der Grund erklärt, warum Bargeld bewegt wurde. | Pflicht | Hinreichende Erläuterung des Geschäftsvorfalls (GoBD Rz. 77) |
| Betrag im Kassenbuch (kassenbuchGeld)<br>Frage: Ist der Betrag am selben Tag im Kassenbuch eingetragen?<br>Hilfe: Bargeld, das in die Kasse kommt oder sie verlässt, muss täglich aufgezeichnet werden – bei einem Wechsel zwischen zwei Kassen in beiden Kassenbüchern. | Ausstellende Person | Ja/Nein | erst wenn bei „Entnommen aus“ „bar aus der Kasse des Betriebs“ gewählt ist oder bei „Eingelegt in“ „bar in die Kasse des Betriebs“ gewählt ist oder „Richtung des Geldtransits“ ausgefüllt ist<br>Warum: Nur wenn eine Kasse beteiligt ist: Kasseneinnahmen und Kassenausgaben sind täglich festzuhalten (§ 146 Abs. 1 Satz 2 AO). | Pflicht | Tägliche Kassenaufzeichnung (§ 146 Abs. 1 Satz 2 AO; GoBD Rz. 48) |
| Beleg der Bank liegt bei (bankbeleg)<br>Frage: Geben Sie den Beleg der Bank oder den Kontoauszug mit ab?<br>Hilfe: Zum Beispiel die Einzahlungsquittung oder den Beleg des Geldautomaten. Dieser Fragebogen kann keine Dateien anhängen; geben Sie den Beleg zusammen mit der PDF ab. | Ausstellende Person | Ja/Nein | erst wenn bei „Richtung des Geldtransits“ „aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“ oder „vom Bankkonto in die Kasse (Abhebung bei der Bank oder am Automaten)“ gewählt ist<br>Warum: Nur ein Geldtransit zwischen Kasse und Bank hat einen Beleg der Bank. | Pflicht | Nachweis des Zugangs bzw. Abgangs auf dem Bankkonto; Zuordnung mehrerer Belege zu einer Buchung (GoBD Rz. 71) |

### 7. Angaben zum Eigenbeleg

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Belegnummer (belegnummer)<br>Frage: Welche Nummer bekommt dieser Eigenbeleg?<br>Hilfe: Wenn Sie Eigenbelege selbst fortlaufend nummerieren, z. B. EB-2026-001: höchstens 36 Zeichen, am besten nur Großbuchstaben, Ziffern und Bindestrich. Lassen Sie das Feld leer, vergibt die Kanzlei die Nummer beim Buchen. | Ausstellende Person | Text, höchstens 36 Zeichen | immer | optional | Eindeutige Belegnummer (GoBD Rz. 77); Zuordnung zur Buchung (GoBD Rz. 71) |
| Datum des Eigenbelegs (ausstellungsdatum)<br>Frage: Welches Datum hat dieser Eigenbeleg?<br>Hilfe: In der Regel heute. Den genauen Zeitpunkt der Unterschrift hält die App zusätzlich fest. | Ausstellende Person | Datum, spätestens heute | immer | Pflicht | Zeitnahe Erstellung (GoBD Rz. 46); Prüfhinweise zur Reihenfolge der Daten |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Art des Vorgangs (Ausstellende Person; unabhängig)
  - Rechtsform des Unternehmens (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ oder „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist
    - Hinweis zur Kapitalgesellschaft (Ausstellende Person; Ebene 2) – erst wenn bei „Rechtsform des Unternehmens“ „Kapitalgesellschaft (GmbH, UG oder AG)“ gewählt ist
  - Art der Ausgabe (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
    - Empfänger des Geschenks (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „ein Geschenk an einen Geschäftspartner“ gewählt ist
    - Fahrtenbuch für das Fahrzeug (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „Kraftstoff, Wäsche, Pflege oder Reparatur eines Fahrzeugs des Betriebs“ gewählt ist
    - Hinweis zur Bewirtung (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist
    - Art des Orts der Bewirtung (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist
    - Betrieblicher Anlass (Ausstellende Person; Ebene 2) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist und nicht zutrifft, dass bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist
    - Anlass der Bewirtung (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist
    - Teilnehmende der Bewirtung (Ausstellende Person; Ebene 2) – erst wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist
  - Grund ohne Originalbeleg (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
    - Erläuterung zum fehlenden Beleg (Ausstellende Person; Ebene 2) – erst wenn „Grund ohne Originalbeleg“ ausgefüllt ist
    - Unleserlicher Beleg liegt bei (Ausstellende Person; Ebene 2) – erst wenn bei „Grund ohne Originalbeleg“ „Der Beleg ist unleserlich oder beschädigt“ gewählt ist
    - Zweitschrift angefragt (Ausstellende Person; Ebene 2) – erst wenn bei „Grund ohne Originalbeleg“ „Der Beleg ist verloren gegangen“ oder „Der Beleg ist unleserlich oder beschädigt“ gewählt ist
  - Zahlungsempfänger (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
  - Ort (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
  - Gekauft oder bezahlt (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
  - In Euro bezahlt (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
    - Währung (Ausstellende Person; Ebene 2) – erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist
    - Betrag in der fremden Währung (Ausstellende Person; Ebene 2) – erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist
    - Umrechnung in Euro (Ausstellende Person; Ebene 2) – erst wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist
  - Betrag in Euro (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
  - Zahlungsart (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist
    - Zahlungsnachweis liegt bei (Ausstellende Person; Ebene 2) – erst wenn bei „Zahlungsart“ „mit einer Karte des Betriebs“ oder „per Überweisung vom Konto des Betriebs“ oder „mit privater Karte oder von einem privaten Konto“ oder „über einen Bezahldienst im Internet oder per App“ gewählt ist
    - Ausgabe im Kassenbuch (Ausstellende Person; Ebene 2) – erst wenn bei „Zahlungsart“ „bar aus der Kasse des Betriebs“ gewählt ist
  - Entnommen aus (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist
    - Kasse (Ausstellende Person; Ebene 2) – erst wenn bei „Entnommen aus“ „bar aus der Kasse des Betriebs“ gewählt ist oder bei „Eingelegt in“ „bar in die Kasse des Betriebs“ gewählt ist oder bei „Richtung des Geldtransits“ „aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“ oder „vom Bankkonto in die Kasse (Abhebung bei der Bank oder am Automaten)“ gewählt ist
    - Betrag im Kassenbuch (Ausstellende Person; Ebene 2) – erst wenn bei „Entnommen aus“ „bar aus der Kasse des Betriebs“ gewählt ist oder bei „Eingelegt in“ „bar in die Kasse des Betriebs“ gewählt ist oder „Richtung des Geldtransits“ ausgefüllt ist
  - Eingelegt in (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist
  - Richtung des Geldtransits (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist
    - Von Kasse zu Kasse (Ausstellende Person; Ebene 2) – erst wenn bei „Richtung des Geldtransits“ „aus einer Kasse in eine andere Kasse des Betriebs“ gewählt ist
    - Beleg der Bank liegt bei (Ausstellende Person; Ebene 2) – erst wenn bei „Richtung des Geldtransits“ „aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“ oder „vom Bankkonto in die Kasse (Abhebung bei der Bank oder am Automaten)“ gewählt ist
  - Entnommen von (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist
  - Eingelegt von (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist
  - Gebracht von (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist
  - Betrag in Euro (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ oder „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ oder „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist
  - Zweck der Entnahme (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist
  - Herkunft des Geldes (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist
  - Grund des Geldtransits (Ausstellende Person; Ebene 1) – erst wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Wann ein Eigenbeleg hilft

- Kenntnisnahme durch: Ausstellende Person
- Art: wird in der App gelesen und bestätigt
- Stand: 04.11.2026

> Ein Eigenbeleg ist ein Notbehelf. Er belegt eine Ausgabe, zu der Sie keinen Beleg bekommen haben oder deren Beleg fehlt, oder Geld, das aus dem Betrieb genommen, in den Betrieb gegeben oder zwischen Kasse und Bank bewegt wurde. Fragen Sie bei einer Ausgabe zuerst beim Zahlungsempfänger nach einem Beleg oder einer Zweitschrift; das ist fast immer besser.
>
> Für Spenden, Löhne, die eigene Verpflegung auf Reisen und Fahrten mit dem privaten Fahrzeug genügt ein Eigenbeleg nicht. Bei einer Bewirtung in einer Gaststätte ersetzt er deren Rechnung nicht.

### Keine Vorsteuer

- Kenntnisnahme durch: Ausstellende Person
- Art: wird in der App gelesen und bestätigt
- Stand: 04.11.2026

> Aus einem Eigenbeleg können Sie keine Umsatzsteuer als Vorsteuer abziehen, auch nicht bei kleinen Beträgen; dafür braucht es eine Rechnung des Verkäufers (§ 15 Abs. 1 Satz 1 Nr. 1 Satz 2 UStG). Geben Sie bei einer Ausgabe deshalb den ganzen gezahlten Betrag an.

### Aufbewahren und abgeben

- Kenntnisnahme durch: Ausstellende Person
- Art: wird in der App gelesen und bestätigt
- Stand: 04.11.2026

> Die PDF dieses Fragebogens ist Ihr Beleg. Bewahren Sie sie unverändert als Datei auf, acht Jahre lang (§ 147 Abs. 1 Nr. 4, Abs. 3 AO). Zahlungsnachweise, Belege der Bank und unleserliche Originale geben Sie zusammen mit der PDF ab; dieser Fragebogen kann keine Dateien anhängen.

### Richtige Angaben

- Kenntnisnahme durch: Ausstellende Person
- Art: wird in der App gelesen und bestätigt
- Stand: 04.11.2026

> Ein Eigenbeleg muss stimmen. Wer Belege ausstellt, die nicht stimmen, kann eine Ordnungswidrigkeit begehen (§ 379 Abs. 1 Satz 1 Nr. 1 AO). Viele oder hohe Eigenbelege fallen bei einer Betriebsprüfung auf; bei Zweifeln an der Buchführung darf das Finanzamt schätzen (§ 158 Abs. 2, § 162 Abs. 2 AO).
>
> Bargeld, das in die Kasse kommt oder sie verlässt, gehört am selben Tag ins Kassenbuch (§ 146 Abs. 1 Satz 2 AO).

## Verknüpfung der Teile

Keine.

## Prüfregeln

Keine.

## Zuordnung getrennt eingegangener Teile

Keine.

## Prüfhinweise für den Empfänger (Buchhaltung oder Kanzlei)

Nur Hinweise: Sie blockieren nichts und werden nicht unterschrieben. Sie erscheinen bei der Zusammenführung, sobald alle genannten Teile vorliegen.

- „Ohne Vorsteuer buchen: Ein Eigenbeleg ist keine Rechnung.“ – wenn bei „Art des Vorgangs“ „eine Ausgabe ohne Originalbeleg“ gewählt ist (§ 15 Abs. 1 Satz 1 Nr. 1 Satz 2 UStG; UStAE 15.2a Abs. 1a)
- „Eigenbeleg über eine Ausgabe ab 250 €: Belastbarkeit prüfen und beim Mandanten nach einer Rechnung oder Zweitschrift fragen.“ – wenn „Betrag in Euro“ über 249,99 liegt (Prüfgrenze in Anlehnung an § 33 UStDV, Kleinbetragsrechnung bis 250 €)
- „Keine Zweitschrift angefragt; mit ihr wäre ein Vorsteuerabzug möglich.“ – wenn bei „Zweitschrift angefragt“ „Nein“ gewählt ist (UStAE 15.11 Abs. 1 Satz 4)
- „Der unleserliche Originalbeleg wird nicht mit abgegeben.“ – wenn „Unleserlicher Beleg liegt bei“ mit „Nein“ beantwortet ist (GoBD Rz. 61)
- „Fahrschein oder Parkbeleg verloren: App- und Online-Tickets lassen sich meist neu abrufen; ein Fahrausweis gilt als Rechnung.“ – wenn bei „Art der Ausgabe“ „eine Fahrkarte (Bus, Bahn, Taxi)“ oder „eine Parkgebühr“ gewählt ist und bei „Grund ohne Originalbeleg“ „Der Beleg ist verloren gegangen“ gewählt ist (§ 34 Abs. 1 UStDV)
- „Geschenk: gesondert aufzeichnen; Freigrenze von 50 € je Empfänger und Wirtschaftsjahr prüfen (brutto, da keine Vorsteuer).“ – wenn bei „Art der Ausgabe“ „ein Geschenk an einen Geschäftspartner“ gewählt ist (§ 4 Abs. 5 Satz 1 Nr. 1, Abs. 7 EStG; R 4.10 Abs. 3 EStR)
- „Geschenk über 50 €: Schon dieses Geschenk übersteigt die Freigrenze; nicht abziehbar.“ – wenn bei „Art der Ausgabe“ „ein Geschenk an einen Geschäftspartner“ gewählt ist und „Betrag in Euro“ über 50 liegt (§ 4 Abs. 5 Satz 1 Nr. 1 EStG; R 4.10 Abs. 3 Satz 2 EStR)
- „Fahrtenbuchmethode: Die Gesamtkosten müssen belegt sein; ein Eigenbeleg kann den Nachweis schwächen.“ – wenn „Fahrtenbuch für das Fahrzeug“ mit „Ja“ beantwortet ist (§ 6 Abs. 1 Nr. 4 Satz 3 EStG)
- „Anschaffung: Anlagevermögen und Grenze für geringwertige Wirtschaftsgüter prüfen (ohne abziehbare Vorsteuer, hier brutto).“ – wenn bei „Art der Ausgabe“ „einen Gegenstand, der länger genutzt wird (z. B. ein Gerät)“ gewählt ist (GoBD Rz. 81; § 6 Abs. 2 Satz 1 EStG)
- „Bewirtung per Eigenbeleg: Ort, Tag, Teilnehmende, Anlass und Höhe stehen im Beleg; Nachweis und Abzug prüfen, gesondert aufzeichnen.“ – wenn bei „Art der Ausgabe“ „ein Essen oder Getränke mit Gästen (Bewirtung)“ gewählt ist (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 2, Abs. 7 EStG)
- „Bewirtung in einer Gaststätte ohne deren Rechnung: Die Rechnung ist beizufügen, ein Eigenbeleg ersetzt sie nicht; ohne maschinell erstellte und registrierte Rechnung ist die Ausgabe nicht abziehbar. Zweitschrift beim Betrieb anfordern lassen.“ – wenn bei „Art des Orts der Bewirtung“ „in einem Restaurant, Café oder einer anderen Gaststätte“ gewählt ist (§ 4 Abs. 5 Satz 1 Nr. 2 Satz 3 EStG; R 4.10 Abs. 8 EStR; BMF-Schreiben vom 19.11.2025 Rn. 13)
- „Bewirtung in der eigenen Wohnung: in der Regel Kosten der Lebensführung, keine Betriebsausgabe.“ – wenn bei „Art des Orts der Bewirtung“ „in Ihrer eigenen Wohnung“ gewählt ist (R 4.10 Abs. 6 Satz 8 EStR; § 12 Nr. 1 EStG)
- „Fremde Währung ohne Angabe zur Umrechnung: Kurs prüfen.“ – wenn „In Euro bezahlt“ mit „Nein“ beantwortet ist und „Umrechnung in Euro“ leer ist (GoBD Rz. 77)
- „Privat bezahlt: als Einlage buchen; bei einer Kapitalgesellschaft über das Verrechnungskonto der Gesellschafterin oder des Gesellschafters, bei Beschäftigten als Erstattung ihrer Auslage.“ – wenn bei „Zahlungsart“ „bar aus eigener Tasche“ oder „mit privater Karte oder von einem privaten Konto“ gewählt ist (§ 4 Abs. 1 Satz 8 EStG; GoBD Rz. 37)
- „Unbar vom Betrieb bezahlt: den Eigenbeleg der Bank-, Karten- oder Bezahldienstbuchung zuordnen, nicht zusätzlich buchen.“ – wenn bei „Zahlungsart“ „mit einer Karte des Betriebs“ oder „per Überweisung vom Konto des Betriebs“ oder „über einen Bezahldienst im Internet oder per App“ gewählt ist (GoBD Rz. 41, 71)
- „Unbar bezahlt, aber kein Zahlungsnachweis beigefügt.“ – wenn „Zahlungsnachweis liegt bei“ mit „Nein“ beantwortet ist (GoBD Rz. 79)
- „Barausgabe nicht am Zahltag im Kassenbuch: Kassenbuch prüfen.“ – wenn „Ausgabe im Kassenbuch“ mit „Nein“ beantwortet ist (§ 146 Abs. 1 Satz 2 AO; GoBD Rz. 48)
- „Kapitalgesellschaft: keine Privatentnahme. Auszahlung an eine Gesellschafterin oder einen Gesellschafter als Darlehen, Verrechnung oder Gehalt klären; ohne klare Vereinbarung verdeckte Gewinnausschüttung prüfen.“ – wenn bei „Art des Vorgangs“ „eine Privatentnahme: Geld, das für private Zwecke aus dem Betrieb genommen wurde“ gewählt ist und bei „Rechtsform des Unternehmens“ „Kapitalgesellschaft (GmbH, UG oder AG)“ gewählt ist (§ 8 Abs. 3 Satz 2 KStG)
- „Kapitalgesellschaft: keine Einlage wie bei einem Einzelunternehmen. Zahlung einer Gesellschafterin oder eines Gesellschafters als Darlehen, Verrechnung oder verdeckte Einlage klären.“ – wenn bei „Art des Vorgangs“ „eine Einlage: privates Geld, das in den Betrieb gegeben wurde“ gewählt ist und bei „Rechtsform des Unternehmens“ „Kapitalgesellschaft (GmbH, UG oder AG)“ gewählt ist (§ 8 Abs. 3 Satz 3 KStG)
- „Andere Rechtsform (z. B. Verein oder Genossenschaft): Eine Privatentnahme oder Einlage passt in der Regel nicht; den Vorgang klären.“ – wenn bei „Rechtsform des Unternehmens“ „eine andere (z. B. Verein oder Genossenschaft)“ gewählt ist
- „Über das Bankkonto: Der Kontoauszug zeigt die Zahlung; den Eigenbeleg der Bankbuchung zuordnen, nicht zusätzlich buchen.“ – wenn bei „Entnommen aus“ „vom Bankkonto des Betriebs“ gewählt ist oder bei „Eingelegt in“ „auf das Bankkonto des Betriebs“ gewählt ist (GoBD Rz. 41, 71)
- „Geldtransit: über das Geldtransitkonto buchen, Abgang und Zugang je einmal; weder Einnahme noch Ausgabe und nicht doppelt aus Kassenbuch und Kontoauszug.“ – wenn bei „Art des Vorgangs“ „einen Geldtransit: Geld zwischen Kasse und Bank oder zwischen zwei Kassen des Betriebs“ gewählt ist (GoBD Rz. 41)
- „Bargeld nicht am selben Tag im Kassenbuch: Kassenbuch prüfen.“ – wenn „Betrag im Kassenbuch“ mit „Nein“ beantwortet ist (§ 146 Abs. 1 Satz 2 AO; GoBD Rz. 48)
- „Geldtransit ohne Beleg der Bank: mit dem Kontoauszug abgleichen.“ – wenn „Beleg der Bank liegt bei“ mit „Nein“ beantwortet ist
- „Keine Belegnummer angegeben: beim Buchen eine vergeben.“ – wenn „Belegnummer“ leer ist
- „Eigenbeleg erst in einem späteren Monat erstellt: zeitnah? Kassenbuch und Voranmeldung des Monats prüfen.“ – wenn „Datum des Eigenbelegs“ in einem späteren Kalendermonat als „Tag des Vorgangs“ liegt (GoBD Rz. 46, 47)
- „Der Vorgang liegt nach dem Datum des Eigenbelegs: Daten prüfen.“ – wenn „Tag des Vorgangs“ nach „Datum des Eigenbelegs“ liegt

## Was dieser Fragebogen nicht abdeckt

- Ein Vorgang je Eigenbeleg: eine Ausgabe oder eine Geldbewegung; kein Sammelbeleg.
- Geldbewegungen nur als Geld in Euro. Nicht abgedeckt sind Sachentnahmen (z. B. Waren für den privaten Bedarf), die private Nutzung von Gegenständen des Betriebs und Sacheinlagen.
- Keine Einnahmen: Erlöse ohne Beleg gehören in die Kassen- oder Erlösaufzeichnung.
- Keine Aufteilung in Nettobetrag und Umsatzsteuer; kein Vorsteuerabzug.
- Nicht für eigene Verpflegung auf Reisen, Fahrten mit privaten Fahrzeugen, Löhne und Spenden. Eine Bewirtung lässt sich erfassen, die fehlende Rechnung einer Gaststätte ersetzt der Eigenbeleg aber nicht.
- Nicht gedacht als Bewirtungsbeleg zu einer vorhandenen Rechnung der Gaststätte.
- Dateien lassen sich nicht anhängen; Zahlungsnachweise, Belege der Bank und beschädigte Originale werden getrennt abgegeben.
- Der Fragebogen vergibt keine Belegnummern und prüft nicht, ob eine Nummer schon benutzt wurde.
- Eine fremde Währung nimmt er nur bei Ausgaben auf, als Angabe; er rechnet nicht um.
- Der Fragebogen kontiert und bucht nicht. Wie eine Entnahme oder Einlage bei einer Kapitalgesellschaft zu behandeln ist, klärt die Kanzlei.

## Sonderfälle, die Abschließen und Weitergeben sperren

- Ihre eigene Verpflegung auf Reisen wird mit Pauschalen in der Reisekostenabrechnung berücksichtigt, nicht mit einem Eigenbeleg. – wenn bei „Art der Ausgabe“ „Ihre eigene Verpflegung auf einer Reise“ gewählt ist (§ 4 Abs. 5 Satz 1 Nr. 5 EStG i. V. m. § 9 Abs. 4a EStG)
- Fahrten mit einem privaten Fahrzeug gehören in eine Aufstellung der Fahrten (Reisekosten), nicht in einen Eigenbeleg. – wenn bei „Art der Ausgabe“ „Fahrten mit einem privaten Fahrzeug“ gewählt ist
- Zahlungen an Beschäftigte oder Aushilfen laufen über die Lohnabrechnung, nicht über einen Eigenbeleg. – wenn bei „Art der Ausgabe“ „eine Zahlung an Beschäftigte oder Aushilfen“ gewählt ist (§ 41 Abs. 1 Satz 1 EStG)
- Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers; ein Eigenbeleg genügt nicht. – wenn bei „Art der Ausgabe“ „eine Spende“ gewählt ist (§ 50 Abs. 1 EStDV)
- Mit einer Zweitschrift brauchen Sie keinen Eigenbeleg – geben Sie die Zweitschrift ab. – wenn bei „Zweitschrift angefragt“ „Ja, ich habe eine Zweitschrift bekommen“ gewählt ist (GoBD Rz. 61; UStAE 15.11 Abs. 1 Satz 4)

## Rechtliche Hinweise

- Dieser Eigenbeleg ist keine Rechnung im Sinne des Umsatzsteuergesetzes und berechtigt nicht zum Vorsteuerabzug.
- Privatentnahmen und Einlagen sind weder Betriebsausgaben noch Betriebseinnahmen; sie ändern den Gewinn nicht (§ 4 Abs. 1 Satz 1 EStG).
- Der Fragebogen ist keine Steuer- oder Rechtsberatung. Ob eine Ausgabe als Betriebsausgabe abziehbar ist und wie eine Entnahme, eine Einlage oder ein Geldtransit gebucht wird, entscheidet die Buchhaltung oder Kanzlei im Einzelfall.
