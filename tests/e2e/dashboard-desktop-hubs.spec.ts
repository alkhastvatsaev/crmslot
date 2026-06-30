import { test, expect } from "@playwright/test";
import {
  DESKTOP_HUB_SLOTS,
  DESKTOP_VIEWPORT,
  ensureDesktopShell,
  expectDesktopTripleRail,
  navigateDesktopHubViaSelector,
  openDesktopHub,
  skipIfStaffLoginGate,
} from "./helpers/dashboardDesktop";

/**
 * E2E desktop 1440px — non-régression layout 3 colonnes sur les 9 hubs admin.
 *
 * Sans session : smoke (pas de mobile-shell sur viewport bureau).
 * Avec session : `PLAYWRIGHT_ADMIN_STORAGE_STATE=tests/e2e/.auth/admin.json npm run test:e2e:desktop`
 *   (générer via `npx playwright codegen --save-storage=tests/e2e/.auth/admin.json` après login).
 *
 * Checklist QA manuelle (même ordre) :
 * 0 Carte — carte + inbox droite + Galaxy dock
 * 1 Matériel — agent gauche, stock centre (logo Lecot), commandes droite
 * 2 CRM — agent, fil centre, détail droite
 * 3 Facturation — agent, liste, documents PDF
 * 4 Gmail — labels, liste, lecture
 * 5 Équipe — ajout, grille staff, fiche droite
 * 6 Dossiers — situation, liste, actions
 * 7 Commissions — encaisser, distribuer, régler
 * 8 Planning — calendrier, détail mission, assignation
 * + Overlays : profil (centre) · sélecteur pages (droite)
 */
test.describe("Dashboard desktop — smoke sans session @ 1440px", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test("viewport bureau — pas de mobile-shell (login ou dashboard)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("mobile-shell")).toHaveCount(0);
    const onDashboard = await page
      .getByTestId("dashboard-desktop-stack")
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const onLogin = await page
      .getByRole("heading", { name: /espace administrateur/i })
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(onDashboard || onLogin).toBe(true);
  });

  test("?forceMobile=1 non utilisé — reste sur shell desktop si session active", async ({
    page,
  }) => {
    await page.goto("/");
    if (await skipIfStaffLoginGate(page)) return;
    await expect(page.getByTestId("mobile-shell")).toHaveCount(0);
    await expect(page.getByTestId("dashboard-desktop-stack")).toBeVisible();
  });
});

test.describe("Dashboard desktop hubs @ 1440px (session staff)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await skipIfStaffLoginGate(page);
    await ensureDesktopShell(page);
  });

  test("shell desktop : header, pager, galaxy", async ({ page }) => {
    await expect(page.getByTestId("dashboard-galaxy-dock")).toBeVisible();
    await expect(page.getByTestId("spotlight-trigger")).toBeVisible();
    await expect(page.getByTestId("dashboard-page-home")).toBeVisible();
  });

  for (const hub of DESKTOP_HUB_SLOTS) {
    test(`hub ${hub.slot} (${hub.label}) — grille 3 rails desktop`, async ({ page }) => {
      await openDesktopHub(page, hub.slot);
      await expectDesktopTripleRail(page, hub.slot);
    });
  }

  test("hub 1 Matériel — logo Lecot visible au centre", async ({ page }) => {
    await openDesktopHub(page, 1);
    const lecotLogo = page.getByTestId("company-stock-lecot-logo");
    const center = page.getByTestId("company-stock-center");
    const pro = page.getByTestId("company-stock-pro-workspace");
    const loading = page.getByTestId("company-stock-loading");
    await expect(center.or(pro).or(loading)).toBeVisible({ timeout: 30_000 });
    if (await center.isVisible().catch(() => false)) {
      await expect(lecotLogo).toBeVisible();
    }
  });

  test("navigation sélecteur desktop — Matériel puis Facturation", async ({ page }) => {
    await navigateDesktopHubViaSelector(page, 1);
    await expectDesktopTripleRail(page, 1);

    await navigateDesktopHubViaSelector(page, 3);
    await expectDesktopTripleRail(page, 3);
    await expect(page.getByTestId("billing-hub-documents-rail")).toBeVisible({ timeout: 30_000 });
  });

  test("overlay compte desktop — panneau centre", async ({ page }) => {
    await page.getByTestId("admin-mobile-profile-chip").click();
    const host = page.getByTestId("dashboard-account-panel-host");
    await expect(host).toBeVisible();
    await expect(host).toHaveClass(/dashboard-desktop-col--center/);
    await expect(page.getByTestId("dashboard-account-panel")).toBeVisible();
    await expect(page.getByTestId("dashboard-page-selector")).toHaveCount(0);
  });
});
