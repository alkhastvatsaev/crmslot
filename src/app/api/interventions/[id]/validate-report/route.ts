import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { validateInterventionReportServer } from "@/features/interventions/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = { sendEmail?: boolean };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId) {
    return NextResponse.json(
      { ok: false, error: "Identifiant intervention manquant." },
      { status: 400 }
    );
  }

  let body: Body = {};
  try {
    const raw = await request.text();
    if (raw.trim()) body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const db = admin.firestore();
  try {
    const result = await validateInterventionReportServer({
      db,
      interventionId,
      actorUid: auth.uid,
      decoded: auth.decoded,
      sendEmail: body.sendEmail,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[validate-report]", { error: e instanceof Error ? e.message : String(e) });
    const message = e instanceof Error ? e.message : "Validation impossible";
    const status = message.includes("Droits") ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
