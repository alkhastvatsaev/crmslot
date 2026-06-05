import { test, expect } from "@playwright/test";
import { openBackofficeReportsTab } from "./helpers/backofficeInbox";

/** Routes protégées : jamais 200 sans auth. */
function expectProtectedStatus(status: number) {
  expect([401, 403, 503]).toContain(status);
}

const manualInterventionId = process.env.E2E_DONE_INTERVENTION_ID?.trim() || "";
const skipAutoSeed = process.env.E2E_SKIP_SEED === "true";

test.describe("Invoice validation (IVANA)", () => {
  test.describe("API", () => {
    test("POST validate-report requires authentication", async ({ request }) => {
      const res = await request.post("/api/interventions/e2e-fixture/validate-report", {
        data: { sendEmail: false },
      });
      expectProtectedStatus(res.status());
    });

    test("POST prepare-draft-billing requires authentication", async ({ request }) => {
      const res = await request.post("/api/interventions/e2e-fixture/prepare-draft-billing");
      expectProtectedStatus(res.status());
    });

    test("POST send-client-invoice requires authentication", async ({ request }) => {
      const res = await request.post("/api/interventions/e2e-fixture/send-client-invoice");
      expectProtectedStatus(res.status());
    });

  });

  test.describe("UI smoke", () => {
    test("back-office reports tab is reachable", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
        timeout: 60_000,
      });
      await openBackofficeReportsTab(page);

      const empty = page.getByText(/aucun rapport|no reports|geen rapporten/i);
      const reportRow = page.locator('[data-testid^="backoffice-inbox-report-row-"]');
      const bridged = page.locator('[data-testid="backoffice-bridged-report"]');

      await expect(empty.or(reportRow.first()).or(bridged.first())).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  test.describe("Full validation (serveur réel)", () => {
    test.skip(
      skipAutoSeed && !manualInterventionId,
      "Seed auto (dev) ou définir E2E_DONE_INTERVENTION_ID / E2E_SKIP_SEED=true avec id manuel.",
    );

    let interventionId = manualInterventionId;

    test.beforeAll(async ({ request }) => {
      if (!skipAutoSeed && !manualInterventionId) {
        const seedRes = await request.post("/api/e2e/seed-done-intervention");
        const seedBody = (await seedRes.json()) as {
          ok?: boolean;
          interventionId?: string;
          error?: string;
        };
        if (!seedRes.ok()) {
          test.skip(true, `Seed indisponible (${seedRes.status()}): ${seedBody.error ?? "voir Firebase Admin en dev"}`);
        }
        expect(seedBody.ok, seedBody.error).toBe(true);
        interventionId = seedBody.interventionId ?? interventionId;
      }
      expect(interventionId.length).toBeGreaterThan(0);
    });

    test("IVANA validate report → PDF + statut invoiced (API réelle)", async ({ page }) => {
      const ivId = interventionId;
      const validateResponse = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/interventions/${encodeURIComponent(ivId)}/validate-report`) &&
          res.request().method() === "POST",
        { timeout: 90_000 },
      );

      await page.goto("/");
      await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
        timeout: 60_000,
      });

      await openBackofficeReportsTab(page);

      const row = page.locator(`[data-testid="backoffice-inbox-report-row-${ivId}"]`);
      await expect(row).toBeVisible({ timeout: 45_000 });
      await row.click();

      const verifyBtn = page.locator('[data-testid="backoffice-inbox-verify-report"]');
      await expect(verifyBtn).toBeEnabled({ timeout: 15_000 });
      await verifyBtn.click();

      const res = await validateResponse;
      expect(res.ok(), `validate-report HTTP ${res.status()}`).toBeTruthy();
      const body = (await res.json()) as {
        ok?: boolean;
        invoicePdfUrl?: string;
        invoiceAmountCents?: number;
        error?: string;
      };
      expect(body.ok, body.error).toBe(true);
      expect(body.invoicePdfUrl?.trim().length).toBeGreaterThan(0);
      expect(typeof body.invoiceAmountCents).toBe("number");
      expect((body.invoiceAmountCents ?? 0) > 0).toBe(true);

      await expect(
        page.getByText(/rapport validé|report verified|rapport vérifié/i),
      ).toBeVisible({ timeout: 25_000 });

      await expect(page.locator(`[data-testid="backoffice-inbox-report-row-${ivId}"]`)).toHaveCount(
        0,
        { timeout: 45_000 },
      );
    });
  });
});
