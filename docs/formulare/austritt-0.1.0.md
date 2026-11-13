# Feldkatalog: Austritt: Angaben zum Ende der Beschäftigung

> Aus der Formulardefinition erzeugt. Nicht von Hand ändern: nach jeder Änderung der
> Definition `npm run catalogue` ausführen.

| Angabe | Wert |
| --- | --- |
| Formular | austritt, Version 0.1.0 |
| Status | Entwurf zur fachlichen Freigabe, noch nicht veröffentlicht |
| Gültigkeit | gilt für „Ende des Arbeitsverhältnisses“ ab 01.01.2026 |
| Stand | zuletzt überarbeitet am 13.11.2026 um 10:38 |
| Definition (SHA-256) | 5a502d793981e227865433f0ad90591ca851c0e8643a4fdec154b907b308b26b |
| Unterschrift | Einfache elektronische Unterschrift in der App genügt |
| Warum die Unterschrift in der App genügt | Für diese Mitteilung an die lohnabrechnende Stelle schreibt das Gesetz keine Form vor. Deshalb genügt eine einfache elektronische Signatur – gezeichnet oder als getippter Name (Art. 3 Nr. 10 eIDAS-Verordnung). Sie zeigt, wer die Angaben gemacht hat. Die Kündigung selbst und ein Aufhebungsvertrag brauchen dagegen Papier mit eigenhändiger Unterschrift (§ 623 BGB); dafür genügt diese Unterschrift nicht. |
| Empfänger | Lohnabrechnende Stelle |

## Rollen

| Rolle | Unterschrift | Erforderlich | Name der unterzeichnenden Person | Bestätigungstext |
| --- | --- | --- | --- | --- |
| Arbeitgeber (arbeitgeber) | Pflicht | immer | aus „Angaben gemacht von“ | Ich bestätige, dass die Angaben zum Ende der Beschäftigung richtig und vollständig sind, soweit sie heute feststehen. Steht eine offene Angabe fest oder ändert sich etwas, etwa durch eine Klage oder einen Vergleich, ergänze ich den Fragebogen als neue Fassung. |

## Felder

### 1. Arbeitgeber und ausscheidende Person

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Firma des Arbeitgebers (agFirma)<br>Frage: Wie lautet Ihre Firma?<br>Hilfe: So, wie sie auf dem Briefkopf oder im Handelsregister steht. | Arbeitgeber | Text; Stammdatum „firma“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Kopfzeile des Fragebogens, Zuordnung |
| Betriebsnummer des Arbeitgebers (agBetriebsnummer)<br>Frage: Wie lautet die Betriebsnummer?<br>Hilfe: 8 Ziffern, vergeben von der Bundesagentur für Arbeit. Sie steht auf den Meldungen zur Sozialversicherung; Ihre Lohnabrechnung kennt sie. | Arbeitgeber | Betriebsnummer (8 Ziffern); Stammdatum „betriebsnummer“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Abmeldung zur Sozialversicherung (§ 28a SGB IV); Arbeitsbescheinigung für die Agentur für Arbeit (§ 312 SGB III) |
| Angaben gemacht von (agUnterzeichnerName)<br>Frage: Wer macht diese Angaben und ist Ansprechperson für Rückfragen?<br>Hilfe: Ihr Vor- und Familienname; er steht bei der Unterschrift. | Arbeitgeber | Text; Stammdatum „ansprechpartner“, kann im Stammdaten-Link gemerkt werden | immer | Pflicht | Unterschrift mit Namen; Rückfragen |
| Familienname der beschäftigten Person (agFamilienname)<br>Frage: Wie lautet der Familienname der Person, die ausscheidet? | Arbeitgeber | Text, höchstens 30 Zeichen | immer | Pflicht | Zuordnung in der Lohnabrechnung |
| Vornamen der beschäftigten Person (agVorname)<br>Frage: Wie lauten ihre Vornamen? | Arbeitgeber | Text, höchstens 30 Zeichen | immer | Pflicht | Zuordnung in der Lohnabrechnung |
| Personalnummer (agPersonalnummer)<br>Frage: Welche Personalnummer hat die Person?<br>Hilfe: Sie steht auf der Lohnabrechnung der Person. Nicht zur Hand? Dann lassen Sie das Feld leer. | Arbeitgeber | Text | immer | optional | Zuordnung in der Lohnabrechnung |

### 2. Art und Zeitpunkt des Endes

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Art des Endes (agBeendigungsart)<br>Frage: Wodurch endet das Arbeitsverhältnis mit „‹Vornamen der beschäftigten Person›“ „‹Familienname der beschäftigten Person›“?<br>Hilfe: Wurde einer oder einem Auszubildenden gekündigt, wählen Sie die Kündigung. Ein Wechsel in eine andere Beschäftigung bei Ihnen ist kein Austritt; dann meldet die lohnabrechnende Stelle die Beschäftigung nur um. | Arbeitgeber | Auswahl: Kündigung durch Sie als Arbeitgeber, Kündigung durch die beschäftigte Person, Aufhebungsvertrag (Ende im Einvernehmen), Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt), Ende der Ausbildung ohne Weiterbeschäftigung, Ende kraft Gesetzes oder Tarifvertrags, z. B. durch eine tarifliche Altersgrenze, Tod der beschäftigten Person, Wechsel in eine andere Beschäftigung bei Ihnen (z. B. nach der Ausbildung übernommen, Minijob wird Teilzeitstelle), Übergang des Betriebs oder Betriebsteils auf einen neuen Inhaber | immer | Pflicht | Abgabegrund der Abmeldung zur Sozialversicherung (§ 28a SGB IV; Gemeinsames Rundschreiben Meldeverfahren, Anlagen 1 und 3); Grund der Beendigung in der Arbeitsbescheinigung (§ 312 Abs. 1 S. 1 SGB III) |
| Ende des Arbeitsverhältnisses (agEndeArbeitsverhaeltnis)<br>Frage: An welchem Tag endet das Arbeitsverhältnis?<br>Hilfe: Der rechtlich letzte Tag: bei einer Kündigung der Tag, zu dem gekündigt wurde; sonst das Ende der Befristung oder der Tag laut Aufhebungsvertrag; beim Tod der Sterbetag. Nicht der letzte Arbeitstag vor Resturlaub oder Freistellung. | Arbeitgeber | Datum | immer | Pflicht | Abmeldung zur Sozialversicherung (§ 28a Abs. 1 S. 1 Nr. 2 SGB IV, § 8 Abs. 1 DEÜV); Ende des Dienstverhältnisses an das Bundeszentralamt für Steuern (§ 39e Abs. 4 S. 5 EStG); Abschluss des Lohnkontos (§ 41b Abs. 1 EStG); Arbeitsbescheinigung (§ 312 SGB III) |
| Freistellung bis zum Ende (agFreistellung)<br>Frage: Ist die Person bis zum Ende von der Arbeit freigestellt?<br>Hilfe: Unwiderruflich heißt: Sie können die Person nicht mehr zur Arbeit zurückholen. Urlaub zählt nicht als Freistellung. Soll offener Urlaub in die Freistellung fallen, legen Sie das bitte ausdrücklich fest. | Arbeitgeber | Auswahl: Nein, die Person arbeitet bis zum Ende, Ja, aber Sie können sie zurückholen (widerruflich), Ja, unwiderruflich und bezahlt, im Einvernehmen mit der Person, Ja, unwiderruflich und bezahlt, von Ihnen angeordnet, Ja, ohne Bezahlung | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod gibt es keine Freistellung mehr. | Pflicht | Ende des Beschäftigungsverhältnisses in der Arbeitsbescheinigung (§ 312 SGB III); Fortbestand der versicherungspflichtigen Beschäftigung (§ 7 Abs. 3 SGB IV) |
| Freigestellt ab (agFreistellungAb)<br>Frage: Ab welchem Tag ist die Person freigestellt?<br>Hilfe: Der erste Tag ohne Arbeitspflicht. | Arbeitgeber | Datum, nicht nach „Ende des Arbeitsverhältnisses“ | erst wenn bei „Freistellung bis zum Ende“ „Ja, unwiderruflich und bezahlt, im Einvernehmen mit der Person“ oder „Ja, unwiderruflich und bezahlt, von Ihnen angeordnet“ oder „Ja, ohne Bezahlung“ gewählt ist<br>Warum: Nur eine unwiderrufliche oder unbezahlte Freistellung beendet die Beschäftigung für die Arbeitsbescheinigung schon vor dem Ende (BA-Verfahrensbeschreibung zur Arbeitsbescheinigung); ohne Bezahlung besteht die Versicherung nur bis zu einem Monat fort (§ 7 Abs. 3 S. 1 SGB IV). | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Beginn der Freistellung; Abmeldung zur Sozialversicherung (§ 7 Abs. 3 SGB IV) |
| Befristetes Arbeitsverhältnis (agBefristet)<br>Frage: War das Arbeitsverhältnis befristet?<br>Hilfe: Auch eine Befristung bis zum Erreichen eines Zwecks zählt, etwa eine Vertretung. | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ oder „Ende der Ausbildung ohne Weiterbeschäftigung“ oder „Tod der beschäftigten Person“ gewählt ist<br>Warum: Beim Ende einer Befristung steht die Befristung schon fest; das Ende einer Ausbildung und der Tod brauchen die Angabe nicht. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): befristetes Arbeitsverhältnis und wann die Befristung geendet hätte |
| Art der Befristung (agBefristungsart)<br>Frage: Wie war das Arbeitsverhältnis befristet? | Arbeitgeber | Auswahl: bis zu einem festen Datum, bis ein Zweck erreicht ist (zweckbefristet) | erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einer Befristung kommt es darauf an, ob sie an ein Datum oder an einen Zweck geknüpft ist (§ 3 Abs. 1, § 15 TzBfG). | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Art der Befristung |
| Befristung schriftlich vereinbart (agBefristungSchriftlich)<br>Frage: Wurde die Befristung schriftlich vereinbart?<br>Hilfe: Schriftlich heißt: auf Papier, von beiden Seiten eigenhändig unterschrieben, vor dem ersten Arbeitstag. Ohne diese Form gilt das Arbeitsverhältnis in der Regel als unbefristet. | Arbeitgeber | Auswahl: Ja, Nein | erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist<br>Warum: Eine Befristung ist nur mit schriftlicher Vereinbarung wirksam; sonst gilt das Arbeitsverhältnis als unbefristet (§ 14 Abs. 4, § 16 TzBfG). | Pflicht | Wirksamkeit der Befristung (§ 14 Abs. 4, § 16 TzBfG); Arbeitsbescheinigung (§ 312 SGB III) |
| Befristet laut erstem Vertrag bis (agBefristungUrspruenglichBis)<br>Frage: Bis wann war das Arbeitsverhältnis im ersten Vertrag befristet?<br>Hilfe: Wurde die Befristung verlängert: das Ende laut dem ersten befristeten Vertrag. Bei einer Zweckbefristung: wann das Arbeitsverhältnis damals voraussichtlich enden sollte. | Arbeitgeber | Datum | erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist<br>Warum: Nur ein befristetes Arbeitsverhältnis hat ein ursprünglich vereinbartes Ende; die Arbeitsbescheinigung fragt danach. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): ursprüngliche Befristung |
| Befristet bis (agBefristetBis)<br>Frage: Bis wann war das Arbeitsverhältnis zuletzt befristet?<br>Hilfe: Nach einer Verlängerung das neue Ende; bei einer Zweckbefristung das voraussichtliche Ende. | Arbeitgeber | Datum | erst wenn „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist<br>Warum: Endet ein befristetes Arbeitsverhältnis vorzeitig auf andere Weise, fragt die Arbeitsbescheinigung, wann die Befristung geendet hätte. | Pflicht | Ende der Beschäftigung in der Lohnabrechnung; Arbeitsbescheinigung (§ 312 SGB III): wann die Befristung geendet hätte |

### 3. Kündigung

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Form der Kündigung (agKuendigungForm)<br>Frage: In welcher Form wurde gekündigt?<br>Hilfe: Wirksam ist nur eine Kündigung auf Papier mit eigenhändiger Unterschrift, im Original übergeben oder geschickt. E-Mail, Fax, Messenger, ein Scan oder eine elektronische Signatur genügen nicht, auch nicht bei einer Kündigung durch die Person (§ 623 BGB). Ist das passiert, sprechen Sie bitte vor der Abrechnung mit Ihrer lohnabrechnenden Stelle. | Arbeitgeber | Auswahl: Auf Papier, eigenhändig unterschrieben, im Original übergeben oder geschickt, Anders, z. B. per E-Mail, Fax, Messenger, als Scan, elektronisch signiert oder mündlich | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung; sie bedarf der Schriftform (§ 623 BGB). | Pflicht | Wirksamkeit der Kündigung (§ 623 BGB); Arbeitsbescheinigung (§ 312 SGB III): Kündigung schriftlich |
| Datum des Kündigungsschreibens (agKuendigungDatum)<br>Frage: Welches Datum trägt das Kündigungsschreiben? | Arbeitgeber | Datum, nicht nach „Ende des Arbeitsverhältnisses“ | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Tag der Kündigung |
| Zugang der Kündigung (agKuendigungZugang)<br>Frage: An welchem Tag ist die Kündigung zugegangen?<br>Hilfe: Haben Sie gekündigt: der Tag, an dem die Person das Schreiben erhalten hat. Hat die Person gekündigt: der Tag, an dem es bei Ihnen ankam. Erst mit dem Zugang wirkt die Kündigung (§ 130 BGB); ab dann laufen die Kündigungsfrist und die Klagefrist. Diesen Tag meldet die lohnabrechnende Stelle als Tag der Kündigung. | Arbeitgeber | Datum, nicht vor „Datum des Kündigungsschreibens“, nicht nach „Ende des Arbeitsverhältnisses“ | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung; sie wirkt erst mit dem Zugang (§ 130 Abs. 1 BGB). | Pflicht | Kündigungsfrist (§ 622 BGB) und Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 2 SGB III); Klagefrist (§ 4 KSchG) |
| Zustellung der Kündigung (agKuendigungZustellung)<br>Frage: Wie wurde die Kündigung zugestellt? | Arbeitgeber | Auswahl: Persönlich übergeben, Per Post, Durch einen Boten, z. B. Einwurf in den Briefkasten | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Art der Zustellung |
| Art der Kündigung (agKuendigungArt)<br>Frage: Wie wurde gekündigt?<br>Hilfe: Fristlos kündigen kann man nur innerhalb von zwei Wochen, nachdem man die Gründe erfahren hat (§ 626 Abs. 2 BGB). | Arbeitgeber | Auswahl: Ordentlich, mit Kündigungsfrist, Fristlos (außerordentlich), Außerordentlich mit einer Auslauffrist | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III); Ruhen des Arbeitslosengelds bei einer Abfindung (§ 158 SGB III) |
| Kündigung in der Probezeit (agKuendigungProbezeit)<br>Frage: Ging die Kündigung während einer vereinbarten Probezeit zu?<br>Hilfe: In einer Probezeit von höchstens sechs Monaten gilt eine Frist von zwei Wochen (§ 622 Abs. 3 BGB). | Arbeitgeber | Ja/Nein | erst wenn bei „Art der Kündigung“ „Ordentlich, mit Kündigungsfrist“ gewählt ist<br>Warum: Nur bei einer ordentlichen Kündigung kommt es auf die Frist an; in der Probezeit ist sie kürzer (§ 622 Abs. 3 BGB). | Pflicht | Maßgebende Kündigungsfrist in der Arbeitsbescheinigung (§ 312 SGB III) |
| Weitere Vereinbarung über das Ende (agZusatzvereinbarung)<br>Frage: Gibt es neben der Kündigung eine weitere Vereinbarung über das Ende, z. B. einen Abwicklungsvertrag oder einen gerichtlichen Vergleich?<br>Hilfe: Hat ein Vergleich das Ende verschoben, ändern Sie in diesem Fragebogen auch den Tag, an dem das Arbeitsverhältnis endet. | Arbeitgeber | Ja/Nein | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist<br>Warum: Nur bei einer Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): zusätzliche Vereinbarungen zur Kündigung |
| Kündigungsschutzklage (agKuendigungsschutzklage)<br>Frage: Hat die Person gegen die Kündigung geklagt?<br>Hilfe: Die Frist für eine Kündigungsschutzklage beträgt drei Wochen ab Zugang (§ 4 KSchG). Klagt die Person später oder endet ein Verfahren, ergänzen Sie den Fragebogen als neue Fassung; eine schon übermittelte Arbeitsbescheinigung wird dann ersetzt. | Arbeitgeber | Auswahl: Ja, Nein, und die Klagefrist ist abgelaufen, Steht noch nicht fest (die Frist läuft noch, oder ich weiß es nicht) | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist<br>Warum: Klagen kann nur, wem gekündigt wurde (§ 4 KSchG). | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Kündigungsschutzklage; Nachzahlung und Ruhen des Arbeitslosengelds (§ 157 Abs. 3 SGB III) |

### 4. Ihre Kündigung: Anlass

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Kündigung wegen vertragswidrigen Verhaltens (agVertragswidrig)<br>Frage: Haben Sie gekündigt, weil die Person gegen ihre Pflichten aus dem Arbeitsvertrag verstoßen hat?<br>Hilfe: Bitte nur Ja oder Nein, keine Schilderung. | Arbeitgeber | Ja/Nein | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist<br>Warum: Den Anlass bescheinigt die Arbeitsbescheinigung nur bei einer Kündigung durch den Arbeitgeber. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Anlass der Kündigung; Sperrzeit (§ 159 Abs. 1 S. 2 Nr. 1 SGB III) |
| Abmahnung wegen desselben Verhaltens (agAbmahnung)<br>Frage: Haben Sie die Person wegen desselben Verhaltens schon abgemahnt? | Arbeitgeber | Ja/Nein | erst wenn „Kündigung wegen vertragswidrigen Verhaltens“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einer Kündigung wegen vertragswidrigen Verhaltens fragt die Arbeitsbescheinigung nach einer Abmahnung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Abmahnung |
| Datum der letzten Abmahnung (agAbmahnungDatum)<br>Frage: Wann haben Sie die Person zuletzt wegen dieses Verhaltens abgemahnt?<br>Hilfe: Bei mehreren Abmahnungen die jüngste. | Arbeitgeber | Datum | erst wenn „Abmahnung wegen desselben Verhaltens“ mit „Ja“ beantwortet ist<br>Warum: Nur nach einer Abmahnung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Datum der Abmahnung |
| Abfindungsangebot im Kündigungsschreiben (§ 1a KSchG) (agAbfindungsangebot1a)<br>Frage: Haben Sie aus betrieblichen Gründen gekündigt und im Kündigungsschreiben eine Abfindung für den Fall angeboten, dass die Person nicht klagt?<br>Hilfe: „Ja“ nur, wenn dieser Hinweis im Kündigungsschreiben steht (§ 1a KSchG). Eine betriebsbedingte Kündigung ohne dieses Angebot ist „Nein“. | Arbeitgeber | Ja/Nein | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist<br>Warum: Das Angebot nach § 1a KSchG gibt es nur bei einer Kündigung durch den Arbeitgeber. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): betriebsbedingte Kündigung mit Abfindungsangebot |
| Sozialauswahl (agSozialauswahl)<br>Frage: Haben Sie vor der Kündigung eine Sozialauswahl getroffen?<br>Hilfe: Bei einer Kündigung aus betrieblichen Gründen wählen Sie unter vergleichbaren Beschäftigten nach Betriebszugehörigkeit, Lebensalter, Unterhaltspflichten und Schwerbehinderung aus (§ 1 Abs. 3 KSchG). | Arbeitgeber | Auswahl: Ja, Nein, Entfällt, weil die Kündigung personenbedingt ist | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist<br>Warum: Eine Sozialauswahl gibt es nur bei einer Kündigung durch den Arbeitgeber (§ 1 Abs. 3 KSchG). | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Sozialauswahl |
| Teil einer angezeigten Massenentlassung (agMassenentlassung)<br>Frage: Gehört die Kündigung zu einer Massenentlassung, die Sie der Agentur für Arbeit angezeigt haben?<br>Hilfe: Das betrifft nur Betriebe mit mehr als 20 Beschäftigten, die innerhalb von 30 Tagen mehrere Beschäftigte entlassen (§ 17 KSchG). | Arbeitgeber | Ja/Nein | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist<br>Warum: Eine Massenentlassung zeigt nur der kündigende Arbeitgeber an (§ 17 KSchG). | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Prüfung der Sozialauswahl durch die Agentur für Arbeit |
| Agentur für Arbeit der Anzeige (agMassenentlassungAgentur)<br>Frage: Welche Agentur für Arbeit hat die Anzeige erhalten?<br>Hilfe: Der Ort genügt, z. B. „Agentur für Arbeit Musterstadt“; die lohnabrechnende Stelle ergänzt die Nummer der Agentur. | Arbeitgeber | Text | erst wenn „Teil einer angezeigten Massenentlassung“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einer angezeigten Massenentlassung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Agentur der Anzeige |

### 5. Aufhebungsvertrag

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Aufhebungsvertrag geschlossen am (agAufhebungsvertragAm)<br>Frage: An welchem Tag wurde der Aufhebungsvertrag geschlossen?<br>Hilfe: Der Tag, an dem beide Seiten unterschrieben hatten. | Arbeitgeber | Datum | erst wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Nur bei einem Aufhebungsvertrag. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Tag des Aufhebungsvertrags; Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 2 SGB III) |
| Form des Aufhebungsvertrags (agAufhebungsvertragForm)<br>Frage: In welcher Form wurde der Aufhebungsvertrag geschlossen?<br>Hilfe: Auch ein Aufhebungsvertrag ist nur auf Papier mit den eigenhändigen Unterschriften beider Seiten wirksam (§ 623 BGB). Ist das nicht so, sprechen Sie bitte vor der Abrechnung mit Ihrer lohnabrechnenden Stelle. | Arbeitgeber | Auswahl: Auf Papier, von beiden Seiten eigenhändig unterschrieben, Anders, z. B. per E-Mail, als Scan, elektronisch signiert oder mündlich | erst wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Nur bei einem Aufhebungsvertrag; er bedarf der Schriftform (§ 623 BGB). | Pflicht | Wirksamkeit des Aufhebungsvertrags (§ 623 BGB) |

### 6. Hätten Sie selbst gekündigt?

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Arbeitgeber hätte sonst gekündigt (agHaetteGekuendigt)<br>Frage: Hätten Sie das Arbeitsverhältnis sonst selbst gekündigt?<br>Hilfe: Bitte wahrheitsgemäß: Die Angabe geht in die Arbeitsbescheinigung, und die Agentur für Arbeit kann nachfragen. | Arbeitgeber | Auswahl: Nein, Ja, zum selben Zeitpunkt, Ja, aber zu einem anderen Zeitpunkt | erst wenn bei „Art des Endes“ „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Die Arbeitsbescheinigung fragt danach nur bei einer Kündigung durch die Person oder einem Aufhebungsvertrag. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Beendigungsgrund; wichtiger Grund bei der Sperrzeit (§ 159 Abs. 1 SGB III) |
| Hätte gekündigt am (agHaetteGekuendigtAm)<br>Frage: An welchem Tag hätten Sie gekündigt? | Arbeitgeber | Datum | erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist<br>Warum: Nur wenn Sie sonst selbst gekündigt hätten. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Kündigung des Arbeitgebers am |
| Hätte gekündigt zum (agHaetteGekuendigtZum)<br>Frage: Zu welchem Tag hätten Sie gekündigt?<br>Hilfe: Der letzte Tag, den das Arbeitsverhältnis dann gehabt hätte. | Arbeitgeber | Datum, nicht vor „Hätte gekündigt am“ | erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist<br>Warum: Nur wenn Sie sonst selbst gekündigt hätten. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Kündigung des Arbeitgebers zum |
| Hätte wegen vertragswidrigen Verhaltens gekündigt (agHaetteVertragswidrig)<br>Frage: Hätten Sie gekündigt, weil die Person gegen ihre Pflichten aus dem Arbeitsvertrag verstoßen hat?<br>Hilfe: Bitte nur Ja oder Nein, keine Schilderung. | Arbeitgeber | Ja/Nein | erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist<br>Warum: Nur wenn Sie sonst selbst gekündigt hätten. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Anlass der Kündigung, die erfolgt wäre |

### 7. Kündigungsfrist und Sonderregeln

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Kündigungsfrist des Arbeitgebers (Zahl) (agKuendigungsfrist)<br>Frage: Welche Frist hätte für eine ordentliche Kündigung durch Sie gegolten? Bitte zuerst nur die Zahl.<br>Hilfe: Gemeint ist immer die Frist für Ihre Kündigung als Arbeitgeber – auch wenn die Person gekündigt hat oder Sie einen Aufhebungsvertrag geschlossen haben –, und zwar am Tag der Kündigung oder des Vertrags. Sie ergibt sich aus dem Gesetz, einem Tarifvertrag oder dem Arbeitsvertrag; in einer vereinbarten Probezeit sind es zwei Wochen. Beispiel „2 Monate zum Monatsende“: Tragen Sie 2 ein. Die App berechnet die Frist nicht. | Arbeitgeber | Zahl, ganzzahlig, mindestens 1 | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Beim Ende einer Befristung oder Ausbildung und beim Tod fragt die Arbeitsbescheinigung keine Kündigungsfrist. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): maßgebende Kündigungsfrist; Ruhen des Arbeitslosengelds bei einer Abfindung (§ 158 Abs. 1 SGB III) |
| Einheit der Kündigungsfrist (agKuendigungsfristEinheit)<br>Frage: In welcher Einheit ist die Frist bemessen? | Arbeitgeber | Auswahl: Tage (Kalendertage), Werktage, Wochen, Monate | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Beim Ende einer Befristung oder Ausbildung und beim Tod fragt die Arbeitsbescheinigung keine Kündigungsfrist. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Einheit der Kündigungsfrist |
| Termin der Kündigungsfrist (agKuendigungsfristZum)<br>Frage: Zu welchem Termin endet die Frist?<br>Hilfe: Bei der gesetzlichen Grundfrist von vier Wochen sind der 15. und das Monatsende möglich (§ 622 Abs. 1 BGB); maßgeblich ist dann der frühere Termin, zu dem die Frist ab dem Zugang noch gewahrt wäre. | Arbeitgeber | Auswahl: zum Ende einer Woche, zum 15. eines Monats, zum Monatsende, zum Ende eines Vierteljahres, zum Ende eines Halbjahres, zum Jahresende, ohne festen Termin | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Beim Ende einer Befristung oder Ausbildung und beim Tod fragt die Arbeitsbescheinigung keine Kündigungsfrist. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Termin der Kündigungsfrist |
| Sonderregel für die ordentliche Kündigung (agSonderregelKuendigung)<br>Frage: War eine ordentliche Kündigung durch Sie ausgeschlossen oder nur gegen eine Abfindung erlaubt?<br>Hilfe: Zum Beispiel durch einen besonderen Kündigungsschutz, einen Tarifvertrag („unkündbar“), eine Betriebsvereinbarung oder eine Befristung ohne vereinbartes Kündigungsrecht. Den Grund nennen Sie bitte nicht. | Arbeitgeber | Ja/Nein | erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist<br>Warum: Beim Ende einer Befristung oder Ausbildung und beim Tod fragt die Arbeitsbescheinigung keine Kündigungsfrist und keine Sonderregel. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Ausschluss der ordentlichen Kündigung; Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 3, 4 SGB III) |
| Ordentliche Kündigung ausgeschlossen (agKuendigungsausschluss)<br>Frage: War die ordentliche Kündigung ausgeschlossen?<br>Hilfe: Ein Kündigungsschutz, bei dem vorher eine Behörde zustimmen muss, zählt als „für eine begrenzte Zeit“. | Arbeitgeber | Auswahl: Nein, Ja, für eine begrenzte Zeit, Ja, auf Dauer (z. B. tariflich unkündbar) | erst wenn „Sonderregel für die ordentliche Kündigung“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einer Sonderregel für die ordentliche Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Ausschluss der ordentlichen Kündigung; Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 3 SGB III) |
| Trotz Ausschluss aus wichtigem Grund mit Frist (agAusschlussWichtigerGrund)<br>Frage: Hätten Sie trotzdem aus wichtigem Grund mit einer Frist kündigen können, z. B. bei einer Stilllegung des Betriebs? | Arbeitgeber | Ja/Nein | erst wenn bei „Ordentliche Kündigung ausgeschlossen“ „Ja, auf Dauer (z. B. tariflich unkündbar)“ gewählt ist<br>Warum: Nur wenn die ordentliche Kündigung auf Dauer ausgeschlossen war. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III); Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 3 Nr. 2 SGB III) |
| Ordentliche Kündigung nur gegen Abfindung (agNurGegenAbfindung)<br>Frage: Durften Sie ordentlich nur gegen eine Abfindung kündigen?<br>Hilfe: Zum Beispiel nach einem Tarifvertrag oder dem Arbeitsvertrag. | Arbeitgeber | Ja/Nein | erst wenn „Sonderregel für die ordentliche Kündigung“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einer Sonderregel für die ordentliche Kündigung. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III); Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 4 SGB III) |
| Zugleich wichtiger Grund für eine Kündigung mit Frist (agNurGegenAbfindungWichtigerGrund)<br>Frage: Lag zugleich ein wichtiger Grund für eine Kündigung mit Frist vor, z. B. eine Stilllegung des Betriebs? | Arbeitgeber | Ja/Nein | erst wenn „Ordentliche Kündigung nur gegen Abfindung“ mit „Ja“ beantwortet ist<br>Warum: Nur wenn die ordentliche Kündigung nur gegen eine Abfindung erlaubt war. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III); Ruhen des Arbeitslosengelds (§ 158 Abs. 1 S. 4 SGB III) |

### 8. Abfindung und Zahlungen wegen des Endes

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Abfindung oder ähnliche Leistung (agAbfindung)<br>Frage: Erhält die Person wegen des Endes eine Abfindung oder eine ähnliche Leistung?<br>Hilfe: Dazu zählen auch Leistungen aus einem Sozialplan oder einem gerichtlichen Vergleich, Sachwerte und Beiträge zur Altersversorgung, die wegen des Endes gezahlt werden. Nicht dazu: Lohn, der noch aussteht, Jubiläumsgeld oder Treueprämien. | Arbeitgeber | Auswahl: Nein, Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist), Steht noch nicht fest, z. B. wegen Verhandlungen oder einer Klage | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod gibt es keine Abfindung wegen des Verlusts des Arbeitsplatzes. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Entlassungsentschädigung; Lohnsteuer (§ 24 Nr. 1, § 34 EStG); Beitragspflicht in der Sozialversicherung (§ 14 SGB IV) |
| Abfindung brutto (agAbfindungBrutto)<br>Frage: Wie hoch ist die Abfindung brutto?<br>Hilfe: Auch bei einer Netto-Vereinbarung den Bruttobetrag. Steht die Höhe noch nicht fest, lassen Sie das Feld leer und tragen sie vor der letzten Abrechnung in der neuen Fassung nach. | Arbeitgeber | Betrag in Euro | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Nur bei einer Abfindung. | optional | Arbeitsbescheinigung (§ 312 SGB III): Höhe der Entlassungsentschädigung; Lohnsteuer (§ 39b Abs. 3 EStG) |
| Grundlage der Abfindung (agAbfindungGrundlage)<br>Frage: Worauf beruht die Abfindung? | Arbeitgeber | Auswahl: Aufhebungsvertrag, Abwicklungsvertrag nach einer Kündigung, gerichtlicher Vergleich, Sozialplan, Angebot im Kündigungsschreiben (§ 1a KSchG), Tarifvertrag oder Betriebsvereinbarung, etwas anderes | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Nur bei einer Abfindung. | Pflicht | Einordnung als Entschädigung (§ 24 Nr. 1 EStG); Arbeitsbescheinigung (§ 312 SGB III) |
| Auszahlung der Abfindung (agAbfindungAuszahlung)<br>Frage: Wie wird die Abfindung ausgezahlt? | Arbeitgeber | Auswahl: in einem Betrag, in Teilbeträgen im selben Kalenderjahr, verteilt auf mehrere Kalenderjahre | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Nur bei einer Abfindung. | Pflicht | Zufluss je Kalenderjahr in der Lohnabrechnung; ermäßigte Besteuerung nur in der Veranlagung (§ 34 EStG) |
| Auszahlung der Abfindung am (agAbfindungAuszahlungAm)<br>Frage: Wann wird die Abfindung ausgezahlt?<br>Hilfe: Bei Teilbeträgen der Tag der ersten Zahlung. Steht der Tag noch nicht fest, lassen Sie das Feld leer und tragen ihn in der neuen Fassung nach. | Arbeitgeber | Datum | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Nur bei einer Abfindung. | optional | Abrechnungsmonat der Abfindung; Lohnkonto (§ 41 EStG) |
| Abfindung enthält Arbeitsentgelt (agAbfindungEnthaeltEntgelt)<br>Frage: Stecken in der Abfindung Beträge, die der Person ohnehin zustehen, z. B. Lohn bis zum Ende, ein Bonus, Überstunden oder Urlaub?<br>Hilfe: Solche Teile sind Arbeitsentgelt und werden anders abgerechnet als die Abfindung. | Arbeitgeber | Ja/Nein | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Nur bei einer Abfindung. | Pflicht | Beitragspflichtiges Arbeitsentgelt in der Abfindung (§ 14 SGB IV); Arbeitsbescheinigung (§ 312 SGB III) |
| In der Abfindung enthaltenes Arbeitsentgelt (agAbfindungEnthaeltEntgeltText)<br>Frage: Welche Beträge sind das?<br>Hilfe: Art und Betrag, z. B. „Bonus 2026: 1.500 €“. | Arbeitgeber | Text, mehrzeilig | erst wenn „Abfindung enthält Arbeitsentgelt“ mit „Ja“ beantwortet ist<br>Warum: Nur wenn die Abfindung Arbeitsentgelt enthält. | Pflicht | Beitragspflichtiges Arbeitsentgelt in der Abfindung (§ 14 SGB IV) |
| Abfindung auch bei Kündigung durch den Arbeitgeber (agAbfindungAuchBeiAgKuendigung)<br>Frage: Hätten Sie die Abfindung auch gezahlt, wenn Sie selbst gekündigt hätten? | Arbeitgeber | Ja/Nein | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist<br>Warum: Nur bei einer Abfindung und wenn Sie sonst selbst gekündigt hätten. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Abfindung auch bei Kündigung durch den Arbeitgeber |
| Ununterbrochen im Betrieb seit (agBetriebszugehoerigkeitSeit)<br>Frage: Seit wann gehört die Person ohne Unterbrechung zu Ihrem Betrieb oder Unternehmen?<br>Hilfe: Zeiten vor einem Betriebsübergang zählen mit. Ist es der Tag des Eintritts, den die lohnabrechnende Stelle kennt, lassen Sie das Feld leer. | Arbeitgeber | Datum, nicht nach „Ende des Arbeitsverhältnisses“ | erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist<br>Warum: Die Arbeitsbescheinigung fragt die Betriebszugehörigkeit nur bei einer Abfindung. | optional | Arbeitsbescheinigung (§ 312 SGB III): Betriebs- oder Unternehmenszugehörigkeit |
| Grund, warum die Leistung offen ist (agUngewissGrund)<br>Frage: Warum steht die Leistung noch nicht fest? | Arbeitgeber | Auswahl: Der Anspruch ist streitig, z. B. in einem Gerichtsverfahren, Der Anspruch ist noch unklar, Die Abrechnung ist noch nicht abgeschlossen, Aus einem anderen Grund | erst wenn bei „Abfindung oder ähnliche Leistung“ „Steht noch nicht fest, z. B. wegen Verhandlungen oder einer Klage“ gewählt ist<br>Warum: Nur wenn eine Abfindung noch nicht feststeht. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Grund einer ungewissen Leistung |
| Arbeitsentgelt über das Ende hinaus (agEntgeltUeberEnde)<br>Frage: Zahlen Sie Arbeitsentgelt für eine Zeit nach dem letzten Tag des Arbeitsverhältnisses?<br>Hilfe: Selten, etwa wenn ein Vergleich Lohn für eine Zeit nach dem Ende vorsieht. Abfindung und offene Urlaubstage zählen hier nicht. | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod gibt es kein Arbeitsentgelt für spätere Zeiten. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Arbeitsentgelt über das Ende hinaus |
| Arbeitsentgelt über das Ende hinaus bis (agEntgeltUeberEndeBis)<br>Frage: Bis zu welchem Tag zahlen Sie Arbeitsentgelt? | Arbeitgeber | Datum, nicht vor „Ende des Arbeitsverhältnisses“ | erst wenn „Arbeitsentgelt über das Ende hinaus“ mit „Ja“ beantwortet ist<br>Warum: Nur bei Arbeitsentgelt über das Ende hinaus. | Pflicht | Arbeitsbescheinigung (§ 312 SGB III): Arbeitsentgelt über das Ende hinaus bis |

### 9. Urlaub, Überstunden und Arbeitszeitkonto

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Offene Urlaubstage am Ende (agResturlaubTage)<br>Frage: Wie viele Urlaubstage sind am letzten Tag des Arbeitsverhältnisses noch offen?<br>Hilfe: Gesetzlicher, vertraglicher und Zusatzurlaub, auch übertragener Urlaub aus dem Vorjahr. Urlaub verfällt in der Regel nur, wenn Sie die Person rechtzeitig darauf hingewiesen haben. Urlaub, der bis zum Ende noch fest geplant ist, zählt als genommen; beim Tod zählen die am Sterbetag offenen Tage. Offene Tage werden ausgezahlt; 0, wenn alles genommen ist. Steht die Zahl noch nicht fest, lassen Sie das Feld leer und tragen sie vor der letzten Abrechnung in der neuen Fassung nach. | Arbeitgeber | Zahl, 1 Nachkommastellen, in Tage, mindestens 0, höchstens 366, in Schritten von 0,5 | immer | optional | Urlaubsabgeltung (§ 7 Abs. 4 BUrlG, § 17 Abs. 3 BEEG); Arbeitsbescheinigung (§ 312 SGB III); Urlaubsbescheinigung (§ 6 Abs. 2 BUrlG) |
| Im Kalenderjahr des Endes genommene Urlaubstage (agUrlaubGenommenTage)<br>Frage: Wie viele Urlaubstage hat die Person im Kalenderjahr des Endes genommen?<br>Hilfe: Bis zum letzten Tag, einschließlich der Tage, die noch fest geplant sind. Die Zahl geht in die Urlaubsbescheinigung, die die Person beim Ende erhält. Steht sie noch nicht fest, lassen Sie das Feld leer und tragen sie in der neuen Fassung nach. | Arbeitgeber | Zahl, 1 Nachkommastellen, in Tage, mindestens 0, höchstens 366, in Schritten von 0,5 | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod braucht niemand mehr eine Urlaubsbescheinigung für einen neuen Arbeitgeber. | optional | Urlaubsbescheinigung (§ 6 Abs. 2 BUrlG) |
| Überstunden mit der letzten Abrechnung (agUeberstunden)<br>Frage: Werden mit der letzten Abrechnung Überstunden ausgezahlt?<br>Hilfe: Nur Stunden, die nicht auf einem Arbeitszeitkonto stehen; das Arbeitszeitkonto folgt gleich danach. | Arbeitgeber | Auswahl: Nein, Ja, Steht noch nicht fest | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Zahlungen gesammelt als Zahlungen an die Erben. | Pflicht | Vergütung in der letzten Abrechnung; Arbeitsbescheinigung (§ 312 SGB III): letzte vollständige Abrechnung |
| Auszuzahlende Überstunden (agUeberstundenAuszahlen)<br>Frage: Wie viele Überstunden werden ausgezahlt? | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std., mindestens 0 | erst wenn bei „Überstunden mit der letzten Abrechnung“ „Ja“ gewählt ist<br>Warum: Nur wenn Überstunden ausgezahlt werden. | Pflicht | Vergütung in der letzten Abrechnung |
| Arbeitszeitkonto (agZeitkonto)<br>Frage: Führen Sie für die Person ein Arbeitszeitkonto?<br>Hilfe: Gemeint ist ein Gleitzeit- oder Jahresarbeitszeitkonto, kein Langzeitkonto; danach fragt der Fragebogen gesondert. | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Zahlungen gesammelt als Zahlungen an die Erben. | Pflicht | Ausgleich des Arbeitszeitkontos bei Beendigung (§ 2 Abs. 2 MiLoG) |
| Stand des Arbeitszeitkontos am Ende (agZeitkontoStand)<br>Frage: Wie ist der Stand des Kontos am letzten Tag?<br>Hilfe: Minusstunden mit Minus, z. B. -4,5. Den Stand am letzten Tag kennen Sie oft erst kurz vor dem Ende: Dann lassen Sie das Feld leer und tragen ihn vor der letzten Abrechnung in der neuen Fassung nach. | Arbeitgeber | Zahl, 2 Nachkommastellen, in Std., auch negativ | erst wenn „Arbeitszeitkonto“ mit „Ja“ beantwortet ist<br>Warum: Nur mit Arbeitszeitkonto. | optional | Ausgleich spätestens im Monat nach dem Ende (§ 2 Abs. 2 S. 2 MiLoG) |
| Ausgleich des Arbeitszeitkontos (agZeitkontoRegel)<br>Frage: Wie wird das Konto zum Ende ausgeglichen?<br>Hilfe: Nicht ausgeglichene Stunden sind in der Regel spätestens im Monat nach dem Ende auszugleichen (§ 2 Abs. 2 MiLoG). | Arbeitgeber | Auswahl: Bis zum Ende durch Freizeit oder Arbeit, am Ende steht es auf null, Ein Guthaben wird ausgezahlt, Minusstunden werden mit dem Lohn verrechnet (nur wenn so vereinbart), Minusstunden werden nicht verrechnet, Steht noch nicht fest | erst wenn „Arbeitszeitkonto“ mit „Ja“ beantwortet ist<br>Warum: Nur mit Arbeitszeitkonto. | Pflicht | Ausgleich des Arbeitszeitkontos in der letzten Abrechnung (§ 2 Abs. 2 MiLoG) |
| Wertguthaben (Langzeitkonto) (agWertguthaben)<br>Frage: Gibt es ein Wertguthaben (Langzeitkonto, zum Beispiel für ein Sabbatical)? | Arbeitgeber | Ja/Nein | immer | Pflicht | Wertguthaben nach § 7b SGB IV: Auflösung bei Beendigung |

### 10. Weitere Zahlungen und Verrechnungen

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Einmalige Beträge mit der letzten Abrechnung (agEinmalzahlungenEnde)<br>Frage: Zahlen Sie mit der letzten Abrechnung einmalige Beträge, z. B. einen Bonus, anteiliges Weihnachtsgeld oder eine Provision?<br>Hilfe: Abfindung und offene Urlaubstage gehören nicht hierher; sie sind schon erfasst. | Arbeitgeber | Auswahl: Nein, Ja, Steht noch nicht fest | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Zahlungen gesammelt als Zahlungen an die Erben. | Pflicht | Sonstiger Bezug (§ 39b Abs. 3 EStG); einmalig gezahltes Arbeitsentgelt (§ 23a SGB IV) |
| Einmalige Beträge (agEinmalzahlungenEndeListe)<br>Frage: Welche einmaligen Beträge zahlen Sie?<br>Hilfe: Eine Zeile je Zahlung, brutto. Bei „etwas anderes“ beschreiben Sie die Zahlung bitte in der Bemerkung. | Arbeitgeber | Tabelle | erst wenn bei „Einmalige Beträge mit der letzten Abrechnung“ „Ja“ gewählt ist<br>Warum: Nur wenn einmalige Beträge gezahlt werden. | Pflicht | Sonstiger Bezug (§ 39b Abs. 3 EStG); einmalig gezahltes Arbeitsentgelt (§ 23a SGB IV) |
| – Art (ezEndeArt) | Arbeitgeber | Auswahl: Bonus, Prämie oder Tantieme, Weihnachtsgeld oder 13. Gehalt, auch anteilig, Urlaubsgeld, Provision, etwas anderes | immer | Pflicht | Sonstiger Bezug (§ 39b Abs. 3 EStG); einmalig gezahltes Arbeitsentgelt (§ 23a SGB IV) |
| – Betrag (brutto) (ezEndeBetrag) | Arbeitgeber | Betrag in Euro | immer | Pflicht | Sonstiger Bezug (§ 39b Abs. 3 EStG); einmalig gezahltes Arbeitsentgelt (§ 23a SGB IV) |
| – Bemerkung (ezEndeBemerkung) | Arbeitgeber | Text | immer | optional | Sonstiger Bezug (§ 39b Abs. 3 EStG); einmalig gezahltes Arbeitsentgelt (§ 23a SGB IV) |
| Dienstwagen mit Privatnutzung (agDienstwagen)<br>Frage: Hat die Person einen Dienstwagen, den sie auch privat nutzen darf? | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Punkte gesammelt bei den Zahlungen an die Erben. | Pflicht | Geldwerter Vorteil der Privatnutzung im letzten Monat (§ 8 Abs. 2 EStG) |
| Überlassen bis (agUeberlassenBis)<br>Frage: An welchem Tag gibt die Person den Dienstwagen zurück?<br>Hilfe: Steht der Tag noch nicht genau fest, den geplanten Tag. Der Wert der Privatnutzung fällt in der Regel für jeden Kalendermonat an, in dem die Person das Fahrzeug noch hatte. | Arbeitgeber | Datum | erst wenn „Dienstwagen mit Privatnutzung“ mit „Ja“ beantwortet ist<br>Warum: Nur mit einem Dienstwagen, der auch privat genutzt werden darf. | Pflicht | Geldwerter Vorteil nach der 1-%-Regelung (§ 8 Abs. 2 Satz 2, § 6 Abs. 1 Nr. 4 Satz 2 EStG) |
| Vorschuss oder Arbeitgeberdarlehen zu verrechnen (agVorschussDarlehen)<br>Frage: Gibt es einen Vorschuss oder ein Arbeitgeberdarlehen, das mit der letzten Abrechnung verrechnet werden soll?<br>Hilfe: Die lohnabrechnende Stelle prüft, wie viel sie mit dem Lohn verrechnen darf. | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Punkte gesammelt bei den Zahlungen an die Erben. | Pflicht | Verrechnung in der letzten Abrechnung |
| Vorschuss oder Darlehen: Rest und Vereinbarung (agVorschussDarlehenText)<br>Frage: Welcher Betrag ist noch offen, und was ist vereinbart?<br>Hilfe: Z. B. „Darlehen, Rest 800 €, Verrechnung mit der letzten Abrechnung vereinbart“. | Arbeitgeber | Text, mehrzeilig | erst wenn „Vorschuss oder Arbeitgeberdarlehen zu verrechnen“ mit „Ja“ beantwortet ist<br>Warum: Nur bei einem Vorschuss oder Darlehen. | Pflicht | Verrechnung in der letzten Abrechnung |
| Neue Pfändung oder Abtretung (agPfaendungNeu)<br>Frage: Ist bei Ihnen eine Pfändung oder Abtretung des Lohns eingegangen, die die lohnabrechnende Stelle noch nicht kennt?<br>Hilfe: Bitte schicken Sie das Schreiben sofort an die lohnabrechnende Stelle; die Erklärung als Drittschuldner ist binnen zwei Wochen fällig (§ 840 ZPO). | Arbeitgeber | Ja/Nein | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod fragt der Fragebogen offene Punkte gesammelt bei den Zahlungen an die Erben. | Pflicht | Pfändung in der letzten Abrechnung (§§ 840, 850i ZPO) |

### 11. Zahlungen nach dem Tod

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Ausstehende Zahlungen an die Erben (agZahlungenErben)<br>Frage: Stehen noch Zahlungen aus, die nach dem Tod abzurechnen sind, z. B. Lohn bis zum Sterbetag, ein Bonus oder ein Guthaben auf dem Arbeitszeitkonto?<br>Hilfe: Offene Urlaubstage haben Sie schon angegeben. An wen gezahlt wird, klärt die lohnabrechnende Stelle mit Ihnen; nennen Sie hier bitte keine Erben. | Arbeitgeber | Auswahl: Ja, Nein, Steht noch nicht fest | erst wenn bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nur beim Tod der Person gehen ausstehende Zahlungen an die Erben; die übrigen Fragen zur letzten Abrechnung entfallen dann. | Pflicht | Letzte Abrechnung nach dem Tod der beschäftigten Person |
| Ausstehende Zahlungen (agZahlungenErbenText)<br>Frage: Welche Zahlungen sind das?<br>Hilfe: Art und, wenn bekannt, Betrag oder Stunden, z. B. „Lohn 01.11. bis 12.11.2026“ oder „Guthaben Arbeitszeitkonto 12,5 Std.“. Hatte die Person einen Dienstwagen, nennen Sie auch den Tag der Rückgabe. | Arbeitgeber | Text, mehrzeilig | erst wenn bei „Ausstehende Zahlungen an die Erben“ „Ja“ gewählt ist<br>Warum: Nur wenn noch Zahlungen ausstehen. | Pflicht | Letzte Abrechnung nach dem Tod der beschäftigten Person |

### 12. Bescheinigungen und Unterlagen

| Feld | Zuständig | Art | Eingabe möglich | Pflicht | Zweck |
| --- | --- | --- | --- | --- | --- |
| Arbeitsbescheinigung verlangt (agArbeitsbescheinigungVerlangt)<br>Frage: Hat die Person oder die Agentur für Arbeit eine Arbeitsbescheinigung verlangt?<br>Hilfe: Die lohnabrechnende Stelle übermittelt sie elektronisch an die Agentur für Arbeit, sobald der letzte Monat abgerechnet ist. Kommt die Anforderung später, geben Sie sie bitte weiter. Die Person erhält von der Agentur für Arbeit eine Übersicht der übermittelten Angaben. | Arbeitgeber | Auswahl: Ja, die Person hat sie verlangt, Ja, die Agentur für Arbeit hat sie angefordert, Nein, bisher nicht | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod gibt es kein Arbeitslosengeld und damit keine Arbeitsbescheinigung. | Pflicht | Arbeitsbescheinigung nur auf Verlangen (§ 312 Abs. 1 S. 1, § 313a Abs. 1 SGB III) |
| Keine Beschäftigten mehr (agLetzteBeschaeftigung)<br>Frage: Beschäftigen Sie nach diesem Ende niemanden mehr, z. B. weil Sie den Betrieb aufgeben?<br>Hilfe: Dann gibt die lohnabrechnende Stelle die Jahresmeldung zur Unfallversicherung früher ab als sonst. | Arbeitgeber | Ja/Nein | immer | Pflicht | Jahresmeldung zur Unfallversicherung bei Beendigung aller Beschäftigungsverhältnisse (Gemeinsames Rundschreiben Meldeverfahren, Tz. 1.1.7) |
| Neue Anschrift für Unterlagen (agAnschriftUnterlagen)<br>Frage: An welche neue Anschrift sollen Unterlagen wie die Lohnsteuerbescheinigung gehen?<br>Hilfe: Nur wenn Ihnen die Person selbst eine neue Anschrift genannt hat, die die lohnabrechnende Stelle noch nicht kennt: Straße und Hausnummer, Postleitzahl und Ort, im Ausland auch den Staat. Sonst lassen Sie das Feld leer. | Arbeitgeber | Text, mehrzeilig | erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist<br>Warum: Nach dem Tod klärt die lohnabrechnende Stelle mit Ihnen, wohin Unterlagen gehen. | optional | Ausdruck der Lohnsteuerbescheinigung (§ 41b Abs. 1 S. 3 EStG); Anschriftenänderung mit der Abmeldung zur Sozialversicherung (§ 28a SGB IV) |
| Bemerkungen (agBemerkungen)<br>Frage: Gibt es noch etwas, das die lohnabrechnende Stelle zum Ende wissen sollte?<br>Hilfe: Bitte keine Angaben zu Gesundheit, Schwangerschaft oder zu den Gründen eines besonderen Kündigungsschutzes. | Arbeitgeber | Text, mehrzeilig | immer | optional | Rückfragen zur letzten Abrechnung |

## Abhängigkeiten

Eingerückte Angaben beruhen auf der Angabe darüber und werden direkt nach ihr abgefragt. Fällt die Voraussetzung später weg, bleibt die Antwort bis zur Unterschrift erhalten (sie kommt zurück, wenn die Voraussetzung wieder gilt), wird aber nicht mit unterschrieben.

- Art des Endes (Arbeitgeber; unabhängig)
  - Freistellung bis zum Ende (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Freigestellt ab (Arbeitgeber; Ebene 2) – erst wenn bei „Freistellung bis zum Ende“ „Ja, unwiderruflich und bezahlt, im Einvernehmen mit der Person“ oder „Ja, unwiderruflich und bezahlt, von Ihnen angeordnet“ oder „Ja, ohne Bezahlung“ gewählt ist
  - Befristetes Arbeitsverhältnis (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ oder „Ende der Ausbildung ohne Weiterbeschäftigung“ oder „Tod der beschäftigten Person“ gewählt ist
    - Art der Befristung (Arbeitgeber; Ebene 2) – erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist
    - Befristung schriftlich vereinbart (Arbeitgeber; Ebene 2) – erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist
    - Befristet laut erstem Vertrag bis (Arbeitgeber; Ebene 2) – erst wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist oder „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist
    - Befristet bis (Arbeitgeber; Ebene 2) – erst wenn „Befristetes Arbeitsverhältnis“ mit „Ja“ beantwortet ist
  - Form der Kündigung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
  - Datum des Kündigungsschreibens (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
  - Zugang der Kündigung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
  - Zustellung der Kündigung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
  - Art der Kündigung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
    - Kündigung in der Probezeit (Arbeitgeber; Ebene 2) – erst wenn bei „Art der Kündigung“ „Ordentlich, mit Kündigungsfrist“ gewählt ist
  - Weitere Vereinbarung über das Ende (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ gewählt ist
  - Kündigungsschutzklage (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist
  - Kündigung wegen vertragswidrigen Verhaltens (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist
    - Abmahnung wegen desselben Verhaltens (Arbeitgeber; Ebene 2) – erst wenn „Kündigung wegen vertragswidrigen Verhaltens“ mit „Ja“ beantwortet ist
      - Datum der letzten Abmahnung (Arbeitgeber; Ebene 3) – erst wenn „Abmahnung wegen desselben Verhaltens“ mit „Ja“ beantwortet ist
  - Abfindungsangebot im Kündigungsschreiben (§ 1a KSchG) (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist
  - Sozialauswahl (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist
  - Teil einer angezeigten Massenentlassung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist
    - Agentur für Arbeit der Anzeige (Arbeitgeber; Ebene 2) – erst wenn „Teil einer angezeigten Massenentlassung“ mit „Ja“ beantwortet ist
  - Aufhebungsvertrag geschlossen am (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
  - Form des Aufhebungsvertrags (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
  - Arbeitgeber hätte sonst gekündigt (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
    - Hätte gekündigt am (Arbeitgeber; Ebene 2) – erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist
    - Hätte gekündigt zum (Arbeitgeber; Ebene 2) – erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist
    - Hätte wegen vertragswidrigen Verhaltens gekündigt (Arbeitgeber; Ebene 2) – erst wenn bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist
  - Kündigungsfrist des Arbeitgebers (Zahl) (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
  - Einheit der Kündigungsfrist (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
  - Termin der Kündigungsfrist (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
  - Sonderregel für die ordentliche Kündigung (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ oder „Kündigung durch die beschäftigte Person“ oder „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist
    - Ordentliche Kündigung ausgeschlossen (Arbeitgeber; Ebene 2) – erst wenn „Sonderregel für die ordentliche Kündigung“ mit „Ja“ beantwortet ist
      - Trotz Ausschluss aus wichtigem Grund mit Frist (Arbeitgeber; Ebene 3) – erst wenn bei „Ordentliche Kündigung ausgeschlossen“ „Ja, auf Dauer (z. B. tariflich unkündbar)“ gewählt ist
    - Ordentliche Kündigung nur gegen Abfindung (Arbeitgeber; Ebene 2) – erst wenn „Sonderregel für die ordentliche Kündigung“ mit „Ja“ beantwortet ist
      - Zugleich wichtiger Grund für eine Kündigung mit Frist (Arbeitgeber; Ebene 3) – erst wenn „Ordentliche Kündigung nur gegen Abfindung“ mit „Ja“ beantwortet ist
  - Abfindung oder ähnliche Leistung (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Abfindung brutto (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
    - Grundlage der Abfindung (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
    - Auszahlung der Abfindung (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
    - Auszahlung der Abfindung am (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
    - Abfindung enthält Arbeitsentgelt (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
      - In der Abfindung enthaltenes Arbeitsentgelt (Arbeitgeber; Ebene 3) – erst wenn „Abfindung enthält Arbeitsentgelt“ mit „Ja“ beantwortet ist
    - Abfindung auch bei Kündigung durch den Arbeitgeber (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ oder „Ja, aber zu einem anderen Zeitpunkt“ gewählt ist
    - Ununterbrochen im Betrieb seit (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist
    - Grund, warum die Leistung offen ist (Arbeitgeber; Ebene 2) – erst wenn bei „Abfindung oder ähnliche Leistung“ „Steht noch nicht fest, z. B. wegen Verhandlungen oder einer Klage“ gewählt ist
  - Arbeitsentgelt über das Ende hinaus (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Arbeitsentgelt über das Ende hinaus bis (Arbeitgeber; Ebene 2) – erst wenn „Arbeitsentgelt über das Ende hinaus“ mit „Ja“ beantwortet ist
  - Im Kalenderjahr des Endes genommene Urlaubstage (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
  - Überstunden mit der letzten Abrechnung (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Auszuzahlende Überstunden (Arbeitgeber; Ebene 2) – erst wenn bei „Überstunden mit der letzten Abrechnung“ „Ja“ gewählt ist
  - Arbeitszeitkonto (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Stand des Arbeitszeitkontos am Ende (Arbeitgeber; Ebene 2) – erst wenn „Arbeitszeitkonto“ mit „Ja“ beantwortet ist
    - Ausgleich des Arbeitszeitkontos (Arbeitgeber; Ebene 2) – erst wenn „Arbeitszeitkonto“ mit „Ja“ beantwortet ist
  - Einmalige Beträge mit der letzten Abrechnung (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Einmalige Beträge (Arbeitgeber; Ebene 2) – erst wenn bei „Einmalige Beträge mit der letzten Abrechnung“ „Ja“ gewählt ist
  - Dienstwagen mit Privatnutzung (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Überlassen bis (Arbeitgeber; Ebene 2) – erst wenn „Dienstwagen mit Privatnutzung“ mit „Ja“ beantwortet ist
  - Vorschuss oder Arbeitgeberdarlehen zu verrechnen (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Vorschuss oder Darlehen: Rest und Vereinbarung (Arbeitgeber; Ebene 2) – erst wenn „Vorschuss oder Arbeitgeberdarlehen zu verrechnen“ mit „Ja“ beantwortet ist
  - Neue Pfändung oder Abtretung (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
  - Ausstehende Zahlungen an die Erben (Arbeitgeber; Ebene 1) – erst wenn bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
    - Ausstehende Zahlungen (Arbeitgeber; Ebene 2) – erst wenn bei „Ausstehende Zahlungen an die Erben“ „Ja“ gewählt ist
  - Arbeitsbescheinigung verlangt (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist
  - Neue Anschrift für Unterlagen (Arbeitgeber; Ebene 1) – erst wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist

Alle übrigen Angaben sind unabhängig.

## Hinweise zur Kenntnisnahme

### Wann die lohnabrechnende Stelle die Angaben braucht

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Bitte schicken Sie diesen Fragebogen, sobald das Ende feststeht – nicht erst mit der letzten Monatsmeldung. Die lohnabrechnende Stelle meldet das Ende mit der nächsten Abrechnung, spätestens sechs Wochen danach, zur Sozialversicherung ab (§ 8 Abs. 1 DEÜV) und teilt es unverzüglich dem Bundeszentralamt für Steuern mit (§ 39e Abs. 4 S. 5 EStG).
>
> Steht etwas noch nicht fest, etwa eine Klage, eine Abfindung, Überstunden, das Arbeitszeitkonto oder der Resturlaub, wählen Sie „Steht noch nicht fest“ oder lassen das Feld leer. Vor der letzten Abrechnung öffnen Sie den Fragebogen wieder und ergänzen ihn als neue Fassung; ebenso, wenn sich später etwas ändert.
>
> Eine Arbeitsbescheinigung erstellt die lohnabrechnende Stelle nur, wenn die Person oder die Agentur für Arbeit sie verlangt, und erst nach der letzten Abrechnung (§ 312 Abs. 1, § 313a Abs. 1 SGB III).

### Kündigung und Aufhebungsvertrag nur auf Papier

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Eine Kündigung und ein Aufhebungsvertrag sind nur auf Papier mit eigenhändiger Unterschrift wirksam (§ 623 BGB). E-Mail, Fax, ein eingescanntes Schreiben, eine Nachricht im Messenger und jede elektronische Signatur genügen nicht – auch nicht, wenn die beschäftigte Person kündigt. Fehlt diese Form, besteht das Arbeitsverhältnis fort, und der Lohn ist weiter zu zahlen. Dieser Fragebogen und die Unterschrift in der App ersetzen die Kündigung nicht.
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Die Kündigung wirkt erst mit dem Zugang

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Maßgeblich ist der Tag, an dem die Kündigung bei der anderen Seite ankommt, nicht das Datum auf dem Schreiben (§ 130 Abs. 1 BGB). Ab diesem Tag laufen die Kündigungsfrist und die Frist von drei Wochen für eine Kündigungsschutzklage (§ 4 KSchG). Halten Sie fest, wann und wie Sie die Kündigung übergeben oder verschickt haben, und bewahren Sie einen Nachweis auf.
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Kündigungsfristen

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Ohne abweichende Regel beträgt die Frist vier Wochen zum 15. oder zum Ende eines Monats. Kündigen Sie als Arbeitgeber, verlängert sie sich nach zwei Jahren Betriebszugehörigkeit auf einen Monat und steigt bis auf sieben Monate nach zwanzig Jahren, jeweils zum Monatsende. In einer vereinbarten Probezeit von höchstens sechs Monaten gelten zwei Wochen. Ein Tarifvertrag kann andere Fristen vorsehen. Für die beschäftigte Person darf keine längere Frist gelten als für Sie (§ 622 BGB). Eine fristlose Kündigung ist nur innerhalb von zwei Wochen möglich, nachdem Sie die Gründe erfahren haben (§ 626 Abs. 2 BGB).
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Besonderer Kündigungsschutz

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Bei manchen Beschäftigten braucht eine Kündigung durch Sie vorher die Zustimmung einer Behörde, oder sie ist zeitweise verboten. Das betrifft vor allem schwerbehinderte und ihnen gleichgestellte Menschen nach sechs Monaten Beschäftigung (vorherige Zustimmung des Integrationsamts, Beteiligung der Schwerbehindertenvertretung; §§ 151, 168, 173, 178 SGB IX), die Zeit ab dem Verlangen von Elternzeit und während der Elternzeit (§ 18 BEEG), Pflegezeit (§ 5 PflegeZG), Schwangerschaft und die Zeit nach einer Entbindung (§ 17 MuSchG) sowie Mitglieder eines Betriebsrats oder Wahlvorstands (§ 15 KSchG). Dieser Fragebogen fragt nicht, ob einer dieser Fälle vorliegt. Klären Sie das bitte vor einer Kündigung.
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Betriebsrat, Massenentlassung, Ausbildung

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Hat Ihr Betrieb einen Betriebsrat, ist er vor jeder Kündigung anzuhören; ohne Anhörung ist die Kündigung unwirksam (§ 102 Abs. 1 BetrVG). Wollen Sie innerhalb von 30 Tagen mehrere Beschäftigte entlassen, kann vorher eine Anzeige bei der Agentur für Arbeit nötig sein, in Betrieben mit mehr als 20 Beschäftigten (§ 17 Abs. 1 KSchG). Auszubildenden können Sie nach der Probezeit nur aus wichtigem Grund kündigen, schriftlich und mit Angabe der Gründe (§ 22 Abs. 2, 3 BBiG).
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Freistellung und Resturlaub

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Urlaub, der wegen des Endes nicht mehr genommen werden kann, ist auszuzahlen (§ 7 Abs. 4 BUrlG). Soll offener Urlaub während einer Freistellung genommen werden, legen Sie das bitte ausdrücklich fest. Eine unwiderrufliche Freistellung mit Weiterzahlung des Lohns beendet die Sozialversicherung nicht vor dem Ende des Arbeitsverhältnisses; in der Arbeitsbescheinigung zählt sie trotzdem gesondert.
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

### Hinweis an die beschäftigte Person

- Kenntnisnahme durch: Arbeitgeber
- Art: wird in der App gelesen und bestätigt
- Stand: 03.11.2026

> Weisen Sie die Person bitte früh darauf hin, dass sie sich bei der Agentur für Arbeit arbeitsuchend melden muss: spätestens drei Monate vor dem Ende, bei kürzerer Zeit innerhalb von drei Tagen, nachdem sie vom Ende erfahren hat – auch wenn sie gegen die Kündigung klagt. Geben Sie ihr dafür frei (§ 2 Abs. 2 S. 2 Nr. 3 SGB III). Meldet sie sich zu spät, kann eine Sperrzeit eintreten (§ 38 Abs. 1, § 159 Abs. 1 S. 2 Nr. 9 SGB III). Für betriebliche Auszubildende gilt die Meldepflicht nicht.
>
> Das ist ein Hinweis, keine Rechtsberatung. Im Zweifel fragen Sie bitte eine Rechtsanwältin oder einen Rechtsanwalt.

## Verknüpfung der Teile

Keine.

## Prüfregeln

Keine.

## Zuordnung getrennt eingegangener Teile

Keine.

## Prüfhinweise für den Empfänger (Lohnabrechnende Stelle)

Nur Hinweise: Sie blockieren nichts und werden nicht unterschrieben. Sie erscheinen bei der Zusammenführung, sobald alle genannten Teile vorliegen.

- „Die Kündigung wurde nicht auf Papier mit eigenhändiger Unterschrift erklärt. Ohne Schriftform ist sie unwirksam, und das Arbeitsverhältnis besteht fort. Vor der Abmeldung mit dem Arbeitgeber klären.“ – wenn bei „Form der Kündigung“ „Anders, z. B. per E-Mail, Fax, Messenger, als Scan, elektronisch signiert oder mündlich“ gewählt ist (§ 623 BGB)
- „Der Aufhebungsvertrag wurde nicht auf Papier mit den eigenhändigen Unterschriften beider Seiten geschlossen. Ohne Schriftform ist er unwirksam, und das Arbeitsverhältnis besteht fort. Vor der Abmeldung mit dem Arbeitgeber klären.“ – wenn bei „Form des Aufhebungsvertrags“ „Anders, z. B. per E-Mail, als Scan, elektronisch signiert oder mündlich“ gewählt ist (§ 623 BGB)
- „Die Befristung wurde nicht schriftlich vereinbart; dann gilt das Arbeitsverhältnis in der Regel als unbefristet. Das Ende mit dem Arbeitgeber klären.“ – wenn bei „Befristung schriftlich vereinbart“ „Nein“ gewählt ist (§ 14 Abs. 4, § 16 TzBfG)
- „Das Kündigungsschreiben ist später datiert als sein Zugang. Daten prüfen.“ – wenn „Datum des Kündigungsschreibens“ nach „Zugang der Kündigung“ liegt
- „Die Kündigung ist erst nach dem angegebenen Ende des Arbeitsverhältnisses zugegangen. Daten prüfen.“ – wenn „Zugang der Kündigung“ nach „Ende des Arbeitsverhältnisses“ liegt (§ 130 Abs. 1 BGB)
- „Der Aufhebungsvertrag wurde erst nach dem angegebenen Ende des Arbeitsverhältnisses geschlossen. Daten prüfen.“ – wenn „Aufhebungsvertrag geschlossen am“ nach „Ende des Arbeitsverhältnisses“ liegt
- „Ordentliche Kündigung, aber weniger als eine Woche zwischen Zugang und Ende. Kündigungsfrist und Ende prüfen.“ – wenn bei „Art der Kündigung“ „Ordentlich, mit Kündigungsfrist“ gewählt ist und von „Zugang der Kündigung“ bis „Ende des Arbeitsverhältnisses“ weniger als eine Woche liegt (§ 622 BGB)
- „Die Freistellung beginnt nach dem angegebenen Ende des Arbeitsverhältnisses. Daten prüfen.“ – wenn „Freigestellt ab“ nach „Ende des Arbeitsverhältnisses“ liegt
- „Unwiderrufliche Freistellung mit Weiterzahlung: In der Arbeitsbescheinigung endet das Beschäftigungsverhältnis mit dem Tag vor Beginn der Freistellung; zur Sozialversicherung wird zum Ende des Arbeitsverhältnisses abgemeldet. Den Tag rechnet die App nicht.“ – wenn bei „Freistellung bis zum Ende“ „Ja, unwiderruflich und bezahlt, im Einvernehmen mit der Person“ oder „Ja, unwiderruflich und bezahlt, von Ihnen angeordnet“ gewählt ist (BA-Verfahrensbeschreibung zur Arbeitsbescheinigung (Stand 01.09.2026); BSG, Urteil vom 24.09.2008 – B 12 KR 22/07 R)
- „Freistellung ohne Entgelt: Die versicherungspflichtige Beschäftigung besteht ohne Entgelt höchstens einen Monat fort. Beginnt die Freistellung früher, eine Abmeldung vor dem Ende prüfen (Abgabegrund 34).“ – wenn bei „Freistellung bis zum Ende“ „Ja, ohne Bezahlung“ gewählt ist (§ 7 Abs. 3 S. 1 SGB IV; Gemeinsames Rundschreiben Meldeverfahren, Anlage 3)
- „Die Abmahnung liegt nach dem Datum des Kündigungsschreibens. Daten prüfen.“ – wenn „Datum der letzten Abmahnung“ nach „Datum des Kündigungsschreibens“ liegt
- „Eine Sonderregel für die ordentliche Kündigung wurde bejaht, aber weder ein Ausschluss noch eine Kündigung nur gegen Abfindung angegeben. Beim Arbeitgeber nachfragen.“ – wenn „Sonderregel für die ordentliche Kündigung“ mit „Ja“ beantwortet ist und bei „Ordentliche Kündigung ausgeschlossen“ „Nein“ gewählt ist und „Ordentliche Kündigung nur gegen Abfindung“ mit „Nein“ beantwortet ist
- „Eine Abfindung ist vereinbart, ihre Höhe fehlt noch. Nachfordern; ändert sie sich später, ist eine übermittelte Arbeitsbescheinigung zu ersetzen.“ – wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und „Abfindung brutto“ leer ist (§ 312 Abs. 1 SGB III)
- „Abfindung bei Aufhebungsvertrag oder Kündigung durch den Arbeitgeber: Prüfen, ob das Ende vor Ablauf der ordentlichen Kündigungsfrist des Arbeitgebers liegt; dann kann das Arbeitslosengeld ruhen. Nur zur Information für die Arbeitsbescheinigung.“ – wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ oder „Kündigung durch Sie als Arbeitgeber“ gewählt ist (§ 158 SGB III)
- „Eine Kündigungsschutzklage ist erhoben oder noch möglich. Das Ende kann sich ändern; eine übermittelte Arbeitsbescheinigung ist dann zu ersetzen, eine Nachzahlung ist möglich.“ – wenn bei „Kündigungsschutzklage“ „Ja“ oder „Steht noch nicht fest (die Frist läuft noch, oder ich weiß es nicht)“ gewählt ist (§ 4 KSchG; § 312 SGB III)
- „Es besteht ein Wertguthaben: Mit dem Ende ist es aufzulösen (Störfall); abrechnen und mit Abgabegrund 55 melden.“ – wenn „Wertguthaben (Langzeitkonto)“ mit „Ja“ beantwortet ist (§ 7b SGB IV; Gemeinsames Rundschreiben Meldeverfahren, Anlage 1)
- „Tod der beschäftigten Person: Abmeldung mit Abgabegrund 49. Zahlungen nach dem Tod an die Erben gesondert abrechnen.“ – wenn bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist (Gemeinsames Rundschreiben Meldeverfahren, Anlagen 1 und 3)
- „Eine Arbeitsbescheinigung ist verlangt: elektronisch übermitteln, sobald der letzte Monat im Beschäftigungsverhältnis abgerechnet ist, nicht vorher.“ – wenn bei „Arbeitsbescheinigung verlangt“ „Ja, die Person hat sie verlangt“ oder „Ja, die Agentur für Arbeit hat sie angefordert“ gewählt ist (§ 312 Abs. 1, § 313a Abs. 1 SGB III)
- „Nach diesem Ende beschäftigt der Arbeitgeber niemanden mehr: Die Jahresmeldung zur Unfallversicherung ist schon mit der nächsten Abrechnung, spätestens binnen sechs Wochen, abzugeben.“ – wenn „Keine Beschäftigten mehr“ mit „Ja“ beantwortet ist (Gemeinsames Rundschreiben Meldeverfahren (Fassung 17.06.2026), Tz. 1.1.7)
- „Eine neue Pfändung oder Abtretung ist eingegangen: Drittschuldnererklärung binnen zwei Wochen; prüfen, ob sie Abfindung oder letzte Zahlungen erfasst.“ – wenn „Neue Pfändung oder Abtretung“ mit „Ja“ beantwortet ist (§§ 840, 850i ZPO)
- „Der Arbeitgeber hat Angaben als „Steht noch nicht fest“ markiert oder offen gelassen (z. B. Klage, Abfindung, Urlaub, Überstunden, Arbeitszeitkonto oder letzte Zahlungen). Vor der letzten Abrechnung eine neue Fassung dieses Fragebogens anfordern.“ – wenn bei „Kündigungsschutzklage“ „Steht noch nicht fest (die Frist läuft noch, oder ich weiß es nicht)“ gewählt ist oder bei „Abfindung oder ähnliche Leistung“ „Steht noch nicht fest, z. B. wegen Verhandlungen oder einer Klage“ gewählt ist oder (bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und „Abfindung brutto“ leer ist) oder (bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist und „Auszahlung der Abfindung am“ leer ist) oder „Offene Urlaubstage am Ende“ leer ist oder (nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist und „Im Kalenderjahr des Endes genommene Urlaubstage“ leer ist) oder bei „Überstunden mit der letzten Abrechnung“ „Steht noch nicht fest“ gewählt ist oder („Arbeitszeitkonto“ mit „Ja“ beantwortet ist und „Stand des Arbeitszeitkontos am Ende“ leer ist) oder bei „Ausgleich des Arbeitszeitkontos“ „Steht noch nicht fest“ gewählt ist oder bei „Einmalige Beträge mit der letzten Abrechnung“ „Steht noch nicht fest“ gewählt ist oder bei „Ausstehende Zahlungen an die Erben“ „Steht noch nicht fest“ gewählt ist

## Was dieser Fragebogen nicht abdeckt

- Der Fragebogen ist keine Kündigung und kein Aufhebungsvertrag und prüft nicht, ob das Arbeitsverhältnis wirksam endet.
- Ein Wechsel in eine andere Beschäftigung beim selben Arbeitgeber und ein Betriebsübergang sind kein Austritt; dafür sind Abschließen und Weitergeben gesperrt.
- Nicht abgedeckt: Insolvenz, Altersteilzeit, Vorruhestandsleistungen, Heimarbeit, Arbeitskampf, Saison- und Transferkurzarbeit.
- Ein Wertguthaben (Langzeitkonto) erfasst er nur als Prüfhinweis; die Auflösung rechnet die lohnabrechnende Stelle gesondert ab.
- Nicht abgedeckt: die Arbeitsbescheinigung für Zwecke des über- und zwischenstaatlichen Rechts (§ 312a SGB III) und die Bescheinigung über Nebeneinkommen (§ 313 SGB III).
- Fehlzeiten, Entgelte und Sozialversicherungsdaten für die Arbeitsbescheinigung kommen aus der Lohnabrechnung; Zeiten, bevor die lohnabrechnende Stelle die Abrechnung übernommen hat, klärt sie gesondert.
- Die App berechnet weder die Kündigungsfrist noch das Ende des Beschäftigungsverhältnisses bei einer Freistellung; der Arbeitgeber gibt die Frist an, den Rest rechnet die lohnabrechnende Stelle.
- Beim Tod der beschäftigten Person fragt er nur das Ende, offene Urlaubstage, ein Wertguthaben und ausstehende Zahlungen; die Abrechnung mit den Erben klärt die lohnabrechnende Stelle gesondert.
- Eine neue Anschrift für Unterlagen nimmt er als freien Text auf; die lohnabrechnende Stelle überträgt sie.
- Zeugnis, Herausgabe von Arbeitsmitteln, Wettbewerbsverbot, betriebliche Altersversorgung und vermögenswirksame Leistungen sind nicht Gegenstand.

## Vorschlag Abgabegrund der Abmeldung (erste passende Regel gilt; die App entscheidet nicht)

Grundlage: Gemeinsames Rundschreiben Meldeverfahren, Anlage 1 (Stand 26.06.2024) und Anlage 3 (Stand 17.06.2026)

1. 49: wenn bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist – Ende der Beschäftigung wegen Tod.
2. 30: wenn bei „Freistellung bis zum Ende“ „Ja, ohne Bezahlung“ gewählt ist – Ende der Beschäftigung; bei einer Freistellung ohne Entgelt von mehr als einem Monat vor dem Ende ist eine frühere Abmeldung mit Abgabegrund 34 zu prüfen (§ 7 Abs. 3 S. 1 SGB IV). (prüfen)
3. 30: sonst – Ende der Beschäftigung. Wurde die Person noch nicht angemeldet, sind An- und Abmeldung zusammen mit Abgabegrund 40 möglich (§ 8 Abs. 2 DEÜV).

## Vorschlag Arbeitsbescheinigung: Beendigung durch (Schlüssel der Bundesagentur für Arbeit) (erste passende Regel gilt; die App entscheidet nicht)

Grundlage: Bundesagentur für Arbeit, Schlüsselverzeichnis zur elektronischen Arbeitsbescheinigung (Stand 01.01.2025)

1. 1: wenn bei „Art des Endes“ „Kündigung durch Sie als Arbeitgeber“ gewählt ist – Kündigung durch den Arbeitgeber.
2. 3: wenn bei „Art des Endes“ „Kündigung durch die beschäftigte Person“ gewählt ist und bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ gewählt ist – Kündigung durch die Person; der Arbeitgeber hätte zum selben Zeitpunkt gekündigt.
3. 2: wenn bei „Art des Endes“ „Kündigung durch die beschäftigte Person“ gewählt ist – Kündigung durch die Person; der Arbeitgeber hätte nicht oder nicht zum selben Zeitpunkt gekündigt.
4. 5: wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist und bei „Arbeitgeber hätte sonst gekündigt“ „Ja, zum selben Zeitpunkt“ gewählt ist – Aufhebungsvertrag; der Arbeitgeber hätte zum selben Zeitpunkt gekündigt.
5. 4: wenn bei „Art des Endes“ „Aufhebungsvertrag (Ende im Einvernehmen)“ gewählt ist – Aufhebungsvertrag; der Arbeitgeber hätte nicht oder nicht zum selben Zeitpunkt gekündigt.
6. 6: wenn bei „Art des Endes“ „Ende der Ausbildung ohne Weiterbeschäftigung“ oder „Ende kraft Gesetzes oder Tarifvertrags, z. B. durch eine tarifliche Altersgrenze“ gewählt ist – Ende kraft Gesetzes oder Tarifvertrags, z. B. mit dem Ende der Ausbildung.
7. entfällt: wenn bei „Art des Endes“ „Ende einer Befristung (das Datum ist erreicht oder der Zweck erfüllt)“ gewählt ist – Ende einer Befristung: Es wird über die Angaben zur Befristung bescheinigt. (prüfen)

## Vorschlag Arbeitsbescheinigung: Leistungen wegen der Beendigung (erste passende Regel gilt; die App entscheidet nicht)

Grundlage: §§ 157, 158 SGB III; BA-Verfahrensbeschreibung zur Arbeitsbescheinigung (Stand 01.09.2026)

1. ja: wenn bei „Abfindung oder ähnliche Leistung“ „Ja, vereinbart oder zugesagt (auch wenn die Höhe noch offen ist)“ gewählt ist – Eine Abfindung oder ähnliche Leistung wegen des Endes ist vereinbart.
2. ja: wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist und „Offene Urlaubstage am Ende“ über 0 liegt – Offene Urlaubstage werden abgegolten.
3. ja: wenn „Arbeitsentgelt über das Ende hinaus“ mit „Ja“ beantwortet ist – Arbeitsentgelt wird über das Ende hinaus gezahlt.
4. ungewiss: wenn bei „Abfindung oder ähnliche Leistung“ „Steht noch nicht fest, z. B. wegen Verhandlungen oder einer Klage“ gewählt ist – Eine Abfindung steht noch nicht fest.
5. ungewiss: wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist und „Offene Urlaubstage am Ende“ leer ist – Die offenen Urlaubstage fehlen noch; vor der Bescheinigung nachfragen. (prüfen)
6. nein: wenn nicht zutrifft, dass bei „Art des Endes“ „Tod der beschäftigten Person“ gewählt ist – Weder Abfindung noch Urlaubsabgeltung noch Arbeitsentgelt über das Ende hinaus.

## Vorschlag Arbeitsbescheinigung: Kündigung schriftlich (erste passende Regel gilt; die App entscheidet nicht)

Grundlage: § 623 BGB

1. ja: wenn bei „Form der Kündigung“ „Auf Papier, eigenhändig unterschrieben, im Original übergeben oder geschickt“ gewählt ist – Die Kündigung wurde auf Papier mit eigenhändiger Unterschrift erklärt.
2. nein: wenn bei „Form der Kündigung“ „Anders, z. B. per E-Mail, Fax, Messenger, als Scan, elektronisch signiert oder mündlich“ gewählt ist – Ohne Schriftform ist die Kündigung unwirksam (§ 623 BGB); vor der Bescheinigung klären. (prüfen)

## Sonderfälle, die Abschließen und Weitergeben sperren

- Wechsel in eine andere Beschäftigung beim selben Arbeitgeber: Das ist kein Austritt; die lohnabrechnende Stelle meldet die Beschäftigung um. Bitte informieren Sie sie direkt. – wenn bei „Art des Endes“ „Wechsel in eine andere Beschäftigung bei Ihnen (z. B. nach der Ausbildung übernommen, Minijob wird Teilzeitstelle)“ gewählt ist (Gemeinsames Rundschreiben Meldeverfahren, Anlage 3 (Abgabegründe 31 bis 33))
- Betriebsübergang: Der neue Inhaber tritt in die Arbeitsverhältnisse ein; dafür ist dieser Fragebogen nicht gedacht. Bitte wenden Sie sich an die lohnabrechnende Stelle. – wenn bei „Art des Endes“ „Übergang des Betriebs oder Betriebsteils auf einen neuen Inhaber“ gewählt ist (§ 613a Abs. 1 S. 1 BGB)

## Rechtliche Hinweise

- Die Unterschrift in dieser App ist eine einfache elektronische Signatur (Art. 3 Nr. 10 eIDAS-Verordnung). Sie genügt für diese Mitteilung an die lohnabrechnende Stelle, nicht für eine Kündigung oder einen Aufhebungsvertrag; beide bedürfen der Schriftform (§ 623 BGB).
- Der Fragebogen ersetzt keine Rechtsberatung und prüft nicht, ob eine Kündigung, eine Befristung oder ein Aufhebungsvertrag wirksam ist.
- Die Angaben dienen der Abmeldung zur Sozialversicherung (§ 28a SGB IV), der Mitteilung des Endes an das Bundeszentralamt für Steuern (§ 39e Abs. 4 EStG), der Arbeitsbescheinigung (§§ 312, 313a SGB III), der Urlaubsbescheinigung (§ 6 Abs. 2 BUrlG) und der letzten Abrechnung. Die beschäftigte Person erhält von der Agentur für Arbeit einen Nachweis über die bescheinigten Angaben (§ 313a Abs. 1 SGB III).
- Fehlzeiten, Entgelte und Sozialversicherungsdaten der letzten Jahre nimmt die lohnabrechnende Stelle aus der Lohnabrechnung. Der Fragebogen fragt weder nach Gesundheit oder Schwangerschaft noch nach einer Schwerbehinderung oder den Gründen eines besonderen Kündigungsschutzes.
- Steht eine Angabe noch nicht fest, ergänzt der Arbeitgeber den Fragebogen vor der letzten Abrechnung als neue Fassung; maßgeblich ist dann die neueste Fassung.
