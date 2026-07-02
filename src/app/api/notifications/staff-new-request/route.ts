import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import * as admin from "firebase-admin";
import { requirePortalChatApiUser } from "@/core/api/routeAuth";
import { rateLimitByIp } from "@/core/api/rateLimit";
import { notifyStaffNewClientRequestAdmin } from "@/features/notifications/server/notifyStaffNewClientRequestAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
  interventionId?: string;
  title?: string;
  address?: string;
};

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, "notifications-staff-new-request", 60, 15 * 60 * 1000);
  if (limited) return limited;

  const authResult = await requirePortalChatApiUser(request);
  if ("response" in authResult) return authResult.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const companyId = body.companyId?.trim() ?? "";
  const interventionId = body.interventionId?.trim() ?? "";
  if (!companyId || !interventionId) {
    return NextResponse.json({ ok: false, error: "Paramètres manquants." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("interventions").doc(interventionId).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Demande introuvable." }, { status: 404 });
    }

    const data = snap.data() ?? {};
    if (String(data.companyId ?? "").trim() !== companyId) {
      return NextResponse.json({ ok: false, error: "Société invalide." }, { status: 403 });
    }
    if (String(data.status ?? "") !== "pending") {
      return NextResponse.json({ ok: false, error: "Statut invalide." }, { status: 409 });
    }

    const title =
      body.title?.trim() ||
      (typeof data.title === "string" ? data.title.trim() : "") ||
      (typeof data.problem === "string" ? data.problem.trim() : "");
    const address =
      body.address?.trim() || (typeof data.address === "string" ? data.address.trim() : "");

    const result = await notifyStaffNewClientRequestAdmin({
      db,
      auth: admin.auth,
      companyId,
      senderUid: authResult.uid,
      interventionId,
      title,
      address,
    });

    return NextResponse.json({ ok: true, notified: result.notified });
  } catch (error) {
    logger.error("[notifications/staff-new-request]", {
      uid: authResult.uid,
      companyId,
      interventionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: "Échec envoi notification." }, { status: 500 });
  }
}
