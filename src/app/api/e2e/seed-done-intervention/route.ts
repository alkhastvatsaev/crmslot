import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { blockIfProduction } from "@/core/api/routeAuth";
import { isServerDevUiPreview } from "@/features/backoffice/assignInterventionServerAuth";
import { e2eSeedDoneInterventionAdmin } from "@/features/interventions/server/e2eSeedDoneIntervention";

export const runtime = "nodejs";

type Body = { interventionId?: string };

function seedAllowed(): boolean {
  if (blockIfProduction() !== null) return false;
  if (!isServerDevUiPreview()) return false;
  return Boolean(admin.apps.length);
}

export async function POST(request: Request) {
  if (!seedAllowed()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seed E2E indisponible (production, preview désactivé ou Firebase Admin absent).",
      },
      { status: 403 },
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
    const result = await e2eSeedDoneInterventionAdmin(db, {
      interventionId: body.interventionId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[e2e/seed-done-intervention]", e);
    const message = e instanceof Error ? e.message : "Erreur seed E2E";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
