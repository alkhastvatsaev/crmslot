#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import admin from "firebase-admin";

const ROOT = process.cwd();
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotEnv(path.join(ROOT, ".env.local"));

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
const companyId = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim();
const appUrl = (process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://crmslot.vercel.app").replace(/\/$/, "");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}
const db = admin.firestore();

const notifyStaffNewClientRequestAdmin = (
  await import(pathToFileURL(path.join(ROOT, "src/features/notifications/server/notifyStaffNewClientRequestAdmin.ts")).href)
).notifyStaffNewClientRequestAdmin;

const interventionId = process.argv[2] || "test-notif-1783023643311";
const title = "TEST NOTIF — Porte bloquée (simulation client)";
const address = "Rue de la Loi 16, 1000 Bruxelles";

const result = await notifyStaffNewClientRequestAdmin({
  db,
  auth: admin.auth,
  companyId,
  senderUid: "test-script",
  interventionId,
  title,
  address,
  clientLabel: "Test Notification",
});

console.log("Push envoyées à", result.notified, "membre(s) staff");
console.log("Lien:", `${appUrl}/?bmBackofficeRequest=${interventionId}`);
