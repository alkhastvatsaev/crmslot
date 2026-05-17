import { test, expect } from "@playwright/test";

/**
 * Smoke hub technicien (démo / staging preview) — missions visibles pour le technicien par défaut.
 */
test.describe("Technician hub missions", () => {
  test("shows today missions on hub page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({ timeout: 60_000 });

    const next = page.locator('[data-testid="dashboard-pager-next"]');
    await expect(next).toBeEnabled();
    await next.click();
    await next.click();

    await expect(page.locator('[data-testid="dashboard-pager-slot-2"]')).toBeVisible({ timeout: 30_000 });

    const list = page.locator('[data-testid="technician-dashboard-list"]');
    await expect(list).toBeVisible({ timeout: 30_000 });

    const missionRow = page.locator('[data-testid^="technician-case-mock-day-"]').first();
    await expect(missionRow).toBeVisible({ timeout: 30_000 });
  });
});
