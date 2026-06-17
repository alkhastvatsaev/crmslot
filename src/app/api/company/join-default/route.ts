import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { joinDefaultCompanyMembership } from "@/features/company/server/joinDefaultCompanyMembership";

export const runtime = "nodejs";

/**
 * Inscription staff self-service : rattache le compte à la société unique (Admin SDK).
 */
export async function POST(req: Request) {
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

  const result = await joinDefaultCompanyMembership(admin.firestore(), admin.auth, decoded.uid);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    companyId: result.companyId,
    alreadyMember: result.alreadyMember,
  });
}
