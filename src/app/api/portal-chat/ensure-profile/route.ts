import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { assertMayEnsurePortalChatProfile } from "@/features/backoffice/server/assertMayEnsurePortalChatProfile";
import { upsertPortalChatProfileAdmin } from "@/features/backoffice/server/upsertPortalChatProfileAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
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

  const db = admin.firestore();
  const gate = await assertMayEnsurePortalChatProfile(db, auth.uid, companyId);
  if (!gate.allowed) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  try {
    await upsertPortalChatProfileAdmin(db, {
      uid: auth.uid,
      companyId,
      email: typeof auth.decoded.email === "string" ? auth.decoded.email : null,
      displayName:
        typeof auth.decoded.name === "string"
          ? auth.decoded.name
          : typeof auth.decoded.email === "string"
            ? auth.decoded.email.split("@")[0]
            : null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[portal-chat/ensure-profile]", {
      uid: auth.uid,
      companyId,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: false, error: "Échec enregistrement profil." }, { status: 500 });
  }
}
