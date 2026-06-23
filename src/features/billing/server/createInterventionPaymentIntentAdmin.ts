import type * as admin from "firebase-admin";
import Stripe from "stripe";
import { stripeMockPaymentsEnabled } from "@/features/billing/stripeMockMode";
import type { Intervention } from "@/features/interventions";

export type CreateInterventionPaymentIntentResult = {
  clientSecret: string | null;
  paymentStatus: Intervention["paymentStatus"];
  mock?: boolean;
  skipped?: boolean;
};

function canChargeIntervention(iv: Intervention): boolean {
  if (iv.paymentStatus === "paid") return false;
  if (iv.status !== "invoiced" && iv.status !== "done") return false;
  const amountCents =
    typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
      ? Math.round(iv.invoiceAmountCents)
      : 0;
  return amountCents > 0;
}

/**
 * Crée ou réutilise un PaymentIntent Stripe pour Apple Pay / Google Pay (Elements).
 * Idempotent : réutilise `stripePaymentIntentId` tant que le montant et le statut sont valides.
 */
export async function createInterventionPaymentIntentAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  iv?: Intervention;
}): Promise<CreateInterventionPaymentIntentResult> {
  const { db, interventionId, actorUid } = params;

  const snap = params.iv ? null : await db.collection("interventions").doc(interventionId).get();
  if (!params.iv && (!snap || !snap.exists)) {
    throw new Error("Intervention introuvable.");
  }

  const iv = params.iv ?? ({ id: snap!.id, ...snap!.data() } as Intervention);

  if (iv.paymentStatus === "paid") {
    return {
      clientSecret: null,
      paymentStatus: "paid",
      skipped: true,
    };
  }

  if (!canChargeIntervention(iv)) {
    return { clientSecret: null, paymentStatus: iv.paymentStatus ?? "unpaid", skipped: true };
  }

  const amountCents = Math.round(iv.invoiceAmountCents as number);
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const mockMode = !stripeSecret && stripeMockPaymentsEnabled();
  if (!stripeSecret && !mockMode) {
    return { clientSecret: null, paymentStatus: iv.paymentStatus ?? "unpaid", skipped: true };
  }

  if (mockMode) {
    return { clientSecret: null, paymentStatus: iv.paymentStatus ?? "pending", mock: true };
  }

  const stripe = new Stripe(stripeSecret as string, { apiVersion: "2026-04-22.dahlia" });
  const ref = db.collection("interventions").doc(interventionId);

  const existingIntentId = iv.stripePaymentIntentId?.trim();
  if (existingIntentId) {
    const existing = await stripe.paymentIntents.retrieve(existingIntentId);
    if (
      existing.status !== "succeeded" &&
      existing.status !== "canceled" &&
      existing.amount === amountCents &&
      existing.client_secret
    ) {
      return {
        clientSecret: existing.client_secret,
        paymentStatus: iv.paymentStatus ?? "pending",
      };
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: { interventionId, createdByUid: actorUid },
  });

  if (!intent.client_secret) {
    throw new Error("PaymentIntent sans client_secret.");
  }

  await ref.update({
    stripePaymentIntentId: intent.id,
    paymentStatus: "pending",
    invoiceAmountCents: amountCents,
  });

  return {
    clientSecret: intent.client_secret,
    paymentStatus: "pending",
  };
}
