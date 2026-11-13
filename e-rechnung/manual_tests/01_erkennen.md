# 01 – Erkennen

Diese Tests brauchen echte Rechnungen oder echte Programme. Alles mit erfundenen Dateien prüfen die
automatischen Tests (`tests/e2e/erkennen.spec.ts`).

## MT-01: Echte ZUGFeRD-Rechnung eines Lieferanten

**Voraussetzung:** Eine echte PDF-Rechnung, von der der Lieferant sagt, sie sei eine E-Rechnung
(ZUGFeRD oder Factur-X). Das Tool ist geöffnet.

1. Klicken Sie auf **Datei auswählen** und wählen Sie die PDF-Rechnung.
   - **Danach:** Oben steht „E-Rechnung erkannt (ZUGFeRD/Factur-X, Profil …)“ auf grünem Grund.
     Darunter steht der Name des Anhangs, z. B. „factur-x.xml“.
2. Vergleichen Sie in der Tabelle Rechnungsnummer, Datum, Lieferant und Bruttobetrag mit dem
   PDF-Bild.
   - **Danach:** Die Werte stimmen überein. Weichen sie ab, notieren Sie welche – maßgeblich sind die
     Werte aus der XML, nicht das Bild.

## MT-02: Rechnung direkt aus dem Mailprogramm ziehen

**Voraussetzung:** Eine E-Mail mit einer PDF- oder XML-Rechnung im Anhang. Das Tool ist geöffnet.

1. Ziehen Sie den Anhang aus der E-Mail auf die Fläche „Rechnung hierher ziehen“.
   - **Achten Sie gleich auf:** Die Fläche färbt sich blau, solange Sie die Datei darüber halten.
   - **Danach:** Unter der Fläche steht „Geprüfte Datei: …“ mit dem Namen des Anhangs und darunter
     das Ergebnis.

Klappt das Ziehen aus Ihrem Mailprogramm nicht, speichern Sie den Anhang und nehmen Sie **Datei
auswählen**. Notieren Sie das Mailprogramm.

## MT-03: Einfaches PDF eines Lieferanten

**Voraussetzung:** Eine PDF-Rechnung, die sicher keine E-Rechnung ist (z. B. eingescannt).

1. Wählen Sie die Datei mit **Datei auswählen**.
   - **Danach:** Oben steht „Keine E-Rechnung: einfaches PDF“ auf rotem Grund.

## MT-04: XRechnung als XML-Datei

**Voraussetzung:** Eine XRechnung als `.xml`-Datei (z. B. von einer Behörde oder einem Portal).

1. Wählen Sie die Datei mit **Datei auswählen**.
   - **Danach:** Oben steht „E-Rechnung erkannt (XRechnung 3.0)“. In der Tabelle steht bei
     „Datei“ der Dateiname.
