import { buildSupplierOrderPreviewFromToolResult } from "@/features/chatbot/chatbot-lecot-demo";

describe("buildSupplierOrderPreviewFromToolResult", () => {
  it("builds preview for demo orders", () => {
    const preview = buildSupplierOrderPreviewFromToolResult("co-1", {
      supplierOrderId: "ord-1",
      totalCents: 1200,
      demoMode: true,
      demoReference: "DEMO-LECOT-20260518-ORD1",
      lines: [{ sku: "X", label: "Serrure", quantity: 2, unitPriceCents: 600 }],
    });
    expect(preview.isDemo).toBe(true);
    expect(preview.status).toBe("sent");
    expect(preview.lines).toHaveLength(1);
  });
});
