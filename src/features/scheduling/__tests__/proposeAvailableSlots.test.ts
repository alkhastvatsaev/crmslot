import type { Intervention } from "@/features/interventions/types";
import { proposeAvailableSlotsForTechnician } from "@/features/scheduling/proposeAvailableSlots";

function iv(partial: Partial<Intervention> & Pick<Intervention, "id">): Intervention {
  return {
    status: "assigned",
    location: { lat: 0, lng: 0 },
    createdAt: "",
    ...partial,
  } as Intervention;
}

describe("proposeAvailableSlotsForTechnician", () => {
  it("excludes occupied slots for the technician on a date", () => {
    const interventions = [
      iv({
        id: "a",
        assignedTechnicianUid: "tech-1",
        scheduledDate: "2026-05-20",
        scheduledTime: "09:00",
        status: "assigned",
      }),
    ];

    const free = proposeAvailableSlotsForTechnician({
      interventions,
      technicianUid: "tech-1",
      dateYmd: "2026-05-20",
      slots: ["08:00", "09:00", "10:00"],
    });

    expect(free.map((s) => s.time)).toEqual(["08:00", "10:00"]);
  });

  it("ignores the dossier being scheduled when excludeInterventionId is set", () => {
    const interventions = [
      iv({
        id: "self",
        assignedTechnicianUid: "tech-1",
        scheduledDate: "2026-05-20",
        scheduledTime: "09:00",
        status: "assigned",
      }),
    ];

    const free = proposeAvailableSlotsForTechnician({
      interventions,
      technicianUid: "tech-1",
      dateYmd: "2026-05-20",
      excludeInterventionId: "self",
      slots: ["09:00"],
    });

    expect(free).toEqual([{ date: "2026-05-20", time: "09:00" }]);
  });
});
