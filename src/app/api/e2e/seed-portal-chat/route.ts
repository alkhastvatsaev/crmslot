import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { blockIfProduction } from "@/core/api/routeAuth";
import { e2eSeedPortalChatAdmin } from "@/features/backoffice/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

type Body = {
  body?: string;
  reset?: boolean;
};

function seedAllowed(): boolean {
  if (blockIfProduction() !== null) return false;
  if (!admin.apps.length) return false;
  const companyId =
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim() ||
    process.env.E2E_SEED_COMPANY_ID?.trim();
  return Boolean(companyId);
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
    const result = await e2eSeedPortalChatAdmin(db, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    logger.error("[e2e/seed-portal-chat]", {
      error: e instanceof Error ? e.message : String(e),
    });
    const message = e instanceof Error ? e.message : "Erreur seed E2E";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
