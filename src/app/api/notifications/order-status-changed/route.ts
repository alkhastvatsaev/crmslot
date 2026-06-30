import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
import { notifyMaterialOrderStatusAdmin } from "@/features/notifications/server/notifyMaterialOrderStatusAdmin";
import type { OrderStatusPushKind } from "@/features/notifications/materialOrderStatusPush";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
  kind?: OrderStatusPushKind;
  fromStatus?: string | null;
  toStatus?: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
  clientName?: string | null;
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
  const toStatus = body.toStatus?.trim() ?? "";
  const kind = body.kind === "material" ? "material" : body.kind === "supplier" ? "supplier" : null;

  if (!companyId || !toStatus || !kind) {
    return NextResponse.json({ ok: false, error: "Paramètres manquants." }, { status: 400 });
  }

  const member = await requireCompanyMember(admin.firestore(), auth.uid, companyId);
  if ("error" in member) {
    return NextResponse.json({ ok: false, error: member.error }, { status: member.status });
  }

  try {
    const result = await notifyMaterialOrderStatusAdmin({
      db: admin.firestore(),
      auth: admin.auth,
      companyId,
      actorUid: auth.uid,
      kind,
      fromStatus: body.fromStatus ?? null,
      toStatus,
      supplierOrderId: body.supplierOrderId ?? null,
      materialOrderId: body.materialOrderId ?? null,
      interventionId: body.interventionId ?? null,
      clientName: body.clientName ?? null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[notifications/order-status-changed]", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Notification impossible." },
      { status: 500 }
    );
  }
}
