import {
  canOrderMissionKitItem,
  missionKitItemToMaterialOrderPart,
} from "@/features/missionKit/missionKitItemToMaterialOrderPart";
import type { MissionKitItem } from "@/features/missionKit/types";

const item: MissionKitItem = {
  id: "gache",
  label: "Gâche électrique 12V",
  reference: "GACHE-12V",
  lecotSku: "GACHE-12V",
  quantity: 2,
  source: "heuristic",
  status: "missing",
  confidence: 0.8,
};

describe("missionKitItemToMaterialOrderPart", () => {
  it("mappe vers MaterialOrderPart", () => {
    expect(missionKitItemToMaterialOrderPart(item)).toEqual({
      description: "Gâche électrique 12V",
      quantity: 2,
      reference: "GACHE-12V",
    });
  });

  it("canOrderMissionKitItem refuse si déjà commandé", () => {
    expect(canOrderMissionKitItem(item, ["gache"])).toBe(false);
    expect(canOrderMissionKitItem(item, [])).toBe(true);
    expect(canOrderMissionKitItem({ ...item, status: "in_vehicle" }, [])).toBe(false);
  });
});
