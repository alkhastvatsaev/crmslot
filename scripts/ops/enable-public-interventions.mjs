#!/usr/bin/env node
/**
 * Pose `acceptsPublicInterventions: true` sur le doc `companies/{id}` cible
 * pour autoriser les soumissions anonymes (particulier non connecté) via
 * la règle Firestore `companyAcceptsPublicInterventions`.
 *
 * Usage :
 *   node scripts/ops/enable-public-interventions.mjs                    # utilise NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID
 *   node scripts/ops/enable-public-interventions.mjs --company=co-xyz
 *   node scripts/ops/enable-public-interventions.mjs --off               # repose à false
 *   node scripts/ops/enable-public-interventions.mjs --dry-run
 *
 * Variables (mêmes que les routes API) :
 *   FIREBASE_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */
import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

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

const flags = new Set(process.argv.slice(2));
const dryRun = flags.has("--dry-run");
const turnOff = flags.has("--off");

const companyArg = process.argv.find((a) => a.startsWith("--company="))?.split("=")[1]?.trim();
const companyId =
  companyArg || process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim();

if (!companyId) {
  console.error(
    "❌ Aucun companyId. Passez --company=<id> ou définissez NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID."
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "❌ Credentials Admin manquants (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

const ref = db.collection("companies").doc(companyId);
const snap = await ref.get();
if (!snap.exists) {
  console.error(`❌ Doc companies/${companyId} introuvable.`);
  process.exit(1);
}

const target = !turnOff;
const current = snap.get("acceptsPublicInterventions");

console.log(`companies/${companyId} : acceptsPublicInterventions = ${current ?? "(absent)"}`);

if (current === target) {
  console.log(`✅ Déjà à ${target}. Rien à faire.`);
  process.exit(0);
}

if (dryRun) {
  console.log(`🟡 dry-run : aurait écrit acceptsPublicInterventions = ${target}`);
  process.exit(0);
}

await ref.update({
  acceptsPublicInterventions: target,
  acceptsPublicInterventionsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

console.log(`✅ acceptsPublicInterventions = ${target} sur companies/${companyId}`);
