#!/usr/bin/env node
/**
 * Smoke HTTP après déploiement.
 * Usage: node scripts/smoke-url.mjs https://votre-app.vercel.app
 */
const base = process.argv[2]?.replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-url.mjs <BASE_URL>");
  process.exit(1);
}

const checks = [
  { name: "health", path: "/api/health", expectJson: { ok: true } },
  { name: "home", path: "/", expectStatus: 200, noRedirect: true },
  {
    name: "pwa-manifest",
    path: "/manifest.json",
    expectStatus: 200,
    noRedirect: true,
    expectBodyIncludes: '"short_name": "CRMSLOT"',
  },
  {
    name: "pwa-service-worker",
    path: "/sw.js",
    expectStatus: 200,
    noRedirect: true,
    expectBodyIncludes: "precacheAndRoute",
  },
  {
    name: "geocode-protected",
    path: "/api/maps/geocode?q=Bruxelles",
    expectProtected: true,
  },
  {
    name: "demo-blocked-in-prod",
    path: "/api/demo/client-audio",
    expectStatus: process.env.SMOKE_ALLOW_DEMO === "1" ? 401 : 404,
    skipInDev: true,
  },
];

let failed = 0;

async function run() {
  console.log(`\n🌐 Smoke ${base}\n`);

  for (const c of checks) {
    if (c.skipInDev && base.includes("localhost")) continue;
    try {
      const res = await fetch(`${base}${c.path}`, {
        redirect: c.noRedirect ? "manual" : "follow",
      });
      const statusOk = c.expectProtected
        ? [401, 403, 503].includes(res.status)
        : c.expectStatus
          ? res.status === c.expectStatus
          : res.ok;
      let jsonOk = true;
      let bodyIncludesOk = true;
      let bodyText = "";
      if (c.expectJson || c.expectBodyIncludes) {
        bodyText = await res.text();
      }
      if (c.expectJson) {
        const body = JSON.parse(bodyText || "{}");
        jsonOk = Object.entries(c.expectJson).every(([k, v]) => body[k] === v);
      }
      if (c.expectBodyIncludes) {
        bodyIncludesOk = bodyText.includes(c.expectBodyIncludes);
      }
      const redirectOk = !c.noRedirect || (res.status !== 301 && res.status !== 302 && res.status !== 307 && res.status !== 308);
      if (statusOk && jsonOk && bodyIncludesOk && redirectOk) {
        console.log(`  ✅ ${c.name} (${res.status})`);
      } else {
        failed++;
        const parts = [`status ${res.status}`];
        if (!redirectOk) parts.push(`redirect vers ${res.headers.get("location") ?? "?"}`);
        if (!statusOk) parts.push(`attendu ${c.expectStatus ?? "2xx"}`);
        if (!bodyIncludesOk) parts.push(`corps sans « ${c.expectBodyIncludes} »`);
        console.log(`  ❌ ${c.name} — ${parts.join(", ")}`);
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ ${c.name} — ${e instanceof Error ? e.message : e}`);
    }
  }

  if (failed) {
    console.error(`\n❌ ${failed} check(s) en échec\n`);
    process.exit(1);
  }
  console.log("\n✅ Smoke OK\n");
}

run();
