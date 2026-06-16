import { test, expect } from "@playwright/test";

test.describe("App terrain /m/technician", () => {
  test("charge la shell technicien sur viewport mobile", async ({ page }) => {
    await page.goto("/m/technician");

    await expect(page).toHaveTitle(/crmslot/i);
    await expect(page.getByTestId("technician-mobile-app")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("technician-mobile-header-calendar")).toBeVisible();
    await expect(page.getByTestId("technician-mobile-shell-footer")).toBeVisible();
    await expect(page.getByTestId("mobile-shell-galaxy")).toBeVisible();
  });

  test("deep link notification reste sur /m/technician", async ({ page }) => {
    await page.goto("/m/technician?bmTechCase=iv-test-123");

    await expect(page).toHaveURL(/\/m\/technician/);
    await expect(page).toHaveURL(/\/m\/technician(\?|$)/, { timeout: 15_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toMatch(/bmTechCase=/);
  });
});
