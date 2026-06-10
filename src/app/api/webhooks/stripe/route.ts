import { NextResponse } from "next/server";
import Stripe from "stripe";
import "@/core/config/firebase-admin";
import { markInterventionPaidAdmin } from "@/features/billing/server/markInterventionPaidAdmin";

export const runtime = "nodejs";

const markInterventionPaid = markInterventionPaidAdmin;

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
        typeof session.payment_intent === "string" ? session.payment_intent : undefined
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
