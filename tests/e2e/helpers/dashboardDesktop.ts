import { expect, test, type Page } from "@playwright/test";

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/** 9 pages admin — aligné `dashboardCarouselRegistry.ts` / `page.tsx`. */
export const DESKTOP_HUB_SLOTS = [
  { slot: 0, label: "Carte" },
  { slot: 1, label: "Matériel" },
  { slot: 2, label: "CRM History" },
  { slot: 3, label: "Facturation" },
  { slot: 4, label: "Gmail" },
  { slot: 5, label: "Équipe" },
  { slot: 6, label: "Dossiers" },
  { slot: 7, label: "Commissions" },
  { slot: 8, label: "Planning" },
] as const;

export async function skipIfStaffLoginGate(page: Page): Promise<boolean> {
  const loginGate = page.getByRole("heading", { name: /espace administrateur/i });
  if (await loginGate.isVisible({ timeout: 8_000 }).catch(() => false)) {
    test.skip(true, "Session staff requise — connectez-vous avant le run E2E desktop.");
    return true;
  }
  return false;
}

/** Shell desktop (pas mobile) + pager monté. */
export async function ensureDesktopShell(page: Page): Promise<void> {
  await expect(page.getByTestId("dashboard-desktop-stack")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("dashboard-global-header")).toBeVisible();
  await expect(page.getByTestId("dashboard-pager-root")).toBeVisible();
  await expect(page.getByTestId("mobile-shell")).toHaveCount(0);
}

export async function openDesktopHub(page: Page, slotIndex: number): Promise<void> {
  await page.goto(`/?initialPageIndex=${slotIndex}`);
  await skipIfStaffLoginGate(page);
  await ensureDesktopShell(page);
  await expect(page.getByTestId(`dashboard-page-${slotIndex}`)).toBeVisible({ timeout: 30_000 });
}

/** Grille 3 colonnes hub (slots 1–8) ou carte (slot 0). */
export async function expectDesktopTripleRail(page: Page, slotIndex: number): Promise<void> {
  if (slotIndex === 0) {
    await expect(page.locator("#map-container")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(".dashboard-desktop-grid").first()).toBeVisible();
    await expect(page.getByTestId("backoffice-inbox-panel")).toBeVisible({ timeout: 60_000 });
    return;
  }

  const root = page.getByTestId(`dashboard-pager-slot-${slotIndex}`);
  await expect(root).toBeVisible({ timeout: 30_000 });
  await expect(root.locator(".dashboard-desktop-grid").first()).toBeVisible();

  for (const rail of ["left", "center", "right"] as const) {
    await expect(page.getByTestId(`dashboard-pager-slot-${slotIndex}-panel-${rail}`)).toBeVisible();
  }
}

export async function openDesktopPageSelector(page: Page): Promise<void> {
  await page.getByTestId("clock-calendar-toggle").click();
  await expect(page.getByTestId("dashboard-page-selector")).toBeVisible({ timeout: 15_000 });
}

export async function navigateDesktopHubViaSelector(page: Page, slotIndex: number): Promise<void> {
  await openDesktopPageSelector(page);
  await page.getByTestId(`dashboard-page-selector-item-${slotIndex}`).click();
  await expect(page.getByTestId("dashboard-page-selector")).toHaveCount(0);
  await expect(page.getByTestId(`dashboard-page-${slotIndex}`)).toBeVisible({ timeout: 20_000 });
}
