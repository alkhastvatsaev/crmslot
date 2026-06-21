import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function stateSecret(): string {
  return (
    process.env.GMAIL_OAUTH_STATE_SECRET?.trim() ||
    process.env.FIREBASE_PRIVATE_KEY?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function sign(payload: string): string {
  const secret = stateSecret();
  if (!secret) throw new Error("GMAIL_OAUTH_STATE_SECRET non configuré.");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Génère un state OAuth signé (nonce + uid + ts) et le pose en cookie httpOnly sameSite=lax.
 * Format passé à Google : `<payload-base64url>.<sig>`. Le callback recompare cookie + querystring.
 */
export function issueGmailOAuthState(res: NextResponse, uid: string): string {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const payload = JSON.stringify({ nonce, uid, iat: issuedAt });
  const payloadEncoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = sign(payloadEncoded);
  const token = `${payloadEncoded}.${sig}`;

  res.cookies.set(GMAIL_OAUTH_STATE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_MS / 1000,
  });

  return token;
}

export type GmailOAuthStateVerification = { ok: true; uid: string } | { ok: false; reason: string };

/**
 * Vérifie le state retourné par Google contre celui stocké en cookie + HMAC + TTL.
 * Consomme le cookie après lecture (anti-replay).
 */
export function verifyGmailOAuthState(
  req: NextRequest,
  res: NextResponse,
  stateFromQuery: string | null
): GmailOAuthStateVerification {
  const cookieValue = req.cookies.get(GMAIL_OAUTH_STATE_COOKIE)?.value;
  res.cookies.set(GMAIL_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (!stateFromQuery || !cookieValue) return { ok: false, reason: "state_missing" };
  if (stateFromQuery !== cookieValue) return { ok: false, reason: "state_mismatch" };

  const parts = stateFromQuery.split(".");
  if (parts.length !== 2) return { ok: false, reason: "state_malformed" };
  const [payloadEncoded, sig] = parts as [string, string];

  let expectedSig: string;
  try {
    expectedSig = sign(payloadEncoded);
  } catch {
    return { ok: false, reason: "state_secret_missing" };
  }

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "state_signature_invalid" };
    }
  } catch {
    return { ok: false, reason: "state_signature_invalid" };
  }

  let parsed: { uid?: unknown; iat?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "state_payload_invalid" };
  }

  const uid = typeof parsed.uid === "string" ? parsed.uid : "";
  const iat = typeof parsed.iat === "number" ? parsed.iat : 0;
  if (!uid) return { ok: false, reason: "state_uid_missing" };
  if (Date.now() - iat > STATE_TTL_MS) return { ok: false, reason: "state_expired" };

  return { ok: true, uid };
}
