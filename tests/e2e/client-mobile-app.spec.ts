import { test, expect } from "@playwright/test";

test.describe("Portail client /m/demande", () => {
  test("charge la shell client sur viewport mobile", async ({ page }) => {
    await page.goto("/m/demande");

    await expect(page).toHaveTitle(/demande|crmslot/i);
    await expect(page.getByTestId("client-mobile-app")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("client-mobile-top-bar")).toBeVisible();
    await expect(page.getByTestId("client-mobile-page-0")).toBeVisible();
  });
});
