"use client";

import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { makeIntervention } from "@/test-utils/factories";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "actor-uid" } },
}));

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("assignInterventionFromBackoffice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls assign API with technician and schedule", async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const row = makeIntervention({ id: "iv-1" });
    await assignInterventionFromBackoffice("iv-1", row, "tech-uid", {
      scheduledDate: "2026-06-16",
      scheduledTime: "14:00",
    });

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/interventions/iv-1/assign",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          technicianUid: "tech-uid",
          scheduledDate: "2026-06-16",
          scheduledTime: "14:00",
        }),
      })
    );
  });

  it("throws permission-denied when API returns 403", async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ ok: false, error: "Permission refusée pour cette société." }),
    } as Response);

    await expect(
      assignInterventionFromBackoffice("iv-1", makeIntervention({ id: "iv-1" }), "tech-uid")
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
});
