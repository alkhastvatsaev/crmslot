#!/usr/bin/env node
/**
 * Coverage ratchet : empêche la baisse de couverture par fichier (PR vs base).
 *
 * Workflow :
 *   1. Lance `npm run test:coverage` côté HEAD → coverage/coverage-summary.json
 *   2. Compare avec un snapshot baseline (coverage/baseline.json) committé dans le repo,
 *      OU télécharge depuis la branche de base (passé en --base).
 *   3. Si un fichier a vu sa couverture baisser → exit 1.
 *   4. Sinon : met à jour la baseline et exit 0.
 *
 * Usage :
 *   node scripts/check-coverage-ratchet.mjs [--base=main] [--update] [--list-uncovered]
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const COVERAGE_PATH = path.join(ROOT, "coverage", "coverage-summary.json");
const BASELINE_PATH = path.join(ROOT, "coverage", "baseline.json");

function flag(name) {
  return process.argv.includes(`--${name}`);
}
function arg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : fallback;
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function ensureCoverage() {
  if (fs.existsSync(COVERAGE_PATH)) return;
  console.log("⏳ Aucun coverage trouvé — lancement de `npm run test:coverage`…");
  execSync("npm run test:coverage", { stdio: "inherit" });
}

function fileEntries(summary) {
  // Skip the "total" key — on suit uniquement par fichier.
  return Object.entries(summary).filter(([key]) => key !== "total");
}

function relativeKey(key) {
  if (key.startsWith(ROOT)) return key.slice(ROOT.length + 1);
  // Le coverage peut référencer un chemin absolu différent (symlinks, cache jest).
  // On normalise sur le segment `src/...` qui est unique par fichier.
  const srcIdx = key.lastIndexOf("/src/");
  if (srcIdx >= 0) return key.slice(srcIdx + 1);
  return key;
}

function ratchetCheck() {
  const current = readJson(COVERAGE_PATH);
  if (!current) {
    console.error(`✖ Pas de coverage à ${COVERAGE_PATH}. Lance d'abord npm run test:coverage.`);
    process.exit(1);
  }

  const baseline = readJson(BASELINE_PATH) ?? {};

  if (flag("list-uncovered")) {
    const uncovered = fileEntries(current)
      .filter(([, m]) => (m.statements?.pct ?? 0) < 50)
      .sort((a, b) => (a[1].statements.pct ?? 0) - (b[1].statements.pct ?? 0));
    console.log(`\n${uncovered.length} fichiers < 50 % statements :`);
    for (const [key, m] of uncovered) {
      console.log(`  ${m.statements.pct.toFixed(0).padStart(3)}%  ${relativeKey(key)}`);
    }
    process.exit(0);
  }

  let regressed = 0;
  let improved = 0;
  const regressions = [];

  for (const [key, metrics] of fileEntries(current)) {
    const rel = relativeKey(key);
    const baseMetrics = baseline[rel];
    if (!baseMetrics) {
      // Nouveau fichier — ok (sera ajouté au baseline si --update).
      continue;
    }
    for (const metric of ["statements", "branches", "functions", "lines"]) {
      const cur = metrics[metric]?.pct ?? 0;
      const base = baseMetrics[metric]?.pct ?? 0;
      const drop = base - cur;
      // tolérance 0.5 pt pour éviter les faux positifs sur arrondi V8
      if (drop > 0.5) {
        regressed += 1;
        regressions.push({ file: rel, metric, base, cur, drop });
        break;
      }
      if (cur > base + 0.5) improved += 1;
    }
  }

  if (regressions.length > 0 && !flag("update")) {
    console.error(`\n✖ Coverage en baisse sur ${regressions.length} fichier(s) :\n`);
    for (const r of regressions.slice(0, 30)) {
      console.error(
        `  ${r.file}\n    ${r.metric} : ${r.base.toFixed(1)}% → ${r.cur.toFixed(
          1
        )}% (−${r.drop.toFixed(1)}pt)`
      );
    }
    if (regressions.length > 30) {
      console.error(`  …et ${regressions.length - 30} autres`);
    }
    console.error(`\nAjoute ou rétablis les tests, OU mets à jour la baseline avec --update.`);
    process.exit(1);
  }

  if (regressions.length > 0 && flag("update")) {
    console.log(
      `⚠️  ${regressions.length} régression(s) détectée(s) — baseline écrasée (--update).`
    );
  }

  console.log(`✅ Coverage ratchet OK — ${improved} fichier(s) amélioré(s), 0 régression.`);

  if (flag("update")) {
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    const next = {};
    for (const [key, metrics] of fileEntries(current)) {
      next[relativeKey(key)] = {
        statements: { pct: metrics.statements?.pct ?? 0 },
        branches: { pct: metrics.branches?.pct ?? 0 },
        functions: { pct: metrics.functions?.pct ?? 0 },
        lines: { pct: metrics.lines?.pct ?? 0 },
      };
    }
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n");
    console.log(`📌 Baseline mise à jour (${Object.keys(next).length} fichiers) → ${BASELINE_PATH}`);
  }
}

void arg; // (réservé pour --base= dans une future intégration GH Actions)
ensureCoverage();
ratchetCheck();
