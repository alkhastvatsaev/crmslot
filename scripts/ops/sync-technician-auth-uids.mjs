#!/usr/bin/env node
/**
 * Renseigne `authUid` sur chaque document `technicians/*` qui ne l’a pas encore.
 *
 * Usage:
 *   npm run sync:technician-uids
 *   npm run check:technician-uids
 *   node scripts/sync-technician-auth-uids.mjs --uid=AbCdEfFirebaseUid
 *   node scripts/sync-technician-auth-uids.mjs --dry-run
 *   node scripts/sync-technician-auth-uids.mjs --list
 *
 * Variables (comme les routes API) :
 *   FIREBASE_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Repli UID : --uid=… ou NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID
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
const listOnly = flags.has("--list");
const checkOnly = flags.has("--check");

const uidArg = process.argv.find((a) => a.startsWith("--uid="))?.split("=")[1]?.trim();
const defaultUid =
  uidArg ||
  process.env.NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID?.trim() ||
  "demo-tech-local";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Firebase Admin manquant. Définissez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

const snap = await db.collection("technicians").get();
let updated = 0;
let skipped = 0;
let missing = 0;

for (const docSnap of snap.docs) {
  const data = docSnap.data();
  const existing = typeof data.authUid === "string" ? data.authUid.trim() : "";
  const label = `technicians/${docSnap.id}`;

  if (listOnly) {
    console.log(`${label}\tauthUid=${existing || "(vide)"}\tname=${data.name ?? "—"}`);
    if (!existing) missing += 1;
    continue;
  }

  if (existing) {
    skipped += 1;
    continue;
  }

  missing += 1;
  if (checkOnly) continue;

  if (dryRun) {
    console.log(`[dry-run] ${label} → authUid=${defaultUid}`);
    updated += 1;
    continue;
  }

  await docSnap.ref.set({ authUid: defaultUid }, { merge: true });
  updated += 1;
  console.log(`✓ ${label} → authUid=${defaultUid}`);
}

if (snap.empty) {
  console.log("Collection technicians vide — rien à mettre à jour.");
} else if (listOnly) {
  console.log(`\n${snap.size} technicien(s), ${missing} sans authUid.`);
} else if (checkOnly) {
  if (missing > 0) {
    console.error(
      `\n❌ ${missing} technicien(s) sans authUid. Définissez NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID puis : npm run sync:technician-uids`,
    );
    process.exit(1);
  }
  console.log(`\n✅ Tous les techniciens ont authUid (${skipped} doc(s)).`);
} else {
  const mode = dryRun ? "simulation" : "écriture";
  console.log(
    `\nTerminé (${mode}) : ${updated} à traiter, ${skipped} déjà renseignés (UID cible : ${defaultUid}).`,
  );
}
