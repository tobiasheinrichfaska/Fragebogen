// Rechengrößen der Sozialversicherung per calendar year (Sozialversicherungs-Rechengrößenverordnung
// of that year), as stored money strings. Fixed reference data compiled into the app: a year that
// is missing is reported by the hint that needs it, never guessed. Add each new year here.
export interface Rechengroessen {
  /** Allgemeine Jahresarbeitsentgeltgrenze (§ 6 Abs. 6 SGB V), per year. */
  jaegJahr: string;
  /** Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (§ 6 Abs. 7, § 223 Abs. 3 SGB V), per month. */
  bbgKvMonat: string;
  /** Beitragsbemessungsgrenze allgemeine Rentenversicherung (§ 159 SGB VI), per month. */
  bbgRvMonat: string;
}

export const RECHENGROESSEN: Readonly<Record<string, Rechengroessen>> = {
  // SVBezGrV 2026 §§ 2, 4
  '2026': { jaegJahr: '77400.00', bbgKvMonat: '5812.50', bbgRvMonat: '8450.00' },
};
