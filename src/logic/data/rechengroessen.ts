// Rechengrößen der Sozialversicherung per calendar year (Sozialversicherungs-Rechengrößenverordnung
// of that year), as stored money strings. Fixed reference data compiled into the app: a year that
// is missing is reported by the hint that needs it, never guessed. Add each new year here.
export interface Rechengroessen {
  /** Allgemeine Jahresarbeitsentgeltgrenze (§ 6 Abs. 6 SGB V), per year. */
  jaegJahr: string;
  /** Besondere Jahresarbeitsentgeltgrenze for those privately insured on 31.12.2002 (§ 6 Abs. 7 SGB V), per year. */
  jaegBesondersJahr: string;
  /** Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (§ 6 Abs. 7, § 223 Abs. 3 SGB V), per month. */
  bbgKvMonat: string;
  /** Beitragsbemessungsgrenze allgemeine Rentenversicherung (§ 159 SGB VI), per month. */
  bbgRvMonat: string;
  /** Geringfügigkeitsgrenze (§ 8 Abs. 1a SGB IV, follows the minimum wage), per month. */
  geringfuegigkeitsgrenzeMonat: string;
}

/** Geringverdienergrenze for trainees (§ 20 Abs. 3 S. 1 Nr. 1 SGB IV), per month — fixed by law. */
export const GERINGVERDIENERGRENZE = '325.00';

export const RECHENGROESSEN: Readonly<Record<string, Rechengroessen>> = {
  // SVBezGrV 2026 §§ 2, 4
  '2026': {
    jaegJahr: '77400.00',
    jaegBesondersJahr: '69750.00',
    bbgKvMonat: '5812.50',
    bbgRvMonat: '8450.00',
    geringfuegigkeitsgrenzeMonat: '603.00',
  },
};
