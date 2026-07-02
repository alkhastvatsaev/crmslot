import { buildMissionKit } from "@/features/missionKit/buildMissionKit";

describe("buildMissionKit", () => {
  const base = { interventionId: "iv-test-1" };

  it("suggère cylindre pour porte bloquée avec barillet", () => {
    const kit = buildMissionKit({
      ...base,
      category: "serrurerie",
      problem: "Porte bloquée, cylindre européen cassé",
    });
    expect(kit.items.some((i) => /cylindre/i.test(i.label))).toBe(true);
    expect(kit.items.some((i) => /scie-cloche/i.test(i.label))).toBe(true);
    expect(kit.completenessScore).toBe(0);
  });

  it("suggère serrure 3 points pour porte blindée", () => {
    const kit = buildMissionKit({
      ...base,
      category: "serrurerie",
      problem: "Porte blindée ne ferme plus",
    });
    expect(kit.items.some((i) => /3 points/i.test(i.label))).toBe(true);
    expect(kit.items.some((i) => /gâche/i.test(i.label))).toBe(true);
  });

  it("suggère gâche pour problème gâche explicite", () => {
    const kit = buildMissionKit({
      ...base,
      problem: "Gâche électrique défectueuse",
    });
    expect(kit.items).toHaveLength(1);
    expect(kit.items[0]?.label).toMatch(/gâche/i);
    expect(kit.items[0]?.reference).toBe("GACHE-12V");
  });

  it("retourne kit de base serrurerie si description vague", () => {
    const kit = buildMissionKit({
      ...base,
      category: "serrurerie",
      problem: "",
      title: "Intervention urgente",
    });
    expect(kit.items.length).toBeGreaterThanOrEqual(2);
    expect(kit.summary).toMatch(/kit de base/i);
  });

  it("inclut outillage de base pour catégorie autre", () => {
    const kit = buildMissionKit({
      ...base,
      category: "autre",
      problem: "Volet roulant bloqué",
    });
    expect(kit.items.some((i) => /perceuse/i.test(i.label))).toBe(true);
    expect(kit.items.some((i) => /tournevis/i.test(i.label))).toBe(true);
  });

  it("enrichit le kit avec billingLines de jobs similaires", () => {
    const kit = buildMissionKit({
      ...base,
      problem: "Cylindre bloqué porte entrée",
      peerInterventions: [
        {
          id: "peer-1",
          title: "t",
          address: "a",
          time: "10:00",
          status: "done",
          location: { lat: 0, lng: 0 },
          problem: "Cylindre coincé porte entrée",
          billingLines: [
            {
              description: "Cylindre A2P",
              quantity: 1,
              unitPriceCents: 8900,
              reference: "CYL-A2P",
            },
            { description: "Main-d'œuvre déplacement", quantity: 1, unitPriceCents: 7500 },
          ],
        },
      ],
    });
    expect(
      kit.items.some((i) => i.label === "Cylindre A2P" && i.source === "historical_billing")
    ).toBe(true);
    expect(kit.historicalHint).toMatch(/similaires/i);
  });

  it("calcule completenessScore avec stock véhicule", () => {
    const kit = buildMissionKit({
      ...base,
      category: "serrurerie",
      problem: "Cylindre bloqué",
      vehicleStock: [
        { description: "Cylindre européen 30/35", reference: "CYL-EURO-3035", quantity: 2 },
        { description: "Scie-cloche métal", quantity: 1 },
      ],
    });
    expect(kit.completenessScore).toBeGreaterThan(0);
    expect(kit.items.some((i) => i.status === "in_vehicle")).toBe(true);
  });
});
