import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { launchLecotBrowser, loginLecotShop } from "@/features/catalog/lecotPlaywrightBrowser";
import {
  lecotShopCatalogSearchUrl,
  lecotShopCredentials,
} from "@/features/catalog/lecotShopConfig";

function parsePrice(text: string | null): number {
  if (!text) return 0;
  const m = text.replace(/\s/g, "").match(/[\d]+[,.][\d]{2}/);
  if (!m) return 0;
  return Math.round(parseFloat(m[0].replace(",", ".")) * 100);
}

/** Scrapes lecot.be after login. Returns null on failure → fallback to local catalog. */
export async function searchLecotViaPlaywright(
  query: string,
  limit = 8
): Promise<CatalogProduct[] | null> {
  if (!lecotShopCredentials()) return null;

  const browser = await launchLecotBrowser();
  if (!browser) return null;

  try {
    const page = await browser.newPage();
    if (!(await loginLecotShop(page))) return null;

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
            skuEl?.textContent?.trim() || (skuEl as HTMLElement | null)?.dataset?.productSku || "",
          priceText: priceEl?.textContent?.trim() ?? "",
        };
      })
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
