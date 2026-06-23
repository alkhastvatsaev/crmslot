import { computeCompanyStockMetrics } from "@/features/featureHub/companyStockMetrics";
import { runCompanyStockAgentTurn } from "@/features/featureHub/companyStockAgent";
import type { StockItem } from "@/features/materials";

const items: StockItem[] = [
  {
    id: "a1",
    companyId: "co",
    reference: "REF-1",
    description: "Gâche",
    quantity: 0,
    alertThreshold: 3,
    unit: "pcs",
    updatedAt: "2026-05-01",
  },
  {
    id: "a2",
    companyId: "co",
    reference: "REF-2",
    description: "Cylindre",
    quantity: 2,
    alertThreshold: 5,
    unit: "pcs",
    updatedAt: "2026-05-01",
  },
];

describe("runCompanyStockAgentTurn", () => {
  const ctx = {
    companyId: "co",
    items,
    orders: [],
    metrics: computeCompanyStockMetrics(items, [], [], 0),
  };

  it("refuses off-topic with refused flag", () => {
    const r = runCompanyStockAgentTurn("envoie un email de facturation", ctx);
    expect(r.refused).toBe(true);
    expect(r.intent).toBe("off_topic");
    expect(r.reply).toMatch(/Matériel/i);
  });

  it("lists ruptures and suggests focus", () => {
    const r = runCompanyStockAgentTurn("ruptures", ctx);
    expect(r.refused).toBe(false);
    expect(r.intent).toBe("list_out");
    expect(r.reply).toMatch(/Gâche/);
    expect(r.action?.focusStockItemId).toBe("a1");
  });

  it("search fills search query action", () => {
    const r = runCompanyStockAgentTurn("cherche cylindre", ctx);
    expect(r.intent).toBe("search");
    expect(r.action?.searchQuery).toMatch(/cylindre/i);
    expect(r.action?.focusStockItemId).toBe("a2");
  });
});
