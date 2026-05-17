import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

const base: Technician = {
  id: "2",
  name: "Thomas",
  initial: "T",
  vehicle: "Van",
  status: "available",
  location: { lat: 50.85, lng: 4.35 },
};

describe("withTechnicianAuthUid", () => {
  it("keeps existing authUid", () => {
    expect(withTechnicianAuthUid({ ...base, authUid: "firebase-abc" }).authUid).toBe("firebase-abc");
  });

  it("fills default when missing", () => {
    expect(withTechnicianAuthUid(base).authUid).toBe(getDefaultAssignedTechnicianUid());
  });
});
