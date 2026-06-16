import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";
import type { Technician } from "@/features/technicians/types";

describe("withTechnicianAuthUid", () => {
  it("returns technician unchanged", () => {
    const tech: Technician = {
      id: "t1",
      name: "Tech",
      authUid: "uid-1",
      status: "available",
      location: { lat: 0, lng: 0 },
      initial: "T",
      vehicle: "van-1",
    };
    expect(withTechnicianAuthUid(tech)).toEqual(tech);
  });
});
