import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";

describe("emitChatbotOrderRegisteredEvents", () => {
  it("émet panneau, PDF fournisseur et previews dossier", () => {
    const events: unknown[] = [];
    emitChatbotOrderRegisteredEvents(
      (ev) => {
        events.push(ev);
      },
      "co1",
      {
        ok: true,
        supplierOrderId: "ord-1",
        interventionId: "int-1",
        billingSynced: true,
        lines: [{ sku: "A", label: "Serrure", quantity: 1, unitPriceCents: 30000 }],
      },
    );
    expect(events.some((e) => (e as { type: string }).type === "supplier_orders_panel")).toBe(true);
    expect(events.some((e) => (e as { type: string }).type === "supplier_order_pdf")).toBe(true);
    const previews = events.filter((e) => (e as { type: string }).type === "document_preview");
    expect(previews.length).toBe(2);
    expect(events.some((e) => (e as { type: string }).type === "registry_refresh")).toBe(true);
  });
});
