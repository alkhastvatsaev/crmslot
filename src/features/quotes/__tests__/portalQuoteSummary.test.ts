import { quoteTotalTtcCents, toPortalQuoteSummary } from "@/features/quotes/portalQuoteSummary";
import type { Quote } from "@/features/quotes/types";

function makeQuote(partial: Partial<Quote> = {}): Quote {
  return {
    id: "q-1",
    companyId: "co-1",
    interventionId: "iv-1",
    status: "sent",
    lines: [{ description: "MO", quantity: 1, unitPriceCents: 10000 }],
    totalCents: 10000,
    validityDays: 30,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2027-01-01T00:00:00.000Z",
    sentAt: "2026-06-02T00:00:00.000Z",
    ...partial,
  };
}

describe("portalQuoteSummary", () => {
  it("calcule le TTC à 6%", () => {
    expect(quoteTotalTtcCents(10000)).toBe(10600);
  });

  it("autorise la réponse pour un devis envoyé non expiré", () => {
    const summary = toPortalQuoteSummary(makeQuote(), new Date("2026-06-10T00:00:00.000Z"));
    expect(summary.canRespond).toBe(true);
    expect(summary.effectiveStatus).toBe("sent");
  });

  it("marque expiré et non répondable", () => {
    const summary = toPortalQuoteSummary(
      makeQuote({ expiresAt: "2026-06-01T00:00:00.000Z" }),
      new Date("2026-06-10T00:00:00.000Z")
    );
    expect(summary.effectiveStatus).toBe("expired");
    expect(summary.canRespond).toBe(false);
  });
});
