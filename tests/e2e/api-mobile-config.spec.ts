import { test, expect } from "@playwright/test";

test.describe("API mobile config", () => {
  test("GET /api/mobile/config returns public mobile runtime config", async ({ request }) => {
    const res = await request.get("/api/mobile/config");
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as {
      ok?: boolean;
      mobileAccessAllowed?: boolean;
      forceMobileQueryKey?: string;
      hubPageCount?: number;
      pwaServiceWorkerEnabled?: boolean;
      timestamp?: string;
    };

    expect(body.ok).toBe(true);
    expect(typeof body.mobileAccessAllowed).toBe("boolean");
    expect(body.forceMobileQueryKey).toBe("forceMobile");
    expect(body.hubPageCount).toBeGreaterThanOrEqual(7);
    expect(body.timestamp).toBeTruthy();
  });
});
