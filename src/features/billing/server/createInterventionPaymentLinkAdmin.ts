import { randomUUID } from "crypto";
import type * as admin from "firebase-admin";
import Stripe from "stripe";
import { resolvePublicAppBaseUrl } from "@/core/config/publicAppUrl";
import { stripeMockPaymentsEnabled } from "@/features/billing/stripeMockMode";
import type { Intervention } from "@/features/interventions";

export type CreateInterventionPaymentLinkResult = {
  url: string | null;
  paymentStatus: Intervention["paymentStatus"];
  mock?: boolean;
  skipped?: boolean;
};

/**
 * Crée ou retourne un lien de paiement Stripe (ou mock) pour une intervention facturée.
 * Idempotent : réutilise `stripePaymentLinkUrl` existant.
 */
export async function createInterventionPaymentLinkAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  iv?: Intervention;
}): Promise<CreateInterventionPaymentLinkResult> {
  const { db, interventionId, actorUid } = params;

  const snap = params.iv ? null : await db.collection("interventions").doc(interventionId).get();
  if (!params.iv && (!snap || !snap.exists)) {
    throw new Error("Intervention introuvable.");
  }

  const iv = params.iv ?? ({ id: snap!.id, ...snap!.data() } as Intervention);

  if (iv.paymentStatus === "paid") {
    return {
      url: iv.stripePaymentLinkUrl?.trim() || null,
      paymentStatus: "paid",
      skipped: true,
    };
  }

  if (iv.status !== "invoiced" && iv.status !== "done") {
    return { url: null, paymentStatus: iv.paymentStatus ?? "unpaid", skipped: true };
  }

  const existingUrl = iv.stripePaymentLinkUrl?.trim();
  if (existingUrl) {
    return {
      url: existingUrl,
      paymentStatus: iv.paymentStatus ?? "pending",
    };
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const mockMode = !stripeSecret && stripeMockPaymentsEnabled();
  if (!stripeSecret && !mockMode) {
    return { url: null, paymentStatus: iv.paymentStatus ?? "unpaid", skipped: true };
  }

  const amountCents =
    typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
      ? Math.round(iv.invoiceAmountCents)
      : 0;
  if (amountCents <= 0) {
    return { url: null, paymentStatus: iv.paymentStatus ?? "unpaid", skipped: true };
  }

  const ref = db.collection("interventions").doc(interventionId);
  const origin = resolvePublicAppBaseUrl();

  if (mockMode) {
    const mockToken = randomUUID();
    const url = `${origin}/api/stripe/mock-pay?interventionId=${encodeURIComponent(interventionId)}&token=${mockToken}`;
    await ref.update({
      stripePaymentLinkUrl: url,
      mockPayToken: mockToken,
      paymentStatus: "pending",
      invoiceAmountCents: amountCents,
    });
    return { url, paymentStatus: "pending", mock: true };
  }

  const stripe = new Stripe(stripeSecret as string, { apiVersion: "2026-04-22.dahlia" });
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
    metadata: { interventionId, createdByUid: actorUid },
    payment_intent_data: {
      metadata: { interventionId, createdByUid: actorUid },
    },
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

  return { url: link.url, paymentStatus: "pending" };
}
