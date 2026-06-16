import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { blockIfProduction } from "@/core/api/routeAuth";
import { isE2eSeedAllowed } from "@/features/interventions/server/e2eSeedConfig";
import {
  e2eSeedPortalQuoteAdmin,
  type E2ePortalQuoteScenario,
} from "@/features/interventions/server/e2eSeedPortalQuote";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  scenario?: E2ePortalQuoteScenario;
  portalToken?: string;
};

function seedAllowed(): boolean {
  if (blockIfProduction() !== null) return false;
  if (!isE2eSeedAllowed()) return false;
  return Boolean(admin.apps.length);
}

export async function POST(request: Request) {
  if (!seedAllowed()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seed E2E indisponible (production, preview désactivé ou Firebase Admin absent).",
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
    const result = await e2eSeedPortalQuoteAdmin(db, {
      scenario: body.scenario,
      portalToken: body.portalToken,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[e2e/seed-portal-quote]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur seed E2E";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
