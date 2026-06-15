import { test, expect } from "@playwright/test";

test.describe("Mobile shell (infra)", () => {
  test("?forceMobile=1 affiche le shell mobile", async ({ page }) => {
    await page.goto("/?forceMobile=1");

    await expect(page).toHaveTitle(/crmslot/i);
    await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("dashboard-global-header")).not.toBeVisible();
  });

  test("viewport iPhone affiche le shell mobile sans query override", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 60_000 });
  });

  test("manifest PWA accessible", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as { name?: string; display?: string; start_url?: string };
    expect(json.name).toMatch(/crmslot/i);
    expect(json.display).toBe("standalone");
    expect(json.start_url).toBe("/");
  });
});
