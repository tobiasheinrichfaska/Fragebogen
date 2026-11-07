# 06 – Angaben ändern, Minijob-Steuer und Ablaufplan

Voraussetzung für alle Fälle: die **Fassung mit den Formular-Entwürfen** – im Testbereich schon geladen;
lokal `npm run build:preview`, Datei `dist-preview/index.html`. Nur erfundene Daten verwenden.

---

## MT-50: Angaben nachträglich ändern (vor der Unterschrift)

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Voraussetzungen:** Personalfragebogen (Entwurf), Rolle „Beschäftigte Person“, Datenschutzhinweis
bestätigt, Familienname und Vornamen eingegeben.

**Schritte:**

1. Unten auf **„Zur Zusammenfassung – alle Angaben ansehen und ändern“** tippen.
   - **Danach:** Die Zusammenfassung erscheint sofort. Oben unter „Das fehlt noch, bevor Sie
     abschließen können:“ stehen die noch fehlenden Pflichtangaben, je mit „beantworten“, und noch
     nicht bestätigte Hinweise („Bestätigung: …“ mit „ansehen und bestätigen“).
2. Bei „Vornamen“ auf **„ändern“** tippen.
   - **Danach:** Die Frage nach den Vornamen erscheint. Der Knopf heißt hier **„Zurück zur
     Zusammenfassung“** (statt „Weiter“).
3. Die Vornamen ändern und **„Zurück zur Zusammenfassung“** tippen.
   - **Danach:** Der Knopf führt zur Zusammenfassung – nicht zur nächsten Frage.
4. Bei „Rente“ auf **„ändern“** tippen und **„Ja“** wählen.
   - **Danach:** Erst kommen genau die Fragen, die die Änderung neu geöffnet hat (Art der Rente,
     Rente seit). Bei der Art der Rente heißt der Knopf „Weiter“. _Nicht offensichtlich:_
     Folgefragen, die schon beantwortet sind, werden übersprungen.
5. Die Art der Rente wählen.
   - **Danach:** „Rente seit“ erscheint. Bei dieser letzten der neu geöffneten Fragen heißt der
     Knopf wieder **„Zurück zur Zusammenfassung“**.
6. „Rente seit“ eingeben und **„Zurück zur Zusammenfassung“** tippen.
   - **Danach:** Die Zusammenfassung erscheint.
7. Bei „Krankenversicherung“ auf **„ändern“**, „privat“ wählen und die Folgefragen beantworten, bis
   die Frage nach Beiträgen für Angehörige mit eigenem privatem Vertrag kommt. (Diese Folgefragen
   gibt es nur, wenn bei „Vereinbarte Art der Beschäftigung“ weder Minijob noch Aushilfe gewählt
   ist – siehe MT-86.)
8. Dort **„Ja“** tippen, dann **„Zurück“**.
   - **Danach:** „Ja“ ist markiert.
9. **„Auswahl aufheben“** tippen.
   - **Danach:** Nichts ist mehr markiert, die Frage bleibt stehen, und der Link verschwindet. Den
     Link gibt es nur bei **freiwilligen** Ja/Nein- und Auswahlfragen; eine Pflichtantwort lässt
     sich nur durch eine andere ersetzen.

**Erwartet:**

- **Nach der Unterschrift** ändert man über „Wer füllt jetzt aus?“: „Unterschrift zurücknehmen“
  (solange nichts weitergegeben wurde) oder „Neue Fassung beginnen“ (siehe MT-24).

---

## MT-53: Überarbeiten – „Weiter“ oder „Zur nächsten fehlenden Angabe“

**Einstieg:** [Personalfragebogen beim Geburtsdatum öffnen](start:personalfragebogen-person-ab-geburtsdatum) – die Person hat ihre Namen eingetragen; Sie stehen bei „Wann sind Sie geboren?“.

**Schritte:**

1. Mit **„Zurück“** bis zur ersten Frage (Familienname) gehen.
   - **Danach:** Steht hinter der aktuellen Frage eine schon beantwortete, gibt es zwei Knöpfe:
     **„Weiter“** (die nächste Frage, auch wenn sie beantwortet ist) und **„Zur nächsten fehlenden
     Angabe“**.
2. **„Weiter“** tippen.
   - **Danach:** Die Vornamen erscheinen.
3. **„Zur nächsten fehlenden Angabe“** tippen.
   - **Danach:** Die App springt über alles Beantwortete zur nächsten **Frage ohne Antwort** – hier
     „Wann sind Sie geboren?“. _Nicht offensichtlich:_ Auch **freiwillige** leere Fragen (z. B. die
     Versicherungsnummer „falls bekannt“) und mit „Vorerst überspringen“ zurückgestellte Fragen
     zählen als fehlend.

**Erwartet:**

- Fehlt nichts mehr, heißt der zweite Knopf **„Zur Zusammenfassung“**.
- Auf einer noch offenen Frage gibt es nur „Weiter“.
- Holen Sie Angaben aus der Zusammenfassung nach (über „beantworten“), führt „Zur nächsten fehlenden
  Angabe“ auch zu einem noch nicht bestätigten Hinweis (seit 06.11.2026).

---

## MT-51: Minijob – der Arbeitgeber legt die Lohnsteuer fest

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Voraussetzungen:** Personalfragebogen (Entwurf).

**Schritte:**

1. Als **Arbeitgeber** den Teil ausfüllen: „Vorgesehene Art der Beschäftigung“ = „Minijob“, „Art der
   Lohnsteuer“ = „pauschal 2 % (Minijob)“. Abschließen.
2. Auf demselben Gerät **„Ich bin: Beschäftigte Person“** wählen. Bei „Was haben Sie mit Ihrem
   Arbeitgeber vereinbart?“ **„einen Minijob“** wählen und weiter bis zur Zusammenfassung.
   - **Danach:** Unterwegs kam die Frage „Wie wird Ihre Beschäftigung versteuert?“ **nicht**; auch
     die Frage nach dem ersten oder weiteren Dienstverhältnis (Steuerklasse) fehlte.
3. In der Zusammenfassung die Zeile „Art der Lohnsteuer“ suchen.
   - **Danach:** Dort steht „Art der Lohnsteuer: pauschal 2 % (Minijob)“ mit dem Vermerk
     **„festgelegt von: Arbeitgeber“** und ohne „ändern“.
4. Gegenprobe: einen neuen Personalfragebogen beginnen und **zuerst** die beschäftigte Person
   ausfüllen: **„Ich bin: Beschäftigte Person“** wählen, bei „Was haben Sie mit Ihrem Arbeitgeber
   vereinbart?“ „einen Minijob“ wählen und weitergehen.
   - **Danach:** Ohne Arbeitgeberteil fragt der Fragebogen die Person selbst: Nach der
     Steuer-Identifikationsnummer kommt „Wie wird Ihre Beschäftigung versteuert?“.
5. Dort „pauschal 2 % (Minijob)“ wählen.
   - **Danach:** Die Steuerklassen-Frage („Welches Dienstverhältnis ist diese Beschäftigung für die
     Lohnsteuer?“) entfällt.
6. **„Zurück“** tippen und „Weiß ich nicht.“ wählen.
   - **Danach:** Jetzt kommt die Steuerklassen-Frage vorsorglich.

**Erwartet:**

- _Nicht offensichtlich:_ Ändert der Arbeitgeber die Steuerart später in einer neuen Fassung,
  bleibt die Unterschrift der Person gültig; die Kanzlei sieht aber einen **Prüfhinweis**
  („… weicht ab: Arbeitgeber gibt … an“). Hatte die Person vorher selbst etwas anderes gewählt und
  macht danach weiter, ersetzt der Fragebogen ihre Antwort und sagt das in einer Meldung.

---

## MT-52: Ablaufplan lesen

**Testbereich:** nein – die Datei `docs/ablaufplan.html` liegt nur im
Projekt.

**Voraussetzungen:** die Datei `docs/ablaufplan.html` (im Browser per Doppelklick öffnen).

**Schritte:**

1. Den Personalfragebogen im Inhaltsverzeichnis wählen.
   - **Danach:** Je Formular steht oben die **Reihenfolge der Stationen**, beim Personalfragebogen
     mit der Empfehlung „Arbeitgeber zuerst“ und dem Grund.
2. Bei der Station „Beschäftigte Person“ die Frage „Wie wird Ihre Beschäftigung versteuert?“ suchen.
   - **Danach:** Jede Station listet ihre Fragen nummeriert in der Reihenfolge des Interviews.
     Fragen mit einer Bedingung sind eingerückt, nennen „Gefragt erst wenn …“ mit der Nummer der
     Frage, von der sie abhängen, und darunter grün **„Warum: …“**.

**Erwartet:**

- Gelb hinterlegt sind **Weichen**: Fragen, von deren Antwort andere abhängen („davon hängen
  Nr. … ab“). Violett: Angaben, die eine andere Station festlegt.
- Die Seite lädt nichts aus dem Internet und funktioniert offline.
- Je Formular steht nur die **neueste Fassung**; eine ältere (z. B. Sofortmeldung 0.2.0) ist oben
  als „ersetzt“ genannt. Darunter stehen die **Gültigkeit** und „Was dieser Fragebogen nicht
  abdeckt“.

---

## MT-54: Gültigkeit der Formularfassung

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ – die Zeile darunter auf der Startseite gehört schon zum Test.

**Voraussetzungen:** Personalfragebogen (Entwurf), Rolle „Arbeitgeber“.

**Schritte:**

1. Auf der Startseite die Zeile unter „Personalfragebogen“ lesen.
   - **Danach:** „gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026“.
2. Als Arbeitgeber beim „Tag der Beschäftigungsaufnahme“ `04.01.2027` eingeben, „Weiter“.
   - **Danach:** Ein gelber Hinweis sagt, dass das Datum außerhalb der Gültigkeit liegt.
3. Zur Zusammenfassung gehen.
   - **Danach:** Oben steht ein Warnhinweis mit Stichtag und Gültigkeit; „Weiter zum Abschluss“ ist
     gesperrt. _Nicht offensichtlich:_ Die Eingabe selbst wird nicht abgelehnt, damit nichts
     verloren geht – nur Unterschreiben und Weitergeben sind gesperrt.
4. Den Tag auf `01.10.2026` ändern.
   - **Danach:** Der Hinweis verschwindet, abschließen ist wieder möglich.

---

## MT-55: Was der Fragebogen nicht abdeckt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Schritte:**

1. Einen Personalfragebogen beginnen und auf „Wer füllt jetzt aus?“ die Karte „Gültigkeit und
   Grenzen“ lesen – sie steht unter dem Abschnitt „Stand“.
   - **Danach:** Die Karte nennt die Gültigkeit und, aufgeklappt, „Was dieser Fragebogen nicht
     abdeckt“ (z. B. keine Entscheidung über die Versicherungspflicht, Papier für Erklärungen mit
     eigenhändiger Unterschrift).
2. Später in der Übersicht unter „Stand“ **„PDF erstellen“**, die PDF öffnen und die letzte Seite
   vor dem Prüfblatt ansehen.
   - **Danach:** Dieselben Punkte stehen in der PDF über den rechtlichen Hinweisen und in der
     Formularansicht der Kanzlei.

---

## MT-56: Mehrere Beschäftigungen über der Beitragsbemessungsgrenze

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Voraussetzungen:** Personalfragebogen (Entwurf).

**Schritte:**

1. Als Person „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantworten und eine
   Zeile mit `1.500,00` € im Monat anlegen; abschließen.
2. Als Arbeitgeber „festes Monatsentgelt“ `5.000,00` €, Beginn im Jahr 2026; abschließen.
3. In der Übersicht unter „Stand“ **„PDF erstellen“**, dann **„Fragebogen schließen“**.
4. Auf der Startseite weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“** klicken
   und dort die PDF aus Schritt 3 einlesen.
   - **Danach:** Prüfhinweise: „Mehrere Beschäftigungen zusammen über der Beitragsbemessungsgrenze
     …“ mit „Zusammen 6.500,00 € im Monat (davon diese Beschäftigung 5.000,00 €)“ und der Grenze
     5.812,50 €, dazu der Hinweis zur Jahresarbeitsentgeltgrenze.

**Erwartet:**

- _Nicht offensichtlich:_ Die anteilige Beitragsberechnung macht der Fragebogen nicht; das steht
  auch unter „Was dieser Fragebogen nicht abdeckt“.

---

## MT-57: Sonderfall sperrt den Fragebogen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen (Entwurf), Rolle „Arbeitgeber“.

**Schritte:**

1. Bei „Arbeitet die Person in Heimarbeit oder als Hausgewerbetreibende(r)?“ **„Ja“** wählen.
   - **Danach:** Ab jetzt steht auf jedem Schritt ein gelber Hinweis: „Für diesen Sonderfall ist der
     Fragebogen nicht gedacht …“ mit „Heimarbeit oder Hausgewerbe (Personengruppen 104, 124)“.
2. Weiter bis zur Zusammenfassung; „Weiter zum Abschluss“ versuchen.
   - **Danach:** Abschließen ist gesperrt; auf „Wer füllt jetzt aus?“ steht der Grund im Abschnitt
     „Stand“ unter „Noch nicht weitergeben“.
3. Die Antwort auf **„Nein“** ändern.
   - **Danach:** Der Hinweis verschwindet. _Nicht offensichtlich:_ Auch eine Befristung unter einer
     Woche (Beginn und „befristet bis“) sperrt, ohne dass dafür eine eigene Frage kommt.

---

## MT-58: Betriebsmerkmale im Stammdaten-Link

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Als Arbeitgeber „landwirtschaftlicher Betrieb: Ja“ und „Besondere Betriebsart: Werkstatt“
   wählen und bis zur Zusammenfassung gehen.
2. Den Link unter „Stammdaten für das nächste Mal“ kopieren.
   - **Danach:** Der Link enthält `landwirtschaft=ja` und `betriebsart=werkstatt`.
3. Den Link in einem neuen Tab öffnen; einen neuen Personalfragebogen als Arbeitgeber beginnen.
   - **Danach:** Im neuen Fragebogen sind beide Antworten schon gesetzt (die Vorbelegung „Nein“
     wird ersetzt), und die passenden Vorfragen je Person (Familienangehörige,
     Werkstattbeschäftigte) erscheinen.

---

## MT-99: Stammdaten-Link erstellen und sehen, was er ausschließt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“).

**Schritte:**

1. Auf der Startseite **„Stammdaten-Link erstellen oder ändern …“** klicken.
   - **Danach:** _Nicht offensichtlich:_ Zuerst steht **nur** die Frage „Was soll der Link öffnen?“
     („Bitte wählen …“) und unter „Ihr Link“ „Wählen Sie zuerst, was der Link öffnen soll.“ – noch
     keine Angaben (seit 05.11.2026).
2. Bei **„Was soll der Link öffnen?“** „einen neuen Fragebogen „Personalfragebogen: Angaben für die
   Lohnabrechnung““ wählen.
   - **Danach:** Jetzt erscheinen nur die Angaben, die der Personalfragebogen nutzt, die
     Überschriften ohne Formularnamen (z. B. „Angaben des Arbeitgebers“). _Nicht offensichtlich:_
     In der öffentlichen Fassung gibt es den Personalfragebogen nicht; er steht nur mit den
     Entwürfen (Testbereich) in der Auswahl.
3. Bei der Firma `Beispiel Gastro GmbH` eingeben.
4. Bei der Betriebsnummer `1234 567X` eingeben.
   - **Danach:** Unter der Betriebsnummer steht der Grund der Ablehnung, und unter „Ihr Link“ steht
     „Bitte erst die markierten Angaben berichtigen.“ statt eines Links.
5. Die Betriebsnummer auf `1234 5671` berichtigen.
   - **Danach:** Der Link erscheint mit „… von 2.000 Zeichen“.
6. Bei **„Lohnsteuer bei Minijobs“** die Auswahl ansehen.
   - **Danach:** Es gibt nur ELStAM, pauschal 2 %, pauschal 20 % und „prüfen lassen“.
7. Dort „pauschal 2 % (Minijob)“ wählen, bei **„Abwälzung der Pauschalsteuer bei Minijobs“** „Ja“.
8. Bei **„Lohnsteuer bei kurzfristigen Aushilfen“** die Auswahl ansehen.
   - **Danach:** Es gibt nur ELStAM, 25 %, 5 % und „prüfen lassen“.
9. Dort „pauschal 25 % (kurzfristige Aushilfe)“ wählen, bei der Abwälzung für Aushilfen „Nein“.
10. Beim Privathaushalt „Ja“ wählen.
    - **Danach:** Ein Kasten „Was diese Angaben bewirken“ erscheint mit „Je nach den Angaben zur
      Person macht die App keine Vorschläge – Minijob oder kurzfristige Beschäftigung im
      Privathaushalt …“.
11. Bei der besonderen Betriebsart „knappschaftlicher Betrieb (Bergbau)“ wählen.
    - **Danach:** Im Kasten kommt dazu: „Die App macht für diesen Betrieb keine Vorschläge –
      Beschäftigung in einem knappschaftlichen Betrieb …“.
12. Bei der Seeschifffahrt „Ja“ wählen.
    - **Danach:** Im Kasten kommt dazu: „… Beschäftigung an Bord eines Seeschiffs …“ (je nach
      Person).
13. Alle drei zurücksetzen (Privathaushalt „Nein“, Betriebsart „Nein, keine davon“, Seeschifffahrt
    „Nein“).
    - **Danach:** Der Kasten verschwindet.
14. Bei „Was soll der Link öffnen?“ kurz „SEPA-Basislastschriftmandat“ wählen.
    - **Danach:** Beim SEPA-Mandat sind Firma und Lohnsteuer weg; darunter steht „Nicht in diesem
      Link, weil sie zu anderen Formularen gehören: …“ mit diesen Angaben, und der Link endet auf
      `formular=sepa-mandat`.
15. Bei „Was soll der Link öffnen?“ wieder den Personalfragebogen wählen.
    - **Danach:** Zurück beim Personalfragebogen stehen alle Antworten wieder da.
16. **„Kopieren“** klicken.
    - **Danach:** Der Link beginnt mit `#stammdaten=1&formular=personalfragebogen`.
17. Zur Startseite; dort weiter unten im Abschnitt „Kanzlei“ **„Eingänge zusammenführen …“**
    öffnen, unten **„Stammdaten-Link erstellen oder ändern“** aufklappen, den kopierten Link bei
    „Vorhandenen Link einfügen“ einfügen und **„Einlesen“** klicken.
    - **Danach:** „Link eingelesen: … Angaben“; der Personalfragebogen ist gewählt, alle Antworten
      aus Schritt 3–9 stehen wieder da. Die Liste der Eingänge bleibt unverändert.

---

## MT-100: Lohnsteuer-Regel aus dem Link erscheint mit der Frage

**Einstieg:** [Mit dem Stammdaten-Link öffnen](start:personalfragebogen-stammdaten-link) – wie das Lesezeichen der Kanzlei: Firma „Beispiel Gastro GmbH“, Betriebsnummer, Lohnsteuer bei Minijobs pauschal 2 % mit Abwälzung, bei Aushilfen pauschal 25 % ohne. Die App beginnt gleich einen neuen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Schritte:**

1. **„Ich bin: Arbeitgeber“** wählen.
   - **Danach:** Oben erscheint „Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.“
2. Mit **„Weiter“** bis **„Wie ist die Beschäftigung vorgesehen?“** gehen; bei Pflichtfragen ohne
   Antwort (z. B. dem Namen der Person) **„Vorerst überspringen“**.
   - **Danach:** Unterwegs waren Firma und Betriebsnummer schon beantwortet.
3. Dort „Minijob (bis 603 € im Monat)“ wählen und weiter bis **„Wie soll die Lohnsteuer erhoben
   werden?“** gehen.
   - **Danach:** Die Lohnsteuer-Frage erscheint mit „pauschal 2 % (Minijob)“ gewählt und dem Hinweis
     „Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.“ _Nicht offensichtlich:_ Die Fragen
     werden trotzdem gezeigt – der Link belegt nur vor, er beantwortet nichts ungesehen.
4. **„Weiter“** tippen.
   - **Danach:** Die Frage nach der Abwälzung folgt mit „Ja“.
5. Bei der Abwälzung **„Weiter“** tippen. Dann zurück zur Beschäftigungsart gehen, „kurzfristige
   Aushilfe …“ wählen und wieder bis zur Lohnsteuer gehen.
   - **Danach:** Jetzt ist „pauschal 25 % (kurzfristige Aushilfe)“ vorbelegt.
6. **„Weiter“** tippen.
   - **Danach:** Die Abwälzung ist mit „Nein“ vorbelegt.
7. **„Zurück“** tippen und die Lohnsteuer auf „nach den Lohnsteuermerkmalen (ELStAM)“ ändern.
8. Zurück zur Beschäftigungsart gehen, wieder „Minijob (bis 603 € im Monat)“ wählen und bis zur
   Lohnsteuer gehen.
   - **Danach:** „ELStAM“ bleibt stehen, ohne den Hinweis „Vorbelegt …“: Was Sie geändert haben,
     überschreibt der Link nicht mehr.

---

## MT-101: Der Link fürs nächste Mal behält die Angaben anderer Formulare

**Einstieg:** [Mit dem Stammdaten-Link öffnen](start:personalfragebogen-stammdaten-link) – wie das Lesezeichen der Kanzlei: Firma „Beispiel Gastro GmbH“, Betriebsnummer, Lohnsteuer bei Minijobs pauschal 2 % mit Abwälzung, bei Aushilfen pauschal 25 % ohne. Die App beginnt gleich einen neuen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Schritte:**

1. **„Ich bin: Arbeitgeber“** wählen.
   - **Danach:** Oben erscheint „Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.“
2. Unten auf **„Zur Zusammenfassung – alle Angaben ansehen und ändern“** tippen und den Abschnitt
   **„Stammdaten für das nächste Mal“** lesen.
   - **Danach:** Der Text nennt die Angaben dieses Teils (Firma, Betriebsnummer und die vorbelegten
     Angaben zum Betrieb wie „Privathaushalt“) und „Weitere 4 Angaben aus Ihrem bisherigen Link
     bleiben erhalten.“ Der Link enthält weiterhin `lohnsteuerMinijob=pauschal2` und
     `lohnsteuerAushilfe=pauschal25` – die Lohnsteuer-Regeln, obwohl in diesem Fragebogen noch keine
     Beschäftigungsart gewählt ist. Er enthält keine Daten der Person.
3. In der Adresszeile `stammdaten=1` in `stammdaten=2` ändern und die Seite neu laden (F5).
   - **Danach:** Oben erscheint „Stammdaten-Link: Dieser Stammdaten-Link stammt aus einer anderen
     Version der App und kann nicht gelesen werden.“ Die App zeigt die Startseite; ein neuer
     Fragebogen beginnt ohne vorbelegte Firma.

---

## MT-109: Das Lesezeichen beginnt gleich einen neuen Fragebogen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) und klicken
**„Stammdaten-Link erstellen oder ändern …“**.

**Schritte:**

1. Die Frage **„Was soll der Link öffnen?“** ansehen.
   - **Danach:** Gewählt ist noch nichts („Bitte wählen …“). Der Hinweis darunter sagt, dass die
     Seite danach nur die Angaben dieses Formulars zeigt und dass der Link nur das Formular nennt,
     keine Fassung.
2. Dort „einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung““ wählen. Firma
   `Beispiel Bau GmbH`, Betriebsnummer `1234 5671` eingeben; **„Kopieren“**.
3. Den Link in einem neuen Tab öffnen.
   - **Danach:** Sofort ein **neuer, leerer Fragebogen** „Personalfragebogen: Angaben für die
     Sofortmeldung“ bei „Wer füllt jetzt aus?“ – ohne Umweg über die Startseite. Oben: „Neuer
     Fragebogen … aus Ihrem Lesezeichen. Die Angaben aus dem Link stehen schon im Teil
     „Arbeitgeber“.“
4. Im ersten Tab bei „Was soll der Link öffnen?“ „die Startseite (das Formular wählt man dort)“
   wählen.
   - **Danach:** Jetzt erscheinen die Angaben **aller** Formulare; jede steht nur einmal da, auch
     wenn mehrere Formulare sie nutzen („Genutzt in: …“), die Überschriften mit dem Formularnamen in
     Klammern.
5. **„Kopieren“** klicken und den Link in einem neuen Tab öffnen.
   - **Danach:** Der neue Tab zeigt die Startseite wie früher.
6. Im neuen Tab einen neuen Fragebogen „Personalfragebogen: Angaben für die Sofortmeldung“
   beginnen und **„Ich bin: Arbeitgeber“** wählen.
   - **Danach:** Firma und Betriebsnummer stehen trotzdem schon da: Der Link trägt sie in jeden
     neuen Fragebogen beim Arbeitgeber ein.
7. In der öffentlichen App (nicht im Testbereich) einen Link mit `formular=personalfragebogen`
   öffnen: an die Adresse der öffentlichen App `#stammdaten=1&formular=personalfragebogen` anhängen
   und die Seite neu laden (F5).
   - **Danach:** Gelb: „Ihr Lesezeichen soll einen neuen Fragebogen „personalfragebogen“ öffnen;
     diese Fassung der App enthält ihn nicht. Bitte wählen Sie unten selbst.“ – die Startseite
     erscheint. _Nicht offensichtlich:_ Der Link öffnet immer die neueste Fassung des Formulars; er
     bleibt auch nach einer neuen Fassung gültig.

---

## MT-86: Kontaktdaten, A1 beim Arbeitgeber, Krankenversicherung im Minijob

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:**

1. Bei „Telefonnummer“ `12345` eingeben und **„Weiter“** tippen.
   - **Danach:** Die Eingabe wird mit einem Hinweis abgelehnt (Telefonnummer mit Vorwahl).
2. Die Telefonnummer auf `0721 123456` ändern und **„Weiter“** tippen.
   - **Danach:** Die Nummer wird angenommen, es geht weiter.
3. Bei „E-Mail-Adresse“ `erika.beispiel.de` eingeben und **„Weiter“** tippen.
   - **Danach:** Die Eingabe wird mit einem Hinweis abgelehnt (E-Mail wie name@beispiel.de).
4. Die E-Mail-Adresse auf `Erika@Beispiel.DE` ändern und **„Weiter“** tippen.
   - **Danach:** Die Adresse wird angenommen, es geht weiter. _Nicht offensichtlich:_ Die E-Mail
     wird als `Erika@beispiel.de` gespeichert – der Teil nach dem @ in Kleinbuchstaben, der Teil
     davor wie eingegeben.
5. Bis „Vereinbarte Art der Beschäftigung“ weitergehen und „einen Minijob“ wählen.
6. Bis „Krankenversicherung“ weitergehen und „privat“ wählen.
   - **Danach:** Nach „privat“ folgt nur die Frage nach dem Versicherungsunternehmen. Bescheinigung
     für den Zuschuss, Stand 2002, die letzten fünf Jahre, frühere Befreiung und letzte gesetzliche
     Krankenkasse kommen im Minijob **nicht** (kein Zuschuss, keine Versicherungspflicht).
7. Über „App neu starten“ einen neuen Personalfragebogen als **„Arbeitgeber“** beginnen und die
   Fragen bis „Besondere Fälle“ durchgehen.
   - **Danach:** Der Arbeitgeber wird einmal gefragt, ob sein Betrieb Beschäftigte mit
     Sozialversicherung in einem anderen Staat hat (vorbelegt „Nein“; steht danach im
     Stammdaten-Link als `auslandSv`). Erst bei „Ja“ kommen je Person die Fragen nach dem anderen
     Staat und der A1-Bescheinigung.

**Erwartet:**

- Die beschäftigte Person wird nirgends nach einer A1-Bescheinigung gefragt.

---

## MT-87: Hauptstatus und Zusätze statt Ankreuzliste

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:**

1. Geburtsdatum `17.05.2005` eingeben und bis „Was machen Sie hauptsächlich …“ weitergehen.
   - **Danach:** Bei dieser Frage kann man nur **einen** Status wählen.
2. „Schülerin oder Schüler“ wählen und weitergehen.
   - **Danach:** Es kommen „Beziehen Sie eine Rente?“ (vorbelegt „Nein“) und die Schulart, aber
     keine Fragen nach Grundsicherungsgeld, Elternzeit oder Pension.
3. Über **„Zur Zusammenfassung“** den Status auf „im Ruhestand (Rente oder Pension)“ ändern und
   weitergehen.
   - **Danach:** Jetzt kommt „Beziehen Sie eine Pension …?“; Grundsicherungsgeld wird nicht
     gefragt.
4. Das Geburtsdatum auf `01.06.1958` ändern und die folgenden Fragen ansehen.
   - **Danach:** _Nicht offensichtlich:_ Die Frage nach der Regelaltersgrenze kommt **nicht** – sie
     gilt ohne Rückfrage als erreicht; es erscheinen die Fragen zur Aktivrente.
5. Das Geburtsdatum auf `15.03.1960` ändern und die folgenden Fragen ansehen.
   - **Danach:** Jetzt fragt der Fragebogen „Haben Sie zu Beginn dieser Beschäftigung die
     Regelaltersgrenze … erreicht?“ (Ja / Nein / Weiß ich nicht).
6. Das Geburtsdatum auf `01.01.1965` ändern und die folgenden Fragen ansehen.
   - **Danach:** _Nicht offensichtlich:_ Die Frage kommt wieder **nicht** – die Regelaltersgrenze
     gilt ohne Rückfrage als nicht erreicht. Die Grenzen hängen an der Fassung für einen Beginn im
     Jahr 2026.
7. Den Status auf „Arbeitnehmerin oder Arbeitnehmer …“ ändern.
   - **Danach:** Jetzt kommen „Grundsicherungsgeld?“ und „Elternzeit bei einem anderen
     Arbeitgeber?“.
