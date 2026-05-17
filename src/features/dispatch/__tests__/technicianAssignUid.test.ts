import { resolveTechnicianAssignUid } from "@/features/dispatch/technicianAssignUid";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

describe("resolveTechnicianAssignUid", () => {
  it("prefers authUid when set", () => {
    const tech: Technician = {
      id: "1",
      name: "Alex",
      initial: "A",
      vehicle: "Van",
      status: "available",
      location: { lat: 50.85, lng: 4.35 },
      authUid: "firebase-uid-abc",
    };
    expect(resolveTechnicianAssignUid(tech)).toBe("firebase-uid-abc");
  });

  it("falls back to default technician uid when no authUid", () => {
    const tech: Technician = {
      id: "1",
      name: "Alex",
      initial: "A",
      vehicle: "Van",
      status: "available",
      location: { lat: 50.85, lng: 4.35 },
    };
    expect(resolveTechnicianAssignUid(tech)).toBe(getDefaultAssignedTechnicianUid());
  });
});
