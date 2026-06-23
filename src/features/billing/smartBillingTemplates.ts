import type { Intervention } from "@/features/interventions";

export interface BillingLineSuggestion {
  description: string;
  quantity: number;
  unitPriceCents: number;
  frequency: number;
  source: "history";
}

interface LineKey {
  description: string;
  unitPriceCents: number;
}

function normalizeDesc(desc: string): string {
  return desc.toLowerCase().trim();
}

/**
 * Analyse l'historique des interventions pour un client donné et retourne
 * les lignes de facturation les plus fréquentes, triées par fréquence desc.
 */
export function computeBillingLineSuggestions(
  pastInterventions: Intervention[],
  maxSuggestions = 5
): BillingLineSuggestion[] {
  const freq = new Map<string, { line: LineKey; count: number; totalQty: number }>();

  for (const iv of pastInterventions) {
    for (const line of iv.billingLines ?? []) {
      const key = `${normalizeDesc(line.description)}__${line.unitPriceCents}`;
      const existing = freq.get(key);
      if (existing) {
        existing.count++;
        existing.totalQty += line.quantity;
      } else {
        freq.set(key, {
          line: { description: line.description, unitPriceCents: line.unitPriceCents },
          count: 1,
          totalQty: line.quantity,
        });
      }
    }
  }

  return [...freq.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxSuggestions)
    .map((entry) => ({
      description: entry.line.description,
      unitPriceCents: entry.line.unitPriceCents,
      quantity: Math.round(entry.totalQty / entry.count),
      frequency: entry.count,
      source: "history" as const,
    }));
}
