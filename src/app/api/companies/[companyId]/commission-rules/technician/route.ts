import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
import { upsertTechnicianCommissionRuleAdmin } from "@/features/commissions/server/commissionRulesAdmin";
import type { CommissionValueType } from "@/features/commissions/types";

export const runtime = "nodejs";

type Body = {
  technicianUid?: string;
  alternateTargetIds?: string[];
  valueType?: CommissionValueType;
  value?: number;
};

/** Persiste une règle commission technicien (Admin SDK — fiable vs règles Firestore client). */
export async function POST(request: Request, context: { params: Promise<{ companyId: string }> }) {
  const authResult = await requireAuthenticatedUser(request);
  if ("response" in authResult) return authResult.response;

  const { companyId: rawCompanyId } = await context.params;
  const companyId = rawCompanyId?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "Identifiant société requis." }, { status: 400 });
  }

  const db = admin.firestore();
  const memberCtx = await requireCompanyMember(db, authResult.uid, companyId);
  if ("status" in memberCtx) {
    return NextResponse.json({ ok: false, error: memberCtx.error }, { status: memberCtx.status });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const technicianUid = body.technicianUid?.trim() ?? "";
  const valueType = body.valueType === "fixed_amount" ? "fixed_amount" : "percentage";
  const value = typeof body.value === "number" && Number.isFinite(body.value) ? body.value : NaN;
  const alternateTargetIds = Array.isArray(body.alternateTargetIds)
    ? body.alternateTargetIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!technicianUid) {
    return NextResponse.json({ ok: false, error: "technicianUid requis." }, { status: 400 });
  }
  if (Number.isNaN(value) || value < 0) {
    return NextResponse.json({ ok: false, error: "Valeur commission invalide." }, { status: 400 });
  }

  try {
    const result = await upsertTechnicianCommissionRuleAdmin(db, memberCtx.companyId, {
      technicianUid,
      alternateTargetIds,
      valueType,
      value,
      byUid: authResult.uid,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Impossible d'enregistrer la règle commission.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
