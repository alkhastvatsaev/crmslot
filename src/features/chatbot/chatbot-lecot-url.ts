import {
  lecotShopBaseUrl,
  lecotShopCatalogSearchUrl,
  lecotShopOrigin,
} from "@/features/catalog/lecotShopConfig";

/** URL recherche boutique Lecot. */
export function buildLecotSearchUrl(term: string): string {
  return lecotShopCatalogSearchUrl(term);
}

/** Normalise `lecot:https://…` ou chemins relatifs vers la boutique configurée. */
export function resolveLecotLinkHref(raw: string): string {
  const href = raw.startsWith("lecot:") ? raw.slice("lecot:".length) : raw;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("/")) return `${lecotShopOrigin()}${href}`;
  return lecotShopCatalogSearchUrl(href);
}

export { lecotShopBaseUrl };
