import {
  buildMissionKitChecklistPatch,
  shouldShowMissionKitMissingWarning,
} from "@/features/missionKit/missionKitChecklistFirestore";

describe("missionKitChecklistFirestore", () => {
  it("buildMissionKitChecklistPatch copie les ids", () => {
    const patch = buildMissionKitChecklistPatch(
      ["a", "b"],
      "tech-1",
      new Date("2026-01-02T10:00:00.000Z")
    );
    expect(patch.missionKitCheckedItemIds).toEqual(["a", "b"]);
    expect(patch.missionKitCheckedByUid).toBe("tech-1");
    expect(patch.missionKitCheckedAt).toBe("2026-01-02T10:00:00.000Z");
  });

  it("shouldShowMissionKitMissingWarning pour assigned avec manquants", () => {
    expect(shouldShowMissionKitMissingWarning("assigned", 2)).toBe(true);
    expect(shouldShowMissionKitMissingWarning("in_progress", 2)).toBe(false);
    expect(shouldShowMissionKitMissingWarning("assigned", 0)).toBe(false);
  });
});
