"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  markSubscriptionCheckoutCompleted,
  clearSubscriptionCheckoutCompleted,
} from "@/features/subscriptions/pendingSubscriptionPlan";
import { isSubscriptionPlanId } from "@/features/subscriptions/subscriptionPlans";

async function syncCheckoutSession(sessionId: string): Promise<void> {
  const user = auth?.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  await fetch("/api/subscriptions/sync-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });
  await user.getIdToken(true);
}

function SubscriptionCheckoutReturnEffectsInner() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const subscription = searchParams.get("subscription")?.trim();
    if (!subscription) return;

    if (subscription === "success") {
      markSubscriptionCheckoutCompleted();
      const plan = searchParams.get("plan")?.trim();
      const sessionId = searchParams.get("session_id")?.trim();
      const planLabel =
        plan && isSubscriptionPlanId(plan)
          ? t(`subscription.plans.${plan}.name`)
          : t("subscription.account.activate");

      void (async () => {
        if (sessionId) {
          try {
            await syncCheckoutSession(sessionId);
          } catch {
            /* webhook rattrapera */
          }
        }
        toast.success(t("subscription.checkout.success_title"), {
          description: t("subscription.checkout.success_hint").replace("{{plan}}", planLabel),
        });
      })();
    }

    if (subscription === "portal_return") {
      toast.message(t("subscription.checkout.portal_return"));
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("subscription");
    url.searchParams.delete("plan");
    url.searchParams.delete("session_id");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);

    if (subscription === "success") {
      const timer = window.setTimeout(() => clearSubscriptionCheckoutCompleted(), 60_000);
      return () => window.clearTimeout(timer);
    }
  }, [searchParams, t]);

  return null;
}

/** Toasts après retour Stripe Checkout / Billing Portal. */
export default function SubscriptionCheckoutReturnEffects() {
  return (
    <Suspense fallback={null}>
      <SubscriptionCheckoutReturnEffectsInner />
    </Suspense>
  );
}
