import { buildSupplierOrderPreviewFromToolResult } from "@/features/chatbot/chatbot-lecot-preview";

describe("buildSupplierOrderPreviewFromToolResult", () => {
  it("includes clientName on preview order for right panel", () => {
    const preview = buildSupplierOrderPreviewFromToolResult("co-1", {
      supplierOrderId: "ord-99",
      clientName: "Jean Dupont",
      totalCents: 5000,
      lines: [{ sku: "CYL-1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
    });
    expect(preview.clientName).toBe("Jean Dupont");
  });
});
