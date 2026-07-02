import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import * as admin from "firebase-admin";
import { requirePortalChatApiUser } from "@/core/api/routeAuth";
import { rateLimitByIp } from "@/core/api/rateLimit";
import { createPublicRequesterInterventionAdmin } from "@/features/interventions/server/createPublicRequesterInterventionAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  companyId?: string;
  interventionId?: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, "interventions-public-request", 30, 15 * 60 * 1000);
  if (limited) return limited;

  const auth = await requirePortalChatApiUser(request);
  if ("response" in auth) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const companyId = body.companyId?.trim() ?? "";
  const interventionId = body.interventionId?.trim() ?? "";
  const payload = body.payload;

  if (!companyId || !interventionId || !payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Paramètres manquants." }, { status: 400 });
  }

  try {
    const result = await createPublicRequesterInterventionAdmin({
      db: getAdminDb(),
      auth: admin.auth,
      uid: auth.uid,
      companyId,
      interventionId,
      payload,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, id: result.id, notified: result.notified });
  } catch (error) {
    logger.error("[interventions/public-request]", {
      uid: auth.uid,
      companyId,
      interventionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Échec enregistrement demande." },
      { status: 500 }
    );
  }
}
