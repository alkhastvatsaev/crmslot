import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { isValidPortalAccessToken } from "@/features/interventions/server/portalLookupAdmin";
import { respondQuoteViaPortalAdmin } from "@/features/quotes/server/respondQuoteViaPortalAdmin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string; quoteId: string }> }
) {
  const { token, quoteId } = await context.params;
  if (!isValidPortalAccessToken(token)) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  }
  const qid = quoteId?.trim();
  if (!qid) {
    return NextResponse.json({ ok: false, error: "Devis manquant." }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const result = await respondQuoteViaPortalAdmin({
      db,
      portalToken: token,
      quoteId: qid,
      action: "decline",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refus impossible";
    logger.error("[portal/quotes/decline]", {
      error: message,
      quoteId: qid,
    });
    const status = message.includes("introuvable") || message.includes("invalide") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
