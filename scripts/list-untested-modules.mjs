#!/usr/bin/env node
/**
 * Liste les modules `src/` sans test colocalisé.
 * Aide les agents IA à identifier les zones à couvrir en priorité.
 *
 * Usage :
 *   node scripts/list-untested-modules.mjs [--feature=interventions] [--no-tsx] [--top=20]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function arg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const filterFeature = arg("feature", null);
const skipTsx = flag("no-tsx");
const top = parseInt(arg("top", "0"), 10);

function* walk(dir) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules" || e.name === ".next") continue;
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function hasColocatedTest(srcFile) {
  const dir = path.dirname(srcFile);
  const base = path.basename(srcFile).replace(/\.(ts|tsx)$/, "");
  const testDir = path.join(dir, "__tests__");
  if (!fs.existsSync(testDir)) return false;
  const expected = [`${base}.test.ts`, `${base}.test.tsx`];
  for (const f of expected) {
    if (fs.existsSync(path.join(testDir, f))) return true;
  }
  return false;
}

const candidates = [];
for (const file of walk(SRC)) {
  if (!file.match(/\.(ts|tsx)$/)) continue;
  if (file.endsWith(".d.ts")) continue;
  if (file.includes("/__tests__/")) continue;
  if (skipTsx && file.endsWith(".tsx")) continue;

  const rel = path.relative(ROOT, file);
  if (filterFeature && !rel.includes(`src/features/${filterFeature}/`)) continue;
  if (rel.includes("src/test-utils/")) continue;
  if (rel.startsWith("src/app/") && rel.endsWith("page.tsx")) continue;
  if (rel.startsWith("src/app/") && rel.endsWith("layout.tsx")) continue;

  if (!hasColocatedTest(file)) {
    const lines = fs.readFileSync(file, "utf8").split("\n").length;
    candidates.push({ file: rel, lines });
  }
}

// Tri descendant par taille (les gros fichiers non testés ont le plus d'impact)
candidates.sort((a, b) => b.lines - a.lines);

const list = top > 0 ? candidates.slice(0, top) : candidates;

console.log(`\n📂 ${candidates.length} modules sans test colocalisé`);
if (filterFeature) console.log(`   (filtré sur src/features/${filterFeature}/)`);
console.log("");

for (const { file, lines } of list) {
  console.log(`  ${String(lines).padStart(4)}  ${file}`);
}

if (top > 0 && candidates.length > top) {
  console.log(`\n   …et ${candidates.length - top} autres. Utilise --top=N pour ajuster.`);
}
