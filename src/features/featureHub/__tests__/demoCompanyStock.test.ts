import {
  DEMO_COMPANY_STOCK_CATALOG,
  demoStockItemsForCompany,
  isDemoStockItemId,
} from "@/features/dev/demoCompanyStock";
import { computeCompanyStockMetrics } from "@/features/featureHub/companyStockMetrics";

describe("demoCompanyStock", () => {
  it("provides a realistic locksmith catalog", () => {
    expect(DEMO_COMPANY_STOCK_CATALOG.length).toBeGreaterThanOrEqual(12);
    const items = demoStockItemsForCompany("my-co");
    expect(items.every((i) => i.companyId === "my-co")).toBe(true);
    expect(isDemoStockItemId("demo-stock-cyl-sec")).toBe(true);
  });

  it("has actionable metrics for autopilot", () => {
    const items = demoStockItemsForCompany("co");
    const metrics = computeCompanyStockMetrics(items, [], [], 0);
    expect(metrics.outCount).toBeGreaterThan(0);
    expect(metrics.lowCount).toBeGreaterThan(0);
    expect(metrics.totalSkus).toBe(items.length);
  });
});
