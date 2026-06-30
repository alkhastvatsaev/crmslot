import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
import { notifyMaterialOrderPlacedAdmin } from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
  materialOrderId?: string | null;
  supplierOrderId?: string | null;
  interventionId?: string | null;
  clientName?: string | null;
  partsSummary?: string | null;
};

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const companyId = body.companyId?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "companyId manquant." }, { status: 400 });
  }

  const member = await requireCompanyMember(admin.firestore(), auth.uid, companyId);
  if ("error" in member) {
    return NextResponse.json({ ok: false, error: member.error }, { status: member.status });
  }

  try {
    const result = await notifyMaterialOrderPlacedAdmin({
      db: admin.firestore(),
      auth: admin.auth,
      companyId,
      actorUid: auth.uid,
      materialOrderId: body.materialOrderId ?? null,
      supplierOrderId: body.supplierOrderId ?? null,
      interventionId: body.interventionId ?? null,
      clientName: body.clientName ?? null,
      body:
        (typeof body.partsSummary === "string" ? body.partsSummary.trim() : "") ||
        "Nouvelle commande matériel enregistrée.",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[notifications/material-order-placed]", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Notification impossible." },
      { status: 500 }
    );
  }
}
