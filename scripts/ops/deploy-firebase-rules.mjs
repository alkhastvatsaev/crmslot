#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
  }
  const env = { ...process.env, ...loadEnvLocal() };
  const projectId =
    env.FIREBASE_PROJECT_ID?.trim() || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Manque credentials Firebase Admin.");
    process.exit(1);
  }
  const dir = mkdtempSync(join(tmpdir(), "firebase-sa-"));
  const file = join(dir, "sa.json");
  writeFileSync(
    file,
    JSON.stringify({
      type: "service_account",
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
      token_uri: "https://oauth2.googleapis.com/token",
    })
  );
  return file;
}

const firebaserc = JSON.parse(readFileSync(".firebaserc", "utf8"));
const projectId = process.env.FIREBASE_PROJECT_ID || firebaserc.projects?.default;
const saPath = resolveServiceAccountPath();
const env = { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: saPath };

console.log(`Deploy rules → ${projectId}`);
const result = spawnSync(
  "npx",
  ["--yes", "firebase-tools@14.12.0", "deploy", "--only", "firestore:rules,storage", "--project", projectId, "--non-interactive"],
  { stdio: "inherit", env }
);
process.exit(result.status ?? 1);
