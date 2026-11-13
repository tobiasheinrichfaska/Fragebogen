# 02 – Pflichtangaben

Diese Tests brauchen echte Rechnungen. Die Regeln selbst prüfen die automatischen Tests
(`src/logic/check.test.ts`, `tests/e2e/pflichtangaben.spec.ts`).

## MT-05: Pflichtangaben einer echten E-Rechnung gegen das PDF-Bild

**Voraussetzung:** Eine echte E-Rechnung eines Lieferanten (ZUGFeRD-PDF oder XRechnung). Das Tool ist
geöffnet.

1. Wählen Sie die Rechnung mit **Datei auswählen**.
   - **Danach:** Unter den Rechnungsdaten steht „Pflichtangaben nach § 14 Abs. 4 UStG“ mit einer
     Tabelle. Darüber steht in Grün „Alle Pflichtfelder belegt. Bitte prüfen Sie die Werte.“ oder in
     Rot „Es fehlt: …“.
2. Vergleichen Sie Name und Anschrift von Lieferant und Empfänger, Steuernummer oder USt-IdNr.,
   Datum und Nummer mit dem PDF-Bild.
   - **Danach:** Die Werte stimmen überein. Abweichungen notieren Sie – maßgeblich ist die XML.
3. Klicken Sie in der Zeile „Menge und Art …“ auf **Positionen anzeigen**.
   - **Danach:** Jede Position erscheint mit Nummer, Menge, Einheit und Bezeichnung.

## MT-06: Rechnung mit fehlender Angabe

**Voraussetzung:** Eine Rechnung, bei der Sie wissen, dass eine Angabe fehlt (z. B. kein
Leistungsdatum).

1. Wählen Sie die Rechnung mit **Datei auswählen**.
   - **Danach:** Oben in der Tabelle steht in Rot „Es fehlt: …“ mit der fehlenden Angabe. In der
     Zeile steht die rote Marke **fehlt**.

## MT-07: Kleinbetragsrechnung

**Voraussetzung:** Eine E-Rechnung über höchstens 250 Euro brutto.

1. Wählen Sie die Rechnung mit **Datei auswählen**.
   - **Danach:** Über der Tabelle steht „Gesamtbetrag bis 250 Euro: Es gelten die verringerten
     Angaben einer Kleinbetragsrechnung nach § 33 UStDV.“ Rechnungsnummer und Empfänger sind als
     „nur im Einzelfall nötig“ markiert, wenn sie fehlen.
