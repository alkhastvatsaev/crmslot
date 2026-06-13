/** @jest-environment node */

import { autoAssignBestTechnicianAdmin } from "@/features/dispatch/server/autoAssignBestTechnicianAdmin";
import type { Intervention } from "@/features/interventions/types";

const mockApply = jest.fn();

jest.mock("@/features/backoffice/applyBackofficeTechnicianAssignmentAdmin", () => ({
  applyBackofficeTechnicianAssignmentAdmin: (...args: unknown[]) => mockApply(...args),
}));

jest.mock("@/features/dispatch/server/loadTechniciansAdmin", () => ({
  loadTechniciansAdmin: jest.fn().mockResolvedValue([
    {
      id: "tech-doc-1",
      name: "Jean",
      initial: "J",
      vehicle: "V1",
      status: "available",
      location: { lat: 50.85, lng: 4.35 },
      authUid: "uid-tech-1",
    },
  ]),
}));

function iv(): Intervention {
  return {
    id: "iv-1",
    title: "Porte",
    address: "Bruxelles",
    time: "10:00",
    status: "pending",
    location: { lat: 50.84, lng: 4.36 },
    companyId: "co-1",
  };
}

describe("autoAssignBestTechnicianAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApply.mockResolvedValue(undefined);
  });

  it("assigne le technicien le plus proche", async () => {
    const db = {} as never;
    const result = await autoAssignBestTechnicianAdmin({
      db,
      interventionId: "iv-1",
      iv: iv(),
      actorUid: "admin-1",
    });
    expect(result.assigned).toBe(true);
    expect(result.technicianUid).toBe("uid-tech-1");
    expect(mockApply).toHaveBeenCalled();
  });
});
