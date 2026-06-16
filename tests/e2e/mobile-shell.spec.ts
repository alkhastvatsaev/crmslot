import { test, expect } from "@playwright/test";

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
    path: "/manifest-technician.json",
    start_url: "/m/technician",
    id: "/m/technician",
    short_name: "Terrain",
  },
];

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

  test("chaque route satellite référence son manifest dans le HTML", async ({ page }) => {
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
});
