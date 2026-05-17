import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import { resolveTechnicianAssignUid } from "@/features/dispatch/technicianAssignUid";
import { matchesAssignedTechnician } from "@/features/interventions/technicianAssignmentActions";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

const technician: Technician = {
  id: "tech-doc-1",
  name: "Mansour",
  initial: "M",
  vehicle: "Van",
  status: "available",
  location: { lat: 50.85, lng: 4.35 },
  authUid: "firebase-real-uid-99",
};

describe("back-office assign → technicien hub parity", () => {
  it("writes assignedTechnicianUid equal to resolveTechnicianAssignUid", () => {
    const uid = resolveTechnicianAssignUid(technician);
    const patch = buildAssignInterventionToTechnicianUpdate(
      { requestedDate: "2026-05-16", requestedTime: "14:00" },
      uid,
    );
    expect(patch.assignedTechnicianUid).toBe("firebase-real-uid-99");
    expect(patch.status).toBe("assigned");
  });

  it("hub filter matches patch when auth uses same uid", () => {
    const uid = resolveTechnicianAssignUid(technician);
    const patch = buildAssignInterventionToTechnicianUpdate(null, uid);
    expect(
      matchesAssignedTechnician({ assignedTechnicianUid: patch.assignedTechnicianUid }, uid),
    ).toBe(true);
  });

  it("default technician without authUid uses env fallback", () => {
    const fallback: Technician = {
      id: "1",
      name: "Demo",
      initial: "D",
      vehicle: "Van",
      status: "available",
      location: { lat: 50.85, lng: 4.35 },
    };
    expect(resolveTechnicianAssignUid(fallback)).toBe(getDefaultAssignedTechnicianUid());
  });
});
