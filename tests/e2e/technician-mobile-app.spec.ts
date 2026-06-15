import { test, expect } from "@playwright/test";

test.describe("App terrain /m/technician", () => {
  test("charge la shell technicien sur viewport mobile", async ({ page }) => {
    await page.goto("/m/technician");

    await expect(page).toHaveTitle(/crmslot/i);
    await expect(page.getByTestId("technician-mobile-app")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("mobile-shell")).not.toBeVisible();
  });
});
