#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const LOCALES_DIR = join(ROOT, "src/core/i18n/locales");

function flatten(obj, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [ck, cv] of flatten(v, key)) out.set(ck, cv);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

function loadLocale(code) {
  const path = join(LOCALES_DIR, `${code}.json`);
  if (!existsSync(path)) return null;
  return flatten(JSON.parse(readFileSync(path, "utf8")));
}

const args = process.argv.slice(2);
const requireRu = args.includes("--require") && args[args.indexOf("--require") + 1] === "ru";
const sameAsIdx = args.indexOf("--same-as");
const sameAsRef = sameAsIdx >= 0 ? args[sameAsIdx + 1] : null;
const sameAsTargets = sameAsIdx >= 0 ? args.slice(sameAsIdx + 2) : [];

const codes = ["fr", "en", "nl"];
if (requireRu || existsSync(join(LOCALES_DIR, "ru.json"))) codes.push("ru");

const locales = Object.fromEntries(codes.map((c) => [c, loadLocale(c)]));
if (!locales.fr) {
  console.error("fr.json introuvable");
  process.exit(1);
}

const ref = locales.fr;
let failed = false;

for (const code of codes) {
  if (code === "fr") continue;
  const map = locales[code];
  if (!map) {
    console.error(`MISSING_FILE: ${code}.json`);
    failed = true;
    continue;
  }
  const missing = [...ref.keys()].filter((k) => !map.has(k));
  const extra = [...map.keys()].filter((k) => !ref.has(k));
  if (missing.length) {
    console.error(`${code}: ${missing.length} clés manquantes vs fr`);
    missing.slice(0, 20).forEach((k) => console.error(`  - ${k}`));
    failed = true;
  }
  if (extra.length) {
    console.error(`${code}: ${extra.length} clés en trop vs fr`);
    failed = true;
  }
}

if (sameAsRef && sameAsTargets.length) {
  const refMap = locales[sameAsRef];
  for (const code of sameAsTargets) {
    const map = locales[code];
    if (!map) continue;
    const identical = [];
    for (const [k, v] of refMap) {
      if (typeof v !== "string" || !v.trim()) continue;
      if (map.get(k) === v) identical.push(k);
    }
    console.log(`\n${code} identique à ${sameAsRef}: ${identical.length} clés`);
    const byNs = {};
    for (const k of identical) {
      const ns = k.split(".")[0];
      byNs[ns] = (byNs[ns] ?? 0) + 1;
    }
    Object.entries(byNs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([ns, n]) => console.log(`  ${ns}: ${n}`));
  }
}

console.log(`\nRésumé: fr=${ref.size} clés feuilles, locales=${codes.join(", ")}`);
process.exit(failed ? 1 : 0);
