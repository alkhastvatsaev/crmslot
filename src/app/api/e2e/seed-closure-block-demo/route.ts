import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { blockIfProduction } from "@/core/api/routeAuth";
import { e2eSeedClosureBlockDemoAdmin } from "@/features/interventions/server/e2eSeedClosureBlockDemo";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = { technicianUid?: string };

function seedAllowed(): boolean {
  if (blockIfProduction() !== null) return false;
  return Boolean(admin.apps.length);
}

/** Seed dev — 1 mission ouverte + 1 offre `assigned` pour tester le blocage clôture technicien. */
export async function POST(request: Request) {
  if (!seedAllowed()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seed démo indisponible (production ou Firebase Admin absent).",
      },
      { status: 403 }
    );
  }

  let body: Body = {};
  try {
    const raw = await request.text();
    if (raw.trim()) body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  try {
    const db = admin.firestore();
    const result = await e2eSeedClosureBlockDemoAdmin(db, {
      technicianUid: body.technicianUid,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      technicianUrl: "/m/technician",
      hint: "Connectez-vous avec le compte technicien lié à technicianUid, puis rechargez /m/technician.",
    });
  } catch (e) {
    logger.error("[e2e/seed-closure-block-demo]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur seed démo";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
