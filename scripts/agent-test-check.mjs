#!/usr/bin/env node
/**
 * Garde-fou rapide pour agents IA (Claude, Cursor, Codex) avant commit/push.
 *
 * 1. Détecte les fichiers TS/TSX modifiés vs origin/main (ou HEAD~1 en fallback)
 * 2. typecheck (rapide, échoue tôt)
 * 3. lint sur les fichiers changés uniquement
 * 4. jest --findRelatedTests sur les fichiers changés
 *
 * Usage :
 *   npm run test:agent-check
 *   node scripts/agent-test-check.mjs --base=main
 */
import { execSync, spawnSync } from "node:child_process";

function arg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=")[1] : fallback;
}

const base = arg("base", "origin/main");

function getChangedFiles() {
  try {
    const out = execSync(`git diff --name-only ${base}...HEAD -- 'src/**/*.ts' 'src/**/*.tsx'`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const tracked = out.split("\n").filter(Boolean);

    const staged = execSync(`git diff --name-only --cached -- 'src/**/*.ts' 'src/**/*.tsx'`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);

    const working = execSync(`git diff --name-only -- 'src/**/*.ts' 'src/**/*.tsx'`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);

    return Array.from(new Set([...tracked, ...staged, ...working]));
  } catch {
    try {
      const out = execSync("git diff --name-only HEAD~1..HEAD -- 'src/**/*.ts' 'src/**/*.tsx'", {
        encoding: "utf8",
      });
      return out.split("\n").filter(Boolean);
    } catch {
      return [];
    }
  }
}

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`✖ ${label} a échoué (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

const files = getChangedFiles();

if (files.length === 0) {
  console.log("Aucun fichier src/*.ts(x) modifié — rien à valider.");
  process.exit(0);
}

console.log(`Fichiers modifiés (${files.length}) :`);
for (const f of files) console.log(`  • ${f}`);

run("typecheck", "npm", ["run", "typecheck"]);
run("lint (fichiers modifiés)", "npx", ["eslint", "--quiet", ...files]);
run("jest --findRelatedTests", "npx", [
  "jest",
  "--findRelatedTests",
  "--passWithNoTests",
  "--no-coverage",
  ...files,
]);

console.log("\n✅ Garde-fou agent validé — prêt pour commit/push.");
