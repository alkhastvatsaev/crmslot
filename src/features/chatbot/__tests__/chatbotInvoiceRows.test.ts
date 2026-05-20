import {
  buildChatbotInvoiceRows,
  isChatbotInvoiceCandidate,
} from "@/features/chatbot/chatbotInvoiceRows";
import type { Intervention } from "@/features/interventions/types";

describe("chatbotInvoiceRows", () => {
  it("detects invoiced interventions", () => {
    expect(
      isChatbotInvoiceCandidate({
        id: "iv1",
        title: "Test",
        address: "x",
        time: "",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
      }),
    ).toBe(true);
  });

  it("builds sorted rows with totals", () => {
    const rows = buildChatbotInvoiceRows([
      {
        id: "iv-old",
        title: "A",
        address: "x",
        time: "",
        status: "done",
        location: { lat: 0, lng: 0 },
        billingLines: [{ description: "Main", quantity: 1, unitPriceCents: 1000 }],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "iv-new",
        title: "B",
        address: "x",
        time: "",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        invoiceAmountCents: 5000,
        invoicedAt: "2026-05-01T00:00:00.000Z",
      },
    ] as Intervention[]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.interventionId).toBe("iv-new");
    expect(rows[0]?.totalCents).toBe(5000);
  });
});
