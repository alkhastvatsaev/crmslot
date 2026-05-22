import { NextResponse } from "next/server";
import Stripe from "stripe";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { notifyClientPaymentReceived } from "@/core/services/notifications/clientPaymentPush";
import { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

async function markInterventionPaid(interventionId: string, paymentIntentId?: string) {
  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data() ?? {};
  const paidAt = new Date().toISOString();

  await ref.update({
    paymentStatus: "paid",
    paidAt,
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
  });

  const companyId =
    typeof data.companyId === "string" && data.companyId.length > 0 ? data.companyId : null;

  await ref.collection("timeline_events").add({
    interventionId,
    type: "comment",
    content: "Paiement enregistré",
    visibility: "client",
    createdAt: paidAt,
    createdByUid: "system",
    companyId,
  });

  const createdByUid = typeof data.createdByUid === "string" ? data.createdByUid : null;
  await notifyClientPaymentReceived(interventionId, createdByUid).catch(() => {});

  if (companyId) {
    await logCrmInterventionActionAdmin({
      kind: "intervention_payment_updated",
      iv: {
        id: interventionId,
        title: typeof data.title === "string" ? data.title : "Dossier",
        address: typeof data.address === "string" ? data.address : "",
        status: (data.status as Intervention["status"]) ?? "invoiced",
        companyId,
        clientName: typeof data.clientName === "string" ? data.clientName : undefined,
        clientFirstName: typeof data.clientFirstName === "string" ? data.clientFirstName : null,
        clientLastName: typeof data.clientLastName === "string" ? data.clientLastName : null,
        clientCompanyName:
          typeof data.clientCompanyName === "string" ? data.clientCompanyName : null,
      },
      actorUid: "stripe",
      actorRole: "system",
      note: "Paiement Stripe reçu",
      statusAfter: "invoiced",
    });
  }
}

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook non configuré" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-04-22.dahlia" });
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const interventionId = session.metadata?.interventionId?.trim();
    if (interventionId) {
      await markInterventionPaid(
        interventionId,
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      );
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const interventionId = intent.metadata?.interventionId?.trim();
    if (interventionId) {
      await markInterventionPaid(interventionId, intent.id);
    }
  }

  return NextResponse.json({ received: true });
}
