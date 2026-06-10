import { test, expect } from "@playwright/test";

/**
 * Smoke hub technicien — Ma journée (gauche) + détail mission (centre).
 */
test.describe("Technician hub missions", () => {
  test("shows technician hub layout on pager slot 2", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
      timeout: 60_000,
    });

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();

    const leftPanel = page.locator('[data-testid="dashboard-pager-slot-2-panel-left"]');
    await expect(
      leftPanel
        .locator('[data-testid="daily-missions-empty-grid"]')
        .or(leftPanel.locator('[data-testid="daily-missions-grid"]'))
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 30_000,
    });
  });
});
