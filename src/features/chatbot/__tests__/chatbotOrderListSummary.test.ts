import {
  summarizeMaterialOrderParts,
  summarizeOrderLineLabels,
  summarizeSupplierOrderLines,
} from "@/features/chatbot/chatbotOrderListSummary";

describe("chatbotOrderListSummary", () => {
  it("formats a single line", () => {
    expect(summarizeOrderLineLabels([{ label: "Cylindre européen", quantity: 1 }])).toBe(
      "Cylindre européen"
    );
  });

  it("formats quantity prefix", () => {
    expect(summarizeOrderLineLabels([{ label: "Vis inox", quantity: 3 }])).toBe("3× Vis inox");
  });

  it("joins two lines", () => {
    expect(
      summarizeOrderLineLabels([
        { label: "Cylindre", quantity: 1 },
        { label: "Gâche", quantity: 1 },
      ])
    ).toBe("Cylindre · Gâche");
  });

  it("truncates many lines", () => {
    expect(
      summarizeOrderLineLabels([
        { label: "A", quantity: 1 },
        { label: "B", quantity: 1 },
        { label: "C", quantity: 1 },
      ])
    ).toBe("A · +2");
  });

  it("summarizes supplier order lines", () => {
    expect(
      summarizeSupplierOrderLines([
        { sku: "LEC-1", label: "Serrure applique", quantity: 1, unitPriceCents: 1000 },
      ])
    ).toBe("Serrure applique");
  });

  it("summarizes material order parts", () => {
    expect(
      summarizeMaterialOrderParts([
        { description: "Barillet A2P", quantity: 2, reference: "BAR-A2P" },
      ])
    ).toBe("2× Barillet A2P");
  });
});
