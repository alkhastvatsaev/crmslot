import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";

export type AuthenticatedRequest = {
  uid: string;
  decoded: admin.auth.DecodedIdToken;
};

export type AuthGuardFailure = { response: NextResponse };

export function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
}

export async function verifyBearerFromRequest(
  request: Request,
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
  request: Request,
): Promise<AuthenticatedRequest | AuthGuardFailure> {
  if (!admin.apps.length) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Firebase Admin non configuré (variables serveur manquantes)." },
        { status: 503 },
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

/** Routes démo : indisponibles en production. */
export function blockIfProduction(): NextResponse | null {
  if (isProductionNodeEnv()) {
    return NextResponse.json({ error: "Non disponible en production." }, { status: 404 });
  }
  return null;
}

/**
 * Traitement auto des uploads (`/api/ai/process-uploads`).
 * Prod : secret, jeton Firebase, ou IP bureau si activé. Sans secret en prod → auth obligatoire.
 */
export async function authorizeProcessUploads(request: Request): Promise<boolean> {
  const secret = process.env.UPLOAD_AUTO_PROCESS_SECRET?.trim();
  const hdr = request.headers.get("x-upload-auto-secret")?.trim();
  if (secret && hdr === secret) return true;

  if (await verifyBearerFromRequest(request)) return true;

  const officeIp = process.env.NEXT_PUBLIC_OFFICE_IP?.trim();
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
  const dispatchHdr = request.headers.get("x-audio-dispatch-secret")?.trim();

  if (secret) {
    if (dispatchHdr === secret) return true;
    return (await verifyBearerFromRequest(request)) !== null;
  }

  if (!isProductionNodeEnv()) return true;
  return (await verifyBearerFromRequest(request)) !== null;
}
