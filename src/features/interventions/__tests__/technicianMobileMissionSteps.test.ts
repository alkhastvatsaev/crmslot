import { resolveTechnicianMissionStepVisual } from "@/features/interventions/technicianMobileMissionSteps";

describe("resolveTechnicianMissionStepVisual", () => {
  it("marks offer at step 0", () => {
    expect(resolveTechnicianMissionStepVisual({ status: "assigned" }, true)).toEqual({
      activeIndex: 0,
      paused: false,
    });
  });

  it("marks en_route at step 1", () => {
    expect(resolveTechnicianMissionStepVisual({ status: "en_route" }, false)).toEqual({
      activeIndex: 1,
      paused: false,
    });
  });

  it("marks waiting material as paused on step 2", () => {
    expect(resolveTechnicianMissionStepVisual({ status: "waiting_material" }, false)).toEqual({
      activeIndex: 2,
      paused: true,
    });
  });
});
