import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import {
  lecotShopCatalogSearchUrl,
  lecotShopCheckoutUrl,
  lecotShopCredentials,
  lecotShopLoginUrl,
} from "@/features/catalog/lecotShopConfig";

export type LecotGuestInfo = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  vatNumber?: string | null;
};

export type LecotPlaywrightResult =
  | { ok: true; source: "playwright"; orderId?: string }
  | { ok: false; source: "playwright"; error: string };


async function launchBrowser() {
  try {
    const { chromium } = await import("playwright");
    return chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch {
    return null;
  }
}

async function loginToLecot(page: import("playwright").Page): Promise<boolean> {
  const creds = lecotShopCredentials();
  if (!creds) return false;

  try {
    await page.goto(lecotShopLoginUrl(), { waitUntil: "domcontentloaded", timeout: 15_000 });

    const cookieBtn = page
      .locator("button#btn-cookie-allow, .cookie-allow, #CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
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

function parsePrice(text: string | null): number {
  if (!text) return 0;
  const m = text.replace(/\s/g, "").match(/[\d]+[,.][\d]{2}/);
  if (!m) return 0;
  return Math.round(parseFloat(m[0].replace(",", ".")) * 100);
}

/** Scrapes shop.lecot.be after login. Returns null on failure → fallback to local catalog. */
export async function searchLecotViaPlaywright(
  query: string,
  limit = 8,
): Promise<CatalogProduct[] | null> {
  if (!lecotShopCredentials()) return null;

  const browser = await launchBrowser();
  if (!browser) return null;

  try {
    const page = await browser.newPage();
    if (!(await loginToLecot(page))) return null;

    await page.goto(lecotShopCatalogSearchUrl(query), {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    await page
      .waitForSelector(".product-item, .product-items li", { timeout: 8_000 })
      .catch(() => null);

    const items = await page.$$eval(".product-item, .product-items li", (nodes) =>
      nodes.map((n) => {
        const nameEl = n.querySelector(".product-item-name a, .product-item-link");
        const skuEl = n.querySelector("[data-product-sku], .product-item-sku");
        const priceEl = n.querySelector(".price, .price-final_price .price");
        return {
          label: nameEl?.textContent?.trim() ?? "",
          sku:
            skuEl?.textContent?.trim() ||
            (skuEl as HTMLElement | null)?.dataset?.productSku ||
            "",
          priceText: priceEl?.textContent?.trim() ?? "",
        };
      }),
    );

    const products: CatalogProduct[] = items
      .filter((i) => i.label)
      .slice(0, limit)
      .map((i, idx) => ({
        sku: i.sku || `LECOT-SHOP-${idx + 1}`,
        label: i.label,
        unitPriceCents: parsePrice(i.priceText),
      }));

    return products.length > 0 ? products : null;
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}

/** Logs in to shop.lecot.be, adds products to cart, places order via saved account address. */
export async function placeOrderViaPlaywright(
  lines: Array<{ sku: string; label: string; quantity: number }>,
  _guestInfo: LecotGuestInfo,
): Promise<LecotPlaywrightResult> {
  if (!lecotShopCredentials()) {
    return {
      ok: false,
      source: "playwright",
      error:
        "Credentials Lecot manquants — ajoutez LECOT_SHOP_EMAIL + LECOT_SHOP_PASSWORD dans .env.local.",
    };
  }

  const browser = await launchBrowser();
  if (!browser) {
    return { ok: false, source: "playwright", error: "Playwright non disponible sur ce serveur." };
  }

  try {
    const page = await browser.newPage();

    if (!(await loginToLecot(page))) {
      return { ok: false, source: "playwright", error: "Échec de connexion à shop.lecot.be." };
    }

    const failed: string[] = [];

    for (const line of lines) {
      const query = line.sku.startsWith("LECOT-") ? line.label : line.sku;
      await page.goto(lecotShopCatalogSearchUrl(query), {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });

      const productLink = page.locator(".product-item-name a, .product-item-link").first();
      if (!(await productLink.isVisible({ timeout: 6_000 }).catch(() => false))) {
        failed.push(line.label);
        continue;
      }

      await productLink.click();
      await page.waitForLoadState("domcontentloaded");

      if (line.quantity > 1) {
        const qtyInput = page.locator("input#qty, input[name='qty']").first();
        if (await qtyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await qtyInput.fill(String(line.quantity));
        }
      }

      const addBtn = page
        .locator("button#product-addtocart-button, button.tocart, button[data-action='tocart']")
        .first();
      if (!(await addBtn.isVisible({ timeout: 4_000 }).catch(() => false))) {
        failed.push(line.label);
        continue;
      }

      await addBtn.click();
      await page.waitForTimeout(2_500);
    }

    if (failed.length === lines.length) {
      return {
        ok: false,
        source: "playwright",
        error: `Aucun produit trouvé sur shop.lecot.be : ${failed.join(", ")}`,
      };
    }

    // ── Checkout (compte connecté — adresse pré-remplie) ─────────────────────
    await page.goto(lecotShopCheckoutUrl(), { waitUntil: "networkidle", timeout: 20_000 });

    // Advance past shipping step (saved address selected automatically)
    const nextBtn = page
      .locator("button[data-role='opc-continue'], .button-one-step, button.continue")
      .first();
    if (await nextBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(3_000);
    }

    // Payment method: prefer banktransfer or checkmo
    for (const method of ["banktransfer", "checkmo", "free"]) {
      const radio = page.locator(`input[value='${method}']`).first();
      if (await radio.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await radio.click();
        break;
      }
    }

    const placeOrderBtn = page
      .locator(
        "button[data-role='review-save'], .checkout-payment-method button.checkout, button.action-primary[title*='Commander'], button.action-primary[title*='Order']",
      )
      .first();
    if (!(await placeOrderBtn.isVisible({ timeout: 8_000 }).catch(() => false))) {
      return { ok: false, source: "playwright", error: "Bouton « Commander » introuvable." };
    }

    await placeOrderBtn.click();
    await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => null);

    const orderEl = page
      .locator(".checkout-success strong, .order-number, [data-bind*='orderId']")
      .first();
    const orderId = await orderEl.textContent({ timeout: 5_000 }).catch(() => null);

    return { ok: true, source: "playwright", orderId: orderId?.trim() || undefined };
  } catch (err) {
    return {
      ok: false,
      source: "playwright",
      error: err instanceof Error ? err.message : "Erreur Playwright inconnue",
    };
  } finally {
    await browser.close();
  }
}
