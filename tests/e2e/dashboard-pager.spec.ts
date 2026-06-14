import { test, expect } from "@playwright/test";

async function openSpotlight(page: import("@playwright/test").Page) {
  await page.locator('[data-testid="spotlight-trigger"]').click();
}

test.describe("Dashboard carousel", () => {
  test("navigates across hub pages via spotlight (skips company and technician)", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible();

    const gotoPage = async (navIndex: number) => {
      await openSpotlight(page);
      await page.locator(`[data-testid="nav-item-${navIndex}"]`).click();
    };

    await gotoPage(3);
    await expect(page.locator('[data-testid="dashboard-page-3"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="dashboard-pager-slot-3-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    await gotoPage(4);
    await expect(page.locator('[data-testid="dashboard-page-4"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="dashboard-pager-slot-4-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    await gotoPage(5);
    await expect(page.locator('[data-testid="dashboard-page-5"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('[data-testid="dashboard-pager-slot-5-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });

    await gotoPage(3);
    await expect(page.locator('[data-testid="dashboard-pager-slot-3-panel-center"]')).toBeVisible();
  });

  test("reaches company hub via spotlight only", async ({ page }) => {
    await page.goto("/");
    await openSpotlight(page);
    await page.locator('[data-testid="nav-item-1"]').click();
    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test("reaches Gmail via spotlight only", async ({ page }) => {
    await page.goto("/");
    await openSpotlight(page);
    await page.locator('[data-testid="nav-item-6"]').click();
    await expect(page.locator('[data-testid="gmail-hub-panel-center"]')).toBeVisible({
      timeout: 20_000,
    });
  });
});
