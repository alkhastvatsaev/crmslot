import {
  DEMO_SUPPLIER_ORDER_STEPS,
  resolveDemoSupplierOrderProgress,
} from "@/features/chatbot/supplierOrderDemoProgress";

describe("supplierOrderDemoProgress", () => {
  it("maps sent demo order to Préparation at 45%", () => {
    const p = resolveDemoSupplierOrderProgress("sent");
    expect(p.cancelled).toBe(false);
    expect(p.activeIndex).toBe(1);
    expect(p.percent).toBe(45);
    expect(DEMO_SUPPLIER_ORDER_STEPS[p.activeIndex]?.label).toBe("Préparation");
  });

  it("maps delivered to 100%", () => {
    const p = resolveDemoSupplierOrderProgress("delivered");
    expect(p.activeIndex).toBe(3);
    expect(p.percent).toBe(100);
  });

  it("handles cancelled", () => {
    expect(resolveDemoSupplierOrderProgress("cancelled")).toEqual({
      activeIndex: -1,
      percent: 0,
      cancelled: true,
    });
  });
});
