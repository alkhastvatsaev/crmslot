import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { markInterventionPaidAdmin } from "@/features/billing/index.server";
import { stripeMockPaymentsEnabled } from "@/features/billing/stripeMockMode";

export const runtime = "nodejs";

/**
 * Paiement simulé (sandbox sans compte Stripe).
 * Lien à usage unique généré par create-payment-link en mode mock :
 * vérifie le token stocké sur l'intervention, marque payé, puis redirige.
 */
export async function GET(request: Request) {
  if (!stripeMockPaymentsEnabled()) {
    return NextResponse.json({ error: "Paiement simulé désactivé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const interventionId = url.searchParams.get("interventionId")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (!interventionId || !token) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  if (typeof data.mockPayToken !== "string" || data.mockPayToken !== token) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 403 });
  }

  if (data.paymentStatus !== "paid") {
    await ref.update({ mockPayToken: null });
    await markInterventionPaidAdmin(
      interventionId,
      `pi_mock_${token.slice(0, 8)}`,
      "Paiement simulé (sandbox sans Stripe)"
    );
  }

  const origin = process.env.PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ?? url.origin;
  return NextResponse.redirect(
    `${origin}/?payment=success&interventionId=${encodeURIComponent(interventionId)}`,
    302
  );
}
