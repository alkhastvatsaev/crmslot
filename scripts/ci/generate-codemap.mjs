#!/usr/bin/env node
/**
 * Génère CODEMAP.md — carte de navigation auto pour agents (Claude, Cursor).
 * Source de vérité : structure src/ + constantes *_SLOT_INDEX.
 *
 * Usage : node scripts/ci/generate-codemap.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "CODEMAP.md");

const CODE_EXT = new Set([".ts", ".tsx"]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__mocks__") continue;
      walk(full, acc);
    } else acc.push(full);
  }
  return acc;
}

function countFiles(dir) {
  const all = walk(dir);
  const code = all.filter((f) => CODE_EXT.has(path.extname(f)));
  const tests = code.filter((f) => /__tests__|\.test\.tsx?$/.test(f));
  return { total: code.length, tests: tests.length };
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function extractSlots() {
  const files = walk(path.join(SRC, "features")).filter((f) =>
    /Constants\.ts$/.test(f),
  );
  const slots = [];
  const re = /export const ([A-Z0-9_]+_SLOT_INDEX)\s*=\s*([^;]+);/g;
  for (const f of files) {
    const content = fs.readFileSync(f, "utf8");
    let m;
    while ((m = re.exec(content))) {
      slots.push({ name: m[1], value: m[2].trim(), file: rel(f) });
    }
  }
  return slots.sort((a, b) => a.name.localeCompare(b.name));
}

function listFeatures() {
  const dir = path.join(SRC, "features");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(dir, e.name);
      const { total, tests } = countFiles(full);
      return {
        name: e.name,
        hasIndex: fs.existsSync(path.join(full, "index.ts")),
        hasReadme: fs.existsSync(path.join(full, "README.md")),
        files: total,
        tests,
      };
    })
    .sort((a, b) => b.files - a.files);
}

function listCore() {
  const dir = path.join(SRC, "core");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const full = path.join(dir, e.name);
      return { name: e.name, ...countFiles(full) };
    })
    .sort((a, b) => b.total - a.total);
}

function listApiRoutes() {
  const dir = path.join(SRC, "app", "api");
  if (!fs.existsSync(dir)) return [];
  const routes = [];
  for (const f of walk(dir)) {
    if (!/route\.(ts|tsx)$/.test(f)) continue;
    const route = path
      .relative(dir, path.dirname(f))
      .replace(/\\/g, "/");
    routes.push(route || "(root)");
  }
  return routes.sort();
}

function stats() {
  const all = walk(SRC).filter((f) => CODE_EXT.has(path.extname(f)));
  let lines = 0;
  for (const f of all) {
    lines += fs.readFileSync(f, "utf8").split("\n").length;
  }
  const tests = all.filter((f) => /__tests__|\.test\.tsx?$/.test(f));
  return { files: all.length, lines, tests: tests.length };
}

function render() {
  const slots = extractSlots();
  const features = listFeatures();
  const core = listCore();
  const routes = listApiRoutes();
  const s = stats();

  const slotRows = slots
    .map((x) => `| \`${x.name}\` | ${x.value} | ${x.file} |`)
    .join("\n");

  const featureRows = features
    .map(
      (f) =>
        `| ${f.name} | ${f.files} | ${f.tests} | ${
          f.hasIndex ? "OK" : "—"
        } | ${f.hasReadme ? "OK" : "—"} |`,
    )
    .join("\n");

  const coreRows = core
    .map((c) => `| ${c.name} | ${c.total} | ${c.tests} |`)
    .join("\n");

  const routeList = routes.map((r) => `- \`/${r}\``).join("\n");

  return `# CODEMAP

> Auto-généré par \`scripts/ci/generate-codemap.mjs\` — ne PAS éditer à la main.
> Régénérer : \`npm run map\`.
>
> Carte rapide pour Claude/Cursor. Pour les règles : voir \`CLAUDE.md\`, \`AGENTS.md\`, \`docs/agents/\`.

## Stats globales

- Fichiers code : **${s.files}**
- Lignes code : **${s.lines.toLocaleString("fr-FR")}**
- Tests : **${s.tests}**

## Carrousel — slots (DashboardPager)

Source de vérité : \`*Constants.ts\` du feature.

| Constante | Valeur | Fichier |
|---|---|---|
${slotRows}

## Features (\`src/features/\`)

Tri par taille. \`index.ts\` = barrel public. \`README.md\` = doc feature (5 lignes : but, slot, entry, intent, tests).

| Feature | Fichiers | Tests | Barrel | README |
|---|---:|---:|:---:|:---:|
${featureRows}

## Core (\`src/core/\`)

| Module | Fichiers | Tests |
|---|---:|---:|
${coreRows}

## API routes (\`src/app/api/\`)

${routeList}

## Conventions clés

- 1 feature = 1 dossier sous \`src/features/<nom>/\`.
- Barrel \`index.ts\` exporte API publique uniquement.
- Slots définis dans \`*Constants.ts\` du feature, jamais ailleurs.
- Tests colocalisés dans \`__tests__/\`.
- Imports : \`@features/*\`, \`@core/*\`, \`@context/*\` — pas de deep imports hors barrel.

## Docs liées

- \`CLAUDE.md\` — règles agent
- \`AGENTS.md\` — règles tests
- \`docs/agents/HUB_PATTERN.md\` — convention hubs
- \`docs/agents/PARALLEL_WORK.md\` — zones Claude/Cursor
- \`docs/agents/MESSAGING_PATTERN.md\`, \`MATERIEL_PATTERN.md\`, \`PLANNING_PATTERN.md\` — frontières
`;
}

fs.writeFileSync(OUT, render());
console.log(`OK CODEMAP.md généré (${rel(OUT)})`);
