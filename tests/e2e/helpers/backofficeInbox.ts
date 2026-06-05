import { expect, type Page } from "@playwright/test";

/** Carte carte — panneau IVANA visible (rail droit). */
export async function expectBackofficeInboxVisible(page: Page): Promise<void> {
  const inbox = page.locator('[data-testid="backoffice-inbox-panel"]');
  await expect(inbox).toBeVisible({ timeout: 60_000 });
}

/** Onglet Rapports (validation facture terrain). */
export async function openBackofficeReportsTab(page: Page): Promise<void> {
  await expectBackofficeInboxVisible(page);
  const reportsTab = page.locator('[data-testid="backoffice-inbox-tab-reports"]');
  await expect(reportsTab).toBeVisible({ timeout: 15_000 });
  await reportsTab.click();
}
