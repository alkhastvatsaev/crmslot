import type { Intervention } from "@/features/interventions";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";

function iv(partial: Partial<Intervention> & { id: string }): Intervention {
  return {
    title: "Test",
    address: "Rue",
    time: "10:00",
    status: partial.status ?? "assigned",
    location: { lat: 50.8, lng: 4.35 },
    assignedTechnicianUid: partial.assignedTechnicianUid ?? "tech-a",
    scheduledDate: partial.scheduledDate ?? "2026-05-20",
    scheduledTime: partial.scheduledTime ?? "10:00",
    ...partial,
  } as Intervention;
}

describe("scheduleConflicts", () => {
  const candidate = candidateRangeFromScheduleFields("2026-05-20", "10:00");
  if (!candidate) throw new Error("fixture range");

  it("detects overlap on same technician", () => {
    const rows = [
      iv({ id: "a", assignedTechnicianUid: "tech-a", scheduledTime: "10:00" }),
      iv({ id: "b", assignedTechnicianUid: "tech-b", scheduledTime: "10:00" }),
    ];
    const conflicts = findTechnicianScheduleConflicts({
      interventions: rows,
      technicianUid: "tech-a",
      candidateRange: candidate,
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.interventionId).toBe("a");
  });

  it("ignores cancelled and excludes current dossier", () => {
    const rows = [
      iv({ id: "a", status: "cancelled", scheduledTime: "10:00" }),
      iv({ id: "b", scheduledTime: "10:00" }),
    ];
    const conflicts = findTechnicianScheduleConflicts({
      interventions: rows,
      technicianUid: "tech-a",
      candidateRange: candidate,
      excludeInterventionId: "b",
    });
    expect(conflicts).toHaveLength(0);
  });

  it("allows adjacent non-overlapping slot", () => {
    const rows = [iv({ id: "a", scheduledTime: "08:00" })];
    const slot11 = candidateRangeFromScheduleFields("2026-05-20", "11:00");
    if (!slot11) throw new Error("range");
    const conflicts = findTechnicianScheduleConflicts({
      interventions: rows,
      technicianUid: "tech-a",
      candidateRange: slot11,
    });
    expect(conflicts).toHaveLength(0);
  });
});
