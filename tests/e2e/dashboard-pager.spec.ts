import { test, expect } from "@playwright/test";

test.describe("Dashboard carousel", () => {
  test("navigates across all six dashboard pages", async ({ page }) => {
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

    await next.click();
    await expect(page.locator('[data-testid="dashboard-page-3"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="dashboard-pager-slot-3-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    await next.click();
    await expect(page.locator('[data-testid="dashboard-page-4"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="chatbot-chat"]')).toBeVisible({
      timeout: 20_000,
    });

    await next.click();
    await expect(page.locator('[data-testid="dashboard-page-5"]')).toBeVisible({
      timeout: 20_000,
    });
    const technicianLabFrame = page.frameLocator('[data-testid="technician-lab-iframe"]');
    await expect(technicianLabFrame.locator('[data-testid="technician-lab-view"]')).toBeVisible({
      timeout: 20_000,
    });

    await page.locator('[data-testid="dashboard-pager-prev"]').click();
    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible();
  });
});
