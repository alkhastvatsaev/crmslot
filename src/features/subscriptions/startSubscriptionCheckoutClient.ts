"use client";

import { auth } from "@/core/config/firebase";
import { provisionSaasCompanyForAdmin } from "@/features/subscriptions/provisionSaasCompanyClient";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

type StartCheckoutOptions = {
  companyId?: string;
  onCompanyProvisioned?: (companyId: string) => void;
};

/** Démarre Stripe Checkout — provisionne la société SaaS si l’API renvoie needsCompany. */
export async function startSubscriptionCheckout(
  planId: SubscriptionPlanId,
  options?: StartCheckoutOptions
): Promise<string> {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Connexion requise.");
  }

  let companyId = options?.companyId?.trim() ?? "";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyId: companyId || undefined, planId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      needsCompany?: boolean;
    };

    if (data.needsCompany && attempt === 0) {
      companyId = await provisionSaasCompanyForAdmin(user, { pendingPlanId: planId });
      options?.onCompanyProvisioned?.(companyId);
      await user.getIdToken(true);
      continue;
    }

    if (!res.ok || !data.url) {
      throw new Error(data.error?.trim() || "Impossible de démarrer le paiement.");
    }

    return data.url;
  }

  throw new Error("Impossible de démarrer le paiement.");
}
