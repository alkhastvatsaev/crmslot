/* eslint-disable no-console */
/**
 * Teste les 3 voies d'accès Lecot (API / sitemap / fiche publique / search) sur un échantillon SKU.
 *
 * Usage : npm run probe:lecot-images
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { searchLecotViaApi } from "../../src/features/catalog/lecotApiSearch";
import { crawlLecotProductImage } from "../../src/features/catalog/lecotImageCrawler";
import { fetchLecotProductPageImage } from "../../src/features/catalog/lecotProductPageImage";
import { lecotShopOrigin } from "../../src/features/catalog/lecotShopConfig";

type CatalogRow = { sku: string; label: string };

const SAMPLE_SKUS = [
  "LEC-SER-1001",
  "LEC-CYL-2012",
  "LEC-CTL-4003",
  "LEC-QUI-3001",
  "LEC-CNS-6051",
];

async function probeSitemap(): Promise<{ ok: boolean; status: number; productUrls: number }> {
  const url = `${lecotShopOrigin()}/sitemap.xml`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { ok: false, status: res.status, productUrls: 0 };
    const text = await res.text();
    const productUrls = (text.match(/\/fr-be\/[^<]+\.html/gi) ?? []).length;
    return { ok: true, status: res.status, productUrls };
  } catch {
    return { ok: false, status: 0, productUrls: 0 };
  }
}

async function probeApi(sku: string, label: string) {
  const hits = await searchLecotViaApi(`${sku} ${label}`.trim());
  const withImage = hits?.find((hit) => hit.imageUrl?.trim()) ?? null;
  return {
    configured: Boolean(process.env.LECOT_API_URL?.trim()),
    hitCount: hits?.length ?? 0,
    hasImageUrl: Boolean(withImage?.imageUrl),
    sampleImageUrl: withImage?.imageUrl ?? null,
  };
}

async function probeProductPage(pageUrl: string | undefined) {
  if (!pageUrl) return { ok: false, imageUrl: null as string | null };
  const imageUrl = await fetchLecotProductPageImage(pageUrl);
  return { ok: Boolean(imageUrl), imageUrl };
}

async function main() {
  const productsPath = path.join(process.cwd(), "data/catalog/lecot/products.json");
  const pageUrlsPath = path.join(process.cwd(), "data/catalog/lecot/product-page-urls.json");
  const reportPath = path.join(process.cwd(), "data/catalog/lecot/probe-report.json");

  const catalog = JSON.parse(fs.readFileSync(productsPath, "utf8")) as CatalogRow[];
  const pageUrls = JSON.parse(fs.readFileSync(pageUrlsPath, "utf8")) as Record<string, string>;

  const sample = SAMPLE_SKUS.map((sku) => catalog.find((row) => row.sku === sku)).filter(
    (row): row is CatalogRow => Boolean(row)
  );

  const sitemap = await probeSitemap();

  const apiProbes = await Promise.all(
    sample.map(async (row) => ({
      sku: row.sku,
      ...(await probeApi(row.sku, row.label)),
    }))
  );

  const pageProbes = await Promise.all(
    sample.map(async (row) => {
      const key = row.sku.toLowerCase();
      const pageUrl = pageUrls[key];
      const page = await probeProductPage(pageUrl);
      return { sku: row.sku, pageUrl: pageUrl ?? null, ...page };
    })
  );

  const crawlProbes = await Promise.all(
    sample.map(async (row) => {
      const result = await crawlLecotProductImage(row);
      return {
        sku: row.sku,
        ok: Boolean(result.entry),
        source: result.entry?.source ?? null,
        error: result.error ?? null,
      };
    })
  );

  const recommendation = apiProbes.some((row) => row.hasImageUrl)
    ? "lecot_api"
    : sitemap.ok && sitemap.productUrls > 0
      ? "sitemap_plus_product_page"
      : pageProbes.some((row) => row.ok)
        ? "product_page"
        : "playwright_fallback";

  const report = {
    generatedAt: new Date().toISOString(),
    sampleSize: sample.length,
    sitemap,
    apiProbes,
    pageProbes,
    crawlProbes,
    recommendation,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nSaved → ${reportPath}`);
  console.log(`Recommendation: ${recommendation}`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
