import { test, expect } from "@playwright/test";
import {
  CLIENT_APP_ROUTE,
  ensureClientShell,
  expectClientManifestLink,
} from "./helpers/satelliteMobileApps";

test.describe("Portail client /m/demande (infra)", () => {
  test("charge la shell client sur viewport mobile", async ({ page }) => {
    await page.goto(CLIENT_APP_ROUTE);

    await expect(page).toHaveTitle(/demande|crmslot/i);
    await ensureClientShell(page);
  });

  test("référence manifest-demande.json dans le HTML", async ({ page }) => {
    await page.goto(CLIENT_APP_ROUTE);
    await expectClientManifestLink(page);
  });
});

test.describe("Portail client /m/demande (UX)", () => {
  test("chrome shell complet (guest autorisé)", async ({ page }) => {
    await page.goto(CLIENT_APP_ROUTE);
    await ensureClientShell(page);

    await expect(page.getByTestId("client-mobile-top-bar")).toBeVisible();
    await expect(page.getByTestId("client-mobile-footer-calendar")).toBeVisible();
    await expect(page.getByTestId("client-mobile-profile-chip")).toBeVisible();
    await expect(page.getByTestId("client-mobile-page-0")).toBeVisible();
  });
});
