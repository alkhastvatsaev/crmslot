import { test, expect } from "@playwright/test";

/**
 * Smoke assignation back-office (données démo en dev / staging preview).
 * Dossier attendu : `demo-mission-backoffice-only` (voir demoInterventions.ts).
 */
test.describe("Back-office assign flow", () => {
  test("opens assign picker and confirms technician", async ({ page }) => {
    await page.goto("/");

    const inbox = page.locator('[data-testid="backoffice-inbox-panel"]');
    await expect(inbox).toBeVisible({ timeout: 60_000 });

    const requestsTab = page.getByRole("button", { name: /demandes|requests/i }).first();
    if (await requestsTab.isVisible().catch(() => false)) {
      await requestsTab.click();
    }

    const demoRow = page.locator(
      '[data-testid="backoffice-inbox-request-row-demo-mission-backoffice-only"]',
    );
    await expect(demoRow).toBeVisible({ timeout: 30_000 });
    await demoRow.click();

    const assignBtn = page.locator('[data-testid="backoffice-inbox-assign"]');
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    const picker = page.locator('[data-testid="technician-assign-picker"]');
    await expect(picker).toBeVisible({ timeout: 15_000 });

    const firstTechOption = page.locator('[data-testid^="technician-assign-option-"]').first();
    await expect(firstTechOption).toBeVisible({ timeout: 10_000 });
    await firstTechOption.click();

    const confirm = page.locator('[data-testid="technician-assign-confirm"]');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(picker).toBeHidden({ timeout: 20_000 });
  });
});
