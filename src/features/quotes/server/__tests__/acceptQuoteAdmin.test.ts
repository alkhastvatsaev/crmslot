/** @jest-environment node */

import { acceptQuoteAdmin } from "@/features/quotes/server/acceptQuoteAdmin";
import type { Quote } from "@/features/quotes/types";

const mockIssueInvoice = jest.fn();

jest.mock("@/features/interventions/server/issueInterventionInvoiceAdmin", () => ({
  issueInterventionInvoiceAdmin: (...args: unknown[]) => mockIssueInvoice(...args),
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "__ts__" },
}));

function makeQuote(partial: Partial<Quote> = {}): Quote {
  return {
    id: "q-1",
    companyId: "co-1",
    interventionId: "iv-done",
    status: "sent",
    lines: [{ description: "MO", quantity: 1, unitPriceCents: 5500 }],
    totalCents: 5500,
    validityDays: 30,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2027-01-01T00:00:00.000Z",
    ...partial,
  };
}

function makeDb(quote: Quote, interventionStatus: string) {
  const quoteUpdate = jest.fn(async () => {});
  const ivUpdate = jest.fn(async () => {});
  return {
    db: {
      collection: (name: string) => {
        if (name === "companies") {
          return {
            doc: () => ({
              collection: () => ({
                doc: () => ({
                  get: async () => ({
                    exists: true,
                    id: quote.id,
                    data: () => quote,
                  }),
                  update: quoteUpdate,
                }),
              }),
            }),
          };
        }
        if (name === "interventions") {
          return {
            doc: () => ({
              get: async () => ({
                exists: true,
                id: "iv-done",
                data: () => ({ status: interventionStatus, companyId: "co-1" }),
              }),
              update: ivUpdate,
            }),
          };
        }
        throw new Error(`unexpected collection ${name}`);
      },
    },
    quoteUpdate,
    ivUpdate,
  };
}

describe("acceptQuoteAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIssueInvoice.mockResolvedValue({
      invoiceNumber: "FAC-2026-00001",
      emailSent: true,
    });
  });

  it("émet la facture si l'intervention est done", async () => {
    const { db } = makeDb(makeQuote(), "done");
    const result = await acceptQuoteAdmin({
      db: db as never,
      companyId: "co-1",
      quoteId: "q-1",
      actorUid: "admin-1",
    });
    expect(result.appliedBilling).toBe(true);
    expect(result.invoiceIssued).toBe(true);
    expect(mockIssueInvoice).toHaveBeenCalled();
  });

  it("copie les lignes sans facturer si l'intervention n'est pas clôturée", async () => {
    const { db } = makeDb(makeQuote(), "in_progress");
    const result = await acceptQuoteAdmin({
      db: db as never,
      companyId: "co-1",
      quoteId: "q-1",
      actorUid: "admin-1",
    });
    expect(result.appliedBilling).toBe(true);
    expect(result.invoiceIssued).toBe(false);
    expect(mockIssueInvoice).not.toHaveBeenCalled();
  });
});
