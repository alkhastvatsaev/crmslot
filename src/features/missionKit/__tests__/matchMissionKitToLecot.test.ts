import { matchMissionKitToLecot } from "@/features/missionKit/matchMissionKitToLecot";
import type { MissionKitItem } from "@/features/missionKit/types";

describe("matchMissionKitToLecot", () => {
  const catalog = [
    { sku: "CYL-A2P", label: "Cylindre A2P", unitPriceCents: 8900, category: "serrurerie" },
    { sku: "SERR-3PT", label: "Serrure 3 points", unitPriceCents: 24500, category: "serrurerie" },
  ];

  it("enrichit référence et sku Lecot depuis le label", () => {
    const items: MissionKitItem[] = [
      {
        id: "cyl",
        label: "Cylindre A2P",
        quantity: 1,
        source: "heuristic",
        status: "unknown",
        confidence: 0.5,
      },
    ];
    const out = matchMissionKitToLecot(items, catalog);
    expect(out[0]?.reference).toBe("CYL-A2P");
    expect(out[0]?.lecotSku).toBe("CYL-A2P");
    expect(out[0]?.source).toBe("lecot_catalog");
  });

  it("conserve source historical_billing", () => {
    const items: MissionKitItem[] = [
      {
        id: "cyl",
        label: "Cylindre A2P",
        quantity: 1,
        source: "historical_billing",
        status: "unknown",
        confidence: 0.7,
      },
    ];
    const out = matchMissionKitToLecot(items, catalog);
    expect(out[0]?.source).toBe("historical_billing");
    expect(out[0]?.lecotSku).toBe("CYL-A2P");
  });
});
