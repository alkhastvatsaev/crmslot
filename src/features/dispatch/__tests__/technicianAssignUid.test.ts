import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import type { Technician } from "@/features/technicians/types";

const techWithAuth: Technician = {
  id: "1",
  name: "Alex",
  initial: "A",
  vehicle: "Van",
  status: "available",
  location: { lat: 50.85, lng: 4.35 },
  authUid: "firebase-uid-abc",
};

describe("resolveTechnicianAssignUid", () => {
  it("uses authUid when set", () => {
    expect(resolveTechnicianAssignUid(techWithAuth)).toBe("firebase-uid-abc");
  });

  it("throws when authUid missing outside dev preview fallback", () => {
    const tech: Technician = {
      id: "1",
      name: "Alex",
      initial: "A",
      vehicle: "Van",
      status: "available",
      location: { lat: 50.85, lng: 4.35 },
    };
    expect(() => resolveTechnicianAssignUid(tech)).toThrow(/authUid/i);
    expect(canResolveTechnicianAssignUid(tech)).toBe(false);
  });

  it("canResolveTechnicianAssignUid is true when authUid present", () => {
    expect(canResolveTechnicianAssignUid(techWithAuth)).toBe(true);
  });
});
