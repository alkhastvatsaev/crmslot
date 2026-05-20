/** Site pro Lecot (lecot.be) — URL, recherche, login Playwright. Identifiants : .env.local uniquement. */
export const LECOT_SHOP_DEFAULT_URL = "https://lecot.be/nl-be";

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
  const email = process.env.LECOT_SHOP_EMAIL?.trim();
  const password = process.env.LECOT_SHOP_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

/** Hostname pour résoudre les liens relatifs (lecot:…). */
export function lecotShopOrigin(): string {
  try {
    return new URL(lecotShopBaseUrl()).origin;
  } catch {
    return "https://lecot.be";
  }
}
