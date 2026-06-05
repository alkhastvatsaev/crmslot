import { test, expect } from "@playwright/test";

/**
 * Smoke hub technicien — Ma journée (gauche) + détail mission (centre).
 */
test.describe("Technician hub missions", () => {
  test("shows technician hub layout on pager slot 2", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({ timeout: 60_000 });

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();

    await expect(page.locator('[data-testid="dashboard-pager-slot-2"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="daily-missions-empty-grid"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page
        .locator('[data-testid="technician-dashboard-detail-empty"]')
        .or(page.locator('[data-testid="technician-dashboard-detail"]')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
