"use client";

import { auth } from "@/core/config/firebase";
import { clampTechnicianQuantity } from "@/features/subscriptions/subscriptionPlans";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

type StartCheckoutOptions = {
  companyId?: string;
  technicianQuantity?: number;
  billingInterval?: "monthly" | "yearly";
  onCompanyProvisioned?: (companyId: string) => void;
};

/** Démarre Stripe Checkout — une requête API (provision société côté serveur si besoin). */
export async function startSubscriptionCheckout(
  planId: SubscriptionPlanId,
  options?: StartCheckoutOptions
): Promise<string> {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Connexion requise.");
  }

  const technicianQuantity = clampTechnicianQuantity(options?.technicianQuantity ?? 1);
  const companyId = options?.companyId?.trim() ?? "";
  const idToken = await user.getIdToken();

  const res = await fetch("/api/subscriptions/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyId: companyId || undefined,
      planId,
      technicianQuantity,
      billingInterval: options?.billingInterval ?? "monthly",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
    companyId?: string;
  };

  if (data.companyId) {
    options?.onCompanyProvisioned?.(data.companyId);
    void user.getIdToken(true);
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error?.trim() || "Impossible de démarrer le paiement.");
  }

  return data.url;
}
