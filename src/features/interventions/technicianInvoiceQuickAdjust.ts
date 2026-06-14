import {
  totalCentsFromBillingLines,
  type DraftBillingLine,
} from "@/features/interventions/draftInvoiceBilling";

export type QuickInvoiceAdjustId =
  | "add_travel"
  | "add_labor_30"
  | "add_labor_1h"
  | "discount_10"
  | "urgency_10";

export const QUICK_INVOICE_ADJUST_IDS: QuickInvoiceAdjustId[] = [
  "add_travel",
  "add_labor_30",
  "add_labor_1h",
  "discount_10",
  "urgency_10",
];

const TRAVEL_LINE: DraftBillingLine = {
  description: "Déplacement forfaitaire",
  quantity: 1,
  unitPriceCents: 3500,
  reference: "DEPL",
};

const LABOR_30_LINE: DraftBillingLine = {
  description: "Main d'œuvre (30 min)",
  quantity: 1,
  unitPriceCents: 2750,
  reference: "MO-30",
};

const LABOR_1H_LINE: DraftBillingLine = {
  description: "Main d'œuvre (1 h)",
  quantity: 1,
  unitPriceCents: 5500,
  reference: "MO-60",
};

function normalizeLines(lines: DraftBillingLine[]): DraftBillingLine[] {
  return lines
    .map((l) => ({
      description: String(l.description ?? "").trim(),
      quantity: Number(l.quantity) > 0 ? Number(l.quantity) : 1,
      unitPriceCents: Math.max(0, Math.round(Number(l.unitPriceCents) || 0)),
      reference: l.reference?.trim() || "",
    }))
    .filter((l) => l.description.length > 0);
}

function appendLine(lines: DraftBillingLine[], line: DraftBillingLine): DraftBillingLine[] {
  const normalized = normalizeLines(lines);
  const existing = normalized.find(
    (l) => l.description === line.description && l.unitPriceCents === line.unitPriceCents
  );
  if (existing) {
    return normalized.map((l) =>
      l === existing ? { ...l, quantity: l.quantity + line.quantity } : l
    );
  }
  return [...normalized, line];
}

function scaleLines(lines: DraftBillingLine[], factor: number): DraftBillingLine[] {
  return normalizeLines(lines).map((l) => ({
    ...l,
    unitPriceCents: Math.max(0, Math.round(l.unitPriceCents * factor)),
  }));
}

export function applyQuickInvoiceAdjust(
  lines: DraftBillingLine[],
  adjustId: QuickInvoiceAdjustId
): DraftBillingLine[] {
  const base = normalizeLines(lines);
  switch (adjustId) {
    case "add_travel":
      return appendLine(base, TRAVEL_LINE);
    case "add_labor_30":
      return appendLine(base, LABOR_30_LINE);
    case "add_labor_1h":
      return appendLine(base, LABOR_1H_LINE);
    case "discount_10":
      return base.length > 0 ? scaleLines(base, 0.9) : base;
    case "urgency_10":
      return base.length > 0 ? scaleLines(base, 1.1) : base;
    default:
      return base;
  }
}

export function formatInvoiceTotalEur(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Math.max(0, cents) / 100);
}

export function invoiceTotalCents(lines: DraftBillingLine[]): number {
  return totalCentsFromBillingLines(normalizeLines(lines));
}
