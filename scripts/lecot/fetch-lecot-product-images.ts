/* eslint-disable no-console */
/**
 * Récupère les vignettes lecot.be pour le kit Matériel + titres commandes tracking
 * via fiches produit publiques → product-images-index.json + overlays dérivés
 *
 * Usage : npm run fetch:lecot-images
 */
import * as fs from "node:fs";
import * as path from "node:path";

import {
  buildLabelOverlayFromIndex,
  buildLegacySkuOverlayFromIndex,
} from "../src/features/catalog/lecotImageCrawler";
import { normalizeLecotImageLookupKey } from "../src/features/catalog/lecotProductImageCache";
import type { LecotProductImageIndex } from "../src/features/catalog/lecotProductImageIndex";
import { normalizeProductLabelKey } from "../src/features/catalog/lecotProductLabelImage";
import { fetchLecotProductPageImage } from "../src/features/catalog/lecotProductPageImage";

const STOCK_ITEMS: Array<{ reference: string; lecotSku: string; label: string }> = [
  { reference: "CYL-EURO-80", lecotSku: "LEC-CYL-2012", label: "Cylindre européen 80 mm sécurité" },
  { reference: "CYL-EURO-70", lecotSku: "LEC-CYL-2008", label: "Cylindre européen 70 mm" },
  { reference: "BAR-A2P", lecotSku: "LEC-CYL-2013", label: "Barillet A2P 5 goupilles" },
  { reference: "CREM-3PT", lecotSku: "LEC-SER-1001", label: "Crémone multipoint 3 points" },
  { reference: "GACH-ELEC", lecotSku: "LEC-CTL-4003", label: "Gâche électrique réversible" },
  { reference: "SERR-APL", lecotSku: "LEC-SER-1014", label: "Serrure applique A2P" },
  { reference: "BADGE-125", lecotSku: "LEC-CTL-4024", label: "Badge RFID 125 kHz" },
  { reference: "TELE-4CH", lecotSku: "LEC-CTL-4048", label: "Télécommande portail 4 canaux" },
  { reference: "VIS-INOX-6", lecotSku: "LEC-CNS-6051", label: "Vis inox M6 × 40 (boîte 100)" },
  { reference: "GOND-REN", lecotSku: "LEC-QUI-3060", label: "Gond renforcé paumelle lourde" },
  { reference: "JOINT-EPDM", lecotSku: "LEC-QUI-3042", label: "Joint EPDM porte blindée" },
  { reference: "LUB-CYL", lecotSku: "LEC-CNS-6037", label: "Lubrifiant cylindre 400 ml" },
  { reference: "GANT-NIT", lecotSku: "LEC-OUT-7044", label: "Gants nitrile (boîte 100)" },
  { reference: "LECOT-POIG", lecotSku: "LEC-QUI-3001", label: "Poignée de porte Lecot inox" },
];

const TRACKING_LABEL_ALIASES: Array<{ label: string; reference: string }> = [
  { label: "Cylindre européen 80 mm", reference: "CYL-EURO-80" },
  { label: "Cylindre 80 mm", reference: "CYL-EURO-80" },
  { label: "Gâche électrique", reference: "GACH-ELEC" },
  { label: "Poignée inox", reference: "LECOT-POIG" },
];

function writeSortedJson(filePath: string, data: Record<string, unknown>) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

async function main() {
  const dataDir = path.join(process.cwd(), "data/catalog/lecot");
  const pageUrlsPath = path.join(dataDir, "product-page-urls.json");
  const indexPath = path.join(dataDir, "product-images-index.json");
  const imagesPath = path.join(dataDir, "product-images.json");
  const labelsPath = path.join(dataDir, "product-images-by-label.json");
  const pageUrls = JSON.parse(fs.readFileSync(pageUrlsPath, "utf8")) as Record<string, string>;
  const existingIndex = fs.existsSync(indexPath)
    ? (JSON.parse(fs.readFileSync(indexPath, "utf8")) as LecotProductImageIndex)
    : {};

  const index: LecotProductImageIndex = { ...existingIndex };
  const overlay: Record<string, string> = {};
  let stockOk = 0;
  let stockMiss = 0;

  for (const item of STOCK_ITEMS) {
    const skuKey = normalizeLecotImageLookupKey(item.lecotSku);
    const refKey = normalizeLecotImageLookupKey(item.reference);
    const pageUrl = pageUrls[skuKey];

    if (!pageUrl) {
      console.warn(`✗ ${item.reference} — pas d'URL fiche produit`);
      stockMiss += 1;
      continue;
    }

    console.log(`→ stock ${item.reference} (${item.lecotSku})`);
    const imageUrl = await fetchLecotProductPageImage(pageUrl);
    if (!imageUrl) {
      console.warn(`  ✗ image introuvable sur ${pageUrl}`);
      stockMiss += 1;
      continue;
    }

    overlay[skuKey] = imageUrl;
    overlay[refKey] = imageUrl;
    index[skuKey] = {
      imageUrl,
      label: item.label,
      pageUrl,
      source: "product_page",
      fetchedAt: new Date().toISOString(),
    };
    console.log(`  ✓ ${imageUrl}`);
    stockOk += 1;
    await new Promise((r) => setTimeout(r, 400));
  }

  writeSortedJson(indexPath, index as Record<string, unknown>);

  const legacyOverlay = buildLegacySkuOverlayFromIndex(index);
  for (const [key, url] of Object.entries(overlay)) {
    legacyOverlay[key] = url;
  }
  writeSortedJson(imagesPath, legacyOverlay);

  const labelOverlay = buildLabelOverlayFromIndex(index);
  for (const item of STOCK_ITEMS) {
    const refKey = normalizeLecotImageLookupKey(item.reference);
    const url = overlay[refKey];
    if (!url) continue;
    labelOverlay[normalizeProductLabelKey(item.label)] = url;
  }
  for (const alias of TRACKING_LABEL_ALIASES) {
    const refKey = normalizeLecotImageLookupKey(alias.reference);
    const url = overlay[refKey];
    if (!url) continue;
    labelOverlay[normalizeProductLabelKey(alias.label)] = url;
  }
  writeSortedJson(labelsPath, labelOverlay);

  console.log(
    `\nSaved index ${Object.keys(index).length} SKU → ${indexPath} (${stockOk} ok, ${stockMiss} missed)`
  );
  console.log(`Saved ${Object.keys(legacyOverlay).length} sku/ref keys → ${imagesPath}`);
  console.log(`Saved ${Object.keys(labelOverlay).length} label keys → ${labelsPath}`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
