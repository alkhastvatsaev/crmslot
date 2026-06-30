import { expect, test, type Locator, type Page } from "@playwright/test";
import { skipIfStaffLoginGate } from "./dashboardDesktop";

export const MOBILE_FORCE_URL = "/?forceMobile=1";

/** Shell admin PWA monté — échoue si login gate (utiliser skipIfStaffLoginGate avant). */
export async function ensureMobileShell(page: Page): Promise<void> {
  await expect(page.getByTestId("mobile-shell")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("dashboard-global-header")).toHaveCount(0);
}

/** Prépare `/` mobile : skip si login, sinon attend le shell. */
export async function gotoMobileShellOrSkip(page: Page, url = MOBILE_FORCE_URL): Promise<boolean> {
  await page.goto(url);
  if (await skipIfStaffLoginGate(page)) return false;
  await ensureMobileShell(page);
  return true;
}

/** Swipe horizontal simulé — aligné sur `usePanelSwipe` (seuil ~36 px). */
export async function dispatchHorizontalSwipe(
  locator: Locator,
  direction: "left" | "right",
  clientY?: number
): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Swipe target has no bounding box");

  const y = clientY ?? box.y + box.height / 2;
  const startX = direction === "left" ? box.x + box.width * 0.8 : box.x + box.width * 0.2;
  const endX = direction === "left" ? box.x + box.width * 0.2 : box.x + box.width * 0.8;

  await locator.dispatchEvent("pointerdown", {
    clientX: startX,
    clientY: y,
    pointerId: 1,
    pointerType: "touch",
  });
  await locator.dispatchEvent("pointermove", {
    clientX: endX,
    clientY: y,
    pointerId: 1,
    pointerType: "touch",
  });
}

export async function expectActiveHubRail(
  root: Locator,
  rail: "left" | "center" | "right"
): Promise<void> {
  await expect(root.locator('[data-mobile-hub-rail-active="true"]')).toHaveAttribute(
    "data-mobile-hub-rail",
    rail
  );
}
