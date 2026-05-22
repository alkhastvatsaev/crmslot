import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
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

const iv: Pick<
  Intervention,
  "status" | "assignedTechnicianUid" | "createdByUid" | "companyId"
> = {
  status: "en_route",
  assignedTechnicianUid: "demo-tech-local",
  createdByUid: "creator-1",
  companyId: "demo-local-company",
};

describe("transitionInterventionFromTechnician", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
  });

  it("posts en_route → in_progress to transition API in dev preview", async () => {
    await transitionInterventionFromTechnician({
      interventionId: "iv-42",
      iv,
      toStatus: "in_progress",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/interventions/iv-42/transition",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ toStatus: "in_progress", note: undefined, extraPatch: undefined }),
      }),
    );
    expect(transitionInterventionStatus).not.toHaveBeenCalled();
  });
});
