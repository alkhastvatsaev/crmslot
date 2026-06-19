/* eslint-disable no-console */
import * as fs from "node:fs";
import * as path from "node:path";
import { launchLecotBrowser } from "../../src/features/catalog/lecotPlaywrightBrowser";
import {
  lecotShopCredentials,
  lecotShopLoginUrl,
} from "../../src/features/catalog/lecotShopConfig";

function loadDotEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadDotEnv(path.join(process.cwd(), ".env.local"));
  const creds = lecotShopCredentials();
  console.log("creds present:", Boolean(creds?.email && creds.password));
  const browser = await launchLecotBrowser();
  if (!browser) return;
  const page = await browser.newPage();
  await page.goto(lecotShopLoginUrl(), { waitUntil: "domcontentloaded", timeout: 20_000 });

  const cookieBtn = page
    .locator(
      "button#btn-cookie-allow, .cookie-allow, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"
    )
    .first();
  if (await cookieBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await cookieBtn.click().catch(() => null);
    console.log("cookie clicked");
  }

  const emailInput = page
    .locator("input#email, input[name='login[username]'], input[type='email']")
    .first();
  const emailVisible = await emailInput.isVisible({ timeout: 6_000 }).catch(() => false);
  console.log("email visible:", emailVisible);

  if (emailVisible && creds) {
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
  }

  const err = await page
    .locator(".message-error, .mage-error, .field-error")
    .first()
    .textContent()
    .catch(() => null);
  console.log("error msg:", err?.trim() || "(none)");
  console.log("final url:", page.url());
  await browser.close();
}

void main();
