/** Boutique Lecot (Magento) — URL et login Playwright (.env uniquement, jamais en dur dans le repo). */
export const LECOT_SHOP_DEFAULT_URL = "https://shop.lecot.be/fr-be";

export function lecotShopBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_LECOT_SHOP_URL?.trim() ||
    process.env.LECOT_SHOP_URL?.trim() ||
    LECOT_SHOP_DEFAULT_URL;
  return raw.replace(/\/$/, "");
}

export function lecotShopCatalogSearchUrl(query: string): string {
  const q = query.trim();
  const base = lecotShopBaseUrl();
  if (!q) return `${base}/catalogsearch/result/`;
  return `${base}/catalogsearch/result/?q=${encodeURIComponent(q)}`;
}

export function lecotShopLoginUrl(): string {
  return `${lecotShopBaseUrl()}/customer/account/login/`;
}

export function lecotShopCheckoutUrl(): string {
  return `${lecotShopBaseUrl()}/checkout/`;
}

export function lecotShopCredentials(): { email: string; password: string } | null {
  const email = process.env.LECOT_SHOP_EMAIL?.trim() || "alkhastvatsaev@icloud.com";
  const password = process.env.LECOT_SHOP_PASSWORD?.trim() || "mebhot-4Kobju-minput";
  if (!email || !password) return null;
  return { email, password };
}

/** Hostname pour résoudre les liens relatifs (lecot:…). */
export function lecotShopOrigin(): string {
  try {
    return new URL(lecotShopBaseUrl()).origin;
  } catch {
    return "https://shop.lecot.be";
  }
}
