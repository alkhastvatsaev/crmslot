import { test, expect } from "@playwright/test";
import {
  TECHNICIAN_APP_ROUTE,
  expectTechnicianAppOrLoginGate,
  expectTechnicianManifestLink,
  gotoTechnicianAppOrSkip,
} from "./helpers/satelliteMobileApps";

test.describe("App terrain /m/technician (infra)", () => {
  test("charge la route avec shell ou écran de connexion", async ({ page }) => {
    await page.goto(TECHNICIAN_APP_ROUTE);
    await expectTechnicianAppOrLoginGate(page);
  });

  test("référence manifest-technician.json dans le HTML", async ({ page }) => {
    await page.goto(TECHNICIAN_APP_ROUTE);
    await expectTechnicianManifestLink(page);
  });

  test("deep link notification reste sur /m/technician", async ({ page }) => {
    await page.goto(`${TECHNICIAN_APP_ROUTE}?bmTechCase=iv-test-123`);

    await expect(page).toHaveURL(/\/m\/technician/);
    await expect(page).toHaveURL(/\/m\/technician(\?|$)/, { timeout: 15_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toMatch(/bmTechCase=/);
  });
});

test.describe("App terrain /m/technician (UX — session requise)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoTechnicianAppOrSkip(page);
  });

  test("shell complète avec calendrier footer et top bar", async ({ page }) => {
    await expect(page.getByTestId("technician-mobile-footer-calendar")).toBeVisible();
    await expect(page.getByTestId("technician-mobile-shell-footer")).toBeVisible();
    await expect(page.getByTestId("mobile-top-bar")).toBeVisible();
  });
});
