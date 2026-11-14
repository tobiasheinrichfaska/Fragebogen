// Rechengrößen der Sozialversicherung per calendar year (Sozialversicherungs-Rechengrößenverordnung
// of that year), as stored money strings. Fixed reference data compiled into the app: a year that
// is missing is reported by the hint that needs it, never guessed. Add each new year here.
export interface Rechengroessen {
  /** Allgemeine Jahresarbeitsentgeltgrenze (§ 6 Abs. 6 SGB V), per year. */
  jaegJahr: string;
  /** Besondere Jahresarbeitsentgeltgrenze for those privately insured on 31.12.2002 (§ 6 Abs. 7 SGB V), per year. */
  jaegBesondersJahr: string;
  /**
   * Jahresarbeitsentgeltgrenze for those exempt and privately insured on 31.12.2026 (§ 6 Abs. 8 SGB V
   * as of the GKV-Beitragssatzstabilisierungsgesetz, BGBl. 2026 I Nr. 228), per year — from 2027.
   */
  jaegBestand2026Jahr?: string;
  /** Beitragsbemessungsgrenze Krankenversicherung (§ 223 Abs. 3, from 2027 Abs. 4 SGB V), per month. */
  bbgKvMonat: string;
  /** Beitragsbemessungsgrenze Pflegeversicherung (§ 55 Abs. 2 SGB XI), per month. */
  bbgPvMonat: string;
  /** Beitragsbemessungsgrenze allgemeine Rentenversicherung (§ 159 SGB VI), per month. */
  bbgRvMonat: string;
  /** Geringfügigkeitsgrenze (§ 8 Abs. 1a SGB IV, follows the minimum wage), per month. */
  geringfuegigkeitsgrenzeMonat: string;
}

/** Geringverdienergrenze for trainees (§ 20 Abs. 3 S. 1 Nr. 1 SGB IV), per month — fixed by law. */
export const GERINGVERDIENERGRENZE = '325.00';

/** Upper limit of the Übergangsbereich (§ 20 Abs. 2 SGB IV), per month — fixed in the law itself. */
export const UEBERGANGSBEREICH_OBERGRENZE = '2000.00';

export const RECHENGROESSEN: Readonly<Record<string, Rechengroessen>> = {
  // SVBezGrV 2026 §§ 2, 4
  '2026': {
    jaegJahr: '77400.00',
    jaegBesondersJahr: '69750.00',
    bbgKvMonat: '5812.50',
    bbgPvMonat: '5812.50',
    bbgRvMonat: '8450.00',
    geringfuegigkeitsgrenzeMonat: '603.00',
  },
  // SVBezGrV 2027 §§ 2, 3, 5 as adopted by the Bundesregierung on 07.10.2026 (BR-Drs. 576/26; the
  // Bundesrat's consent and the promulgation are outstanding — compare before publishing a form
  // version that uses them). BBG PV = 1/12 of the JAEG of § 6 Abs. 7 SGB V (§ 55 Abs. 2 SGB XI in
  // force; the Pflegeneuordnungsgesetz, BT-Drs. 21/8869, would tie it to the BBG KV instead).
  // Geringfügigkeitsgrenze: BMAS notice of 07.11.2025, BAnz AT 20.11.2025 B1 (MiLoV5: 14,60 €).
  '2027': {
    jaegJahr: '84150.00',
    jaegBesondersJahr: '72900.00',
    jaegBestand2026Jahr: '80550.00',
    bbgKvMonat: '6375.00',
    bbgPvMonat: '6075.00',
    bbgRvMonat: '8850.00',
    geringfuegigkeitsgrenzeMonat: '633.00',
  },
};
