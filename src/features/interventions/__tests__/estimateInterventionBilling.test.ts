import { estimateInterventionBilling } from "@/features/interventions/estimateInterventionBilling";

describe("estimateInterventionBilling", () => {
  it("maps locked-out to forfait ouverture + déplacement zone 2 si urgent", () => {
    const estimate = estimateInterventionBilling({
      problemTemplateId: "locked-out",
      problemLabel: "Ouverture de porte claquée",
      address: "Rue de la Loi 16, 1000 Bruxelles",
      urgency: true,
      requestedDate: "2026-06-25",
      requestedTime: "14:00",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.lines).toHaveLength(2);
    expect(estimate!.lines[0]?.description).toContain("Forfait ouverture");
    expect(estimate!.lines[0]?.unitPriceCents).toBe(12500);
    expect(estimate!.lines[1]?.unitPriceCents).toBe(4500);
    expect(estimate!.travelZone).toBe(2);
    expect(estimate!.totalCents).toBe(17000);
  });

  it("applique la zone 1 pour un créneau standard en journée", () => {
    const estimate = estimateInterventionBilling({
      problemTemplateId: "cylinder",
      address: "Avenue Louise 100, 1050 Ixelles",
      urgency: false,
      requestedDate: "2026-06-25",
      requestedTime: "14:00",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.travelZone).toBe(1);
    expect(estimate!.lines.some((line) => line.unitPriceCents === 3500)).toBe(true);
  });

  it("applique la zone 3 pour une adresse éloignée", () => {
    const estimate = estimateInterventionBilling({
      problemTemplateId: "locked-out",
      address: "Grand Place 1, 9000 Gand",
      urgency: false,
      requestedDate: "2026-06-25",
      requestedTime: "14:00",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.travelZone).toBe(3);
    expect(estimate!.lines.some((line) => line.unitPriceCents === 5500)).toBe(true);
  });

  it("ajoute une majoration soir / week-end", () => {
    const estimate = estimateInterventionBilling({
      problemTemplateId: "locked-out",
      address: "Rue de la Loi 16, 1000 Bruxelles",
      urgency: false,
      requestedDate: "2026-06-25",
      requestedTime: "21:00",
    });

    expect(estimate).not.toBeNull();
    expect(estimate!.lines.some((line) => line.description.includes("Majoration"))).toBe(true);
    expect(estimate!.totalCents).toBeGreaterThan(17000);
  });
});
