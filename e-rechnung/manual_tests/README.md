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

| Datei                                          | Tests         | Bereich                                                            |
| ---------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| [`01_erkennen.md`](01_erkennen.md)             | MT-01 – MT-04 | Echte Rechnungen erkennen, Ziehen aus dem Mailprogramm             |
| [`02_pflichtangaben.md`](02_pflichtangaben.md) | MT-05 – MT-07 | Pflichtangaben einer echten Rechnung, fehlende Angabe, Kleinbetrag |

**Automatisiert statt von Hand** (Playwright, `tests/e2e/*.spec.ts`, Chromium, Firefox, WebKit):
XML-E-Rechnung, Hybrid-PDF, einfaches PDF, Profil MINIMUM, widersprüchliche Rechnungsdaten,
geschütztes PDF, Ablegen per Ziehen, feste Hinweiszeile, CSP, Pflichtangaben vollständig / mit
Lücken / Kleinbetrag, Positionen aufklappen – und bei jedem Test: keine Netzwerkanfrage, kein
Speicher- oder Cookie-Zugriff, kein Konsolenfehler.
