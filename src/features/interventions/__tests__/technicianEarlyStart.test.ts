import type { Intervention } from "@/features/interventions/types";
import {
  getInterventionExplicitScheduledStart,
  isInterventionBeforeScheduledSlot,
  isTechnicianEarlyStartPromptEligible,
} from "@/features/interventions/technicianSchedule";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-early",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    status: "en_route",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

describe("technician early start schedule", () => {
  const now = new Date("2026-05-16T08:30:00");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("detects future slot on same day", () => {
    const row = iv({ scheduledDate: "2026-05-16", scheduledTime: "09:00" });
    expect(getInterventionExplicitScheduledStart(row)?.toISOString()).toBe(
      new Date("2026-05-16T09:00:00").toISOString()
    );
    expect(isInterventionBeforeScheduledSlot(row, now)).toBe(true);
  });

  it("detects future day", () => {
    const row = iv({ scheduledDate: "2026-05-20", scheduledTime: "14:00" });
    expect(isInterventionBeforeScheduledSlot(row, now)).toBe(true);
  });

  it("is false when slot has started", () => {
    const row = iv({ scheduledDate: "2026-05-16", scheduledTime: "08:00" });
    expect(isInterventionBeforeScheduledSlot(row, now)).toBe(false);
  });

  it("is false without explicit schedule", () => {
    expect(
      isInterventionBeforeScheduledSlot(iv({ scheduledDate: null, scheduledTime: null }), now)
    ).toBe(false);
  });

  it("limits prompt to assigned and en_route", () => {
    expect(isTechnicianEarlyStartPromptEligible("assigned")).toBe(true);
    expect(isTechnicianEarlyStartPromptEligible("en_route")).toBe(true);
    expect(isTechnicianEarlyStartPromptEligible("in_progress")).toBe(false);
    expect(isTechnicianEarlyStartPromptEligible("done")).toBe(false);
  });
});
