import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertClientMayAccessIvanaPortalChat } from "@/features/backoffice/server/assertClientMayAccessIvanaPortalChat";
import { notifyStaffPortalChatAdmin } from "@/features/backoffice/server/notifyStaffPortalChatAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
  interventionId?: string | null;
  preview?: string;
  clientLabel?: string | null;
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

  const gate = await assertClientMayAccessIvanaPortalChat(admin.firestore(), auth.uid, companyId);
  if (!gate.allowed) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  try {
    const result = await notifyStaffPortalChatAdmin({
      db: admin.firestore(),
      auth: admin.auth,
      companyId,
      senderUid: auth.uid,
      preview: typeof body.preview === "string" ? body.preview : "",
      interventionId: body.interventionId ?? null,
      clientLabel: body.clientLabel ?? null,
    });
    return NextResponse.json({ ok: true, notified: result.notified });
  } catch (e) {
    logger.error("[portal-chat/notify-staff]", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Notification impossible." },
      { status: 500 }
    );
  }
}
