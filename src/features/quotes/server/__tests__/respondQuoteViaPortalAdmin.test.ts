/** @jest-environment node */

import { respondQuoteViaPortalAdmin } from "@/features/quotes/server/respondQuoteViaPortalAdmin";
import type { Quote } from "@/features/quotes/types";

const mockFindIv = jest.fn();
const mockAccept = jest.fn();
const mockDecline = jest.fn();

jest.mock("@/features/interventions/server/portalLookupAdmin", () => ({
  findInterventionByPortalToken: (...args: unknown[]) => mockFindIv(...args),
}));

jest.mock("@/features/quotes/server/acceptQuoteAdmin", () => ({
  acceptQuoteAdmin: (...args: unknown[]) => mockAccept(...args),
}));

jest.mock("@/features/quotes/server/declineQuoteAdmin", () => ({
  declineQuoteAdmin: (...args: unknown[]) => mockDecline(...args),
}));

function makeQuote(partial: Partial<Quote> = {}): Quote {
  return {
    id: "q-1",
    companyId: "co-1",
    interventionId: "iv-1",
    status: "sent",
    lines: [{ description: "MO", quantity: 1, unitPriceCents: 1000 }],
    totalCents: 1000,
    validityDays: 30,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2027-01-01T00:00:00.000Z",
    ...partial,
  };
}

function makeDb(quote: Quote) {
  const timelineAdd = jest.fn(async () => {});
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
                }),
              }),
            }),
          };
        }
        if (name === "interventions") {
          return {
            doc: () => ({
              collection: () => ({ add: timelineAdd }),
            }),
          };
        }
        throw new Error(`unexpected ${name}`);
      },
    },
    timelineAdd,
  };
}

describe("respondQuoteViaPortalAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindIv.mockResolvedValue({
      id: "iv-1",
      companyId: "co-1",
      portalAccessToken: "token-1",
    });
    mockAccept.mockResolvedValue({
      appliedBilling: true,
      invoiceIssued: false,
    });
    mockDecline.mockResolvedValue(undefined);
  });

  it("accepte via acceptQuoteAdmin et journalise", async () => {
    const quote = makeQuote();
    const { db, timelineAdd } = makeDb(quote);

    const result = await respondQuoteViaPortalAdmin({
      db: db as never,
      portalToken: "token-1",
      quoteId: "q-1",
      action: "accept",
    });

    expect(result).toEqual({
      action: "accept",
      appliedBilling: true,
      invoiceIssued: false,
    });
    expect(mockAccept).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "co-1", quoteId: "q-1", actorUid: "portal" })
    );
    expect(timelineAdd).toHaveBeenCalled();
  });

  it("refuse un devis lié au dossier", async () => {
    const quote = makeQuote();
    const { db, timelineAdd } = makeDb(quote);

    const result = await respondQuoteViaPortalAdmin({
      db: db as never,
      portalToken: "token-1",
      quoteId: "q-1",
      action: "decline",
    });

    expect(result).toEqual({ action: "decline" });
    expect(mockDecline).toHaveBeenCalled();
    expect(timelineAdd).toHaveBeenCalled();
  });

  it("rejette un devis d'un autre dossier", async () => {
    const quote = makeQuote({ interventionId: "iv-other" });
    const { db } = makeDb(quote);

    await expect(
      respondQuoteViaPortalAdmin({
        db: db as never,
        portalToken: "token-1",
        quoteId: "q-1",
        action: "accept",
      })
    ).rejects.toThrow(/pas lié/);
  });
});
