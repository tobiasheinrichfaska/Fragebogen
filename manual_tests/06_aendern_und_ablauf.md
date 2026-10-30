# 06 – Angaben ändern, Minijob-Steuer und Ablaufplan

Voraussetzung für alle Fälle: die **Vorschau-Fassung** mit den Formular-Entwürfen
(`npm run build:preview`, Datei `dist-preview/index.html`). Nur erfundene Daten verwenden.

---

## MT-50: Angaben nachträglich ändern (vor der Unterschrift)

**Voraussetzungen:** Personalfragebogen (Entwurf), Rolle „Beschäftigte Person“, Datenschutzhinweis
bestätigt, Familienname und Vornamen eingegeben.

**Schritte:**

1. Unten auf **„Zur Zusammenfassung – alle Angaben ansehen und ändern“** tippen.
2. Bei „Vornamen“ auf **„ändern“** tippen, den Namen ändern, **„Weiter“**.
3. Bei „Situation zu Beginn der Beschäftigung“ auf **„ändern“** tippen, „Ich beziehe eine Rente.“
   ankreuzen, **„Weiter“**.
4. Die Art der Rente wählen und „Rente seit“ eingeben, **„Weiter“**.
5. Bei „Krankenversicherung“ auf **„ändern“**, „privat“ wählen und die Folgefragen beantworten, bis
   die Frage nach Beiträgen für Angehörige mit eigenem privatem Vertrag kommt. Dort **„Ja“** tippen,
   dann **„Zurück“**.
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
  leere Fragen (z. B. die Versicherungsnummer „falls bekannt“) und mit „Weiß ich gerade nicht“
  zurückgestellte Fragen zählen als fehlend.
- Fehlt nichts mehr, heißt der zweite Knopf **„Zur Zusammenfassung“**.
- Auf einer noch offenen Frage gibt es nur „Weiter“.

---

## MT-51: Minijob – der Arbeitgeber legt die Lohnsteuer fest

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
- Je Formular steht nur die **neueste Fassung**; eine ältere (z. B. Sofortmeldung 0.1.0) ist oben
  als „ersetzt“ genannt. Darunter stehen die **Gültigkeit** und „Was dieser Fragebogen nicht
  abdeckt“.

---

## MT-54: Gültigkeit der Formularfassung

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

**Schritte:**

1. Als Arbeitgeber „landwirtschaftlicher Betrieb: Ja“ und „Besondere Betriebsart: Werkstatt“
   wählen und bis zur Zusammenfassung gehen.
2. Den Link unter „Stammdaten für das nächste Mal“ kopieren und in einem neuen Tab öffnen; einen
   neuen Personalfragebogen als Arbeitgeber beginnen.

**Erwartet:**

- Der Link enthält `landwirtschaft=ja` und `betriebsart=werkstatt`.
- Im neuen Fragebogen sind beide Antworten schon gesetzt (die Vorbelegung „Nein“ wird ersetzt),
  und die passenden Vorfragen je Person (Familienangehörige, Werkstattbeschäftigte) erscheinen.
