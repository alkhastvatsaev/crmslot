import { test, expect } from "@playwright/test";

test.describe("Technician hub offline panel", () => {
  test("offline sync panel is reachable from technician carousel page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();

    const next = page.locator('[data-testid="dashboard-pager-next"]');
    await next.click();
    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible({
      timeout: 20_000,
    });

    await next.click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    const offlineAnchor = page.locator("#technician-hub-offline");
    if (await offlineAnchor.count()) {
      await offlineAnchor.scrollIntoViewIfNeeded();
    }

    const offlinePanel = page.locator('[data-testid="technician-offline-sync-panel"]');
    await expect(offlinePanel).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="offline-sync-queue-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-sync-flush-btn"]')).toBeVisible();
  });
});
