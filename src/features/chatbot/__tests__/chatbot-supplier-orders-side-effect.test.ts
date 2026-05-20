import { extractSupplierOrdersPanelFromResult } from "@/features/chatbot/chatbot-supplier-orders-side-effect";

describe("chatbot-supplier-orders-side-effect", () => {
  it("extracts panel payload with preview when order succeeded", () => {
    const payload = extractSupplierOrdersPanelFromResult(
      {
        ok: true,
        supplierOrderId: "ord-abc",
        materialOrderId: "mat-1",
        totalCents: 5000,
        status: "draft",
        lines: [{ sku: "A1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
      },
      "co-1",
    );
    expect(payload).toMatchObject({
      highlightOrderId: "ord-abc",
      materialOrderId: "mat-1",
    });
    expect(payload?.previewOrder?.id).toBe("ord-abc");
    expect(payload?.previewOrder?.lines[0]?.label).toBe("Cylindre");
  });

  it("returns null on error or missing id", () => {
    expect(extractSupplierOrdersPanelFromResult({ error: "fail" }, "co-1")).toBeNull();
    expect(extractSupplierOrdersPanelFromResult({ ok: true }, "co-1")).toBeNull();
  });
});
