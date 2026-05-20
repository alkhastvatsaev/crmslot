import type { Intervention } from "@/features/interventions/types";

export type ChatbotBillingLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
};

export function billingLinesTotalCents(lines: ChatbotBillingLine[]): number {
  return lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
}

export function parseUnitPriceCents(input: Record<string, unknown>): number | null {
  if (input.unitPriceCents != null) {
    const clean = String(input.unitPriceCents).replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    const val = Number(clean);
    if (clean && Number.isFinite(val) && !isNaN(val)) return Math.round(val);
  }
  if (input.unitPriceEur != null) {
    const clean = String(input.unitPriceEur).replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    const val = Number(clean);
    if (clean && Number.isFinite(val) && !isNaN(val)) return Math.round(val * 100);
  }
  return null;
}

/** Patch une ligne existante (ou crée une ligne « Prestation » si vide). */
export function applyBillingLinePatch(
  existing: ChatbotBillingLine[],
  patch: {
    lineIndex?: number;
    unitPriceCents?: number | null;
    quantity?: number;
    description?: string;
  },
): ChatbotBillingLine[] {
  const idx = Math.max(0, patch.lineIndex ?? 0);
  let lines = existing.length > 0 ? [...existing] : [{ description: "Prestation", quantity: 1, unitPriceCents: 0 }];

  while (lines.length <= idx) {
    lines.push({ description: "Prestation", quantity: 1, unitPriceCents: 0 });
  }

  const current = { ...lines[idx] };
  if (typeof patch.description === "string" && patch.description.trim()) {
    current.description = patch.description.trim();
  }
  if (patch.quantity != null && Number.isFinite(patch.quantity) && patch.quantity > 0) {
    current.quantity = patch.quantity;
  }
  if (patch.unitPriceCents != null && patch.unitPriceCents >= 0) {
    current.unitPriceCents = patch.unitPriceCents;
  }

  lines[idx] = current;
  return lines;
}

export function normalizeBillingLinesFromFirestore(raw: unknown): ChatbotBillingLine[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatbotBillingLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const l = row as Record<string, unknown>;
    const description = String(l.description || "").trim();
    const quantity = Number(l.quantity);
    const unitPriceCents = Math.round(Number(l.unitPriceCents));
    if (!description || !Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) continue;
    out.push({
      description,
      quantity,
      unitPriceCents,
      ...(typeof l.reference === "string" && l.reference.trim()
        ? { reference: l.reference.trim() }
        : {}),
    });
  }
  return out;
}

export function interventionForPdf(
  data: Record<string, unknown>,
  billingLines: ChatbotBillingLine[],
  totalCents: number,
): Intervention {
  const clientName =
    typeof data.clientName === "string" && data.clientName.trim()
      ? data.clientName.trim()
      : undefined;
  return {
    id: String(data.id || ""),
    title: typeof data.title === "string" ? data.title : "",
    ...(data as any),
    clientName: clientName ?? undefined,
    billingLines,
    invoiceAmountCents: totalCents,
  };
}
