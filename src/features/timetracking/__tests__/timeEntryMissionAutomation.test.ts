import {
  autoStartTimeEntryType,
  statusTransitionAfterTravelStop,
  statusTransitionForTimeEntryStart,
} from "@/features/timetracking/timeEntryMissionAutomation";

describe("timeEntryMissionAutomation", () => {
  it("suggests travel auto-start on en_route", () => {
    expect(autoStartTimeEntryType("en_route", false)).toBe("travel");
    expect(autoStartTimeEntryType("en_route", true)).toBeNull();
  });

  it("suggests on_site auto-start on in_progress", () => {
    expect(autoStartTimeEntryType("in_progress", false)).toBe("on_site");
  });

  it("maps travel start to en_route from assigned", () => {
    expect(statusTransitionForTimeEntryStart("assigned", "travel")).toBe("en_route");
  });

  it("maps on_site start to in_progress from en_route", () => {
    expect(statusTransitionForTimeEntryStart("en_route", "on_site")).toBe("in_progress");
  });

  it("maps travel stop to in_progress while en_route", () => {
    expect(statusTransitionAfterTravelStop("en_route")).toBe("in_progress");
  });
});
