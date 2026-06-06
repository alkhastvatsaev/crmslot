import { test, expect } from "@playwright/test";

const DEFAULT_ASSIGNED_INTERVENTION_ID = "e2e-technician-finish";
const manualInterventionId = process.env.E2E_ASSIGNED_INTERVENTION_ID?.trim() || "";
const skipAutoSeed = process.env.E2E_SKIP_SEED === "true";

test.describe("Technician finish job", () => {
  test.skip(
    skipAutoSeed && !manualInterventionId,
    "Seed auto (dev) ou définir E2E_ASSIGNED_INTERVENTION_ID / E2E_SKIP_SEED=true avec id manuel."
  );

  let interventionId = manualInterventionId || DEFAULT_ASSIGNED_INTERVENTION_ID;

  test.beforeAll(async ({ request }) => {
    if (!skipAutoSeed && !manualInterventionId) {
      const seedRes = await request.post("/api/e2e/seed-assigned-intervention");
      const seedBody = (await seedRes.json()) as {
        ok?: boolean;
        interventionId?: string;
        error?: string;
      };
      if (!seedRes.ok()) {
        test.skip(
          true,
          `Seed indisponible (${seedRes.status()}): ${seedBody.error ?? "voir Firebase Admin en dev"}`
        );
      }
      expect(seedBody.ok, seedBody.error).toBe(true);
      interventionId = seedBody.interventionId ?? interventionId;
    }
    expect(interventionId.length).toBeGreaterThan(0);
  });

  test("assigned mission → photos → signature → clôture", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
      timeout: 60_000,
    });

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2"]')).toBeVisible({
      timeout: 30_000,
    });

    const missionRow = page.locator(`[data-testid="technician-case-${interventionId}"]`);
    await expect(missionRow).toBeVisible({ timeout: 45_000 });
    await missionRow.click();

    await expect(page.locator('[data-testid="technician-dashboard-detail"]')).toBeVisible({
      timeout: 15_000,
    });

    const finishBtn = page.locator('[data-testid="mission-action-primary-finish"]');
    await expect(finishBtn).toBeVisible({ timeout: 10_000 });
    await finishBtn.click();

    await expect(page.locator('[data-testid="finish-job-panel"]')).toBeVisible({ timeout: 15_000 });

    const fileInput = page.locator('[data-testid="finish-job-step-photos"] input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: "finish-smoke.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64"
        ),
      });
    } else {
      await page.locator('[data-testid="finish-job-capture-btn"]').click();
    }

    await page.waitForTimeout(500);
    await page.locator('[data-testid="finish-job-continue-photos"]').click();
    await expect(page.locator('[data-testid="finish-job-step-signature"]')).toBeVisible({
      timeout: 10_000,
    });

    const signatureCanvas = page.locator('[data-testid="finish-job-step-signature"] canvas');
    if (await signatureCanvas.count()) {
      const box = await signatureCanvas.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + 20, box.y + 20);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20);
        await page.mouse.up();
      }
    }

    const submitBtn = page.locator('[data-testid="finish-job-submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();

    await expect(
      page
        .locator('[data-testid="technician-detail-done-badge"]')
        .or(page.locator("text=/terminée|afgerond|completed/i"))
    ).toBeVisible({ timeout: 30_000 });
  });
});
