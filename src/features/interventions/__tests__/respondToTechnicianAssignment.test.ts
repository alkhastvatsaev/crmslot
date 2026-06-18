import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";
import type { Intervention } from "@/features/interventions/types";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

const TECH_UID = "tech-uid-1";

const row: Intervention = {
  id: "iv-1",
  title: "Test",
  address: "Rue 1",
  time: "10:00",
  status: "assigned",
  assignedTechnicianUid: TECH_UID,
  location: { lat: 0, lng: 0 },
};

describe("respondToTechnicianAssignment", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
  });

  it("accept posts to technician-response API", async () => {
    await acceptTechnicianAssignment(row);
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/interventions/iv-1/technician-response",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "accept" }),
      })
    );
  });

  it("decline posts to technician-response API", async () => {
    await declineTechnicianAssignment(row, TECH_UID);
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/interventions/iv-1/technician-response",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "decline" }),
      })
    );
  });

  it("surfaces API error message", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ ok: false, error: "Mission non assignée à ce technicien." }),
    } as Response);

    await expect(acceptTechnicianAssignment(row)).rejects.toThrow(
      "Mission non assignée à ce technicien."
    );
  });
});
