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
- Schritt 2 zeigt die Vornamen, Schritt 3 springt über alles Beantwortete zur nächsten
  **Pflichtfrage ohne Antwort** – hier „Wann sind Sie geboren?“. _Nicht offensichtlich:_ Mit
  „Weiß ich gerade nicht“ zurückgestellte Pflichtfragen zählen als fehlend; freiwillige leere Fragen
  werden übersprungen (sie stehen in der Zusammenfassung).
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
