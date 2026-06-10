import {
  resolveMaterialOrderTrackingProgress,
  resolveSupplierOrderTrackingProgress,
} from "@/features/chatbot/chatbotOrderTrackingProgress";
import { SUPPLIER_ORDER_DELIVERY_MS } from "@/features/chatbot/supplierOrderDemoProgress";

const ORDER_AT = Date.parse("2026-06-01T10:00:00.000Z");

describe("chatbotOrderTrackingProgress", () => {
  it("maps supplier orders to time-based progress percent", () => {
    expect(
      resolveSupplierOrderTrackingProgress("sent", {
        createdAt: new Date(ORDER_AT).toISOString(),
        now: ORDER_AT + SUPPLIER_ORDER_DELIVERY_MS * 0.45,
      })
    ).toEqual({
      percent: 45,
      cancelled: false,
    });
    expect(
      resolveSupplierOrderTrackingProgress("delivered", {
        createdAt: new Date(ORDER_AT).toISOString(),
        now: ORDER_AT,
      })
    ).toEqual({
      percent: 100,
      cancelled: false,
    });
    expect(
      resolveSupplierOrderTrackingProgress("cancelled", {
        createdAt: new Date(ORDER_AT).toISOString(),
      })
    ).toEqual({
      percent: 0,
      cancelled: true,
    });
  });

  it("maps material order statuses to progress percent", () => {
    expect(resolveMaterialOrderTrackingProgress("pending")).toEqual({
      percent: 25,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("ordered")).toEqual({
      percent: 60,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("received")).toEqual({
      percent: 100,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("cancelled")).toEqual({
      percent: 0,
      cancelled: true,
    });
  });
});
