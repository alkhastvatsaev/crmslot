import { test, expect } from "@playwright/test";

test.describe("Dashboard carousel", () => {
  test("navigates between map, company hub and technician hub", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible();

    const next = page.locator('[data-testid="dashboard-pager-next"]');
    await next.click();
    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible({
      timeout: 20_000,
    });

    await next.click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.locator('[data-testid="dashboard-pager-prev"]').click();
    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible();
  });
});
