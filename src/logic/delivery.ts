// How a file the app writes reaches the person (Tobias 2026-11-04: "ein erstelltes PDF sollte die
// Option ‚Teilen‘ haben, zumindest auf mobilen Geräten"). On a phone or tablet a download only opens
// the file in a viewer, so there the app offers "Teilen" (the device's share sheet) and "Speichern"
// instead of downloading at once; on a computer it downloads as before and adds "Teilen" where the
// browser can share files.

export interface DeliveryEnvironment {
  /** The browser can hand this very file to the device's share sheet (Web Share API). */
  canShare: boolean;
  /** Touch is the main input (phone, tablet): CSS `(pointer: coarse)`. */
  touchFirst: boolean;
}

export interface Delivery {
  /** Download at once, as before. */
  download: boolean;
  /** Offer a "Teilen" button. */
  share: boolean;
  /** Offer a "Speichern" button (the download on request). */
  save: boolean;
}

const RULES: readonly { when: DeliveryEnvironment; delivery: Delivery }[] = [
  {
    when: { canShare: true, touchFirst: true },
    delivery: { download: false, share: true, save: true },
  },
  {
    when: { canShare: true, touchFirst: false },
    delivery: { download: true, share: true, save: false },
  },
  {
    when: { canShare: false, touchFirst: true },
    delivery: { download: true, share: false, save: false },
  },
  {
    when: { canShare: false, touchFirst: false },
    delivery: { download: true, share: false, save: false },
  },
];

export function deliveryFor(environment: DeliveryEnvironment): Delivery {
  const rule = RULES.find(
    (r) => r.when.canShare === environment.canShare && r.when.touchFirst === environment.touchFirst,
  );
  return { ...(rule?.delivery ?? { download: true, share: false, save: false }) };
}
