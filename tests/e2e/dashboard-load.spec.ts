import { test, expect } from "@playwright/test";

test.describe("Dashboard Rail System Layout", () => {
  test("loads the dashboard and renders the 3 main panels correctly", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/testbelgiquepwa|crmslot|belgmap/i);

    const header = page.locator('header[data-testid="dashboard-global-header"]');
    await expect(header).toBeVisible();

    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible();
    await expect(page.locator("#map-container")).toBeVisible({ timeout: 60_000 });

    const galaxyDock = page.locator('[data-testid="dashboard-galaxy-dock"]');
    await expect(galaxyDock).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-galaxy-center-slot"]')).toBeVisible();
  });
});
