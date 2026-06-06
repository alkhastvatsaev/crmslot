#!/usr/bin/env node
/**
 * Génère la liste des routes API à tester (auth matrix E2E).
 * Usage: node scripts/generate-protected-api-routes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const API_ROOT = path.join(process.cwd(), "src/app/api");
const OUT = path.join(process.cwd(), "tests/fixtures/protected-api-routes.json");

/** Routes publiques ou à comportement spécial (pas 401/403/503 sans auth). */
const PUBLIC_OR_SPECIAL = new Set([
  "GET /api/health",
  "POST /api/webhooks/stripe",
  "POST /api/webhooks/twilio/incoming",
  "POST /api/webhooks/twilio/recording",
  "POST /api/webhooks/inbound-email",
  "POST /api/webhooks/email/inbound",
  "GET /api/portal/demo-token",
  "POST /api/e2e/seed-done-intervention",
  "POST /api/e2e/seed-assigned-intervention",
]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

function fileToRoute(filePath) {
  const rel = path.relative(API_ROOT, path.dirname(filePath));
  const segments = rel.split(path.sep).map((seg) => {
    if (seg.startsWith("[") && seg.endsWith("]")) {
      const name = seg.slice(1, -1);
      if (name.startsWith("...")) return "fixture";
      return "fixture";
    }
    return seg;
  });
  return `/api/${segments.join("/")}`;
}

function detectMethods(content) {
  const methods = [];
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
  }
  return methods;
}

const routes = [];
for (const file of walk(API_ROOT)) {
  const content = fs.readFileSync(file, "utf8");
  const routePath = fileToRoute(file);
  const methods = detectMethods(content);
  const hasAuthGuard =
    content.includes("requireAuthenticatedUser") ||
    content.includes("requireAuthenticatedUserOrLocalDev");
  const localDevBypass = content.includes("requireAuthenticatedUserOrLocalDev");

  for (const method of methods) {
    const key = `${method} ${routePath}`;
    if (PUBLIC_OR_SPECIAL.has(key)) continue;
    if (!hasAuthGuard) continue;
    routes.push({
      method,
      path: routePath,
      body: method === "GET" ? undefined : {},
      ...(localDevBypass ? { localDevBypass: true } : {}),
    });
  }
}

routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(routes, null, 2)}\n`);
console.log(`Wrote ${routes.length} protected routes → ${OUT}`);
