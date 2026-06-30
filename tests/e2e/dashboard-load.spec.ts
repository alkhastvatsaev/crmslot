import { test, expect } from "@playwright/test";
import {
  DESKTOP_VIEWPORT,
  ensureDesktopShell,
  skipIfStaffLoginGate,
} from "./helpers/dashboardDesktop";

test.describe("Dashboard Rail System Layout", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("viewport bureau — shell desktop ou écran de connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("mobile-shell")).toHaveCount(0);
    const onDashboard = await page
      .getByTestId("dashboard-desktop-stack")
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    const onLogin = await page
      .getByRole("heading", { name: /espace administrateur/i })
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(onDashboard || onLogin).toBe(true);
  });

  test("carte + galaxy dock quand session active", async ({ page }) => {
    await page.goto("/");
    await skipIfStaffLoginGate(page);
    await ensureDesktopShell(page);

    await expect(page).toHaveTitle(/testbelgiquepwa|crmslot/i);
    await expect(page.getByTestId("dashboard-page-home")).toBeVisible();
    await expect(page.locator("#map-container")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("dashboard-galaxy-dock")).toBeVisible();
    await expect(page.getByTestId("dashboard-galaxy-center-slot")).toBeVisible();
  });
});
