/** @jest-environment jsdom */

jest.mock("@/core/config/firebase", () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue("mock-id-token"),
    },
  },
}));

import { auth } from "@/core/config/firebase";
import { authHeaders, fetchWithAuth } from "@/core/api/fetchWithAuth";

describe("fetchWithAuth", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it("adds Authorization header when user is signed in", async () => {
    const headers = await authHeaders({ "Content-Type": "application/json" });
    expect(headers.Authorization).toBe("Bearer mock-id-token");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("uses cached id token (no forced refresh)", async () => {
    await authHeaders();
    expect(auth!.currentUser!.getIdToken).toHaveBeenCalledWith(false);
  });

  it("calls fetch with merged headers", async () => {
    await fetchWithAuth("/api/maps/geocode?q=test");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/maps/geocode?q=test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-id-token",
        }),
      })
    );
  });

  it("prefers an explicit user token over auth.currentUser", async () => {
    const portalUser = {
      getIdToken: jest.fn().mockResolvedValue("portal-id-token"),
    };
    await fetchWithAuth(
      "/api/interventions/iv-1/portal-access-notify",
      { method: "POST" },
      { user: portalUser as never }
    );
    expect(portalUser.getIdToken).toHaveBeenCalledWith(false);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/interventions/iv-1/portal-access-notify",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer portal-id-token",
        }),
      })
    );
  });
});
