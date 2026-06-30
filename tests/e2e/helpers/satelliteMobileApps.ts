import { expect, test, type Page } from "@playwright/test";

export const TECHNICIAN_APP_ROUTE = "/m/technician";
export const CLIENT_APP_ROUTE = "/m/demande";

async function waitForTechnicianReady(page: Page): Promise<"app" | "login"> {
  let state: "app" | "login" | null = null;

  await expect
    .poll(
      async () => {
        if (
          await page
            .getByTestId("technician-mobile-app")
            .isVisible()
            .catch(() => false)
        ) {
          state = "app";
          return true;
        }
        if (
          await page
            .getByRole("heading", { name: /espace technicien/i })
            .isVisible()
            .catch(() => false)
        ) {
          state = "login";
          return true;
        }
        return false;
      },
      { timeout: 60_000 }
    )
    .toBe(true);

  return state!;
}

export async function skipIfTechnicianLoginGate(page: Page): Promise<boolean> {
  const state = await waitForTechnicianReady(page);
  if (state === "login") {
    test.skip(true, "Session technicien requise — codegen storage state ou connexion manuelle.");
    return true;
  }
  return false;
}

export async function ensureTechnicianShell(page: Page): Promise<void> {
  await expect(page.getByTestId("technician-mobile-app")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("technician-mobile-shell-footer")).toBeVisible();
}

/** Infra CI : shell monté ou portail connexion technicien. */
export async function expectTechnicianAppOrLoginGate(page: Page): Promise<void> {
  await expect(page).toHaveTitle(/crmslot/i);
  const state = await waitForTechnicianReady(page);
  expect(state === "app" || state === "login").toBe(true);
}

/** UX terrain : skip si login gate, sinon attend la shell. */
export async function gotoTechnicianAppOrSkip(
  page: Page,
  path = TECHNICIAN_APP_ROUTE
): Promise<boolean> {
  await page.goto(path);
  if (await skipIfTechnicianLoginGate(page)) return false;
  await ensureTechnicianShell(page);
  return true;
}

export async function ensureClientShell(page: Page): Promise<void> {
  await expect(page.getByTestId("client-mobile-app")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("client-mobile-shell-footer")).toBeVisible();
}

export async function expectClientManifestLink(page: Page): Promise<void> {
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toContain("/manifest-demande.json");
}

export async function expectTechnicianManifestLink(page: Page): Promise<void> {
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toContain("/manifest-technician.json");
}
