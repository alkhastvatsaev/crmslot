import {
  DEMO_SUPPLIER_ORDER_STEPS,
  SUPPLIER_ORDER_DELIVERY_MS,
  resolveDemoSupplierOrderProgress,
} from "@/features/chatbot/supplierOrderDemoProgress";

const ORDER_AT = Date.parse("2026-06-01T10:00:00.000Z");

describe("supplierOrderDemoProgress", () => {
  it("starts at Validée right after order date", () => {
    const p = resolveDemoSupplierOrderProgress({
      status: "sent",
      createdAt: new Date(ORDER_AT).toISOString(),
      now: ORDER_AT + 60_000,
    });
    expect(p.cancelled).toBe(false);
    expect(p.activeIndex).toBe(0);
    expect(p.percent).toBe(0);
    expect(DEMO_SUPPLIER_ORDER_STEPS[p.activeIndex]?.label).toBe("Validée");
  });

  it("reaches Préparation after 25% of the 2-day window", () => {
    const p = resolveDemoSupplierOrderProgress({
      status: "sent",
      createdAt: new Date(ORDER_AT).toISOString(),
      now: ORDER_AT + SUPPLIER_ORDER_DELIVERY_MS * 0.3,
    });
    expect(p.activeIndex).toBe(1);
    expect(p.percent).toBe(30);
    expect(DEMO_SUPPLIER_ORDER_STEPS[p.activeIndex]?.label).toBe("Préparation");
  });

  it("reaches Livrée at 100% after 2 days", () => {
    const p = resolveDemoSupplierOrderProgress({
      status: "sent",
      createdAt: new Date(ORDER_AT).toISOString(),
      now: ORDER_AT + SUPPLIER_ORDER_DELIVERY_MS,
    });
    expect(p.activeIndex).toBe(3);
    expect(p.percent).toBe(100);
    expect(DEMO_SUPPLIER_ORDER_STEPS[p.activeIndex]?.label).toBe("Livrée");
  });

  it("prefers sentAt over createdAt", () => {
    const sentAt = ORDER_AT + 12 * 60 * 60 * 1000;
    const p = resolveDemoSupplierOrderProgress({
      status: "sent",
      createdAt: new Date(ORDER_AT).toISOString(),
      sentAt: new Date(sentAt).toISOString(),
      now: sentAt + 60_000,
    });
    expect(p.percent).toBe(0);
    expect(p.activeIndex).toBe(0);
  });

  it("forces 100% when status is delivered", () => {
    const p = resolveDemoSupplierOrderProgress({
      status: "delivered",
      createdAt: new Date(ORDER_AT).toISOString(),
      now: ORDER_AT + 60_000,
    });
    expect(p.activeIndex).toBe(3);
    expect(p.percent).toBe(100);
  });

  it("handles cancelled", () => {
    expect(
      resolveDemoSupplierOrderProgress({
        status: "cancelled",
        createdAt: new Date(ORDER_AT).toISOString(),
      })
    ).toEqual({
      activeIndex: -1,
      percent: 0,
      cancelled: true,
    });
  });
});
