import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
import { createCompanyStaffMember } from "@/features/company/server/createCompanyStaffMember";
import { listCompanyStaff } from "@/features/company/index.server";
import type { CompanyStaffKind } from "@/features/teamHub/types";
import { writeAuditLog, auditMetaFromRequest } from "@/core/services/audit/writeAuditLog";

export const runtime = "nodejs";

function parseStaffKind(value: unknown): CompanyStaffKind | null {
  if (value === "dirigeant" || value === "dispatcher" || value === "technician") {
    return value;
  }
  return null;
}

/** Liste les employés d'une société (admin uniquement). */
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
    const staff = await listCompanyStaff(db, admin.auth, memberCtx.companyId);
    return NextResponse.json({ ok: true, staff });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Impossible de charger l'équipe.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Ajoute ou invite un employé (admin uniquement). */
export async function POST(req: Request) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId")?.trim() ?? "";
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

  const staffKind = parseStaffKind(body.staffKind);
  if (!staffKind) {
    return NextResponse.json({ ok: false, error: "Rôle invalide." }, { status: 400 });
  }

  const result = await createCompanyStaffMember(
    db,
    admin.auth,
    adminCtx.companyId,
    authResult.uid,
    {
      firstName: typeof body.firstName === "string" ? body.firstName : "",
      lastName: typeof body.lastName === "string" ? body.lastName : "",
      email: typeof body.email === "string" ? body.email : body.email === null ? null : undefined,
      phone: typeof body.phone === "string" ? body.phone : body.phone === null ? null : undefined,
      staffKind,
    }
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  await writeAuditLog({
    action: "company.create_staff",
    actorUid: authResult.uid,
    companyId: adminCtx.companyId,
    targetType: result.mode === "member" ? "user" : "company_invite",
    targetId: result.mode === "member" ? result.uid : result.inviteId,
    ...auditMetaFromRequest(req),
    meta: {
      mode: result.mode,
      staffKind,
      created: result.mode === "member" ? result.created : undefined,
    },
  });

  if (result.mode === "member") {
    const staff = await listCompanyStaff(db, admin.auth, adminCtx.companyId);
    const member = staff.find((row) => row.uid === result.uid);
    return NextResponse.json({ ...result, member });
  }

  return NextResponse.json(result);
}
