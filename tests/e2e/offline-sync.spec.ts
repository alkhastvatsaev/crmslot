import { test, expect } from "@playwright/test";

test.describe("Technician offline sync", () => {
  test("offline panel visible and flush button disabled without network", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    const offlinePanel = page.locator('[data-testid="technician-offline-sync-panel"]');
    await expect(offlinePanel).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="offline-sync-queue-count"]')).toBeVisible();

    await context.setOffline(true);
    await expect(page.locator('[data-testid="offline-sync-flush-btn"]')).toBeVisible();

    await context.setOffline(false);
    await expect(page.locator('[data-testid="offline-sync-flush-btn"]')).toBeVisible();
  });
});
