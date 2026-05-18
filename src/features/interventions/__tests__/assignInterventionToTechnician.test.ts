import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";

describe("buildAssignInterventionToTechnicianUpdate", () => {
  const now = new Date("2026-05-16T14:30:00");
  const techUid = getDefaultAssignedTechnicianUid();

  it("sets status assigned and technician uid", () => {
    const patch = buildAssignInterventionToTechnicianUpdate(null, techUid, now);
    expect(patch.status).toBe("assigned");
    expect(patch.assignedTechnicianUid).toBe(techUid);
  });

  it("reuses requested date/time when present", () => {
    const patch = buildAssignInterventionToTechnicianUpdate(
      { requestedDate: "2026-06-01", requestedTime: "09:30" },
      techUid,
      now,
    );
    expect(patch.scheduledDate).toBe("2026-06-01");
    expect(patch.scheduledTime).toBe("09:30");
  });

  it("falls back to now when no schedule on dossier", () => {
    const patch = buildAssignInterventionToTechnicianUpdate({}, techUid, now);
    expect(patch.scheduledDate).toBe("2026-05-16");
    expect(patch.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it("uses schedule override when provided", () => {
    const patch = buildAssignInterventionToTechnicianUpdate({}, techUid, now, {
      scheduledDate: "2026-07-04",
      scheduledTime: "14:00",
    });
    expect(patch.scheduledDate).toBe("2026-07-04");
    expect(patch.scheduledTime).toBe("14:00");
  });
});
