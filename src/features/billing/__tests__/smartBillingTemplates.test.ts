import { computeBillingLineSuggestions } from "../smartBillingTemplates";
import type { Intervention } from "@/features/interventions/types";

const iv = (lines: { description: string; quantity: number; unitPriceCents: number }[]): Intervention =>
  ({
    id: "iv",
    companyId: "c",
    status: "done",
    billingLines: lines,
  }) as unknown as Intervention;

describe("computeBillingLineSuggestions", () => {
  it("returns empty array when no past interventions", () => {
    expect(computeBillingLineSuggestions([])).toEqual([]);
  });

  it("ranks by frequency descending", () => {
    const interventions = [
      iv([{ description: "Serrure", quantity: 1, unitPriceCents: 8000 }]),
      iv([{ description: "Serrure", quantity: 1, unitPriceCents: 8000 }]),
      iv([{ description: "Vitre", quantity: 1, unitPriceCents: 6000 }]),
    ];
    const suggestions = computeBillingLineSuggestions(interventions);
    expect(suggestions[0].description).toBe("Serrure");
    expect(suggestions[0].frequency).toBe(2);
    expect(suggestions[1].description).toBe("Vitre");
    expect(suggestions[1].frequency).toBe(1);
  });

  it("averages quantity across uses", () => {
    const interventions = [
      iv([{ description: "Main d'oeuvre", quantity: 1, unitPriceCents: 5000 }]),
      iv([{ description: "Main d'oeuvre", quantity: 3, unitPriceCents: 5000 }]),
    ];
    const [sug] = computeBillingLineSuggestions(interventions);
    expect(sug.quantity).toBe(2); // avg(1,3)
  });

  it("limits results to maxSuggestions", () => {
    const interventions = Array.from({ length: 10 }, (_, i) =>
      iv([{ description: `Item ${i}`, quantity: 1, unitPriceCents: 1000 * (i + 1) }]),
    );
    expect(computeBillingLineSuggestions(interventions, 3)).toHaveLength(3);
  });

  it("groups by description + price (different prices = separate suggestions)", () => {
    const interventions = [
      iv([{ description: "Serrure", quantity: 1, unitPriceCents: 8000 }]),
      iv([{ description: "Serrure", quantity: 1, unitPriceCents: 9000 }]),
    ];
    expect(computeBillingLineSuggestions(interventions)).toHaveLength(2);
  });

  it("sets source to 'history'", () => {
    const suggestions = computeBillingLineSuggestions([
      iv([{ description: "X", quantity: 1, unitPriceCents: 1000 }]),
    ]);
    expect(suggestions[0].source).toBe("history");
  });
});
