#!/usr/bin/env node
/**
 * Score agent-readiness CRMSLOT (Cursor / Claude).
 *
 * Usage:
 *   npm run agent:score
 *   node scripts/ci/agent-score.mjs --json
 *   node scripts/ci/agent-score.mjs --min=90
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const FEATURES = join(SRC, "features");
const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const minArg = args.find((a) => a.startsWith("--min="));
const minScore = minArg ? Number(minArg.split("=")[1]) : null;

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

function linesOf(file) {
  return readFileSync(file, "utf8").split(/\r?\n/).length;
}

function featureZones() {
  return readdirSync(FEATURES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function zoneNeedsServerBarrel(zone) {
  const base = join(FEATURES, zone);
  const serverDir = join(base, "server");
  if (existsSync(serverDir)) {
    const files = walk(serverDir).filter((f) => !f.includes("__tests__"));
    if (files.length > 0) return true;
  }
  for (const f of walk(base)) {
    if (f.includes("__tests__") || f.includes("/components/") || f.includes("/hooks/")) continue;
    const rel = relative(base, f);
    if (/Admin\.ts$/.test(rel) || /RouteHandler\.ts$/.test(rel)) return true;
  }
  return false;
}

function collectMetrics() {
  const zones = featureZones();
  const allSrc = walk(SRC);
  const prod = allSrc.filter((f) => !f.includes("__tests__") && !f.startsWith(join(SRC, "test-utils")));
  const tests = allSrc.filter((f) => f.includes("__tests__"));

  const god300 = prod.filter((f) => linesOf(f) >= 300).length;
  const god250 = prod.filter((f) => linesOf(f) >= 250).length;
  const testGod300 = tests.filter((f) => linesOf(f) >= 300).length;
  const maxProdLines = prod.length ? Math.max(...prod.map(linesOf)) : 0;

  const readmes = zones.filter((z) => existsSync(join(FEATURES, z, "README.md"))).length;
  const barrels = zones.filter((z) => existsSync(join(FEATURES, z, "index.ts"))).length;
  const serverBarrels = zones.filter((z) => existsSync(join(FEATURES, z, "index.server.ts"))).length;
  const needsServer = zones.filter(zoneNeedsServerBarrel);
  const missingServer = needsServer.filter((z) => !existsSync(join(FEATURES, z, "index.server.ts")));

  let typeBarrel = 0;
  let typeDeep = 0;
  let valBarrel = 0;
  let valDeep = 0;
  let serverImports = 0;

  const zoneOf = (rel) => {
    const m = rel.match(/^src\/features\/([^/]+)\//);
    return m ? m[1] : null;
  };

  for (const f of allSrc) {
    const text = readFileSync(f, "utf8");
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    const fileZone = zoneOf(rel);
    const isTypeLine = (line) => /import\s+type\b/.test(line) || /import\s+\{[^}]*\btype\b/.test(line);
    for (const line of text.split("\n")) {
      if (!line.includes("@/features/")) continue;
      const m = line.match(/from ["']@\/features\/([^"']+)["']/);
      if (!m) continue;
      const path = m[1];
      if (path.includes("index.server")) {
        serverImports += 1;
        continue;
      }
      const importZone = path.includes("/") ? path.split("/")[0] : path;
      const isCrossFeature = fileZone && importZone && fileZone !== importZone;
      if (!isCrossFeature && path.includes("/")) continue;
      const isBarrel = !path.includes("/");
      const isType = isTypeLine(line);
      if (isType && isBarrel) typeBarrel += 1;
      else if (isType) typeDeep += 1;
      else if (isBarrel) valBarrel += 1;
      else valDeep += 1;
    }
  }

  const typeTotal = typeBarrel + typeDeep;
  const typeBarrelPct = typeTotal ? (typeBarrel / typeTotal) * 100 : 100;
  const serverCoveragePct = needsServer.length
    ? ((needsServer.length - missingServer.length) / needsServer.length) * 100
    : 100;

  const readmePct = (readmes / zones.length) * 100;
  const barrelPct = (barrels / zones.length) * 100;
  function computeFileSizeScore(g300, g250) {
  if (g300 > 0) return Math.max(0, 65 - (g300 - 1) * 15);
  if (g250 <= 10) return 100;
  if (g250 <= 25) return 90;
  if (g250 <= 40) return 78;
  return Math.max(50, 78 - (g250 - 40) * 2);
}
const fileSizeScore = computeFileSizeScore(god300, god250);
  const testScore = Math.max(0, 100 - testGod300 * 8);
  const importScore = Math.min(100, typeBarrelPct * 0.7 + Math.min(valBarrel, 120) / 120 * 30);

  const weights = {
    structure: 0.15,
    fileSize: 0.2,
    imports: 0.25,
    serverSafety: 0.15,
    hubs: 0.1,
    tests: 0.1,
    freeze: 0.05,
  };

  const structureScore = (readmePct + barrelPct) / 2;
  const hubScore = 90;
  const freezeScore =
    existsSync(join(ROOT, ".cursor/rules/agent-freeze-score.mdc")) &&
    existsSync(join(ROOT, "docs/agents/AGENT_SCORE.md"))
      ? 100
      : 0;

  const total =
    structureScore * weights.structure +
    fileSizeScore * weights.fileSize +
    importScore * weights.imports +
    serverCoveragePct * weights.serverSafety +
    hubScore * weights.hubs +
    testScore * weights.tests +
    freezeScore * weights.freeze;

  return {
    score: Math.round(total * 10) / 10,
    zones: zones.length,
    readmes,
    barrels,
    serverBarrels,
    needsServer: needsServer.length,
    missingServer,
    god300,
    god250,
    maxProdLines,
    testGod300,
    typeBarrel,
    typeDeep,
    typeBarrelPct: Math.round(typeBarrelPct * 10) / 10,
    valBarrel,
    valDeep,
    serverImports,
    subscores: {
      structure: Math.round(structureScore),
      fileSize: Math.round(fileSizeScore),
      imports: Math.round(importScore),
      serverSafety: Math.round(serverCoveragePct),
      hubs: hubScore,
      tests: Math.round(testScore),
      freeze: freezeScore,
    },
  };
}

const m = collectMetrics();

if (jsonOut) {
  console.log(JSON.stringify(m, null, 2));
} else {
  console.log("CRMSLOT agent-readiness score\n");
  console.log(`  Score global : ${m.score}%  (cible 90%, plancher 70%)`);
  console.log("");
  console.log("  Sous-scores :");
  for (const [k, v] of Object.entries(m.subscores)) {
    console.log(`    ${k.padEnd(14)} ${v}%`);
  }
  console.log("");
  console.log("  Structure :");
  console.log(`    README ${m.readmes}/${m.zones} · barrels ${m.barrels}/${m.zones} · index.server ${m.serverBarrels}/${m.needsServer}`);
  if (m.missingServer.length) {
    console.log(`    ⚠ index.server manquants : ${m.missingServer.join(", ")}`);
  }
  console.log("");
  console.log(`  Fichiers prod ≥300 L : ${m.god300} · ≥250 L : ${m.god250} · max ${m.maxProdLines} L`);
  console.log("");
  console.log(`  import type via barrel : ${m.typeBarrelPct}% (${m.typeBarrel}/${m.typeBarrel + m.typeDeep})`);
  console.log(`  valeur deep (OK si cycles) : ${m.valDeep} · index.server imports : ${m.serverImports}`);
  console.log(`  Tests ≥300 L : ${m.testGod300}`);
  console.log("");
  console.log("  Prochaines actions vers 90% :");
  if (m.missingServer.length) console.log(`    - index.server.ts : ${m.missingServer.join(", ")}`);
  if (m.god250 > 10) console.log(`    - Découper fichiers ≥250 L (${m.god250} restants)`);
  if (m.typeBarrelPct < 85) console.log(`    - Migrer import type deep → barrel (cible ≥85%)`);
  if (m.testGod300 > 0) console.log(`    - Éclater ${m.testGod300} test(s) ≥300 L`);
  if (m.score >= 90) console.log("    ✓ Objectif 90% atteint");
}

if (minScore != null && m.score < minScore) process.exit(1);
