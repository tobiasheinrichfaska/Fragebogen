# Schemadateien (XSD)

Unverändert übernommen aus der KoSIT Validator-Konfiguration XRechnung, Release v2026-08-31
(`resources/ubl/2.1/xsd/` und `resources/cii/16b/xsd/`, siehe [`../docs/quellen.md`](../docs/quellen.md)).
Die Dateien dürfen nicht verändert werden.

| Ordner | Inhalt | Rechteinhaber und Bedingungen |
| --- | --- | --- |
| `ubl-2.1/maindoc/` | `UBL-Invoice-2.1.xsd`, `UBL-CreditNote-2.1.xsd` | OASIS UBL 2.1 OS (04.11.2013), „Copyright (c) OASIS Open 2013. All Rights Reserved.“ – OASIS IPR Policy, Weitergabe mit Copyright-Hinweis |
| `ubl-2.1/common/` | gemeinsame UBL-Module, eingebunden per `xsd:import` | wie oben; `UBL-xmldsig-core-schema-2.1.xsd` ist eine Kopie des W3C-Schemas (W3C Software License), `UBL-XAdES*` nach ETSI |
| `cii-d16b/` | UN/CEFACT Cross Industry Invoice D16B (4 Dateien) | „Copyright (C) UN/CEFACT (2016)“ – darf unverändert kopiert und weitergegeben werden (Hinweis im Kopf jeder Datei) |

Die App liest die Dateien aus dem Speicher (`src/io/schemas.ts`); sie lädt nichts nach.
