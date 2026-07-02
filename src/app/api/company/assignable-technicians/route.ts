import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
import { listAssignableTechnicians } from "@/features/company/index.server";

export const runtime = "nodejs";

/** Liste les techniciens assignables et provisionne les profils terrain manquants. */
export async function GET(req: Request) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId")?.trim() ?? "";
  const db = admin.firestore();

  const memberCtx = await requireCompanyMember(db, authResult.uid, companyId);
  if ("status" in memberCtx) {
    return NextResponse.json({ ok: false, error: memberCtx.error }, { status: memberCtx.status });
  }

  try {
    const technicians = await listAssignableTechnicians(db, admin.auth, memberCtx.companyId);
    return NextResponse.json({ ok: true, technicians });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Impossible de charger les techniciens assignables.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
