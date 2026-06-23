import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { featureFlagsFromEnv } from "@/core/featureFlags";
import { sendInterventionEInvoiceAdmin } from "@/features/billing/index.server";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

/** Émet la facture électronique UBL/Peppol d'une intervention facturée. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!featureFlagsFromEnv().peppolEInvoicing) {
    return NextResponse.json(
      { ok: false, error: "Facturation électronique désactivée (NEXT_PUBLIC_FF_PEPPOL)" },
      { status: 403 }
    );
  }

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

  const db = admin.firestore();
  try {
    const result = await sendInterventionEInvoiceAdmin({
      db,
      interventionId,
      actorUid: auth.uid,
      decoded: auth.decoded,
    });
    return NextResponse.json({
      ok: result.transmission.ok,
      invoiceNumber: result.invoiceNumber,
      transmission: result.transmission,
      ublXml: result.ublXml,
    });
  } catch (e) {
    logger.error("[e-invoice]", { error: e instanceof Error ? e.message : String(e) });
    const message = e instanceof Error ? e.message : "Émission impossible";
    const status = message.includes("Droits") ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
