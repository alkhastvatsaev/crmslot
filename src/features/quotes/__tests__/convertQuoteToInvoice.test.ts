import { doc, updateDoc, type Firestore } from "firebase/firestore";
import { applyQuoteToInterventionBilling, quoteToBillingLines } from "../convertQuoteToInvoice";
import type { Quote } from "../types";

const mockDoc = doc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "q1",
    companyId: "c1",
    interventionId: "iv-9",
    status: "accepted",
    lines: [
      { description: "Cylindre", quantity: 2, unitPriceCents: 4500, reference: "CYL-30" },
      { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
    ],
    totalCents: 17000,
    validityDays: 30,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const db = {} as Firestore;

beforeEach(() => {
  mockDoc.mockClear();
  mockUpdateDoc.mockClear();
});

describe("quoteToBillingLines", () => {
  it("copie description, quantité, prix et référence", () => {
    expect(quoteToBillingLines(makeQuote().lines)).toEqual([
      { description: "Cylindre", quantity: 2, unitPriceCents: 4500, reference: "CYL-30" },
      { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
    ]);
  });

  it("omet la clé reference absente (Firestore refuse undefined)", () => {
    const [line] = quoteToBillingLines([{ description: "X", quantity: 1, unitPriceCents: 100 }]);
    expect("reference" in line).toBe(false);
  });
});

describe("applyQuoteToInterventionBilling", () => {
  it("écrit billingLines + quoteId sur l'intervention liée", async () => {
    const applied = await applyQuoteToInterventionBilling(db, makeQuote());
    expect(applied).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith(db, "interventions", "iv-9");
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      billingLines: [
        { description: "Cylindre", quantity: 2, unitPriceCents: 4500, reference: "CYL-30" },
        { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
      ],
      quoteId: "q1",
    });
  });

  it("ne fait rien sans interventionId", async () => {
    const applied = await applyQuoteToInterventionBilling(db, makeQuote({ interventionId: null }));
    expect(applied).toBe(false);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("ne fait rien sans lignes", async () => {
    const applied = await applyQuoteToInterventionBilling(db, makeQuote({ lines: [] }));
    expect(applied).toBe(false);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
