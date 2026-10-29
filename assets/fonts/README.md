# Schriften

Die App bettet diese Schriften in jede erzeugte PDF ein. PDF/A verbietet die 14 Standardschriften,
weil sie nicht eingebettet sind.

| Datei                             | Herkunft               | Version |
| --------------------------------- | ---------------------- | ------- |
| `NotoSans-Regular.subset.ttf`     | Noto Sans Regular      | 2.015   |
| `NotoSans-SemiBold.subset.ttf`    | Noto Sans SemiBold     | 2.015   |
| `NotoSansMono-Regular.subset.ttf` | Noto Sans Mono Regular | 2.014   |

**Lizenz:** SIL Open Font License 1.1, siehe [`OFL.txt`](OFL.txt). Copyright 2022 The Noto Project
Authors.

**Warum Noto:** Noto hat keinen „Reserved Font Name“. Source Sans 3 und Source Code Pro (Adobe)
reservieren den Namen „Source“. Eine verkleinerte Fassung dürfte dann nicht mehr so heißen.

## Quelle

Unverändert heruntergeladen am 29.10.2026 (`unhinted`):

| Datei                    | URL                                                                                                                           | SHA-256                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| NotoSans-Regular.ttf     | https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts/NotoSans/unhinted/ttf/NotoSans-Regular.ttf         | `f3961a9cde016d41a4879aecda1474d3a36d6bf54fa0e4643de029cc2248b0e8` |
| NotoSans-SemiBold.ttf    | https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts/NotoSans/unhinted/ttf/NotoSans-SemiBold.ttf        | `a7af8d4a11e8e49fea9a19786a6469210b512cd4061413e8036bdd2425722795` |
| NotoSansMono-Regular.ttf | https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts/NotoSansMono/unhinted/ttf/NotoSansMono-Regular.ttf | `87f8ce0522a6c99b743ee5fc75b4073cfdd575639119672828b7b9944b65b4f4` |
| OFL.txt                  | https://raw.githubusercontent.com/notofonts/latin-greek-cyrillic/main/OFL.txt                                                 | –                                                                  |

## Verkleinerung (Subset)

Werkzeug: fontTools 4.68.0 (`pyftsubset`). Befehl je Datei:

```bash
pyftsubset <Quelle>.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+0218-021B,U+02C6,U+02DC,U+2010-2027,U+2030,U+2039-203A,U+20AC,U+2122,U+2190-2193,U+2212,U+FFFD" \
  --layout-features='' --no-hinting --name-IDs='*' --drop-tables+=DSIG \
  --output-file=<Name>.subset.ttf
```

- **Zeichenumfang:** Basis-Latein, Latin-1, Latin Extended-A (Namen aus der EU), ș/ț,
  Gedankenstriche, Anführungszeichen, €, Pfeile.
- **`--layout-features=''`** entfernt Ligaturen und Kerning. So stimmt jede Glyphe genau mit einem
  Zeichen überein, und der Text lässt sich zuverlässig wieder auslesen (PDF/A-2u, Datenseiten).
- Größe je Datei etwa 23 kB (Original etwa 430 kB).

SHA-256 der Ergebnisse:

| Datei                           | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| NotoSans-Regular.subset.ttf     | `93d0a57c3d76de2d3c650511dd3ea596afe7e9877cab69ed8ad418e7e258baa4` |
| NotoSans-SemiBold.subset.ttf    | `73f6a78448c6f4cc11bd686c76073b1c3cf6613543f73810202a3f2ed3f53c15` |
| NotoSansMono-Regular.subset.ttf | `8482f7edca5c421d99a80accd95815112dddefa3cfd93646c868c151d6cdb20f` |
