import {
  buildPlanningHubKpis,
  buildPlanningSlotsForTechnician,
} from "@/features/planningHub/planningHubPatronMetrics";
import { localCalendarYmd } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";

const NOW = new Date("2026-06-18T12:00:00.000Z");
const today = localCalendarYmd(NOW);

describe("planningHubPatronMetrics", () => {
  it("detects conflicts and unassigned missions", () => {
    const interventions: Intervention[] = [
      {
        id: "a",
        title: "A",
        address: "x",
        time: "09:00",
        status: "assigned",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        scheduledDate: today,
        scheduledTime: "09:00",
      },
      {
        id: "b",
        title: "B",
        address: "y",
        time: "09:30",
        status: "assigned",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        scheduledDate: today,
        scheduledTime: "09:30",
      },
      {
        id: "c",
        title: "C",
        address: "z",
        time: "10:00",
        status: "pending",
        location: { lat: 0, lng: 0 },
        scheduledDate: today,
        scheduledTime: "10:00",
      },
    ];

    const kpis = buildPlanningHubKpis({ interventions, now: NOW });
    expect(kpis.missionsToday).toBe(2);
    expect(kpis.conflictCount).toBe(1);
    expect(kpis.unassignedToday).toBe(1);
  });

  it("builds slot grid for technician", () => {
    const interventions: Intervention[] = [
      {
        id: "a",
        title: "Mission",
        address: "x",
        time: "09:00",
        status: "assigned",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        scheduledDate: today,
        scheduledTime: "09:00",
      },
    ];

    const slots = buildPlanningSlotsForTechnician({
      interventions,
      technicianUid: "tech-1",
      now: NOW,
    });
    const busy = slots.find((s) => s.time === "09:00");
    expect(busy?.kind).toBe("busy");
    expect(busy?.interventionId).toBe("a");
  });
});
