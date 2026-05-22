import {
  displayMaterialOrderClientName,
  MATERIAL_ORDER_CLIENT_FALLBACK,
  readStoredOrderClientName,
  requireMaterialOrderClientName,
} from "@/features/materials/materialOrderClientName";

describe("materialOrderClientName", () => {
  it("requireMaterialOrderClientName rejects empty", () => {
    expect(() => requireMaterialOrderClientName("  ")).toThrow(/clientName requis/i);
  });

  it("displayMaterialOrderClientName prefers stored clientName", () => {
    expect(
      displayMaterialOrderClientName({
        clientName: "Dupont SA",
        interventionId: "iv-1",
      }),
    ).toBe("Dupont SA");
  });

  it("readStoredOrderClientName reads clientName or legacy nom", () => {
    expect(readStoredOrderClientName({ clientName: "Dupont" })).toBe("Dupont");
    expect(readStoredOrderClientName({ nom: "Martin SPRL" })).toBe("Martin SPRL");
    expect(readStoredOrderClientName({})).toBeNull();
  });

  it("displayMaterialOrderClientName falls back to intervention map then Client", () => {
    const map = new Map([["iv-1", "Jean Dupont"]]);
    expect(
      displayMaterialOrderClientName({ interventionId: "iv-1" }, map),
    ).toBe("Jean Dupont");
    expect(displayMaterialOrderClientName({ interventionId: "iv-missing" })).toBe(
      MATERIAL_ORDER_CLIENT_FALLBACK,
    );
  });
});
