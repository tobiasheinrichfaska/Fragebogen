# Fragebogen

Fragebögen als **eine einzige HTML-Datei**, die vollständig lokal im Browser läuft. Es gibt keinen
Server, keine Übertragung und keine Speicherung im Browser.

> **Status:** in Entwicklung (v0.1.0, Projektgerüst). Noch keine Fragebögen nutzbar.

## Worum es geht

Ein Fragebogen durchläuft mehrere Stationen, beim Personalfragebogen zum Beispiel diese:

1. **Arbeitnehmer/in**: füllt den eigenen Teil aus, unterschreibt (mit Finger, Maus oder Stift, oder
   durch Eintippen des Namens) und lädt eine **PDF** herunter.
2. **Arbeitgeber**: liest diese PDF in dieselbe HTML-Datei ein. Die Daten werden übernommen und
   die Unterschrift geprüft. Er ergänzt seinen Teil und lädt eine neue PDF herunter.
3. **Steuerberater/Kanzlei**: liest eine oder viele PDFs ein und führt die Teile zusammen, auch
   wenn sie getrennt ankommen. Widersprüche und Lücken werden angezeigt.

Die PDF ist zugleich lesbares Dokument und Datenträger. Auf den letzten Seiten stehen die Angaben
als maschinenlesbarer Text („Anlage: Daten in maschinenlesbarer Form“), den die App später wieder
ausliest. Es gibt **keinen versteckten Dateianhang**, damit die PDF auch als Entgeltunterlage
vorgelegt werden kann.

Die Fragebögen selbst sind **Daten** (Formulardefinitionen). Neben dem Personalfragebogen sind
weitere Zwecke vorgesehen, etwa Minijob/kurzfristige Beschäftigung, Mandantenaufnahme oder
Mieterselbstauskunft.

## Rechtsstatus – bitte lesen

- Die Unterschrift in der App ist eine **einfache elektronische Signatur** (eIDAS Art. 3 Nr. 10).
  Sie ist **keine** qualifizierte elektronische Signatur.
- Datum und Uhrzeit der Unterschrift stammen **vom Gerät** des Unterzeichners und sind nicht
  überprüfbar.
- Die Prüfsummen (SHA-256) und die Hash-Kette zwischen den Stationen machen versehentliche oder
  naive Änderungen sichtbar. Sie schützen **nicht** gegen jemanden, der alles neu erzeugt.
- Wo das Gesetz die **Schriftform** verlangt (z. B. beim Antrag auf Befreiung von der
  Rentenversicherungspflicht im Minijob), ersetzt die App sie nicht. Belehrungen, die auf Papier
  erfolgen müssen, werden auf Papier ausgehändigt. Im Fragebogen wird dann nur bestätigt, dass dies
  geschehen ist.
- Die App verspricht keine „Rechtsgültigkeit“ und ist keine Rechtsberatung. Hintergründe stehen in
  [`docs/rechtliches.md`](docs/rechtliches.md).

## Datenschutz

- Die App sendet nichts. Eine strenge Content-Security-Policy verbietet Netzverbindungen; sie kommt
  mit Schritt 10.
- Sie speichert nichts im Browser. Einen Zwischenstand speichern Sie ausdrücklich als Datei.
- Wird die Datei von einer Webseite geladen, liefert der Server nur die Datei aus. Alle Eingaben
  bleiben auf dem Gerät.

## Entwicklung

Voraussetzung: Node.js ≥ 22.

```bash
npm install
npm test            # Unit-Tests (Vitest)
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # erzeugt dist/index.html (eine einzige Datei)
npm run dev         # Entwicklungsserver auf http://localhost:5178
```

Architektur, Datenmodell und Arbeitsplan stehen in [`CLAUDE.md`](CLAUDE.md),
[`docs/data-model.html`](docs/data-model.html) und [`docs/plan.md`](docs/plan.md). Manuelle
Testanleitungen liegen in [`manual_tests/`](manual_tests/).

## License

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This project is licensed under the **GNU Affero General Public License v3.0** (AGPLv3).
You are free to use, modify, and distribute this software under the terms of the AGPLv3.
If you use this software to provide a network service, you must make the full source code
of your modifications available to users of that service.

**Commercial License:** If you wish to use this software in a closed-source or proprietary
product, a commercial license is available. Contact: tobias.a.w.heinrich@gmail.com

See [LICENSE](LICENSE) for the full AGPLv3 text.
See [LICENSE_COMMERCIAL.md](LICENSE_COMMERCIAL.md) for commercial licensing terms.
