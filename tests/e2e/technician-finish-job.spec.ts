import { test, expect } from "@playwright/test";

const FINISH_JOB_MIN_PHOTOS = 3;
const DEFAULT_ASSIGNED_INTERVENTION_ID = "e2e-technician-finish";
const manualInterventionId = process.env.E2E_ASSIGNED_INTERVENTION_ID?.trim() || "";
const skipAutoSeed = process.env.E2E_SKIP_SEED === "true";

async function seedAssignedIntervention(request: import("@playwright/test").APIRequestContext) {
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
  return seedBody.interventionId ?? DEFAULT_ASSIGNED_INTERVENTION_ID;
}

test.use({ permissions: ["camera"] });

test.describe("Technician finish job", () => {
  test.skip(
    skipAutoSeed && !manualInterventionId,
    "Seed auto (dev) ou définir E2E_ASSIGNED_INTERVENTION_ID / E2E_SKIP_SEED=true avec id manuel."
  );

  test("assigned mission → photos → signature → clôture", async ({ page, request }) => {
    const interventionId =
      manualInterventionId || (skipAutoSeed ? "" : await seedAssignedIntervention(request));
    expect(interventionId.length).toBeGreaterThan(0);

    await page.addInitScript(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#4488ff";
        ctx.fillRect(0, 0, 320, 240);
      }
      const stream = canvas.captureStream(30);
      navigator.mediaDevices.getUserMedia = async () => stream;
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
      timeout: 60_000,
    });

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2"]')).toBeVisible({
      timeout: 30_000,
    });

    const leftPanel = page.locator('[data-testid="dashboard-pager-slot-2-panel-left"]');
    const missionCard = leftPanel.locator(`[data-testid="daily-mission-${interventionId}"]`);
    await expect(missionCard).toBeVisible({ timeout: 45_000 });
    await missionCard.click();

    await expect(page.locator('[data-testid="technician-dashboard-detail"]')).toBeVisible({
      timeout: 15_000,
    });

    const finishBtn = page.locator('[data-testid="mission-action-primary-finish"]');
    await expect(finishBtn).toBeVisible({ timeout: 10_000 });
    await finishBtn.click();

    await expect(page.locator('[data-testid="finish-job-panel"]')).toBeVisible({ timeout: 15_000 });

    const captureBtn = page.locator('[data-testid="finish-job-capture-btn"]');
    await expect(captureBtn).toBeEnabled({ timeout: 15_000 });
    for (let i = 0; i < FINISH_JOB_MIN_PHOTOS; i += 1) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }
    const continuePhotos = page.locator('[data-testid="finish-job-continue-photos"]');
    await expect(continuePhotos).toBeEnabled({ timeout: 15_000 });
    await continuePhotos.click();
    await expect(page.locator('[data-testid="finish-job-step-signature"]')).toBeVisible({
      timeout: 10_000,
    });

    const signatureCanvas = page.locator('[data-testid="technician-signature-pad"] canvas');
    await expect(signatureCanvas).toBeVisible({ timeout: 10_000 });
    const box = await signatureCanvas.boundingBox();
    expect(box).toBeTruthy();
    await signatureCanvas.dispatchEvent("pointerdown", {
      clientX: box!.x + 24,
      clientY: box!.y + 24,
      pointerId: 1,
      buttons: 1,
    });
    await signatureCanvas.dispatchEvent("pointermove", {
      clientX: box!.x + box!.width - 24,
      clientY: box!.y + box!.height - 24,
      pointerId: 1,
      buttons: 1,
    });
    await signatureCanvas.dispatchEvent("pointerup", {
      clientX: box!.x + box!.width - 24,
      clientY: box!.y + box!.height - 24,
      pointerId: 1,
      buttons: 0,
    });

    const submitBtn = page.locator('[data-testid="finish-job-submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();

    await expect(page.locator('[data-testid="finish-job-panel"]')).toBeHidden({
      timeout: 30_000,
    });
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /rapport transmis|report sent/i })
        .first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
