import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { listCompanyStaff } from "@/features/company/index.server";

export const runtime = "nodejs";

/** Liste les employés d'une société (admin uniquement). */
export async function GET(req: Request) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId")?.trim() ?? "";
  const db = admin.firestore();

  const adminCtx = await requireCompanyAdmin(db, authResult.uid, companyId);
  if ("status" in adminCtx) {
    return NextResponse.json({ ok: false, error: adminCtx.error }, { status: adminCtx.status });
  }

  try {
    const staff = await listCompanyStaff(db, admin.auth, adminCtx.companyId);
    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Impossible de charger l'équipe.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
