#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "public");

const payload = execSync(
  "npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json scripts/pwa/sync-manifests-runner.ts",
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
).trim();

const files = JSON.parse(payload);
for (const { filename, json } of files) {
  writeFileSync(join(outDir, filename), json, "utf8");
  console.log(`[sync-pwa-manifests] ${filename}`);
}
