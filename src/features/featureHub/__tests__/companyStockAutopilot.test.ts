import {
  buildAutopilotChatbotPrompt,
  pickFocusStockItemId,
  resolveAutopilotPlan,
  resolveSmartFilter,
} from "@/features/featureHub/companyStockAutopilot";
import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";
import type { StockItem } from "@/features/materials";

const baseMetrics = (): CompanyStockDashboardMetrics => ({
  totalSkus: 2,
  outCount: 1,
  lowCount: 0,
  okCount: 1,
  coveragePct: 50,
  pendingFieldOrders: 0,
  openSupplierOrders: 0,
  waitingMaterialJobs: 0,
  byCategory: {
    cylinder: 1,
    lock: 0,
    key: 0,
    hardware: 0,
    consumable: 0,
    other: 1,
  },
});

const item = (overrides: Partial<StockItem>): StockItem => ({
  id: "s1",
  companyId: "co",
  reference: "REF",
  description: "Cylindre",
  quantity: 0,
  alertThreshold: 5,
  unit: "pcs",
  updatedAt: "",
  ...overrides,
});

describe("companyStockAutopilot", () => {
  it("picks smart filter by urgency", () => {
    expect(resolveSmartFilter({ ...baseMetrics(), pendingFieldOrders: 2 })).toBe("orders");
    expect(resolveSmartFilter({ ...baseMetrics(), outCount: 2 })).toBe("out");
    expect(resolveSmartFilter({ ...baseMetrics(), outCount: 0, lowCount: 3 })).toBe("low");
    expect(resolveSmartFilter({ ...baseMetrics(), outCount: 0, lowCount: 0 })).toBe("all");
  });

  it("focuses first rupture item", () => {
    const id = pickFocusStockItemId(
      [item({ id: "ok", quantity: 10 }), item({ id: "out", quantity: 0 })],
      "out",
      new Set()
    );
    expect(id).toBe("out");
  });

  it("plans approve + chatbot when mixed issues", () => {
    const plan = resolveAutopilotPlan({
      items: [item({ id: "out", quantity: 0 })],
      orders: [
        {
          id: "mo1",
          interventionId: "iv1",
          technicianUid: "t",
          partsRequested: [],
          urgency: "normal",
          status: "pending",
          createdAt: "",
          updatedAt: "",
          companyId: "co",
        },
      ],
      supplierOrders: [],
      metrics: { ...baseMetrics(), pendingFieldOrders: 1 },
      selected: null,
    });
    expect(plan.orderIdsToApprove).toEqual(["mo1"]);
    expect(plan.sendChatbot).toBe(true);
    expect(plan.labelKey).toBe("companyStock.autopilot_fix_all");
  });

  it("builds a rich chatbot prompt", () => {
    const prompt = buildAutopilotChatbotPrompt({
      items: [item({ quantity: 0, description: "Gâche" })],
      orders: [],
      supplierOrders: [],
      metrics: baseMetrics(),
      selected: null,
    });
    expect(prompt).toContain("rupture");
    expect(prompt).toContain("Gâche");
  });
});
