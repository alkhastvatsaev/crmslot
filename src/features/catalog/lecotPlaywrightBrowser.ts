import { logger } from "@/core/logger";
import { lecotShopCredentials, lecotShopLoginUrl } from "@/features/catalog/lecotShopConfig";

export async function launchLecotBrowser() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (err) {
    logger.warn(
      "[lecot/playwright] navigateur indisponible — utilisez le catalogue local ou `npx playwright install`.",
      { error: err instanceof Error ? err.message : String(err) }
    );
    return null;
  }
}

export async function loginLecotShop(page: import("playwright").Page): Promise<boolean> {
  const creds = lecotShopCredentials();
  if (!creds) return false;

  try {
    await page.goto(lecotShopLoginUrl(), { waitUntil: "domcontentloaded", timeout: 15_000 });

    const cookieBtn = page
      .locator(
        "button#btn-cookie-allow, .cookie-allow, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
      )
      .first();
    if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => null);
    }

    const emailInput = page
      .locator("input#email, input[name='login[username]'], input[type='email']")
      .first();
    if (!(await emailInput.isVisible({ timeout: 6_000 }).catch(() => false))) return false;

    await emailInput.fill(creds.email);
    await page
      .locator("input#pass, input[name='login[password]'], input[type='password']")
      .first()
      .fill(creds.password);
    await page
      .locator("button#send2, .form-login button[type='submit'], button.login")
      .first()
      .click();

    await page.waitForLoadState("domcontentloaded", { timeout: 12_000 }).catch(() => null);
    return !page.url().includes("/login");
  } catch {
    return false;
  }
}
