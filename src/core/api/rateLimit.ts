import { NextResponse } from "next/server";
import { clientIp } from "@/core/api/routeAuth";

type Bucket = { count: number; resetAt: number };

/** Fenêtre glissante en mémoire (par instance serverless — limite les abus naïfs). */
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 20_000;

function pruneBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS * 0.8) break;
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneBuckets(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Trop de requêtes. Réessayez plus tard." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

export function rateLimitByIp(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = clientIp(request) || "unknown";
  const result = checkRateLimit(`${routeKey}:ip:${ip}`, limit, windowMs);
  if (result.ok) return null;
  return rateLimitResponse(result.retryAfterSec);
}

export function rateLimitByKey(
  key: string,
  routeKey: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const result = checkRateLimit(`${routeKey}:${key}`, limit, windowMs);
  if (result.ok) return null;
  return rateLimitResponse(result.retryAfterSec);
}

/** Réponse générique — évite de fuiter si un code dossier existe. */
export function portalAccessDeniedResponse(): NextResponse {
  return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
}
