#!/usr/bin/env node
/**
 * Pousse les variables manquantes de .env.local vers Vercel Production.
 * Usage: node scripts/sync-vercel-env.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const ROOT = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const environment = "production";

/** Variables critiques pour que prod = local (API Admin, mobile, OAuth, etc.). */
const SYNC_KEYS = [
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_ALLOW_MOBILE",
  "NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GMAIL_REFRESH_TOKEN",
  "OPENAI_MODEL",
  "LECOT_SHOP_EMAIL",
  "LECOT_SHOP_PASSWORD",
  "LECOT_SHOP_URL",
  "NEXT_PUBLIC_LECOT_SHOP_URL",
];

/** Dérivées si absentes du .env.local */
const DERIVED = {
  TWILIO_WEBHOOK_PUBLIC_URL: "https://crmslot.vercel.app",
  PUBLIC_APP_URL: "https://crmslot.vercel.app",
  NEXT_PUBLIC_BASE_URL: "https://crmslot.vercel.app",
};

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function listVercelEnvNames() {
  const result = spawnSync("npx", ["vercel", "env", "ls", environment], {
    encoding: "utf8",
    cwd: ROOT,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  const names = new Set();
  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^\s+([A-Z0-9_]+)\s+/);
    if (match) names.add(match[1]);
  }
  return names;
}

function upsertVercelEnv(name, value) {
  if (!value?.trim()) {
    console.log(`  ⏭️  ${name} — valeur vide, ignoré`);
    return false;
  }
  if (dryRun) {
    console.log(`  [dry-run] ${name} (${value.length} chars)`);
    return true;
  }

  spawnSync("npx", ["vercel", "env", "rm", name, environment, "--yes"], {
    cwd: ROOT,
    stdio: "ignore",
  });

  const add = spawnSync("npx", ["vercel", "env", "add", name, environment], {
    input: value,
    encoding: "utf8",
    cwd: ROOT,
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (add.status !== 0) {
    console.error(`  ❌ ${name} — échec vercel env add`);
    return false;
  }
  console.log(`  ✅ ${name}`);
  return true;
}

const local = parseEnvFile(path.join(ROOT, ".env.local"));
const vercelNames = listVercelEnvNames();

if (!local.FIREBASE_PROJECT_ID?.trim() && local.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  local.FIREBASE_PROJECT_ID = local.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

for (const key of ["UPLOAD_AUTO_PROCESS_SECRET", "AUDIO_DISPATCH_SECRET"]) {
  if (!local[key]?.trim()) {
    local[key] = crypto.randomBytes(32).toString("hex");
    console.log(`  🔑 ${key} généré localement pour Vercel`);
  }
  SYNC_KEYS.push(key);
}

console.log(`\n🔄 Sync .env.local → Vercel (${environment})${dryRun ? " [dry-run]" : ""}\n`);

let updated = 0;
let skipped = 0;

for (const key of SYNC_KEYS) {
  const value = local[key];
  if (!value?.trim()) {
    console.log(`  ⏭️  ${key} — absent de .env.local`);
    skipped++;
    continue;
  }
  if (vercelNames.has(key)) {
    console.log(`  ↻ ${key} — mise à jour`);
  } else {
    console.log(`  + ${key} — ajout`);
  }
  if (upsertVercelEnv(key, value)) updated++;
}

for (const [key, value] of Object.entries(DERIVED)) {
  if (vercelNames.has(key) && local[key]?.trim()) {
    skipped++;
    continue;
  }
  console.log(`  + ${key} — dérivé`);
  if (upsertVercelEnv(key, local[key]?.trim() || value)) updated++;
}

console.log(`\n✅ ${updated} variable(s) synchronisée(s), ${skipped} ignorée(s).`);
if (!dryRun && updated > 0) {
  console.log("\n⚠️  Redéployez Vercel pour appliquer : npx vercel deploy --prod --yes --archive=tgz\n");
}
