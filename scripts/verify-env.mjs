#!/usr/bin/env node
/**
 * Vérifie les variables d’environnement avant déploiement.
 * Usage: node scripts/verify-env.mjs [--tier=minimal|staging|production]
 * Charge .env.local si présent (sans écraser les vars déjà définies).
 */
import fs from "node:fs";
import path from "node:path";

const tier = process.argv.find((a) => a.startsWith("--tier="))?.split("=")[1] ?? "staging";

const ROOT = process.cwd();

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv(path.join(ROOT, ".env.local"));
loadDotEnv(path.join(ROOT, ".env"));

const GROUPS = {
  firebase: [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ],
  firebaseAdmin: ["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
  map: ["NEXT_PUBLIC_MAPBOX_TOKEN"],
  security: ["UPLOAD_AUTO_PROCESS_SECRET", "AUDIO_DISPATCH_SECRET"],
  twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WEBHOOK_PUBLIC_URL"],
  ai: ["OPENAI_API_KEY"],
  email: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
};

const TIER_REQUIRED = {
  minimal: ["firebase", "map"],
  staging: ["firebase", "map"],
  production: ["firebase", "firebaseAdmin", "map", "security", "twilio", "ai"],
};

function isSet(key) {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

let failed = false;
const requiredGroups = TIER_REQUIRED[tier] ?? TIER_REQUIRED.staging;

console.log(`\n🔍 Vérification env (tier: ${tier})\n`);

for (const group of requiredGroups) {
  const keys = GROUPS[group] ?? [];
  const missing = keys.filter((k) => !isSet(k));
  if (missing.length === 0) {
    console.log(`  ✅ ${group}`);
  } else {
    failed = true;
    console.log(`  ❌ ${group} — manquant: ${missing.join(", ")}`);
  }
}

const optional = ["NEXT_PUBLIC_STAGING_PREVIEW", "STRIPE_SECRET_KEY", "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"];
const optionalSet = optional.filter(isSet);
if (optionalSet.length) {
  console.log(`\n  ℹ️  Optionnelles présentes: ${optionalSet.join(", ")}`);
}

const defaultTechUid = "NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID";
if (tier === "production" && !isSet(defaultTechUid)) {
  failed = true;
  console.log(`  ❌ assignation — manquant: ${defaultTechUid} (UID Firebase Auth du technicien terrain)`);
} else if (tier === "staging" && !isSet(defaultTechUid)) {
  console.log(
    `  ⚠️  assignation — ${defaultTechUid} absent (recommandé avant Preview ; npm run sync:technician-uids après)`,
  );
} else if (isSet(defaultTechUid)) {
  console.log(`  ✅ assignation (${defaultTechUid})`);
}

const realOnly = "NEXT_PUBLIC_REAL_INTERVENTIONS_ONLY";
if (tier === "production" && process.env[realOnly] !== "true") {
  console.log(`  ⚠️  données — ${realOnly} absent (recommandé true en Production)`);
} else if (process.env[realOnly] === "true") {
  console.log(`  ✅ données (${realOnly})`);
}

if (failed) {
  console.error("\n❌ Variables manquantes. Copiez .env.example → .env.local et complétez.\n");
  process.exit(1);
}

console.log("\n✅ Environnement OK pour ce tier.\n");
