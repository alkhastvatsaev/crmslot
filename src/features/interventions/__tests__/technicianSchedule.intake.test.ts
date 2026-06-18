import type { Intervention } from "@/features/interventions/types";
import {
  interventionVisibleInTechnicianMissionList,
  isInterventionPendingBackOfficeIntake,
  isInterventionReleasedToTechnicianField,
  isInterventionVisibleOnTechnicianMap,
  sortInterventionsByScheduleAsc,
} from "@/features/interventions/technicianSchedule";

function iv(status: Intervention["status"]): Intervention {
  return {
    id: "x",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    status,
    location: { lat: 50.8, lng: 4.35 },
  };
}

describe("technicianSchedule intake gate", () => {
  it("keeps pending dossiers in IVANA Demandes only", () => {
    expect(isInterventionPendingBackOfficeIntake(iv("pending"))).toBe(true);
    expect(isInterventionPendingBackOfficeIntake(iv("pending_needs_address"))).toBe(true);
    expect(isInterventionReleasedToTechnicianField(iv("pending"))).toBe(false);
    expect(isInterventionReleasedToTechnicianField(iv("pending_needs_address"))).toBe(false);
  });

  it("releases dossiers after IVANA validation (including assigned awaiting accept)", () => {
    expect(isInterventionReleasedToTechnicianField(iv("assigned"))).toBe(true);
    expect(isInterventionReleasedToTechnicianField(iv("in_progress"))).toBe(true);
    expect(isInterventionReleasedToTechnicianField(iv("en_route"))).toBe(true);
  });

  it("hides assigned and cancelled from technician map", () => {
    expect(isInterventionVisibleOnTechnicianMap(iv("assigned"))).toBe(false);
    expect(isInterventionVisibleOnTechnicianMap(iv("cancelled"))).toBe(false);
    expect(isInterventionVisibleOnTechnicianMap(iv("en_route"))).toBe(true);
    expect(isInterventionVisibleOnTechnicianMap(iv("waiting_material"))).toBe(true);
    expect(
      isInterventionVisibleOnTechnicianMap({
        ...iv("in_progress"),
        technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      })
    ).toBe(true);
  });
});

describe("interventionVisibleInTechnicianMissionList", () => {
  const now = new Date("2026-05-16T12:00:00");
  const techUid = "demo-tech-local";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps assigned missions visible before accept even if not scheduled today", () => {
    const row = {
      ...iv("assigned"),
      assignedTechnicianUid: techUid,
      scheduledDate: "2030-01-01",
      scheduledTime: "09:00",
    };
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, now)).toBe(true);
  });

  it("keeps accepted en_route missions visible even if not scheduled today", () => {
    const row = {
      ...iv("en_route"),
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      scheduledDate: "2030-01-01",
      scheduledTime: "09:00",
    };
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, now)).toBe(true);
  });

  it("shows accepted missions scheduled for today", () => {
    const row = {
      ...iv("en_route"),
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      scheduledDate: "2026-05-16",
      scheduledTime: "14:00",
    };
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, now)).toBe(true);
  });

  it("keeps missions completed today visible even if not scheduled today", () => {
    const row = {
      ...iv("done"),
      assignedTechnicianUid: techUid,
      scheduledDate: "2030-01-01",
      scheduledTime: "09:00",
      completedAt: "2026-05-16T15:00:00.000Z",
    };
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, now)).toBe(true);
  });

  it("hides done missions completed on another day when not scheduled today", () => {
    const row = {
      ...iv("done"),
      assignedTechnicianUid: techUid,
      scheduledDate: "2030-01-01",
      scheduledTime: "09:00",
      completedAt: "2026-05-10T15:00:00.000Z",
    };
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, now)).toBe(false);
  });

  it("hides active en_route missions when browsing another calendar day", () => {
    const row = {
      ...iv("en_route"),
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      scheduledDate: "2026-05-16",
      scheduledTime: "14:00",
    };
    const tomorrow = new Date("2026-05-17T12:00:00");
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, tomorrow)).toBe(false);
  });

  it("shows missions scheduled on the selected calendar day", () => {
    const row = {
      ...iv("en_route"),
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-10T08:00:00.000Z",
      scheduledDate: "2026-05-17",
      scheduledTime: "09:00",
    };
    const tomorrow = new Date("2026-05-17T12:00:00");
    expect(interventionVisibleInTechnicianMissionList(row, "today", techUid, tomorrow)).toBe(true);
  });
});

describe("sortInterventionsByScheduleAsc", () => {
  it("orders missions by scheduled time ascending", () => {
    const rows = [
      { ...iv("assigned"), id: "c", scheduledDate: "2026-05-16", scheduledTime: "14:00" },
      { ...iv("assigned"), id: "a", scheduledDate: "2026-05-16", scheduledTime: "09:00" },
      { ...iv("assigned"), id: "b", scheduledDate: "2026-05-16", scheduledTime: "11:30" },
    ];
    const sorted = sortInterventionsByScheduleAsc(rows);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});
