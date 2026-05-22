import type { CatalogProduct } from "@/features/catalog/productQuickAdd";

export function mergeCatalogProducts(...lists: CatalogProduct[][]): CatalogProduct[] {
  const bySku = new Map<string, CatalogProduct>();
  for (const list of lists) {
    for (const p of list) {
      const sku = p.sku.trim();
      if (!sku) continue;
      if (!bySku.has(sku)) bySku.set(sku, p);
    }
  }
  return Array.from(bySku.values());
}

const QUERY_STOP_WORDS = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "un",
  "une",
  "pour",
  "avec",
  "sur",
  "chez",
  "juste",
  "et",
  "ou",
  "en",
  "au",
  "aux",
  "a",
  "à",
]);

function normalizeAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Tokens utiles pour recherche catalogue (phrases longues type chatbot). */
export function tokenizeCatalogQuery(query: string): string[] {
  return normalizeAccents(query)
    .toLowerCase()
    .split(/[\s,;.\-/()[\]]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !QUERY_STOP_WORDS.has(t));
}

function scoreCatalogProduct(product: CatalogProduct, tokens: string[]): number {
  const hay = normalizeAccents(`${product.sku} ${product.label}`).toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      score += token.length >= 4 ? 3 : 1;
    }
  }
  return score;
}

function primaryCatalogToken(tokens: string[]): string | null {
  const long = tokens.filter((t) => t.length >= 4).sort((a, b) => b.length - a.length);
  return long[0] ?? tokens[0] ?? null;
}

/** Recherche par mots-clés (meilleur pour descriptions longues). */
export function searchCatalogProductsScored(
  products: CatalogProduct[],
  query: string,
  limit = 12,
): CatalogProduct[] {
  const q = query.trim();
  if (!q) return products.slice(0, limit);

  const qNorm = normalizeAccents(q.toLowerCase());
  const exact = products.filter(
    (p) =>
      normalizeAccents(p.label.toLowerCase()).includes(qNorm) ||
      p.sku.toLowerCase().includes(qNorm),
  );
  if (exact.length > 0) return exact.slice(0, limit);

  const tokens = tokenizeCatalogQuery(q);
  if (tokens.length === 0) return [];

  const primary = primaryCatalogToken(tokens);

  const ranked = products
    .map((p) => {
      const hay = normalizeAccents(`${p.sku} ${p.label}`).toLowerCase();
      let score = scoreCatalogProduct(p, tokens);
      if (primary && hay.includes(primary)) score += 8;
      return { p, score, primaryHit: Boolean(primary && hay.includes(primary)) };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const withPrimary = primary ? ranked.filter((row) => row.primaryHit) : ranked;
  const pool = withPrimary.length > 0 ? withPrimary : ranked;

  if (pool.length > 0) return pool.slice(0, limit).map((row) => row.p);

  return [];
}

export function searchCatalogProducts(
  products: CatalogProduct[],
  query: string,
  limit = 12,
): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products.slice(0, limit);
  return searchCatalogProductsScored(products, q, limit);
}
