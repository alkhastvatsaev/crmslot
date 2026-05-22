import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/core/api/fetchWithAuth");
jest.mock("@/features/interventions/workflow/transitionInterventionStatus", () => ({
  transitionInterventionStatus: jest.fn(async () => ({ id: "evt" })),
}));

jest.mock("@/core/config/devUiPreview", () => ({
  ...jest.requireActual("@/core/config/devUiPreview"),
  devUiPreviewEnabled: true,
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "u1" } },
  isConfigured: true,
}));

const mockFetch = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;
const mockTransition = transitionInterventionStatus as jest.MockedFunction<
  typeof transitionInterventionStatus
>;

const row: Intervention = {
  id: "iv-1",
  companyId: "demo-local-company",
  title: "Test",
  address: "Bruxelles",
  time: "10:00",
  status: "pending",
  location: { lat: 50.85, lng: 4.35 },
};

describe("assignInterventionFromBackoffice", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockTransition.mockClear();
  });

  it("uses dev API route when devUiPreviewEnabled", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await assignInterventionFromBackoffice("iv-1", row, "tech-uid", {
      scheduledDate: "2026-05-21",
      scheduledTime: "14:00",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/interventions/iv-1/assign",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockTransition).not.toHaveBeenCalled();
  });
});
