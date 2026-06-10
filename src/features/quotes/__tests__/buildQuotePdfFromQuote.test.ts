/** @jest-environment node */

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import {
  buildQuotePdfFromQuote,
  quoteAsInterventionForPdf,
  quotePdfFileName,
} from "../buildQuotePdfFromQuote";
import type { Quote } from "../types";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "quote-abc-123",
    companyId: "c1",
    status: "sent",
    clientName: "Dupont",
    notes: "Remplacement cylindre",
    lines: [
      { description: "Cylindre 30×30", quantity: 1, unitPriceCents: 4500, reference: "CYL-30" },
      { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 8000 },
    ],
    totalCents: 12500,
    validityDays: 30,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("quoteAsInterventionForPdf", () => {
  it("mappe client, notes et lignes", () => {
    const iv = quoteAsInterventionForPdf(makeQuote());
    expect(iv.id).toBe("quote-abc-123");
    expect(iv.clientName).toBe("Dupont");
    expect(iv.billingLines).toHaveLength(2);
    expect(iv.billingLines?.[0]).toEqual({
      description: "Cylindre 30×30",
      quantity: 1,
      unitPriceCents: 4500,
      reference: "CYL-30",
    });
  });
});

describe("buildQuotePdfFromQuote", () => {
  it("génère des octets PDF non vides depuis un Quote", () => {
    const pdf = buildQuotePdfFromQuote(makeQuote());
    expect(pdf.byteLength).toBeGreaterThan(500);
  });
});

describe("quotePdfFileName", () => {
  it("nom de fichier basé sur la fin de l'id", () => {
    expect(quotePdfFileName(makeQuote())).toBe("devis-TEABC123.pdf");
  });
});
