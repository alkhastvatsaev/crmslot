/* eslint-disable no-console */
/** HEAD 200 sur un échantillon d'URLs index. Usage : npm run fetch:lecot-images:verify */
import * as fs from "node:fs";
import * as path from "node:path";

import type { LecotProductImageIndex } from "../src/features/catalog/lecotProductImageIndex";

const DATA_DIR = path.join(process.cwd(), "data/catalog/lecot");
const SAMPLE_SIZE = Number(process.env.LECOT_VERIFY_SAMPLE ?? 24);

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) return true;
    const getRes = await fetch(url, { method: "GET", redirect: "follow" });
    return getRes.ok;
  } catch {
    return false;
  }
}

async function main() {
  const index = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "product-images-index.json"), "utf8")
  ) as LecotProductImageIndex;

  const entries = Object.entries(index).filter(([, entry]) => entry.imageUrl?.trim());
  const step = Math.max(1, Math.floor(entries.length / SAMPLE_SIZE));
  const sample = entries.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE);

  let ok = 0;
  let fail = 0;
  const failures: Array<{ sku: string; url: string }> = [];

  for (const [sku, entry] of sample) {
    const valid = await headOk(entry.imageUrl);
    if (valid) {
      ok += 1;
      console.log(`✓ ${sku}`);
    } else {
      fail += 1;
      failures.push({ sku, url: entry.imageUrl });
      console.warn(`✗ ${sku} — ${entry.imageUrl}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sampled: sample.length,
    ok,
    fail,
    failures,
  };

  console.log(JSON.stringify(report, null, 2));
  if (fail > 0) process.exit(1);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
