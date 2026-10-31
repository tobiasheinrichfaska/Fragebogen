# 08 – Auslieferung auf der Homepage

## MT-80: App auf der Subdomain mit `.htaccess`

**Voraussetzungen:**

- Subdomain bei IONOS mit eigenem Ordner; HTTPS-Zertifikat aktiv.
- Hochgeladen: `index.html` (aus `npm run build`, Ordner `dist/`) und `deploy/.htaccess`
  (siehe [`deploy/README.md`](../deploy/README.md)).

**Schritte:**

1. Die Adresse mit `http://` statt `https://` aufrufen.
2. Die App öffnen, einen Fragebogen beginnen und eine PDF erzeugen.
3. Im Browser die Entwicklerwerkzeuge öffnen (F12) → Netzwerk → `index.html` anklicken → Antwort-Header
   ansehen.
4. Die Adresse `…/.htaccess` aufrufen.
5. Optional: die Adresse bei einem Header-Prüfdienst eingeben (z. B. securityheaders.com).

**Erwartet:**

- Schritt 1: Der Browser landet auf `https://…`.
- Schritt 2: Die App funktioniert wie offline; keine Fehlermeldung.
- Schritt 3: Es gibt `Content-Security-Policy` mit `frame-ancestors 'none'`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-cache`.
  _Nicht offensichtlich:_ Die strenge Policy für Skripte steht zusätzlich als Meta-Tag in der Datei; beide
  gelten gleichzeitig.
- Schritt 4: „Forbidden“ (versteckte Dateien werden nicht ausgeliefert).
- Schritt 5: Ein Hinweis auf eine fehlende Skript-Regel im Header ist erwartbar (sie steht im Meta-Tag).

## MT-81: Hilfeseiten „Wo finde ich …?“

**Voraussetzungen:** `docs/hilfe/` (aus `npm run catalogue`) lokal geöffnet oder auf der Homepage unter
dem Pfad, den die Kanzlei-Konfiguration als `explainerBase` nennt.

**Schritte:**

1. `docs/hilfe/steuer-id/index.html` öffnen, die Kachel „Lohnsteuerbescheinigung eines früheren
   Arbeitgebers“ antippen.
2. „Andere Auswahl“, dann „Nichts davon“.
3. `docs/hilfe/versicherungsnummer/index.html`, Kachel „Gesundheitskarte der Krankenkasse“.
4. Auf dem Handy wiederholen; dann in den Systemeinstellungen „Bewegung reduzieren“ einschalten und
   Schritt 1 wiederholen.

**Erwartet:**

- Schritt 1: Das Muster erscheint, zoomt nach etwa einer halben Sekunde auf das Feld
  „Identifikationsnummer:“ und markiert es; darunter „Hier: Identifikationsnummer:“. Überall steht schräg
  „MUSTER“, alle Nummern bestehen aus 9.
- Schritt 2: Kein Muster, sondern wie man die Nummer anfordert, mit Link.
- Schritt 3: Gestrichelte Markierung und „Achtung, andere Nummer: Versichertennummer“.
- Schritt 4: Mit „Bewegung reduzieren“ keine Animation, das ganze Blatt mit Markierung.
- _Nicht offensichtlich:_ Die Seiten laden nichts nach und funktionieren ohne Internet; nur die
  Links zu den Quellen führen nach außen.
