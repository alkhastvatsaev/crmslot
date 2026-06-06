import { test, expect } from "@playwright/test";

test.describe("Technician hub offline panel", () => {
  test("offline sync panel is reachable from technician carousel page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    const offlineAnchor = page.locator("#technician-hub-offline");
    if (await offlineAnchor.count()) {
      await offlineAnchor.scrollIntoViewIfNeeded();
    }

    const offlinePanel = page.locator(
      '[data-testid="dashboard-pager-slot-2-panel-right"] [data-testid="technician-offline-sync-panel"]'
    );
    await expect(offlinePanel).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="offline-sync-queue-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-sync-flush-btn"]')).toBeVisible();
  });
});
