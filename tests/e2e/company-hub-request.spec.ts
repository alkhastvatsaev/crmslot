import { test, expect } from "@playwright/test";

/**
 * Smoke formulaire demande client (hub société) — sans assignation back-office.
 * Le parcours complet dispatch → assign est couvert par critical-path-dispatch.spec.ts.
 */
test.describe("Company hub request form", () => {
  test("submits a client intervention request from company hub", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-1"]').click();
    await expect(page.locator('[data-testid="requester-intervention-panel"]')).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('[data-testid="requester-type-particulier"]').click();
    const profilePanel = page.locator('[data-testid="requester-profile-panel"]');
    await profilePanel.locator('input[type="text"]').nth(0).fill("Marie");
    await profilePanel.locator('input[type="text"]').nth(1).fill("Martin");
    await profilePanel.locator('input[type="tel"]').fill("0470987654");

    const interventionPanel = page.locator('[data-testid="requester-intervention-panel"]');
    await interventionPanel.locator("button").nth(0).click();
    await interventionPanel.locator("textarea").fill("Serrure cassée — porte d'entrée bloquée.");

    const nextBtn = page.locator(
      'button[aria-label="Étape suivante"], button[aria-label="Volgende stap"], button[aria-label="Next step"]'
    );
    await nextBtn.click();

    const fileInput = interventionPanel.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10_000 });
    await fileInput.setInputFiles({
      name: "company-hub-smoke.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    });
    await page.waitForTimeout(800);
    await nextBtn.click();

    await page.waitForTimeout(800);
    const timeSlot = page
      .locator("button")
      .filter({ hasText: /([0-1]?[0-9]|2[0-3]):[0-5][0-9]/ })
      .first();
    await expect(timeSlot).toBeVisible({ timeout: 10_000 });
    await timeSlot.click();

    await page.waitForTimeout(800);
    const addressInput = interventionPanel.locator('[data-testid="smart-form-address"]');
    await expect(addressInput).toBeVisible({ timeout: 5000 });
    await addressInput.fill("Avenue Louise 100, Bruxelles");
    await page.keyboard.press("Escape");

    const submitBtn = interventionPanel
      .locator("button")
      .filter({ hasText: /Envoyer la demande|Verzoek indienen|Submit request/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();

    await expect(page.locator("text=/enregistrée|opgeslagen|saved/i")).toBeVisible({
      timeout: 15_000,
    });
  });
});
