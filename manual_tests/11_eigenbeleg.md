# 11 – Eigenbeleg (Entwurf)

Voraussetzung für alle Fälle: die **Fassung mit den Formular-Entwürfen** – im Testbereich schon geladen;
lokal `npm run build:preview`, Datei `dist-preview/index.html`. Nur erfundene Daten verwenden. Jeder
Fall beginnt mit einem Startlink; ohne Testbereich füllen Sie die dort genannten Angaben selbst aus.

---

## MT-110: Spende wird gesperrt, Bewirtung nur gewarnt

**Einstieg:** [Ausgabe öffnen](start:eigenbeleg-ausgabe-art-offen) – Unternehmen, Name, „eine Ausgabe
ohne Originalbeleg“ und der Tag sind eingetragen; Sie stehen bei „Wofür wurde bezahlt?“.

**Schritte:**

1. Wählen Sie **„eine Spende“**.
   - **Danach:** Oben erscheint ein Warnkasten „Für diesen Sonderfall ist der Fragebogen nicht
     gedacht …“ mit „Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers; ein
     Eigenbeleg genügt nicht.“ Der Kasten endet mit „… bei der Stelle nach, die den Fragebogen bekommt
     (hier: Buchhaltung oder Kanzlei).“
2. Gehen Sie mit **„Zurück“** wieder zu „Wofür wurde bezahlt?“ und wählen Sie **„ein Essen oder
   Getränke mit Gästen (Bewirtung)“**.
   - **Danach:** Der Warnkasten verschwindet.
3. Lesen Sie die nächste Frage.
   - **Danach:** Sie beginnt mit „Wichtig bei einer Bewirtung: Ohne die Rechnung der Gaststätte ist
     die Ausgabe nicht abziehbar.“ Darunter steht in einfachen Worten: Rechnung der Gaststätte nötig
     (§ 4 Abs. 5 Satz 1 Nr. 2 EStG), Zweitschrift anfragen, Bewirtung in der eigenen Wohnung in der
     Regel privat. Es gibt **nur einen** Knopf, „Verstanden“.
4. Klicken Sie **„Verstanden“**.
   - **Danach:** _Nicht offensichtlich:_ Die Bewirtung ist **nicht** gesperrt; es geht mit „Wo fand
     die Bewirtung statt?“ weiter.

---

## MT-111: Bewirtung unterschreiben und als PDF ausgeben

**Einstieg:** [Bewirtung in der Zusammenfassung öffnen](start:eigenbeleg-bewirtung-zusammenfassung) –
eine Bewirtung über 250,00 € in einem Gasthaus ist vollständig ausgefüllt, ohne Belegnummer.

**Schritte:**

1. Sehen Sie die Zusammenfassung durch.
   - **Danach:** Statt „Wofür wurde die Ausgabe im Betrieb gebraucht?“ stehen bei der Bewirtung
     Anlass und Teilnehmende (zwei Zeilen). Fragen zu Entnahme, Einlage oder Geldtransit kommen nicht
     vor. Die Belegnummer ist leer – sie ist freiwillig, die Kanzlei vergibt sie sonst.
2. Klicken Sie **„Weiter zum Abschluss“**, setzen Sie das Häkchen, wählen Sie **„Namen tippen“**,
   tippen Sie `Erika Musterfrau` und klicken Sie **„Unterschreiben und abschließen“**.
   - **Danach:** Das Unterschreiben klappt ohne Fehlermeldung.
3. Klicken Sie **„PDF erstellen“** und öffnen Sie die PDF.
   - **Danach:** In der PDF steht beim Hinweis zur Bewirtung die Antwort „Verstanden“; bei der
     Belegnummer steht keine Nummer. _Nicht offensichtlich:_ Die Prüfhinweise für die Kanzlei stehen
     **nicht** in der PDF der ausstellenden Person – sie erscheinen erst beim Zusammenführen
     (MT-112).

---

## MT-112: Kanzlei sieht die Prüfhinweise zum Eigenbeleg

**Einstieg:** [Kanzlei mit dem Eigenbeleg öffnen](start:kanzlei-eigenbeleg-bewirtung) – der
unterschriebene Eigenbeleg aus MT-111 liegt im Eingang.

**Schritte:**

1. Sehen Sie den Bericht zur Datei und die Prüfhinweise an.
   - **Danach:** Der Eigenbeleg ist geprüft und vollständig.
   - **Danach:** Unter „Prüfhinweise:“ stehen unter anderem „Ohne Vorsteuer buchen …“, „Bewirtung per
     Eigenbeleg …“, „Bewirtung in einer Gaststätte ohne deren Rechnung …“, „Eigenbeleg über eine
     Ausgabe ab 250 € …“ und „Keine Belegnummer angegeben …“.
   - **Danach:** _Nicht offensichtlich:_ Die Hinweise sperren nichts. Bei 249,99 € fehlt der Hinweis
     „ab 250 €“ (das prüft die automatische Testsuite; hier nicht nachstellen).

---

## MT-113: Privatentnahme bei einer GmbH

**Einstieg:** [Neuen Vorgang öffnen](start:eigenbeleg-vorgangsart-offen) – Unternehmen „Beispiel
GmbH“, Mandantennummer und Name sind eingetragen; Sie stehen bei „Was möchten Sie mit diesem
Eigenbeleg belegen?“.

**Schritte:**

1. Wählen Sie **„eine Privatentnahme …“**.
   - **Danach:** Es kommt die Frage „Welche Rechtsform hat das Unternehmen?“. Die Rechtsform wird
     **nur** bei einer Privatentnahme oder Einlage gefragt.
2. Wählen Sie **„Kapitalgesellschaft (GmbH, UG oder AG)“**.
   - **Danach:** Bei der GmbH kommt der Hinweis „Bitte beachten Sie: In einer GmbH, UG oder AG gehört
     das Geld der Gesellschaft.“ mit der Erklärung zu Verrechnungskonto, Darlehen und verdeckter
     Gewinnausschüttung und nur dem Knopf „Verstanden“.
3. Bestätigen Sie den Hinweis mit **„Verstanden“**.
4. Tragen Sie bei „An welchem Tag wurde bezahlt oder das Geld bewegt?“ `15.10.2026` ein und klicken
   Sie **„Weiter“**.
   - **Danach:** Es geht mit „Woher wurde das Geld entnommen?“ weiter. Es gibt keine Fragen nach
     Zahlungsempfänger, Ort, Währung oder Zahlungsart.
5. Wählen Sie **„bar aus der Kasse des Betriebs“**.
6. Lassen Sie „Welche Kasse war es?“ leer und klicken Sie **„Weiter“**.
7. Tragen Sie bei „Wer hat das Geld für private Zwecke entnommen?“ `Erika Musterfrau` ein und klicken
   Sie **„Weiter“**.
   - **Danach:** Die Frage nach dem Betrag heißt „Wie viel Geld war es, in Euro?“.
8. Tragen Sie `200,00` ein und klicken Sie **„Weiter“**.
   - **Danach:** Es kommt „Wofür wurde das Geld entnommen?“ mit dem Zusatz „(freiwillig)“ – der Zweck
     ist freiwillig.
9. Lassen Sie den Zweck leer und klicken Sie **„Weiter“**.
   - **Danach:** Es geht ohne Zweck weiter mit „Ist der Betrag am selben Tag im Kassenbuch
     eingetragen?“.
10. Antworten Sie **„Ja“**.
11. Lassen Sie „Welche Nummer bekommt dieser Eigenbeleg?“ leer und klicken Sie **„Weiter“**.
12. Tragen Sie bei „Welches Datum hat dieser Eigenbeleg?“ `16.10.2026` ein und klicken Sie
    **„Weiter“**.
    - **Danach:** Die Zusammenfassung erscheint. _Nicht offensichtlich:_ Der Eigenbeleg ist trotz
      GmbH nicht gesperrt; die Kanzlei bekommt einen Prüfhinweis.

---

## MT-114: Von der Privatentnahme zum Geldtransit wechseln

**Einstieg:** [Privatentnahme in der Zusammenfassung öffnen](start:eigenbeleg-privatentnahme-gmbh-zusammenfassung)
– eine Privatentnahme über 200,00 € bei einer GmbH ist ausgefüllt.

**Schritte:**

1. Klicken Sie in der Zusammenfassung bei „Art des Vorgangs“ auf **„ändern“**.
   - **Danach:** Die Frage „Was möchten Sie mit diesem Eigenbeleg belegen?“ erscheint.
2. Wählen Sie **„einen Geldtransit …“**.
   - **Danach:** Neu ist die Frage „Von wo nach wo wurde das Geld gebracht?“. Rechtsform und Hinweis
     zur GmbH werden nicht mehr gefragt.
3. Wählen Sie **„aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“**.
4. Lassen Sie „Welche Kasse war es?“ leer und klicken Sie **„Weiter“**.
   - **Danach:** Neu ist die Frage „Wer hat das Geld gebracht oder abgeholt?“; „entnommen von“ wird
     nicht mehr gefragt.
5. Tragen Sie `Max Mustermann` ein und klicken Sie **„Weiter“**.
   - **Danach:** Es kommt „Warum wurde das Geld gebracht?“. Der Zweck der Entnahme wird nicht mehr
     gefragt.
6. Tragen Sie `Tageseinnahmen zur Bank gebracht` ein und klicken Sie **„Weiter“**.
   - **Danach:** Neu ist die Frage „Geben Sie den Beleg der Bank oder den Kontoauszug mit ab?“.
7. Antworten Sie **„Nein“**.
   - **Danach:** Die Zusammenfassung erscheint. Sie nennt die alten Antworten unter „Verworfene
     Angaben: Ihre Voraussetzung gilt nicht mehr …“. „Betrag im
     Kassenbuch“ steht weiter auf „Ja“. _Nicht offensichtlich:_ Nach Betrag und Kassenbuch wurde
     nicht noch einmal gefragt, weil sie schon beantwortet sind.
8. Klicken Sie bei „Betrag in Euro“ auf **„ändern“**.
   - **Danach:** _Nicht offensichtlich:_ Der Betrag ist mit 200,00 € vorbelegt, weil Entnahme und
     Geldtransit dasselbe Betragsfeld nutzen.
9. Überschreiben Sie den Betrag mit `1.250,00` und klicken Sie **„Zurück zur Zusammenfassung“**.
   - **Danach:** Die Zusammenfassung zeigt den neuen Betrag.

---

## MT-115: Einlage in einem Einzelunternehmen

**Einstieg:** [Neuen Vorgang öffnen](start:eigenbeleg-vorgangsart-offen).

**Schritte:**

1. Wählen Sie **„eine Einlage …“**.
   - **Danach:** Es kommt die Frage „Welche Rechtsform hat das Unternehmen?“.
2. Wählen Sie **„Einzelunternehmen“**.
   - **Danach:** Beim Einzelunternehmen kommt **kein** Hinweis zur GmbH; es geht mit „An welchem Tag
     wurde bezahlt oder das Geld bewegt?“ weiter.
3. Tragen Sie `15.10.2026` ein und klicken Sie **„Weiter“**.
4. Wählen Sie bei „Wohin wurde das Geld eingelegt?“ **„bar in die Kasse des Betriebs“**.
5. Lassen Sie „Welche Kasse war es?“ leer und klicken Sie **„Weiter“**.
6. Tragen Sie bei „Wer hat das Geld eingelegt?“ `Erika Musterfrau` ein und klicken Sie
   **„Weiter“**.
7. Tragen Sie als Betrag `500,00` ein und klicken Sie **„Weiter“**.
   - **Danach:** Es kommt „Woher stammt das eingelegte Geld?“.
8. Lassen Sie das Feld leer und versuchen Sie, **„Weiter“** zu klicken.
   - **Danach:** **„Weiter“** lässt sich nicht anklicken: Die Herkunft des Geldes ist Pflicht – ohne
     sie geht es nicht weiter.
9. Tragen Sie `vom privaten Girokonto abgehoben` ein und klicken Sie **„Weiter“**.
   - **Danach:** Es geht mit „Ist der Betrag am selben Tag im Kassenbuch eingetragen?“ weiter.
10. Antworten Sie **„Nein“**.
11. Lassen Sie „Welche Nummer bekommt dieser Eigenbeleg?“ leer und klicken Sie **„Weiter“**.
12. Tragen Sie bei „Welches Datum hat dieser Eigenbeleg?“ `16.10.2026` ein und klicken Sie
    **„Weiter“**.
    - **Danach:** Die Zusammenfassung erscheint. _Nicht offensichtlich:_ „Kassenbuch: Nein“ sperrt
      nichts; die Kanzlei bekommt nur einen Prüfhinweis.
