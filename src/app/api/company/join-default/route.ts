import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { isProductionNodeEnv } from "@/core/api/routeAuth";
import {
  joinDefaultCompanyMembership,
  type JoinDefaultCompanyOptions,
} from "@/features/company/server/joinDefaultCompanyMembership";

export const runtime = "nodejs";

function parseJoinDefaultBody(body: unknown): JoinDefaultCompanyOptions | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  const staffKind =
    record.staffKind === "technician"
      ? "technician"
      : record.staffKind === "admin"
        ? "admin"
        : undefined;
  if (!staffKind) return undefined;

  if (staffKind === "technician") {
    return {
      staffKind,
      technicianProfile: {
        firstName: typeof record.firstName === "string" ? record.firstName : undefined,
        lastName: typeof record.lastName === "string" ? record.lastName : undefined,
        email: typeof record.email === "string" ? record.email : null,
      },
    };
  }

  return { staffKind: "admin" };
}

/**
 * Inscription staff self-service : rattache le compte à la société unique (Admin SDK).
 */
export async function POST(req: Request) {
  if (isProductionNodeEnv() && process.env.ALLOW_OPEN_STAFF_JOIN !== "true") {
    return NextResponse.json(
      { ok: false, error: "Inscription staff ouverte désactivée en production." },
      { status: 403 }
    );
  }

  if (!admin.apps.length) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin non configuré." },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const tokenStr = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!tokenStr) {
    return NextResponse.json({ ok: false, error: "Token manquant." }, { status: 401 });
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(tokenStr);
  } catch {
    return NextResponse.json({ ok: false, error: "Token invalide." }, { status: 401 });
  }

  let options: JoinDefaultCompanyOptions | undefined;
  try {
    const body = await req.json();
    options = parseJoinDefaultBody(body);
  } catch {
    options = undefined;
  }

  // En production, ce endpoint self-service ne peut jamais provisionner un rôle "admin".
  // Le flag ALLOW_OPEN_STAFF_JOIN permet l'auto-onboarding technicien uniquement —
  // l'admin doit promouvoir explicitement via un autre flow.
  if (isProductionNodeEnv() && options?.staffKind !== "technician") {
    return NextResponse.json(
      { ok: false, error: "Inscription staff ouverte limitée aux techniciens en production." },
      { status: 403 }
    );
  }

  const result = await joinDefaultCompanyMembership(
    admin.firestore(),
    admin.auth,
    decoded.uid,
    options
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    companyId: result.companyId,
    alreadyMember: result.alreadyMember,
  });
}
