#!/usr/bin/env node
/**
 * Audit barrels `src/features/*\/index.ts`.
 * Liste modules racine du feature non réexportés par le barrel.
 *
 * Usage : node scripts/ci/audit-barrels.mjs [--json] [--feature=interventions]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FEATURES = path.join(ROOT, "src", "features");

const JSON_OUT = process.argv.includes("--json");
const FEATURE = (process.argv.find((a) => a.startsWith("--feature=")) || "")
  .split("=")[1];

const SKIP_FILES = new Set([
  "index.ts",
  "index.tsx",
]);
const SKIP_SUFFIX = [".test.ts", ".test.tsx", ".d.ts"];
const SKIP_DIRS = new Set(["__tests__", "__mocks__"]);

function listRootModules(featureDir) {
  return fs
    .readdirSync(featureDir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(ts|tsx)$/.test(n))
    .filter((n) => !SKIP_FILES.has(n))
    .filter((n) => !SKIP_SUFFIX.some((s) => n.endsWith(s)));
}

function parseBarrelExports(barrelPath) {
  if (!fs.existsSync(barrelPath)) return new Set();
  const src = fs.readFileSync(barrelPath, "utf8");
  const exported = new Set();
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    const base = path.basename(spec).replace(/\.(ts|tsx)$/, "");
    exported.add(base);
  }
  return exported;
}

function audit() {
  const features = fs
    .readdirSync(FEATURES, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !FEATURE || n === FEATURE)
    .sort();

  const report = [];
  for (const name of features) {
    const dir = path.join(FEATURES, name);
    const barrel = path.join(dir, "index.ts");
    const modules = listRootModules(dir);
    const exported = parseBarrelExports(barrel);
    const missing = modules
      .map((m) => m.replace(/\.(ts|tsx)$/, ""))
      .filter((stem) => !exported.has(stem));
    if (!fs.existsSync(barrel) || missing.length > 0) {
      report.push({
        feature: name,
        hasBarrel: fs.existsSync(barrel),
        rootModules: modules.length,
        exportedRefs: exported.size,
        missing,
      });
    }
  }
  return report;
}

const report = audit();

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (report.length === 0) {
  console.log("OK Aucun module racine non réexporté.");
  process.exit(0);
}

console.log(`Audit barrels — ${report.length} feature(s) avec gaps\n`);
for (const r of report) {
  const tag = r.hasBarrel ? "" : " [PAS DE BARREL]";
  console.log(
    `# ${r.feature}${tag}  (root=${r.rootModules}, refs=${r.exportedRefs}, manquants=${r.missing.length})`,
  );
  for (const m of r.missing) console.log(`  - ${m}`);
  console.log();
}
