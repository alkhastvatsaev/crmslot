import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules/mapbox-gl/dist/mapbox-gl-csp-worker.js");
const target = join(root, "public/mapbox-gl-csp-worker.js");

if (!existsSync(source)) {
  console.warn("[sync-mapbox-worker] mapbox-gl worker introuvable — skip");
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("[sync-mapbox-worker] public/mapbox-gl-csp-worker.js");
