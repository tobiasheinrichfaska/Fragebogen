# 11 – Eigenbeleg (Entwurf)

Voraussetzung für alle Fälle: die **Fassung mit den Formular-Entwürfen** – im Testbereich schon geladen;
lokal `npm run build:preview`, Datei `dist-preview/index.html`. Nur erfundene Daten verwenden.

---

## MT-110: Eigenbeleg für eine Ausgabe – Sperre bei einer Spende, Warnung bei einer Bewirtung

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Eigenbeleg: Ausgabe ohne Originalbeleg, Entnahme, Einlage oder Geldtransit“.

**Schritte:**

1. Klicken Sie **„Ich bin: Ausstellende Person“** und bestätigen Sie die vier Hinweise mit dem
   Häkchen **„Ich habe den Hinweis gelesen.“** und **„Weiter“**.
2. Unternehmen `Beispiel Malerbetrieb`, die Mandantennummer mit **„Weiter“** leer lassen, Name
   `Erika Musterfrau`.
3. Bei „Was möchten Sie mit diesem Eigenbeleg belegen?“ **„eine Ausgabe ohne Originalbeleg“**
   wählen, als Tag `15.10.2026` eingeben, bei „Wofür wurde bezahlt?“ **„eine Spende“** wählen.
4. Mit **„Zurück“** zur Frage „Wofür wurde bezahlt?“ gehen und **„ein Essen oder Getränke mit Gästen
   (Bewirtung)“** wählen.
5. Bei der Warnung zur Bewirtung **„Verstanden“** klicken; Ort **„in einem Restaurant, Café oder einer
   anderen Gaststätte“**; Grund **„Der Beleg ist verloren gegangen“**; „Was ist genau passiert?“ mit
   **„Weiter“** leer lassen; Zweitschrift **„Ja, aber ohne Erfolg“**.
6. Zahlungsempfänger `Gasthaus Beispiel`, Ort `Musterstadt`, gekauft `Mittagessen für 3 Personen`,
   Anlass `Besprechung Auftrag Musterstraße`, Teilnehmende in zwei Zeilen `Erika Musterfrau` und
   `Max Mustermann, Beispiel GmbH`, in Euro **„Ja“**, Betrag `250,00`, **„bar aus der Kasse des
   Betriebs“**, Kassenbuch **„Ja“**.
7. Die Belegnummer mit **„Weiter“** leer lassen, als Datum des Eigenbelegs `16.10.2026` eingeben.
8. In der Zusammenfassung **„Weiter zum Abschluss“**, das Häkchen setzen, **„Namen tippen“** wählen,
   `Erika Musterfrau` eintippen und **„Unterschreiben und abschließen“**; dann **„PDF erstellen“**.
9. Optional, Kanzlei: Auf der Startseite **„Eingänge zusammenführen …“**, mit **„Dateien hinzufügen …“**
   die PDF aus Schritt 8 einlesen.

**Erwartet:**

- Schritt 3: Gleich nach der Wahl „eine Spende“ erscheint oben ein Warnkasten „Für diesen Sonderfall
  ist der Fragebogen nicht gedacht …“ mit dem Satz „Für eine Spende brauchen Sie eine
  Zuwendungsbestätigung des Empfängers; ein Eigenbeleg genügt nicht.“ _Nicht offensichtlich:_ Der
  Kasten nennt noch „die lohnabrechnende Stelle“ – das ist bekannt (allgemeiner Text der App), bitte
  nicht als Fehler melden.
- Schritt 4: Der Warnkasten verschwindet. Die nächste Frage beginnt mit „Wichtig bei einer
  Bewirtung: Ohne die Rechnung der Gaststätte ist die Ausgabe nicht abziehbar.“ Darunter steht in
  einfachen Worten: Rechnung der Gaststätte nötig (§ 4 Abs. 5 Satz 1 Nr. 2 EStG), Zweitschrift
  anfragen, Bewirtung in der eigenen Wohnung in der Regel privat. Es gibt **nur einen** Knopf,
  „Verstanden“. _Nicht offensichtlich:_ Die Bewirtung ist **nicht** gesperrt; man kann weitermachen.
- Schritt 6: Statt „Wofür wurde die Ausgabe im Betrieb gebraucht?“ kommen bei der Bewirtung die Fragen
  nach dem Anlass und den Teilnehmenden. Die Fragen zu einer Entnahme, Einlage oder zum Geldtransit
  erscheinen nie.
- Schritt 7: Die Belegnummer ist freiwillig; die Hilfe sagt, dass sonst die Kanzlei sie vergibt.
- Schritt 8: Das Unterschreiben klappt ohne Fehlermeldung. In der PDF steht beim „Hinweis zur
  Bewirtung“ die Antwort „Verstanden“; bei der Belegnummer steht keine Nummer.
- Schritt 9: Unter „Prüfhinweise:“ stehen unter anderem „Bewirtung per Eigenbeleg …“, „Bewirtung in
  einer Gaststätte ohne deren Rechnung …“, „Eigenbeleg über eine Ausgabe ab 250 € …“ und „Keine
  Belegnummer angegeben …“. _Nicht offensichtlich:_ Die ausstellende Person sieht diese Prüfhinweise
  nicht; sie sperren nichts. Mit 249,99 € statt 250,00 € fehlt der Hinweis „ab 250 €“.

---

## MT-111: Privatentnahme bei einer GmbH und Geldtransit zur Bank

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Eigenbeleg: Ausgabe ohne Originalbeleg, Entnahme, Einlage oder Geldtransit“.

**Schritte:**

1. **„Ich bin: Ausstellende Person“**, die vier Hinweise bestätigen, Unternehmen `Beispiel GmbH`,
   Mandantennummer `99999`, Name `Erika Musterfrau`.
2. Bei „Was möchten Sie mit diesem Eigenbeleg belegen?“ **„eine Privatentnahme …“** wählen, bei der
   Rechtsform **„Kapitalgesellschaft (GmbH, UG oder AG)“**.
3. Den Hinweis mit **„Verstanden“** bestätigen, als Tag `15.10.2026`, **„bar aus der Kasse des
   Betriebs“**, die Kasse leer lassen, entnommen von `Erika Musterfrau`, Betrag `200,00`, den Zweck
   leer lassen, Kassenbuch **„Ja“**, Belegnummer `EB-2026-002`, Datum `16.10.2026`; bis zur
   Zusammenfassung.
4. In der Zusammenfassung bei „Art des Vorgangs“ auf **„ändern“** klicken und **„einen Geldtransit …“**
   wählen. Weiter: **„aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“**, gebracht von
   `Max Mustermann`, Betrag `1.250,00`, Grund `Tageseinnahmen zur Bank gebracht`, Kassenbuch
   **„Ja“**, Beleg der Bank **„Nein“**; bis zur Zusammenfassung.

**Erwartet:**

- Schritt 2: Die Rechtsform wird **nur** bei einer Privatentnahme oder Einlage gefragt.
- Schritt 3: Bei der GmbH erscheint vorher der Hinweis „Bitte beachten Sie: In einer GmbH, UG oder AG
  gehört das Geld der Gesellschaft.“ mit der Erklärung zu Verrechnungskonto, Darlehen und verdeckter
  Gewinnausschüttung und nur dem Knopf „Verstanden“. _Nicht offensichtlich:_ Der Eigenbeleg ist
  trotzdem nicht gesperrt; die Kanzlei bekommt einen Prüfhinweis.
- Schritt 3: Es gibt keine Fragen nach Zahlungsempfänger, Ort, Währung oder Zahlungsart; der Betrag
  wird als „Wie viel Geld war es, in Euro?“ gefragt. Der Zweck ist freiwillig.
- Schritt 4: Rechtsform, Hinweis zur GmbH, „entnommen von“ und der Zweck sind nicht mehr gefragt. Die
  Zusammenfassung nennt die alten Antworten unter „Diese Angaben werden nicht mit unterschrieben, weil
  ihre Voraussetzung nicht mehr gilt …“; sie werden **nicht** mitunterschrieben. Neu sind „Von wo nach wo wurde das Geld gebracht?“, „Wer hat das Geld gebracht
  oder abgeholt?“ und „Geben Sie den Beleg der Bank oder den Kontoauszug mit ab?“.
