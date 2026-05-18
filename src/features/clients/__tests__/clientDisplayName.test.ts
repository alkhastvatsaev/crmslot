import { buildClientDisplayName } from "@/features/clients/clientDisplayName";

describe("buildClientDisplayName", () => {
  it("prefers explicit displayName", () => {
    expect(
      buildClientDisplayName({
        displayName: "ACME",
        firstName: "A",
        lastName: "B",
        companyName: "C",
      }),
    ).toBe("ACME");
  });

  it("falls back to person then company", () => {
    expect(
      buildClientDisplayName({
        displayName: "",
        firstName: "Jean",
        lastName: "Dupont",
        companyName: "SA",
      }),
    ).toBe("Jean Dupont");
    expect(
      buildClientDisplayName({
        displayName: "",
        firstName: null,
        lastName: null,
        companyName: "SA",
      }),
    ).toBe("SA");
  });
});
