import { test, expect } from "@playwright/test";
import {
  MOBILE_FORCE_URL,
  dispatchHorizontalSwipe,
  expectActiveHubRail,
  gotoMobileShellOrSkip,
} from "./helpers/mobileShell";

type PwaManifest = {
  name?: string;
  short_name?: string;
  display?: string;
  start_url?: string;
  id?: string;
};

const PWA_MANIFESTS: { path: string; start_url: string; id: string; short_name: string }[] = [
  { path: "/manifest.json", start_url: "/", id: "/", short_name: "Admin" },
  {
    path: "/manifest-demande.json",
    start_url: "/m/demande",
    id: "/m/demande",
    short_name: "Demande",
  },
  {
    path: "/manifest-admin-mobile.json",
    start_url: "/m/admin",
    id: "/m/admin",
    short_name: "Inbox",
  },
  {
    path: "/manifest-technician.json",
    start_url: "/m/technician",
    id: "/m/technician",
    short_name: "Terrain",
  },
];

test.describe("Mobile shell (infra)", () => {
  test("?forceMobile=1 — shell mobile ou écran de connexion", async ({ page }) => {
    await page.goto(MOBILE_FORCE_URL);
    await expect(page).toHaveTitle(/crmslot/i);

    const sawMobile = await page
      .getByTestId("mobile-shell")
      .isVisible({ timeout: 60_000 })
      .catch(() => false);
    const sawLogin = await page
      .getByRole("heading", { name: /espace administrateur/i })
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    expect(sawMobile || sawLogin).toBe(true);
    if (sawMobile) {
      await expect(page.getByTestId("dashboard-global-header")).toHaveCount(0);
    }
  });

  test("viewport mobile — shell ou écran de connexion", async ({ page }) => {
    await page.goto("/");

    const sawMobile = await page
      .getByTestId("mobile-shell")
      .isVisible({ timeout: 60_000 })
      .catch(() => false);
    const sawLogin = await page
      .getByRole("heading", { name: /espace administrateur/i })
      .isVisible({ timeout: 8_000 })
      .catch(() => false);

    expect(sawMobile || sawLogin).toBe(true);
  });

  for (const manifest of PWA_MANIFESTS) {
    test(`manifest PWA ${manifest.short_name} accessible`, async ({ request }) => {
      const res = await request.get(manifest.path);
      expect(res.ok()).toBeTruthy();
      const json = (await res.json()) as PwaManifest;
      expect(json.name).toMatch(/crmslot/i);
      expect(json.display).toBe("standalone");
      expect(json.start_url).toBe(manifest.start_url);
      expect(json.id).toBe(manifest.id);
      expect(json.short_name).toBe(manifest.short_name);
    });
  }

  test("routes satellites référencent leur manifest dans le HTML", async ({ page }) => {
    const cases: { route: string; manifestPath: string }[] = [
      { route: "/", manifestPath: "/manifest.json" },
      { route: "/m/demande", manifestPath: "/manifest-demande.json" },
      { route: "/m/technician", manifestPath: "/manifest-technician.json" },
    ];

    for (const { route, manifestPath } of cases) {
      await page.goto(route);
      const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
      expect(manifestHref, route).toContain(manifestPath);
    }
  });

  test("/m/admin redirige vers / (app CRM unique)", async ({ page }) => {
    await page.goto("/m/admin");
    await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 15_000 });
  });
});

/**
 * UX admin mobile — nécessite une session staff.
 * Local : `PLAYWRIGHT_ADMIN_STORAGE_STATE=tests/e2e/.auth/admin.json npm run test:e2e:mobile-shell`
 * Sans session : tests skippés (voir skipIfStaffLoginGate).
 */
test.describe("Mobile shell (UX — session requise)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMobileShellOrSkip(page);
  });

  test("sélecteur de pages s'ouvre et se ferme via le calendrier footer", async ({ page }) => {
    const toggle = page.getByTestId("clock-calendar-toggle");
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    await toggle.click();
    await expect(page.getByTestId("dashboard-page-selector")).toBeVisible();
    await expect(page.getByTestId("mobile-shell")).toHaveAttribute(
      "data-page-selector-open",
      "true"
    );

    await toggle.click();
    await expect(page.getByTestId("dashboard-page-selector")).not.toBeVisible();
    await expect(page.getByTestId("mobile-shell")).not.toHaveAttribute(
      "data-page-selector-open",
      "true"
    );
  });

  test("sélecteur navigue vers un hub puis se ferme", async ({ page }) => {
    await page.getByTestId("clock-calendar-toggle").click({ timeout: 30_000 });
    await page.getByTestId("dashboard-page-selector-item-1").click();

    await expect(page.getByTestId("mobile-page-1")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("dashboard-page-selector")).not.toBeVisible();
  });

  test("panneau compte s'ouvre au clic profil", async ({ page }) => {
    await page.getByTestId("admin-mobile-profile-chip").click();
    await expect(page.getByTestId("dashboard-account-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mobile-page-0")).toHaveAttribute("aria-hidden", "true");
  });

  test("swipe hub carte change le rail actif", async ({ page }) => {
    const mapHub = page.getByTestId("mobile-map-triple");
    await expect(mapHub).toBeVisible({ timeout: 60_000 });

    await expectActiveHubRail(mapHub, "right");
    await dispatchHorizontalSwipe(mapHub, "left");
    await expectActiveHubRail(mapHub, "center");
  });
});
