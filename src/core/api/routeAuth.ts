import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";

/** Comparaison de secrets résistante au timing (les chaînes de tailles différentes => false). */
function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export type AuthenticatedRequest = {
  uid: string;
  decoded: admin.auth.DecodedIdToken;
};

export type AuthGuardFailure = { response: NextResponse };

export function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * IP cliente "edge-trusted".
 * Sur Vercel, `x-real-ip` est posé par l'edge avec la vraie IP TCP (non-spoofable).
 * `x-forwarded-for` est concaténé : `client_envoyé, edge_ip` — si on prenait `[0]`,
 * un attaquant pourrait spoofer son IP. On lit donc la **dernière** entrée XFF
 * (celle ajoutée par l'edge) en dernier recours.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }
  return "";
}

export async function verifyBearerFromRequest(
  request: Request
): Promise<admin.auth.DecodedIdToken | null> {
  if (!admin.apps.length) return null;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(
  request: Request
): Promise<AuthenticatedRequest | AuthGuardFailure> {
  if (!admin.apps.length) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Firebase Admin non configuré (variables serveur manquantes)." },
        { status: 503 }
      ),
    };
  }

  const decoded = await verifyBearerFromRequest(request);
  if (!decoded) {
    return {
      response: NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 }),
    };
  }

  const anonymousDenied = rejectAnonymousInProduction(decoded);
  if (anonymousDenied) {
    return { response: anonymousDenied };
  }

  return { uid: decoded.uid, decoded };
}

/**
 * Routes `/api/portal-chat/*` — invités anonymes autorisés en production
 * (chat portail demande). Le contrôle d'accès société reste côté handler.
 */
export async function requirePortalChatApiUser(
  request: Request
): Promise<AuthenticatedRequest | AuthGuardFailure> {
  if (!admin.apps.length) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Firebase Admin non configuré (variables serveur manquantes)." },
        { status: 503 }
      ),
    };
  }

  const decoded = await verifyBearerFromRequest(request);
  if (!decoded) {
    return {
      response: NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 }),
    };
  }

  return { uid: decoded.uid, decoded };
}

export function isAnonymousFirebaseUser(decoded: admin.auth.DecodedIdToken): boolean {
  const provider = decoded.firebase?.sign_in_provider;
  return provider === "anonymous";
}

/** Refuse les jetons anonymes en production (widget / demandes client → Firestore direct). */
export function rejectAnonymousInProduction(
  decoded: admin.auth.DecodedIdToken
): NextResponse | null {
  if (isProductionNodeEnv() && isAnonymousFirebaseUser(decoded)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 403 });
  }
  return null;
}

/** UID synthétique — routes Gmail en `npm run dev` sans login manuel. */
export const LOCAL_DEV_GMAIL_UID = "local-dev-gmail";

export function isLocalDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Gmail hub local : Bearer si présent, sinon accès autorisé en développement uniquement.
 * Production : identique à {@link requireAuthenticatedUser}.
 */
export async function requireAuthenticatedUserOrLocalDev(
  request: Request
): Promise<AuthenticatedRequest | AuthGuardFailure> {
  const authResult = await requireAuthenticatedUser(request);
  if (!("response" in authResult)) return authResult;
  if (!isLocalDevelopmentRuntime()) return authResult;
  return {
    uid: LOCAL_DEV_GMAIL_UID,
    decoded: { uid: LOCAL_DEV_GMAIL_UID } as admin.auth.DecodedIdToken,
  };
}

/** Routes démo : indisponibles en production. */
export function blockIfProduction(): NextResponse | null {
  if (isProductionNodeEnv()) {
    return NextResponse.json({ error: "Non disponible en production." }, { status: 404 });
  }
  return null;
}

/**
 * Garde les routes `/api/cron/*` derrière `CRON_SECRET`.
 * Vercel Cron envoie `Authorization: Bearer ${CRON_SECRET}`; on accepte aussi `x-cron-secret`.
 * Sans `CRON_SECRET` configuré, toute requête est refusée — y compris en dev (configurer
 * `CRON_SECRET=dev-cron` dans `.env.local` pour tester).
 */
export function requireCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET non configuré." }, { status: 503 });
  }
  const bearer = request.headers.get("authorization")?.trim() ?? "";
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const expectedBearer = `Bearer ${cronSecret}`;
  if (safeEqual(bearer, expectedBearer) || safeEqual(headerSecret, cronSecret)) return null;
  return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
}

/**
 * Traitement auto des uploads (`/api/ai/process-uploads`).
 * Prod : secret, jeton Firebase, ou IP bureau si activé. Sans secret en prod → auth obligatoire.
 */
export async function authorizeProcessUploads(request: Request): Promise<boolean> {
  const secret = process.env.UPLOAD_AUTO_PROCESS_SECRET?.trim();
  const hdr = request.headers.get("x-upload-auto-secret")?.trim() ?? "";
  if (secret && safeEqual(hdr, secret)) return true;

  if (await verifyBearerFromRequest(request)) return true;

  const officeIp = process.env.OFFICE_IP?.trim() || process.env.NEXT_PUBLIC_OFFICE_IP?.trim();
  if (officeIp && process.env.OFFICE_ALLOW_UPLOAD_AUTO_PROCESS === "true") {
    if (clientIp(request) === officeIp) return true;
  }

  if (!secret) {
    return !isProductionNodeEnv();
  }

  return false;
}

/**
 * MacroDroid / mobile (`/api/ai/audio-dispatch` POST).
 * Prod avec secret : en-tête `x-audio-dispatch-secret` ou jeton Firebase.
 */
export async function authorizeAudioDispatch(request: Request): Promise<boolean> {
  const secret = process.env.AUDIO_DISPATCH_SECRET?.trim();
  const dispatchHdr = request.headers.get("x-audio-dispatch-secret")?.trim() ?? "";

  if (secret) {
    if (safeEqual(dispatchHdr, secret)) return true;
    return (await verifyBearerFromRequest(request)) !== null;
  }

  if (!isProductionNodeEnv()) return true;
  return (await verifyBearerFromRequest(request)) !== null;
}

/**
 * Webhooks entrants (email, etc.) — secret obligatoire en production.
 * Accepte `?secret=` ou en-tête `x-inbound-webhook-secret`.
 */
export function requireInboundWebhookSecret(
  request: Request,
  envKey = "EMAIL_INBOUND_SECRET"
): NextResponse | null {
  const expected = process.env[envKey]?.trim();
  if (!expected) {
    if (isProductionNodeEnv()) {
      return NextResponse.json({ ok: false, error: "Webhook non configuré." }, { status: 503 });
    }
    return null;
  }

  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret")?.trim() ||
    request.headers.get("x-inbound-webhook-secret")?.trim() ||
    "";
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  return null;
}

/** Au moins une appartenance société (membership ou bmTenants). */
export async function requireAnyCompanyStaff(
  uid: string,
  decoded: admin.auth.DecodedIdToken
): Promise<NextResponse | null> {
  const tenants = decoded.bmTenants;
  if (Array.isArray(tenants) && tenants.length > 0) return null;

  if (!admin.apps.length) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin non configuré." },
      { status: 503 }
    );
  }

  const snap = await admin
    .firestore()
    .collection(`users/${uid}/company_memberships`)
    .limit(1)
    .get();
  if (!snap.empty) return null;

  return NextResponse.json({ ok: false, error: "Accès staff requis." }, { status: 403 });
}
