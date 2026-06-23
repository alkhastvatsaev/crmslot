import {
  buildChatbotInvoiceRows,
  invoiceClientOnlyLabel,
  isChatbotInvoiceCandidate,
} from "@/features/chatbot/chatbotInvoiceRows";
import type { Intervention } from "@/features/interventions";

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
      })
    ).toBe(true);
  });

  it("uses client name only, not intervention title", () => {
    expect(
      invoiceClientOnlyLabel({
        clientFirstName: "Jean",
        clientLastName: "Dupont",
        clientName: "Dupont SA",
      } as never)
    ).toBe("Jean Dupont");
    expect(
      invoiceClientOnlyLabel({
        title: "Serrure bloquée",
        clientName: "Martin",
      } as never)
    ).toBe("Martin");
    expect(
      invoiceClientOnlyLabel({
        title: "Serrure bloquée",
      } as never)
    ).toBe("");
    const rows = buildChatbotInvoiceRows([
      {
        id: "iv-title-only",
        title: "Serrure bloquée",
        address: "x",
        time: "",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        invoiceAmountCents: 1000,
      },
    ] as Intervention[]);
    expect(rows[0]?.clientLabel).toBe("Client");
    expect(rows[0]?.problem).toBe("Serrure bloquée");
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
