import { test, expect } from "@playwright/test";

test.describe("Client portal deep links", () => {
  test("bmClientCase opens company hub on tracking tab and clears URL", async ({ page }) => {
    await page.goto("/?bmClientCase=iv-e2e-client-1");

    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).not.toHaveURL(/bmClientCase=/, { timeout: 15_000 });
    await expect(page.locator('[data-testid="requester-tracking-panel"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("payment success return opens tracking and strips query params", async ({ page }) => {
    await page.goto("/?payment=success&interventionId=iv-e2e-pay-1");

    await expect(page.locator('[data-testid="company-hub-rail-demande"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).not.toHaveURL(/payment=success/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/interventionId=/, { timeout: 5_000 });
    await expect(page.locator('[data-testid="requester-tracking-panel"]')).toBeVisible({
      timeout: 15_000,
    });
  });
});
