#!/usr/bin/env node
/**
 * Crée (ou recrée) un compte Firebase démo pour login APK.
 *
 * Usage:
 *   node scripts/create-demo-user.mjs
 *   node scripts/create-demo-user.mjs --email=demo@crmslot.app --password=Demo1234!
 *
 * Variables (.env.local) :
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
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

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, ...v] = a.replace(/^--/, "").split("=");
      return [k, v.join("=") || "true"];
    })
);

const email = args.email || "demo@crmslot.app";
const password = args.password || "Demo1234!";
const displayName = args.name || "Démo Technicien";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Manque FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY dans .env.local"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const auth = admin.auth();

try {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName, emailVerified: true });
    console.log(`✓ Compte mis à jour : ${email} (uid=${user.uid})`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      user = await auth.createUser({ email, password, displayName, emailVerified: true });
      console.log(`✓ Compte créé : ${email} (uid=${user.uid})`);
    } else {
      throw e;
    }
  }
  console.log("");
  console.log("Email    :", email);
  console.log("Password :", password);
  console.log("UID      :", user.uid);
} catch (e) {
  console.error("Erreur :", e.message);
  process.exit(1);
}
