import { test } from "@playwright/test";
import {
  DESKTOP_VIEWPORT,
  ensureDesktopShell,
  expectDesktopTripleRail,
  openDesktopHub,
  skipIfStaffLoginGate,
} from "./helpers/dashboardDesktop";

test.describe("Dashboard carousel (desktop)", () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await skipIfStaffLoginGate(page);
    await ensureDesktopShell(page);
  });

  test("navigue facturation · Gmail · équipe via initialPageIndex", async ({ page }) => {
    for (const slot of [3, 4, 5] as const) {
      await openDesktopHub(page, slot);
      await expectDesktopTripleRail(page, slot);
    }
  });

  test("atteint le hub Matériel (slot 1)", async ({ page }) => {
    await openDesktopHub(page, 1);
    await expectDesktopTripleRail(page, 1);
  });

  test("atteint Gmail (slot 4)", async ({ page }) => {
    await openDesktopHub(page, 4);
    await expectDesktopTripleRail(page, 4);
    await page.getByTestId("gmail-hub-panel-center").waitFor({ state: "visible", timeout: 30_000 });
  });
});
