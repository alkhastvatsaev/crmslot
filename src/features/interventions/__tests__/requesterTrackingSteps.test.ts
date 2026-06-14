import {
  getTrackingHeadlineKey,
  resolveTrackingPhase,
  TRACKING_PROGRESS_SEGMENT_COUNT,
} from "@/features/interventions/requesterTrackingSteps";

describe("requesterTrackingSteps", () => {
  it("maps pending intervention to received phase", () => {
    const phase = resolveTrackingPhase({
      hasIntervention: true,
      hasDraft: false,
      isSubmitting: false,
      status: "pending",
    });
    expect(phase.id).toBe("received");
    expect(phase.progressIndex).toBe(0);
    expect(phase.showEta).toBe(true);
  });

  it("maps assigned intervention to technician phase", () => {
    const phase = resolveTrackingPhase({
      hasIntervention: true,
      hasDraft: false,
      isSubmitting: false,
      status: "assigned",
    });
    expect(phase.id).toBe("technician");
    expect(phase.progressIndex).toBe(1);
  });

  it("maps done intervention to completed phase with actions", () => {
    const phase = resolveTrackingPhase({
      hasIntervention: true,
      hasDraft: false,
      isSubmitting: false,
      status: "done",
    });
    expect(phase.id).toBe("completed");
    expect(phase.progressIndex).toBe(TRACKING_PROGRESS_SEGMENT_COUNT - 1);
    expect(phase.showCompletionExtras).toBe(true);
  });

  it("uses draft phase when no intervention yet", () => {
    const phase = resolveTrackingPhase({
      hasIntervention: false,
      hasDraft: true,
      isSubmitting: false,
      status: "draft",
    });
    expect(phase.id).toBe("draft");
    expect(phase.progressIndex).toBe(-1);
  });

  it("returns status-specific headline keys", () => {
    expect(getTrackingHeadlineKey("en_route", true)).toBe("tracking.headline.en_route");
    expect(getTrackingHeadlineKey("draft", false)).toBe("tracking.headline.draft");
  });
});
