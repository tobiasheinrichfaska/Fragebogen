# Offizielle Testdateien

Unverändert übernommen. Herkunft, Version und Prüfsumme der Pakete: [`../../../docs/quellen.md`](../../../docs/quellen.md).

| Ordner | Quelle | Lizenz |
| --- | --- | --- |
| `cen/` | CEN EN 16931 Validierungsartefakte 1.3.17 (`ConnectingEurope/eInvoicing-EN16931`), Ordner `examples/` der Pakete CII und UBL; UBL-Dateien mit dem Präfix `UBL_` | EUPL-1.2, Text in `cen/LICENSE-EUPL-1.2.txt` |
| `kosit/` | KoSIT XRechnung-Testsuite v2026-08-31 (`itplr-kosit/xrechnung-testsuite`), Ordner `instances/`: `standard/01.01a` (UBL und CII derselben Rechnung), `technical-cases/cius/01.05_minimal` (UBL, CII), `extension/04.01a`, `technical-cases/cvd/02.01a` | Apache-2.0 (Lizenz des Repositorys) |
| `kosit/paare/` | dieselbe Testsuite, `instances/standard/`: 21 Rechnungen jeweils als UBL und als CII (01.01a–01.14a, 01.17a–01.21a, 03.03a, 03.06a) – für den Gegencheck der Zuordnung | Apache-2.0 |

Die Musterrechnungen von FeRD (ZUGFeRD/Factur-X) dürfen nicht weitergegeben werden und liegen nur
lokal in `../lokal/` (gitignoriert).
