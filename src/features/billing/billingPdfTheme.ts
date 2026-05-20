/** Palette & constantes layout PDF facture/devis (premium minimal). */

export const BILLING_PDF_MARGIN = 20;
export const BILLING_PDF_PAGE_W = 210;

export const BILLING_PDF_COLORS = {
  primary: [15, 23, 42] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export function formatBillingMoney(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function formatBillingDocRef(interventionId: string): string {
  const slug = interventionId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = slug.slice(-8) || slug || "00000000";
  return tail;
}

export function formatBillingDocDate(d: Date): string {
  return d.toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}
