/* eslint-disable no-console */
/** Stats miss / placeholder sur l'index Lecot. Usage : npm run fetch:lecot-images:report */
import * as fs from "node:fs";
import * as path from "node:path";

import { normalizeLecotImageLookupKey } from "../src/features/catalog/lecotProductImageCache";
import type { LecotProductImageIndex } from "../src/features/catalog/lecotProductImageIndex";

const DATA_DIR = path.join(process.cwd(), "data/catalog/lecot");

function isPlaceholder(url: string): boolean {
  return /\/placeholder\/default\//i.test(url);
}

function main() {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "products.json"), "utf8")
  ) as Array<{ sku: string; label: string }>;
  const index = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "product-images-index.json"), "utf8")
  ) as LecotProductImageIndex;

  let ok = 0;
  let miss = 0;
  let placeholder = 0;
  const bySource: Record<string, number> = {};
  const misses: Array<{ sku: string; label: string }> = [];

  for (const row of catalog) {
    const key = normalizeLecotImageLookupKey(row.sku);
    const entry = index[key];
    if (!entry?.imageUrl?.trim()) {
      miss += 1;
      misses.push({ sku: row.sku, label: row.label });
      continue;
    }
    if (isPlaceholder(entry.imageUrl)) {
      placeholder += 1;
      continue;
    }
    ok += 1;
    bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: catalog.length,
    ok,
    miss,
    placeholder,
    coveragePct: catalog.length ? Math.round((ok / catalog.length) * 1000) / 10 : 0,
    bySource,
    misses: misses.slice(0, 50),
  };

  const reportPath = path.join(DATA_DIR, "crawl-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
