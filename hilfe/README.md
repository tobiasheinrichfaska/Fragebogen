# Hilfeseiten „Wo finde ich …?“

Je Angabe eine Seite für die Homepage: Man wählt das Dokument, das man zur Hand hat, und sieht ein
**Muster**, auf dem die Stelle angezoomt und markiert wird – dazu zwei, drei Sätze und die amtliche
Quelle. Keine Videos, kein Skript, keine externen Dateien. Wer „Bewegung reduzieren“ eingestellt hat,
sieht das markierte Bild ohne Animation.

- `seiten/<pfad>.json` – eine Seite. `path` ist der `explainer`-Pfad der Formularfelder, die darauf
  verlinken (z. B. `steuer-id`); die Datei heißt wie der Pfad (`/` wird `-`).
- `muster/<id>.json` – ein Muster-Dokument in Millimetern (A4 = 210 × 297): `title`, `text`, `lines`
  (graue Platzhalterzeilen), `box` und `field` (beschriftetes Feld mit erfundenem Wert und einer `id`,
  auf die eine Seite zeigt).
- Erzeugt werden `docs/hilfe/<pfad>/index.html` und `docs/hilfe/index.html` mit `npm run catalogue`
  (nie von Hand bearbeiten). Format und Prüfungen: `src/logic/helpPages.ts`, Darstellung:
  `src/build/helpPage.ts`.

## Regeln

- **Nur erfundene Werte**, längere Ziffernfolgen nur aus 9 (wie im amtlichen BZSt-Muster
  „99 999 999 999“) – so entsteht nie zufällig eine echte Nummer (Test).
- **Jedes Muster trägt das Wasserzeichen „MUSTER“** (immer, nicht abschaltbar).
- **Kein Nachbau** von Dokumenten, deren Muster nicht frei sind (BZSt-Brief, DRV-Nachweis,
  Gesundheitskarte): nur vereinfacht gezeichnet, ohne Logos, Wappen oder Originaltexte. Frei nachbaubar
  sind amtliche Werke (§ 5 UrhG), z. B. das BMF-Muster der Lohnsteuerbescheinigung.
- **Jede Kachel mit Muster nennt ihre Quelle** (Behörde, Gesetz, amtliche Bekanntmachung); was eine
  Quelle nicht belegt, steht nicht da (z. B. die genaue Stelle auf einer Lohnabrechnung).
- Die letzte Kachel ist immer „Nichts davon“ (wie man die Angabe bekommt). Eine Kachel mit `trap: true`
  zeigt eine leicht verwechselbare andere Nummer (gestrichelt, „Achtung, andere Nummer“).
- `stand` = Tag der letzten Prüfung der Inhalte. Grundlage der Recherche vom 31.10.2026:
  `.tmp/hilfe/fundorte.md` (lokal).
