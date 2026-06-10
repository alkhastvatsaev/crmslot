import { effectiveQuoteStatus, isQuoteExpired, quoteCanBeResponded } from "../quoteExpiration";
import type { Quote } from "../types";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "q1",
    companyId: "c1",
    status: "sent",
    lines: [{ description: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
    totalCents: 5000,
    validityDays: 30,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const NOW = new Date("2026-06-10T12:00:00.000Z");

describe("isQuoteExpired", () => {
  it("expire un devis sent dont expiresAt est dépassé", () => {
    const q = makeQuote({ expiresAt: "2026-06-01T00:00:00.000Z" });
    expect(isQuoteExpired(q, NOW)).toBe(true);
  });

  it("n'expire pas avant la date", () => {
    const q = makeQuote({ expiresAt: "2026-07-01T00:00:00.000Z" });
    expect(isQuoteExpired(q, NOW)).toBe(false);
  });

  it("n'expire jamais un devis accepté ou refusé", () => {
    expect(isQuoteExpired(makeQuote({ status: "accepted", expiresAt: "2020-01-01" }), NOW)).toBe(
      false
    );
    expect(isQuoteExpired(makeQuote({ status: "declined", expiresAt: "2020-01-01" }), NOW)).toBe(
      false
    );
  });

  it("respecte un statut expired déjà persisté", () => {
    expect(isQuoteExpired(makeQuote({ status: "expired" }), NOW)).toBe(true);
  });

  it("sans expiresAt → jamais expiré", () => {
    expect(isQuoteExpired(makeQuote({ expiresAt: null }), NOW)).toBe(false);
  });
});

describe("effectiveQuoteStatus", () => {
  it("retourne expired quand la date est dépassée", () => {
    expect(effectiveQuoteStatus(makeQuote({ expiresAt: "2026-06-01" }), NOW)).toBe("expired");
  });

  it("retourne le statut brut sinon", () => {
    expect(effectiveQuoteStatus(makeQuote(), NOW)).toBe("sent");
  });
});

describe("quoteCanBeResponded", () => {
  it("sent non expiré → true", () => {
    expect(quoteCanBeResponded(makeQuote(), NOW)).toBe(true);
  });

  it("sent expiré → false", () => {
    expect(quoteCanBeResponded(makeQuote({ expiresAt: "2026-06-01" }), NOW)).toBe(false);
  });

  it("draft → false", () => {
    expect(quoteCanBeResponded(makeQuote({ status: "draft" }), NOW)).toBe(false);
  });
});
