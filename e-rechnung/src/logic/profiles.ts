// Specification identifiers (BT-24) → what the tool says about them. Hybrid formats (ZUGFeRD from
// 2.0.1, Factur-X) count as e-invoices except the profiles MINIMUM and BASIC WL (BMF 15.10.2024).
// Unknown identifiers are not judged (open question F5). Sources per entry; entries marked
// `checked: false` wait for the FeRD 2.5.2 specification.

export type Einordnung = 'eRechnung' | 'keineERechnung' | 'nichtBeurteilt';

export interface ProfileEntry {
  id: string;
  match: 'exact' | 'prefix';
  /** German label, e.g. "ZUGFeRD/Factur-X, Profil BASIC" */
  label: string;
  /** Short profile name for "Profil MINIMUM" in headlines */
  profile?: string;
  einordnung: Einordnung;
  source: string;
  checked: boolean;
}

const CEN = 'urn:cen.eu:en16931:2017';
const FEX = 'urn:factur-x.eu:1p0';
const KOSIT = 'urn:xeinkauf.de:kosit';

export const PROFILES: readonly ProfileEntry[] = [
  {
    id: `${FEX}:minimum`,
    match: 'exact',
    label: 'ZUGFeRD/Factur-X, Profil MINIMUM',
    profile: 'MINIMUM',
    einordnung: 'keineERechnung',
    source: 'Übergabe 2026-11-13; FeRD-Spezifikation',
    checked: false,
  },
  {
    id: `${FEX}:basicwl`,
    match: 'exact',
    label: 'ZUGFeRD/Factur-X, Profil BASIC WL',
    profile: 'BASIC WL',
    einordnung: 'keineERechnung',
    source: 'Übergabe 2026-11-13; FeRD-Spezifikation',
    checked: false,
  },
  {
    id: `${CEN}#compliant#${FEX}:basic`,
    match: 'exact',
    label: 'ZUGFeRD/Factur-X, Profil BASIC',
    profile: 'BASIC',
    einordnung: 'eRechnung',
    source: 'Übergabe 2026-11-13; FeRD-Spezifikation',
    checked: false,
  },
  {
    id: `${CEN}#conformant#${FEX}:extended`,
    match: 'exact',
    label: 'ZUGFeRD/Factur-X, Profil EXTENDED',
    profile: 'EXTENDED',
    einordnung: 'eRechnung',
    source: 'Übergabe 2026-11-13; FeRD-Spezifikation',
    checked: false,
  },
  {
    id: `${CEN}#compliant#${KOSIT}:xrechnung_3.0#conformant#${KOSIT}:extension:xrechnung_3.0`,
    match: 'exact',
    label: 'XRechnung 3.0 mit Extension',
    einordnung: 'eRechnung',
    source: 'KoSIT XRechnung-Testsuite v2026-08-31 (instances/extension)',
    checked: true,
  },
  {
    id: `${CEN}#compliant#${KOSIT}:xrechnung_3.0#compliant#${KOSIT}:xrechnung:cvd_`,
    match: 'prefix',
    label: 'XRechnung 3.0 (CVD)',
    einordnung: 'eRechnung',
    source: 'KoSIT XRechnung-Testsuite v2026-08-31 (technical-cases/cvd)',
    checked: true,
  },
  {
    id: `${CEN}#compliant#${KOSIT}:xrechnung_3.0`,
    match: 'exact',
    label: 'XRechnung 3.0',
    einordnung: 'eRechnung',
    source: 'KoSIT XRechnung-Testsuite v2026-08-31',
    checked: true,
  },
  {
    id: `${CEN}#compliant#${KOSIT}:xrechnung_`,
    match: 'prefix',
    label: 'XRechnung',
    einordnung: 'eRechnung',
    source: 'Kennungsschema der KoSIT (weitere Fassungen von XRechnung 3)',
    checked: true,
  },
  {
    id: `${CEN}#compliant#urn:xoev-de:kosit:standard:xrechnung_`,
    match: 'prefix',
    label: 'XRechnung (ältere Fassung 1.x/2.x)',
    einordnung: 'eRechnung',
    source: 'Kennungsschema der KoSIT bis XRechnung 2.3',
    checked: false,
  },
  {
    id: `${CEN}#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0`,
    match: 'exact',
    label: 'Peppol BIS Billing 3.0',
    einordnung: 'eRechnung',
    source: 'CEN-Beispiel BIS3_Invoice_positive (Validierungsartefakte 1.3.17)',
    checked: true,
  },
  {
    id: CEN,
    match: 'exact',
    label: 'EN 16931 (bei ZUGFeRD/Factur-X: Profil EN 16931, früher COMFORT)',
    profile: 'EN 16931',
    einordnung: 'eRechnung',
    source: 'CEN-Beispiele 1.3.17; Übergabe 2026-11-13',
    checked: true,
  },
  {
    id: 'urn:ferd:CrossIndustryDocument:invoice:1p0',
    match: 'prefix',
    label: 'ZUGFeRD 1.0',
    profile: 'ZUGFeRD 1.0',
    einordnung: 'keineERechnung',
    source: 'BMF 15.10.2024: ZUGFeRD erst ab Version 2.0.1 (F5, Bestätigung offen)',
    checked: false,
  },
];

export interface ProfileMatch {
  /** The identifier as found (trimmed), undefined when BT-24 is missing */
  id?: string;
  entry?: ProfileEntry;
  einordnung: Einordnung;
}

/** The most specific entry wins: exact before prefix, longer prefix before shorter. */
export function profileOf(id: string | undefined): ProfileMatch {
  const trimmed = id?.trim();
  if (!trimmed) return { einordnung: 'nichtBeurteilt' };
  const exact = PROFILES.find((p) => p.match === 'exact' && p.id === trimmed);
  const prefix = PROFILES.filter((p) => p.match === 'prefix' && trimmed.startsWith(p.id)).sort(
    (a, b) => b.id.length - a.id.length,
  )[0];
  const entry = exact ?? prefix;
  return entry
    ? { id: trimmed, entry, einordnung: entry.einordnung }
    : { id: trimmed, einordnung: 'nichtBeurteilt' };
}
