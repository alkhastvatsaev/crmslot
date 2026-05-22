import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { acceptTechnicianAssignment, declineTechnicianAssignment } from "@/features/interventions/respondToTechnicianAssignment";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/core/config/devUiPreview", () => ({
  devUiPreviewEnabled: true,
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatus", () => ({
  transitionInterventionStatus: jest.fn(),
}));

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;
const mockTransition = transitionInterventionStatus as jest.MockedFunction<
  typeof transitionInterventionStatus
>;

const row: Intervention = {
  id: "iv-1",
  title: "Test",
  address: "Rue 1",
  time: "10:00",
  status: "assigned",
  assignedTechnicianUid: "demo-tech-local",
  location: { lat: 0, lng: 0 },
};

describe("respondToTechnicianAssignment", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockTransition.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
  });

  it("accept posts to technician-response API in dev preview", async () => {
    await acceptTechnicianAssignment(row);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/interventions/iv-1/technician-response",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "accept" }),
      }),
    );
    expect(mockTransition).not.toHaveBeenCalled();
  });

  it("decline posts to technician-response API in dev preview", async () => {
    await declineTechnicianAssignment(row, "demo-tech-local");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/interventions/iv-1/technician-response",
      expect.objectContaining({
        body: JSON.stringify({ action: "decline" }),
      }),
    );
  });
});
