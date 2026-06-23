import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { toPortalSummary } from "@/features/interventions";
import { loadPortalQuotesAdmin } from "@/features/quotes/index.server";
import {
  findInterventionByPortalToken,
  isValidPortalAccessToken,
} from "@/features/interventions/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!isValidPortalAccessToken(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const iv = await findInterventionByPortalToken(db, token);
    if (!iv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let techName: string | null = null;
    if (iv.assignedTechnicianUid) {
      const techSnap = await db.collection("users").doc(iv.assignedTechnicianUid).get();
      if (techSnap.exists) {
        const data = techSnap.data();
        techName = (data?.displayName as string | undefined) ?? null;
      }
    }

    const companyId = String(iv.companyId ?? "").trim();
    const quotes = companyId && iv.id ? await loadPortalQuotesAdmin(db, companyId, iv.id) : [];
    const summary = toPortalSummary(iv, techName, quotes);

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store, no-cache" },
    });
  } catch (err) {
    logger.error("[portal/token] error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
