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
2. Bei „Vornamen“ auf **„ändern“** tippen, den Namen ändern, **„Weiter“**.
3. Bei „Rente“ auf **„ändern“** tippen und **„Ja“** wählen.
4. Die Art der Rente wählen und „Rente seit“ eingeben, **„Weiter“**.
5. Bei „Krankenversicherung“ auf **„ändern“**, „privat“ wählen und die Folgefragen beantworten, bis
   die Frage nach Beiträgen für Angehörige mit eigenem privatem Vertrag kommt. Dort **„Ja“** tippen,
   dann **„Zurück“**. (Diese Folgefragen gibt es nur, wenn bei „Vereinbarte Art der Beschäftigung“
   weder Minijob noch Aushilfe gewählt ist – siehe MT-86.)
6. **„Auswahl aufheben“** tippen.

**Erwartet:**

- Schritt 1: Die Zusammenfassung erscheint sofort; noch fehlende Pflichtangaben stehen oben.
- Schritt 2: Der Knopf heißt hier **„Zurück zur Zusammenfassung“** (statt „Weiter“) und führt
  dorthin – nicht zur nächsten Frage.
- Schritt 3–4: Erst kommen genau die Fragen, die die Änderung neu geöffnet hat (Art der Rente,
  Rente seit) – dort heißt der Knopf „Weiter“ –, bei der letzten heißt er wieder „Zurück zur
  Zusammenfassung“. _Nicht offensichtlich:_ Folgefragen, die schon
  beantwortet sind, werden übersprungen.
- Schritt 5–6: „Ja“ ist markiert; nach „Auswahl aufheben“ ist nichts mehr markiert, die Frage bleibt
  stehen, und der Link verschwindet. Den Link gibt es nur bei **freiwilligen** Ja/Nein- und
  Auswahlfragen; eine Pflichtantwort lässt sich nur durch eine andere ersetzen.
- **Nach der Unterschrift** ändert man über „Wer füllt jetzt aus?“: „Unterschrift zurücknehmen“
  (solange nichts weitergegeben wurde) oder „Neue Fassung beginnen“ (siehe MT-24).

---

## MT-53: Überarbeiten – „Weiter“ oder „Zur nächsten fehlenden Angabe“

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ und spielen MT-50 durch – oder Sie machen direkt nach MT-50 weiter.

**Voraussetzungen:** wie MT-50; einige Fragen beantwortet, das Geburtsdatum noch nicht.

**Schritte:**

1. Mit **„Zurück“** bis zur ersten Frage (Familienname) gehen.
2. **„Weiter“** tippen.
3. **„Zur nächsten fehlenden Angabe“** tippen.

**Erwartet:**

- Steht hinter der aktuellen Frage eine schon beantwortete, gibt es zwei Knöpfe: **„Weiter“** (die
  nächste Frage, auch wenn sie beantwortet ist) und **„Zur nächsten fehlenden Angabe“**.
- Schritt 2 zeigt die Vornamen, Schritt 3 springt über alles Beantwortete zur nächsten **Frage
  ohne Antwort** – hier „Wann sind Sie geboren?“. _Nicht offensichtlich:_ Auch **freiwillige**
  leere Fragen (z. B. die Versicherungsnummer „falls bekannt“) und mit „Vorerst überspringen“
  zurückgestellte Fragen zählen als fehlend.
- Fehlt nichts mehr, heißt der zweite Knopf **„Zur Zusammenfassung“**.
- Auf einer noch offenen Frage gibt es nur „Weiter“.

---

## MT-51: Minijob – der Arbeitgeber legt die Lohnsteuer fest

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Voraussetzungen:** Personalfragebogen (Entwurf).

**Schritte:**

1. Als **Arbeitgeber** den Teil ausfüllen: „Vorgesehene Art der Beschäftigung“ = „Minijob“, „Art der
   Lohnsteuer“ = „pauschal 2 % (Minijob)“. Abschließen.
2. Auf demselben Gerät „Ich bin: Beschäftigte Person“ wählen. Bei „Was haben Sie mit Ihrem
   Arbeitgeber vereinbart?“ **„einen Minijob“** wählen und weiter bis zur Zusammenfassung.
3. Gegenprobe: einen neuen Personalfragebogen beginnen, **zuerst** die beschäftigte Person ausfüllen
   und dort „einen Minijob“ wählen.

**Erwartet:**

- Schritt 2: Die Frage „Wie wird Ihre Beschäftigung versteuert?“ kommt **nicht**; die
  Zusammenfassung zeigt „Art der Lohnsteuer: pauschal 2 % (Minijob)“ mit dem Vermerk
  **„festgelegt von: Arbeitgeber“** und ohne „ändern“. Die Frage nach dem ersten oder weiteren
  Dienstverhältnis (Steuerklasse) fehlt.
- Schritt 3: Ohne Arbeitgeberteil fragt der Fragebogen die Person selbst. Bei „pauschal …“ entfällt
  die Steuerklassen-Frage, bei „Weiß ich nicht.“ kommt sie vorsorglich.
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
2. Bei der Station „Beschäftigte Person“ die Frage „Wie wird Ihre Beschäftigung versteuert?“ suchen.

**Erwartet:**

- Je Formular steht oben die **Reihenfolge der Stationen**, beim Personalfragebogen mit der
  Empfehlung „Arbeitgeber zuerst“ und dem Grund.
- Jede Station listet ihre Fragen nummeriert in der Reihenfolge des Interviews. Fragen mit einer
  Bedingung sind eingerückt, nennen „Gefragt erst wenn …“ mit der Nummer der Frage, von der sie
  abhängen, und darunter grün **„Warum: …“**.
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
2. Als Arbeitgeber beim „Tag der Beschäftigungsaufnahme“ **04.01.2027** eingeben, „Weiter“.
3. Zur Zusammenfassung gehen.
4. Den Tag auf **01.10.2026** ändern.

**Erwartet:**

- Schritt 1: „gilt für „Tag der Beschäftigungsaufnahme“ vom 01.01.2026 bis 31.12.2026“.
- Schritt 2: Ein gelber Hinweis sagt, dass das Datum außerhalb der Gültigkeit liegt.
- Schritt 3: Oben steht ein Warnhinweis mit Stichtag und Gültigkeit; „Weiter zum Abschluss“ ist
  gesperrt. _Nicht offensichtlich:_ Die Eingabe selbst wird nicht abgelehnt, damit nichts verloren
  geht – nur Unterschreiben und Weitergeben sind gesperrt.
- Schritt 4: Der Hinweis verschwindet, abschließen ist wieder möglich.

---

## MT-55: Was der Fragebogen nicht abdeckt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Schritte:**

1. Einen Personalfragebogen beginnen und auf „Wer füllt jetzt aus?“ die Karte „Gültigkeit und
   Grenzen“ lesen.
2. Später die PDF öffnen und die letzte Seite vor dem Prüfblatt ansehen.

**Erwartet:**

- Die Karte nennt die Gültigkeit und, aufgeklappt, „Was dieser Fragebogen nicht abdeckt“ (z. B.
  keine Entscheidung über die Versicherungspflicht, Papier für Erklärungen mit eigenhändiger
  Unterschrift).
- Dieselben Punkte stehen in der PDF über den rechtlichen Hinweisen und in der Formularansicht der
  Kanzlei.

---

## MT-56: Mehrere Beschäftigungen über der Beitragsbemessungsgrenze

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“.

**Voraussetzungen:** Personalfragebogen (Entwurf).

**Schritte:**

1. Als Person „Haben Sie zurzeit noch eine andere Beschäftigung?“ mit „Ja“ beantworten und eine
   Zeile mit **1.500,00 €** im Monat anlegen; abschließen.
2. Als Arbeitgeber „festes Monatsentgelt“ **5.000,00 €**, Beginn im Jahr 2026; abschließen.
3. In der Station Kanzlei die PDF einlesen.

**Erwartet:**

- Prüfhinweise: „Mehrere Beschäftigungen zusammen über der Beitragsbemessungsgrenze …“ mit
  „Zusammen 6.500,00 € im Monat (davon diese Beschäftigung 5.000,00 €)“ und der Grenze 5.812,50 €,
  dazu der Hinweis zur Jahresarbeitsentgeltgrenze.
- _Nicht offensichtlich:_ Die anteilige Beitragsberechnung macht der Fragebogen nicht; das steht
  auch unter „Was dieser Fragebogen nicht abdeckt“.

---

## MT-57: Sonderfall sperrt den Fragebogen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Voraussetzungen:** Personalfragebogen (Entwurf), Rolle „Arbeitgeber“.

**Schritte:**

1. Bei „Arbeitet die Person in Heimarbeit oder als Hausgewerbetreibende(r)?“ **„Ja“** wählen.
2. Weiter bis zur Zusammenfassung; „Weiter zum Abschluss“ versuchen.
3. Die Antwort auf **„Nein“** ändern.

**Erwartet:**

- Ab Schritt 1 steht auf jedem Schritt ein gelber Hinweis: „Für diesen Sonderfall ist der
  Fragebogen nicht gedacht …“ mit „Heimarbeit oder Hausgewerbe (Personengruppen 104, 124)“.
- Schritt 2: Abschließen ist gesperrt; auf „Wer füllt jetzt aus?“ steht der Grund unter „Noch
  nicht weitergeben“.
- Schritt 3: Der Hinweis verschwindet. _Nicht offensichtlich:_ Auch eine Befristung unter einer
  Woche (Beginn und „befristet bis“) sperrt, ohne dass dafür eine eigene Frage kommt.

---

## MT-58: Betriebsmerkmale im Stammdaten-Link

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Arbeitgeber“.

**Schritte:**

1. Als Arbeitgeber „landwirtschaftlicher Betrieb: Ja“ und „Besondere Betriebsart: Werkstatt“
   wählen und bis zur Zusammenfassung gehen.
2. Den Link unter „Stammdaten für das nächste Mal“ kopieren und in einem neuen Tab öffnen; einen
   neuen Personalfragebogen als Arbeitgeber beginnen.

**Erwartet:**

- Der Link enthält `landwirtschaft=ja` und `betriebsart=werkstatt`.
- Im neuen Fragebogen sind beide Antworten schon gesetzt (die Vorbelegung „Nein“ wird ersetzt),
  und die passenden Vorfragen je Person (Familienangehörige, Werkstattbeschäftigte) erscheinen.

---

## MT-99: Stammdaten-Link erstellen und sehen, was er ausschließt

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“).

**Schritte:**

1. Auf der Startseite **„Stammdaten-Link erstellen oder ändern …“** klicken.
2. Bei der Firma `Beispiel Gastro GmbH` eingeben, bei der Betriebsnummer `1234 567X`.
3. Die Betriebsnummer auf `1234 5671` berichtigen.
4. Bei **„Lohnsteuer bei Minijobs“** „pauschal 2 % (Minijob)“ wählen, bei **„Abwälzung der
   Pauschalsteuer bei Minijobs“** „Ja“; bei **„Lohnsteuer bei kurzfristigen Aushilfen“** „pauschal
   25 % (kurzfristige Aushilfe)“, bei der Abwälzung für Aushilfen „Nein“; bei der Mandantennummer
   `99999`.
5. Beim Privathaushalt „Ja“ wählen; danach bei der besonderen Betriebsart „knappschaftlicher
   Betrieb (Bergbau)“; danach bei der Seeschifffahrt „Ja“.
6. Alle drei zurücksetzen (Privathaushalt „Nein“, Betriebsart „Nein, keine davon“, Seeschifffahrt
   „Nein“). Unter „Ihr Link“ bei **„Was soll der Link öffnen?“** „einen neuen Fragebogen
   „Personalfragebogen: Angaben für die Lohnabrechnung““ wählen und **„Kopieren“** klicken.
7. Zur Startseite, **„Eingänge zusammenführen …“** öffnen, unten **„Stammdaten-Link erstellen oder
   ändern“** aufklappen, den kopierten Link bei „Vorhandenen Link einfügen“ einfügen und
   **„Einlesen“** klicken.

**Erwartet:**

- Schritt 1: Jede Angabe steht nur einmal da, auch wenn mehrere Formulare sie nutzen („Genutzt in:
  …“). _Nicht offensichtlich:_ In der öffentlichen Fassung gibt es nur Firma und Betriebsnummer;
  Lohnsteuer, Tarifvertrag und die Angaben der Monatsmeldung erscheinen nur mit den Entwürfen
  (Testbereich).
- Schritt 2: Unter der Betriebsnummer steht der Grund der Ablehnung, und unter „Ihr Link“ steht
  „Bitte erst die markierten Angaben berichtigen.“ statt eines Links.
- Schritt 3: Der Link erscheint mit „… von 2.000 Zeichen“.
- Schritt 4: Bei „Lohnsteuer bei Minijobs“ gibt es nur ELStAM, pauschal 2 %, pauschal 20 % und
  „prüfen lassen“, bei den Aushilfen nur ELStAM, 25 %, 5 % und „prüfen lassen“.
- Schritt 5: Ein Kasten „Was diese Angaben bewirken“ erscheint:
  - beim Privathaushalt „Je nach den Angaben zur Person macht die App keine Vorschläge – Minijob oder
    kurzfristige Beschäftigung im Privathaushalt …“;
  - bei der Knappschaft „Die App macht für diesen Betrieb keine Vorschläge – Beschäftigung in einem
    knappschaftlichen Betrieb …“;
  - bei der Seeschifffahrt „… Beschäftigung an Bord eines Seeschiffs …“ (je nach Person).
- Schritt 6: Der Kasten verschwindet. Der Link beginnt mit `#stammdaten=1&formular=personalfragebogen`.
- Schritt 7: „Link eingelesen: … Angaben“, alle Antworten aus Schritt 2–4 stehen wieder da. Die
  Liste der Eingänge bleibt unverändert.

---

## MT-100: Lohnsteuer-Regel aus dem Link erscheint mit der Frage

**Einstieg:** Sie öffnen den Link aus MT-99 in einem neuen Tab – er beginnt gleich einen neuen
Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ – und wählen „Ich bin: Arbeitgeber“.

**Voraussetzungen:** MT-99 (der kopierte Link).

**Schritte:**

1. Bis **„Wie ist die Beschäftigung vorgesehen?“** gehen und „Minijob (bis 603 € im Monat)“ wählen.
2. Bei **„Wie soll die Lohnsteuer erhoben werden?“** und bei der Abwälzung jeweils **„Weiter“**.
3. Zurück zur Beschäftigungsart, „kurzfristige Aushilfe …“ wählen und wieder bis zur Lohnsteuer
   gehen.
4. Die Lohnsteuer auf „nach den Lohnsteuermerkmalen (ELStAM)“ ändern; zurück zur Beschäftigungsart
   und wieder „Minijob“ wählen.

**Erwartet:**

- Beim Beginnen: „Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.“; Firma und
  Betriebsnummer sind schon beantwortet.
- Schritt 1–2: Die Lohnsteuer-Frage erscheint mit „pauschal 2 % (Minijob)“ gewählt und dem Hinweis
  „Vorbelegt aus Ihrem Stammdaten-Link – bitte prüfen.“; die Abwälzung folgt mit „Ja“. _Nicht
  offensichtlich:_ Die Fragen werden trotzdem gezeigt – der Link belegt nur vor, er beantwortet
  nichts ungesehen.
- Schritt 3: Jetzt ist „pauschal 25 % (kurzfristige Aushilfe)“ vorbelegt, die Abwälzung „Nein“.
- Schritt 4: „ELStAM“ bleibt stehen, ohne den Hinweis „Vorbelegt …“: Was Sie geändert haben,
  überschreibt der Link nicht mehr.

---

## MT-101: Der Link fürs nächste Mal behält die Angaben anderer Formulare

**Einstieg:** Sie machen direkt nach MT-100 weiter.

**Voraussetzungen:** MT-100.

**Schritte:**

1. Den Fragebogen bis zur **Zusammenfassung** durchgehen und den Abschnitt **„Stammdaten für das
   nächste Mal“** lesen.
2. In der Adresszeile `stammdaten=1` in `stammdaten=2` ändern und die Seite neu laden (F5).

**Erwartet:**

- Schritt 1: Der Text nennt die Angaben dieses Fragebogens, darunter „Lohnsteuer bei Minijobs“, und
  „Weitere … Angaben aus Ihrem bisherigen Link bleiben erhalten.“ Der Link enthält weiterhin
  `mandantennummer=99999` und `lohnsteuerAushilfe=pauschal25`. Er enthält keine Daten der Person.
- Schritt 2: Oben erscheint „Stammdaten-Link: Dieser Stammdaten-Link stammt aus einer anderen
  Version der App und kann nicht gelesen werden.“ Die App zeigt die Startseite; ein neuer
  Fragebogen beginnt ohne vorbelegte Firma.

---

## MT-109: Das Lesezeichen beginnt gleich einen neuen Fragebogen

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) und klicken
**„Stammdaten-Link erstellen oder ändern …“**.

**Schritte:**

1. Firma `Beispiel Bau GmbH`, Betriebsnummer `1234 5671` eingeben. Unter „Ihr Link“ bei **„Was soll
   der Link öffnen?“** nachsehen, was gewählt ist; **„Kopieren“**.
2. Den Link in einem neuen Tab öffnen.
3. Im ersten Tab „die Startseite (das Formular wählt man dort)“ wählen, kopieren und in einem neuen
   Tab öffnen.
4. In der öffentlichen App (nicht im Testbereich) einen Link mit `formular=personalfragebogen` öffnen
   (z. B. den Link aus MT-99).

**Erwartet:**

- Schritt 1: Vorgewählt ist „einen neuen Fragebogen „Personalfragebogen: Angaben für die
  Sofortmeldung““. Der Hinweis darunter sagt, dass der Link nur das Formular nennt, keine Fassung.
- Schritt 2: Sofort ein **neuer, leerer Fragebogen** „Personalfragebogen: Angaben für die
  Sofortmeldung“ bei „Wer füllt jetzt aus?“ – ohne Umweg über die Startseite. Oben: „Neuer
  Fragebogen … aus Ihrem Lesezeichen. Die Angaben aus dem Link stehen schon im Teil
  „Arbeitgeber“.“
- Schritt 3: Die Startseite wie früher; Firma und Betriebsnummer stehen trotzdem in jedem neuen
  Fragebogen beim Arbeitgeber.
- Schritt 4: Gelb: „Ihr Lesezeichen soll einen neuen Fragebogen „personalfragebogen“ öffnen; diese
  Fassung der App enthält ihn nicht. Bitte wählen Sie unten selbst.“ – die Startseite erscheint.
  _Nicht offensichtlich:_ Der Link öffnet immer die neueste Fassung des Formulars; er bleibt auch
  nach einer neuen Fassung gültig.

---

## MT-86: Kontaktdaten, A1 beim Arbeitgeber, Krankenversicherung im Minijob

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:**

1. Bei „Telefonnummer“ `12345` eingeben und **„Weiter“** tippen; dann `0721 123456`.
2. Bei „E-Mail-Adresse“ `erika.beispiel.de` eingeben und **„Weiter“** tippen; dann
   `Erika@Beispiel.DE`.
3. Bis „Vereinbarte Art der Beschäftigung“ weitergehen und „einen Minijob“ wählen; bei
   „Krankenversicherung“ „privat“ wählen.
4. Über „App neu starten“ einen neuen Personalfragebogen als **„Arbeitgeber“** beginnen und die
   Fragen bis „Besondere Fälle“ durchgehen.

**Erwartet:**

- Schritt 1–2: Die falschen Eingaben werden mit einem Hinweis abgelehnt (Telefonnummer mit Vorwahl,
  E-Mail wie name@beispiel.de); die richtigen gehen weiter. _Nicht offensichtlich:_ Die E-Mail wird
  als `Erika@beispiel.de` gespeichert – der Teil nach dem @ in Kleinbuchstaben, der Teil davor wie
  eingegeben.
- Schritt 3: Nach „privat“ folgt nur die Frage nach dem Versicherungsunternehmen. Bescheinigung für den
  Zuschuss, Stand 2002, die letzten fünf Jahre, frühere Befreiung und letzte gesetzliche Krankenkasse
  kommen im Minijob **nicht** (kein Zuschuss, keine Versicherungspflicht).
- Die beschäftigte Person wird nirgends nach einer A1-Bescheinigung gefragt.
- Schritt 4: Der Arbeitgeber wird einmal gefragt, ob sein Betrieb Beschäftigte mit Sozialversicherung
  in einem anderen Staat hat (vorbelegt „Nein“; steht danach im Stammdaten-Link als `auslandSv`).
  Erst bei „Ja“ kommen je Person die Fragen nach dem anderen Staat und der A1-Bescheinigung.

---

## MT-87: Hauptstatus und Zusätze statt Ankreuzliste

**Einstieg:** Sie starten auf der Startseite der App (im Testbereich: „App neu starten“) einen neuen Fragebogen „Personalfragebogen: Angaben für die Lohnabrechnung“ als „Beschäftigte Person“.

**Schritte:**

1. Geburtsdatum `17.05.2005` eingeben; bei „Was machen Sie hauptsächlich …“ „Schülerin oder Schüler“
   wählen und weitergehen.
2. Über **„Zur Zusammenfassung“** den Status auf „im Ruhestand (Rente oder Pension)“ ändern und
   weitergehen.
3. Das Geburtsdatum nacheinander auf `01.06.1958`, `15.03.1960` und `01.01.1965` ändern und jeweils
   die folgenden Fragen ansehen.
4. Den Status auf „Arbeitnehmerin oder Arbeitnehmer …“ ändern.

**Erwartet:**

- Schritt 1: Man kann nur **einen** Status wählen. Danach kommen „Beziehen Sie eine Rente?“
  (vorbelegt „Nein“) und die Schulart, aber keine Fragen nach Grundsicherungsgeld, Elternzeit oder
  Pension.
- Schritt 2: Jetzt kommt „Beziehen Sie eine Pension …?“; Grundsicherungsgeld wird nicht gefragt.
- Schritt 3: Nur bei `15.03.1960` fragt der Fragebogen „Haben Sie zu Beginn dieser Beschäftigung die
  Regelaltersgrenze … erreicht?“ (Ja / Nein / Weiß ich nicht). _Nicht offensichtlich:_ Bei
  `01.06.1958` gilt sie als erreicht (es erscheinen die Fragen zur Aktivrente), bei `01.01.1965` als
  nicht erreicht – ohne Rückfrage; die Grenzen hängen an der Fassung für einen Beginn im Jahr 2026.
- Schritt 4: Jetzt kommen „Grundsicherungsgeld?“ und „Elternzeit bei einem anderen Arbeitgeber?“.
