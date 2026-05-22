import { interventionDescriptionText } from "@/features/interventions/interventionDescriptionText";

describe("interventionDescriptionText", () => {
  it("prefers problem over title", () => {
    expect(
      interventionDescriptionText({
        problem: "Fuite sous évier",
        title: "Urgence",
      }),
    ).toBe("Fuite sous évier");
  });

  it("falls back to title when problem empty", () => {
    expect(
      interventionDescriptionText({
        problem: "",
        title: "Porte bloquée",
      }),
    ).toBe("Porte bloquée");
  });

  it("returns null for generic title only", () => {
    expect(
      interventionDescriptionText({
        problem: null,
        title: "Demande d'intervention",
      }),
    ).toBeNull();
  });
});
