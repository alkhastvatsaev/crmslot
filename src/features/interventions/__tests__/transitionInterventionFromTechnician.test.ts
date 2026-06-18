import {
  serializeTechnicianExtraPatchForApi,
  transitionInterventionFromTechnician,
} from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import type { Intervention } from "@/features/interventions/types";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { serverTimestamp } from "firebase/firestore";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

const iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId"> = {
  status: "en_route",
  assignedTechnicianUid: "tech-uid-1",
  createdByUid: "creator-1",
  companyId: "co-test",
};

describe("serializeTechnicianExtraPatchForApi", () => {
  it("converts serverTimestamp completedAt to ISO string", () => {
    const out = serializeTechnicianExtraPatchForApi({
      completedAt: serverTimestamp(),
      completedByUid: "tech-1",
    });
    expect(out?.completedByUid).toBe("tech-1");
    expect(typeof out?.completedAt).toBe("string");
    expect(Number.isNaN(Date.parse(String(out?.completedAt)))).toBe(false);
  });
});

describe("transitionInterventionFromTechnician", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
  });

  it("posts transition to API", async () => {
    await transitionInterventionFromTechnician({
      interventionId: "iv-42",
      iv,
      toStatus: "in_progress",
      note: "Arrivée",
    });

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/interventions/iv-42/transition",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          toStatus: "in_progress",
          note: "Arrivée",
          extraPatch: undefined,
        }),
      })
    );
  });

  it("surfaces API error message", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ ok: false, error: "Transition interdite : en_route → done" }),
    } as Response);

    await expect(
      transitionInterventionFromTechnician({
        interventionId: "iv-42",
        iv,
        toStatus: "done",
      })
    ).rejects.toThrow("Transition interdite : en_route → done");
  });
});
