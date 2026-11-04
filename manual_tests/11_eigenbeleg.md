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
2. Gehen Sie mit **„Zurück“** wieder zu „Wofür wurde bezahlt?“ und wählen Sie **„ein Essen oder
   Getränke mit Gästen (Bewirtung)“**.
3. Lesen Sie die nächste Frage und klicken Sie **„Verstanden“**.

**Erwartet:**

- Schritt 1: Oben erscheint ein Warnkasten „Für diesen Sonderfall ist der Fragebogen nicht gedacht …“
  mit „Für eine Spende brauchen Sie eine Zuwendungsbestätigung des Empfängers; ein Eigenbeleg genügt
  nicht.“ Der Kasten endet mit „… bei der Stelle nach, die den Fragebogen bekommt (hier: Buchhaltung
  oder Kanzlei).“
- Schritt 2: Der Warnkasten verschwindet. Die nächste Frage beginnt mit „Wichtig bei einer
  Bewirtung: Ohne die Rechnung der Gaststätte ist die Ausgabe nicht abziehbar.“ Darunter steht in
  einfachen Worten: Rechnung der Gaststätte nötig (§ 4 Abs. 5 Satz 1 Nr. 2 EStG), Zweitschrift
  anfragen, Bewirtung in der eigenen Wohnung in der Regel privat. Es gibt **nur einen** Knopf,
  „Verstanden“.
- Schritt 3: _Nicht offensichtlich:_ Die Bewirtung ist **nicht** gesperrt; es geht mit „Wo fand die
  Bewirtung statt?“ weiter.

---

## MT-111: Bewirtung unterschreiben und als PDF ausgeben

**Einstieg:** [Bewirtung in der Zusammenfassung öffnen](start:eigenbeleg-bewirtung-zusammenfassung) –
eine Bewirtung über 250,00 € in einem Gasthaus ist vollständig ausgefüllt, ohne Belegnummer.

**Schritte:**

1. Sehen Sie die Zusammenfassung durch.
2. Klicken Sie **„Weiter zum Abschluss“**, setzen Sie das Häkchen, wählen Sie **„Namen tippen“**,
   tippen Sie `Erika Musterfrau` und klicken Sie **„Unterschreiben und abschließen“**.
3. Klicken Sie **„PDF erstellen“** und öffnen Sie die PDF.

**Erwartet:**

- Schritt 1: Statt „Wofür wurde die Ausgabe im Betrieb gebraucht?“ stehen bei der Bewirtung Anlass und
  Teilnehmende (zwei Zeilen). Fragen zu Entnahme, Einlage oder Geldtransit kommen nicht vor. Die
  Belegnummer ist leer – sie ist freiwillig, die Kanzlei vergibt sie sonst.
- Schritt 2: Das Unterschreiben klappt ohne Fehlermeldung.
- Schritt 3: In der PDF steht beim Hinweis zur Bewirtung die Antwort „Verstanden“; bei der
  Belegnummer steht keine Nummer. _Nicht offensichtlich:_ Die Prüfhinweise für die Kanzlei stehen
  **nicht** in der PDF der ausstellenden Person – sie erscheinen erst beim Zusammenführen (MT-112).

---

## MT-112: Kanzlei sieht die Prüfhinweise zum Eigenbeleg

**Einstieg:** [Kanzlei mit dem Eigenbeleg öffnen](start:kanzlei-eigenbeleg-bewirtung) – der
unterschriebene Eigenbeleg aus MT-111 liegt im Eingang.

**Schritte:**

1. Sehen Sie den Bericht zur Datei und die Prüfhinweise an.

**Erwartet:**

- Der Eigenbeleg ist geprüft und vollständig.
- Unter „Prüfhinweise:“ stehen unter anderem „Ohne Vorsteuer buchen …“, „Bewirtung per Eigenbeleg …“,
  „Bewirtung in einer Gaststätte ohne deren Rechnung …“, „Eigenbeleg über eine Ausgabe ab 250 € …“ und
  „Keine Belegnummer angegeben …“.
- _Nicht offensichtlich:_ Die Hinweise sperren nichts. Bei 249,99 € fehlt der Hinweis „ab 250 €“ (das
  prüft die automatische Testsuite; hier nicht nachstellen).

---

## MT-113: Privatentnahme bei einer GmbH

**Einstieg:** [Neuen Vorgang öffnen](start:eigenbeleg-vorgangsart-offen) – Unternehmen „Beispiel
GmbH“, Mandantennummer und Name sind eingetragen; Sie stehen bei „Was möchten Sie mit diesem
Eigenbeleg belegen?“.

**Schritte:**

1. Wählen Sie **„eine Privatentnahme …“** und bei der Rechtsform **„Kapitalgesellschaft (GmbH, UG oder
   AG)“**.
2. Bestätigen Sie den Hinweis mit **„Verstanden“** und beantworten Sie die folgenden Fragen bis zur
   Zusammenfassung (Tag `15.10.2026`, **„bar aus der Kasse des Betriebs“**, Betrag `200,00`, Zweck
   leer lassen, Kassenbuch **„Ja“**, Datum des Eigenbelegs `16.10.2026`).

**Erwartet:**

- Schritt 1: Die Rechtsform wird **nur** bei einer Privatentnahme oder Einlage gefragt. Bei der GmbH
  kommt der Hinweis „Bitte beachten Sie: In einer GmbH, UG oder AG gehört das Geld der Gesellschaft.“
  mit der Erklärung zu Verrechnungskonto, Darlehen und verdeckter Gewinnausschüttung und nur dem
  Knopf „Verstanden“.
- Schritt 2: Es gibt keine Fragen nach Zahlungsempfänger, Ort, Währung oder Zahlungsart; der Betrag
  heißt „Wie viel Geld war es, in Euro?“. Der Zweck ist freiwillig. _Nicht offensichtlich:_ Der
  Eigenbeleg ist trotz GmbH nicht gesperrt; die Kanzlei bekommt einen Prüfhinweis.

---

## MT-114: Von der Privatentnahme zum Geldtransit wechseln

**Einstieg:** [Privatentnahme in der Zusammenfassung öffnen](start:eigenbeleg-privatentnahme-gmbh-zusammenfassung)
– eine Privatentnahme über 200,00 € bei einer GmbH ist ausgefüllt.

**Schritte:**

1. Klicken Sie in der Zusammenfassung bei „Art des Vorgangs“ auf **„ändern“** und wählen Sie **„einen
   Geldtransit …“**.
2. Weiter: **„aus der Kasse auf das Bankkonto (Einzahlung bei der Bank)“**, gebracht von
   `Max Mustermann`, Betrag `1.250,00`, Grund `Tageseinnahmen zur Bank gebracht`, Kassenbuch
   **„Ja“**, Beleg der Bank **„Nein“**; bis zur Zusammenfassung.

**Erwartet:**

- Rechtsform, Hinweis zur GmbH, „entnommen von“ und der Zweck werden nicht mehr gefragt. Die
  Zusammenfassung nennt die alten Antworten unter „Diese Angaben werden nicht mit unterschrieben, weil
  ihre Voraussetzung nicht mehr gilt …“.
- Neu sind „Von wo nach wo wurde das Geld gebracht?“, „Wer hat das Geld gebracht oder abgeholt?“ und
  „Geben Sie den Beleg der Bank oder den Kontoauszug mit ab?“.
- _Nicht offensichtlich:_ Der Betrag ist mit 200,00 € vorbelegt, weil Entnahme und Geldtransit
  dasselbe Betragsfeld nutzen; überschreiben Sie ihn mit `1.250,00`.

---

## MT-115: Einlage in einem Einzelunternehmen

**Einstieg:** [Neuen Vorgang öffnen](start:eigenbeleg-vorgangsart-offen).

**Schritte:**

1. Wählen Sie **„eine Einlage …“** und bei der Rechtsform **„Einzelunternehmen“**.
2. Beantworten Sie die Fragen bis zur Zusammenfassung: **„bar in die Kasse des Betriebs“**, eingelegt
   von `Erika Musterfrau`, Betrag `500,00`, Herkunft `vom privaten Girokonto abgehoben`, Kassenbuch **„Nein“**,
   Datum des Eigenbelegs `16.10.2026`.

**Erwartet:**

- Beim Einzelunternehmen kommt **kein** Hinweis zur GmbH.
- Die Herkunft des Geldes ist Pflicht – ohne sie geht es nicht weiter.
- _Nicht offensichtlich:_ „Kassenbuch: Nein“ sperrt nichts; die Kanzlei bekommt nur einen Prüfhinweis.
