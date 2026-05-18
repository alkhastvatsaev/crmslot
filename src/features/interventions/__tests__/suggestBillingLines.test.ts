import { suggestBillingLinesFromProblem } from "@/features/interventions/suggestBillingLines";

describe("suggestBillingLinesFromProblem", () => {
  it("returns lines for door opening keywords", () => {
    const lines = suggestBillingLinesFromProblem("ouverture porte claquée", "serrurerie");
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.description.toLowerCase().includes("ouverture"))).toBe(true);
  });

  it("returns empty for blank problem", () => {
    expect(suggestBillingLinesFromProblem("   ")).toEqual([]);
  });
});
