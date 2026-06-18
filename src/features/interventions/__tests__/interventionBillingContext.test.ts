import {
  enrichDraftBillingLines,
  isAfterHoursOrWeekend,
  isLongDistanceAddress,
  resolveTravelUnitPriceCents,
} from "@/features/interventions/interventionBillingContext";

describe("interventionBillingContext", () => {
  const baseIv = {
    problem: "porte claquée",
    title: "Ouverture",
    category: "serrurerie" as const,
    address: "Rue de la Loi, Bruxelles",
    clientName: "Dupont",
    urgency: false,
    scheduledDate: "2026-06-18",
    scheduledTime: "14:00",
    estimatedDurationMinutes: 60,
    completionPhotos: [],
    location: { lat: 50.85, lng: 4.35 },
  };

  it("detects after-hours surcharge window", () => {
    expect(isAfterHoursOrWeekend("2026-06-18", "20:30")).toBe(true);
    expect(isAfterHoursOrWeekend("2026-06-20", "14:00")).toBe(true);
    expect(isAfterHoursOrWeekend("2026-06-18", "14:00")).toBe(false);
  });

  it("flags long-distance addresses outside Brussels", () => {
    expect(isLongDistanceAddress("Grand Place, Liège")).toBe(true);
    expect(isLongDistanceAddress("Ixelles, Bruxelles")).toBe(false);
  });

  it("enriches travel line with urgent pricing when urgency is set", () => {
    const lines = enrichDraftBillingLines({ ...baseIv, urgency: true }, [
      { description: "Déplacement forfaitaire", quantity: 1, unitPriceCents: 0 },
    ]);
    const travel = lines.find((l) => l.description.toLowerCase().includes("déplacement"));
    expect(travel?.unitPriceCents).toBe(resolveTravelUnitPriceCents({ ...baseIv, urgency: true }));
  });

  it("adds night surcharge line for weekend slot", () => {
    const lines = enrichDraftBillingLines(
      { ...baseIv, scheduledDate: "2026-06-20", scheduledTime: "11:00" },
      [
        { description: "Forfait ouverture", quantity: 1, unitPriceCents: 12_500 },
        { description: "Déplacement urgent", quantity: 1, unitPriceCents: 4_500 },
      ]
    );
    expect(lines.some((l) => l.description.includes("Majoration"))).toBe(true);
  });
});
