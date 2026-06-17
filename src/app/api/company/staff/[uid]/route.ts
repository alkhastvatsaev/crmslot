import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { updateCompanyStaffMember } from "@/features/company/server/updateCompanyStaffMember";
import { setCompanyStaffActive } from "@/features/company/server/setCompanyStaffActive";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ uid: string }> };

function parseCompanyId(req: Request): string {
  return new URL(req.url).searchParams.get("companyId")?.trim() ?? "";
}

/** Met à jour un employé (admin uniquement). */
export async function PATCH(req: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const { uid: targetUid } = await context.params;
  const companyId = parseCompanyId(req);
  const db = admin.firestore();

  const adminCtx = await requireCompanyAdmin(db, authResult.uid, companyId);
  if ("status" in adminCtx) {
    return NextResponse.json({ ok: false, error: adminCtx.error }, { status: adminCtx.status });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const result = await updateCompanyStaffMember(db, admin.auth, adminCtx.companyId, targetUid, {
    firstName: typeof body.firstName === "string" ? body.firstName : undefined,
    lastName: typeof body.lastName === "string" ? body.lastName : undefined,
    email: typeof body.email === "string" ? body.email : body.email === null ? null : undefined,
    vehicle: typeof body.vehicle === "string" ? body.vehicle : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}

/** Active ou désactive un employé (admin uniquement). */
export async function POST(req: Request, context: RouteContext) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const { uid: targetUid } = await context.params;
  const companyId = parseCompanyId(req);
  const db = admin.firestore();

  const adminCtx = await requireCompanyAdmin(db, authResult.uid, companyId);
  if ("status" in adminCtx) {
    return NextResponse.json({ ok: false, error: adminCtx.error }, { status: adminCtx.status });
  }

  let body: { active?: boolean } = {};
  try {
    body = (await req.json()) as { active?: boolean };
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  if (typeof body.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "Champ active requis." }, { status: 400 });
  }

  const result = await setCompanyStaffActive(db, adminCtx.companyId, targetUid, body.active);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, active: body.active });
}
