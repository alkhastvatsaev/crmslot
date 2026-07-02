import { matchMissionKitToStock } from "@/features/missionKit/matchMissionKitToStock";
import type { MissionKitItem } from "@/features/missionKit/types";

const baseItem = (overrides: Partial<MissionKitItem> = {}): MissionKitItem => ({
  id: "cyl-a2p",
  label: "Cylindre A2P",
  reference: "CYL-A2P",
  quantity: 1,
  source: "heuristic",
  status: "unknown",
  confidence: 0.8,
  ...overrides,
});

describe("matchMissionKitToStock", () => {
  it("marque in_vehicle si stock véhicule suffisant", () => {
    const { items, completenessScore } = matchMissionKitToStock([baseItem()], {
      vehicleStock: [{ description: "Cylindre A2P", reference: "CYL-A2P", quantity: 2 }],
    });
    expect(items[0]?.status).toBe("in_vehicle");
    expect(completenessScore).toBe(100);
  });

  it("marque in_warehouse si absent du véhicule mais présent entrepôt", () => {
    const { items } = matchMissionKitToStock([baseItem()], {
      vehicleStock: [],
      warehouseStock: [{ description: "Cylindre A2P", reference: "CYL-A2P", quantity: 1 }],
    });
    expect(items[0]?.status).toBe("in_warehouse");
  });

  it("marque missing si quantité insuffisante", () => {
    const { items } = matchMissionKitToStock([baseItem({ quantity: 3 })], {
      vehicleStock: [{ description: "Cylindre A2P", reference: "CYL-A2P", quantity: 1 }],
    });
    expect(items[0]?.status).toBe("missing");
  });

  it("laisse unknown sans données stock", () => {
    const { items, completenessScore } = matchMissionKitToStock([baseItem()], {});
    expect(items[0]?.status).toBe("unknown");
    expect(completenessScore).toBe(0);
  });
});
