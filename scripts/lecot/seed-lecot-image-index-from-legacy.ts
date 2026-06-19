/* eslint-disable no-console */
/** Initialise product-images-index.json depuis les overlays legacy (sans réseau). */
import * as fs from "node:fs";
import * as path from "node:path";

import { normalizeLecotImageLookupKey } from "../src/features/catalog/lecotProductImageCache";
import type { LecotProductImageIndex } from "../src/features/catalog/lecotProductImageIndex";

const DATA_DIR = path.join(process.cwd(), "data/catalog/lecot");

function main() {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "products.json"), "utf8")
  ) as Array<{ sku: string; label: string }>;
  const legacy = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "product-images.json"), "utf8")
  ) as Record<string, string>;
  const pageUrls = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "product-page-urls.json"), "utf8")
  ) as Record<string, string>;
  const existing = fs.existsSync(path.join(DATA_DIR, "product-images-index.json"))
    ? (JSON.parse(
        fs.readFileSync(path.join(DATA_DIR, "product-images-index.json"), "utf8")
      ) as LecotProductImageIndex)
    : {};

  const labelBySku = new Map(
    catalog.map((row) => [normalizeLecotImageLookupKey(row.sku), row.label])
  );

  const index: LecotProductImageIndex = { ...existing };

  for (const [rawKey, imageUrl] of Object.entries(legacy)) {
    const key = normalizeLecotImageLookupKey(rawKey);
    if (!key || !imageUrl?.trim()) continue;
    if (index[key] && index[key].source !== "legacy") continue;

    const skuKey = key.startsWith("lec-") ? key : null;
    index[key] = {
      imageUrl: imageUrl.trim(),
      label: (skuKey && labelBySku.get(skuKey)) || labelBySku.get(key) || rawKey,
      pageUrl: pageUrls[key] ?? pageUrls[skuKey ?? ""] ?? null,
      source: "legacy",
      fetchedAt: "1970-01-01T00:00:00.000Z",
    };
  }

  for (const row of catalog) {
    const key = normalizeLecotImageLookupKey(row.sku);
    const url = legacy[key];
    if (!url?.trim() || index[key]) continue;
    index[key] = {
      imageUrl: url.trim(),
      label: row.label,
      pageUrl: pageUrls[key] ?? null,
      source: "legacy",
      fetchedAt: "1970-01-01T00:00:00.000Z",
    };
  }

  const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(
    path.join(DATA_DIR, "product-images-index.json"),
    `${JSON.stringify(sorted, null, 2)}\n`,
    "utf8"
  );
  console.log(`Seeded ${Object.keys(sorted).length} entries`);
}

main();
