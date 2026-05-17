import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  let body: { interventionId?: string };
  try {
    body = (await request.json()) as { interventionId?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const interventionId = body.interventionId?.trim();
  if (!interventionId) {
    return NextResponse.json({ error: "interventionId requis" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  const data = snap.data() ?? {};
  const createdByUid = typeof data.createdByUid === "string" ? data.createdByUid : "";
  if (createdByUid !== auth.uid) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (data.status !== "invoiced" && data.status !== "done") {
    return NextResponse.json({ error: "Paiement non disponible pour ce statut" }, { status: 400 });
  }

  if (data.paymentStatus === "paid") {
    return NextResponse.json({
      url: data.stripePaymentLinkUrl ?? null,
      paymentStatus: "paid",
    });
  }

  const existingUrl =
    typeof data.stripePaymentLinkUrl === "string" ? data.stripePaymentLinkUrl : "";
  if (existingUrl.length > 0) {
    return NextResponse.json({ url: existingUrl, paymentStatus: data.paymentStatus ?? "unpaid" });
  }

  const amountCents =
    typeof data.invoiceAmountCents === "number" && data.invoiceAmountCents > 0
      ? Math.round(data.invoiceAmountCents)
      : 15_000;

  const origin = process.env.PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ?? "http://localhost:3000";

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-04-22.dahlia" });

  const link = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: `Intervention ${interventionId.slice(0, 8)}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { interventionId, createdByUid: auth.uid },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${origin}/?payment=success&interventionId=${encodeURIComponent(interventionId)}`,
      },
    },
  });

  await ref.update({
    stripePaymentLinkUrl: link.url,
    paymentStatus: "pending",
    invoiceAmountCents: amountCents,
  });

  return NextResponse.json({ url: link.url, paymentStatus: "pending" });
}
