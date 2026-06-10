import { fetchMobileRuntimeConfig } from "@/features/mobile/fetchMobileRuntimeConfig";

describe("fetchMobileRuntimeConfig", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("parse la réponse /api/mobile/config", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        mobileAccessAllowed: true,
        forceMobileQueryKey: "forceMobile",
        pwaServiceWorkerEnabled: false,
        gitSha: "deadbeef",
        hubPageCount: 7,
        nodeEnv: "test",
        timestamp: "2026-06-07T00:00:00.000Z",
      }),
    });

    const cfg = await fetchMobileRuntimeConfig();
    expect(fetchMock).toHaveBeenCalledWith("/api/mobile/config", { cache: "no-store" });
    expect(cfg?.mobileAccessAllowed).toBe(true);
    expect(cfg?.hubPageCount).toBe(7);
  });

  it("retourne null si la route échoue", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await fetchMobileRuntimeConfig()).toBeNull();
  });
});
