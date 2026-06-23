#!/usr/bin/env node
/**
 * Détecte modules de `src/features/<feat>/` racine importés DEPUIS HORS du feature.
 * = vraie surface publique → à exposer via barrel index.ts.
 *
 * Usage :
 *   node scripts/ci/detect-cross-feature-imports.mjs
 *   node scripts/ci/detect-cross-feature-imports.mjs --feature=chatbot
 *   node scripts/ci/detect-cross-feature-imports.mjs --json
 *   node scripts/ci/detect-cross-feature-imports.mjs --suggest   # blocs export prêts à coller
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const FEATURES = path.join(SRC, "features");

const JSON_OUT = process.argv.includes("--json");
const SUGGEST = process.argv.includes("--suggest");
const FEATURE = (process.argv.find((a) => a.startsWith("--feature=")) || "")
  .split("=")[1];

const SKIP_DIRS = new Set(["__tests__", "__mocks__", "node_modules"]);
const SKIP_FILES = new Set(["index.ts", "index.tsx", "index.server.ts"]);
const SKIP_SUFFIX = [".test.ts", ".test.tsx", ".d.ts"];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(full);
  }
  return acc;
}

function listRootModules(featureDir) {
  return fs
    .readdirSync(featureDir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.(ts|tsx)$/.test(n))
    .filter((n) => !SKIP_FILES.has(n))
    .filter((n) => !SKIP_SUFFIX.some((s) => n.endsWith(s)))
    .map((n) => n.replace(/\.(ts|tsx)$/, ""));
}

function parseBarrelExports(barrelPath) {
  if (!fs.existsSync(barrelPath)) return new Set();
  const src = fs.readFileSync(barrelPath, "utf8");
  const exported = new Set();
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    exported.add(path.basename(m[1]).replace(/\.(ts|tsx)$/, ""));
  }
  return exported;
}

const allFiles = walk(SRC);

const features = fs
  .readdirSync(FEATURES, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((n) => !FEATURE || n === FEATURE)
  .sort();

const report = [];

for (const feat of features) {
  const featDir = path.join(FEATURES, feat);
  const modules = listRootModules(featDir);
  const exported = parseBarrelExports(path.join(featDir, "index.ts"));

  const consumersByModule = new Map();
  for (const mod of modules) consumersByModule.set(mod, new Set());

  const aliasPrefix = `@/features/${feat}/`;
  const featAbs = featDir;

  for (const file of allFiles) {
    if (file.startsWith(featAbs + path.sep)) continue;
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes(feat)) continue;
    const re = /from\s+["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      let modPath = null;
      if (spec.startsWith(aliasPrefix)) {
        modPath = spec.slice(aliasPrefix.length);
      } else if (spec.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), spec);
        if (resolved.startsWith(featAbs + path.sep)) {
          modPath = path.relative(featAbs, resolved).replace(/\\/g, "/");
        }
      }
      if (!modPath) continue;
      if (modPath.includes("/")) continue;
      const stem = modPath.replace(/\.(ts|tsx)$/, "");
      if (consumersByModule.has(stem)) {
        consumersByModule.get(stem).add(path.relative(ROOT, file));
      }
    }
  }

  const publicModules = [];
  for (const [mod, consumers] of consumersByModule) {
    if (consumers.size === 0) continue;
    publicModules.push({
      module: mod,
      consumers: consumers.size,
      inBarrel: exported.has(mod),
    });
  }
  publicModules.sort((a, b) => b.consumers - a.consumers);

  const gaps = publicModules.filter((p) => !p.inBarrel);
  if (gaps.length === 0 && publicModules.length === 0) continue;

  report.push({
    feature: feat,
    rootModules: modules.length,
    publicModules: publicModules.length,
    gaps,
  });
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const featuresWithGaps = report.filter((r) => r.gaps.length > 0);
let totalGaps = 0;
for (const r of featuresWithGaps) totalGaps += r.gaps.length;

console.log(
  `Surface publique réelle — ${featuresWithGaps.length} feature(s) avec gaps barrel (${totalGaps} modules)\n`,
);

for (const r of report) {
  if (r.gaps.length === 0) continue;
  console.log(
    `# ${r.feature}  (${r.publicModules} publics, ${r.gaps.length} hors barrel)`,
  );
  for (const g of r.gaps) {
    console.log(`  - ${g.module}  (${g.consumers} consommateur(s))`);
  }
  if (SUGGEST) {
    console.log(`\n  // À ajouter dans src/features/${r.feature}/index.ts :`);
    for (const g of r.gaps) {
      console.log(`  export * from "@/features/${r.feature}/${g.module}";`);
    }
  }
  console.log();
}
