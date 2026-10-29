# 03 – Abschluss und Unterschrift

## MT-20: Arbeitgeber schließt ohne Unterschrift ab

**Voraussetzungen:** MT-11 bis zur Zusammenfassung.

**Schritte:**

1. Klicken Sie **„Weiter zum Abschluss“**.
2. Setzen Sie das Häkchen **„Ich bestätige die Angaben des Arbeitgebers.“**
3. Wählen Sie **„Ohne Unterschrift abschließen“** und klicken Sie **„Abschließen“**.

**Erwartet:**

- Es erscheint **„Arbeitgeber: abgeschlossen“** mit Datum, Uhrzeit, Systemvermerk (Betriebssystem,
  Browser, Eingabeart) und einem langen **Prüfwert**.
- _Nicht offensichtlich:_ Beim Arbeitgeber ist die Unterschrift freiwillig. Bei der beschäftigten
  Person gibt es „Ohne Unterschrift abschließen“ **nicht**.

---

## MT-21: Person unterschreibt mit Finger, Stift oder Maus

**Voraussetzungen:** MT-20; dann **„Gerät weitergeben – zur Übersicht“**, **„Ich bin:
Beschäftigte Person“**, alle Fragen beantwortet, beide Hinweise bestätigt.

**Schritte:**

1. Prüfen Sie in der Zusammenfassung den hellblauen Kasten **„Angaben: Arbeitgeber (abgeschlossen,
   nur lesen)“**.
2. Klicken Sie **„Weiter zum Abschluss“** und setzen Sie das Häkchen **„Ich versichere, dass meine
   Angaben richtig und vollständig sind.“**
3. Unterschreiben Sie im gestrichelten Feld. Probieren Sie auch **„Unterschrift löschen“** und
   unterschreiben Sie erneut.
4. Klicken Sie **„Unterschreiben und abschließen“**.

**Erwartet:**

- Der Arbeitgeber-Kasten zeigt Firma, Betriebsnummer und den Tag der Beschäftigungsaufnahme. Die
  Person kann diese Angaben nicht ändern.
- Die Linie folgt dem Finger oder Stift ohne Versatz. Auf Tablet und Handy scrollt die Seite beim
  Unterschreiben **nicht** mit.
- „Unterschreiben und abschließen“ ist erst aktiv, wenn Häkchen **und** Unterschrift da sind.
- _Nicht offensichtlich:_ Ein einzelner Punkt oder ein winziger Strich wird abgelehnt („Die
  gezeichnete Unterschrift ist zu kurz. Bitte vollständig unterschreiben.“). Das schützt vor versehentlichem Antippen.
- Danach zeigt die Übersicht bei beiden Rollen „unterschrieben“ bzw. „abgeschlossen“ und im Kasten
  „Stand“ grün **„Vollständig: alle erforderlichen Teile liegen vor und sind verknüpft.“**

---

## MT-22: Getippter Name statt Zeichnung

**Voraussetzungen:** Wie MT-21 bis Schritt 2.

**Schritte:**

1. Wählen Sie **„Namen tippen“** und geben Sie „E“ ein.
2. Klicken Sie **„Unterschreiben und abschließen“**.
3. Geben Sie „Erika Musterfrau“ ein und schließen Sie ab.

**Erwartet:**

- Nach Schritt 2 erscheint rot „Die Unterschrift ist leer oder ungültig.“ mit dem Zusatz „Bitte den
  vollständigen Namen eintippen.“; nichts wird abgeschlossen.
- Mit vollem Namen klappt der Abschluss.

---

## MT-23: Minderjährige Person braucht die gesetzliche Vertretung

**Voraussetzungen:** Neuer Fragebogen.

**Schritte:**

1. Füllen Sie als **Beschäftigte Person** aus, mit Geburtsdatum vor weniger als 18 Jahren (z. B.
   „01.03.2010“), und unterschreiben Sie.
2. Gehen Sie zur Übersicht.
3. Klicken Sie bei **Gesetzliche Vertretung** auf **„Ich bin: Gesetzliche Vertretung“**, geben Sie
   „Max Musterfrau“ ein und unterschreiben Sie.

**Erwartet:**

- Nach Schritt 1 steht bei der gesetzlichen Vertretung **„Erforderlich: Die Person ist am Tag ihrer
  Unterschrift minderjährig.“** Im Kasten „Stand“ steht, dass die gesetzliche Vertretung mit Namen
  unterschreiben muss; „PDF erstellen“ ist ausgegraut.
- Nach Schritt 3 ist die Sperre weg.
- _Nicht offensichtlich:_ Maßgeblich ist das Datum **laut diesem Gerät** am Tag der Unterschrift der
  Person.

---

## MT-24: Unterschrift zurücknehmen und neue Fassung

**Voraussetzungen:** Die Person hat unterschrieben, der Arbeitgeber noch nicht.

**Schritte:**

1. Klicken Sie in der Übersicht bei der Person **„Unterschrift zurücknehmen“**.
2. Schließen Sie erneut ab. Lassen Sie dann den Arbeitgeber ausfüllen und abschließen.
3. Klicken Sie bei der Person auf **„Neue Fassung beginnen“**, ändern Sie eine Angabe und
   unterschreiben Sie.

**Erwartet:**

- Nach Schritt 1 ist der Teil der Person wieder „begonnen, nicht abgeschlossen“; die alte
  Unterschrift ist weg.
- _Nicht offensichtlich:_ Nach Schritt 2 gibt es „Unterschrift zurücknehmen“ **nicht mehr**, weil
  der Arbeitgeber diese Fassung schon bestätigt hat. Nur noch „Neue Fassung beginnen“ geht.
- „Neue Fassung beginnen“ öffnet direkt die Zusammenfassung mit allen bisherigen Antworten.
- Nach Schritt 3 steht bei der Person „unterschrieben (Fassung 2)“, und der Kasten „Stand“ ist
  weiterhin vollständig, weil die neue Fassung den Teil des Arbeitgebers bestätigt.

---

## MT-25: Stammdaten-Link des Arbeitgebers

**Voraussetzungen:** MT-11 bis zur Zusammenfassung.

**Schritte:**

1. Klicken Sie im Abschnitt **„Stammdaten für das nächste Mal“** auf **„Kopieren“**.
2. Öffnen Sie den kopierten Link in einem neuen Tab, beginnen Sie einen neuen Fragebogen und wählen
   Sie **„Ich bin: Arbeitgeber“**.
3. Ändern Sie im Link hinter `betriebsnummer=` eine Ziffer zu einem Buchstaben und öffnen Sie ihn
   erneut. Beginnen Sie wieder als Arbeitgeber.

**Erwartet:**

- Der Link endet auf `#stammdaten=1&betriebsnummer=…&firma=…`. Er enthält **keine** Daten der Person.
- Nach Schritt 2 erscheint „Stammdaten aus Ihrem Lesezeichen übernommen. Bitte prüfen.“, und Firma
  und Betriebsnummer sind schon beantwortet.
- Nach Schritt 3 meldet die App, dass die Stammdaten nicht übernommen werden konnten, mit dem Grund
  („Die Betriebsnummer hat genau 8 Ziffern.“).
