# Handtests – E-Rechnung prüfen

Hier stehen nur Tests, die ein Mensch am Bildschirm braucht: echte Rechnungen von Lieferanten, echte
Geräte, Ziehen und Ablegen aus dem Mailprogramm. Alles andere prüfen die automatischen Tests
(`npm test`, `npm run test:e2e`).

## Vorbereitung

- Gehostet: die Adresse des Ordners `NebenprojektERechnung/` öffnen (aus der Kanzlei ohne Anmeldung,
  sonst mit Tester-Anmeldung „E-Rechnung - Test“).
- Lokal: `npm run build`, dann `dist/index.html` mit einem Doppelklick öffnen.
- Echte Rechnungen bleiben auf dem Rechner. Nie in das Repo legen, nie an Dritte senden.

## Übersicht

Die Testfälle folgen mit Schritt 1a (Einlesen und Erkennen).
