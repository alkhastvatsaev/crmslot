import { test, expect } from "@playwright/test";

test.describe("DesktopOnlyGate prod-like", () => {
  test("API mobile config denies access without ALLOW_MOBILE", async ({ request }) => {
    const res = await request.get("/api/mobile/config");
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as { mobileAccessAllowed?: boolean };
    expect(body.mobileAccessAllowed).toBe(false);
  });

  test("iPhone is blocked when runtime denies mobile", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("desktop-only-gate-blocked")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Version desktop uniquement")).toBeVisible();
    await expect(page.getByTestId("mobile-shell")).not.toBeVisible();
  });

  test("iPhone passes when runtime config allows mobile", async ({ page }) => {
    await page.route("**/api/mobile/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          mobileAccessAllowed: true,
          forceMobileQueryKey: "forceMobile",
          pwaServiceWorkerEnabled: false,
          gitSha: null,
          hubPageCount: 9,
          nodeEnv: "production",
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/");

    await expect(page.getByTestId("desktop-only-gate-blocked")).not.toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("DesktopOnlyGate prod-like @desktop", () => {
  test("desktop user agent is not blocked", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("desktop-only-gate-blocked")).not.toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("mobile-shell")).not.toBeVisible();
  });
});
