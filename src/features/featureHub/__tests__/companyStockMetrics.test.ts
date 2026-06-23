import { inferStockCategory } from "@/features/featureHub/companyStockCategories";
import {
  computeCompanyStockMetrics,
  sortStockByPatronPriority,
  stockHealth,
} from "@/features/featureHub/companyStockMetrics";
import type { StockItem } from "@/features/materials";

const base: StockItem = {
  id: "s1",
  companyId: "co",
  reference: "CYL-100",
  description: "Cylindre sécurité",
  quantity: 0,
  alertThreshold: 5,
  unit: "pcs",
  updatedAt: "2026-01-01",
};

describe("companyStockMetrics", () => {
  it("detects stock health", () => {
    expect(stockHealth(base)).toBe("out");
    expect(stockHealth({ ...base, quantity: 2 })).toBe("low");
    expect(stockHealth({ ...base, quantity: 10 })).toBe("ok");
  });

  it("sorts ruptures before low before ok", () => {
    const sorted = sortStockByPatronPriority([
      { ...base, id: "ok", quantity: 10, description: "Z" },
      { ...base, id: "low", quantity: 2, description: "A" },
      { ...base, id: "out", quantity: 0, description: "B" },
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["out", "low", "ok"]);
  });

  it("computes patron dashboard metrics", () => {
    const metrics = computeCompanyStockMetrics(
      [
        base,
        { ...base, id: "s2", quantity: 2, description: "Gâche" },
        { ...base, id: "s3", quantity: 10, description: "Vis" },
      ],
      [
        {
          id: "mo1",
          interventionId: "iv1",
          technicianUid: "t1",
          partsRequested: [],
          urgency: "normal",
          status: "pending",
          createdAt: "",
          updatedAt: "",
          companyId: "co",
        },
      ],
      [
        {
          id: "so1",
          companyId: "co",
          supplierId: "lecot",
          supplierName: "Lecot",
          status: "sent",
          lines: [],
          totalCents: 0,
          createdAt: "",
          updatedAt: "",
        },
      ],
      2
    );
    expect(metrics.outCount).toBe(1);
    expect(metrics.lowCount).toBe(1);
    expect(metrics.pendingFieldOrders).toBe(1);
    expect(metrics.openSupplierOrders).toBe(1);
    expect(metrics.waitingMaterialJobs).toBe(2);
    expect(inferStockCategory(base)).toBe("cylinder");
  });
});
